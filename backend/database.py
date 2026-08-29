"""Shared database engine and session dependency for all routers."""

import os

from sqlmodel import Session, SQLModel, create_engine


DATABASE_URL = os.environ.get(
    "DATABASE_URL", "postgresql+psycopg://localhost:5432/weebtrax"
)


def _normalise(url: str) -> str:
    """Force the psycopg (v3) driver onto a bare Postgres URL.

    Railway hands out DATABASE_URL as "postgresql://..." (and some providers
    still use the legacy "postgres://"). SQLAlchemy maps both to psycopg2,
    which isn't installed -- only psycopg 3 is -- so the app would die on
    boot with ModuleNotFoundError. Rewrite the scheme unless one is set.
    """
    for prefix in ("postgresql://", "postgres://"):
        if url.startswith(prefix):
            return "postgresql+psycopg://" + url[len(prefix):]
    return url


DATABASE_URL = _normalise(DATABASE_URL)

# pool_pre_ping avoids handing out connections Railway's proxy already dropped.
engine = create_engine(DATABASE_URL, pool_pre_ping=True)


def get_db():
    with Session(engine) as session:
        yield session


def create_db_and_tables():
    SQLModel.metadata.create_all(engine)
