from fastapi.testclient import TestClient

from app.main import app


client = TestClient(app)


def get_routes():

    response = client.get("/openapi.json")

    assert response.status_code == 200

    return response.json()["paths"]


def test_transcript_routes_registered():

    routes = get_routes()

    transcript_routes = [
        path
        for path in routes
        if "transcript" in path.lower()
    ]

    assert len(transcript_routes) > 0


def test_lecture_routes_registered():

    routes = get_routes()

    lecture_routes = [
        path
        for path in routes
        if "lecture" in path.lower()
    ]

    assert len(lecture_routes) > 0


def test_ai_processing_routes_registered():

    routes = get_routes()

    ai_keywords = [
        "summary",
        "transcript",
        "key",
        "quiz",
        "flashcard"
    ]

    matched = []

    for path in routes:

        path_lower = path.lower()

        if any(
            keyword in path_lower
            for keyword in ai_keywords
        ):

            matched.append(path)

    assert len(matched) > 0