import json
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.sql import func
from app.services.ai_service import generate_learning_material
from pydantic import BaseModel
from sqlalchemy.orm import Session
from app.database.postgres import get_db
from app.models.video import Video
from app.models.transcript import Transcript
from app.models.shared_lecture import SharedLecture
from app.models.course import Course
from app.schemas.course import CourseCreate
from app.schemas.course import CourseUpdate
from app.services.analytics_service import get_dashboard_analytics
from fastapi.responses import StreamingResponse
import csv
import io
from app.services.report_service import (
    generate_lecture_report,
    generate_course_report,
    generate_analytics_report
)

router = APIRouter(
    prefix="/educator",
    tags=["Educator"]
)


class TranscriptUpdate(BaseModel):
    transcript: str


class SummaryUpdate(BaseModel):
    summary: str

class TranscriptUpdateRequest(BaseModel):
    transcript: str


class SummaryUpdateRequest(BaseModel):
    summary: str   


@router.get("/transcript/{video_id}")
def get_transcript(
    video_id: int,
    db: Session = Depends(get_db)
):

    transcript = (
        db.query(Transcript)
        .filter(Transcript.video_id == video_id)
        .first()
    )

    if not transcript:
        return {
            "transcript": ""
        }

    return {
        "transcript": transcript.transcript_text
    }


@router.put("/transcript/{video_id}")
def update_transcript(
    video_id: int,
    request: TranscriptUpdateRequest,
    db: Session = Depends(get_db)
):

    transcript = (
        db.query(Transcript)
        .filter(Transcript.video_id == video_id)
        .first()
    )

    if not transcript:
        return {
            "message": "Transcript not found"
        }

    transcript.transcript_text = request.transcript

    db.commit()

    return {
        "message": "Transcript updated successfully"
    }
    
@router.post("/course")
def create_course(
    course: CourseCreate,
    educator_id: int,
    db: Session = Depends(get_db)
):

    new_course = Course(
        title=course.title,
        description=course.description,
        category=course.category,
        difficulty=course.difficulty,
        thumbnail=course.thumbnail,
        educator_id=educator_id
    )

    db.add(new_course)
    db.commit()
    db.refresh(new_course)

    return new_course

@router.get("/analytics")
def educator_analytics(
    educator_id: int,
    db: Session = Depends(get_db)
):

    total_courses = (
        db.query(Course)
        .filter(Course.educator_id == educator_id)
        .count()
    )

    published_courses = (
        db.query(Course)
        .filter(
            Course.educator_id == educator_id,
            Course.is_published == True
        )
        .count()
    )

    draft_courses = total_courses - published_courses

    course_ids = [
        course.id
        for course in
        db.query(Course)
        .filter(Course.educator_id == educator_id)
        .all()
    ]

    total_lectures = (
        db.query(Video)
        .filter(Video.course_id.in_(course_ids))
        .count()
    )

    completed = (
        db.query(Video)
        .filter(
            Video.course_id.in_(course_ids),
            Video.status == "Completed"
        )
        .count()
    )

    processing = (
        db.query(Video)
        .filter(
            Video.course_id.in_(course_ids),
            Video.status == "Processing"
        )
        .count()
    )

    failed = (
        db.query(Video)
        .filter(
            Video.course_id.in_(course_ids),
            Video.status == "Failed"
        )
        .count()
    )

    shared = (
        db.query(SharedLecture)
        .join(
            Video,
            SharedLecture.video_id == Video.id
        )
        .filter(
            Video.course_id.in_(course_ids)
        )
        .count()
    )

    return {
        "total_courses": total_courses,
        "published_courses": published_courses,
        "draft_courses": draft_courses,
        "total_lectures": total_lectures,
        "completed": completed,
        "processing": processing,
        "failed": failed,
        "shared": shared
    }
    
@router.get("/dashboard-analytics")
def dashboard_analytics(
    educator_id: int,
    db: Session = Depends(get_db)
):

    return get_dashboard_analytics(
        db,
        educator_id
    )
    
