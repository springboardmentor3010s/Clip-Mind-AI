from unittest.mock import patch

from tests.conftest import auth_headers


def test_settings_require_admin(client, creator_token):
    res = client.get("/admin/settings", headers=auth_headers(creator_token))
    assert res.status_code == 403


def test_get_default_settings(client, admin_token):
    res = client.get("/admin/settings", headers=auth_headers(admin_token))
    assert res.status_code == 200
    data = res.json()
    assert data["maintenance_mode"] is False
    assert data["allow_new_registrations"] is True


def test_update_settings_and_enforce_registration_block(client, admin_token):
    update_res = client.put(
        "/admin/settings",
        json={"maintenance_mode": False, "allow_new_registrations": False, "max_upload_size_mb": 2048},
        headers=auth_headers(admin_token),
    )
    assert update_res.status_code == 200
    assert update_res.json()["allow_new_registrations"] is False

    register_res = client.post("/auth/register", json={
        "username": "blockedtest", "email": "blockedtest@example.com",
        "password": "TestPass123!", "role": "Learner",
    })
    assert register_res.status_code == 503

    # Restore for other tests.
    client.put(
        "/admin/settings",
        json={"maintenance_mode": False, "allow_new_registrations": True, "max_upload_size_mb": 2048},
        headers=auth_headers(admin_token),
    )


def test_update_settings_and_enforce_maintenance_mode(client, admin_token, creator_token):
    client.put(
        "/admin/settings",
        json={"maintenance_mode": True, "allow_new_registrations": True, "max_upload_size_mb": 2048},
        headers=auth_headers(admin_token),
    )

    with patch("app.api.upload.r2_storage.create_multipart_upload", return_value="mock-id"):
        upload_res = client.post("/upload/multipart/init", json={
            "title": "blocked.mp4", "filename": "blocked.mp4", "file_type": "video/mp4",
        }, headers=auth_headers(creator_token))
    assert upload_res.status_code == 503

    # Admins can still upload during maintenance.
    with patch("app.api.upload.r2_storage.create_multipart_upload", return_value="mock-id"):
        admin_upload_res = client.post("/upload/multipart/init", json={
            "title": "admin_ok.mp4", "filename": "admin_ok.mp4", "file_type": "video/mp4",
        }, headers=auth_headers(admin_token))
    assert admin_upload_res.status_code == 200

    client.put(
        "/admin/settings",
        json={"maintenance_mode": False, "allow_new_registrations": True, "max_upload_size_mb": 2048},
        headers=auth_headers(admin_token),
    )


def test_upload_size_limit_enforced(client, admin_token, creator_token):
    client.put(
        "/admin/settings",
        json={"maintenance_mode": False, "allow_new_registrations": True, "max_upload_size_mb": 1},
        headers=auth_headers(admin_token),
    )

    with patch("app.api.upload.r2_storage.create_multipart_upload", return_value="mock-id"):
        res = client.post("/upload/multipart/init", json={
            "title": "big.mp4", "filename": "big.mp4", "file_type": "video/mp4",
            "file_size_bytes": 5 * 1024 * 1024,
        }, headers=auth_headers(creator_token))
    assert res.status_code == 413

    client.put(
        "/admin/settings",
        json={"maintenance_mode": False, "allow_new_registrations": True, "max_upload_size_mb": 2048},
        headers=auth_headers(admin_token),
    )
