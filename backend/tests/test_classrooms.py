# test_classrooms.py
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


def create_classroom(client, token, name="Test Classroom"):
    return client.post("/api/v1/classrooms", json={"name": name}, headers=auth_header(token))


def join_classroom(client, token, invite_code):
    return client.post("/api/v1/classrooms/join", json={"invite_code": invite_code}, headers=auth_header(token))


# ---- POST /classrooms ----

def test_create_classroom_requires_auth(client):
    resp = client.post("/api/v1/classrooms", json={"name": "No Auth"})
    assert resp.status_code in (401, 403)


def test_create_classroom_requires_educator_role(client):
    learner = register_and_login(client, role="learner")
    resp = create_classroom(client, learner["token"])
    assert resp.status_code == 403


def test_educator_can_create_classroom(client):
    educator = register_and_login(client, role="educator")
    resp = create_classroom(client, educator["token"], name="Biology 101")
    assert resp.status_code == 201
    data = resp.json()
    assert data["name"] == "Biology 101"
    assert data["student_count"] == 0
    assert len(data["invite_code"]) >= 6


# ---- GET /classrooms/mine ----

def test_educator_sees_own_classroom_in_mine(client):
    educator = register_and_login(client, role="educator")
    create_classroom(client, educator["token"], name="Chemistry")
    resp = client.get("/api/v1/classrooms/mine", headers=auth_header(educator["token"]))
    assert resp.status_code == 200
    names = [c["name"] for c in resp.json()]
    assert "Chemistry" in names


def test_other_educator_does_not_see_someone_elses_classroom(client):
    owner = register_and_login(client, role="educator")
    other = register_and_login(client, role="educator")
    create_classroom(client, owner["token"], name="Physics")
    resp = client.get("/api/v1/classrooms/mine", headers=auth_header(other["token"]))
    names = [c["name"] for c in resp.json()]
    assert "Physics" not in names


def test_learner_sees_joined_classroom_in_mine(client):
    educator = register_and_login(client, role="educator")
    learner = register_and_login(client, role="learner")
    created = create_classroom(client, educator["token"], name="History").json()
    join_classroom(client, learner["token"], created["invite_code"])

    resp = client.get("/api/v1/classrooms/mine", headers=auth_header(learner["token"]))
    assert resp.status_code == 200
    names = [c["name"] for c in resp.json()]
    assert "History" in names


# ---- POST /classrooms/join ----

def test_join_requires_learner_role(client):
    educator = register_and_login(client, role="educator")
    other_educator = register_and_login(client, role="educator")
    created = create_classroom(client, educator["token"], name="Geometry").json()
    resp = join_classroom(client, other_educator["token"], created["invite_code"])
    assert resp.status_code == 403


def test_join_with_invalid_code_404s(client):
    learner = register_and_login(client, role="learner")
    resp = join_classroom(client, learner["token"], "NOPE1234")
    assert resp.status_code == 404


def test_join_increments_student_count(client):
    educator = register_and_login(client, role="educator")
    learner = register_and_login(client, role="learner")
    created = create_classroom(client, educator["token"], name="Algebra").json()

    resp = join_classroom(client, learner["token"], created["invite_code"])
    assert resp.status_code == 200
    assert resp.json()["student_count"] == 1


def test_rejoining_is_idempotent(client):
    educator = register_and_login(client, role="educator")
    learner = register_and_login(client, role="learner")
    created = create_classroom(client, educator["token"], name="Statistics").json()

    join_classroom(client, learner["token"], created["invite_code"])
    resp = join_classroom(client, learner["token"], created["invite_code"])
    assert resp.json()["student_count"] == 1


# ---- GET /classrooms/{id}/roster ----

def test_roster_requires_ownership(client):
    educator = register_and_login(client, role="educator")
    other_educator = register_and_login(client, role="educator")
    created = create_classroom(client, educator["token"], name="Art").json()

    resp = client.get(f"/api/v1/classrooms/{created['id']}/roster", headers=auth_header(other_educator["token"]))
    assert resp.status_code == 403


def test_roster_lists_enrolled_students(client):
    educator = register_and_login(client, role="educator")
    learner = register_and_login(client, role="learner")
    created = create_classroom(client, educator["token"], name="Music").json()
    join_classroom(client, learner["token"], created["invite_code"])

    resp = client.get(f"/api/v1/classrooms/{created['id']}/roster", headers=auth_header(educator["token"]))
    assert resp.status_code == 200
    emails = [m["email"] for m in resp.json()]
    assert learner["email"] in emails


# ---- DELETE /classrooms/{id}/members/{student_id} ----

def test_remove_member_updates_roster(client):
    educator = register_and_login(client, role="educator")
    learner = register_and_login(client, role="learner")
    created = create_classroom(client, educator["token"], name="Drama").json()
    join_classroom(client, learner["token"], created["invite_code"])

    student_id = learner["user"]["id"]
    resp = client.delete(
        f"/api/v1/classrooms/{created['id']}/members/{student_id}", headers=auth_header(educator["token"])
    )
    assert resp.status_code == 204

    roster = client.get(f"/api/v1/classrooms/{created['id']}/roster", headers=auth_header(educator["token"])).json()
    assert learner["email"] not in [m["email"] for m in roster]


