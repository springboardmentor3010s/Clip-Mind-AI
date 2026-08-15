from sqlalchemy.orm import Session

from app.models.keyword import Keyword


def create_keyword(
    db: Session,
    video_id: int,
    keyword: str,
    frequency: int,
    relevance_score: float
):
    keyword_record = Keyword(
        video_id=video_id,
        keyword=keyword,
        frequency=frequency,
        relevance_score=relevance_score
    )

    db.add(keyword_record)
    db.commit()
    db.refresh(keyword_record)

    return keyword_record


def create_keywords(
    db: Session,
    video_id: int,
    keywords: list
):
    keyword_records = []

    for item in keywords:
        keyword_record = Keyword(
            video_id=video_id,
            keyword=item["keyword"],
            frequency=item["frequency"],
            relevance_score=item["relevance_score"]
        )

        keyword_records.append(keyword_record)

    db.add_all(keyword_records)
    db.commit()

    return keyword_records


def get_keywords_by_video(
    db: Session,
    video_id: int
):
    return (
        db.query(Keyword)
        .filter(
            Keyword.video_id == video_id
        )
        .order_by(
            Keyword.relevance_score.desc()
        )
        .all()
    )


def delete_keywords_by_video(
    db: Session,
    video_id: int
):
    (
        db.query(Keyword)
        .filter(
            Keyword.video_id == video_id
        )
        .delete(
            synchronize_session=False
        )
    )

    db.commit()