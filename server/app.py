"""CREE FastAPI application entrypoint and router wiring."""

from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from server.routers.core import router as core_router
from server.routers.incidents import router as incidents_router
from server.routers.projects import router as projects_router

_OPENAPI_CACHE: dict | None = None


def _build_lightweight_openapi() -> dict:
    """Build a minimal OpenAPI schema quickly for validator compatibility."""
    global _OPENAPI_CACHE
    if _OPENAPI_CACHE is not None:
        return _OPENAPI_CACHE

    paths: dict = {}
    for route in app.routes:
        methods = getattr(route, "methods", None)
        path = getattr(route, "path", None)

        # Skip websocket routes and non-http routes.
        if not methods or not path:
            continue

        http_methods = [m.lower() for m in methods if m not in {"HEAD", "OPTIONS"}]
        if not http_methods:
            continue

        path_item = paths.setdefault(path, {})
        for method in http_methods:
            path_item[method] = {
                "summary": f"{method.upper()} {path}",
                "responses": {"200": {"description": "OK"}},
            }

    _OPENAPI_CACHE = {
        "openapi": "3.1.0",
        "info": {
            "title": app.title,
            "version": app.version,
            "description": app.description,
        },
        "paths": paths,
    }
    return _OPENAPI_CACHE


@asynccontextmanager
async def lifespan(_: FastAPI):
    _build_lightweight_openapi()
    yield


app = FastAPI(
    title="CREE — Causal Reverse Engineering Engine",
    description=(
        "OpenEnv-compliant SRE incident-response environment. "
        "Agent manages a production system with hidden internal state. "
        "Supports multi-project sessions with real-time WebSocket updates."
    ),
    version="2.0.0",
    openapi_url=None,
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://127.0.0.1:3000",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(core_router)
app.include_router(projects_router)
app.include_router(incidents_router)


@app.get("/openapi.json", include_in_schema=False)
def lightweight_openapi():
    return JSONResponse(_build_lightweight_openapi())


# Backwards compatibility helper used by legacy local smoke tests.
def health() -> dict:
    return {"status": "healthy", "version": app.version}


def main():
    import uvicorn
    uvicorn.run("server.app:app", host="0.0.0.0", port=8000)


if __name__ == "__main__":
    main()