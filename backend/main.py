from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from backend.routers import mixes, scenes


app = FastAPI(title="WeebTrax API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["GET"],
    allow_headers=["*"],
)

app.include_router(mixes.router, prefix="/api")
app.include_router(scenes.router, prefix="/api")