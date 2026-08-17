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


def publish_video(client, token, video_id):
    return client.patch(
        f"/api/v1/videos/{video_id}/publish",
        json={"is_published": True},
        headers=auth_header(token),
    )


def cleanup_collection(collection_name, video_id):
    """Delete Mongo docs for a video_id from the given collection."""
    import asyncio
    from motor.motor_asyncio import AsyncIOMotorClient
    from app.core.config import settings

    async def _cleanup():
        mongo_client = AsyncIOMotorClient(settings.MONGO_URI)
        db = mongo_client[settings.MONGO_DB_NAME]
        await db[collection_name].delete_many({"video_id": str(video_id)})
        mongo_client.close()

    asyncio.run(_cleanup())


def cleanup_bookmarks_for_owner(owner_id):
    """Delete Mongo bookmark docs by owner_id (bookmarks are keyed by owner, not video)."""
    import asyncio
    from motor.motor_asyncio import AsyncIOMotorClient
    from app.core.config import settings

    async def _cleanup():
        mongo_client = AsyncIOMotorClient(settings.MONGO_URI)
        db = mongo_client[settings.MONGO_DB_NAME]
        await db["bookmarks"].delete_many({"owner_id": str(owner_id)})
        mongo_client.close()

    asyncio.run(_cleanup())


def seed_transcript(video_id, owner_id, text="Hello world, this is a test transcript."):
    import asyncio
    from datetime import datetime, timezone
    from motor.motor_asyncio import AsyncIOMotorClient
    from app.core.config import settings

    async def _seed():
        mongo_client = AsyncIOMotorClient(settings.MONGO_URI)
        db = mongo_client[settings.MONGO_DB_NAME]
        doc = {
            "video_id": str(video_id),
            "owner_id": str(owner_id),
            "text": text,
            "segments": [{"start": 0.0, "end": 2.5, "text": text}],
            "language": "en",
            "status": "done",
            "edited": False,
            "metrics": {
                "confidence_score": 0.95,
                "avg_no_speech_prob": 0.02,
                "segment_count": 1,
                "processing_time_seconds": 1.2,
            },
            "created_at": datetime.now(timezone.utc),
        }
        await db["transcripts"].update_one(
            {"video_id": str(video_id)}, {"$set": doc}, upsert=True
        )
        mongo_client.close()

    asyncio.run(_seed())


def seed_summary(video_id, short="Short summary text.", detailed="Detailed summary text."):
    import asyncio
    from datetime import datetime, timezone
    from motor.motor_asyncio import AsyncIOMotorClient
    from app.core.config import settings

    async def _seed():
        mongo_client = AsyncIOMotorClient(settings.MONGO_URI)
        db = mongo_client[settings.MONGO_DB_NAME]
        doc = {
            "video_id": str(video_id),
            "status": "done",
            "short_summary": short,
            "detailed_summary": detailed,
            "created_at": datetime.now(timezone.utc),
        }
        await db["summaries"].update_one(
            {"video_id": str(video_id)}, {"$set": doc}, upsert=True
        )
        mongo_client.close()

    asyncio.run(_seed())


def seed_key_moments(video_id, highlights=None):
    import asyncio
    from datetime import datetime, timezone
    from motor.motor_asyncio import AsyncIOMotorClient
    from app.core.config import settings

    if highlights is None:
        highlights = [
            {
                "start": 5.0,
                "end": 10.0,
                "text": "Neural networks and deep learning architectures.",
                "importance_score": 0.9,
                "keywords": ["neural", "networks"],
            }
        ]

    async def _seed():
        mongo_client = AsyncIOMotorClient(settings.MONGO_URI)
        db = mongo_client[settings.MONGO_DB_NAME]
        doc = {
            "video_id": str(video_id),
            "status": "done",
            "keywords": ["neural", "networks"],
            "topics": ["machine learning"],
            "highlights": highlights,
            "created_at": datetime.now(timezone.utc),
        }
        await db["key_moments"].update_one(
            {"video_id": str(video_id)}, {"$set": doc}, upsert=True
        )
        mongo_client.close()

    asyncio.run(_seed())


def add_bookmark(client, token, video_id, type="video", variant=None, start=None):
    payload = {"video_id": video_id, "type": type}
    if variant is not None:
        payload["variant"] = variant
    if start is not None:
        payload["start"] = start
    return client.post("/api/v1/bookmarks", json=payload, headers=auth_header(token))


# ---- Create: video bookmarks ----

def test_add_video_bookmark_requires_auth(client):
    fake_id = str(uuid.uuid4())
    resp = client.post("/api/v1/bookmarks", json={"video_id": fake_id, "type": "video"})
    assert resp.status_code in (401, 403)


