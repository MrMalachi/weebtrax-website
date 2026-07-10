from fastapi import APIRouter, Query
import json
import pathlib


router = APIRouter()

DATA = json.loads(pathlib.Path("backend/data/scenes.json").read_text())

@router.get("/scenes")
def get_scenes(
        page: int = Query(1),
        limit: int = Query(6),
        episode: int = Query(None),
        mood: str = Query(None)
):

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