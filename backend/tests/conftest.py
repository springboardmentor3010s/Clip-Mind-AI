"""Test configuration.

Sets hermetic env vars *before* any `app.*` module is imported, so the test
suite never needs a real Postgres instance, real R2 credentials, or a running
Redis — it runs the same way locally and in CI. Real env vars (e.g. from a
local .env) still win if already exported, so this never clobbers a
deliberately-configured local run.
"""
import os

os.environ.setdefault("DATABASE_URL", "sqlite:///./test.db")
os.environ.setdefault("REDIS_URL", "redis://localhost:6399/0")  # deliberately unreachable -> cache no-ops
os.environ.setdefault("R2_ACCESS_KEY_ID", "test-access-key")
os.environ.setdefault("R2_SECRET_ACCESS_KEY", "test-secret-key")
os.environ.setdefault("R2_ACCOUNT_ID", "test-account-id")
os.environ.setdefault("R2_BUCKET_NAME", "test-bucket")

import pytest
from fastapi.testclient import TestClient

from app.main import app


@pytest.fixture(scope="session")
def client():
    with TestClient(app) as c:
        yield c


def _register_and_login(client, role: str, email: str) -> str:
    client.post("/auth/register", json={
        "username": email.split("@")[0],
        "email": email,
        "password": "TestPass123!",
        "role": role,
    })
    res = client.post("/auth/login", json={"email": email, "password": "TestPass123!"})
    return res.json()["access_token"]


@pytest.fixture(scope="session")
def creator_token(client):
    return _register_and_login(client, "Creator", "creator_test@example.com")


@pytest.fixture(scope="session")
def learner_token(client):
    return _register_and_login(client, "Learner", "learner_test@example.com")


@pytest.fixture(scope="session")
def educator_token(client):
    return _register_and_login(client, "Educator", "educator_test@example.com")


@pytest.fixture(scope="session")
def admin_token(client):
    """There's no self-registerable Administrator role, so promote a normal
    user via direct DB access instead of going through the API."""
    from app.core.database import SessionLocal
    from app.models.user import User
    from app.models.role import Role

    token = _register_and_login(client, "Learner", "admin_test@example.com")
    db = SessionLocal()
    try:
        user = db.query(User).filter(User.email == "admin_test@example.com").first()
        admin_role = db.query(Role).filter(Role.name == "Administrator").first()
        user.role_id = admin_role.id
        db.commit()
    finally:
        db.close()
    # Re-login so the JWT's "role" claim reflects the promotion.
    res = client.post("/auth/login", json={"email": "admin_test@example.com", "password": "TestPass123!"})
    return res.json()["access_token"]


def auth_headers(token: str) -> dict:
    return {"Authorization": f"Bearer {token}"}
