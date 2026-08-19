from unittest.mock import patch

from tests.conftest import auth_headers


def _create_video(client, token, title):
    with patch("app.api.upload.r2_storage.create_multipart_upload", return_value="mock-upload-id"):
        res = client.post("/upload/multipart/init", json={
            "title": title, "filename": title, "file_type": "video/mp4",
        }, headers=auth_headers(token))
        return res.json()["video_id"]


def test_only_educator_can_create_classroom(client, creator_token):
    res = client.post("/classrooms", json={"name": "Bio 101"}, headers=auth_headers(creator_token))
    assert res.status_code == 403


def test_classroom_lifecycle(client, educator_token, learner_token):
    create_res = client.post("/classrooms", json={"name": "Bio 101"}, headers=auth_headers(educator_token))
    assert create_res.status_code == 200
    classroom_id = create_res.json()["id"]

    # A non-owner (even another Educator) can't manage it.
    other_res = client.post(
        f"/classrooms/{classroom_id}/students",
        json={"email": "nobody@example.com"},
        headers=auth_headers(learner_token),
    )
    assert other_res.status_code == 403

    # Add the Learner as a student by email.
    learner_email = "learner_test@example.com"
    add_res = client.post(
        f"/classrooms/{classroom_id}/students",
        json={"email": learner_email},
        headers=auth_headers(educator_token),
    )
    assert add_res.status_code == 200
    assert len(add_res.json()["students"]) == 1
    assert add_res.json()["students"][0]["email"] == learner_email

    # The Learner can now see it in their joined list and view its detail.
    joined_res = client.get("/classrooms/joined", headers=auth_headers(learner_token))
    assert joined_res.status_code == 200
    assert any(c["id"] == classroom_id for c in joined_res.json())

    detail_res = client.get(f"/classrooms/{classroom_id}", headers=auth_headers(learner_token))
    assert detail_res.status_code == 200

    video_id = _create_video(client, educator_token, "lecture1.mp4")
    assign_res = client.post(
        f"/classrooms/{classroom_id}/videos",
        json={"video_id": video_id},
        headers=auth_headers(educator_token),
    )
    assert assign_res.status_code == 200
    assert len(assign_res.json()["videos"]) == 1

    analytics_res = client.get(f"/classrooms/{classroom_id}/analytics", headers=auth_headers(educator_token))
    assert analytics_res.status_code == 200
    data = analytics_res.json()
    assert data["student_count"] == 1
    assert len(data["videos"]) == 1
    assert data["videos"][0]["video_id"] == video_id

    # Remove the student and confirm.
    remove_res = client.delete(f"/classrooms/{classroom_id}/students/{add_res.json()['students'][0]['id']}", headers=auth_headers(educator_token))
    assert remove_res.status_code == 200
    assert len(remove_res.json()["students"]) == 0


def test_add_student_rejects_non_learner(client, educator_token):
    create_res = client.post("/classrooms", json={"name": "Chem 101"}, headers=auth_headers(educator_token))
    classroom_id = create_res.json()["id"]

    res = client.post(
        f"/classrooms/{classroom_id}/students",
        json={"email": "creator_test@example.com"},
        headers=auth_headers(educator_token),
    )
    assert res.status_code == 400
