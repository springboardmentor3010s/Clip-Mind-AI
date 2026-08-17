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


def fake_video_file(name="test.mp4", content_type="video/mp4"):
    return {"file": (name, io.BytesIO(b"fake video bytes for testing"), content_type)}


def upload_video(client, token, title="Test Video", description=None):
    files = fake_video_file()
    data = {"title": title}
    if description is not None:
        data["description"] = description
    return client.post(
        "/api/v1/videos/upload",
        files=files,
        data=data,
        headers=auth_header(token),
    )


# ---- Upload ----

def test_upload_video_success(client):
    session = register_and_login(client, role="content_creator")
    resp = upload_video(client, session["token"], title="My Video", description="A test video")
    assert resp.status_code == 201
    data = resp.json()
    assert data["title"] == "My Video"
    assert data["owner_id"] == session["user"]["id"]
    assert data["is_published"] is False


def test_upload_video_requires_auth(client):
    resp = client.post("/api/v1/videos/upload", files=fake_video_file(), data={"title": "No Auth"})
    assert resp.status_code in (401, 403)


def test_upload_video_requires_title(client):
    session = register_and_login(client)
    resp = client.post(
        "/api/v1/videos/upload",
        files=fake_video_file(),
        data={},
        headers=auth_header(session["token"]),
    )
    assert resp.status_code == 422


# ---- List / Get ----

def test_get_my_videos(client):
    session = register_and_login(client, role="content_creator")
    upload_video(client, session["token"], title="Vid A")
    upload_video(client, session["token"], title="Vid B")
    resp = client.get("/api/v1/videos", headers=auth_header(session["token"]))
    assert resp.status_code == 200
    titles = [v["title"] for v in resp.json()]
    assert "Vid A" in titles and "Vid B" in titles


def test_get_my_videos_requires_auth(client):
    resp = client.get("/api/v1/videos")
    assert resp.status_code in (401, 403)


def test_get_video_by_id_as_owner(client):
    session = register_and_login(client, role="content_creator")
    upload_resp = upload_video(client, session["token"], title="Owned Vid")
    video_id = upload_resp.json()["id"]
    resp = client.get(f"/api/v1/videos/{video_id}", headers=auth_header(session["token"]))
    assert resp.status_code == 200
    assert resp.json()["id"] == video_id


def test_get_video_nonexistent_404(client):
    session = register_and_login(client)
    fake_id = str(uuid.uuid4())
    resp = client.get(f"/api/v1/videos/{fake_id}", headers=auth_header(session["token"]))
    assert resp.status_code == 404


def test_get_other_users_unpublished_video_fails(client):
    owner = register_and_login(client, role="content_creator")
    other = register_and_login(client, role="learner")
    upload_resp = upload_video(client, owner["token"], title="Private Vid")
    video_id = upload_resp.json()["id"]
    resp = client.get(f"/api/v1/videos/{video_id}", headers=auth_header(other["token"]))
    assert resp.status_code in (403, 404)


# ---- Publish / Content Library ----

def test_publish_video_as_owner(client):
    owner = register_and_login(client, role="content_creator")
    upload_resp = upload_video(client, owner["token"], title="To Publish")
    video_id = upload_resp.json()["id"]
    resp = client.patch(
        f"/api/v1/videos/{video_id}/publish",
        json={"is_published": True},
        headers=auth_header(owner["token"]),
    )
    assert resp.status_code == 200
    assert resp.json()["is_published"] is True


def test_publish_video_as_non_owner_fails(client):
    owner = register_and_login(client, role="content_creator")
    other = register_and_login(client, role="learner")
    upload_resp = upload_video(client, owner["token"], title="Not Yours")
    video_id = upload_resp.json()["id"]
    resp = client.patch(
        f"/api/v1/videos/{video_id}/publish",
        json={"is_published": True},
        headers=auth_header(other["token"]),
    )
    assert resp.status_code in (403, 404)


