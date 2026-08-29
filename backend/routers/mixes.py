from datetime import date
import json
import pathlib

from fastapi import APIRouter, HTTPException, status, Query
from sqlmodel import Field, Relationship, Session, SQLModel, create_engine, select

from backend.models.enums import Mood


router = APIRouter()

DATA = json.loads(pathlib.Path("backend/data/mixes.json").read_text())

class Track(SQLModel, table=True):
    id: int | None = Field(default=None, primary_key=True)
    mix_id: int = Field(foreign_key="mix.id")
    timeSecs: int
    artist: str
    title: str
    mix: "Mix" = Relationship(back_populates="tracks")


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
    tracks: list["Track"] = Relationship(back_populates="mix")


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
            tracks = entry_copy.pop("tracklist", [])

            mix = Mix(**entry_copy)

            session.add(mix)
            session.commit()
            session.refresh(mix)

            for track_entry in tracks:
                track = Track(mix_id=mix.id, **track_entry)

                session.add(track)

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

@router.get(
    "/mixes/{mix_id}",
    summary="Get a single mix with its tracklist.",
    status_code=status.HTTP_200_OK,
    response_model=Mix,
    tags=["Mixes"],
)
def get_mix(mix_id: int):
    """Retrieve a single Mix object and its tracks."""
    with Session(engine) as session:
        mix = session.get(Mix, mix_id)

        if mix is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Mix not found."
            )

        return mix

if __name__ == "__main__":
    main()