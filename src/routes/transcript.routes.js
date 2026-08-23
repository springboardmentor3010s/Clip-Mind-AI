const express = require('express');
const { authenticate } = require('../middleware/auth.middleware');
const { asyncHandler, createError } = require('../middleware/error.middleware');
const { PrismaClient } = require('@prisma/client');
const { generateSRT, generateVTT } = require('../services/whisper.service');
const {
  validateTranscriptAccuracy,
  calculateWERandCER,
  autoCorrectTranscript,
} = require('../services/transcript-validation.service');

const prisma = new PrismaClient();
const router = express.Router();

// GET /api/transcripts/:videoId — Get transcript
router.get('/:videoId', authenticate, asyncHandler(async (req, res, next) => {
  const transcript = await prisma.transcript.findUnique({
    where: { videoId: req.params.videoId },
    include: { video: { select: { userId: true, isPublic: true, title: true, duration: true } } },
  });
  if (!transcript) return next(createError('Transcript not found.', 404));
  const isOwner = transcript.video.userId === req.user.id;
  if (!isOwner && !transcript.video.isPublic && req.user.role !== 'ADMIN') {
    return next(createError('Access denied.', 403));
  }
  res.json({ success: true, data: { transcript } });
}));

// GET /api/transcripts/:videoId/validate — Validate transcript accuracy & subtitle compliance
router.get('/:videoId/validate', authenticate, asyncHandler(async (req, res, next) => {
  const transcript = await prisma.transcript.findUnique({
    where: { videoId: req.params.videoId },
    include: { video: { select: { userId: true, isPublic: true, duration: true, title: true } } },
  });
  if (!transcript) return next(createError('Transcript not found.', 404));
  const isOwner = transcript.video.userId === req.user.id;
  if (!isOwner && !transcript.video.isPublic && req.user.role !== 'ADMIN') {
    return next(createError('Access denied.', 403));
  }

  const validationReport = validateTranscriptAccuracy(
    transcript.content,
    transcript.wordTimestamps,
    transcript.video.duration
  );

  res.json({
    success: true,
    data: {
      videoId: req.params.videoId,
      title: transcript.video.title,
      validation: validationReport,
    },
  });
}));

// POST /api/transcripts/:videoId/benchmark — Compare against reference text (WER / CER)
router.post('/:videoId/benchmark', authenticate, asyncHandler(async (req, res, next) => {
  const { referenceText } = req.body;
  if (!referenceText || !referenceText.trim()) {
    return next(createError('Reference ground truth text is required.', 400));
  }

  const transcript = await prisma.transcript.findUnique({
    where: { videoId: req.params.videoId },
    include: { video: { select: { userId: true, isPublic: true, title: true } } },
  });
  if (!transcript) return next(createError('Transcript not found.', 404));
  const isOwner = transcript.video.userId === req.user.id;
  if (!isOwner && !transcript.video.isPublic && req.user.role !== 'ADMIN') {
    return next(createError('Access denied.', 403));
  }

  const benchmarkResult = calculateWERandCER(transcript.content, referenceText);

  res.json({
    success: true,
    message: 'Transcript benchmarked successfully against reference text.',
    data: {
      videoId: req.params.videoId,
      benchmark: benchmarkResult,
    },
  });
}));

// POST /api/transcripts/:videoId/auto-correct — Auto-fix non-monotonic timestamps and repetition loops
router.post('/:videoId/auto-correct', authenticate, asyncHandler(async (req, res, next) => {
  const transcript = await prisma.transcript.findUnique({
    where: { videoId: req.params.videoId },
    include: { video: { select: { userId: true } } },
  });
  if (!transcript) return next(createError('Transcript not found.', 404));
  if (transcript.video.userId !== req.user.id && req.user.role !== 'ADMIN') {
    return next(createError('Access denied.', 403));
  }

  const { correctedContent, correctedTimestamps, stats } = autoCorrectTranscript(
    transcript.content,
    transcript.wordTimestamps
  );

  const updated = await prisma.transcript.update({
    where: { videoId: req.params.videoId },
    data: {
      content: correctedContent,
      wordTimestamps: JSON.stringify(correctedTimestamps),
    },
  });

  await prisma.activityLog.create({
    data: {
      userId: req.user.id,
      action: 'TRANSCRIPT_AUTOCORRECT',
      resourceType: 'transcript',
      resourceId: updated.id,
      metadata: JSON.stringify(stats),
    },
  });

  res.json({
    success: true,
    message: `Auto-corrected transcript: ${stats.timestampsFixed} timestamps fixed, ${stats.loopsRemoved} repetition loops cleared.`,
    data: { transcript: updated, stats },
  });
}));

// GET /api/transcripts/:videoId/export — Export transcript in TXT, SRT, or VTT format
router.get('/:videoId/export', authenticate, asyncHandler(async (req, res, next) => {
  const format = (req.query.format || 'txt').toLowerCase();
  const transcript = await prisma.transcript.findUnique({
    where: { videoId: req.params.videoId },
    include: { video: { select: { userId: true, isPublic: true, title: true } } },
  });

  if (!transcript) return next(createError('Transcript not found.', 404));
  const isOwner = transcript.video.userId === req.user.id;
  if (!isOwner && !transcript.video.isPublic && req.user.role !== 'ADMIN') {
    return next(createError('Access denied.', 403));
  }

  const safeTitle = (transcript.video.title || 'transcript').replace(/[^a-z0-9]/gi, '_').toLowerCase();

  if (format === 'srt') {
    const srtContent = generateSRT(transcript.content, transcript.wordTimestamps);
    res.setHeader('Content-Type', 'application/x-subrip');
    res.setHeader('Content-Disposition', `attachment; filename="${safeTitle}.srt"`);
    return res.send(srtContent);
  }

  if (format === 'vtt') {
    const vttContent = generateVTT(transcript.content, transcript.wordTimestamps);
    res.setHeader('Content-Type', 'text/vtt');
    res.setHeader('Content-Disposition', `attachment; filename="${safeTitle}.vtt"`);
    return res.send(vttContent);
  }

  // Default: TXT
  res.setHeader('Content-Type', 'text/plain');
  res.setHeader('Content-Disposition', `attachment; filename="${safeTitle}.txt"`);
  return res.send(transcript.content);
}));