@router.get("/student-engagement")
def student_engagement(
    educator_id: int,
    db: Session = Depends(get_db)
):

    courses = (
        db.query(Course)
        .filter(
            Course.educator_id == educator_id
        )
        .all()
    )

    course_ids = [
        c.id
        for c in courses
    ]

    total_courses = len(courses)

    total_lectures = (
        db.query(Video)
        .filter(
            Video.course_id.in_(course_ids)
        )
        .count()
    )

    shared_lectures = (
        db.query(SharedLecture)
        .join(
            Video,
            SharedLecture.video_id == Video.id
        )
        .filter(
            Video.course_id.in_(course_ids)
        )
        .count()
    )

    popular_courses = []

    for course in courses:

        lecture_count = (
            db.query(Video)
            .filter(
                Video.course_id == course.id
            )
            .count()
        )

        popular_courses.append({
            "id": course.id,
            "title": course.title,
            "lectures": lecture_count
        })

    recent_shared = (
        db.query(SharedLecture)
        .order_by(
            SharedLecture.id.desc()
        )
        .limit(5)
        .all()
    )

    shared = []

    for item in recent_shared:

        video = (
            db.query(Video)
            .filter(
                Video.id == item.video_id
            )
            .first()
        )

        if video:

            shared.append({
                "lecture": video.title,
                "status": video.status
            })

    return {
        "total_courses": total_courses,
        "total_lectures": total_lectures,
        "shared_lectures": shared_lectures,
        "popular_courses": popular_courses,
        "recent_shared": shared
    }

@router.get("/courses")
def get_courses(
    educator_id: int,
    db: Session = Depends(get_db)
):

    courses = (
        db.query(Course)
        .filter(
            Course.educator_id == educator_id
        )
        .order_by(Course.created_at.desc())
        .all()
    )

    result = []

    for course in courses:

        lecture_count = (
            db.query(Video)
            .filter(
                Video.course_id == course.id
            )
            .count()
        )

        completed = (
            db.query(Video)
            .filter(
                Video.course_id == course.id,
                Video.status == "Completed"
            )
            .count()
        )

        processing = (
            db.query(Video)
            .filter(
                Video.course_id == course.id,
                Video.status == "Processing"
            )
            .count()
        )

        failed = (
            db.query(Video)
            .filter(
                Video.course_id == course.id,
                Video.status == "Failed"
            )
            .count()
        )

        result.append({
            "id": course.id,
            "title": course.title,
            "description": course.description,
            "category": course.category,
            "difficulty": course.difficulty,
            "thumbnail": course.thumbnail,
            "lecture_count": lecture_count,
            "completed": completed,
            "processing": processing,
            "failed": failed,
            "is_published": course.is_published,
            "published_at": course.published_at
        })

    return result

@router.get("/course/{course_id}/lectures")
def get_course_lectures(
    course_id: int,
    db: Session = Depends(get_db)
):

    lectures = (
        db.query(Video)
        .filter(
            Video.course_id == course_id
        )
        .all()
    )

    return lectures

@router.put("/course/{course_id}")
def update_course(
    course_id: int,
    updated: CourseUpdate,
    db: Session = Depends(get_db)
):

    course = db.query(Course).filter(
        Course.id == course_id
    ).first()

    if not course:
        return {"message": "Course not found"}

    for key, value in updated.model_dump(exclude_unset=True).items():
        setattr(course, key, value)

    db.commit()
    db.refresh(course)

    return course


@router.delete("/course/{course_id}")
def delete_course(
    course_id: int,
    db: Session = Depends(get_db)
):

    course = db.query(Course).filter(
        Course.id == course_id
    ).first()

    if not course:
        return {"message": "Course not found"}

    db.delete(course)
    db.commit()

    return {
        "message": "Course deleted"
    }

