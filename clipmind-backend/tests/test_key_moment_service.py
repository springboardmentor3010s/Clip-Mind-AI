from types import SimpleNamespace

from app.services.key_moment_service import detect_key_moments


def test_detect_key_moments():

    segments = [
        SimpleNamespace(
            id=1,
            start_time=0.0,
            end_time=5.0,
            segment_text="Hello everyone and welcome to today's session."
        ),
        SimpleNamespace(
            id=2,
            start_time=5.0,
            end_time=15.0,
            segment_text="Today we will learn about machine learning and artificial intelligence."
        ),
        SimpleNamespace(
            id=3,
            start_time=15.0,
            end_time=20.0,
            segment_text="Let us take a short break."
        ),
        SimpleNamespace(
            id=4,
            start_time=20.0,
            end_time=35.0,
            segment_text="Supervised learning uses labelled training data to learn relationships between inputs and outputs."
        ),
        SimpleNamespace(
            id=5,
            start_time=35.0,
            end_time=40.0,
            segment_text="Thank you everyone for watching."
        )
    ]

    summary = (
        "This session explains machine learning and artificial intelligence. "
        "It focuses on supervised learning and labelled training data."
    )

    key_moments = detect_key_moments(
        segments=segments,
        summary_text=summary,
        max_moments=3
    )

    assert key_moments

    assert len(key_moments) <= 3

    for moment in key_moments:
        assert "transcript_segment_id" in moment
        assert "start_time" in moment
        assert "end_time" in moment
        assert "title" in moment
        assert "segment_text" in moment
        assert "importance_score" in moment

        assert 0.0 <= moment["importance_score"] <= 1.0

    # The result should be chronological.
    timestamps = [
        moment["start_time"]
        for moment in key_moments
    ]

    assert timestamps == sorted(timestamps)