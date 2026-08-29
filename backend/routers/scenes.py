import json
import pathlib

from fastapi import APIRouter, HTTPException, Query, status
from pydantic import BaseModel
from sqlmodel import Field, Session, SQLModel, create_engine, select

from backend.models.enums import Mood


router = APIRouter()

DATA = json.loads(pathlib.Path("backend/data/scenes.json").read_text())


class Scene(SQLModel, table=True):
    id: int | None = Field(default=None, primary_key=True)
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


sqlite_url = "sqlite:///backend/data/scenes.db"
connect_args = {"check_same_thread": False}
engine = create_engine(sqlite_url, connect_args=connect_args)


def create_tables_and_database():
    SQLModel.metadata.create_all(engine)

def add_sample_scenes():
    with Session(engine) as session:
        scenes = []

        for entry in DATA:
            scene = Scene(**entry)

            session.add(scene)

            scenes.append(scene)

        session.commit()

        for scene in scenes:
            session.refresh(scene)

def main():
    create_tables_and_database()
    add_sample_scenes()


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

    with Session(engine) as session:
        statement = select(Scene)

        if episode is not None:
            statement = statement.where(Scene.episodeNumber == episode)

        if mood is not None:
            statement = statement.where(Scene.mood == mood)

        total = len(session.exec(statement).all())

        statement = statement.offset((page - 1) * limit).limit(limit)

        results = session.exec(statement).all()

        return {
            "total": total,
            "page": page,
            "limit": limit,
            "results": results
        }

@router.get("/scenes/{scene_id}", response_model=Scene)
def get_scene(scene_id: int):
    with Session(engine) as session:
        scene = session.get(Scene, scene_id)

        if scene is None:
            raise HTTPException(
                status_code=404,
                detail="Scene not found."
            )

        return scene

if __name__ == "__main__":
    main()