def test_add_video_bookmark_success(client):
    owner = register_and_login(client, role="content_creator")
    upload_resp = upload_video(client, owner["token"], title="Bookmarked Vid")
    video_id = upload_resp.json()["id"]
    try:
        resp = add_bookmark(client, owner["token"], video_id, type="video")
        assert resp.status_code == 201
        data = resp.json()
        assert data["video_id"] == video_id
        assert data["video_title"] == "Bookmarked Vid"
        assert data["type"] == "video"
        assert data["variant"] is None
        assert data["start"] is None
        assert "id" in data and "created_at" in data
    finally:
        cleanup_bookmarks_for_owner(owner["user"]["id"])


def test_add_bookmark_nonexistent_video_404(client):
    owner = register_and_login(client, role="content_creator")
    fake_id = str(uuid.uuid4())
    resp = add_bookmark(client, owner["token"], fake_id, type="video")
    assert resp.status_code == 404


def test_add_bookmark_on_unpublished_video_by_other_user_fails(client):
    owner = register_and_login(client, role="content_creator")
    other = register_and_login(client, role="learner")
    upload_resp = upload_video(client, owner["token"], title="Private Bookmark Vid")
    video_id = upload_resp.json()["id"]
    resp = add_bookmark(client, other["token"], video_id, type="video")
    assert resp.status_code in (403, 404)


def test_add_bookmark_on_published_video_by_other_user_succeeds(client):
    owner = register_and_login(client, role="content_creator")
    viewer = register_and_login(client, role="learner")
    upload_resp = upload_video(client, owner["token"], title="Published Bookmark Vid")
    video_id = upload_resp.json()["id"]
    publish_video(client, owner["token"], video_id)
    try:
        resp = add_bookmark(client, viewer["token"], video_id, type="video")
        assert resp.status_code == 201
        assert resp.json()["video_id"] == video_id
    finally:
        cleanup_bookmarks_for_owner(viewer["user"]["id"])


def test_add_bookmark_on_shared_video_by_recipient_succeeds(client):
    owner = register_and_login(client, role="content_creator")
    recipient = register_and_login(client, role="learner")
    upload_resp = upload_video(client, owner["token"], title="Shared Bookmark Vid")
    video_id = upload_resp.json()["id"]
    client.post(
        f"/api/v1/videos/{video_id}/share",
        json={"emails": [recipient["email"]]},
        headers=auth_header(owner["token"]),
    )
    try:
        resp = add_bookmark(client, recipient["token"], video_id, type="video")
        assert resp.status_code == 201
    finally:
        cleanup_bookmarks_for_owner(recipient["user"]["id"])


def test_add_duplicate_video_bookmark_fails(client):
    owner = register_and_login(client, role="content_creator")
    upload_resp = upload_video(client, owner["token"], title="Dup Bookmark Vid")
    video_id = upload_resp.json()["id"]
    try:
        first = add_bookmark(client, owner["token"], video_id, type="video")
        assert first.status_code == 201
        second = add_bookmark(client, owner["token"], video_id, type="video")
        assert second.status_code == 409
    finally:
        cleanup_bookmarks_for_owner(owner["user"]["id"])


def test_two_users_can_each_bookmark_the_same_video(client):
    owner = register_and_login(client, role="content_creator")
    viewer = register_and_login(client, role="learner")
    upload_resp = upload_video(client, owner["token"], title="Multi Bookmark Vid")
    video_id = upload_resp.json()["id"]
    publish_video(client, owner["token"], video_id)
    try:
        resp_owner = add_bookmark(client, owner["token"], video_id, type="video")
        resp_viewer = add_bookmark(client, viewer["token"], video_id, type="video")
        assert resp_owner.status_code == 201
        assert resp_viewer.status_code == 201
    finally:
        cleanup_bookmarks_for_owner(owner["user"]["id"])
        cleanup_bookmarks_for_owner(viewer["user"]["id"])


# ---- Create: summary bookmarks ----

def test_add_summary_bookmark_without_variant_fails_validation(client):
    owner = register_and_login(client, role="content_creator")
    upload_resp = upload_video(client, owner["token"], title="Summary No Variant Vid")
    video_id = upload_resp.json()["id"]
    resp = client.post(
        "/api/v1/bookmarks",
        json={"video_id": video_id, "type": "summary"},
        headers=auth_header(owner["token"]),
    )
    assert resp.status_code == 422


def test_add_summary_bookmark_without_generated_summary_fails(client):
    owner = register_and_login(client, role="content_creator")
    upload_resp = upload_video(client, owner["token"], title="No Summary Yet Vid")
    video_id = upload_resp.json()["id"]
    resp = add_bookmark(client, owner["token"], video_id, type="summary", variant="short")
    assert resp.status_code == 400


