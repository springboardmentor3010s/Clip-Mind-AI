import uuid


def unique_email():
    return f"test_{uuid.uuid4().hex[:8]}@example.com"


def test_health_check(client):
    resp = client.get("/health")
    assert resp.status_code == 200
    assert resp.json()["status"] == "ok"


def test_register_user_success(client):
    payload = {
        "full_name": "Test User",
        "email": unique_email(),
        "password": "TestPass123",
        "role": "learner",
    }
    resp = client.post("/api/v1/auth/register", json=payload)
    assert resp.status_code == 201
    data = resp.json()
    assert data["email"] == payload["email"]
    assert data["role"] == "learner"
    assert "id" in data


def test_register_duplicate_email_fails(client):
    email = unique_email()
    payload = {"full_name": "Dup", "email": email, "password": "TestPass123", "role": "learner"}
    r1 = client.post("/api/v1/auth/register", json=payload)
    assert r1.status_code == 201
    r2 = client.post("/api/v1/auth/register", json=payload)
    assert r2.status_code in (400, 409)


def test_register_invalid_password_too_short(client):
    payload = {"full_name": "Short", "email": unique_email(), "password": "short", "role": "learner"}
    resp = client.post("/api/v1/auth/register", json=payload)
    assert resp.status_code == 422


def test_login_success(client):
    email = unique_email()
    password = "TestPass123"
    client.post("/api/v1/auth/register", json={"full_name": "Login User", "email": email, "password": password, "role": "learner"})
    resp = client.post("/api/v1/auth/login", json={"email": email, "password": password})
    assert resp.status_code == 200
    data = resp.json()
    assert "access_token" in data
    assert "refresh_token" in data
    assert data["token_type"] == "bearer"


def test_login_wrong_password_fails(client):
    email = unique_email()
    client.post("/api/v1/auth/register", json={"full_name": "Wrong Pw", "email": email, "password": "TestPass123", "role": "learner"})
    resp = client.post("/api/v1/auth/login", json={"email": email, "password": "WrongPass999"})
    assert resp.status_code == 401


def test_login_nonexistent_user_fails(client):
    resp = client.post("/api/v1/auth/login", json={"email": unique_email(), "password": "whatever123"})
    assert resp.status_code == 401


def test_get_me_requires_auth(client):
    resp = client.get("/api/v1/auth/me")
    assert resp.status_code in (401, 403)


def test_get_me_with_valid_token(client):
    email = unique_email()
    password = "TestPass123"
    client.post("/api/v1/auth/register", json={"full_name": "Me User", "email": email, "password": password, "role": "learner"})
    login_resp = client.post("/api/v1/auth/login", json={"email": email, "password": password})
    token = login_resp.json()["access_token"]
    resp = client.get("/api/v1/auth/me", headers={"Authorization": f"Bearer {token}"})
    assert resp.status_code == 200
    assert resp.json()["email"] == email


def test_refresh_token_flow(client):
    email = unique_email()
    password = "TestPass123"
    client.post("/api/v1/auth/register", json={"full_name": "Refresh User", "email": email, "password": password, "role": "learner"})
    login_resp = client.post("/api/v1/auth/login", json={"email": email, "password": password})
    refresh_token = login_resp.json()["refresh_token"]
    resp = client.post("/api/v1/auth/refresh", json={"refresh_token": refresh_token})
    assert resp.status_code == 200
    assert "access_token" in resp.json()


def test_refresh_with_invalid_token_fails(client):
    resp = client.post("/api/v1/auth/refresh", json={"refresh_token": "invalid.token.here"})
    assert resp.status_code == 401


def test_forgot_password_always_returns_generic_message(client):
    resp = client.post("/api/v1/auth/forgot-password", json={"email": "nonexistent@example.com"})
    assert resp.status_code == 200
    assert "message" in resp.json()