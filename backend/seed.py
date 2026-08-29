"""Seed the database from the static mixes.json / scenes.json fixtures.

Both JSON files still use the frontend's camelCase field names (releaseDate,
audioPath, episodeNumber, ...) -- this is the one place that translates them
into the models' snake_case columns.

Seeding only runs against empty tables. Without that guard, running this
twice against the same database inserts a second copy of everything, which
shows up as a silently doubled archive rather than an error. Use
reset_data() to deliberately wipe and start over.
"""

import json
from datetime import date
from pathlib import Path

from sqlalchemy import text
from sqlmodel import Session, select

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


def _has_rows(session: Session, model) -> bool:
    """Return True if the model's table already holds at least one row."""
    return session.exec(select(model).limit(1)).first() is not None


def reset_data():
    """Delete every seeded row and restart the id counters at 1.

    The id counters matter: the frontend turns a mix's id into its display
    code (id 1 -> "mix-001"), so a re-seed that left the counters where they
    were would shift every code on the site.
    """
    with Session(engine) as session:
        session.execute(
            text("TRUNCATE track, mix, scene RESTART IDENTITY CASCADE")
        )
        session.commit()

    print("Cleared all mixes, tracks and scenes.")


def add_sample_mixes():
    with Session(engine) as session:
        if _has_rows(session, Mix):
            print("Mixes already seeded -- skipping.")
            return

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

    print(f"Seeded {len(MIX_DATA)} mixes.")


def add_sample_scenes():
    with Session(engine) as session:
        if _has_rows(session, Scene):
            print("Scenes already seeded -- skipping.")
            return

        for entry in SCENE_DATA:
            session.add(Scene(**_scene_fields(entry)))

        session.commit()

    print(f"Seeded {len(SCENE_DATA)} scenes.")


def main():
    create_db_and_tables()
    add_sample_mixes()
    add_sample_scenes()


if __name__ == "__main__":
    main()
