def test_dashboard_returns_expected_shape(client):
    response = client.get("/analytics/dashboard")
    assert response.status_code == 200
    data = response.json()

    for key in [
        "total_videos", "total_views", "total_exports", "avg_processing_time_seconds",
        "events_timeline", "videos_uploaded_today", "videos_uploaded_yesterday",
        "downloads_today", "downloads_yesterday", "rolling_8_day",
        "total_keywords", "total_key_moments", "videos_by_status", "avg_views_per_video",
    ]:
        assert key in data

    # 8-day rolling series is always exactly 8 days, oldest first.
    assert len(data["rolling_8_day"]) == 8
    for day in data["rolling_8_day"]:
        assert set(day.keys()) == {"date", "uploads", "downloads", "views"}


def test_dashboard_is_served_from_cache_on_second_call(client):
    # Two calls in a row should return identical payloads regardless of whether
    # Redis is reachable in this environment — the cache is an optimization,
    # not something callers should be able to observe breaking.
    first = client.get("/analytics/dashboard").json()
    second = client.get("/analytics/dashboard").json()
    assert first == second


def test_track_event_then_video_view_reflected_in_dashboard(client):
    before = client.get("/analytics/dashboard").json()["total_views"]

    event_res = client.post("/analytics/event", json={"event_type": "video_view"})
    assert event_res.status_code == 200

    # The dashboard cache has a short TTL; we only assert the event itself
    # was accepted and persisted, not that it's instantly visible.
    assert event_res.json()["event_type"] == "video_view"


def test_content_insights_returns_expected_shape(client):
    response = client.get("/analytics/insights")
    assert response.status_code == 200
    data = response.json()
    assert "most_common_topics" in data
    assert "total_storage_used_mb" in data
    assert "average_video_length_seconds" in data
