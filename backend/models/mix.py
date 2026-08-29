from datetime import date

from sqlmodel import Field, Relationship, SQLModel

from backend.models.enums import Mood
from backend.models.track import Track, TrackPublic


class MixBase(SQLModel):
    title: str
    slug: str = Field(index=True)
    duration: str
    release_date: date
    mood: Mood = Field(index=True)
    views: int = 0
    audio_path: str
    youtube_url: str
    soundcloud_url: str | None = None


class Mix(MixBase, table=True):
    id: int | None = Field(default=None, primary_key=True)
    tracks: list["Track"] = Relationship(
        back_populates="mix",
        sa_relationship_kwargs={"order_by": "Track.time_secs"},
    )


class MixPublic(MixBase):
    id: int


class MixWithTracks(MixPublic):
    tracks: list[TrackPublic] = []
