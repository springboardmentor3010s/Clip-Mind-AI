"""
Video pipeline, RBAC, sharing, bookmarks, history, search and transcript-editing tests.

The AI provider and Celery are never invoked here — `process_video_task.delay`
is patched so upload tests exercise the API contract, not the network.
"""
from unittest.mock import patch

from django.core.files.uploadedfile import SimpleUploadedFile
from rest_framework import status
from rest_framework.test import APITestCase

from apps.accounts.models import User, ActivityLog
from apps.videos.models import Video, VideoShare, Bookmark, LearningHistory, VideoView
from apps.transcripts.models import Transcript
from apps.summaries.models import Summary, KeyMoment, LearningMaterial

STRONG = "StrongPass1!"

# Minimal but structurally valid MP4 header (ISO-BMFF 'ftyp' box) so the
# magic-byte validator accepts the upload.
MP4_BYTES = b"\x00\x00\x00\x20ftypisom\x00\x00\x02\x00isomiso2avc1mp41" + b"\x00" * 64


def make_user(email, role=User.Role.CONTENT_CREATOR):
    return User.objects.create_user(
        email=email, password=STRONG, first_name=email.split("@")[0], role=role
    )


def make_video(user, title="Test Video", status_=Video.Status.COMPLETED, with_ai=True):
    video = Video.objects.create(
        user=user, title=title, status=status_, progress=100,
        duration_seconds=120.0, youtube_id="abc12345678",
    )
    if with_ai:
        Transcript.objects.create(
            video=video,
            content="The mitochondria is the powerhouse of the cell. Photosynthesis follows.",
            segments=[
                {"start": 0.0, "duration": 5.0, "text": "The mitochondria is the powerhouse of the cell."},
                {"start": 5.0, "duration": 5.0, "text": "Photosynthesis follows."},
            ],
            word_count=11,
        )
        Summary.objects.create(
            video=video,
            content='{"short_summary": "Cells.", "detailed_summary": "About cells.",'
                    ' "important_topics": ["biology", "cells"],'
                    ' "glossary": [{"term": "Mitochondria", "definition": "Organelle"}],'
                    ' "key_questions": [{"question": "What is a cell?", "answer": "A unit of life"}],'
                    ' "bullet_summary": ["Point one"], "chapter_summary": [], "action_items": []}',
            word_count=2,
        )
        KeyMoment.objects.create(video=video, title="Intro", timestamp_seconds=0.0, order=0)
    return video


class UploadPermissionTests(APITestCase):
    """Learners are read-only consumers and must not be able to upload."""

    def setUp(self):
        self.creator = make_user("creator@t.com", User.Role.CONTENT_CREATOR)
        self.educator = make_user("educator@t.com", User.Role.EDUCATOR)
        self.learner = make_user("learner@t.com", User.Role.LEARNER)

    def _upload(self):
        return self.client.post(
            "/api/v1/videos/upload",
            {"file": SimpleUploadedFile("clip.mp4", MP4_BYTES, content_type="video/mp4")},
            format="multipart",
        )

    @patch("apps.videos.views.process_video_task.delay")
    def test_creator_can_upload(self, mock_delay):
        self.client.force_authenticate(self.creator)
        res = self._upload()
        self.assertEqual(res.status_code, status.HTTP_201_CREATED)
        mock_delay.assert_called_once()

    @patch("apps.videos.views.process_video_task.delay")
    def test_educator_can_upload(self, mock_delay):
        self.client.force_authenticate(self.educator)
        self.assertEqual(self._upload().status_code, status.HTTP_201_CREATED)

    @patch("apps.videos.views.process_video_task.delay")
    def test_learner_cannot_upload(self, mock_delay):
        self.client.force_authenticate(self.learner)
        self.assertEqual(self._upload().status_code, status.HTTP_403_FORBIDDEN)
        mock_delay.assert_not_called()

    @patch("apps.videos.views.process_video_task.delay")
    def test_learner_cannot_submit_youtube(self, mock_delay):
        self.client.force_authenticate(self.learner)
        res = self.client.post("/api/v1/videos/youtube",
                               {"url": "https://www.youtube.com/watch?v=dQw4w9WgXcQ"}, format="json")
        self.assertEqual(res.status_code, status.HTTP_403_FORBIDDEN)

    def test_anonymous_cannot_upload(self):
        self.assertEqual(self._upload().status_code, status.HTTP_401_UNAUTHORIZED)

    @patch("apps.videos.views.process_video_task.delay")
    def test_rejects_non_video_content(self, mock_delay):
        """A renamed non-video must fail the magic-byte check."""
        self.client.force_authenticate(self.creator)
        res = self.client.post(
            "/api/v1/videos/upload",
            {"file": SimpleUploadedFile("evil.mp4", b"MZ\x90\x00" + b"\x00" * 64,
                                        content_type="video/mp4")},
            format="multipart",
        )
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)
        mock_delay.assert_not_called()

    @patch("apps.videos.views.process_video_task.delay")
    def test_rejects_bad_extension(self, mock_delay):
        self.client.force_authenticate(self.creator)
        res = self.client.post(
            "/api/v1/videos/upload",
            {"file": SimpleUploadedFile("doc.pdf", MP4_BYTES, content_type="application/pdf")},
            format="multipart",
        )
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)

    def test_rejects_invalid_youtube_url(self):
        self.client.force_authenticate(self.creator)
        res = self.client.post("/api/v1/videos/youtube",
                               {"url": "https://evil.com/watch?v=x"}, format="json")
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)

    @patch("apps.videos.views.process_video_task.delay")
    def test_upload_records_activity(self, mock_delay):
        self.client.force_authenticate(self.creator)
        self._upload()
        self.assertTrue(
            ActivityLog.objects.filter(user=self.creator, action=ActivityLog.Action.UPLOAD).exists()
        )


