from fastapi import APIRouter, HTTPException, status, Query
import json
import pathlib


router = APIRouter()

DATA = json.loads(pathlib.Path("backend/data/mixes.json").read_text())

@router.get("/mixes")
def get_mixes():
    return DATA

@router.get("/mixes/latest")
def get_latest(n: int = Query(default=5)):
    if n < 1:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_CONTENT,
            detail="The value 'n' must be greater than 0."
        )

    sorted_mixes = sorted(
        DATA,
        key=lambda mix: mix["releaseDate"],
        reverse=True
    )

    return sorted_mixes[:n]

