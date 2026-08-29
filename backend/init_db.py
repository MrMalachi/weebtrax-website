"""Create all tables and seed sample data in the shared database.

Imports every model module first so all tables (Mix, Track, Scene) are
registered on SQLModel.metadata before create_all runs -- calling
create_db_and_tables() before that would only create whichever tables
happened to be imported already.
"""

from backend.database import create_db_and_tables
from backend.models import mix, scene, track  # noqa: F401
from backend import seed


def main():
    create_db_and_tables()
    seed.add_sample_mixes()
    seed.add_sample_scenes()


if __name__ == "__main__":
    main()
