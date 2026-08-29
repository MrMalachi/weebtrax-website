"""Shared database engine and session dependency for all routers."""

import os

from sqlmodel import Session, SQLModel, create_engine


DATABASE_URL = os.environ.get(
    "DATABASE_URL", "postgresql+psycopg://localhost:5432/weebtrax"
)
engine = create_engine(DATABASE_URL)


def get_db():
    with Session(engine) as session:
        yield session


def create_db_and_tables():
    SQLModel.metadata.create_all(engine)