// PUT /api/transcripts/:videoId — Edit transcript content
router.put('/:videoId', authenticate, asyncHandler(async (req, res, next) => {
  const { content } = req.body;
  if (!content) return next(createError('Content is required.', 400));
  const transcript = await prisma.transcript.findUnique({
    where: { videoId: req.params.videoId },
    include: { video: { select: { userId: true } } },
  });
  if (!transcript) return next(createError('Transcript not found.', 404));
  if (transcript.video.userId !== req.user.id && req.user.role !== 'ADMIN') {
    return next(createError('Access denied.', 403));
  }
  const updated = await prisma.transcript.update({
    where: { videoId: req.params.videoId },
    data: { content },
  });

  // Log activity
  await prisma.activityLog.create({
    data: { userId: req.user.id, action: 'TRANSCRIPT_EDIT', resourceType: 'transcript', resourceId: updated.id },
  });

  res.json({ success: true, message: 'Transcript updated successfully.', data: { transcript: updated } });
}));

// POST /api/transcripts/:videoId/submit — Accept user-provided transcript, regenerate all AI content from it
// Works with real OpenAI key (full GPT-4 analysis) OR without (smart content-aware extraction from submitted text)
router.post('/:videoId/submit', authenticate, asyncHandler(async (req, res, next) => {
  const { content, language = 'en' } = req.body;
  if (!content || !content.trim() || content.trim().length < 20) {
    return next(createError('Transcript content must be at least 20 characters.', 400));
  }

  const video = await prisma.video.findUnique({
    where: { id: req.params.videoId },
    include: { keyMoments: true },
  });
  if (!video) return next(createError('Video not found.', 404));
  if (video.userId !== req.user.id && req.user.role !== 'ADMIN') {
    return next(createError('Access denied.', 403));
  }

  const trimmedContent = content.trim();

  // 1. Save the user-provided transcript
  const transcript = await prisma.transcript.upsert({
    where: { videoId: req.params.videoId },
    update: {
      content: trimmedContent,
      language,
      wordTimestamps: JSON.stringify([]),
      status: 'COMPLETED',
    },
    create: {
      videoId: req.params.videoId,
      content: trimmedContent,
      language,
      wordTimestamps: JSON.stringify([]),
      status: 'COMPLETED',
    },
  });

  // 2. Generate summary + key moments from the REAL submitted content
  const { generateSummary, detectKeyMoments } = require('../services/openai.service');
  const { evaluateSummaryQuality } = require('../services/evaluation.service');

  const duration = video.duration || 60;
  const [summaryData, moments] = await Promise.all([
    generateSummary(trimmedContent, video.title),
    detectKeyMoments(trimmedContent, duration),
  ]);

  // 3. Evaluate summary quality against the real transcript
  const evalResult = evaluateSummaryQuality(
    trimmedContent,
    summaryData.shortSummary,
    summaryData.detailedSummary,
    summaryData.takeaways || []
  );

  // 4. Persist summary
  await prisma.summary.upsert({
    where: { videoId: req.params.videoId },
    update: {
      shortSummary: summaryData.shortSummary,
      detailedSummary: summaryData.detailedSummary,
      takeaways: JSON.stringify(summaryData.takeaways || []),
      keywords: JSON.stringify(summaryData.keywords || []),
      topics: JSON.stringify(summaryData.topics || []),
      tone: summaryData.tone || 'Informative',
      readabilityScore: evalResult.readabilityScore,
      qualityScore: evalResult.qualityScore,
      metrics: JSON.stringify(evalResult.metrics || {}),
      status: 'COMPLETED',
    },
    create: {
      videoId: req.params.videoId,
      shortSummary: summaryData.shortSummary,
      detailedSummary: summaryData.detailedSummary,
      takeaways: JSON.stringify(summaryData.takeaways || []),
      keywords: JSON.stringify(summaryData.keywords || []),
      topics: JSON.stringify(summaryData.topics || []),
      tone: summaryData.tone || 'Informative',
      readabilityScore: evalResult.readabilityScore,
      qualityScore: evalResult.qualityScore,
      metrics: JSON.stringify(evalResult.metrics || {}),
      status: 'COMPLETED',
    },
  });

  // 5. Replace key moments
  await prisma.keyMoment.deleteMany({ where: { videoId: req.params.videoId } });
  if (moments.length > 0) {
    await prisma.keyMoment.createMany({
      data: moments.map((m) => ({ videoId: req.params.videoId, ...m })),
    });
  }

  // 6. Log activity
  await prisma.activityLog.create({
    data: {
      userId: req.user.id,
      action: 'TRANSCRIPT_SUBMIT',
      resourceType: 'transcript',
      resourceId: transcript.id,
      metadata: JSON.stringify({ wordCount: trimmedContent.split(/\s+/).length, keyMomentsGenerated: moments.length }),
    },
  });

  res.json({
    success: true,
    message: `Transcript saved and AI content regenerated from your real content. ${moments.length} key moments created.`,
    data: {
      transcript,
      summaryQualityScore: evalResult.qualityScore,
      keyMomentsCount: moments.length,
    },
  });
}));

module.exports = router;
