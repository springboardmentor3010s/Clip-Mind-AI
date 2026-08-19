"""
Analytics tests — personal, content insights, and classroom/engagement.
"""
from rest_framework import status
from rest_framework.test import APITestCase

from apps.accounts.models import User
from apps.videos.models import Video, VideoShare, VideoView, LearningHistory, Bookmark
from apps.videos.tests import make_user, make_video


class PersonalAnalyticsTests(APITestCase):
    def setUp(self):
        self.creator = make_user("c@t.com", User.Role.CONTENT_CREATOR)
        make_video(self.creator, "One")
        make_video(self.creator, "Two")
        make_video(self.creator, "Failed", status_=Video.Status.FAILED, with_ai=False)

    def test_requires_authentication(self):
        self.assertEqual(self.client.get("/api/v1/analytics/").status_code,
                         status.HTTP_401_UNAUTHORIZED)

    def test_returns_accurate_counts(self):
        self.client.force_authenticate(self.creator)
        data = self.client.get("/api/v1/analytics/").data["data"]
        self.assertEqual(data["total_videos"], 3)
        self.assertEqual(data["completed_count"], 2)
        self.assertEqual(data["failed_count"], 1)
        self.assertEqual(data["total_summaries"], 2)
        self.assertEqual(data["role"], "content_creator")
        self.assertEqual(len(data["daily_uploads"]), 14)

    def test_analytics_are_per_user(self):
        other = make_user("other@t.com")
        self.client.force_authenticate(other)
        data = self.client.get("/api/v1/analytics/").data["data"]
        self.assertEqual(data["total_videos"], 0)


class ContentInsightsTests(APITestCase):
    def setUp(self):
        self.creator = make_user("c@t.com", User.Role.CONTENT_CREATOR)
        self.learner = make_user("l@t.com", User.Role.LEARNER)
        self.video = make_video(self.creator, "Insightful")

    def test_learner_is_blocked(self):
        self.client.force_authenticate(self.learner)
        self.assertEqual(self.client.get("/api/v1/analytics/content").status_code,
                         status.HTTP_403_FORBIDDEN)

    def test_aggregates_topics_from_ai_summary(self):
        self.client.force_authenticate(self.creator)
        data = self.client.get("/api/v1/analytics/content").data["data"]
        topics = {t["topic"] for t in data["top_topics"]}
        self.assertIn("biology", topics)
        self.assertIn("cells", topics)
        self.assertEqual(data["total_published"], 1)
        self.assertEqual(data["total_key_moments"], 1)

    def test_counts_views_and_bookmarks(self):
        VideoView.objects.create(video=self.video, user=self.learner, watch_seconds=10)
        Bookmark.objects.create(user=self.learner, video=self.video)
        self.client.force_authenticate(self.creator)
        data = self.client.get("/api/v1/analytics/content").data["data"]
        self.assertEqual(data["total_views"], 1)
        self.assertEqual(data["total_bookmarks"], 1)


class ClassroomAnalyticsTests(APITestCase):
    def setUp(self):
        self.educator = make_user("edu@t.com", User.Role.EDUCATOR)
        self.creator = make_user("cre@t.com", User.Role.CONTENT_CREATOR)
        self.s1 = make_user("s1@t.com", User.Role.LEARNER)
        self.s2 = make_user("s2@t.com", User.Role.LEARNER)
        self.video = make_video(self.educator, "Lecture")
        VideoShare.objects.create(video=self.video, owner=self.educator, token="tk", is_public=True)

    def test_only_educators_and_admins_may_read(self):
        self.client.force_authenticate(self.s1)
        self.assertEqual(self.client.get("/api/v1/analytics/classroom").status_code,
                         status.HTTP_403_FORBIDDEN)
        self.client.force_authenticate(self.creator)
        self.assertEqual(self.client.get("/api/v1/analytics/classroom").status_code,
                         status.HTTP_403_FORBIDDEN)
        self.client.force_authenticate(self.educator)
        self.assertEqual(self.client.get("/api/v1/analytics/classroom").status_code,
                         status.HTTP_200_OK)

    def test_student_engagement_is_tracked(self):
        self.client.force_authenticate(self.s1)
        self.client.post(f"/api/v1/videos/{self.video.id}/view",
                         {"position_seconds": 115}, format="json")
        self.client.force_authenticate(self.s2)
        self.client.post(f"/api/v1/videos/{self.video.id}/view",
                         {"position_seconds": 20}, format="json")

        self.client.force_authenticate(self.educator)
        data = self.client.get("/api/v1/analytics/classroom").data["data"]
        self.assertEqual(data["total_student_views"], 2)
        self.assertEqual(data["unique_students"], 2)
        self.assertEqual(data["completion_count"], 1)
        self.assertEqual(len(data["students"]), 2)
        self.assertEqual(data["top_video"]["title"], "Lecture")
        self.assertEqual(len(data["engagement_series"]), 14)

    def test_educators_own_views_are_excluded(self):
        self.client.force_authenticate(self.educator)
        self.client.post(f"/api/v1/videos/{self.video.id}/view", {}, format="json")
        data = self.client.get("/api/v1/analytics/classroom").data["data"]
        self.assertEqual(data["total_student_views"], 0)
        self.assertEqual(data["unique_students"], 0)
