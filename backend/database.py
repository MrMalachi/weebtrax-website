"""Shared database engine and session dependency for all routers."""

from sqlmodel import Session, SQLModel, create_engine


sqlite_url = "sqlite:///backend/data/weebtrax.db"
connect_args = {"check_same_thread": False}
engine = create_engine(sqlite_url, connect_args=connect_args)


def get_db():
    with Session(engine) as session:
        yield session


def create_db_and_tables():
    SQLModel.metadata.create_all(engine)
