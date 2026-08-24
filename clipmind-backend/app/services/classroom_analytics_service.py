from sqlalchemy.orm import Session

from app.models.classroom import Classroom
from app.models.classroom_member import ClassroomMember
from app.models.video import Video
from app.models.summary_share import SummaryShare
from app.models.learning_material_share import LearningMaterialShare


def generate_classroom_analytics(
    db: Session,
    educator_id: int
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

    results = []

    total_learners = 0
    total_videos = 0
    total_summary_shares = 0
    total_learning_material_shares = 0

    for classroom in classrooms:

        learner_count = (
            db.query(ClassroomMember)
            .filter(
                ClassroomMember.classroom_id == classroom.id
            )
            .count()
        )

        video_count = (
            db.query(Video)
            .filter(
                Video.classroom_id == classroom.id
            )
            .count()
        )

        summary_share_count = (
            db.query(SummaryShare)
            .filter(
                SummaryShare.classroom_id == classroom.id
            )
            .count()
        )

        learning_material_share_count = (
            db.query(LearningMaterialShare)
            .filter(
                LearningMaterialShare.classroom_id == classroom.id
            )
            .count()
        )

        total_learners += learner_count
        total_videos += video_count
        total_summary_shares += summary_share_count
        total_learning_material_shares += (
            learning_material_share_count
        )

        results.append(
            {
                "classroom_id": classroom.id,
                "classroom_name": classroom.name,
                "learner_count": learner_count,
                "video_count": video_count,
                "summary_share_count": summary_share_count,
                "learning_material_share_count":
                    learning_material_share_count,
            }
        )

    return {
        "total_classrooms": len(classrooms),
        "total_learners": total_learners,
        "total_videos": total_videos,
        "total_summary_shares": total_summary_shares,
        "total_learning_material_shares":
            total_learning_material_shares,
        "classrooms": results,
    }