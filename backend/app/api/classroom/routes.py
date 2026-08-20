import random
import string
import os
import uuid
from fastapi import (
    APIRouter,
    Depends,
    HTTPException,
    UploadFile,
    File,
    Form,
)

from sqlalchemy.orm import Session

from app.database.postgres import get_db

from app.models.classroom import Classroom
from app.models.classroom_member import ClassroomMember
from app.models.classroom_post import ClassroomPost
from app.models.video import Video

from app.schemas.classroom import (
    ClassroomCreate,
    ClassroomJoin,
    ClassroomPostCreate,
)


router = APIRouter(
    prefix="/classroom",
    tags=["Classroom"]
)


def generate_join_code(db: Session):

    while True:

        code = "".join(
            random.choices(
                string.ascii_uppercase
                + string.digits,
                k=6
            )
        )

        existing = (
            db.query(Classroom)
            .filter(
                Classroom.join_code == code
            )
            .first()
        )

        if not existing:
            return code


# =====================================================
# CREATE CLASSROOM
# =====================================================

@router.post("/")
def create_classroom(
    data: ClassroomCreate,
    educator_id: int,
    db: Session = Depends(get_db)
):

    classroom = Classroom(

        name=data.name,

        description=data.description,

        join_code=generate_join_code(db),

        educator_id=educator_id

    )

    db.add(classroom)

    db.commit()

    db.refresh(classroom)

    return {

        "message": "Classroom created successfully",

        "classroom": {

            "id": classroom.id,

            "name": classroom.name,

            "description": classroom.description,

            "join_code": classroom.join_code,

            "educator_id": classroom.educator_id,

            "student_count": 0

        }

    }


# =====================================================
# GET EDUCATOR CLASSROOMS
# =====================================================

@router.get("/educator")
def get_educator_classrooms(
    educator_id: int,
    db: Session = Depends(get_db)
):

    classrooms = (
        db.query(Classroom)
        .filter(
            Classroom.educator_id == educator_id
        )
        .order_by(
            Classroom.created_at.desc()
        )
        .all()
    )

    result = []

    for classroom in classrooms:

        student_count = (
            db.query(ClassroomMember)
            .filter(
                ClassroomMember.classroom_id
                == classroom.id
            )
            .count()
        )

        result.append({

            "id": classroom.id,

            "name": classroom.name,

            "description":
                classroom.description,

            "join_code":
                classroom.join_code,

            "educator_id":
                classroom.educator_id,

            "student_count":
                student_count

        })

    return result

@router.get("/learner")
def get_learner_classrooms(
    learner_id: int,
    db: Session = Depends(get_db)
):

    memberships = (
        db.query(ClassroomMember)
        .filter(
            ClassroomMember.learner_id
            == learner_id
        )
        .order_by(
            ClassroomMember.joined_at.desc()
        )
        .all()
    )

    result = []

    for membership in memberships:

        classroom = (
            db.query(Classroom)
            .filter(
                Classroom.id
                == membership.classroom_id
            )
            .first()
        )

        if classroom:

            result.append({

                "id": classroom.id,

                "name": classroom.name,

                "description":
                    classroom.description,

                "educator_id":
                    classroom.educator_id

            })

    return result
# =====================================================
# GET CLASSROOM DETAILS
# =====================================================

@router.get("/{classroom_id}")
def get_classroom(
    classroom_id: int,
    db: Session = Depends(get_db)
):

    classroom = (
        db.query(Classroom)
        .filter(
            Classroom.id == classroom_id
        )
        .first()
    )

    if not classroom:

        raise HTTPException(
            status_code=404,
            detail="Classroom not found"
        )

    posts = (
        db.query(ClassroomPost)
        .filter(
            ClassroomPost.classroom_id
            == classroom_id
        )
        .order_by(
            ClassroomPost.created_at.desc()
        )
        .all()
    )

    student_count = (
        db.query(ClassroomMember)
        .filter(
            ClassroomMember.classroom_id
            == classroom_id
        )
        .count()
    )

    return {

        "id": classroom.id,

        "name": classroom.name,

        "description":
            classroom.description,

        "join_code":
            classroom.join_code,

        "educator_id":
            classroom.educator_id,

        "student_count":
            student_count,

        "posts": [

            {

                "id": post.id,

                "title": post.title,

                "content": post.content,

                "post_type":
                    post.post_type,

                "video_id":
                    post.video_id,

                "video_title": (
                    db.query(Video.title)
                    .filter(Video.id == post.video_id)
                    .scalar()
                    if post.video_id else None
                ),

                "file_path":
                    post.file_path,

                "created_at":
                    post.created_at

            }

            for post in posts

        ]

    }


# =====================================================
# CREATE CLASSROOM POST
# =====================================================

