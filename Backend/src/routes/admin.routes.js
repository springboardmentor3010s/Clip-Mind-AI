const express = require('express');
const path = require('path');
const fs = require('fs');
const os = require('os');
const { authenticate } = require('../middleware/auth.middleware');
const { requireRole } = require('../middleware/rbac.middleware');
const { asyncHandler, createError } = require('../middleware/error.middleware');
const { PrismaClient } = require('@prisma/client');
const jobQueue = require('../jobs/queue');

const prisma = new PrismaClient();
const router = express.Router();

// In-memory platform settings store
let platformSettings = {
  aiProvider: process.env.OPENAI_API_KEY && !process.env.OPENAI_API_KEY.startsWith('sk-your') ? 'OpenAI GPT-4o & Whisper' : 'Intelligent Local NLP & Speech Fallback',
  mockAiEnabled: !process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY.startsWith('sk-your'),
  maxUploadSizeMB: 500,
  allowedFormats: ['MP4', 'MOV', 'AVI', 'WebM', 'MKV'],
  defaultSummaryTone: 'Educational & Analytical',
  autoQualityBenchmarking: true,
  retentionDays: 90,
};

// All admin routes require ADMIN role
router.use(authenticate, requireRole('ADMIN'));

// GET /api/admin/users
router.get('/users', asyncHandler(async (req, res) => {
  const { page = 1, limit = 50, role, search } = req.query;
  const skip = (parseInt(page) - 1) * parseInt(limit);
  const where = {};
  if (role) where.role = role;
  if (search) where.OR = [
    { name: { contains: search } },
    { email: { contains: search } },
  ];

  const [users, total] = await Promise.all([
    prisma.user.findMany({
      where, skip, take: parseInt(limit),
      orderBy: { createdAt: 'desc' },
      select: { id: true, email: true, name: true, role: true, isActive: true, createdAt: true, _count: { select: { videos: true, bookmarks: true } } },
    }),
    prisma.user.count({ where }),
  ]);
  res.json({ success: true, data: { users, pagination: { page: parseInt(page), limit: parseInt(limit), total } } });
}));

// PATCH /api/admin/users/:id
router.patch('/users/:id', asyncHandler(async (req, res, next) => {
  const { role, isActive } = req.body;
  if (req.params.id === req.user.id) return next(createError('Cannot modify your own account.', 400));
  const updated = await prisma.user.update({
    where: { id: req.params.id },
    data: { ...(role && { role }), ...(isActive !== undefined && { isActive }) },
    select: { id: true, email: true, name: true, role: true, isActive: true },
  });
  res.json({ success: true, data: { user: updated } });
}));

// DELETE /api/admin/users/:id
router.delete('/users/:id', asyncHandler(async (req, res, next) => {
  if (req.params.id === req.user.id) return next(createError('Cannot delete your own account.', 400));
  await prisma.user.delete({ where: { id: req.params.id } });
  res.json({ success: true, message: 'User deleted.' });
}));

// GET /api/admin/jobs
router.get('/jobs', asyncHandler(async (req, res) => {
  const jobs = await prisma.job.findMany({
    orderBy: { createdAt: 'desc' },
    take: 50,
    include: { video: { select: { id: true, title: true, status: true } } },
  });
  res.json({ success: true, data: { jobs } });
}));

// POST /api/admin/jobs/:id/retry — Retry failed or pending job
router.post('/jobs/:id/retry', asyncHandler(async (req, res, next) => {
  const job = await prisma.job.findUnique({
    where: { id: req.params.id },
    include: { video: true },
  });
  if (!job) return next(createError('Job not found.', 404));

  // Reset job status
  await prisma.job.update({
    where: { id: job.id },
    data: { status: 'PROCESSING', progress: 10, error: null },
  });

  // Re-queue processing
  jobQueue.addTranscriptionJob(job.videoId);

  res.json({ success: true, message: 'Job retry initiated successfully.' });
}));

// GET /api/admin/logs
router.get('/logs', asyncHandler(async (req, res) => {
  const { action, search } = req.query;
  const where = {};
  if (action) where.action = action;

  const logs = await prisma.activityLog.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    take: 100,
    include: { user: { select: { id: true, name: true, email: true, role: true } } },
  });

  res.json({ success: true, data: { logs } });
}));

// GET /api/admin/all-videos — Global video content management
router.get('/all-videos', asyncHandler(async (req, res) => {
  const videos = await prisma.video.findMany({
    orderBy: { createdAt: 'desc' },
    include: {
      user: { select: { id: true, name: true, email: true } },
      _count: { select: { keyMoments: true, bookmarks: true } },
      summary: { select: { qualityScore: true, tone: true } },
    },
  });

  res.json({ success: true, data: { videos } });
}));