class VideoIsolationTests(APITestCase):
    """A user must never see or mutate another user's unshared video."""

    def setUp(self):
        self.alice = make_user("alice@t.com")
        self.bob = make_user("bob@t.com")
        self.admin = make_user("admin@t.com", User.Role.ADMIN)
        self.video = make_video(self.alice, "Alice private")

    def test_owner_sees_own_video(self):
        self.client.force_authenticate(self.alice)
        res = self.client.get(f"/api/v1/videos/{self.video.id}")
        self.assertEqual(res.status_code, status.HTTP_200_OK)

    def test_other_user_gets_404(self):
        self.client.force_authenticate(self.bob)
        res = self.client.get(f"/api/v1/videos/{self.video.id}")
        self.assertEqual(res.status_code, status.HTTP_404_NOT_FOUND)

    def test_other_user_cannot_delete(self):
        self.client.force_authenticate(self.bob)
        res = self.client.delete(f"/api/v1/videos/{self.video.id}")
        self.assertEqual(res.status_code, status.HTTP_404_NOT_FOUND)
        self.assertTrue(Video.objects.filter(id=self.video.id).exists())

    def test_list_excludes_other_users_videos(self):
        self.client.force_authenticate(self.bob)
        res = self.client.get("/api/v1/videos/")
        self.assertEqual(res.data["data"], [])

    def test_admin_can_see_all_videos(self):
        self.client.force_authenticate(self.admin)
        res = self.client.get("/api/v1/videos/")
        self.assertEqual(len(res.data["data"]), 1)

    def test_owner_can_delete(self):
        self.client.force_authenticate(self.alice)
        res = self.client.delete(f"/api/v1/videos/{self.video.id}")
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertFalse(Video.objects.filter(id=self.video.id).exists())


