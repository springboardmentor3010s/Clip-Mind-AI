import json

from fastapi import APIRouter
from fastapi import Depends

from sqlalchemy.orm import Session

from app.database.postgres import get_db

from app.models.transcript import Transcript


router = APIRouter(

    prefix="/transcript",

    tags=["Transcript"]

)


@router.get("/{video_id}")

def get_transcript(

    video_id:int,

    db:Session=Depends(get_db)

):

    transcript=(

        db.query(Transcript)

        .filter(

            Transcript.video_id==video_id

        )

        .first()

    )

    if transcript is None:

        return{

            "message":"Transcript not found"

        }

    return{

        "text":transcript.transcript_text,

        "segments":json.loads(

            transcript.transcript_json

        )

    }