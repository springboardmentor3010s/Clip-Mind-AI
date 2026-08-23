const { PrismaClient } = require('@prisma/client');
const path = require('path');
const fs = require('fs');
const { createError } = require('../middleware/error.middleware');
const ffmpegService = require('../services/ffmpeg.service');
const jobQueue = require('../jobs/queue');
const logger = require('../utils/logger');

const prisma = new PrismaClient();

const uploadVideo = async (req, res, next) => {
  if (!req.file) return next(createError('No video file provided.', 400));

  const { title, description } = req.body;
  if (!title) return next(createError('Video title is required.', 400));

  const filePath = req.file.path;
  const fileName = req.file.filename;
  const fileSize = req.file.size;
  const mimeType = req.file.mimetype;

  // Create DB record
  const video = await prisma.video.create({
    data: {
      userId: req.user.id,
      title,
      description: description || null,
      fileName,
      filePath,
      fileSize: fileSize,
      mimeType,
      status: 'UPLOADING',
    },
  });

  // Extract metadata + thumbnail asynchronously, then auto-trigger AI pipeline
  ffmpegService.processUpload(video.id, filePath)
    .then(() => {
      logger.info(`[Upload] FFmpeg processing done for ${video.id} — auto-starting AI pipeline`);
      jobQueue.addTranscriptionJob(video.id);
    })
    .catch((err) =>
      logger.error(`FFmpeg processing failed for video ${video.id}: ${err.message}`)
    );


  // Log activity
  await prisma.activityLog.create({
    data: { userId: req.user.id, action: 'VIDEO_UPLOAD', resourceType: 'video', resourceId: video.id },
  });

  res.status(201).json({
    success: true,
    message: 'Video uploaded successfully. Processing started.',
    data: { video },
  });
};

const getVideos = async (req, res) => {
  const { page = 1, limit = 12, status, search } = req.query;
  const skip = (parseInt(page) - 1) * parseInt(limit);

  const where = req.user.role === 'ADMIN'
    ? {}
    : req.user.role === 'LEARNER'
      ? { isPublic: true }
      : { userId: req.user.id };

  if (status) where.status = status;
  if (search) where.title = { contains: search };

  const [videos, total] = await Promise.all([
    prisma.video.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip,
      take: parseInt(limit),
      include: {
        user: { select: { id: true, name: true, avatar: true } },
        _count: { select: { keyMoments: true } },
        summary: { select: { qualityScore: true } },
        jobs: { orderBy: { createdAt: 'desc' }, take: 1, select: { status: true, progress: true, metadata: true } },
      },
    }),
    prisma.video.count({ where }),
  ]);

  res.json({
    success: true,
    data: {
      videos,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit)),
      },
    },
  });
};

const getVideo = async (req, res, next) => {
  const video = await prisma.video.findUnique({
    where: { id: req.params.id },
    include: {
      user: { select: { id: true, name: true, avatar: true } },
      transcript: true,
      summary: true,
      keyMoments: { orderBy: { timestampStart: 'asc' } },
      jobs: { orderBy: { createdAt: 'desc' }, take: 5 },
    },
  });

  if (!video) return next(createError('Video not found.', 404));

  // Check access
  if (
    req.user.role !== 'ADMIN' &&
    video.userId !== req.user.id &&
    !video.isPublic &&
    req.user.role !== 'LEARNER'
  ) {
    return next(createError('Access denied.', 403));
  }

  // Increment view count
  await prisma.video.update({ where: { id: video.id }, data: { viewCount: { increment: 1 } } });

  res.json({ success: true, data: { video } });
};

