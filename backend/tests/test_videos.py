from fastapi.testclient import TestClient

from app.main import app


client = TestClient(app)


def get_routes():

    response = client.get("/openapi.json")

    assert response.status_code == 200

    return response.json()["paths"]


def test_video_routes_registered():

    routes = get_routes()

    video_routes = [
        path
        for path in routes
        if "video" in path.lower()
    ]

    assert len(video_routes) > 0


def test_creator_video_routes_registered():

    routes = get_routes()

    creator_routes = [
        path
        for path in routes
        if "/creator" in path.lower()
    ]

    assert len(creator_routes) > 0


def test_educator_video_routes_registered():

    routes = get_routes()

    educator_routes = [
        path
        for path in routes
        if "/educator" in path.lower()
    ]

    assert len(educator_routes) > 0