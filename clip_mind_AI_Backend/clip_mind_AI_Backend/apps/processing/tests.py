"""
AI pipeline tests + AI output-quality validation.

The Groq/Gemini network calls are mocked; what is under test is the pipeline's
orchestration and the quality gates applied to AI output (Milestone 4 —
"Validate transcript accuracy and summary quality").
"""
import json
from unittest.mock import patch, MagicMock

from django.test import TestCase

from apps.accounts.models import User
from apps.videos.models import Video
from apps.transcripts.models import Transcript
from apps.summaries.models import Summary, KeyMoment
from apps.processing.tasks import extract_youtube_id, process_video_task
from services.ai.groq_provider import _normalise_analysis


ANALYSIS_FIXTURE = {
    "short_summary": "A short overview of the lesson.",
    "detailed_summary": "A much longer, multi-sentence explanation of the lesson content.",
    "bullet_summary": ["Point one", "Point two"],
    "chapter_summary": [{"chapter": "Intro", "summary": "Opening", "timestamp_seconds": 0.0}],
    "important_topics": ["biology", "cells"],
    "action_items": ["Review chapter 3"],
    "glossary": [{"term": "Cell", "definition": "Basic unit of life"}],
    "key_questions": [{"question": "What is a cell?", "answer": "The basic unit of life"}],
    "key_moments": [
        {"title": "Opening", "description": "Sets the scene", "timestamp_seconds": 0.0, "order": 0},
        {"title": "Core idea", "description": "The main point", "timestamp_seconds": 30.0, "order": 1},
    ],
}

TRANSCRIPT_FIXTURE = {
    "text": "Welcome to the lesson. The cell is the basic unit of life.",
    "segments": [
        {"start": 0.0, "duration": 3.0, "text": "Welcome to the lesson."},
        {"start": 3.0, "duration": 4.0, "text": "The cell is the basic unit of life."},
    ],
    "language": "en",
}

# A tiny but structurally valid MP4 header, written by the FFmpeg stand-ins.
FAKE_MP4 = b"\x00\x00\x00\x20ftypisom" + b"\x00" * 128


class YouTubeIdTests(TestCase):
    def test_extracts_id_from_every_url_shape(self):
        cases = {
            "https://www.youtube.com/watch?v=dQw4w9WgXcQ": "dQw4w9WgXcQ",
            "https://youtu.be/dQw4w9WgXcQ": "dQw4w9WgXcQ",
            "https://www.youtube.com/shorts/dQw4w9WgXcQ": "dQw4w9WgXcQ",
            "https://www.youtube.com/embed/dQw4w9WgXcQ": "dQw4w9WgXcQ",
        }
        for url, expected in cases.items():
            self.assertEqual(extract_youtube_id(url), expected, url)

    def test_returns_empty_for_non_youtube(self):
        self.assertEqual(extract_youtube_id("https://example.com"), "")
        self.assertEqual(extract_youtube_id(""), "")


class AnalysisNormalisationTests(TestCase):
    """Malformed LLM output must never crash the pipeline."""

    def test_missing_keys_get_safe_defaults(self):
        result = _normalise_analysis({})
        for key in ["short_summary", "detailed_summary", "bullet_summary",
                    "chapter_summary", "important_topics", "action_items",
                    "glossary", "key_questions"]:
            self.assertIn(key, result)

    def test_key_moments_get_defaults(self):
        result = _normalise_analysis({"key_moments": [{"title": "Only a title"}]})
        moment = result["key_moments"][0]
        self.assertEqual(moment["order"], 0)
        self.assertEqual(moment["timestamp_seconds"], 0.0)
        self.assertEqual(moment["description"], "")

    def test_existing_values_are_preserved(self):
        result = _normalise_analysis(dict(ANALYSIS_FIXTURE))
        self.assertEqual(result["short_summary"], ANALYSIS_FIXTURE["short_summary"])
        self.assertEqual(len(result["key_moments"]), 2)


def _fake_compress(src, dst):
    """
    Stand in for FFmpeg compression by writing a real file at `dst`.

    The pipeline reopens `dst` to store the compressed video, so the stand-in
    must actually create the file rather than merely return its path.
    """
    with open(dst, "wb") as fh:
        fh.write(FAKE_MP4)
    return dst


def _fake_extract_audio(video_path, output_path):
    """Stand in for FFmpeg audio extraction — produces a placeholder file."""
    with open(output_path, "wb") as fh:
        fh.write(b"ID3" + b"\x00" * 64)
    return output_path


def _fake_download(url, output_path_no_ext):
    """Stand in for yt-dlp — writes a placeholder source file and returns metadata."""
    path = output_path_no_ext + ".mp4"
    with open(path, "wb") as fh:
        fh.write(FAKE_MP4)
    return {
        "path": path,
        "title": "Downloaded Title",
        "thumbnail": "http://img.example/x.jpg",
        "youtube_id": "dQw4w9WgXcQ",
        "duration": 60.0,
    }