@router.post("/share/{video_id}")
def share_lecture(
    video_id: int,
    educator_id: int,
    db: Session = Depends(get_db)
):

    lecture = SharedLecture(
        video_id=video_id,
        educator_id=educator_id
    )

    db.add(lecture)
    db.commit()

    return {
        "message": "Lecture Shared Successfully"
    }

@router.get("/shared")
def get_shared_lectures(
    db: Session = Depends(get_db)
):

    lectures = (
        db.query(Video)
        .join(
            SharedLecture,
            Video.id == SharedLecture.video_id
        )
        .all()
    )

    return lectures

@router.get("/materials/{video_id}")
def get_learning_materials(
    video_id: int,
    db: Session = Depends(get_db)
):

    transcript = (
        db.query(Transcript)
        .filter(
            Transcript.video_id == video_id
        )
        .first()
    )

    ai = generate_learning_material(
        transcript.transcript_text
    )

    return ai

@router.get("/summary/{video_id}")
def get_summary(
    video_id: int,
    db: Session = Depends(get_db)
):

    video = (
        db.query(Video)
        .filter(Video.id == video_id)
        .first()
    )

    if not video:
        return {
            "summary": ""
        }

    return {
        "summary": video.summary
    }

@router.put("/summary/{video_id}")
def update_summary(
    video_id: int,
    request: SummaryUpdateRequest,
    db: Session = Depends(get_db)
):

    video = (
        db.query(Video)
        .filter(Video.id == video_id)
        .first()
    )

    if not video:
        return {
            "message": "Video not found"
        }

    video.summary = request.summary
    db.commit()

    return {
        "message": "Summary updated successfully"
    }
    
@router.get("/course/{course_id}")
def get_course(
    course_id: int,
    db: Session = Depends(get_db)
):

    course = (
        db.query(Course)
        .filter(
            Course.id == course_id
        )
        .first()
    )

    if not course:
        return {
            "message": "Course not found"
        }

    lecture_count = (
        db.query(Video)
        .filter(
            Video.course_id == course.id
        )
        .count()
    )

    return {
        "id": course.id,
        "title": course.title,
        "description": course.description,
        "category": course.category,
        "difficulty": course.difficulty,
        "thumbnail": course.thumbnail,
        "lecture_count": lecture_count,
        "is_published": course.is_published,
        "published_at": course.published_at
    }
    
@router.get("/course/{course_id}/stats")
def get_course_stats(
    course_id: int,
    db: Session = Depends(get_db)
):

    lectures = (
        db.query(Video)
        .filter(
            Video.course_id == course_id
        )
        .all()
    )

    total = len(lectures)

    processed = len(
        [
            lecture
            for lecture in lectures
            if lecture.status == "Completed"
        ]
    )

    processing = len(
        [
            lecture
            for lecture in lectures
            if lecture.status == "Processing"
        ]
    )

    failed = len(
        [
            lecture
            for lecture in lectures
            if lecture.status == "Failed"
        ]
    )

    shared = (
        db.query(SharedLecture)
        .join(
            Video,
            SharedLecture.video_id == Video.id
        )
        .filter(
            Video.course_id == course_id
        )
        .count()
    )

    return {
        "total": total,
        "processed": processed,
        "processing": processing,
        "failed": failed,
        "shared": shared
    }

@router.get("/lecture/{video_id}")
def get_lecture(
    video_id: int,
    db: Session = Depends(get_db)
):
    lecture = (
        db.query(Video)
        .filter(Video.id == video_id)
        .first()
    )

    if lecture is None:
        return {
            "message": "Lecture not found"
        }

    transcript = (
        db.query(Transcript)
        .filter(Transcript.video_id == video_id)
        .first()
    )

    segments = []

    if transcript and transcript.transcript_json:

        try:
            segments = json.loads(transcript.transcript_json)

        except Exception as e:
            print("JSON Parse Error:", e)
            segments = []

    return {
        "id": lecture.id,
        "title": lecture.title,
        "description": lecture.description,
        "filename": lecture.filename,
        "summary": lecture.summary,
        "topics": lecture.topics,
        "quiz": lecture.quiz,
        "flashcards": lecture.flashcards,
        "key_moments": lecture.key_moments,
        "status": lecture.status,
        "transcript": (
            transcript.transcript_text
            if transcript
            else ""
        ),
        "segments": segments
    }

