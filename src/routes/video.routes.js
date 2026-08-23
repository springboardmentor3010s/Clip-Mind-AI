const express = require('express');
const path = require('path');
const { authenticate } = require('../middleware/auth.middleware');
const { requirePermission } = require('../middleware/rbac.middleware');
const { upload, handleMulterError } = require('../middleware/upload.middleware');
const { asyncHandler, createError } = require('../middleware/error.middleware');
const {
  uploadVideo,
  getVideos,
  getVideo,
  getPipelineStatus,
  deleteVideo,
  updateVideo,
  triggerProcessing,
} = require('../controllers/video.controller');
const { getRealDuration } = require('../services/ffmpeg.service');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();
const UPLOADS_DIR = path.join(__dirname, '../../uploads');
const router = express.Router();

// Upload a video
router.post('/',
  authenticate,
  requirePermission('video', 'upload'),
  upload.single('video'),
  handleMulterError,
  asyncHandler(uploadVideo)
);

// Get all videos (own videos or public)
router.get('/', authenticate, asyncHandler(getVideos));

// Get single video
router.get('/:id', authenticate, asyncHandler(getVideo));

// Get live pipeline processing status
router.get('/:id/pipeline-status', authenticate, asyncHandler(getPipelineStatus));

// Update video metadata
router.put('/:id', authenticate, asyncHandler(updateVideo));

// Delete video
router.delete('/:id',
  authenticate,
  requirePermission('video', 'delete'),
  asyncHandler(deleteVideo)
);

// Trigger AI processing (transcription + summary + key moments)
router.post('/:id/process',
  authenticate,
  requirePermission('transcript', 'generate'),
  asyncHandler(triggerProcessing)
);

// POST /api/videos/:id/fix-timestamps — Re-read real duration from file & rescale key moments
router.post('/:id/fix-timestamps', authenticate, asyncHandler(async (req, res, next) => {
  const video = await prisma.video.findUnique({
    where: { id: req.params.id },
    include: { keyMoments: true },
  });

  if (!video) return next(createError('Video not found.', 404));
  if (video.userId !== req.user.id && req.user.role !== 'ADMIN') {
    return next(createError('Access denied.', 403));
  }

  // clientDuration: accurate duration reported by browser's HTMLVideoElement.duration
  // Used as fallback when FFmpeg/ffprobe is not installed on the server
  const clientDuration = req.body?.clientDuration ? parseFloat(req.body.clientDuration) : null;

  const filePath = path.join(UPLOADS_DIR, video.fileName);
  let realDuration = await getRealDuration(filePath);

  // Fall back to client-reported duration when ffprobe is unavailable
  if (!realDuration && clientDuration && clientDuration > 0) {
    realDuration = clientDuration;
  }

  if (!realDuration || realDuration <= 0) {
    return next(createError(
      'Could not determine video duration. Pass "clientDuration" (seconds) in the request body as a fallback.',
      422
    ));
  }

  const oldDuration = video.duration || null;
  const rescaled = [];

  // Update duration in DB with the real value
  await prisma.video.update({
    where: { id: video.id },
    data: { duration: realDuration },
  });

  // Rescale key moments:
  // If we have a valid oldDuration that differs from realDuration → proportional rescale
  // Otherwise (no stored duration, or dummy value) → evenly space across realDuration
  const moments = video.keyMoments;
  const useProportional = oldDuration && oldDuration > 0 && Math.abs(oldDuration - realDuration) > 0.5;

  for (let i = 0; i < moments.length; i++) {
    const m = moments[i];
    let newStart, newEnd;

    if (useProportional) {
      // Proportional rescale from oldDuration → realDuration
      const ratioStart = m.timestampStart / oldDuration;
      const ratioEnd   = m.timestampEnd   / oldDuration;
      newStart = Math.round(ratioStart * realDuration * 10) / 10;
      newEnd   = Math.round(ratioEnd   * realDuration * 10) / 10;
    } else {
      // Evenly distribute segments across real duration
      const segmentDuration = realDuration / moments.length;
      newStart = Math.round(i * segmentDuration * 10) / 10;
      newEnd   = Math.round(Math.min((i + 1) * segmentDuration, realDuration) * 10) / 10;
    }

    // Always clamp: no timestamp can exceed the real video duration
    newStart = Math.min(newStart, realDuration);
    newEnd   = Math.min(newEnd, realDuration);
    // Ensure start < end
    if (newEnd <= newStart) newEnd = Math.min(newStart + 1, realDuration);

    await prisma.keyMoment.update({
      where: { id: m.id },
      data: { timestampStart: newStart, timestampEnd: newEnd },
    });
    rescaled.push({ label: m.label, newStart, newEnd });
  }

  res.json({
    success: true,
    message: `Duration fixed to ${realDuration}s. ${rescaled.length} key moments rescaled.`,
    data: { realDuration, oldDuration, rescaled, strategy: useProportional ? 'proportional' : 'evenly-spaced' },
  });
}));

module.exports = router;
