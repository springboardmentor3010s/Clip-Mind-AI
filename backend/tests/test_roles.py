from unittest.mock import patch

from tests.conftest import auth_headers


# ---------- Bookmarks ----------

def test_bookmark_unknown_video_404s(client, learner_token):
    res = client.post(
        "/bookmarks",
        json={"video_id": 999999, "target_type": "video"},
        headers=auth_headers(learner_token),
    )
    assert res.status_code == 404


def test_bookmarks_require_auth(client):
    res = client.get("/bookmarks")
    assert res.status_code == 401


@patch("app.api.upload.r2_storage.create_multipart_upload", return_value="mock-upload-id")
def test_bookmark_create_list_delete(mock_create, client, creator_token, learner_token):
    init = client.post("/upload/multipart/init", json={
        "title": "bookmark_target.mp4", "filename": "bookmark_target.mp4", "file_type": "video/mp4",
    }, headers=auth_headers(creator_token))
    video_id = init.json()["video_id"]

    create_res = client.post(
        "/bookmarks",
        json={"video_id": video_id, "target_type": "video", "note": "watch later"},
        headers=auth_headers(learner_token),
    )
    assert create_res.status_code == 200
    bookmark = create_res.json()
    assert bookmark["video_id"] == video_id
    assert bookmark["note"] == "watch later"

    list_res = client.get("/bookmarks", headers=auth_headers(learner_token))
    assert list_res.status_code == 200
    assert any(b["id"] == bookmark["id"] for b in list_res.json())

    delete_res = client.delete(f"/bookmarks/{bookmark['id']}", headers=auth_headers(learner_token))
    assert delete_res.status_code == 200

    list_after = client.get("/bookmarks", headers=auth_headers(learner_token))
    assert not any(b["id"] == bookmark["id"] for b in list_after.json())


# ---------- Shared links ----------

@patch("app.api.upload.r2_storage.create_multipart_upload", return_value="mock-upload-id")
def test_share_link_create_and_public_fetch(mock_create, client, educator_token):
    init = client.post("/upload/multipart/init", json={
        "title": "shared_video.mp4", "filename": "shared_video.mp4", "file_type": "video/mp4",
    }, headers=auth_headers(educator_token))
    video_id = init.json()["video_id"]

    share_res = client.post("/share", json={"video_id": video_id}, headers=auth_headers(educator_token))
    assert share_res.status_code == 200
    token = share_res.json()["token"]

    # Public: no auth header at all.
    public_res = client.get(f"/share/{token}")
    assert public_res.status_code == 200
    assert public_res.json()["video_title"] == "shared_video.mp4"


def test_share_link_unknown_token_404s(client):
    res = client.get("/share/not-a-real-token")
    assert res.status_code == 404


def test_share_requires_content_manager_role(client, learner_token):
    res = client.post("/share", json={"video_id": 1}, headers=auth_headers(learner_token))
    assert res.status_code == 403


# ---------- Admin ----------

def test_system_stats_requires_admin(client, creator_token):
    res = client.get("/admin/system-stats", headers=auth_headers(creator_token))
    assert res.status_code == 403


def test_system_stats_returns_expected_shape(client, admin_token):
    res = client.get("/admin/system-stats", headers=auth_headers(admin_token))
    assert res.status_code == 200
    data = res.json()
    for key in ["total_users", "users_by_role", "total_videos", "videos_by_status",
                "total_storage_used_mb", "active_processing_jobs"]:
        assert key in data


def test_audit_log_records_role_change(client, admin_token):
    users_res = client.get("/users", headers=auth_headers(admin_token))
    target = next(u for u in users_res.json() if u["role"] != "Administrator")

    role_res = client.patch(
        f"/users/{target['id']}/role",
        json={"role": "Educator"},
        headers=auth_headers(admin_token),
    )
    assert role_res.status_code == 200

    log_res = client.get("/admin/audit-log", headers=auth_headers(admin_token))
    assert log_res.status_code == 200
    assert any(e["action"] == "role_changed" for e in log_res.json())

    # Put it back so other tests relying on this user's original role aren't affected.
    client.patch(f"/users/{target['id']}/role", json={"role": target["role"]}, headers=auth_headers(admin_token))


# ---------- Study materials ----------

def test_study_materials_404_without_transcript(client):
    res = client.get("/learn/999999999/study-materials")
    assert res.status_code == 404