@router.get("/summaries")
def get_all_summaries(
    user_id: int,
    db: Session = Depends(get_db)
):

    videos = (
        db.query(Video)
        .filter(Video.user_id == user_id)
        .order_by(Video.uploaded_at.desc())
        .all()
    )

    return [
        {
            "video_id": video.id,
            "title": video.title,
            "course_id": video.course_id,
            "updated_at": video.uploaded_at,
            "has_summary": video.summary is not None
        }
        for video in videos
    ]

@router.post("/course/{course_id}/publish")
def publish_course(
    course_id: int,
    db: Session = Depends(get_db)
):
    course = (
        db.query(Course)
        .filter(Course.id == course_id)
        .first()
    )

    if not course:
        raise HTTPException(
            status_code=404,
            detail="Course not found"
        )

    course.is_published = True
    course.published_at = func.now()

    db.commit()

    return {
        "message": "Course published successfully"
    }

@router.get("/transcripts")
def get_all_transcripts(
    user_id: int,
    db: Session = Depends(get_db)
):

    videos = (
        db.query(Video)
        .filter(Video.user_id == user_id)
        .order_by(Video.uploaded_at.desc())
        .all()
    )

    data = []

    for video in videos:

        transcript = (
            db.query(Transcript)
            .filter(Transcript.video_id == video.id)
            .first()
        )

        data.append({
            "video_id": video.id,
            "title": video.title,
            "course_id": video.course_id,
            "updated_at": video.uploaded_at,
            "has_transcript": transcript is not None
        })

    return data

@router.post("/course/{course_id}/unpublish")
def unpublish_course(
    course_id: int,
    db: Session = Depends(get_db)
):
    course = (
        db.query(Course)
        .filter(Course.id == course_id)
        .first()
    )

    if not course:
        raise HTTPException(
            status_code=404,
            detail="Course not found"
        )

    course.is_published = False
    course.published_at = None

    db.commit()

    return {
        "message": "Course unpublished successfully"
    }
    
@router.get("/lecture-report/{video_id}")
def download_lecture_report(
    video_id: int,
    db: Session = Depends(get_db)
):

    pdf = generate_lecture_report(
        db,
        video_id
    )

    if pdf is None:
        return {
            "message": "Lecture not found"
        }

    return StreamingResponse(
        pdf,
        media_type="application/pdf",
        headers={
            "Content-Disposition":
            f"attachment; filename=Lecture_{video_id}.pdf"
        }
    )
    
@router.get("/analytics-report")
def download_analytics_report(
    educator_id: int,
    db: Session = Depends(get_db)
):

    pdf = generate_analytics_report(
        db,
        educator_id
    )

    if pdf is None:
        return {
            "message": "No analytics data available"
        }

    return StreamingResponse(
        pdf,
        media_type="application/pdf",
        headers={
            "Content-Disposition":
            "attachment; filename=Analytics_Report.pdf"
        }
    )

@router.get("/course-report/{course_id}")
def download_course_report(
    course_id: int,
    db: Session = Depends(get_db)
):

    pdf = generate_course_report(
        db,
        course_id
    )

    if pdf is None:
        return {
            "message": "Course not found"
        }

    return StreamingResponse(
        pdf,
        media_type="application/pdf",
        headers={
            "Content-Disposition":
            f"attachment; filename=Course_{course_id}.pdf"
        }
    )

@router.post("/lecture/{video_id}/view")
def increment_view(
    video_id: int,
    db: Session = Depends(get_db)
):
    video = (
        db.query(Video)
        .filter(Video.id == video_id)
        .first()
    )

    if not video:
        raise HTTPException(
            status_code=404,
            detail="Lecture not found"
        )

    video.views = (video.views or 0) + 1

    db.commit()

    return {
        "views": video.views
    }