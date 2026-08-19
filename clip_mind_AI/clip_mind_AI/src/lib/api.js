/**
 * Axios API client for ClipMind AI.
 *
 * - Base URL points to the Django backend.
 * - Request interceptor attaches the JWT access token from localStorage.
 * - Response interceptor handles 401 errors by attempting a silent token
 *   refresh using the stored refresh token (Memurai-backed SimpleJWT).
 */
import axios from "axios";

// Configurable at build time so the same image can target any environment.
// Falls back to the local backend for `npm run dev` with no .env present.
export const API_ROOT = import.meta.env.VITE_API_URL || "http://localhost:8000";
const BASE_URL = `${API_ROOT.replace(/\/$/, "")}/api/v1`;

const api = axios.create({
  baseURL: BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// ── Request interceptor: attach access token (excluding public auth endpoints) ──
api.interceptors.request.use((config) => {
  const isAuthUrl = config.url && (
    config.url.includes("/auth/login") ||
    config.url.includes("/auth/register") ||
    config.url.includes("/auth/refresh") ||
    config.url.includes("/auth/forgot-password") ||
    config.url.includes("/auth/reset-password")
  );

  if (!isAuthUrl) {
    const token = localStorage.getItem("access_token");
    if (token) {
      config.headers = config.headers || {};
      if (config.headers.set) {
        config.headers.set("Authorization", `Bearer ${token}`);
      } else {
        config.headers["Authorization"] = `Bearer ${token}`;
      }
    }
  }
  return config;
});

// ── Response interceptor: silent token refresh on 401 ────────────────────
let isRefreshing = false;
let failedQueue = [];

function processQueue(error, token = null) {
  failedQueue.forEach((p) => (error ? p.reject(error) : p.resolve(token)));
  failedQueue = [];
}

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config;

    const isAuthUrl = original.url && (
      original.url.includes("/auth/login") ||
      original.url.includes("/auth/register") ||
      original.url.includes("/auth/refresh") ||
      original.url.includes("/auth/forgot-password") ||
      original.url.includes("/auth/reset-password")
    );

    if (error.response?.status === 401 && !isAuthUrl && !original._retry) {
      if (isRefreshing) {
        // Queue this request until the refresh finishes
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        }).then((token) => {
          if (original.headers && original.headers.set) {
            original.headers.set("Authorization", `Bearer ${token}`);
          } else {
            original.headers = original.headers || {};
            original.headers["Authorization"] = `Bearer ${token}`;
          }
          return api(original);
        });
      }

      original._retry = true;
      isRefreshing = true;

      const refreshToken = localStorage.getItem("refresh_token");

      if (!refreshToken) {
        isRefreshing = false;
        clearAuthAndRedirect();
        return Promise.reject(error);
      }

      try {
        const res = await axios.post(`${BASE_URL}/auth/refresh`, {
          refresh: refreshToken,
        });

        const { access, refresh } = res.data.data;
        localStorage.setItem("access_token", access);
        if (refresh) localStorage.setItem("refresh_token", refresh);

        if (api.defaults.headers.common.set) {
          api.defaults.headers.common.set("Authorization", `Bearer ${access}`);
        } else {
          api.defaults.headers.common["Authorization"] = `Bearer ${access}`;
        }
        processQueue(null, access);

        if (original.headers && original.headers.set) {
          original.headers.set("Authorization", `Bearer ${access}`);
        } else {
          original.headers = original.headers || {};
          original.headers["Authorization"] = `Bearer ${access}`;
        }
        return api(original);
      } catch (refreshError) {
        processQueue(refreshError, null);
        clearAuthAndRedirect();
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

function clearAuthAndRedirect() {
  localStorage.removeItem("access_token");
  localStorage.removeItem("refresh_token");
  const PUBLIC_PATHS = ["/", "/login", "/register", "/forgot-password", "/reset-password"];
  if (!PUBLIC_PATHS.includes(window.location.pathname)) {
    window.location.href = "/login";
  }
}

export default api;