class SharingTests(APITestCase):
    def setUp(self):
        self.educator = make_user("edu@t.com", User.Role.EDUCATOR)
        self.learner = make_user("stu@t.com", User.Role.LEARNER)
        self.outsider = make_user("out@t.com", User.Role.LEARNER)
        self.video = make_video(self.educator, "Lecture 1")

    def test_owner_can_share_and_learner_sees_it(self):
        self.client.force_authenticate(self.educator)
        res = self.client.post(f"/api/v1/videos/{self.video.id}/share", {}, format="json")
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertTrue(res.data["data"]["token"])

        self.client.force_authenticate(self.learner)
        lib = self.client.get("/api/v1/videos/library")
        self.assertEqual(len(lib.data["data"]), 1)
        detail = self.client.get(f"/api/v1/videos/{self.video.id}")
        self.assertEqual(detail.status_code, status.HTTP_200_OK)

    def test_restricted_share_excludes_non_recipients(self):
        self.client.force_authenticate(self.educator)
        self.client.post(f"/api/v1/videos/{self.video.id}/share",
                         {"emails": [self.learner.email]}, format="json")

        self.client.force_authenticate(self.learner)
        self.assertEqual(len(self.client.get("/api/v1/videos/library").data["data"]), 1)

        self.client.force_authenticate(self.outsider)
        self.assertEqual(len(self.client.get("/api/v1/videos/library").data["data"]), 0)
        self.assertEqual(
            self.client.get(f"/api/v1/videos/{self.video.id}").status_code,
            status.HTTP_404_NOT_FOUND,
        )

    def test_learner_cannot_share_someone_elses_video(self):
        self.client.force_authenticate(self.learner)
        res = self.client.post(f"/api/v1/videos/{self.video.id}/share", {}, format="json")
        self.assertEqual(res.status_code, status.HTTP_404_NOT_FOUND)

    def test_shared_learner_still_cannot_delete(self):
        self.client.force_authenticate(self.educator)
        self.client.post(f"/api/v1/videos/{self.video.id}/share", {}, format="json")
        self.client.force_authenticate(self.learner)
        res = self.client.delete(f"/api/v1/videos/{self.video.id}")
        self.assertEqual(res.status_code, status.HTTP_404_NOT_FOUND)
        self.assertTrue(Video.objects.filter(id=self.video.id).exists())

    def test_public_share_page_is_anonymous(self):
        self.client.force_authenticate(self.educator)
        token = self.client.post(f"/api/v1/videos/{self.video.id}/share",
                                 {}, format="json").data["data"]["token"]
        self.client.force_authenticate(user=None)
        res = self.client.get(f"/api/v1/videos/shared/{token}")
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertEqual(res.data["data"]["title"], "Lecture 1")
        # The public payload must not leak owner contact details.
        self.assertNotIn("owner_email", res.data["data"])

    def test_revoked_share_breaks_public_link(self):
        self.client.force_authenticate(self.educator)
        token = self.client.post(f"/api/v1/videos/{self.video.id}/share",
                                 {}, format="json").data["data"]["token"]
        self.client.delete(f"/api/v1/videos/{self.video.id}/share")
        self.client.force_authenticate(user=None)
        self.assertEqual(
            self.client.get(f"/api/v1/videos/shared/{token}").status_code,
            status.HTTP_404_NOT_FOUND,
        )

    def test_private_share_is_not_publicly_readable(self):
        self.client.force_authenticate(self.educator)
        token = self.client.post(f"/api/v1/videos/{self.video.id}/share",
                                 {"is_public": False}, format="json").data["data"]["token"]
        self.client.force_authenticate(user=None)
        self.assertEqual(
            self.client.get(f"/api/v1/videos/shared/{token}").status_code,
            status.HTTP_404_NOT_FOUND,
        )

    def test_invalid_token_404s(self):
        self.assertEqual(
            self.client.get("/api/v1/videos/shared/not-a-real-token").status_code,
            status.HTTP_404_NOT_FOUND,
        )

    def test_cannot_share_unprocessed_video(self):
        pending = make_video(self.educator, "Pending", status_=Video.Status.PENDING, with_ai=False)
        self.client.force_authenticate(self.educator)
        res = self.client.post(f"/api/v1/videos/{pending.id}/share", {}, format="json")
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)

    def test_resharing_keeps_the_same_token(self):
        self.client.force_authenticate(self.educator)
        url = f"/api/v1/videos/{self.video.id}/share"
        first = self.client.post(url, {}, format="json").data["data"]["token"]
        second = self.client.post(url, {"note": "updated"}, format="json").data["data"]["token"]
        self.assertEqual(first, second)


