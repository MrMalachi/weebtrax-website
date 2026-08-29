from typing import TYPE_CHECKING

from sqlmodel import Field, Relationship, SQLModel


if TYPE_CHECKING:
    from backend.models.mix import Mix


class TrackBase(SQLModel):
    time_secs: int
    artist: str
    title: str


class Track(TrackBase, table=True):
    id: int | None = Field(default=None, primary_key=True)
    mix_id: int = Field(foreign_key="mix.id")
    mix: "Mix" = Relationship(back_populates="tracks")


class TrackPublic(TrackBase):
    id: int
