import io
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


def upload_video(client, token, title="Test Video"):
    files = {"file": ("test.mp4", io.BytesIO(b"fake video bytes"), "video/mp4")}
    return client.post(
        "/api/v1/videos/upload",
        files=files,
        data={"title": title},
        headers=auth_header(token),
    )


# ---- Access control ----

def test_admin_stats_requires_admin(client):
    learner = register_and_login(client, role="learner")
    resp = client.get("/api/v1/admin/stats", headers=auth_header(learner["token"]))
    assert resp.status_code == 403


def test_admin_stats_requires_auth(client):
    resp = client.get("/api/v1/admin/stats")
    assert resp.status_code in (401, 403)


def test_admin_videos_requires_admin(client):
    learner = register_and_login(client, role="learner")
    resp = client.get("/api/v1/admin/videos", headers=auth_header(learner["token"]))
    assert resp.status_code == 403


def test_admin_audit_logs_requires_admin(client):
    learner = register_and_login(client, role="learner")
    resp = client.get("/api/v1/admin/audit-logs", headers=auth_header(learner["token"]))
    assert resp.status_code == 403


# ---- Platform stats ----

def test_get_platform_stats_as_admin(client):
    admin = register_and_login(client, role="administrator")
    resp = client.get("/api/v1/admin/stats", headers=auth_header(admin["token"]))
    assert resp.status_code == 200
    data = resp.json()
    assert "total_users" in data
    assert "total_videos" in data
    assert "users_by_role" in data
    assert data["total_users"] >= 1
    assert data["active_users"] + data["inactive_users"] == data["total_users"]


def test_platform_stats_reflects_new_user(client):
    admin = register_and_login(client, role="administrator")
    before = client.get("/api/v1/admin/stats", headers=auth_header(admin["token"])).json()
    register_and_login(client, role="learner")
    after = client.get("/api/v1/admin/stats", headers=auth_header(admin["token"])).json()
    assert after["total_users"] == before["total_users"] + 1


def test_platform_stats_reflects_new_video(client):
    admin = register_and_login(client, role="administrator")
    creator = register_and_login(client, role="content_creator")
    before = client.get("/api/v1/admin/stats", headers=auth_header(admin["token"])).json()
    upload_video(client, creator["token"], title="Stats Video")
    after = client.get("/api/v1/admin/stats", headers=auth_header(admin["token"])).json()
    assert after["total_videos"] == before["total_videos"] + 1


# ---- Content moderation ----

def test_get_all_videos_as_admin(client):
    admin = register_and_login(client, role="administrator")
    creator = register_and_login(client, role="content_creator")
    upload_video(client, creator["token"], title="Moderation Vid")
    resp = client.get("/api/v1/admin/videos", headers=auth_header(admin["token"]))
    assert resp.status_code == 200
    titles = [v["title"] for v in resp.json()]
    assert "Moderation Vid" in titles


def test_admin_can_delete_any_video(client):
    admin = register_and_login(client, role="administrator")
    creator = register_and_login(client, role="content_creator")
    upload_resp = upload_video(client, creator["token"], title="Admin Deletes This")
    video_id = upload_resp.json()["id"]
    resp = client.delete(f"/api/v1/admin/videos/{video_id}", headers=auth_header(admin["token"]))
    assert resp.status_code == 204

    get_resp = client.get(f"/api/v1/videos/{video_id}", headers=auth_header(creator["token"]))
    assert get_resp.status_code == 404


def test_admin_delete_nonexistent_video_404(client):
    admin = register_and_login(client, role="administrator")
    fake_id = str(uuid.uuid4())
    resp = client.delete(f"/api/v1/admin/videos/{fake_id}", headers=auth_header(admin["token"]))
    assert resp.status_code == 404


# ---- Audit logs ----

def test_audit_logs_contain_admin_actions(client):
    admin = register_and_login(client, role="administrator")
    target = register_and_login(client, role="learner")

    # trigger an auditable action via the users endpoint
    client.patch(
        f"/api/v1/users/{target['user']['id']}/deactivate",
        headers=auth_header(admin["token"]),
    )

    resp = client.get("/api/v1/admin/audit-logs", headers=auth_header(admin["token"]))
    assert resp.status_code == 200
    logs = resp.json()
    assert any(log["action"] == "user.deactivated" for log in logs)


def test_audit_log_contains_video_deletion_by_admin(client):
    admin = register_and_login(client, role="administrator")
    creator = register_and_login(client, role="content_creator")
    upload_resp = upload_video(client, creator["token"], title="Audit Delete Vid")
    video_id = upload_resp.json()["id"]
    client.delete(f"/api/v1/admin/videos/{video_id}", headers=auth_header(admin["token"]))

    resp = client.get("/api/v1/admin/audit-logs", headers=auth_header(admin["token"]))
    logs = resp.json()
    assert any(log["action"] == "video.deleted_by_admin" for log in logs)