// PATCH /api/admin/videos/:id — Admin moderate video visibility
router.patch('/videos/:id', asyncHandler(async (req, res, next) => {
  const { isPublic, title } = req.body;
  const updated = await prisma.video.update({
    where: { id: req.params.id },
    data: {
      ...(isPublic !== undefined && { isPublic }),
      ...(title && { title }),
    },
  });

  await prisma.activityLog.create({
    data: {
      userId: req.user.id,
      action: 'ADMIN_MODERATE_VIDEO',
      resourceType: 'video',
      resourceId: req.params.id,
      metadata: JSON.stringify({ isPublic, title }),
    },
  });

  res.json({ success: true, message: 'Video moderated successfully.', data: { video: updated } });
}));

// GET /api/admin/system-metrics — Server storage utilization & resource telemetry
router.get('/system-metrics', asyncHandler(async (req, res) => {
  const uploadsDir = path.join(__dirname, '../../uploads');
  let totalDiskBytes = 0;
  let videoFilesCount = 0;
  let audioFilesCount = 0;
  let thumbFilesCount = 0;

  if (fs.existsSync(uploadsDir)) {
    const files = fs.readdirSync(uploadsDir);
    files.forEach((file) => {
      try {
        const filePath = path.join(uploadsDir, file);
        const stats = fs.statSync(filePath);
        if (stats.isFile()) {
          totalDiskBytes += stats.size;
          const ext = path.extname(file).toLowerCase();
          if (['.mp4', '.mov', '.avi', '.webm', '.mkv'].includes(ext)) videoFilesCount++;
          else if (['.mp3', '.wav', '.aac', '.m4a'].includes(ext)) audioFilesCount++;
          else if (['.jpg', '.jpeg', '.png', '.webp'].includes(ext)) thumbFilesCount++;
        }
      } catch {}
    });
  }

  const memory = process.memoryUsage();
  const [totalUsers, totalVideos, totalSummaries, totalTranscripts, totalMoments] = await Promise.all([
    prisma.user.count(),
    prisma.video.count(),
    prisma.summary.count(),
    prisma.transcript.count(),
    prisma.keyMoment.count(),
  ]);

  res.json({
    success: true,
    data: {
      storage: {
        totalDiskBytes,
        totalDiskFormatted: `${(totalDiskBytes / (1024 * 1024)).toFixed(2)} MB`,
        videoFilesCount,
        audioFilesCount,
        thumbFilesCount,
        uploadsDirectory: uploadsDir,
      },
      resources: {
        nodeVersion: process.version,
        platform: process.platform,
        uptimeSeconds: Math.round(process.uptime()),
        memoryRssMB: Math.round(memory.rss / (1024 * 1024)),
        heapUsedMB: Math.round(memory.heapUsed / (1024 * 1024)),
        totalSystemMemMB: Math.round(os.totalmem() / (1024 * 1024)),
        freeSystemMemMB: Math.round(os.freemem() / (1024 * 1024)),
        cpuCores: os.cpus().length,
      },
      counts: {
        totalUsers,
        totalVideos,
        totalSummaries,
        totalTranscripts,
        totalMoments,
      },
    },
  });
}));

// GET /api/admin/settings — View platform settings
router.get('/settings', asyncHandler(async (req, res) => {
  res.json({ success: true, data: { settings: platformSettings } });
}));

// PUT /api/admin/settings — Update platform settings
router.put('/settings', asyncHandler(async (req, res) => {
  const { maxUploadSizeMB, defaultSummaryTone, autoQualityBenchmarking, retentionDays } = req.body;
  platformSettings = {
    ...platformSettings,
    ...(maxUploadSizeMB !== undefined && { maxUploadSizeMB: Number(maxUploadSizeMB) }),
    ...(defaultSummaryTone !== undefined && { defaultSummaryTone }),
    ...(autoQualityBenchmarking !== undefined && { autoQualityBenchmarking: Boolean(autoQualityBenchmarking) }),
    ...(retentionDays !== undefined && { retentionDays: Number(retentionDays) }),
  };

  await prisma.activityLog.create({
    data: {
      userId: req.user.id,
      action: 'ADMIN_SETTINGS_UPDATE',
      resourceType: 'system_settings',
      metadata: JSON.stringify(platformSettings),
    },
  });

  res.json({ success: true, message: 'Platform settings updated successfully.', data: { settings: platformSettings } });
}));

module.exports = router;
