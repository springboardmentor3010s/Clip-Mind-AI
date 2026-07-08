# backend/app/routers/video.py
from fastapi import APIRouter, UploadFile, File, HTTPException, status, Depends, BackgroundTasks
from sqlalchemy.orm import Session
import shutil
import os

from app.core.database import get_db
from app.models.video import VideoMetadata
from app.core.processing import process_video_pipeline  

# Named exactly 'router' in lowercase to resolve your main.py AttributeError! 🌟
router = APIRouter(
    prefix="/video",
    tags=["Video Processing Pipeline"]
)

UPLOAD_DIR = os.path.join(os.getcwd(), "storage", "raw_videos")
os.makedirs(UPLOAD_DIR, exist_ok=True)

@router.post("/upload")
async def upload_video(
    background_tasks: BackgroundTasks,                  
    file: UploadFile = File(...), 
    db: Session = Depends(get_db)
):
    """
    Accepts raw video assets, validates formats, streams chunks to disk,
    and spins up an isolated background thread to process FFmpeg extraction tasks.
    """
    # 1. Enforce strict media extension validation constraints
    allowed_extensions = [".mp4", ".mkv", ".mov", ".avi", ".wav"]
    file_ext = os.path.splitext(file.filename)[1].lower()
    
    if file_ext not in allowed_extensions:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Unsupported file type. Allowed extensions: {', '.join(allowed_extensions)}"
        )
    
    # 2. Establish complete destination write paths
    file_path = os.path.join(UPLOAD_DIR, file.filename)
    
    try:
        # 3. Stream data allocations block by block to preserve server memory bounds
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
            
        # 4. Initialize metadata instance entity record and commit to PostgreSQL
        db_video = VideoMetadata(filename=file.filename, saved_path=file_path)
        db.add(db_video)
        db.commit()
        db.refresh(db_video)
        
        # 5. Hand processing to a background thread so the user gets an instant success message 🌟
        background_tasks.add_task(process_video_pipeline, file_path, file.filename)
            
        return {
            "status": "success",
            "id": db_video.id,
            "filename": db_video.filename,
            "message": "Video uploaded successfully! Processing pipeline has been scheduled in the background."
        }
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"An error occurred writing files to disc or database: {str(e)}"
        )