def test_add_summary_bookmark_short_variant_success(client):
    owner = register_and_login(client, role="content_creator")
    upload_resp = upload_video(client, owner["token"], title="Summary Bookmark Vid")
    video_id = upload_resp.json()["id"]
    seed_summary(video_id, short="Short version.", detailed="Detailed version.")
    try:
        resp = add_bookmark(client, owner["token"], video_id, type="summary", variant="short")
        assert resp.status_code == 201
        data = resp.json()
        assert data["type"] == "summary"
        assert data["variant"] == "short"
        assert data["text"] == "Short version."
    finally:
        cleanup_collection("summaries", video_id)
        cleanup_bookmarks_for_owner(owner["user"]["id"])


def test_add_summary_bookmark_detailed_variant_success(client):
    owner = register_and_login(client, role="content_creator")
    upload_resp = upload_video(client, owner["token"], title="Summary Bookmark Vid 2")
    video_id = upload_resp.json()["id"]
    seed_summary(video_id, short="Short version.", detailed="Detailed version.")
    try:
        resp = add_bookmark(client, owner["token"], video_id, type="summary", variant="detailed")
        assert resp.status_code == 201
        data = resp.json()
        assert data["variant"] == "detailed"
        assert data["text"] == "Detailed version."
    finally:
        cleanup_collection("summaries", video_id)
        cleanup_bookmarks_for_owner(owner["user"]["id"])


def test_short_and_detailed_summary_bookmarks_are_independent(client):
    owner = register_and_login(client, role="content_creator")
    upload_resp = upload_video(client, owner["token"], title="Summary Bookmark Vid 3")
    video_id = upload_resp.json()["id"]
    seed_summary(video_id, short="Short version.", detailed="Detailed version.")
    try:
        resp_short = add_bookmark(client, owner["token"], video_id, type="summary", variant="short")
        resp_detailed = add_bookmark(client, owner["token"], video_id, type="summary", variant="detailed")
        assert resp_short.status_code == 201
        assert resp_detailed.status_code == 201
    finally:
        cleanup_collection("summaries", video_id)
        cleanup_bookmarks_for_owner(owner["user"]["id"])


# ---- Create: highlight bookmarks ----

def test_add_highlight_bookmark_without_start_fails_validation(client):
    owner = register_and_login(client, role="content_creator")
    upload_resp = upload_video(client, owner["token"], title="Highlight No Start Vid")
    video_id = upload_resp.json()["id"]
    resp = client.post(
        "/api/v1/bookmarks",
        json={"video_id": video_id, "type": "highlight"},
        headers=auth_header(owner["token"]),
    )
    assert resp.status_code == 422


def test_add_highlight_bookmark_without_generated_key_moments_fails(client):
    owner = register_and_login(client, role="content_creator")
    upload_resp = upload_video(client, owner["token"], title="No Key Moments Yet Vid")
    video_id = upload_resp.json()["id"]
    resp = add_bookmark(client, owner["token"], video_id, type="highlight", start=5.0)
    assert resp.status_code == 400


def test_add_highlight_bookmark_with_unmatched_start_fails(client):
    owner = register_and_login(client, role="content_creator")
    upload_resp = upload_video(client, owner["token"], title="Unmatched Highlight Vid")
    video_id = upload_resp.json()["id"]
    seed_key_moments(video_id)
    try:
        resp = add_bookmark(client, owner["token"], video_id, type="highlight", start=999.0)
        assert resp.status_code == 400
    finally:
        cleanup_collection("key_moments", video_id)


def test_add_highlight_bookmark_success(client):
    owner = register_and_login(client, role="content_creator")
    upload_resp = upload_video(client, owner["token"], title="Highlight Bookmark Vid")
    video_id = upload_resp.json()["id"]
    seed_key_moments(video_id, highlights=[
        {
            "start": 5.0,
            "end": 10.0,
            "text": "Neural networks explained.",
            "importance_score": 0.8,
            "keywords": ["neural", "networks"],
        }
    ])
    try:
        resp = add_bookmark(client, owner["token"], video_id, type="highlight", start=5.0)
        assert resp.status_code == 201
        data = resp.json()
        assert data["type"] == "highlight"
        assert data["start"] == 5.0
        assert data["end"] == 10.0
        assert data["text"] == "Neural networks explained."
        assert data["keywords"] == ["neural", "networks"]
    finally:
        cleanup_collection("key_moments", video_id)
        cleanup_bookmarks_for_owner(owner["user"]["id"])


# ---- List ----

def test_list_bookmarks_requires_auth(client):
    resp = client.get("/api/v1/bookmarks")
    assert resp.status_code in (401, 403)


