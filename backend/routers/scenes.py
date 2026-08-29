from fastapi import APIRouter, Depends, HTTPException, Query, status
from pydantic import BaseModel
from sqlmodel import Session, select

from backend.database import get_db
from backend.models.enums import Mood
from backend.models.scene import Scene, ScenePublic


router = APIRouter()


class ScenePage(BaseModel):
    total: int
    page: int
    limit: int
    results: list[ScenePublic]


@router.get(
    "/scenes",
    summary="Get scenes with pagination and optional filters.",
    status_code=status.HTTP_200_OK,
    response_description=(
        "A paginated response containing Scene objects "
        "and pagination metadata."
    ),
    response_model=ScenePage,
    tags=["Scenes"],
)
def get_scenes(
    page: int = Query(default=1, ge=1, le=1000),
    limit: int = Query(default=4, ge=1, le=50),
    episode: int | None = Query(default=None, ge=1, le=13),
    mood: Mood | None = Query(default=None),
    tag: str | None = Query(default=None),
    session: Session = Depends(get_db),
):
    """Retrieve paginated Scene objects with pagination metadata."""

    statement = select(Scene).order_by(Scene.episode_number, Scene.id)

    if episode is not None:
        statement = statement.where(Scene.episode_number == episode)

    if mood is not None:
        statement = statement.where(Scene.mood == mood)

    if tag is not None:
        statement = statement.where(Scene.type == tag)

    total = len(session.exec(statement).all())

    results = session.exec(
        statement.offset((page - 1) * limit).limit(limit)
    ).all()

    return {
        "total": total,
        "page": page,
        "limit": limit,
        "results": results,
    }


@router.get(
    "/scenes/{scene_id}",
    summary="Get a single scene.",
    status_code=status.HTTP_200_OK,
    response_description="A Scene object.",
    response_model=ScenePublic,
    tags=["Scenes"],
)
def get_scene(scene_id: int, session: Session = Depends(get_db)):
    """Retrieve a single Scene object."""
    scene = session.get(Scene, scene_id)

    if scene is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Scene not found.",
        )

    return scene
