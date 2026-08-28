import json
import pathlib

from fastapi import APIRouter, status, Query
from pydantic import BaseModel
from sqlmodel import Field, Session, SQLModel, create_engine

from backend.models.enums import Mood


router = APIRouter()

DATA = json.loads(pathlib.Path("backend/data/mixes.json").read_text())

class TrackEntry(BaseModel):
    timeSecs: int
    artist: str
    title: str


class Mix(SQLModel, table=True):
    id: int | None = Field(default=None, primary_key=True)
    title: str
    slug: str
    duration: str
    releaseDate: str
    mood: Mood
    views: int | None = None
    audioPath: str
    youtubeUrl: str
    soundcloudUrl: str | None = None
    tracklist: list[TrackEntry]

@router.get(
    "/mixes",
    summary="Get a list of all mixes.",
    status_code=status.HTTP_200_OK,
    response_description="A list of Mix objects",
    response_model=list[Mix],
    tags=["Mixes"],
)
def get_mixes():
    """Retrieve a list of all available mixes."""
    return DATA

@router.get(
    "/mixes/latest",
    summary="Get a list of most recent mixes.",
    status_code=status.HTTP_200_OK,
    response_description="A list of Mix objects.",
    response_model=list[Mix],
    tags=["Mixes"],
)
def get_latest(limit: int = Query(default=5, ge=1)):
    """Retrieve the specified number of most recent Mix objects."""
    sorted_mixes = sorted(
        DATA,
        key=lambda mix: mix["releaseDate"],
        reverse=True
    )

    return sorted_mixes[:limit]