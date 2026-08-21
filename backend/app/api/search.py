from fastapi import APIRouter
from fastapi import Depends
from sqlalchemy.orm import Session

from app.database.database import get_db
from app.services.search_service import search_videos

router = APIRouter(
    prefix="/search",
    tags=["Search"]
)


@router.get("")
def search(

    q: str = "",

    status: str = "",

    date: str = "",

    db: Session = Depends(get_db)

):

    results = search_videos(

        db=db,

        query=q,

        status=status,

        date=date

    )

    return results