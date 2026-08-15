from enum import Enum
from fastapi import APIRouter, HTTPException, Query, status
import json
import pathlib


class Mood(str, Enum):
    chill = "chill"
    nostalgic = "nostalgic"
    dirty = "dirty"
    deep = "deep"


router = APIRouter()

DATA = json.loads(pathlib.Path("backend/data/scenes.json").read_text())

@router.get("/scenes")
def get_scenes(

        page: int = Query(default=1),
        limit: int = Query(default=6),
        episode: int = Query(None),
        mood: Mood | None = Query(None)
):

    results = DATA

    if page < 1:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_CONTENT,
            detail="Page number must be greater than 0.",
        )

    if limit < 1:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_CONTENT,
            detail="Limit number must be greater than 0."
        )

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