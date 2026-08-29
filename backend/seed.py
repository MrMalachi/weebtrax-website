"""Seed the database from the static mixes.json / scenes.json fixtures.

Both JSON files still use the frontend's camelCase field names (releaseDate,
audioPath, episodeNumber, ...) -- this is the one place that translates them
into the models' snake_case columns.
"""

import json
from datetime import date
from pathlib import Path

from sqlmodel import Session

from backend.database import create_db_and_tables, engine
from backend.models.mix import Mix
from backend.models.scene import Scene
from backend.models.track import Track


MIX_DATA = json.loads(Path("backend/data/mixes.json").read_text())
SCENE_DATA = json.loads(Path("backend/data/scenes.json").read_text())


def _mix_fields(entry: dict) -> dict:
    return {
        "title": entry["title"],
        "slug": entry["slug"],
        "duration": entry["duration"],
        "release_date": date.fromisoformat(entry["releaseDate"]),
        "mood": entry["mood"],
        "views": entry["views"] or 0,
        "audio_path": entry["audioPath"],
        "youtube_url": entry["youtubeUrl"],
        "soundcloud_url": entry["soundcloudUrl"],
    }


def _track_fields(entry: dict) -> dict:
    return {
        "time_secs": entry["timeSecs"],
        "artist": entry["artist"],
        "title": entry["title"],
    }


def _scene_fields(entry: dict) -> dict:
    return {
        "name": entry["name"],
        "slug": entry["slug"],
        "type": entry["type"],
        "description": entry["description"],
        "episode_number": entry["episodeNumber"],
        "mood": entry["mood"],
        "video_path": entry["videoPath"],
        "thumbnail_path": entry["thumbnailPath"],
    }


def add_sample_mixes():
    with Session(engine) as session:
        for entry in MIX_DATA:
            tracks = entry.get("tracklist", [])

            mix = Mix(**_mix_fields(entry))

            session.add(mix)
            session.commit()
            session.refresh(mix)

            for track_entry in tracks:
                track = Track(mix_id=mix.id, **_track_fields(track_entry))
                session.add(track)

        session.commit()


def add_sample_scenes():
    with Session(engine) as session:
        for entry in SCENE_DATA:
            session.add(Scene(**_scene_fields(entry)))

        session.commit()


def main():
    create_db_and_tables()
    add_sample_mixes()
    add_sample_scenes()


if __name__ == "__main__":
    main()
