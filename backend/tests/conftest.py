import pytest
from fastapi.testclient import TestClient
from app.main import app

@pytest.fixture(scope="module")
def client():
    """Provides a FastAPI test client instance for testing routes."""
    with TestClient(app) as test_client:
        yield test_client