def test_list_bookmarks_returns_only_own(client):
    user_a = register_and_login(client, role="content_creator")
    user_b = register_and_login(client, role="content_creator")
    vid_a = upload_video(client, user_a["token"], title="A Vid").json()["id"]
    vid_b = upload_video(client, user_b["token"], title="B Vid").json()["id"]
    try:
        add_bookmark(client, user_a["token"], vid_a, type="video")
        add_bookmark(client, user_b["token"], vid_b, type="video")

        resp = client.get("/api/v1/bookmarks", headers=auth_header(user_a["token"]))
        assert resp.status_code == 200
        video_ids = [b["video_id"] for b in resp.json()]
        assert vid_a in video_ids
        assert vid_b not in video_ids
    finally:
        cleanup_bookmarks_for_owner(user_a["user"]["id"])
        cleanup_bookmarks_for_owner(user_b["user"]["id"])


def test_list_bookmarks_filtered_by_video_id(client):
    owner = register_and_login(client, role="content_creator")
    vid_1 = upload_video(client, owner["token"], title="Filter Vid 1").json()["id"]
    vid_2 = upload_video(client, owner["token"], title="Filter Vid 2").json()["id"]
    try:
        add_bookmark(client, owner["token"], vid_1, type="video")
        add_bookmark(client, owner["token"], vid_2, type="video")

        resp = client.get(
            "/api/v1/bookmarks",
            params={"video_id": vid_1},
            headers=auth_header(owner["token"]),
        )
        assert resp.status_code == 200
        data = resp.json()
        assert len(data) == 1
        assert data[0]["video_id"] == vid_1
    finally:
        cleanup_bookmarks_for_owner(owner["user"]["id"])


def test_list_bookmarks_empty_for_new_user(client):
    user = register_and_login(client, role="learner")
    resp = client.get("/api/v1/bookmarks", headers=auth_header(user["token"]))
    assert resp.status_code == 200
    assert resp.json() == []


def test_list_bookmarks_most_recent_first(client):
    owner = register_and_login(client, role="content_creator")
    vid_1 = upload_video(client, owner["token"], title="Order Vid 1").json()["id"]
    vid_2 = upload_video(client, owner["token"], title="Order Vid 2").json()["id"]
    try:
        add_bookmark(client, owner["token"], vid_1, type="video")
        add_bookmark(client, owner["token"], vid_2, type="video")

        resp = client.get("/api/v1/bookmarks", headers=auth_header(owner["token"]))
        data = resp.json()
        assert data[0]["video_id"] == vid_2
        assert data[1]["video_id"] == vid_1
    finally:
        cleanup_bookmarks_for_owner(owner["user"]["id"])


# ---- Delete ----

def test_delete_bookmark_requires_auth(client):
    resp = client.delete(f"/api/v1/bookmarks/{uuid.uuid4()}")
    assert resp.status_code in (401, 403)


def test_delete_nonexistent_bookmark_404(client):
    owner = register_and_login(client, role="content_creator")
    resp = client.delete(f"/api/v1/bookmarks/{uuid.uuid4()}", headers=auth_header(owner["token"]))
    assert resp.status_code == 404


def test_delete_bookmark_as_owner_succeeds(client):
    owner = register_and_login(client, role="content_creator")
    upload_resp = upload_video(client, owner["token"], title="Delete Bookmark Vid")
    video_id = upload_resp.json()["id"]
    bookmark_id = add_bookmark(client, owner["token"], video_id, type="video").json()["id"]

    resp = client.delete(f"/api/v1/bookmarks/{bookmark_id}", headers=auth_header(owner["token"]))
    assert resp.status_code == 204

    listing = client.get("/api/v1/bookmarks", headers=auth_header(owner["token"])).json()
    assert bookmark_id not in [b["id"] for b in listing]


def test_delete_another_users_bookmark_fails(client):
    owner = register_and_login(client, role="content_creator")
    other = register_and_login(client, role="learner")
    upload_resp = upload_video(client, owner["token"], title="Not Your Bookmark Vid")
    video_id = upload_resp.json()["id"]
    bookmark_id = add_bookmark(client, owner["token"], video_id, type="video").json()["id"]
    try:
        resp = client.delete(f"/api/v1/bookmarks/{bookmark_id}", headers=auth_header(other["token"]))
        assert resp.status_code == 404

        listing = client.get("/api/v1/bookmarks", headers=auth_header(owner["token"])).json()
        assert bookmark_id in [b["id"] for b in listing]
    finally:
        cleanup_bookmarks_for_owner(owner["user"]["id"])


def test_deleting_bookmark_allows_rebookmarking_same_target(client):
    owner = register_and_login(client, role="content_creator")
    upload_resp = upload_video(client, owner["token"], title="Rebookmark Vid")
    video_id = upload_resp.json()["id"]
    try:
        first = add_bookmark(client, owner["token"], video_id, type="video")
        bookmark_id = first.json()["id"]
        client.delete(f"/api/v1/bookmarks/{bookmark_id}", headers=auth_header(owner["token"]))

        second = add_bookmark(client, owner["token"], video_id, type="video")
        assert second.status_code == 201
    finally:
        cleanup_bookmarks_for_owner(owner["user"]["id"])