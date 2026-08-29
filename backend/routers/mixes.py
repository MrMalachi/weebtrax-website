from datetime import date
import json
import pathlib

from fastapi import APIRouter, status, Query
from pydantic import BaseModel
from sqlmodel import Field, Session, SQLModel, create_engine, select

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
    releaseDate: date
    mood: Mood
    views: int | None = None
    audioPath: str
    youtubeUrl: str
    soundcloudUrl: str | None = None
    # tracklist: list[TrackEntry] - moved out, needs its own Track table + Relationship


sqlite_url = "sqlite:///backend/data/mixes.db"
connect_args = {"check_same_thread": False}
engine = create_engine(sqlite_url, connect_args=connect_args)


def create_tables_and_database():
    SQLModel.metadata.create_all(engine)

def add_sample_mixes():
    with Session(engine) as session:
        mixes = []

        for entry in DATA:
            entry_copy = entry.copy()
            entry_copy.pop("tracklist", None)

            mix = Mix(**entry_copy)

            session.add(mix)

            mixes.append(mix)

        session.commit()

        for mix in mixes:
            session.refresh(mix)

def main():
    create_tables_and_database()
    add_sample_mixes()



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
    with Session(engine) as session:
        mixes = session.exec(select(Mix)).all()

        return mixes


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
    with Session(engine) as session:
        mixes = session.exec(
            select(Mix)
            .order_by(Mix.releaseDate.desc())
            .limit(limit)
        ).all()

        return mixes

if __name__ == "__main__":
    main()