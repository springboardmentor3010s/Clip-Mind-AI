def test_firebase_login_rejects_invalid_token(client):
    res = client.post("/auth/firebase-login", json={"id_token": "not-a-real-token"})
    assert res.status_code == 401


def test_firebase_login_rejects_invalid_role(client, monkeypatch):
    from app.services import auth_service

    monkeypatch.setattr(
        auth_service, "verify_firebase_id_token",
        lambda token: {"email": "firebase_new_user@example.com", "name": "Firebase User"},
    )
    res = client.post("/auth/firebase-login", json={"id_token": "fake", "role": "Administrator"})
    assert res.status_code == 400


def test_firebase_login_needs_role_for_new_account(client, monkeypatch):
    from app.services import auth_service

    monkeypatch.setattr(
        auth_service, "verify_firebase_id_token",
        lambda token: {"email": "firebase_needs_role@example.com", "name": "Firebase User"},
    )
    res = client.post("/auth/firebase-login", json={"id_token": "fake"})
    assert res.status_code == 200
    assert res.json() == {"needs_role": True}


def test_firebase_login_creates_and_reauths_user(client, monkeypatch):
    from app.services import auth_service

    monkeypatch.setattr(
        auth_service, "verify_firebase_id_token",
        lambda token: {"email": "firebase_create@example.com", "name": "Firebase Create"},
    )

    create_res = client.post("/auth/firebase-login", json={"id_token": "fake", "role": "Learner"})
    assert create_res.status_code == 200
    assert "access_token" in create_res.json()

    reauth_res = client.post("/auth/firebase-login", json={"id_token": "fake"})
    assert reauth_res.status_code == 200
    assert "access_token" in reauth_res.json()


def test_firebase_login_uses_explicit_username_over_firebase_name(client, monkeypatch):
    from tests.conftest import auth_headers
    from app.services import auth_service

    monkeypatch.setattr(
        auth_service, "verify_firebase_id_token",
        lambda token: {"email": "firebase_username@example.com", "name": "Firebase Display Name"},
    )

    create_res = client.post("/auth/firebase-login", json={
        "id_token": "fake", "role": "Learner", "username": "chosen_username",
    })
    assert create_res.status_code == 200
    token = create_res.json()["access_token"]

    profile_res = client.get("/users/me", headers=auth_headers(token))
    assert profile_res.status_code == 200
    assert profile_res.json()["username"] == "chosen_username"
