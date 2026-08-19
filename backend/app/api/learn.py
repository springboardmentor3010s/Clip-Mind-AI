from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.core.dependencies import get_db, require_content_manager
from app.core.cache import cache_delete
from app.models.user import User
from app.models.transcript import Transcript
from app.models.study_material import StudyMaterial
from app.schemas.study_material import StudyMaterialsResponse, StudyMaterialsUpdate
from app.services.quiz import generate_study_materials

router = APIRouter(prefix="/learn", tags=["learn"])


def _generate_or_404(video_id: int, db: Session) -> dict:
    transcript = db.query(Transcript).filter(Transcript.video_id == video_id).first()
    if not transcript or not transcript.segments:
        raise HTTPException(status_code=404, detail="No transcript available yet for this video.")

    keywords = transcript.keywords or []
    if not keywords:
        raise HTTPException(
            status_code=400,
            detail="Keywords haven't been extracted yet — generate key moments first.",
        )
    return generate_study_materials(transcript.segments, keywords)


@router.get("/{video_id}/study-materials", response_model=StudyMaterialsResponse)
def get_study_materials(video_id: int, db: Session = Depends(get_db)):
    """Auto-generated flashcards, fill-in-the-blank, and multiple-choice
    questions derived from the video's transcript. Returns the
    Educator-curated version if one has been saved, otherwise a fresh draft."""
    saved = db.query(StudyMaterial).filter(StudyMaterial.video_id == video_id).first()
    if saved:
        return {
            "flashcards": saved.flashcards or [],
            "fill_in_blanks": saved.fill_in_blanks or [],
            "mcqs": saved.mcqs or [],
            "is_saved": True,
        }

    result = _generate_or_404(video_id, db)
    return {**result, "is_saved": False}


@router.post("/{video_id}/study-materials/generate", response_model=StudyMaterialsResponse)
def regenerate_study_materials(
    video_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_content_manager),
):
    """Regenerates a fresh draft from the current transcript, overwriting any
    previously saved/edited version."""
    result = _generate_or_404(video_id, db)

    record = db.query(StudyMaterial).filter(StudyMaterial.video_id == video_id).first()
    if not record:
        record = StudyMaterial(video_id=video_id, created_by=current_user.id)
        db.add(record)

    record.flashcards = result["flashcards"]
    record.fill_in_blanks = result["fill_in_blanks"]
    record.mcqs = result["mcqs"]
    record.created_by = current_user.id
    db.commit()
    cache_delete(f"study_materials:{video_id}")

    return {**result, "is_saved": True}


@router.put("/{video_id}/study-materials", response_model=StudyMaterialsResponse)
def update_study_materials(
    video_id: int,
    req: StudyMaterialsUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_content_manager),
):
    """Lets a Creator/Educator/Administrator curate the study materials —
    edit flashcard wording, fix a bad fill-in-the-blank, remove a weak MCQ —
    before students see them."""
    record = db.query(StudyMaterial).filter(StudyMaterial.video_id == video_id).first()
    if not record:
        record = StudyMaterial(video_id=video_id, created_by=current_user.id)
        db.add(record)

    record.flashcards = req.flashcards
    record.fill_in_blanks = req.fill_in_blanks
    record.mcqs = req.mcqs
    record.created_by = current_user.id
    db.commit()
    cache_delete(f"study_materials:{video_id}")

    return {
        "flashcards": record.flashcards,
        "fill_in_blanks": record.fill_in_blanks,
        "mcqs": record.mcqs,
        "is_saved": True,
    }
