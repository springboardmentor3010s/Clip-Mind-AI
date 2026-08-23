const express = require('express');
const { authenticate } = require('../middleware/auth.middleware');
const { asyncHandler } = require('../middleware/error.middleware');
const { PrismaClient } = require('@prisma/client');
const { extractKeywords } = require('../services/keyword.service');

const prisma = new PrismaClient();
const router = express.Router();

// GET /api/analytics/overview
router.get('/overview', authenticate, asyncHandler(async (req, res) => {
  const isAdmin = req.user.role === 'ADMIN';
  const isLearner = req.user.role === 'LEARNER';
  const userFilter = isAdmin ? {} : isLearner ? { isPublic: true } : { userId: req.user.id };
  const relationFilter = isAdmin ? {} : isLearner ? { video: { isPublic: true } } : { video: { userId: req.user.id } };

  const [totalVideos, totalTranscripts, totalSummaries, recentVideos, jobStats, keyMomentsCount] = await Promise.all([
    prisma.video.count({ where: userFilter }),
    prisma.transcript.count({ where: relationFilter }),
    prisma.summary.count({ where: relationFilter }),
    prisma.video.findMany({
      where: userFilter,
      orderBy: { createdAt: 'desc' },
      take: 5,
      select: { id: true, title: true, status: true, viewCount: true, createdAt: true, thumbnailPath: true },
    }),
    prisma.job.groupBy({
      by: ['status'],
      _count: { id: true },
      where: relationFilter,
    }),
    prisma.keyMoment.count({ where: relationFilter }),
  ]);

  const jobSummary = { PENDING: 0, PROCESSING: 0, COMPLETED: 0, FAILED: 0 };
  jobStats.forEach((j) => { jobSummary[j.status] = j._count.id; });

  res.json({
    success: true,
    data: { totalVideos, totalTranscripts, totalSummaries, keyMomentsCount, recentVideos, jobSummary },
  });
}));

// GET /api/analytics/content-insights — Content Intelligence & Keyword Trends (supports videoId filter)
router.get('/content-insights', authenticate, asyncHandler(async (req, res) => {
  const isAdmin = req.user.role === 'ADMIN';
  const isLearner = req.user.role === 'LEARNER';
  const selectedVideoId = req.query.videoId ? String(req.query.videoId) : null;

  const videoWhere = selectedVideoId
    ? { id: selectedVideoId, ...(isAdmin ? {} : isLearner ? { isPublic: true } : { userId: req.user.id }) }
    : (isAdmin ? {} : isLearner ? { isPublic: true } : { userId: req.user.id });

  const transcriptWhere = selectedVideoId
    ? { videoId: selectedVideoId, ...(isAdmin ? {} : isLearner ? { video: { isPublic: true } } : { video: { userId: req.user.id } }) }
    : (isAdmin ? {} : isLearner ? { video: { isPublic: true } } : { video: { userId: req.user.id } });

  const summaryWhere = selectedVideoId
    ? { videoId: selectedVideoId, ...(isAdmin ? {} : isLearner ? { video: { isPublic: true } } : { video: { userId: req.user.id } }) }
    : (isAdmin ? {} : isLearner ? { video: { isPublic: true } } : { video: { userId: req.user.id } });

  const keyMomentWhere = selectedVideoId
    ? { videoId: selectedVideoId, ...(isAdmin ? {} : isLearner ? { video: { isPublic: true } } : { video: { userId: req.user.id } }) }
    : (isAdmin ? {} : isLearner ? { video: { isPublic: true } } : { video: { userId: req.user.id } });

  const [videos, transcripts, summaries, keyMoments] = await Promise.all([
    prisma.video.findMany({
      where: videoWhere,
      select: { id: true, duration: true, viewCount: true, status: true },
    }),
    prisma.transcript.findMany({
      where: transcriptWhere,
      select: { content: true },
      take: 20,
    }),
    prisma.summary.findMany({
      where: summaryWhere,
      select: { qualityScore: true, keywords: true, topics: true, tone: true },
    }),
    prisma.keyMoment.findMany({
      where: keyMomentWhere,
      select: { importanceScore: true, topic: true },
    }),
  ]);

  // Aggregate total watch duration in minutes
  const totalDurationSeconds = videos.reduce((acc, v) => acc + (v.duration || 0), 0);
  const totalWatchMinutes = Math.round(totalDurationSeconds / 60);

  // Extract keywords
  const fullCorpus = transcripts.map((t) => t.content).join(' ');
  const topKeywords = extractKeywords(fullCorpus, 15);

  // Calculate quality score
  const qualityScores = summaries.filter((s) => s.qualityScore).map((s) => s.qualityScore);
  const avgQualityScore = qualityScores.length > 0
    ? Math.round(qualityScores.reduce((a, b) => a + b, 0) / qualityScores.length)
    : 85;

  // Aggregate topics distribution
  const topicFreq = {};
  keyMoments.forEach((km) => {
    const t = km.topic || 'General';
    topicFreq[t] = (topicFreq[t] || 0) + 1;
  });

  const topicDistribution = Object.entries(topicFreq).map(([topic, count]) => ({ topic, count }));

  res.json({
    success: true,
    data: {
      totalVideos: videos.length,
      totalWatchMinutes,
      avgQualityScore,
      totalKeyMomentsDetected: keyMoments.length,
      topKeywords,
      topicDistribution,
      filteredVideoId: selectedVideoId,
    },
  });
}));

