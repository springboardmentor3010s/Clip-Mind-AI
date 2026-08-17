# test_analytics.py
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


def cleanup_collection(collection_name, video_id):
    import asyncio
    from motor.motor_asyncio import AsyncIOMotorClient
    from app.core.config import settings

    async def _cleanup():
        mongo_client = AsyncIOMotorClient(settings.MONGO_URI)
        db = mongo_client[settings.MONGO_DB_NAME]
        await db[collection_name].delete_many({"video_id": str(video_id)})
        mongo_client.close()

    asyncio.run(_cleanup())


# ---- /analytics/overview ----

def test_analytics_overview_requires_auth(client):
    resp = client.get("/api/v1/analytics/overview")
    assert resp.status_code in (401, 403)


def test_analytics_overview_own_scope_for_creator(client):
    creator = register_and_login(client, role="content_creator")
    upload_video(client, creator["token"], title="Overview Vid")
    resp = client.get("/api/v1/analytics/overview", headers=auth_header(creator["token"]))
    assert resp.status_code == 200
    data = resp.json()
    assert data["scope"] == "own"
    assert data["total_videos"] >= 1


def test_analytics_overview_platform_scope_for_admin(client):
    admin = register_and_login(client, role="administrator")
    resp = client.get("/api/v1/analytics/overview", headers=auth_header(admin["token"]))
    assert resp.status_code == 200
    assert resp.json()["scope"] == "platform"


def test_analytics_overview_scoped_to_own_videos_only(client):
    creator_a = register_and_login(client, role="content_creator")
    creator_b = register_and_login(client, role="content_creator")
    upload_video(client, creator_a["token"], title="A's Vid")

    before = client.get("/api/v1/analytics/overview", headers=auth_header(creator_b["token"])).json()
    upload_video(client, creator_b["token"], title="B's Vid")
    after = client.get("/api/v1/analytics/overview", headers=auth_header(creator_b["token"])).json()

    assert after["total_videos"] == before["total_videos"] + 1


def test_analytics_overview_reflects_new_video_for_admin(client):
    admin = register_and_login(client, role="administrator")
    creator = register_and_login(client, role="content_creator")
    before = client.get("/api/v1/analytics/overview", headers=auth_header(admin["token"])).json()
    upload_video(client, creator["token"], title="Admin Sees This")
    after = client.get("/api/v1/analytics/overview", headers=auth_header(admin["token"])).json()
    assert after["total_videos"] == before["total_videos"] + 1


def test_analytics_overview_shape(client):
    admin = register_and_login(client, role="administrator")
    resp = client.get("/api/v1/analytics/overview", headers=auth_header(admin["token"]))
    data = resp.json()
    for key in (
        "total_videos", "completed_videos", "processing_videos", "failed_videos",
        "completion_rate", "total_duration_seconds", "total_duration_hours",
        "total_storage_mb", "avg_duration_seconds", "status_breakdown",
        "uploads_over_time", "top_keywords", "generated_at",
    ):
        assert key in data
    assert len(data["uploads_over_time"]) == 8


# ---- /videos/{id}/views (ping) ----

def test_ping_view_requires_auth(client):
    fake_id = str(uuid.uuid4())
    resp = client.post(f"/api/v1/videos/{fake_id}/views", json={"watched_seconds": 5, "session_start": True})
    assert resp.status_code in (401, 403)


def test_ping_view_nonexistent_video_404(client):
    session = register_and_login(client, role="learner")
    fake_id = str(uuid.uuid4())
    resp = client.post(
        f"/api/v1/videos/{fake_id}/views",
        json={"watched_seconds": 5, "session_start": True},
        headers=auth_header(session["token"]),
    )
    assert resp.status_code == 404


def test_ping_view_as_owner_succeeds(client):
    owner = register_and_login(client, role="content_creator")
    upload_resp = upload_video(client, owner["token"], title="Ping Owner Vid")
    video_id = upload_resp.json()["id"]
    try:
        resp = client.post(
            f"/api/v1/videos/{video_id}/views",
            json={"watched_seconds": 10, "session_start": True},
            headers=auth_header(owner["token"]),
        )
        assert resp.status_code == 204
    finally:
        cleanup_collection("video_views", video_id)


def test_ping_view_on_unpublished_video_by_other_user_fails(client):
    owner = register_and_login(client, role="content_creator")
    other = register_and_login(client, role="learner")
    upload_resp = upload_video(client, owner["token"], title="Ping Private Vid")
    video_id = upload_resp.json()["id"]
    resp = client.post(
        f"/api/v1/videos/{video_id}/views",
        json={"watched_seconds": 5, "session_start": True},
        headers=auth_header(other["token"]),
    )
    assert resp.status_code in (403, 404)


