from sqlmodel import Field, SQLModel

from backend.models.enums import Mood


class SceneBase(SQLModel):
    name: str
    slug: str = Field(index=True)
    type: str
    description: str
    episode_number: int = Field(index=True)
    mood: Mood = Field(index=True)
    video_path: str
    thumbnail_path: str


class Scene(SceneBase, table=True):
    id: int | None = Field(default=None, primary_key=True)


class ScenePublic(SceneBase):
    id: int
