"""
Report service: generates PDF and CSV reports for video content.
"""
import csv
import io
import logging
from datetime import datetime
from reportlab.lib import colors
from reportlab.lib.enums import TA_CENTER
from reportlab.lib.styles import getSampleStyleSheet
from reportlab.lib.units import inch
from reportlab.lib.colors import HexColor
from reportlab.platypus import (
    SimpleDocTemplate,
    Paragraph,
    Spacer,
    Table,
    TableStyle,
)

from app.services.ai_insight_service import AIInsightService

logger = logging.getLogger(__name__)


class ReportService:
    """Service for generating downloadable reports (PDF and CSV)."""

    @staticmethod
    def _format_file_size(bytes_value):
        """Format file size in bytes to a human-readable string."""
        if not bytes_value:
            return "N/A"
        mb = bytes_value / (1024 * 1024)
        if mb >= 1024:
            return f"{mb / 1024:.2f} GB"
        return f"{mb:.1f} MB"

    @staticmethod
    def _format_timestamp(seconds):
        """Format seconds to MM:SS timestamp."""
        if seconds is None:
            return "N/A"
        mins = int(seconds // 60)
        secs = int(seconds % 60)
        return f"{mins}:{secs:02d}"

    @staticmethod
    def generate_pdf(video, transcript, summary, analytics, key_moments, keywords=None):
        """
        Generate a professionally formatted PDF report for a video.

        The report includes:
        - Cover page with project branding
        - Video information table
        - Transcript statistics (language, word count, speech rate)
        - Short and detailed AI summaries
        - Keyword analysis
        - Key moments table with confidence scores
        - Analytics summary table
        - AI performance summary
        - Professional footer

        Args:
            video: Video model instance.
            transcript: Transcript model instance or None.
            summary: Summary model instance or None.
            analytics: Analytics model instance or None.
            key_moments: List of KeyMoment model instances.
            keywords: List of Keyword model instances or None.

        Returns:
            io.BytesIO: A buffer containing the generated PDF.
        """
        buffer = io.BytesIO()

        document = SimpleDocTemplate(
            buffer,
            pagesize=(8.5 * inch, 11 * inch),
            leftMargin=0.75 * inch,
            rightMargin=0.75 * inch,
            topMargin=0.75 * inch,
            bottomMargin=0.75 * inch,
        )

        styles = getSampleStyleSheet()

        # Custom styles
        titleStyle = styles["Title"]
        titleStyle.alignment = TA_CENTER
        titleStyle.textColor = HexColor("#2563EB")

        headingStyle = styles["Heading2"]
        headingStyle.textColor = HexColor("#1D4ED8")

        normalStyle = styles["BodyText"]

        elements = []

        # ============================================================
        # AI INSIGHTS (computed early so keyword sections can use them)
        # ============================================================
        insights = AIInsightService.generate(
            video,
            transcript,
            summary,
            key_moments,
        )

        # ============================================================
        # COVER PAGE
        # ============================================================
        elements.append(
            Paragraph(
                "ClipMind AI",
                titleStyle
            )
        )

        elements.append(Spacer(1, 15))

        elements.append(
            Paragraph(
                "AI Video Intelligence Report",
                headingStyle
            )
        )

        elements.append(Spacer(1, 30))

        elements.append(
            Paragraph(
                f"<b>Video Title</b><br/>{video.title}",
                normalStyle
            )
        )

        elements.append(Spacer(1, 12))

        elements.append(
            Paragraph(
                f"<b>Generated On</b><br/>{datetime.now().strftime('%d %B %Y %I:%M %p')}",
                normalStyle
            )
        )

        elements.append(Spacer(1, 30))

        # ============================================================
        # VIDEO INFORMATION
        # ============================================================
        videoData = [
            ["Property", "Value"],
            ["Title", video.title],
            ["Duration", ReportService._format_timestamp(video.duration)],
            ["Status", video.status],
            ["File Size", ReportService._format_file_size(video.file_size)],
        ]

        table = Table(videoData)

        table.setStyle(TableStyle([
            ("BACKGROUND", (0, 0), (-1, 0), HexColor("#2563EB")),
            ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
            ("GRID", (0, 0), (-1, -1), 1, colors.grey),
            ("BACKGROUND", (0, 1), (-1, -1), HexColor("#F8FAFC")),
            ("BOTTOMPADDING", (0, 0), (-1, 0), 10),
            ("TOPPADDING", (0, 0), (-1, -1), 6),
            ("BOTTOMPADDING", (0, 1), (-1, -1), 6),
        ]))

        elements.append(
            Paragraph(
                "Video Information",
                headingStyle
            )
        )

        elements.append(table)

        elements.append(Spacer(1, 25))

        # ============================================================
        # TRANSCRIPT STATISTICS
        # ============================================================
        if transcript:

            transcriptWords = len(
                transcript.transcript.split()
            )

            speechRate = 0
            if video.duration and video.duration > 0:
                speechRate = round(
                    transcriptWords /
                    (video.duration / 60),
                    1
                )

            stats = [
                ["Metric", "Value"],
                ["Language", transcript.language],
                ["Words", transcriptWords],
                ["Speech Rate", f"{speechRate} words/min"],
            ]

            if transcript.confidence is not None:
                stats.append(["Confidence", f"{transcript.confidence}%"])

            statsTable = Table(stats)

            statsTable.setStyle(TableStyle([
                ("BACKGROUND", (0, 0), (-1, 0), HexColor("#2563EB")),
                ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
                ("GRID", (0, 0), (-1, -1), 1, colors.grey),
                ("BACKGROUND", (0, 1), (-1, -1), HexColor("#F8FAFC")),
                ("BOTTOMPADDING", (0, 0), (-1, 0), 10),
                ("TOPPADDING", (0, 0), (-1, -1), 6),
                ("BOTTOMPADDING", (0, 1), (-1, -1), 6),
            ]))

            elements.append(
                Paragraph(
                    "Transcript Statistics",
                    headingStyle
                )
            )

            elements.append(statsTable)

            elements.append(Spacer(1, 25))

        # ============================================================
        # AI SUMMARY
        # ============================================================
        if summary:

            elements.append(
                Paragraph(
                    "AI Summary",
                    headingStyle
                )
            )

            elements.append(
                Paragraph(
                    "<b>Short Summary</b>",
                    normalStyle
                )
            )

            elements.append(Spacer(1, 6))

            elements.append(
                Paragraph(summary.short_summary, normalStyle)
            )

            elements.append(Spacer(1, 15))

            elements.append(
                Paragraph(
                    "<b>Detailed Summary</b>",
                    normalStyle
                )
            )

            elements.append(Spacer(1, 6))

            elements.append(
                Paragraph(summary.detailed_summary, normalStyle)
            )

            if summary.model_used:
                elements.append(Spacer(1, 10))
                elements.append(
                    Paragraph(
                        f"<font color='grey'>Generated using: {summary.model_used}</font>",
                        styles["Italic"]
                    )
                )

            elements.append(Spacer(1, 25))

        # ============================================================
        # KEYWORD ANALYSIS  (uses the same top_keywords as the analytics
        # page so the report always matches what the user sees online)
        # ============================================================
        keyword_count = getattr(analytics, "keyword_count", 0) if analytics else 0

        top_keywords = insights.get("top_keywords", [])

        if keyword_count > 0 or top_keywords:

            elements.append(
                Paragraph(
                    "Keyword Analysis",
                    headingStyle
                )
            )

            elements.append(
                Paragraph(
                    f"Total Keywords : {keyword_count}",
                    normalStyle
                )
            )

            if top_keywords:
                elements.append(Spacer(1, 10))

                keyword_list = [
                    f"{kw} ({count})" for kw, count in top_keywords
                ]

                elements.append(
                    Paragraph(
                        ", ".join(keyword_list),
                        normalStyle
                    )
                )

            elements.append(Spacer(1, 20))

        # ============================================================
        # KEY MOMENTS
        # ============================================================
        if key_moments:

            elements.append(
                Paragraph(
                    "Key Moments",
                    headingStyle
                )
            )

            momentData = [
                ["Timestamp", "Title", "Confidence"]
            ]

            for moment in key_moments:

                confidence = 0
                if moment.confidence is not None:
                    if moment.confidence <= 1:
                        confidence = round(moment.confidence * 100, 1)
                    else:
                        confidence = round(moment.confidence, 1)

                momentData.append([
                    ReportService._format_timestamp(moment.start_time),
                    moment.title or "-",
                    f"{confidence}%",
                ])

            momentTable = Table(momentData)

            momentTable.setStyle(TableStyle([
                ("BACKGROUND", (0, 0), (-1, 0), HexColor("#F59E0B")),
                ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
                ("GRID", (0, 0), (-1, -1), 1, colors.grey),
                ("BOTTOMPADDING", (0, 0), (-1, 0), 10),
                ("TOPPADDING", (0, 0), (-1, -1), 6),
                ("BOTTOMPADDING", (0, 1), (-1, -1), 6),
            ]))

            elements.append(momentTable)

            elements.append(Spacer(1, 25))

        # ============================================================
        # ANALYTICS
        # ============================================================
        if analytics:

            # Use getattr for fields that may not exist on the raw Analytics
            # model (e.g. keyword_count, compression_ratio are computed in
            # RichAnalyticsRead but not stored on the Analytics table).
            compression_ratio = getattr(analytics, "compression_ratio", 0)
            key_moment_count = getattr(analytics, "key_moment_count", len(key_moments))
            average_confidence = getattr(analytics, "average_confidence", 0)

            analyticsTable = [
                ["Metric", "Value"],
                ["Views", analytics.views],
                ["Watch Time", f"{analytics.total_watch_time:.0f} sec"],
                ["Completion Rate", f"{analytics.completion_rate * 100:.1f}%"],
                ["Compression", f"{compression_ratio}%"],
                ["Keywords", keyword_count],
                ["Key Moments", key_moment_count],
                ["Average Confidence", f"{average_confidence}%"],
            ]

            analyticsTableObj = Table(analyticsTable)

            analyticsTableObj.setStyle(TableStyle([
                ("BACKGROUND", (0, 0), (-1, 0), HexColor("#2563EB")),
                ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
                ("GRID", (0, 0), (-1, -1), 1, colors.grey),
                ("BACKGROUND", (0, 1), (-1, -1), HexColor("#F8FAFC")),
                ("BOTTOMPADDING", (0, 0), (-1, 0), 10),
                ("TOPPADDING", (0, 0), (-1, -1), 6),
                ("BOTTOMPADDING", (0, 1), (-1, -1), 6),
            ]))

            elements.append(
                Paragraph(
                    "Analytics",
                    headingStyle
                )
            )

            elements.append(analyticsTableObj)

            elements.append(Spacer(1, 25))

        # ============================================================
        # AI INSIGHTS
        # ============================================================
        elements.append(
            Paragraph(
                "AI Insights",
                headingStyle
            )
        )

        insightTable = [
            ["Metric", "Value"],
            ["Speaking Speed", f"{insights['speaking_speed']} words/min"],
            ["Reading Time", f"{insights['reading_time']} min"],
            ["Compression Ratio", f"{insights['compression_ratio']}%"],
            ["AI Confidence", f"{insights['confidence']}%"],
            ["Transcript Density", f"{insights['transcript_density']} words/min"],
            ["Summary Quality", insights["summary_quality"]],
            ["Video Quality", insights["video_quality"]],
            ["AI Processing Score", f"{insights['processing_score']}%"],
        ]

        insightTableObj = Table(insightTable)

        insightTableObj.setStyle(TableStyle([
            ("BACKGROUND", (0, 0), (-1, 0), HexColor("#059669")),
            ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
            ("GRID", (0, 0), (-1, -1), 1, colors.grey),
            ("BOTTOMPADDING", (0, 0), (-1, 0), 10),
            ("TOPPADDING", (0, 0), (-1, -1), 6),
            ("BOTTOMPADDING", (0, 1), (-1, -1), 6),
        ]))

        elements.append(insightTableObj)

        # ============================================================
        # TOP 10 KEYWORDS
        # ============================================================
        if insights["top_keywords"]:

            elements.append(
                Spacer(1, 20)
            )

            elements.append(
                Paragraph(
                    "Top 10 Keywords",
                    headingStyle
                )
            )

            keywordData = [["Keyword", "Frequency"]]

            for keyword, count in insights["top_keywords"]:
                keywordData.append([keyword, count])

            keywordTable = Table(keywordData)

            keywordTable.setStyle(TableStyle([
                ("BACKGROUND", (0, 0), (-1, 0), HexColor("#7C3AED")),
                ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
                ("GRID", (0, 0), (-1, -1), 1, colors.grey),
                ("BOTTOMPADDING", (0, 0), (-1, 0), 10),
                ("TOPPADDING", (0, 0), (-1, -1), 6),
                ("BOTTOMPADDING", (0, 1), (-1, -1), 6),
            ]))

            elements.append(keywordTable)

        # ============================================================
        # AI PERFORMANCE SUMMARY
        # ============================================================
        if analytics:

            compression_ratio = getattr(analytics, "compression_ratio", 0)
            key_moment_count = getattr(analytics, "key_moment_count", len(key_moments))
            average_confidence = getattr(analytics, "average_confidence", 0)

            elements.append(
                Paragraph(
                    "AI Performance Summary",
                    headingStyle
                )
            )

            elements.append(
                Paragraph(
                    f"""
<b>Transcript Accuracy</b> :
High

<br/><br/>

<b>Summary Compression</b> :
{compression_ratio}%

<br/><br/>

<b>Key Moments</b> :
{key_moment_count}

<br/><br/>

<b>Average Confidence</b> :
{average_confidence}%

                    """,
                    normalStyle
                )
            )

        # ============================================================
        # FOOTER
        # ============================================================
        elements.append(
            Spacer(1, 40)
        )

        elements.append(
            Paragraph(
                "<font color='grey'>Generated by ClipMind AI • AI Powered Video Intelligence Platform</font>",
                styles["Italic"]
            )
        )

        document.build(elements)

        buffer.seek(0)

        return buffer

    @staticmethod
    def generate_key_moments_csv(key_moments):
        """
        Generate a CSV file containing key moments data.

        Args:
            key_moments: List of KeyMoment model instances.

        Returns:
            io.StringIO: A buffer containing the generated CSV.
        """
        output = io.StringIO()

        writer = csv.writer(output)

        writer.writerow([
            "Timestamp",
            "Title",
            "Description",
            "Confidence (%)",
        ])

        for moment in key_moments:

            confidence = 0
            if moment.confidence is not None:
                if moment.confidence <= 1:
                    confidence = round(moment.confidence * 100, 2)
                else:
                    confidence = round(moment.confidence, 2)

            writer.writerow([
                moment.start_time,
                moment.title,
                moment.description,
                confidence,
            ])

        output.seek(0)

        return output

    @staticmethod
    def generate_analytics_csv(video, transcript, summary, analytics):
        """
        Generate a CSV file containing analytics data for a video.

        Args:
            video: Video model instance.
            transcript: Transcript model instance or None.
            summary: Summary model instance or None.
            analytics: Analytics model instance or None.

        Returns:
            io.StringIO: A buffer containing the generated CSV.
        """
        output = io.StringIO()

        writer = csv.writer(output)

        writer.writerow(["ClipMind AI Analytics Report"])
        writer.writerow([])

        writer.writerow(["Video Title", video.title])
        writer.writerow(["Duration", video.duration])

        if transcript:
            writer.writerow(["Language", transcript.language])

        writer.writerow([])

        writer.writerow(["Metric", "Value"])

        if analytics:
            writer.writerow(["Views", analytics.views])

            writer.writerow([
                "Watch Time",
                analytics.total_watch_time,
            ])

            writer.writerow([
                "Completion Rate",
                f"{analytics.completion_rate * 100:.2f}%",
            ])

            # Use getattr for fields that may not exist on the raw Analytics
            # model (e.g. keyword_count, compression_ratio are computed in
            # RichAnalyticsRead but not stored on the Analytics table).
            compression_ratio = getattr(analytics, "compression_ratio", 0)
            keyword_count = getattr(analytics, "keyword_count", 0)
            key_moment_count = getattr(analytics, "key_moment_count", 0)
            average_confidence = getattr(analytics, "average_confidence", 0)

            writer.writerow([
                "Compression Ratio",
                f"{compression_ratio:.2f}%",
            ])

            writer.writerow([
                "Keywords",
                keyword_count,
            ])

            writer.writerow([
                "Key Moments",
                key_moment_count,
            ])

            writer.writerow([
                "Average Confidence",
                f"{average_confidence:.2f}%",
            ])

        # AI Insights section
        key_moments = getattr(video, "key_moments", []) or []
        insights = AIInsightService.generate(
            video,
            transcript,
            summary,
            key_moments,
        )

        writer.writerow([])
        writer.writerow(["AI Insights"])
        writer.writerow([])

        writer.writerow(["Speaking Speed", f"{insights['speaking_speed']} words/min"])
        writer.writerow(["Reading Time", f"{insights['reading_time']} min"])
        writer.writerow(["Compression Ratio", f"{insights['compression_ratio']}%"])
        writer.writerow(["AI Confidence", f"{insights['confidence']}%"])
        writer.writerow(["Transcript Density", f"{insights['transcript_density']} words/min"])
        writer.writerow(["Summary Quality", insights["summary_quality"]])
        writer.writerow(["Video Quality", insights["video_quality"]])
        writer.writerow(["AI Processing Score", f"{insights['processing_score']}%"])

        if insights["top_keywords"]:
            writer.writerow([])
            writer.writerow(["Top 10 Keywords"])
            writer.writerow(["Keyword", "Frequency"])
            for keyword, count in insights["top_keywords"]:
                writer.writerow([keyword, count])

        output.seek(0)

        return output
