import os
import uvicorn


if __name__ == "__main__":
    port = int(
        os.getenv("FASTAPI_PORT", "8001")
    )

    print(
        f"Starting ClipMind AI FastAPI backend "
        f"on 0.0.0.0:{port}..."
    )

    uvicorn.run(
        "backend.app.main:app",
        host="0.0.0.0",
        port=port,
        reload=False,
    )