from enum import Enum
from fastapi import APIRouter, HTTPException, Query, status
from pydantic import BaseModel
import json
import pathlib

router = APIRouter()

DATA = json.loads(pathlib.Path("backend/data/scenes.json").read_text())


class Mood(str, Enum):
    chill = "chill"
    nostalgic = "nostalgic"
    dirty = "dirty"
    deep = "deep"


class Scene(BaseModel):
    id: str
    name: str
    slug: str
    type: str
    description: str
    episodeNumber: int
    mood: Mood
    videoPath: str
    thumbnailPath: str


class ScenePage(BaseModel):
    total: int
    page: int
    limit: int
    results: list[Scene]


@router.get(
    "/scenes",
    summary="Get scenes with pagination and optional filters.",
    status_code=status.HTTP_200_OK,
    response_description="A paginated response containing Scene objects and "
                         "pagination metadata.",
    response_model=ScenePage,
    tags=["Scenes"],
)
def get_scenes(
        page: int = Query(default=1, ge=1),
        limit: int = Query(default=4, ge=1, le=50),
        episode: int = Query(default=None, ge=1),
        mood: Mood | None = Query(default=None)
):
    """Retrieve paginated Scene objects with pagination metadata."""

    results = DATA

    if episode is not None:
        results = [s for s in results if s["episodeNumber"] == episode]

    if mood is not None:
        results = [s for s in results if s["mood"] == mood]

    total = len(results)
    start = (page - 1) * limit
    end = start + limit

    return {
        "total": total,
        "page": page,
        "limit": limit,
        "results": results[start:end]
    }