import pytest
from app.services.key_moments import extract_keywords, generate_key_moments, generate_title_from_keywords, process_video_key_moments

def test_extract_keywords():
    text = "Machine learning is fascinating. Learning about machine learning models requires data. Deep learning is a subset of machine learning."
    keywords = extract_keywords(text, top_n=3)

    # "learning" appears 4 times, "machine" appears 3 times
    assert "learning" in keywords
    assert "machine" in keywords

def test_extract_keywords_stop_words():
    # 'is', 'a', 'of' are stop words and should be ignored
    text = "Machine learning is a subset of machine learning."
    keywords = extract_keywords(text, top_n=5)

    assert "is" not in keywords
    assert "subset" in keywords

def test_extract_keywords_ignores_contraction_fragments():
    # "don't" splits into "don" + "t" under the letters-only regex — "don"
    # must not leak through as a keyword just because "t" is too short to count.
    text = "I don't know if this will work, but I don't want to give up."
    keywords = extract_keywords(text, top_n=10)

    assert "don" not in keywords

def test_generate_key_moments_groups_into_chronological_chapters():
    # Two clusters of segments five minutes apart should become two chapters,
    # not get scored/picked independently.
    segments = [
        {"start_time": 0, "end_time": 5, "text": "Welcome to this introduction on artificial intelligence."},
        {"start_time": 5, "end_time": 10, "text": "In this video we explore machine learning."},
        {"start_time": 10, "end_time": 15, "text": "Machine learning uses neural networks."},
        {"start_time": 400, "end_time": 405, "text": "Now let's switch topics to talk about cooking."},
        {"start_time": 405, "end_time": 410, "text": "Cooking requires good ingredients and technique."},
    ]
    top_keywords = ["machine", "learning", "neural", "cooking", "ingredients"]

    moments = generate_key_moments(segments, top_keywords, chunk_duration_sec=300)

    assert len(moments) == 2
    # Chronological and covers the full timeline, not just the "best" bits.
    assert moments[0]["start_time"] == 0
    assert moments[0]["end_time"] == 15
    assert moments[1]["start_time"] == 400
    assert moments[1]["end_time"] == 410
    assert "Machine" in moments[0]["title"] or "Learning" in moments[0]["title"]
    assert "Cooking" in moments[1]["title"]

def test_generate_key_moments_empty():
    assert generate_key_moments([], []) == []

def test_generate_title_from_keywords():
    assert generate_title_from_keywords([]) == ""
    assert generate_title_from_keywords(["ai"]) == "Ai"
    assert generate_title_from_keywords(["ai", "ml"]) == "Ai & Ml"
    assert generate_title_from_keywords(["ai", "ml", "data"]) == "Ai, Ml & Data"

def test_process_video_key_moments_returns_keywords_and_moments():
    segments = [
        {"start_time": 0, "end_time": 5, "text": "Welcome to this introduction on artificial intelligence."},
        {"start_time": 5, "end_time": 10, "text": "In this video we explore machine learning."},
        {"start_time": 10, "end_time": 15, "text": "Machine learning uses neural networks."},
    ]

    result = process_video_key_moments(segments)

    assert "keywords" in result
    assert "moments" in result
    assert isinstance(result["keywords"], list)
    assert isinstance(result["moments"], list)
    assert "machine" in result["keywords"]
    assert len(result["moments"]) == 1  # all within one 5-minute chapter
