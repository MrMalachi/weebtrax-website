from fastapi import APIRouter, Query
import json
import pathlib


router = APIRouter()

DATA = json.loads(pathlib.Path("backend/data/mixes.json").read_text())

@router.get("/mixes")
def get_mixes():
    return DATA

@router.get("/mixes/latest")
def get_latest(n: int = Query(5)):
    sorted_mixes = sorted(DATA, key=lambda m: m["releaseDate"], reverse=True)
    return sorted_mixes[:n]

