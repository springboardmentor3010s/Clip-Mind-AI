from fastapi.testclient import TestClient

from app.main import app


client = TestClient(app)


def test_application_starts():
    response = client.get("/openapi.json")

    assert response.status_code == 200


def test_api_documentation_available():
    response = client.get("/docs")

    assert response.status_code == 200


def test_auth_routes_registered():
    response = client.get("/openapi.json")

    assert response.status_code == 200

    routes = response.json()["paths"]

    auth_routes = [
        path
        for path in routes
        if "auth" in path.lower()
    ]

    assert len(auth_routes) > 0