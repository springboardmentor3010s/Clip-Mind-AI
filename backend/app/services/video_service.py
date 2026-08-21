import os
import shutil
import uuid
import traceback 

from fastapi import UploadFile
from sqlalchemy.orm import Session
from app.utils.video_processor import extract_audio
from app.models import Video
from app.utils.transcriber import generate_transcript
from app.utils.summarizer import (
    generate_summary,
    generate_short_summary,
)
from app.utils.key_moments import detect_key_moments
from app.utils.keyword_extractor import extract_keywords
from app.utils.topic_segmentation import generate_topics
from app.utils.highlight_report import generate_highlight_report
from app.utils.activity_logger import log_activity
UPLOAD_FOLDER = "uploads"

def save_video(
    db: Session,
    file: UploadFile,
    user_id: int,
):
    os.makedirs(UPLOAD_FOLDER, exist_ok=True)

    unique_filename = (
        str(uuid.uuid4())
        + "_"
        + file.filename
    )

    file_path = os.path.join(
        UPLOAD_FOLDER,
        unique_filename
    )

    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(
            file.file,
            buffer
        )

    video = Video(
        filename=unique_filename,
        original_filename=file.filename,
        file_path=file_path,
        uploaded_by=user_id,
        status="Processing",
    )

    db.add(video)
    db.commit()
    db.refresh(video)

    print("1. video saved")

    try:

        print("2. starting extracting audio")

        # Extract Audio
        audio_path = extract_audio(file_path)

        print("3. audio extraction complete")

        print("4. starting generating transcript")

        # Transcript
        transcript, segments, detected_language = generate_transcript(audio_path)

        print("Detected Language:", detected_language)
        print("=" * 60)
        print("TOTAL SEGMENTS:", len(segments))
        print("FIRST SEGMENT:", segments[0] if segments else "No segments")
        print("=" * 60)

        print("5. transcript generation complete")
        log_activity(
            db=db,
            user_id=user_id,
            action="Transcript Generated",
            description=f"Transcript generated for: {video.original_filename}"
        )

        print("Timestamp Segments:")
        for segment in segments:
            print(segment)

        # Key Moments
        key_moments = detect_key_moments(segments)

        print("Key Moments:")
        for moment in key_moments:
            print(moment)

        log_activity(
            db=db,
            user_id=user_id,
            action="Key Moments Generated",
            description=f"Key moments detected for: {video.original_filename}"
        )

        print("6. starting generating summary")

        # Summary
        summary = generate_summary(transcript)

        print("7. detailed summary generation complete")
        log_activity(
            db=db,
            user_id=user_id,
            action="Summary Generated",
            description=f"AI summary generated for: {video.original_filename}"
        )

        short_summary = generate_short_summary(summary)

        print("8. short summary generation complete")

        # Keywords
        keywords = extract_keywords(transcript)

        print("Keywords:")
        print(keywords)
        log_activity(
            db=db,
            user_id=user_id,
            action="Keywords Extracted",
            description=f"Keywords extracted for: {video.original_filename}"
        )

        # Topics
        print("Generating Topics...")

        topics = generate_topics(transcript)

        print("Topics:")
        print(topics)
        log_activity(
            db=db,
            user_id=user_id,
            action="Topics Generated",
            description=f"Topics generated for: {video.original_filename}"
        )

        # Highlight Report
        try:

            highlight_report = generate_highlight_report(
                transcript,
                summary,
                keywords,
                key_moments,
            )

            video.highlight_report = highlight_report

            print("Highlight Report Generated")
            log_activity(
                db=db,
                user_id=user_id,
                action="Highlight Report Generated",
                description=f"Highlight report generated for: {video.original_filename}"
                )

        except Exception as e:

            print("Highlight Report Failed:", e)

            video.highlight_report = {
                "executive_summary": "",
                "top_highlights": [],
                "important_keywords": [],
                "key_moments": [],
                "ai_insight": "",
            }

        # Save Everything
        video.language = detected_language
        video.transcript = transcript
        video.summary = summary
        video.short_summary = short_summary
        video.timestamps = segments
        video.key_moments = key_moments
        video.keywords = keywords
        video.topics = topics
        video.status = "Completed"

        db.commit()
        db.refresh(video)

        log_activity(
            db=db,
            user_id=user_id,
            action="Video Uploaded",
            description=f"Uploaded video: {video.original_filename}"
)

    except Exception:

        print("\n" + "=" * 60)
        print("FULL ERROR TRACEBACK")
        traceback.print_exc()
        print("=" * 60)

        video.status = "Failed"

        db.commit()
        db.refresh(video)

    print("9. returning response")
    log_activity(
        db=db,
        user_id=user_id,
        action="Video Uploaded",
        description=f"Uploaded video: {video.original_filename}"
    )

    return video
    