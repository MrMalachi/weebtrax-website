import os

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from backend.routers import mixes, scenes


app = FastAPI(title="WeebTrax API")

# In production only the real site should be able to call the API. Railway sets
# ALLOWED_ORIGINS; local dev falls back to the ports serve.py and uvicorn use.
_default_origins = "http://localhost:3000,http://127.0.0.1:3000"
allowed_origins = [
    origin.strip()
    for origin in os.getenv("ALLOWED_ORIGINS", _default_origins).split(",")
    if origin.strip()
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    # PATCH is needed for /api/mixes/{id}/views — a GET-only list silently blocked it.
    allow_methods=["GET", "PATCH"],
    allow_headers=["*"],
)

app.include_router(mixes.router, prefix="/api")
app.include_router(scenes.router, prefix="/api")


@app.get("/health", tags=["Health"])
def health():
    """Cheap liveness check for Railway."""
    return {"status": "ok"}
