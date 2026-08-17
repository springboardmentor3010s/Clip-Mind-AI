import uuid


def unique_email():
    return f"test_{uuid.uuid4().hex[:8]}@example.com"


def register_and_login(client, role="learner", password="TestPass123"):
    email = unique_email()
    client.post(
        "/api/v1/auth/register",
        json={"full_name": "Test User", "email": email, "password": password, "role": role},
    )
    login_resp = client.post("/api/v1/auth/login", json={"email": email, "password": password})
    token = login_resp.json()["access_token"]
    user = client.get("/api/v1/auth/me", headers={"Authorization": f"Bearer {token}"}).json()
    return {"email": email, "token": token, "user": user}


def auth_header(token):
    return {"Authorization": f"Bearer {token}"}


# ---- PATCH /users/me ----

def test_update_my_profile_name(client):
    session = register_and_login(client)
    resp = client.patch(
        "/api/v1/users/me",
        json={"full_name": "Updated Name"},
        headers=auth_header(session["token"]),
    )
    assert resp.status_code == 200
    assert resp.json()["full_name"] == "Updated Name"


def test_update_my_profile_password(client):
    session = register_and_login(client)
    resp = client.patch(
        "/api/v1/users/me",
        json={"password": "NewPassword123"},
        headers=auth_header(session["token"]),
    )
    assert resp.status_code == 200

    # confirm new password works for login
    login_resp = client.post(
        "/api/v1/auth/login", json={"email": session["email"], "password": "NewPassword123"}
    )
    assert login_resp.status_code == 200


def test_update_my_profile_requires_auth(client):
    resp = client.patch("/api/v1/users/me", json={"full_name": "No Auth"})
    assert resp.status_code in (401, 403)


# ---- GET /users (admin-only list) ----

def test_list_users_requires_admin(client):
    session = register_and_login(client, role="learner")
    resp = client.get("/api/v1/users", headers=auth_header(session["token"]))
    assert resp.status_code == 403


def test_list_users_as_admin_succeeds(client):
    admin = register_and_login(client, role="administrator")
    resp = client.get("/api/v1/users", headers=auth_header(admin["token"]))
    assert resp.status_code == 200
    assert isinstance(resp.json(), list)
    assert len(resp.json()) >= 1


def test_list_users_requires_auth(client):
    resp = client.get("/api/v1/users")
    assert resp.status_code in (401, 403)


# ---- PATCH /users/{id}/role ----

def test_change_user_role_as_admin(client):
    admin = register_and_login(client, role="administrator")
    target = register_and_login(client, role="learner")
    resp = client.patch(
        f"/api/v1/users/{target['user']['id']}/role",
        json={"role": "educator"},
        headers=auth_header(admin["token"]),
    )
    assert resp.status_code == 200
    assert resp.json()["role"] == "educator"


def test_change_own_role_fails(client):
    admin = register_and_login(client, role="administrator")
    resp = client.patch(
        f"/api/v1/users/{admin['user']['id']}/role",
        json={"role": "learner"},
        headers=auth_header(admin["token"]),
    )
    assert resp.status_code == 400


def test_change_role_as_non_admin_fails(client):
    learner = register_and_login(client, role="learner")
    other = register_and_login(client, role="learner")
    resp = client.patch(
        f"/api/v1/users/{other['user']['id']}/role",
        json={"role": "educator"},
        headers=auth_header(learner["token"]),
    )
    assert resp.status_code == 403


def test_change_role_nonexistent_user_404(client):
    admin = register_and_login(client, role="administrator")
    fake_id = str(uuid.uuid4())
    resp = client.patch(
        f"/api/v1/users/{fake_id}/role",
        json={"role": "educator"},
        headers=auth_header(admin["token"]),
    )
    assert resp.status_code == 404


# ---- PATCH /users/{id}/deactivate & /activate ----

def test_deactivate_user_as_admin(client):
    admin = register_and_login(client, role="administrator")
    target = register_and_login(client, role="learner")
    resp = client.patch(
        f"/api/v1/users/{target['user']['id']}/deactivate",
        headers=auth_header(admin["token"]),
    )
    assert resp.status_code == 200
    assert resp.json()["is_active"] is False


def test_deactivate_self_fails(client):
    admin = register_and_login(client, role="administrator")
    resp = client.patch(
        f"/api/v1/users/{admin['user']['id']}/deactivate",
        headers=auth_header(admin["token"]),
    )
    assert resp.status_code == 400


def test_deactivate_as_non_admin_fails(client):
    learner = register_and_login(client, role="learner")
    other = register_and_login(client, role="learner")
    resp = client.patch(
        f"/api/v1/users/{other['user']['id']}/deactivate",
        headers=auth_header(learner["token"]),
    )
    assert resp.status_code == 403


def test_reactivate_user_as_admin(client):
    admin = register_and_login(client, role="administrator")
    target = register_and_login(client, role="learner")
    client.patch(f"/api/v1/users/{target['user']['id']}/deactivate", headers=auth_header(admin["token"]))
    resp = client.patch(
        f"/api/v1/users/{target['user']['id']}/activate",
        headers=auth_header(admin["token"]),
    )
    assert resp.status_code == 200
    assert resp.json()["is_active"] is True


def test_deactivated_user_cannot_login(client):
    admin = register_and_login(client, role="administrator")
    target = register_and_login(client, role="learner", password="TargetPass123")
    client.patch(f"/api/v1/users/{target['user']['id']}/deactivate", headers=auth_header(admin["token"]))
    resp = client.post(
        "/api/v1/auth/login", json={"email": target["email"], "password": "TargetPass123"}
    )
    assert resp.status_code in (401, 403)