class BookmarkAndHistoryTests(APITestCase):
    def setUp(self):
        self.creator = make_user("c@t.com")
        self.learner = make_user("l@t.com", User.Role.LEARNER)
        self.video = make_video(self.creator)
        VideoShare.objects.create(video=self.video, owner=self.creator, token="tok-abc", is_public=True)

    def test_learner_can_bookmark_shared_video(self):
        self.client.force_authenticate(self.learner)
        res = self.client.post("/api/v1/videos/bookmarks",
                               {"video_id": str(self.video.id), "note": "Great"}, format="json")
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertTrue(Bookmark.objects.filter(user=self.learner, video=self.video).exists())

    def test_bookmark_is_idempotent(self):
        self.client.force_authenticate(self.learner)
        payload = {"video_id": str(self.video.id)}
        self.client.post("/api/v1/videos/bookmarks", payload, format="json")
        self.client.post("/api/v1/videos/bookmarks", payload, format="json")
        self.assertEqual(Bookmark.objects.filter(user=self.learner).count(), 1)

    def test_timestamped_bookmarks_are_distinct(self):
        self.client.force_authenticate(self.learner)
        self.client.post("/api/v1/videos/bookmarks",
                         {"video_id": str(self.video.id), "timestamp_seconds": 10}, format="json")
        self.client.post("/api/v1/videos/bookmarks",
                         {"video_id": str(self.video.id), "timestamp_seconds": 42}, format="json")
        self.assertEqual(Bookmark.objects.filter(user=self.learner).count(), 2)

    def test_cannot_bookmark_unshared_video(self):
        private = make_video(self.creator, "Private")
        self.client.force_authenticate(self.learner)
        res = self.client.post("/api/v1/videos/bookmarks",
                               {"video_id": str(private.id)}, format="json")
        self.assertEqual(res.status_code, status.HTTP_404_NOT_FOUND)

    def test_bookmarks_are_private_per_user(self):
        Bookmark.objects.create(user=self.creator, video=self.video)
        self.client.force_authenticate(self.learner)
        self.assertEqual(self.client.get("/api/v1/videos/bookmarks").data["data"], [])

    def test_delete_bookmark(self):
        bookmark = Bookmark.objects.create(user=self.learner, video=self.video)
        self.client.force_authenticate(self.learner)
        res = self.client.delete(f"/api/v1/videos/bookmarks/{bookmark.id}")
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertFalse(Bookmark.objects.filter(id=bookmark.id).exists())

    def test_cannot_delete_another_users_bookmark(self):
        bookmark = Bookmark.objects.create(user=self.creator, video=self.video)
        self.client.force_authenticate(self.learner)
        res = self.client.delete(f"/api/v1/videos/bookmarks/{bookmark.id}")
        self.assertEqual(res.status_code, status.HTTP_404_NOT_FOUND)
        self.assertTrue(Bookmark.objects.filter(id=bookmark.id).exists())

    def test_view_event_creates_history(self):
        self.client.force_authenticate(self.learner)
        res = self.client.post(f"/api/v1/videos/{self.video.id}/view",
                               {"position_seconds": 30}, format="json")
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        history = LearningHistory.objects.get(user=self.learner, video=self.video)
        self.assertEqual(history.view_count, 1)
        self.assertFalse(history.completed)

    def test_repeat_views_increment_and_mark_completion(self):
        self.client.force_authenticate(self.learner)
        url = f"/api/v1/videos/{self.video.id}/view"
        self.client.post(url, {"position_seconds": 10}, format="json")
        self.client.post(url, {"position_seconds": 115}, format="json")  # >90% of 120s
        history = LearningHistory.objects.get(user=self.learner, video=self.video)
        self.assertEqual(history.view_count, 2)
        self.assertTrue(history.completed)
        self.assertEqual(VideoView.objects.filter(video=self.video).count(), 2)

    def test_history_listing_and_clear(self):
        self.client.force_authenticate(self.learner)
        self.client.post(f"/api/v1/videos/{self.video.id}/view", {}, format="json")
        self.assertEqual(len(self.client.get("/api/v1/videos/history").data["data"]), 1)
        self.client.delete("/api/v1/videos/history")
        self.assertEqual(len(self.client.get("/api/v1/videos/history").data["data"]), 0)


