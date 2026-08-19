from unittest.mock import patch

from app.models.video import VideoStatus, Video
from app.core.database import SessionLocal
from tests.conftest import auth_headers


@patch("app.api.upload.r2_storage.create_multipart_upload", return_value="mock-upload-id")
def test_init_multipart_upload_creates_pending_video(mock_create, client, creator_token):
    response = client.post("/upload/multipart/init", json={
        "title": "test.mp4",
        "filename": "test.mp4",
        "file_type": "video/mp4",
    }, headers=auth_headers(creator_token))

    assert response.status_code == 200
    data = response.json()
    assert "video_id" in data
    assert data["upload_id"] == "mock-upload-id"

    db = SessionLocal()
    try:
        video = db.query(Video).filter(Video.id == data["video_id"]).first()
        assert video is not None
        assert video.status == VideoStatus.UPLOADING
        assert video.title == "test.mp4"
    finally:
        db.close()


def test_init_multipart_upload_requires_auth(client):
    response = client.post("/upload/multipart/init", json={
        "title": "test.mp4", "filename": "test.mp4", "file_type": "video/mp4",
    })
    assert response.status_code == 401


@patch("app.api.upload.r2_storage.create_multipart_upload", return_value="mock-upload-id")
def test_init_multipart_upload_forbidden_for_learner(mock_create, client, learner_token):
    response = client.post("/upload/multipart/init", json={
        "title": "test.mp4", "filename": "test.mp4", "file_type": "video/mp4",
    }, headers=auth_headers(learner_token))
    assert response.status_code == 403


@patch("app.api.upload.r2_storage.create_multipart_upload", return_value="mock-upload-id")
@patch("app.api.upload.r2_storage.generate_presigned_download_url", return_value="https://example.com/signed")
def test_rename_video_updates_title_only(mock_presign, mock_create, client, creator_token):
    init_res = client.post("/upload/multipart/init", json={
        "title": "original_name.mp4",
        "filename": "original_name.mp4",
        "file_type": "video/mp4",
    }, headers=auth_headers(creator_token))
    video_id = init_res.json()["video_id"]

    rename_res = client.patch(
        f"/upload/video/{video_id}",
        json={"title": "My Custom Title"},
        headers=auth_headers(creator_token),
    )

    assert rename_res.status_code == 200
    data = rename_res.json()
    assert data["title"] == "My Custom Title"
    assert data["filename"] == "original_name.mp4"  # filename is untouched by rename


def test_rename_missing_video_returns_404(client, creator_token):
    response = client.patch(
        "/upload/video/999999999",
        json={"title": "Doesn't matter"},
        headers=auth_headers(creator_token),
    )
    assert response.status_code == 404


@patch("app.api.upload.r2_storage.create_multipart_upload", return_value="mock-upload-id")
@patch("app.api.upload.r2_storage.delete_object")
def test_delete_video_removes_db_row_and_r2_object(mock_delete_object, mock_create, client, creator_token):
    init_res = client.post("/upload/multipart/init", json={
        "title": "to_delete.mp4",
        "filename": "to_delete.mp4",
        "file_type": "video/mp4",
    }, headers=auth_headers(creator_token))
    video_id = init_res.json()["video_id"]

    delete_res = client.delete(f"/upload/video/{video_id}", headers=auth_headers(creator_token))
    assert delete_res.status_code == 200
    mock_delete_object.assert_called_once()

    db = SessionLocal()
    try:
        assert db.query(Video).filter(Video.id == video_id).first() is None
    finally:
        db.close()


def test_list_videos_pagination_defaults(client):
    response = client.get("/upload/videos")
    assert response.status_code == 200
    assert isinstance(response.json(), list)

    limited = client.get("/upload/videos?skip=0&limit=1")
    assert limited.status_code == 200
    assert len(limited.json()) <= 1
