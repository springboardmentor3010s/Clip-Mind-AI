from unittest.mock import patch

from tests.conftest import auth_headers

@patch("app.api.summary.process_summary_background")
def test_summary_generate_queues_background_task(mock_bg_process, client, creator_token):
    """Triggering summarization should queue the background task rather than
    running Whisper/DistilBART synchronously inside the request."""
    req_data = {
        "video_id": 1,
        "text": "This is a mocked transcript for integration testing."
    }
    response = client.post("/summary/generate", json=req_data, headers=auth_headers(creator_token))

    assert response.status_code == 200
    assert response.json()["video_id"] == 1

    mock_bg_process.assert_called_once_with(1, req_data["text"])

def test_summary_generate_requires_content_manager_role(client, learner_token):
    """A Learner (read-only role) must not be able to trigger generation."""
    response = client.post(
        "/summary/generate",
        json={"video_id": 1, "text": "..."},
        headers=auth_headers(learner_token),
    )
    assert response.status_code == 403

def test_summary_generate_requires_auth(client):
    response = client.post("/summary/generate", json={"video_id": 1, "text": "..."})
    assert response.status_code == 401

@patch("app.api.key_moments.background_generate_key_moments")
def test_key_moments_generate_requires_transcript(mock_bg_process, client, creator_token):
    """Key moment extraction should refuse to start without transcript segments,
    rather than queuing a background task that will just fail."""
    response = client.post(
        "/key-moments/generate",
        json={"video_id": 999999},
        headers=auth_headers(creator_token),
    )

    assert response.status_code == 400
    mock_bg_process.assert_not_called()
