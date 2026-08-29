from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlmodel import Session, select

from backend.database import get_db
from backend.models.mix import Mix, MixPublic, MixWithTracks


router = APIRouter()


@router.get(
    "/mixes",
    summary="Get a list of all mixes.",
    status_code=status.HTTP_200_OK,
    response_description="A list of Mix objects.",
    response_model=list[MixPublic],
    tags=["Mixes"],
)
def get_mixes(session: Session = Depends(get_db)):
    """Retrieve a list of all available mixes."""
    mixes = session.exec(select(Mix)).all()

    return mixes


@router.get(
    "/mixes/latest",
    summary="Get a list of the most recent mixes.",
    status_code=status.HTTP_200_OK,
    response_description="A list of Mix objects.",
    response_model=list[MixPublic],
    tags=["Mixes"],
)
def get_latest(
    limit: int = Query(default=5, ge=1, le=20),
    session: Session = Depends(get_db),
):
    """Retrieve the specified number of most recent Mix objects."""
    mixes = session.exec(
        select(Mix)
        .order_by(Mix.release_date.desc())
        .limit(limit)
    ).all()

    return mixes


@router.get(
    "/mixes/popular",
    summary="Get a list of the most popular mixes.",
    status_code=status.HTTP_200_OK,
    response_description="A list of Mix objects.",
    response_model=list[MixPublic],
    tags=["Mixes"],
)
def get_popular(
    limit: int = Query(default=5, ge=1, le=20),
    session: Session = Depends(get_db),
):
    """Retrieve the most viewed Mix objects."""
    mixes = session.exec(
        select(Mix)
        .order_by(Mix.views.desc())
        .limit(limit)
    ).all()

    return mixes


@router.get(
    "/mixes/slug/{slug}",
    summary="Get a mix by its slug.",
    status_code=status.HTTP_200_OK,
    response_model=MixWithTracks,
    tags=["Mixes"],
)
def get_mix_by_slug(slug: str, session: Session = Depends(get_db)):
    """Retrieve a Mix object and its tracks by slug."""
    mix = session.exec(select(Mix).where(Mix.slug == slug)).first()

    if mix is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Mix not found."
        )

    return mix


@router.get(
    "/mixes/{mix_id}",
    summary="Get a single mix with its tracklist.",
    status_code=status.HTTP_200_OK,
    response_model=MixWithTracks,
    tags=["Mixes"],
)
def get_mix(mix_id: int, session: Session = Depends(get_db)):
    """Retrieve a single Mix object and its tracks."""
    mix = session.get(Mix, mix_id)

    if mix is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Mix not found."
        )

    return mix


@router.patch(
    "/mixes/{mix_id}/views",
    summary="Update a mix's view count.",
    status_code=status.HTTP_200_OK,
    response_description="The updated Mix object.",
    response_model=MixPublic,
    tags=["Mixes"],
)
def update_mix_views(
    mix_id: int,
    views: int = Query(ge=0),
    session: Session = Depends(get_db)
):
    """Update the view count for a Mix object."""
    mix = session.get(Mix, mix_id)

    if mix is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Mix not found."
        )

    mix.views = views

    session.add(mix)
    session.commit()
    session.refresh(mix)

    return mix