@router.post("/{classroom_id}/posts")
def create_classroom_post(
    classroom_id: int,
    data: ClassroomPostCreate,
    db: Session = Depends(get_db)
):

    classroom = (
        db.query(Classroom)
        .filter(
            Classroom.id == classroom_id
        )
        .first()
    )

    if not classroom:

        raise HTTPException(
            status_code=404,
            detail="Classroom not found"
        )

    # -----------------------------------------
    # Validate lecture if one is attached
    # -----------------------------------------

    if data.post_type == "lecture":

        if not data.video_id:

            raise HTTPException(
                status_code=400,
                detail="Lecture must be selected"
            )

        video = (
            db.query(Video)
            .filter(
                Video.id == data.video_id
            )
            .first()
        )

        if not video:

            raise HTTPException(
                status_code=404,
                detail="Lecture not found"
            )

        # Make sure this lecture belongs
        # to the educator who owns the classroom

        if video.user_id != classroom.educator_id:

            raise HTTPException(
                status_code=403,
                detail="You can only add your own lectures"
            )

    post = ClassroomPost(

        classroom_id=classroom_id,

        title=data.title,

        content=data.content,

        post_type=data.post_type,

        video_id=data.video_id

    )

    db.add(post)

    db.commit()

    db.refresh(post)

    return {

        "message":
            "Post created successfully",

        "post": {

            "id": post.id,

            "classroom_id":
                post.classroom_id,

            "title":
                post.title,

            "content":
                post.content,

            "post_type":
                post.post_type,

            "video_id":
                post.video_id,

            "created_at":
                post.created_at

        }

    }


# =====================================================
# UPLOAD CLASSROOM LEARNING MATERIAL
# =====================================================

@router.post("/{classroom_id}/materials")
def upload_classroom_material(
    classroom_id: int,
    educator_id: int = Form(...),
    title: str = Form(...),
    content: str = Form(""),
    file: UploadFile = File(...),
    db: Session = Depends(get_db)
):

    classroom = (
        db.query(Classroom)
        .filter(
            Classroom.id == classroom_id
        )
        .first()
    )

    if not classroom:

        raise HTTPException(
            status_code=404,
            detail="Classroom not found"
        )

    # Make sure this educator owns the classroom
    if classroom.educator_id != educator_id:

        raise HTTPException(
            status_code=403,
            detail="You do not own this classroom"
        )

    # -----------------------------------------
    # Create upload folder
    # -----------------------------------------

    upload_folder = "uploads/classroom_materials"

    os.makedirs(
        upload_folder,
        exist_ok=True
    )

    # -----------------------------------------
    # Generate unique filename
    # -----------------------------------------

    extension = ""

    if file.filename and "." in file.filename:

        extension = "." + file.filename.rsplit(
            ".",
            1
        )[1]

    filename = (
        f"{uuid.uuid4()}{extension}"
    )

    filepath = os.path.join(
        upload_folder,
        filename
    )

    # -----------------------------------------
    # Save file
    # -----------------------------------------

    with open(filepath, "wb") as buffer:

        buffer.write(
            file.file.read()
        )

    # -----------------------------------------
    # Create classroom post
    # -----------------------------------------

    post = ClassroomPost(

        classroom_id=classroom_id,

        title=title,

        content=content,

        post_type="material",

        file_path=(
            f"/uploads/classroom_materials/"
            f"{filename}"
        )

    )

    db.add(post)

    db.commit()

    db.refresh(post)

    return {

        "message":
            "Learning material uploaded successfully",

        "post": {

            "id": post.id,

            "title":
                post.title,

            "content":
                post.content,

            "post_type":
                post.post_type,

            "file_path":
                post.file_path,

            "created_at":
                post.created_at

        }

    }


# =====================================================
# JOIN CLASSROOM
# =====================================================

@router.post("/join")
def join_classroom(
    data: ClassroomJoin,
    learner_id: int,
    db: Session = Depends(get_db)
):

    classroom = (
        db.query(Classroom)
        .filter(
            Classroom.join_code
            == data.join_code.upper()
        )
        .first()
    )

    if not classroom:

        raise HTTPException(
            status_code=404,
            detail="Invalid classroom code"
        )

    existing = (
        db.query(ClassroomMember)
        .filter(
            ClassroomMember.classroom_id
            == classroom.id,

            ClassroomMember.learner_id
            == learner_id
        )
        .first()
    )

    if existing:

        return {
            "message":
                "Already joined classroom"
        }

    member = ClassroomMember(

        classroom_id=classroom.id,

        learner_id=learner_id

    )

    db.add(member)

    db.commit()

    return {

        "message":
            "Joined classroom successfully",

        "classroom_id":
            classroom.id

    }