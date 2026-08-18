import express from "express";
import path from "path";
import { spawn, ChildProcess } from "child_process";
import { createProxyMiddleware } from "http-proxy-middleware";
import { createServer as createViteServer } from "vite";

const PORT = Number(process.env.PORT || 3000);
const FASTAPI_PORT = Number(process.env.FASTAPI_PORT || 8001);

let pythonProcess: ChildProcess | null = null;

/* =========================================================
   START FASTAPI BACKEND
   ========================================================= */

function startFastAPIBackend() {
  console.log(
    `[ClipMind AI] Spawning Python FastAPI server on port ${FASTAPI_PORT}...`
  );

  pythonProcess = spawn("python3", ["-m", "backend.run"], {
    cwd: process.cwd(),
    env: {
      ...process.env,
      FASTAPI_PORT: String(FASTAPI_PORT),
    },
    stdio: "inherit",
  });

  pythonProcess.on("error", (err) => {
    console.error(
      "[ClipMind AI] Python process failed to start:",
      err
    );
  });

  pythonProcess.on("exit", (code, signal) => {
    console.log(
      `[ClipMind AI] Python process exited with code ${code}, signal ${signal}`
    );
  });
}

/* =========================================================
   START FULL STACK SERVER
   ========================================================= */

async function startServer() {
  // Start FastAPI
  startFastAPIBackend();

  const app = express();

  /* =======================================================
     HEALTH CHECK
     ======================================================= */

  app.get("/api/health", (_req, res) => {
    res.json({
      status: "ok",
      service: "ClipMind AI Full-Stack Server",
    });
  });

  /* =======================================================
     FASTAPI PROXY OPTIONS
     ======================================================= */

  const proxyOptions = {
    changeOrigin: true,
    ws: false,

    // Large timeout for video processing/upload
    proxyTimeout: 600000,
    timeout: 600000,

    onProxyReq: (
      proxyReq: any,
      _req: any,
      _res: any
    ) => {
      // Remove websocket upgrade headers
      if (proxyReq.getHeader("upgrade")) {
        proxyReq.removeHeader("upgrade");
      }

      const connectionHeader =
        proxyReq.getHeader("connection");

      if (
        connectionHeader &&
        String(connectionHeader)
          .toLowerCase()
          .includes("upgrade")
      ) {
        proxyReq.setHeader("connection", "keep-alive");
      }
    },

    on: {
      proxyReq: (
        proxyReq: any,
        _req: any,
        _res: any
      ) => {
        if (proxyReq.getHeader("upgrade")) {
          proxyReq.removeHeader("upgrade");
        }

        const connectionHeader =
          proxyReq.getHeader("connection");

        if (
          connectionHeader &&
          String(connectionHeader)
            .toLowerCase()
            .includes("upgrade")
        ) {
          proxyReq.setHeader(
            "connection",
            "keep-alive"
          );
        }
      },

      error: (
        err: any,
        _req: any,
        res: any
      ) => {
        console.error(
          "[ClipMind Proxy Error]:",
          err.message
        );

        if (
          res &&
          typeof res.status === "function" &&
          !res.headersSent
        ) {
          res
            .status(502)
            .json({
              detail:
                "Backend service unavailable or upload request timed out.",
            });
        }
      },
    },
  };

  /* =======================================================
     LOG UPLOAD REQUESTS
     ======================================================= */

  app.use(
    "/videos/upload",
    (req, res, next) => {
      console.log(
        "[SERVER UPLOAD LOG]:",
        {
          "incoming upload request":
            `${req.method} ${req.originalUrl}`,

          "request content type":
            req.headers["content-type"],

          "request content length":
            req.headers["content-length"] ||
            "unknown",
        }
      );

      next();
    }
  );

  /* =======================================================
     LOG LOGIN REQUESTS
     ======================================================= */

  app.use(
    "/auth/login",
    (req, res, next) => {
      console.log(
        "[SERVER AUTH LOG]:",
        {
          "incoming login request":
            `${req.method} ${req.originalUrl}`,

          "content type":
            req.headers["content-type"],
        }
      );

      next();
    }
  );

  /* =======================================================
     FASTAPI API PROXIES
     ======================================================= */

  // Authentication
  app.use(
    "/auth",
    createProxyMiddleware({
      target:
        `http://127.0.0.1:${FASTAPI_PORT}/auth`,
      ...proxyOptions,
    })
  );

  // Videos
  app.use(
    "/videos",
    createProxyMiddleware({
      target:
        `http://127.0.0.1:${FASTAPI_PORT}/videos`,
      ...proxyOptions,
    })
  );

  /*
   * IMPORTANT:
   *
   * /analytics is also a React frontend route.
   *
   * Therefore:
   *   http://localhost:3000/analytics
   *
   * must be allowed to reach React/Vite.
   *
   * But API calls to /analytics contain an Authorization
   * header, so we proxy ONLY authenticated requests.
   *
   * Browser navigation without Authorization:
   *     /analytics
   *         ↓
   *     Vite / React
   *
   * API request with Authorization:
   *     /analytics
   *         ↓
   *     FastAPI
   */

  const analyticsProxy =
    createProxyMiddleware({
      target:
        `http://127.0.0.1:${FASTAPI_PORT}/analytics`,
      ...proxyOptions,
    });

  app.use(
    "/analytics",
    (req, res, next) => {
      const authorization =
        req.headers.authorization;

      // No JWT = this is probably the React route.
      // Let Vite handle /analytics.
      if (!authorization) {
        return next();
      }

      // JWT exists = API request.
      return analyticsProxy(req, res, next);
    }
  );

  // Users
  app.use(
    "/users",
    createProxyMiddleware({
      target:
        `http://127.0.0.1:${FASTAPI_PORT}/users`,
      ...proxyOptions,
    })
  );

  // Bookmarks
  app.use(
    "/bookmarks",
    createProxyMiddleware({
      target:
        `http://127.0.0.1:${FASTAPI_PORT}/bookmarks`,
      ...proxyOptions,
    })
  );

  /* =======================================================
     EXPRESS JSON
     ======================================================= */

  app.use(express.json());

  /* =======================================================
     STATIC UPLOADS
     ======================================================= */

  app.use(
    "/uploads",
    express.static(
      path.join(process.cwd(), "uploads")
    )
  );

  /* =======================================================
     VITE DEVELOPMENT SERVER
     ======================================================= */

  if (process.env.NODE_ENV !== "production") {
    const vite =
      await createViteServer({
        server: {
          middlewareMode: true,
        },

        appType: "spa",
      });

    /*
     * Vite must come AFTER the API proxy.
     *
     * This allows:
     *
     * /auth       → FastAPI
     * /videos     → FastAPI
     * /analytics  → FastAPI only when authenticated
     * /users      → FastAPI
     * /bookmarks  → FastAPI
     *
     * and:
     *
     * /analytics  → React when opened in browser
     */

    app.use(vite.middlewares);
  } else {
    /* =====================================================
       PRODUCTION STATIC BUILD
       ===================================================== */

    const distPath =
      path.join(process.cwd(), "dist");

    app.use(
      express.static(distPath)
    );

    app.get("*", (_req, res) => {
      res.sendFile(
        path.join(
          distPath,
          "index.html"
        )
      );
    });
  }

  /* =======================================================
     START EXPRESS SERVER
     ======================================================= */

  app.listen(
    PORT,
    "0.0.0.0",
    () => {
      console.log(
        `[ClipMind AI] Full-Stack application running on http://localhost:${PORT}`
      );

      console.log(
        `[ClipMind AI] FastAPI backend: http://localhost:${FASTAPI_PORT}`
      );

      console.log(
        `[ClipMind AI] API docs: http://localhost:${FASTAPI_PORT}/docs`
      );
    }
  );
}

/* =========================================================
   GRACEFUL SHUTDOWN
   ========================================================= */

process.on("SIGINT", () => {
  console.log(
    "\n[ClipMind AI] Shutting down..."
  );

  if (pythonProcess) {
    pythonProcess.kill("SIGINT");
  }

  process.exit(0);
});

process.on("SIGTERM", () => {
  console.log(
    "\n[ClipMind AI] Terminating..."
  );

  if (pythonProcess) {
    pythonProcess.kill("SIGTERM");
  }

  process.exit(0);
});

/* =========================================================
   RUN
   ========================================================= */

startServer().catch((error) => {
  console.error(
    "[ClipMind AI] Failed to start server:",
    error
  );

  if (pythonProcess) {
    pythonProcess.kill("SIGTERM");
  }

  process.exit(1);
});