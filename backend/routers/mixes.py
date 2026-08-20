from fastapi import APIRouter, HTTPException, status, Query
from pydantic import BaseModel
import json
import pathlib


router = APIRouter()

DATA = json.loads(pathlib.Path("backend/data/mixes.json").read_text())

class TrackEntry(BaseModel):
    timeSecs: int
    artist: str
    title: str


class Mix(BaseModel):
    id: str
    title: str
    slug: str
    duration: str
    releaseDate: str
    mood: str
    views: int | None = None
    audioPath: str
    youtubeUrl: str
    soundcloudUrl: str | None = None
    tracklist: list[TrackEntry]

@router.get("/mixes", response_model=list[Mix])
def get_mixes():
    return DATA

@router.get("/mixes/latest", response_model=list[Mix])
def get_latest(n: int = Query(default=5)):
    if n < 1:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_CONTENT,
            detail="The value 'n' must be greater than 0."
        )

    sorted_mixes = sorted(
        DATA,
        key=lambda mix: mix["releaseDate"],
        reverse=True
    )

    return sorted_mixes[:n]