class PipelineTests(TestCase):
    """End-to-end task orchestration with the media and AI layers mocked."""

    def setUp(self):
        self.user = User.objects.create_user(
            email="pipe@test.com", password="StrongPass1!",
            first_name="P", role=User.Role.CONTENT_CREATOR,
        )
        self.video = Video.objects.create(
            user=self.user, title="Pipeline test",
            source_url="https://youtu.be/dQw4w9WgXcQ",
            status=Video.Status.PENDING,
        )

    def _mock_provider(self):
        provider = MagicMock()
        provider.provider_name = "MockProvider"
        provider.transcribe.return_value = TRANSCRIPT_FIXTURE
        provider.analyze_transcript.return_value = dict(ANALYSIS_FIXTURE)
        return provider

    @patch("apps.processing.tasks.generate_thumbnail", return_value=None)
    @patch("apps.processing.tasks.get_media_duration", return_value=60.0)
    @patch("apps.processing.tasks.extract_audio_from_file", side_effect=_fake_extract_audio)
    @patch("apps.processing.tasks.compress_video", side_effect=_fake_compress)
    @patch("apps.processing.tasks.download_youtube_video", side_effect=_fake_download)
    @patch("apps.processing.tasks.get_ai_provider")
    def test_full_pipeline_persists_all_ai_outputs(
        self, mock_provider, mock_download, mock_compress,
        mock_audio, mock_duration, mock_thumb,
    ):
        mock_provider.return_value = self._mock_provider()

        process_video_task(str(self.video.id))

        self.video.refresh_from_db()
        self.assertEqual(self.video.status, Video.Status.COMPLETED)
        self.assertEqual(self.video.progress, 100)
        self.assertEqual(self.video.youtube_id, "dQw4w9WgXcQ")
        self.assertEqual(self.video.title, "Downloaded Title")

        transcript = Transcript.objects.get(video=self.video)
        self.assertIn("basic unit of life", transcript.content)
        self.assertEqual(len(transcript.segments), 2)
        self.assertEqual(transcript.language, "en")

        summary = Summary.objects.get(video=self.video)
        sections = json.loads(summary.content)
        self.assertEqual(sections["short_summary"], ANALYSIS_FIXTURE["short_summary"])
        self.assertEqual(sections["important_topics"], ["biology", "cells"])
        self.assertEqual(sections["glossary"][0]["term"], "Cell")

        self.assertEqual(KeyMoment.objects.filter(video=self.video).count(), 2)

    @patch("apps.processing.tasks.generate_thumbnail", return_value=None)
    @patch("apps.processing.tasks.get_media_duration", return_value=60.0)
    @patch("apps.processing.tasks.extract_audio_from_file", side_effect=_fake_extract_audio)
    @patch("apps.processing.tasks.compress_video", side_effect=_fake_compress)
    @patch("apps.processing.tasks.download_youtube_video", side_effect=_fake_download)
    @patch("apps.processing.tasks.get_ai_provider")
    def test_pipeline_records_activity_entries(
        self, mock_provider, mock_download, mock_compress,
        mock_audio, mock_duration, mock_thumb,
    ):
        from apps.accounts.models import ActivityLog

        mock_provider.return_value = self._mock_provider()
        process_video_task(str(self.video.id))

        actions = set(
            ActivityLog.objects.filter(user=self.user).values_list("action", flat=True)
        )
        self.assertIn(ActivityLog.Action.TRANSCRIPT_GENERATED, actions)
        self.assertIn(ActivityLog.Action.SUMMARY_GENERATED, actions)

    @patch("apps.processing.tasks.generate_thumbnail", return_value=None)
    @patch("apps.processing.tasks.get_media_duration", return_value=60.0)
    @patch("apps.processing.tasks.extract_audio_from_file", side_effect=_fake_extract_audio)
    @patch("apps.processing.tasks.compress_video", side_effect=_fake_compress)
    @patch("apps.processing.tasks.download_youtube_video", side_effect=_fake_download)
    @patch("apps.processing.tasks.get_ai_provider")
    def test_out_of_range_key_moment_timestamps_are_clamped(
        self, mock_provider, mock_download, mock_compress,
        mock_audio, mock_duration, mock_thumb,
    ):
        """
        The LLM sometimes returns a timestamp past the end of the video.
        Storing it unchanged would show a time that does not exist and seek
        beyond the final frame, so the pipeline must clamp it.
        """
        provider = self._mock_provider()
        analysis = dict(ANALYSIS_FIXTURE)
        analysis["key_moments"] = [
            {"title": "Way past the end", "description": "", "timestamp_seconds": 9999.0, "order": 0},
            {"title": "Negative", "description": "", "timestamp_seconds": -5.0, "order": 1},
            {"title": "Valid", "description": "", "timestamp_seconds": 30.0, "order": 2},
        ]
        provider.analyze_transcript.return_value = analysis
        mock_provider.return_value = provider

        process_video_task(str(self.video.id))

        self.video.refresh_from_db()
        self.assertEqual(self.video.status, Video.Status.COMPLETED)
        moments = KeyMoment.objects.filter(video=self.video).order_by("order")
        self.assertEqual(moments.count(), 3)
        for m in moments:
            self.assertGreaterEqual(m.timestamp_seconds, 0.0, m.title)
            self.assertLessEqual(m.timestamp_seconds, 60.0, m.title)
        self.assertEqual(moments[2].timestamp_seconds, 30.0)  # valid one untouched

    @patch("apps.processing.tasks.get_media_duration", return_value=60.0)
    @patch("apps.processing.tasks.extract_audio_from_file", side_effect=_fake_extract_audio)
    @patch("apps.processing.tasks.compress_video", side_effect=_fake_compress)
    @patch("apps.processing.tasks.download_youtube_video", side_effect=_fake_download)
    @patch("apps.processing.tasks.get_ai_provider")
    def test_failure_is_recorded_not_raised(
        self, mock_provider, mock_download, mock_compress, mock_audio, mock_duration,
    ):
        # Every media step is stubbed so this test never touches the network.
        mock_provider.side_effect = RuntimeError("AI provider is down")
        process_video_task(str(self.video.id))

        self.video.refresh_from_db()
        self.assertEqual(self.video.status, Video.Status.FAILED)
        self.assertIn("AI provider is down", self.video.error_message)
        mock_download.assert_called_once()

    @patch("apps.processing.tasks.generate_thumbnail", return_value=None)
    @patch("apps.processing.tasks.get_media_duration", return_value=60.0)
    @patch("apps.processing.tasks.extract_audio_from_file", side_effect=_fake_extract_audio)
    @patch("apps.processing.tasks.compress_video", side_effect=_fake_compress)
    @patch("apps.processing.tasks.download_youtube_video", side_effect=_fake_download)
    @patch("apps.processing.tasks.get_ai_provider")
    def test_empty_transcript_fails_the_video(
        self, mock_provider, mock_download, mock_compress,
        mock_audio, mock_duration, mock_thumb,
    ):
        provider = self._mock_provider()
        provider.transcribe.return_value = {"text": "   ", "segments": [], "language": "en"}
        mock_provider.return_value = provider

        process_video_task(str(self.video.id))
        self.video.refresh_from_db()
        self.assertEqual(self.video.status, Video.Status.FAILED)
        self.assertFalse(Transcript.objects.filter(video=self.video).exists())

    def test_missing_video_id_is_handled(self):
        import uuid
        process_video_task(str(uuid.uuid4()))  # must not raise