def test_ping_view_on_published_video_by_other_user_succeeds(client):
    owner = register_and_login(client, role="content_creator")
    viewer = register_and_login(client, role="learner")
    upload_resp = upload_video(client, owner["token"], title="Ping Published Vid")
    video_id = upload_resp.json()["id"]
    client.patch(
        f"/api/v1/videos/{video_id}/publish",
        json={"is_published": True},
        headers=auth_header(owner["token"]),
    )
    try:
        resp = client.post(
            f"/api/v1/videos/{video_id}/views",
            json={"watched_seconds": 12, "session_start": True},
            headers=auth_header(viewer["token"]),
        )
        assert resp.status_code == 204
    finally:
        cleanup_collection("video_views", video_id)


# ---- /videos/{id}/analytics ----

def test_get_video_analytics_requires_auth(client):
    fake_id = str(uuid.uuid4())
    resp = client.get(f"/api/v1/videos/{fake_id}/analytics")
    assert resp.status_code in (401, 403)


def test_get_video_analytics_nonexistent_video_404(client):
    owner = register_and_login(client, role="content_creator")
    fake_id = str(uuid.uuid4())
    resp = client.get(f"/api/v1/videos/{fake_id}/analytics", headers=auth_header(owner["token"]))
    assert resp.status_code == 404


def test_get_video_analytics_as_owner_with_no_views(client):
    owner = register_and_login(client, role="content_creator")
    upload_resp = upload_video(client, owner["token"], title="No Views Vid")
    video_id = upload_resp.json()["id"]
    resp = client.get(f"/api/v1/videos/{video_id}/analytics", headers=auth_header(owner["token"]))
    assert resp.status_code == 200
    data = resp.json()
    assert data["video_id"] == video_id
    assert data["view_count"] == 0
    assert data["unique_viewers"] == 0
    assert data["audience"] == []


def test_get_video_analytics_reflects_views(client):
    owner = register_and_login(client, role="content_creator")
    viewer = register_and_login(client, role="learner")
    upload_resp = upload_video(client, owner["token"], title="Tracked Vid")
    video_id = upload_resp.json()["id"]
    client.patch(
        f"/api/v1/videos/{video_id}/publish",
        json={"is_published": True},
        headers=auth_header(owner["token"]),
    )
    try:
        client.post(
            f"/api/v1/videos/{video_id}/views",
            json={"watched_seconds": 20, "session_start": True},
            headers=auth_header(viewer["token"]),
        )
        resp = client.get(f"/api/v1/videos/{video_id}/analytics", headers=auth_header(owner["token"]))
        assert resp.status_code == 200
        data = resp.json()
        assert data["view_count"] == 1
        assert data["unique_viewers"] == 1
        assert data["total_watch_time_seconds"] == 20
        assert len(data["audience"]) == 1
        assert data["audience"][0]["viewer_id"] == viewer["user"]["id"]
    finally:
        cleanup_collection("video_views", video_id)


def test_get_video_analytics_as_non_owner_fails_even_if_published(client):
    """
    get_video_analytics uses get_video_or_404 with require_owner defaulted True,
    so viewers cannot see a video's analytics dashboard even when the video
    itself is published and viewable to them.
    """
    owner = register_and_login(client, role="content_creator")
    viewer = register_and_login(client, role="learner")
    upload_resp = upload_video(client, owner["token"], title="Owner Only Analytics Vid")
    video_id = upload_resp.json()["id"]
    client.patch(
        f"/api/v1/videos/{video_id}/publish",
        json={"is_published": True},
        headers=auth_header(owner["token"]),
    )
    resp = client.get(f"/api/v1/videos/{video_id}/analytics", headers=auth_header(viewer["token"]))
    assert resp.status_code in (403, 404)


def test_repeated_session_start_pings_increment_view_count(client):
    owner = register_and_login(client, role="content_creator")
    upload_resp = upload_video(client, owner["token"], title="Repeat Ping Vid")
    video_id = upload_resp.json()["id"]
    try:
        client.post(
            f"/api/v1/videos/{video_id}/views",
            json={"watched_seconds": 5, "session_start": True},
            headers=auth_header(owner["token"]),
        )
        client.post(
            f"/api/v1/videos/{video_id}/views",
            json={"watched_seconds": 15, "session_start": True},
            headers=auth_header(owner["token"]),
        )
        resp = client.get(f"/api/v1/videos/{video_id}/analytics", headers=auth_header(owner["token"]))
        data = resp.json()
        assert data["view_count"] == 2
        assert data["unique_viewers"] == 1
        assert data["total_watch_time_seconds"] == 15  # max(watched_seconds), not sum
    finally:
        cleanup_collection("video_views", video_id)