const getPipelineStatus = async (req, res, next) => {
  const video = await prisma.video.findUnique({
    where: { id: req.params.id },
    include: {
      jobs: { orderBy: { createdAt: 'desc' }, take: 5 },
    },
  });

  if (!video) return next(createError('Video not found.', 404));
  if (video.userId !== req.user.id && req.user.role !== 'ADMIN' && !video.isPublic) {
    return next(createError('Access denied.', 403));
  }

  const latestJob = video.jobs[0] || null;
  let metadata = {};
  if (latestJob?.metadata) {
    try { metadata = JSON.parse(latestJob.metadata); } catch {}
  }

  res.json({
    success: true,
    data: {
      videoId: video.id,
      videoStatus: video.status,
      latestJob: latestJob ? {
        id: latestJob.id,
        type: latestJob.type,
        status: latestJob.status,
        progress: latestJob.progress,
        error: latestJob.error,
        stage: metadata.stage || 'UNKNOWN',
        metadata,
        updatedAt: latestJob.updatedAt,
      } : null,
    },
  });
};

const updateVideo = async (req, res, next) => {
  const video = await prisma.video.findUnique({ where: { id: req.params.id } });
  if (!video) return next(createError('Video not found.', 404));
  if (video.userId !== req.user.id && req.user.role !== 'ADMIN') {
    return next(createError('Access denied.', 403));
  }

  const { title, description, isPublic, duration } = req.body;
  const updated = await prisma.video.update({
    where: { id: req.params.id },
    data: {
      ...(title && { title }),
      ...(description !== undefined && { description }),
      ...(isPublic !== undefined && { isPublic }),
      ...(duration !== undefined && { duration: parseFloat(duration) }),
    },
  });

  // If duration changed, also rescale key moments to match new duration
  if (duration && parseFloat(duration) !== video.duration && video.duration) {
    const keyMoments = await prisma.keyMoment.findMany({ where: { videoId: req.params.id } });
    if (keyMoments.length > 0) {
      const oldDur = video.duration || 1;
      const newDur = parseFloat(duration);
      for (const m of keyMoments) {
        const ratioStart = m.timestampStart / oldDur;
        const ratioEnd = m.timestampEnd / oldDur;
        await prisma.keyMoment.update({
          where: { id: m.id },
          data: {
            timestampStart: Math.round(ratioStart * newDur * 10) / 10,
            timestampEnd: Math.round(ratioEnd * newDur * 10) / 10,
          },
        });
      }
    }
  }

  res.json({ success: true, message: 'Video updated.', data: { video: updated } });
};

const deleteVideo = async (req, res, next) => {
  const video = await prisma.video.findUnique({ where: { id: req.params.id } });
  if (!video) return next(createError('Video not found.', 404));
  if (video.userId !== req.user.id && req.user.role !== 'ADMIN') {
    return next(createError('Access denied.', 403));
  }

  // Delete file from disk
  try {
    if (fs.existsSync(video.filePath)) fs.unlinkSync(video.filePath);
    if (video.thumbnailPath && fs.existsSync(video.thumbnailPath)) fs.unlinkSync(video.thumbnailPath);
    if (video.audioPath && fs.existsSync(video.audioPath)) fs.unlinkSync(video.audioPath);
  } catch (err) {
    logger.warn(`Could not delete files for video ${video.id}: ${err.message}`);
  }

  await prisma.video.delete({ where: { id: req.params.id } });

  res.json({ success: true, message: 'Video deleted successfully.' });
};

const triggerProcessing = async (req, res, next) => {
  const video = await prisma.video.findUnique({ where: { id: req.params.id } });
  if (!video) return next(createError('Video not found.', 404));
  if (video.userId !== req.user.id && req.user.role !== 'ADMIN') {
    return next(createError('Access denied.', 403));
  }
  if (video.status === 'UPLOADING') return next(createError('Video is still uploading, please wait.', 400));

  // Add job to queue
  await jobQueue.addTranscriptionJob(video.id);

  res.json({ success: true, message: 'AI processing pipeline queued successfully.' });
};

module.exports = {
  uploadVideo,
  getVideos,
  getVideo,
  getPipelineStatus,
  deleteVideo,
  updateVideo,
  triggerProcessing,
};