def test_published_video_visible_in_library(client):
    owner = register_and_login(client, role="content_creator")
    other = register_and_login(client, role="learner")
    upload_resp = upload_video(client, owner["token"], title="Library Vid")
    video_id = upload_resp.json()["id"]
    client.patch(
        f"/api/v1/videos/{video_id}/publish",
        json={"is_published": True},
        headers=auth_header(owner["token"]),
    )
    resp = client.get("/api/v1/videos/library", headers=auth_header(other["token"]))
    assert resp.status_code == 200
    ids = [v["id"] for v in resp.json()]
    assert video_id in ids


# ---- Sharing ----

def test_share_video_with_valid_email(client):
    owner = register_and_login(client, role="content_creator")
    recipient = register_and_login(client, role="learner")
    upload_resp = upload_video(client, owner["token"], title="Shared Vid")
    video_id = upload_resp.json()["id"]
    resp = client.post(
        f"/api/v1/videos/{video_id}/share",
        json={"emails": [recipient["email"]]},
        headers=auth_header(owner["token"]),
    )
    assert resp.status_code == 200
    data = resp.json()
    assert len(data["shared"]) == 1
    assert data["shared"][0]["email"] == recipient["email"]


def test_share_video_with_unknown_email(client):
    owner = register_and_login(client, role="content_creator")
    upload_resp = upload_video(client, owner["token"], title="Shared Vid 2")
    video_id = upload_resp.json()["id"]
    resp = client.post(
        f"/api/v1/videos/{video_id}/share",
        json={"emails": ["ghost_user@example.com"]},
        headers=auth_header(owner["token"]),
    )
    assert resp.status_code == 200
    data = resp.json()
    assert "ghost_user@example.com" in data["not_found"]


def test_shared_video_appears_in_shared_with_me(client):
    owner = register_and_login(client, role="content_creator")
    recipient = register_and_login(client, role="learner")
    upload_resp = upload_video(client, owner["token"], title="For SharedWithMe")
    video_id = upload_resp.json()["id"]
    client.post(
        f"/api/v1/videos/{video_id}/share",
        json={"emails": [recipient["email"]]},
        headers=auth_header(owner["token"]),
    )
    resp = client.get("/api/v1/videos/shared-with-me", headers=auth_header(recipient["token"]))
    assert resp.status_code == 200
    ids = [v["id"] for v in resp.json()]
    assert video_id in ids


def test_list_shares_as_non_owner_fails(client):
    owner = register_and_login(client, role="content_creator")
    other = register_and_login(client, role="learner")
    upload_resp = upload_video(client, owner["token"], title="Shares List Vid")
    video_id = upload_resp.json()["id"]
    resp = client.get(f"/api/v1/videos/{video_id}/share", headers=auth_header(other["token"]))
    assert resp.status_code in (403, 404)


def test_revoke_share_as_owner(client):
    owner = register_and_login(client, role="content_creator")
    recipient = register_and_login(client, role="learner")
    upload_resp = upload_video(client, owner["token"], title="Revoke Vid")
    video_id = upload_resp.json()["id"]
    share_resp = client.post(
        f"/api/v1/videos/{video_id}/share",
        json={"emails": [recipient["email"]]},
        headers=auth_header(owner["token"]),
    )
    share_id = share_resp.json()["shared"][0]["id"]
    resp = client.delete(
        f"/api/v1/videos/{video_id}/share/{share_id}",
        headers=auth_header(owner["token"]),
    )
    assert resp.status_code == 204


# ---- Delete ----

def test_delete_video_as_owner(client):
    owner = register_and_login(client, role="content_creator")
    upload_resp = upload_video(client, owner["token"], title="To Delete")
    video_id = upload_resp.json()["id"]
    resp = client.delete(f"/api/v1/videos/{video_id}", headers=auth_header(owner["token"]))
    assert resp.status_code == 204
    get_resp = client.get(f"/api/v1/videos/{video_id}", headers=auth_header(owner["token"]))
    assert get_resp.status_code == 404


def test_delete_video_as_non_owner_fails(client):
    owner = register_and_login(client, role="content_creator")
    other = register_and_login(client, role="learner")
    upload_resp = upload_video(client, owner["token"], title="Not Deletable")
    video_id = upload_resp.json()["id"]
    resp = client.delete(f"/api/v1/videos/{video_id}", headers=auth_header(other["token"]))
    assert resp.status_code in (403, 404)