from fastapi.testclient import TestClient

from app.main import app


client = TestClient(app)


def get_routes():

    response = client.get("/openapi.json")

    assert response.status_code == 200

    return response.json()["paths"]


def test_analytics_route_exists():

    routes = get_routes()

    analytics_routes = [
        path
        for path in routes
        if "analytics" in path.lower()
    ]

    assert len(analytics_routes) > 0


def test_creator_analytics_exists():

    routes = get_routes()

    assert any(
        "/creator/analytics" in path
        for path in routes
    )


def test_educator_analytics_exists():

    routes = get_routes()

    assert any(
        "/educator/analytics" in path
        for path in routes
    )