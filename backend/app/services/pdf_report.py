"""
Generates a professional PDF report combining a video's summary,
key moments, and transcript excerpt.
"""

from io import BytesIO
from reportlab.lib.pagesizes import A4  # type: ignore[import]
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle  # type: ignore[import]
from reportlab.lib.units import inch  # type: ignore[import]
from reportlab.lib import colors  # type: ignore[import]
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle  # type: ignore[import]


def generate_video_report(title: str, summary: dict | None, moments: list | None, transcript_snippet: str) -> bytes:
    buffer = BytesIO()
    doc = SimpleDocTemplate(buffer, pagesize=A4, topMargin=0.6 * inch, bottomMargin=0.6 * inch)
    styles = getSampleStyleSheet()

    title_style = ParagraphStyle("TitleStyle", parent=styles["Title"], textColor=colors.HexColor("#1E1B3A"))
    heading_style = ParagraphStyle("HeadingStyle", parent=styles["Heading2"], textColor=colors.HexColor("#4F46E5"), spaceBefore=14)
    body_style = ParagraphStyle("BodyStyle", parent=styles["BodyText"], leading=16)

    story = [Paragraph("ClipMind AI — Video Report", title_style), Spacer(1, 4), Paragraph(title, styles["Heading3"]), Spacer(1, 12)]

    if summary:
        story.append(Paragraph("Short Summary", heading_style))
        story.append(Paragraph(summary.get("short_summary", ""), body_style))
        story.append(Paragraph("Detailed Summary", heading_style))
        story.append(Paragraph(summary.get("detailed_summary", ""), body_style))

    if moments:
        story.append(Paragraph("Key Moments", heading_style))
        data = [["Timestamp", "Description"]]
        for m in moments:
            mins, secs = divmod(int(m["time"]), 60)
            data.append([f"{mins:02d}:{secs:02d}", m["label"]])
        table = Table(data, colWidths=[1.2 * inch, 4.8 * inch])
        table.setStyle(TableStyle([
            ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#4F46E5")),
            ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
            ("FONTSIZE", (0, 0), (-1, -1), 9),
            ("GRID", (0, 0), (-1, -1), 0.5, colors.HexColor("#E5E7EB")),
            ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.white, colors.HexColor("#F8F8FC")]),
        ]))
        story.append(table)

    if transcript_snippet:
        story.append(Paragraph("Transcript Excerpt", heading_style))
        story.append(Paragraph(transcript_snippet[:1500] + ("..." if len(transcript_snippet) > 1500 else ""), body_style))

    doc.build(story)
    buffer.seek(0)
    return buffer.read()


def generate_analytics_report(report: dict, top_keywords: list, event_counts: dict) -> bytes:
    buffer = BytesIO()
    doc = SimpleDocTemplate(buffer, pagesize=A4, topMargin=0.6 * inch, bottomMargin=0.6 * inch)
    styles = getSampleStyleSheet()

    title_style = ParagraphStyle("TitleStyle", parent=styles["Title"], textColor=colors.HexColor("#1E1B3A"))
    heading_style = ParagraphStyle("HeadingStyle", parent=styles["Heading2"], textColor=colors.HexColor("#4F46E5"), spaceBefore=14)

    story = [Paragraph("ClipMind AI — Content Insights & Usage Report", title_style), Spacer(1, 12)]

    story.append(Paragraph("Usage Summary", heading_style))
    usage_data = [
        ["Metric", "Value"],
        ["Total Videos", str(report.get("total_videos", 0))],
        ["Total Watch Duration (seconds)", str(report.get("total_duration_seconds", 0))],
        ["Storage Used (MB)", str(report.get("total_size_mb", 0))],
        ["Transcripts Generated", str(report.get("transcripts_generated", 0))],
        ["Summaries Generated", str(report.get("summaries_generated", 0))],
        ["Key Moments Generated", str(report.get("keymoments_generated", 0))],
    ]
    table = Table(usage_data, colWidths=[3.2 * inch, 2.8 * inch])
    table.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#4F46E5")),
        ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
        ("FONTSIZE", (0, 0), (-1, -1), 9),
        ("GRID", (0, 0), (-1, -1), 0.5, colors.HexColor("#E5E7EB")),
        ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.white, colors.HexColor("#F8F8FC")]),
    ]))
    story.append(table)
    story.append(Spacer(1, 16))

    if event_counts:
        story.append(Paragraph("Engagement by Event Type", heading_style))
        event_data = [["Event Type", "Count"]] + [[k.replace("_", " ").title(), str(v)] for k, v in event_counts.items()]
        etable = Table(event_data, colWidths=[3.2 * inch, 2.8 * inch])
        etable.setStyle(TableStyle([
            ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#10B981")),
            ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
            ("FONTSIZE", (0, 0), (-1, -1), 9),
            ("GRID", (0, 0), (-1, -1), 0.5, colors.HexColor("#E5E7EB")),
            ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.white, colors.HexColor("#F8F8FC")]),
        ]))
        story.append(etable)
        story.append(Spacer(1, 16))

    if top_keywords:
        story.append(Paragraph("Top Content Insights (Keywords)", heading_style))
        kw_data = [["Keyword", "Mentions"]] + [[k["word"], str(k["count"])] for k in top_keywords]
        ktable = Table(kw_data, colWidths=[3.2 * inch, 2.8 * inch])
        ktable.setStyle(TableStyle([
            ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#F59E0B")),
            ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
            ("FONTSIZE", (0, 0), (-1, -1), 9),
            ("GRID", (0, 0), (-1, -1), 0.5, colors.HexColor("#E5E7EB")),
            ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.white, colors.HexColor("#F8F8FC")]),
        ]))
        story.append(ktable)

    doc.build(story)
    buffer.seek(0)
    return buffer.read()

def generate_learning_material_report(title: str, key_points: list, qa_pairs: list, keywords: list) -> bytes:
    buffer = BytesIO()
    doc = SimpleDocTemplate(buffer, pagesize=A4, topMargin=0.6 * inch, bottomMargin=0.6 * inch)
    styles = getSampleStyleSheet()

    title_style = ParagraphStyle("TitleStyle", parent=styles["Title"], textColor=colors.HexColor("#1E1B3A"))
    heading_style = ParagraphStyle("HeadingStyle", parent=styles["Heading2"], textColor=colors.HexColor("#4F46E5"), spaceBefore=14)
    body_style = ParagraphStyle("BodyStyle", parent=styles["BodyText"], leading=16)

    story = [
        Paragraph("ClipMind AI — Learning Material", title_style),
        Spacer(1, 4),
        Paragraph(title, styles["Heading3"]),
        Spacer(1, 12),
    ]

    if key_points:
        story.append(Paragraph("Key Points", heading_style))
        for point in key_points:
            story.append(Paragraph(f"•  {point}", body_style))
        story.append(Spacer(1, 12))

    if keywords:
        story.append(Paragraph("Keywords", heading_style))
        kw_text = ", ".join(k.get("word", k) if isinstance(k, dict) else k for k in keywords)
        story.append(Paragraph(kw_text, body_style))
        story.append(Spacer(1, 12))

    if qa_pairs:
        story.append(Paragraph("Quiz Questions", heading_style))
        for i, qa in enumerate(qa_pairs, 1):
            story.append(Paragraph(f"Q{i}. {qa.get('question', '')}", body_style))
            story.append(Paragraph(f"A: {qa.get('answer', '')}", body_style))
            story.append(Spacer(1, 6))

    doc.build(story)
    buffer.seek(0)
    return buffer.read()