const express = require('express');
const { authenticate } = require('../middleware/auth.middleware');
const { asyncHandler, createError } = require('../middleware/error.middleware');
const { PrismaClient } = require('@prisma/client');
const { extractKeywords } = require('../services/keyword.service');

const prisma = new PrismaClient();
const router = express.Router();

const formatDuration = (seconds) => {
  if (!seconds) return '00:00';
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
};

// GET /api/keymoments/:videoId — Fetch key moments for video
router.get('/:videoId', authenticate, asyncHandler(async (req, res, next) => {
  const video = await prisma.video.findUnique({ where: { id: req.params.videoId } });
  if (!video) return next(createError('Video not found.', 404));
  if (video.userId !== req.user.id && !video.isPublic && req.user.role !== 'ADMIN') {
    return next(createError('Access denied.', 403));
  }
  const keyMoments = await prisma.keyMoment.findMany({
    where: { videoId: req.params.videoId },
    orderBy: { timestampStart: 'asc' },
  });
  res.json({ success: true, data: { keyMoments } });
}));

// GET /api/keymoments/:videoId/highlight-report — Generate Highlight Reel Report
router.get('/:videoId/highlight-report', authenticate, asyncHandler(async (req, res, next) => {
  const format = (req.query.format || 'markdown').toLowerCase();

  const video = await prisma.video.findUnique({
    where: { id: req.params.videoId },
    include: {
      user: { select: { name: true, email: true } },
      summary: true,
      transcript: true,
      keyMoments: { orderBy: { timestampStart: 'asc' } },
    },
  });

  if (!video) return next(createError('Video not found.', 404));
  if (video.userId !== req.user.id && !video.isPublic && req.user.role !== 'ADMIN') {
    return next(createError('Access denied.', 403));
  }

  const safeTitle = (video.title || 'video').replace(/[^a-z0-9]/gi, '_').toLowerCase();
  const transcriptText = video.transcript?.content || '';
  const keywords = extractKeywords(transcriptText, 10);

  // Compile JSON data structure
  const reportData = {
    title: video.title,
    author: video.user?.name || 'Content Creator',
    duration: video.duration ? formatDuration(video.duration) : 'N/A',
    totalKeyMoments: video.keyMoments.length,
    generatedAt: new Date().toISOString(),
    executiveSummary: video.summary?.shortSummary || 'No summary available.',
    keywords: keywords.map((k) => k.word),
    keyMoments: video.keyMoments.map((m) => ({
      timestampStart: formatDuration(m.timestampStart),
      timestampEnd: formatDuration(m.timestampEnd),
      label: m.label,
      description: m.description,
      importanceScore: `${Math.round(m.importanceScore * 100)}%`,
      topic: m.topic || 'General',
    })),
  };

  if (format === 'json') {
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename="${safeTitle}_highlight_report.json"`);
    return res.json(reportData);
  }

  if (format === 'html') {
    const htmlReport = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <title>Highlight Reel Report — ${video.title}</title>
  <style>
    body { font-family: system-ui, -apple-system, sans-serif; max-width: 800px; margin: 40px auto; padding: 20px; line-height: 1.6; color: #1e293b; background: #f8fafc; }
    .card { background: #ffffff; padding: 24px; border-radius: 12px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1); margin-bottom: 24px; border: 1px solid #e2e8f0; }
    h1 { color: #0f172a; margin-top: 0; font-size: 1.8rem; }
    .meta { display: flex; gap: 16px; font-size: 0.85rem; color: #64748b; margin-bottom: 20px; }
    .badge { background: #e0e7ff; color: #3730a3; padding: 4px 10px; border-radius: 9999px; font-size: 0.8rem; font-weight: 600; display: inline-block; }
    .moment { border-left: 4px solid #4f46e5; padding-left: 16px; margin-bottom: 16px; }
    .timestamp { font-weight: 700; color: #4f46e5; font-size: 0.9rem; }
  </style>
</head>
<body>
  <div class="card">
    <h1>🎬 ClipMind AI — Highlight Reel Report</h1>
    <div class="meta">
      <span>📹 <strong>Title:</strong> ${video.title}</span>
      <span>👤 <strong>Author:</strong> ${reportData.author}</span>
      <span>⏱️ <strong>Duration:</strong> ${reportData.duration}</span>
    </div>
    <h2>📋 Executive Summary</h2>
    <p>${reportData.executiveSummary}</p>
    <div><strong>🏷️ Top Keywords:</strong> ${reportData.keywords.map(k => `<span class="badge">${k}</span>`).join(' ')}</div>
  </div>

  <div class="card">
    <h2>⏱️ Key Moments & Important Segments (${reportData.totalKeyMoments})</h2>
    ${reportData.keyMoments.map(m => `
      <div class="moment">
        <div class="timestamp">⏱️ ${m.timestampStart} - ${m.timestampEnd} | Importance: ${m.importanceScore}</div>
        <h3 style="margin: 4px 0;">${m.label}</h3>
        <p style="margin: 0; color: #475569;">${m.description || ''}</p>
        <span class="badge" style="background:#f1f5f9; color:#475569; margin-top:6px;">Topic: ${m.topic}</span>
      </div>
    `).join('')}
  </div>
</body>
</html>`;
    res.setHeader('Content-Type', 'text/html');
    res.setHeader('Content-Disposition', `attachment; filename="${safeTitle}_highlight_report.html"`);
    return res.send(htmlReport);
  }

  // Default: Markdown format
  const markdownReport = `# 🎬 ClipMind AI — Highlight Reel Report: ${video.title}

- **Author:** ${reportData.author}
- **Duration:** ${reportData.duration}
- **Generated At:** ${new Date().toLocaleDateString()}
- **Total Key Moments:** ${reportData.totalKeyMoments}

---

## 📋 Executive Summary
${reportData.executiveSummary}

**🏷️ Top Keywords:** ${reportData.keywords.join(', ')}

---

## ⏱️ Key Moments & Important Video Segments

${reportData.keyMoments.map((m, idx) => `### ${idx + 1}. ${m.label} (${m.timestampStart} - ${m.timestampEnd})
- **Importance Score:** ${m.importanceScore}
- **Topic Category:** ${m.topic}
- **Summary:** ${m.description || 'N/A'}
`).join('\n')}

---
*Report auto-generated by ClipMind AI Content Intelligence Platform.*
`;

  res.setHeader('Content-Type', 'text/markdown');
  res.setHeader('Content-Disposition', `attachment; filename="${safeTitle}_highlight_report.md"`);
  return res.send(markdownReport);
}));

module.exports = router;
