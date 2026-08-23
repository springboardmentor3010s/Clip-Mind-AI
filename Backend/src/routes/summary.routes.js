const express = require('express');
const { authenticate } = require('../middleware/auth.middleware');
const { asyncHandler, createError } = require('../middleware/error.middleware');
const { PrismaClient } = require('@prisma/client');
const { evaluateSummaryQuality } = require('../services/evaluation.service');

const prisma = new PrismaClient();
const router = express.Router();

// GET /api/summaries/:videoId — Get summary
router.get('/:videoId', authenticate, asyncHandler(async (req, res, next) => {
  const summary = await prisma.summary.findUnique({
    where: { videoId: req.params.videoId },
    include: {
      video: { select: { userId: true, isPublic: true } },
      ratings: { select: { rating: true, feedback: true, userId: true } },
    },
  });
  if (!summary) return next(createError('Summary not found.', 404));
  const isOwner = summary.video.userId === req.user.id;
  if (!isOwner && !summary.video.isPublic && req.user.role !== 'ADMIN') {
    return next(createError('Access denied.', 403));
  }

  // Calculate average user rating
  const totalRatings = summary.ratings.length;
  const avgUserRating = totalRatings > 0
    ? Number((summary.ratings.reduce((acc, r) => acc + r.rating, 0) / totalRatings).toFixed(1))
    : null;

  const userRating = summary.ratings.find((r) => r.userId === req.user.id);

  res.json({
    success: true,
    data: {
      summary: {
        ...summary,
        avgUserRating,
        userRating: userRating ? userRating.rating : null,
      },
    },
  });
}));

// GET /api/summaries/:videoId/evaluate — Full NLP quality evaluation audit report
router.get('/:videoId/evaluate', authenticate, asyncHandler(async (req, res, next) => {
  const summary = await prisma.summary.findUnique({
    where: { videoId: req.params.videoId },
    include: {
      video: {
        select: {
          id: true,
          title: true,
          userId: true,
          isPublic: true,
          transcript: true,
        },
      },
    },
  });

  if (!summary) return next(createError('Summary not found.', 404));
  const isOwner = summary.video.userId === req.user.id;
  if (!isOwner && !summary.video.isPublic && req.user.role !== 'ADMIN') {
    return next(createError('Access denied.', 403));
  }

  const transcriptText = summary.video.transcript?.content || '';
  let takeaways = [];
  try {
    takeaways = typeof summary.takeaways === 'string' ? JSON.parse(summary.takeaways) : summary.takeaways;
  } catch {
    takeaways = [];
  }

  const evalResult = evaluateSummaryQuality(
    transcriptText,
    summary.shortSummary,
    summary.detailedSummary,
    takeaways
  );

  res.json({
    success: true,
    data: {
      videoId: req.params.videoId,
      title: summary.video.title,
      evaluation: evalResult,
    },
  });
}));

// POST /api/summaries/:videoId/re-evaluate — Re-evaluate and persist updated quality scores
router.post('/:videoId/re-evaluate', authenticate, asyncHandler(async (req, res, next) => {
  const summary = await prisma.summary.findUnique({
    where: { videoId: req.params.videoId },
    include: {
      video: {
        include: { transcript: true },
      },
    },
  });

  if (!summary) return next(createError('Summary not found.', 404));
  if (summary.video.userId !== req.user.id && req.user.role !== 'ADMIN') {
    return next(createError('Access denied.', 403));
  }

  const transcriptText = summary.video.transcript?.content || '';
  let takeaways = [];
  try {
    takeaways = typeof summary.takeaways === 'string' ? JSON.parse(summary.takeaways) : summary.takeaways;
  } catch {
    takeaways = [];
  }

  const evalResult = evaluateSummaryQuality(
    transcriptText,
    summary.shortSummary,
    summary.detailedSummary,
    takeaways
  );

  const updated = await prisma.summary.update({
    where: { videoId: req.params.videoId },
    data: {
      readabilityScore: evalResult.readabilityScore,
      qualityScore: evalResult.qualityScore,
      metrics: JSON.stringify(evalResult.metrics || {}),
    },
  });

  res.json({
    success: true,
    message: 'Summary quality re-evaluated successfully.',
    data: {
      summary: updated,
      evaluation: evalResult,
    },
  });
}));

// PUT /api/summaries/:videoId — Edit summary
router.put('/:videoId', authenticate, asyncHandler(async (req, res, next) => {
  const { shortSummary, detailedSummary, takeaways } = req.body;
  const summary = await prisma.summary.findUnique({
    where: { videoId: req.params.videoId },
    include: { video: { include: { transcript: true } } },
  });

  if (!summary) return next(createError('Summary not found.', 404));
  if (summary.video.userId !== req.user.id && req.user.role !== 'ADMIN') {
    return next(createError('Access denied.', 403));
  }

  // Re-evaluate quality scores if text changed
  const transcriptText = summary.video.transcript?.content || '';
  const evalResult = evaluateSummaryQuality(
    transcriptText,
    shortSummary || summary.shortSummary,
    detailedSummary || summary.detailedSummary,
    takeaways || []
  );

  const updated = await prisma.summary.update({
    where: { videoId: req.params.videoId },
    data: {
      ...(shortSummary && { shortSummary }),
      ...(detailedSummary && { detailedSummary }),
      ...(takeaways && { takeaways: JSON.stringify(takeaways) }),
      readabilityScore: evalResult.readabilityScore,
      qualityScore: evalResult.qualityScore,
      metrics: JSON.stringify(evalResult.metrics || {}),
    },
  });

  res.json({ success: true, message: 'Summary updated.', data: { summary: updated } });
}));

// POST /api/summaries/:videoId/rating — Submit quality rating feedback (1-5 stars)
router.post('/:videoId/rating', authenticate, asyncHandler(async (req, res, next) => {
  const { rating, feedback } = req.body;
  if (!rating || rating < 1 || rating > 5) {
    return next(createError('Rating must be an integer between 1 and 5.', 400));
  }

  const summary = await prisma.summary.findUnique({
    where: { videoId: req.params.videoId },
  });
  if (!summary) return next(createError('Summary not found.', 404));

  const summaryRating = await prisma.summaryRating.upsert({
    where: {
      summaryId_userId: {
        summaryId: summary.id,
        userId: req.user.id,
      },
    },
    update: { rating: Number(rating), feedback: feedback || null },
    create: {
      summaryId: summary.id,
      userId: req.user.id,
      rating: Number(rating),
      feedback: feedback || null,
    },
  });

  // Log activity
  await prisma.activityLog.create({
    data: { userId: req.user.id, action: 'SUMMARY_RATING', resourceType: 'summary', resourceId: summary.id, metadata: JSON.stringify({ rating }) },
  });

  res.json({ success: true, message: 'Rating submitted successfully.', data: { rating: summaryRating } });
}));

module.exports = router;