class TranscriptEditTests(APITestCase):
    def setUp(self):
        self.educator = make_user("edu@t.com", User.Role.EDUCATOR)
        self.learner = make_user("lrn@t.com", User.Role.LEARNER)
        self.video = make_video(self.educator)
        self.url = f"/api/v1/videos/{self.video.id}/transcript"

    def test_educator_can_edit_segments(self):
        self.client.force_authenticate(self.educator)
        res = self.client.patch(self.url, {"segments": [
            {"start": 0.0, "duration": 5.0, "text": "Corrected first line."},
            {"start": 5.0, "duration": 5.0, "text": "Corrected second line."},
        ]}, format="json")
        self.assertEqual(res.status_code, status.HTTP_200_OK)

        transcript = Transcript.objects.get(video=self.video)
        self.assertTrue(transcript.is_edited)
        self.assertEqual(transcript.edited_by, self.educator)
        self.assertIn("Corrected first line.", transcript.content)
        self.assertEqual(transcript.segments[0]["start"], 0.0)  # timings preserved

    def test_learner_cannot_edit(self):
        self.client.force_authenticate(self.learner)
        res = self.client.patch(self.url, {"content": "hacked"}, format="json")
        self.assertEqual(res.status_code, status.HTTP_403_FORBIDDEN)

    def test_cannot_edit_another_users_transcript(self):
        other = make_user("other@t.com", User.Role.EDUCATOR)
        self.client.force_authenticate(other)
        res = self.client.patch(self.url, {"content": "nope"}, format="json")
        self.assertEqual(res.status_code, status.HTTP_404_NOT_FOUND)

    def test_empty_payload_rejected(self):
        self.client.force_authenticate(self.educator)
        self.assertEqual(
            self.client.patch(self.url, {}, format="json").status_code,
            status.HTTP_400_BAD_REQUEST,
        )

    def test_segment_without_text_rejected(self):
        self.client.force_authenticate(self.educator)
        res = self.client.patch(self.url, {"segments": [{"start": 0.0}]}, format="json")
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)

    def test_edit_records_activity(self):
        self.client.force_authenticate(self.educator)
        self.client.patch(self.url, {"content": "New text"}, format="json")
        self.assertTrue(ActivityLog.objects.filter(
            user=self.educator, action=ActivityLog.Action.TRANSCRIPT_EDITED).exists())


class SearchTests(APITestCase):
    def setUp(self):
        self.creator = make_user("c@t.com")
        self.learner = make_user("l@t.com", User.Role.LEARNER)
        self.video = make_video(self.creator, "Biology Lecture")

    def test_owner_finds_spoken_words(self):
        self.client.force_authenticate(self.creator)
        res = self.client.get("/api/v1/videos/search?q=mitochondria")
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertEqual(res.data["data"]["video_count"], 1)
        self.assertEqual(res.data["data"]["results"][0]["match_count"], 1)
        self.assertEqual(res.data["data"]["results"][0]["matches"][0]["start"], 0.0)

    def test_search_is_case_insensitive(self):
        self.client.force_authenticate(self.creator)
        res = self.client.get("/api/v1/videos/search?q=MITOCHONDRIA")
        self.assertEqual(res.data["data"]["total_matches"], 1)

    def test_search_respects_visibility(self):
        self.client.force_authenticate(self.learner)
        res = self.client.get("/api/v1/videos/search?q=mitochondria")
        self.assertEqual(res.data["data"]["video_count"], 0)

    def test_learner_finds_shared_content(self):
        VideoShare.objects.create(video=self.video, owner=self.creator, token="t1", is_public=True)
        self.client.force_authenticate(self.learner)
        res = self.client.get("/api/v1/videos/search?q=photosynthesis")
        self.assertEqual(res.data["data"]["video_count"], 1)

    def test_empty_and_short_queries_rejected(self):
        self.client.force_authenticate(self.creator)
        self.assertEqual(self.client.get("/api/v1/videos/search?q=").status_code,
                         status.HTTP_400_BAD_REQUEST)
        self.assertEqual(self.client.get("/api/v1/videos/search?q=a").status_code,
                         status.HTTP_400_BAD_REQUEST)

    def test_search_requires_authentication(self):
        self.assertEqual(self.client.get("/api/v1/videos/search?q=cell").status_code,
                         status.HTTP_401_UNAUTHORIZED)