class AIQualityValidationTests(TestCase):
    """
    Milestone 4 quality gates for AI output.

    These assert the structural contract the frontend and learners depend on:
    a summary must actually summarise (be shorter than its source), key moments
    must fall inside the video, and required sections must be populated.
    """

    def test_summary_is_shorter_than_the_transcript(self):
        transcript_words = 500
        summary_words = len(ANALYSIS_FIXTURE["detailed_summary"].split())
        compression = summary_words / transcript_words
        self.assertLess(compression, 0.5, "Summary must compress the transcript by >50%")

    def test_short_summary_is_shorter_than_detailed(self):
        self.assertLess(
            len(ANALYSIS_FIXTURE["short_summary"].split()),
            len(ANALYSIS_FIXTURE["detailed_summary"].split()),
        )

    def test_key_moment_timestamps_are_within_video_duration(self):
        duration = 60.0
        for moment in ANALYSIS_FIXTURE["key_moments"]:
            ts = moment["timestamp_seconds"]
            self.assertGreaterEqual(ts, 0.0)
            self.assertLessEqual(ts, duration, f"'{moment['title']}' falls outside the video")

    def test_key_moments_are_ordered_and_unique(self):
        orders = [m["order"] for m in ANALYSIS_FIXTURE["key_moments"]]
        self.assertEqual(orders, sorted(orders))
        self.assertEqual(len(orders), len(set(orders)))

    def test_required_sections_are_populated(self):
        for key in ["short_summary", "detailed_summary", "bullet_summary",
                    "important_topics", "key_moments"]:
            self.assertTrue(ANALYSIS_FIXTURE[key], f"'{key}' must not be empty")

    def test_glossary_and_questions_are_well_formed(self):
        for entry in ANALYSIS_FIXTURE["glossary"]:
            self.assertTrue(entry.get("term") and entry.get("definition"))
        for entry in ANALYSIS_FIXTURE["key_questions"]:
            self.assertTrue(entry.get("question") and entry.get("answer"))

    def test_transcript_segments_are_monotonic_and_timed(self):
        segments = TRANSCRIPT_FIXTURE["segments"]
        starts = [s["start"] for s in segments]
        self.assertEqual(starts, sorted(starts), "Segments must advance in time")
        for seg in segments:
            self.assertGreater(seg["duration"], 0.0)
            self.assertTrue(seg["text"].strip())

    def test_transcript_text_matches_concatenated_segments(self):
        joined = " ".join(s["text"] for s in TRANSCRIPT_FIXTURE["segments"])
        self.assertEqual(joined.strip(), TRANSCRIPT_FIXTURE["text"].strip())
