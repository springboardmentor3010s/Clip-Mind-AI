# test_key_moments.py
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


def seed_transcript(video_id, owner_id, segments=None):
    """Insert a transcript doc with multiple segments (needed for TF-IDF/KMeans to run)."""
    import asyncio
    from datetime import datetime, timezone
    from motor.motor_asyncio import AsyncIOMotorClient
    from app.core.config import settings

    if segments is None:
        segments = [
            {"start": 0.0, "end": 5.0, "text": "Introduction to machine learning and neural networks."},
            {"start": 5.0, "end": 10.0, "text": "Neural networks and deep learning architectures."},
            {"start": 10.0, "end": 15.0, "text": "Cooking pasta with tomato sauce and basil."},
            {"start": 15.0, "end": 20.0, "text": "Italian cuisine and pasta recipes explained."},
            {"start": 20.0, "end": 25.0, "text": "Traveling to Japan and visiting Tokyo temples."},
            {"start": 25.0, "end": 30.0, "text": "Tokyo temples and Japanese culture overview."},
        ]

    async def _seed():
        mongo_client = AsyncIOMotorClient(settings.MONGO_URI)
        db = mongo_client[settings.MONGO_DB_NAME]
        full_text = " ".join(s["text"] for s in segments)
        doc = {
            "video_id": str(video_id),
            "owner_id": str(owner_id),
            "text": full_text,
            "segments": segments,
            "language": "en",
            "status": "done",
            "edited": False,
            "metrics": {
                "confidence_score": 0.95,
                "avg_no_speech_prob": 0.02,
                "segment_count": len(segments),
                "processing_time_seconds": 1.2,
            },
            "created_at": datetime.now(timezone.utc),
        }
        await db["transcripts"].update_one(
            {"video_id": str(video_id)}, {"$set": doc}, upsert=True
        )
        mongo_client.close()

    asyncio.run(_seed())


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


# ---- Generation guard ----

def test_generate_key_moments_fails_without_transcript(client):
    owner = register_and_login(client, role="content_creator")
    upload_resp = upload_video(client, owner["token"], title="No Transcript For KM")
    video_id = upload_resp.json()["id"]
    resp = client.post(f"/api/v1/videos/{video_id}/key-moments", headers=auth_header(owner["token"]))
    assert resp.status_code == 400


def test_generate_key_moments_requires_auth(client):
    fake_id = str(uuid.uuid4())
    resp = client.post(f"/api/v1/videos/{fake_id}/key-moments")
    assert resp.status_code in (401, 403)


def test_generate_key_moments_nonexistent_video_404(client):
    owner = register_and_login(client, role="content_creator")
    fake_id = str(uuid.uuid4())
    resp = client.post(f"/api/v1/videos/{fake_id}/key-moments", headers=auth_header(owner["token"]))
    assert resp.status_code == 404


def test_generate_key_moments_as_non_owner_fails(client):
    owner = register_and_login(client, role="content_creator")
    other = register_and_login(client, role="learner")
    upload_resp = upload_video(client, owner["token"], title="Not Yours For KM")
    video_id = upload_resp.json()["id"]
    seed_transcript(video_id, owner["user"]["id"])
    try:
        resp = client.post(f"/api/v1/videos/{video_id}/key-moments", headers=auth_header(other["token"]))
        assert resp.status_code in (403, 404)
    finally:
        cleanup_collection("transcripts", video_id)


# ---- Generation success ----

def test_generate_key_moments_success(client):
    owner = register_and_login(client, role="content_creator")
    upload_resp = upload_video(client, owner["token"], title="KM Vid")
    video_id = upload_resp.json()["id"]
    seed_transcript(video_id, owner["user"]["id"])

    try:
        resp = client.post(f"/api/v1/videos/{video_id}/key-moments", headers=auth_header(owner["token"]))
        assert resp.status_code == 200
        data = resp.json()
        assert data["video_id"] == video_id
        assert data["status"] == "done"
        assert len(data["keywords"]) > 0
        assert len(data["highlights"]) > 0
        assert len(data["topics"]) > 0
        # highlight shape sanity check
        h = data["highlights"][0]
        assert {"start", "end", "text", "importance_score", "keywords"} <= h.keys()
    finally:
        cleanup_collection("transcripts", video_id)
        cleanup_collection("key_moments", video_id)


def test_generate_key_moments_with_too_few_segments_returns_empty(client):
    owner = register_and_login(client, role="content_creator")
    upload_resp = upload_video(client, owner["token"], title="Single Segment Vid")
    video_id = upload_resp.json()["id"]
    seed_transcript(video_id, owner["user"]["id"], segments=[
        {"start": 0.0, "end": 2.0, "text": "Only one segment here."},
    ])

    try:
        resp = client.post(f"/api/v1/videos/{video_id}/key-moments", headers=auth_header(owner["token"]))
        assert resp.status_code == 200
        data = resp.json()
        assert data["keywords"] == []
        assert data["highlights"] == []
        assert data["topics"] == []
    finally:
        cleanup_collection("transcripts", video_id)
        cleanup_collection("key_moments", video_id)


# ---- GET key moments ----

def test_get_key_moments_not_generated_404(client):
    owner = register_and_login(client, role="content_creator")
    upload_resp = upload_video(client, owner["token"], title="No KM Yet")
    video_id = upload_resp.json()["id"]
    resp = client.get(f"/api/v1/videos/{video_id}/key-moments", headers=auth_header(owner["token"]))
    assert resp.status_code == 404


def test_get_key_moments_requires_auth(client):
    fake_id = str(uuid.uuid4())
    resp = client.get(f"/api/v1/videos/{fake_id}/key-moments")
    assert resp.status_code in (401, 403)


def test_get_key_moments_visible_to_non_owner_when_published(client):
    owner = register_and_login(client, role="content_creator")
    other = register_and_login(client, role="learner")
    upload_resp = upload_video(client, owner["token"], title="Published KM Vid")
    video_id = upload_resp.json()["id"]
    seed_transcript(video_id, owner["user"]["id"])

    try:
        client.post(f"/api/v1/videos/{video_id}/key-moments", headers=auth_header(owner["token"]))
        client.patch(
            f"/api/v1/videos/{video_id}/publish",
            json={"is_published": True},
            headers=auth_header(owner["token"]),
        )
        resp = client.get(f"/api/v1/videos/{video_id}/key-moments", headers=auth_header(other["token"]))
        assert resp.status_code == 200
        assert resp.json()["video_id"] == video_id
    finally:
        cleanup_collection("transcripts", video_id)
        cleanup_collection("key_moments", video_id)


def test_get_key_moments_hidden_from_unrelated_user_when_unpublished(client):
    owner = register_and_login(client, role="content_creator")
    other = register_and_login(client, role="learner")
    upload_resp = upload_video(client, owner["token"], title="Private KM Vid")
    video_id = upload_resp.json()["id"]
    seed_transcript(video_id, owner["user"]["id"])

    try:
        client.post(f"/api/v1/videos/{video_id}/key-moments", headers=auth_header(owner["token"]))
        resp = client.get(f"/api/v1/videos/{video_id}/key-moments", headers=auth_header(other["token"]))
        assert resp.status_code in (403, 404)
    finally:
        cleanup_collection("transcripts", video_id)
        cleanup_collection("key_moments", video_id)