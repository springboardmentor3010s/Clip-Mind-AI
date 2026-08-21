import os

from fastapi import APIRouter, UploadFile, File, Depends, HTTPException

from database import SessionLocal
from models import Video, User
from rbac import get_current_user


router = APIRouter()

UPLOAD_FOLDER = "uploads"
os.makedirs(UPLOAD_FOLDER, exist_ok=True)


ALLOWED_ROLES = {
    "creator",
    "content_creator",
    "educator",
    "admin"
}


@router.post("/upload")
async def upload_video(
    file: UploadFile = File(...),
    current_user=Depends(get_current_user)
):
    email = current_user.get("email")

    if not email:
        raise HTTPException(
            status_code=401,
            detail="User email missing from token."
        )

    # ==========================================
    # GET CURRENT ROLE FROM DATABASE
    # ==========================================

    db = SessionLocal()

    try:
        user = (
            db.query(User)
            .filter(User.email == email)
            .first()
        )

        if not user:
            raise HTTPException(
                status_code=401,
                detail="User account not found."
            )

        db_role = str(
            user.role or ""
        ).strip().lower()

        print("========== UPLOAD AUTH DEBUG ==========")
        print("EMAIL:", email)
        print("TOKEN ROLE:", current_user.get("role"))
        print("DATABASE ROLE:", db_role)
        print("ALLOWED:", ALLOWED_ROLES)
        print("========================================")

        if db_role not in ALLOWED_ROLES:
            raise HTTPException(
                status_code=403,
                detail=(
                    f"Role '{db_role}' does not have permission "
                    "to upload videos."
                )
            )

        # ==========================================
        # SAVE VIDEO
        # ==========================================

        file_path = os.path.join(
            UPLOAD_FOLDER,
            file.filename
        )

        with open(file_path, "wb") as buffer:
            buffer.write(await file.read())

        # ==========================================
        # SAVE DATABASE RECORD
        # ==========================================

        new_video = Video(
            filename=file.filename,
            filepath=file_path,
            uploaded_by=email
        )

        db.add(new_video)
        db.commit()
        db.refresh(new_video)

        return {
            "message": "Video uploaded successfully",
            "video_id": new_video.id,
            "filename": new_video.filename,
            "path": new_video.filepath,
            "uploaded_by": email,
            "role": db_role
        }

    finally:
        db.close()