# ---- Video sharing with a classroom ----

def test_share_video_with_classroom_and_appears_shared_with_me(client):
    educator = register_and_login(client, role="educator")
    learner = register_and_login(client, role="learner")
    created = create_classroom(client, educator["token"], name="Coding").json()
    join_classroom(client, learner["token"], created["invite_code"])

    video_id = upload_video(client, educator["token"], title="Lesson 1").json()["id"]
    try:
        resp = client.post(
            f"/api/v1/videos/{video_id}/share-classroom",
            json={"classroom_id": created["id"]},
            headers=auth_header(educator["token"]),
        )
        assert resp.status_code == 200
        assert resp.json()["classroom_id"] == created["id"]

        shared = client.get("/api/v1/videos/shared-with-me", headers=auth_header(learner["token"])).json()
        assert any(v["id"] == video_id for v in shared)
    finally:
        cleanup_collection("video_views", video_id)


def test_cannot_share_into_someone_elses_classroom(client):
    educator = register_and_login(client, role="educator")
    other_educator = register_and_login(client, role="educator")
    other_classroom = create_classroom(client, other_educator["token"], name="Not Yours").json()

    video_id = upload_video(client, educator["token"], title="Private Lesson").json()["id"]
    resp = client.post(
        f"/api/v1/videos/{video_id}/share-classroom",
        json={"classroom_id": other_classroom["id"]},
        headers=auth_header(educator["token"]),
    )
    assert resp.status_code == 403


def test_revoke_classroom_share_removes_access(client):
    educator = register_and_login(client, role="educator")
    learner = register_and_login(client, role="learner")
    created = create_classroom(client, educator["token"], name="Design").json()
    join_classroom(client, learner["token"], created["invite_code"])

    video_id = upload_video(client, educator["token"], title="Lesson 2").json()["id"]
    share = client.post(
        f"/api/v1/videos/{video_id}/share-classroom",
        json={"classroom_id": created["id"]},
        headers=auth_header(educator["token"]),
    ).json()

    resp = client.delete(
        f"/api/v1/videos/{video_id}/share-classroom/{share['id']}", headers=auth_header(educator["token"])
    )
    assert resp.status_code == 204

    shared = client.get("/api/v1/videos/shared-with-me", headers=auth_header(learner["token"])).json()
    assert not any(v["id"] == video_id for v in shared)


# ---- GET /classrooms/{id}/analytics ----

def test_analytics_requires_ownership(client):
    educator = register_and_login(client, role="educator")
    other_educator = register_and_login(client, role="educator")
    created = create_classroom(client, educator["token"], name="Robotics").json()

    resp = client.get(f"/api/v1/classrooms/{created['id']}/analytics", headers=auth_header(other_educator["token"]))
    assert resp.status_code == 403


def test_analytics_reflects_shared_video_and_watch_activity(client):
    educator = register_and_login(client, role="educator")
    learner = register_and_login(client, role="learner")
    created = create_classroom(client, educator["token"], name="Astronomy").json()
    join_classroom(client, learner["token"], created["invite_code"])

    video_id = upload_video(client, educator["token"], title="Orbits").json()["id"]
    try:
        client.post(
            f"/api/v1/videos/{video_id}/share-classroom",
            json={"classroom_id": created["id"]},
            headers=auth_header(educator["token"]),
        )
        client.post(
            f"/api/v1/videos/{video_id}/views",
            json={"watched_seconds": 30, "session_start": True},
            headers=auth_header(learner["token"]),
        )

        resp = client.get(f"/api/v1/classrooms/{created['id']}/analytics", headers=auth_header(educator["token"]))
        assert resp.status_code == 200
        data = resp.json()
        assert data["video_count"] == 1
        assert data["student_count"] == 1
        assert len(data["videos"]) == 1
        assert data["videos"][0]["students_watched"] == 1
        assert len(data["students"]) == 1
        assert data["students"][0]["videos_watched"] == 1
    finally:
        cleanup_collection("video_views", video_id)


# ---- DELETE /classrooms/{id} ----

def test_delete_classroom_requires_ownership(client):
    educator = register_and_login(client, role="educator")
    other_educator = register_and_login(client, role="educator")
    created = create_classroom(client, educator["token"], name="Poetry").json()

    resp = client.delete(f"/api/v1/classrooms/{created['id']}", headers=auth_header(other_educator["token"]))
    assert resp.status_code == 403


def test_delete_classroom_removes_it(client):
    educator = register_and_login(client, role="educator")
    created = create_classroom(client, educator["token"], name="Temporary").json()

    resp = client.delete(f"/api/v1/classrooms/{created['id']}", headers=auth_header(educator["token"]))
    assert resp.status_code == 204

    remaining = client.get("/api/v1/classrooms/mine", headers=auth_header(educator["token"])).json()
    assert not any(c["id"] == created["id"] for c in remaining)