class LearningMaterialTests(APITestCase):
    def setUp(self):
        self.educator = make_user("edu@t.com", User.Role.EDUCATOR)
        self.learner = make_user("lrn@t.com", User.Role.LEARNER)
        self.video = make_video(self.educator)

    def test_educator_creates_quiz_from_ai_analysis(self):
        self.client.force_authenticate(self.educator)
        res = self.client.post("/api/v1/videos/materials",
                               {"video_id": str(self.video.id), "kind": "quiz"}, format="json")
        self.assertEqual(res.status_code, status.HTTP_201_CREATED)
        self.assertEqual(len(res.data["data"]["content"]["questions"]), 1)

    def test_flashcards_come_from_glossary(self):
        self.client.force_authenticate(self.educator)
        res = self.client.post("/api/v1/videos/materials",
                               {"video_id": str(self.video.id), "kind": "flashcards"}, format="json")
        self.assertEqual(res.status_code, status.HTTP_201_CREATED)
        self.assertEqual(res.data["data"]["content"]["cards"][0]["front"], "Mitochondria")

    def test_study_notes_is_the_default(self):
        self.client.force_authenticate(self.educator)
        res = self.client.post("/api/v1/videos/materials",
                               {"video_id": str(self.video.id)}, format="json")
        self.assertEqual(res.status_code, status.HTTP_201_CREATED)
        self.assertIn("key_points", res.data["data"]["content"])

    def test_learner_cannot_create_materials(self):
        self.client.force_authenticate(self.learner)
        res = self.client.post("/api/v1/videos/materials",
                               {"video_id": str(self.video.id)}, format="json")
        self.assertEqual(res.status_code, status.HTTP_403_FORBIDDEN)

    def test_learner_sees_materials_for_a_shared_video(self):
        """Materials follow the video: share it and students can study from it."""
        LearningMaterial.objects.create(
            video=self.video, created_by=self.educator,
            kind="quiz", title="Week 1 Quiz", content={"questions": []},
        )
        self.client.force_authenticate(self.learner)
        # Not shared yet — invisible.
        self.assertEqual(self.client.get("/api/v1/videos/materials").data["data"], [])

        VideoShare.objects.create(video=self.video, owner=self.educator,
                                  token="mat-share", is_public=True)
        res = self.client.get("/api/v1/videos/materials")
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertEqual(len(res.data["data"]), 1)
        self.assertEqual(res.data["data"][0]["title"], "Week 1 Quiz")

    def test_learner_still_cannot_delete_a_material(self):
        material = LearningMaterial.objects.create(
            video=self.video, created_by=self.educator, title="Notes", content={},
        )
        VideoShare.objects.create(video=self.video, owner=self.educator,
                                  token="mat-share-2", is_public=True)
        self.client.force_authenticate(self.learner)
        res = self.client.delete(f"/api/v1/videos/materials/{material.id}")
        self.assertEqual(res.status_code, status.HTTP_403_FORBIDDEN)
        self.assertTrue(LearningMaterial.objects.filter(id=material.id).exists())

    def test_invalid_kind_rejected(self):
        self.client.force_authenticate(self.educator)
        res = self.client.post("/api/v1/videos/materials",
                               {"video_id": str(self.video.id), "kind": "bogus"}, format="json")
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)

    def test_materials_are_private_to_creator(self):
        LearningMaterial.objects.create(
            video=self.video, created_by=self.educator, title="Mine", content={}
        )
        other = make_user("other@t.com", User.Role.EDUCATOR)
        self.client.force_authenticate(other)
        self.assertEqual(self.client.get("/api/v1/videos/materials").data["data"], [])

    def test_update_and_delete_material(self):
        material = LearningMaterial.objects.create(
            video=self.video, created_by=self.educator, title="Notes", content={"a": 1}
        )
        self.client.force_authenticate(self.educator)
        res = self.client.patch(f"/api/v1/videos/materials/{material.id}",
                                {"title": "Renamed"}, format="json")
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertEqual(res.data["data"]["title"], "Renamed")

        res = self.client.delete(f"/api/v1/videos/materials/{material.id}")
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertFalse(LearningMaterial.objects.filter(id=material.id).exists())


class MediaSecurityTests(APITestCase):
    """Signed media URLs — a token must be bound to its own path and expire."""

    def test_token_only_authorizes_its_own_path(self):
        from core.media import sign_media_path, _token_authorizes

        token = sign_media_path("videos/mine.mp4")
        self.assertTrue(_token_authorizes(token, "videos/mine.mp4"))
        self.assertFalse(_token_authorizes(token, "videos/someone-else.mp4"))

    def test_garbage_token_rejected(self):
        from core.media import _token_authorizes

        self.assertFalse(_token_authorizes("not-a-token", "videos/mine.mp4"))
        self.assertFalse(_token_authorizes("", "videos/mine.mp4"))
