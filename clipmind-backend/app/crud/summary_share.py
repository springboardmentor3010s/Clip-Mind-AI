from sqlalchemy.orm import Session

from app.models.summary_share import SummaryShare

from app.models.summary import Summary
from app.models.classroom_member import ClassroomMember

def create_summary_share(
    db: Session,
    summary_id: int,
    classroom_id: int,
    shared_by: int
):
    summary_share = SummaryShare(
        summary_id=summary_id,
        classroom_id=classroom_id,
        shared_by=shared_by
    )

    db.add(summary_share)
    db.commit()
    db.refresh(summary_share)

    return summary_share

def get_shared_summaries_for_learner(
    db: Session,
    learner_id: int
):
    return (
        db.query(Summary)
        .join(
            SummaryShare,
            SummaryShare.summary_id == Summary.id
        )
        .join(
            ClassroomMember,
            ClassroomMember.classroom_id == SummaryShare.classroom_id
        )
        .filter(
            ClassroomMember.learner_id == learner_id
        )
        .distinct()
        .all()
    )