// GET /api/analytics/export-report — Downloadable Platform Usage CSV Report (supports videoId filter)
router.get('/export-report', authenticate, asyncHandler(async (req, res) => {
  const isAdmin = req.user.role === 'ADMIN';
  const selectedVideoId = req.query.videoId ? String(req.query.videoId) : null;

  const userFilter = selectedVideoId
    ? { id: selectedVideoId, ...(isAdmin ? {} : { userId: req.user.id }) }
    : (isAdmin ? {} : { userId: req.user.id });

  const videos = await prisma.video.findMany({
    where: userFilter,
    include: {
      user: { select: { name: true, email: true } },
      summary: { select: { qualityScore: true, tone: true } },
      _count: { select: { keyMoments: true } },
    },
    orderBy: { createdAt: 'desc' },
  });

  // Build CSV string
  let csv = 'Video ID,Title,Owner,Status,Duration (sec),Views,Key Moments,Quality Score,Tone,Created At\n';
  videos.forEach((v) => {
    const safeTitle = `"${(v.title || '').replace(/"/g, '""')}"`;
    const safeOwner = `"${(v.user?.name || '').replace(/"/g, '""')}"`;
    const dur = v.duration ? Math.round(v.duration) : 0;
    const qScore = v.summary?.qualityScore ? `${v.summary.qualityScore}%` : 'N/A';
    const tone = v.summary?.tone || 'N/A';
    const date = new Date(v.createdAt).toISOString().split('T')[0];

    csv += `${v.id},${safeTitle},${safeOwner},${v.status},${dur},${v.viewCount},${v._count.keyMoments},${qScore},${tone},${date}\n`;
  });

  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', `attachment; filename="clipmind_analytics_report_${Date.now()}.csv"`);
  return res.send(csv);
}));

// GET /api/analytics/videos — Fetch analytics metrics for every video
router.get('/videos', authenticate, asyncHandler(async (req, res) => {
  const isAdmin = req.user.role === 'ADMIN';
  const videos = await prisma.video.findMany({
    where: isAdmin ? {} : { userId: req.user.id },
    select: {
      id: true,
      title: true,
      viewCount: true,
      status: true,
      duration: true,
      createdAt: true,
      user: { select: { name: true } },
      summary: { select: { qualityScore: true, tone: true } },
      _count: { select: { keyMoments: true } },
    },
    orderBy: { viewCount: 'desc' },
  });
  res.json({ success: true, data: { videos } });
}));

// GET /api/analytics/users (admin only)
router.get('/users', authenticate, asyncHandler(async (req, res, next) => {
  if (req.user.role !== 'ADMIN') return next({ statusCode: 403, message: 'Admin only.' });
  const [totalUsers, usersByRole, recentUsers] = await Promise.all([
    prisma.user.count(),
    prisma.user.groupBy({ by: ['role'], _count: { id: true } }),
    prisma.user.findMany({ orderBy: { createdAt: 'desc' }, take: 5, select: { id: true, name: true, email: true, role: true, createdAt: true } }),
  ]);
  const roleBreakdown = {};
  usersByRole.forEach((r) => { roleBreakdown[r.role] = r._count.id; });
  res.json({ success: true, data: { totalUsers, roleBreakdown, recentUsers } });
}));

module.exports = router;
