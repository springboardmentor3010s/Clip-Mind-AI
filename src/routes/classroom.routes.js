const express = require('express');
const { authenticate } = require('../middleware/auth.middleware');
const { asyncHandler, createError } = require('../middleware/error.middleware');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();
const router = express.Router();

// Helper: only educator's own videos (or all if admin)
const educatorFilter = (userId, role) =>
  role === 'ADMIN' ? {} : { userId };

// Generate random classroom join code (e.g. AI-9824)
function generateClassCode(prefix = 'CLS') {
  const p = (prefix.replace(/[^A-Za-z]/g, '').slice(0, 3) || 'CLS').toUpperCase();
  const num = Math.floor(1000 + Math.random() * 9000);
  return `${p}-${num}`;
}

// ─── GET /api/classroom/list ───────────────────────────────────────────────
// List all classrooms for educator (or enrolled for learners, or all for admin)
router.get('/list', authenticate, asyncHandler(async (req, res) => {
  const isAdmin = req.user.role === 'ADMIN';
  const isEducator = req.user.role === 'EDUCATOR' || isAdmin;

  let classrooms;
  if (isEducator) {
    classrooms = await prisma.classroom.findMany({
      where: isAdmin ? {} : { instructorId: req.user.id },
      include: {
        instructor: { select: { id: true, name: true, email: true } },
        _count: { select: { classroomVideos: true, members: true } },
        classroomVideos: {
          include: {
            video: {
              select: {
                id: true,
                title: true,
                status: true,
                viewCount: true,
                duration: true,
                createdAt: true,
              },
            },
          },
        },
        members: {
          include: {
            user: { select: { id: true, name: true, email: true, role: true } },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  } else {
    // Learner: enrolled classrooms
    const memberships = await prisma.classroomMember.findMany({
      where: { userId: req.user.id },
      include: {
        classroom: {
          include: {
            instructor: { select: { id: true, name: true, email: true } },
            _count: { select: { classroomVideos: true, members: true } },
            classroomVideos: {
              include: {
                video: {
                  select: { id: true, title: true, status: true, duration: true },
                },
              },
            },
          },
        },
      },
    });
    classrooms = memberships.map((m) => m.classroom);
  }

  res.json({ success: true, data: { classrooms } });
}));

// ─── POST /api/classroom/create ─────────────────────────────────────────────
// Create a new classroom
router.post('/create', authenticate, asyncHandler(async (req, res, next) => {
  if (req.user.role !== 'EDUCATOR' && req.user.role !== 'ADMIN') {
    return next(createError('Only educators or admins can create classrooms.', 403));
  }

  const { name, subject, description, customCode } = req.body;
  if (!name || !name.trim()) {
    return next(createError('Classroom name is required.', 400));
  }

  let code = customCode ? customCode.trim().toUpperCase() : generateClassCode(subject || name);

  // Check unique code
  const existing = await prisma.classroom.findUnique({ where: { code } });
  if (existing) {
    code = generateClassCode(subject || name);
  }

  const classroom = await prisma.classroom.create({
    data: {
      name: name.trim(),
      subject: subject?.trim() || 'General',
      description: description?.trim() || '',
      code,
      instructorId: req.user.id,
    },
    include: {
      instructor: { select: { id: true, name: true, email: true } },
      _count: { select: { classroomVideos: true, members: true } },
    },
  });

  // Log activity
  await prisma.activityLog.create({
    data: {
      userId: req.user.id,
      action: 'CLASSROOM_CREATE',
      resourceType: 'classroom',
      resourceId: classroom.id,
      metadata: JSON.stringify({ name: classroom.name, code: classroom.code }),
    },
  });

  res.status(201).json({
    success: true,
    message: `Classroom "${classroom.name}" created successfully with code ${classroom.code}.`,
    data: { classroom },
  });
}));

// ─── PUT /api/classroom/:id ─────────────────────────────────────────────────
// Update classroom
router.put('/:id', authenticate, asyncHandler(async (req, res, next) => {
  const classroom = await prisma.classroom.findUnique({ where: { id: req.params.id } });
  if (!classroom) return next(createError('Classroom not found.', 404));

  if (classroom.instructorId !== req.user.id && req.user.role !== 'ADMIN') {
    return next(createError('Access denied.', 403));
  }

  const { name, subject, description } = req.body;
  const updated = await prisma.classroom.update({
    where: { id: classroom.id },
    data: {
      name: name !== undefined ? name.trim() : classroom.name,
      subject: subject !== undefined ? subject.trim() : classroom.subject,
      description: description !== undefined ? description.trim() : classroom.description,
    },
  });

  res.json({ success: true, message: 'Classroom updated successfully.', data: { classroom: updated } });
}));

// ─── DELETE /api/classroom/:id ──────────────────────────────────────────────
// Delete classroom
router.delete('/:id', authenticate, asyncHandler(async (req, res, next) => {
  const classroom = await prisma.classroom.findUnique({ where: { id: req.params.id } });
  if (!classroom) return next(createError('Classroom not found.', 404));

  if (classroom.instructorId !== req.user.id && req.user.role !== 'ADMIN') {
    return next(createError('Access denied.', 403));
  }

  await prisma.classroom.delete({ where: { id: classroom.id } });
  res.json({ success: true, message: `Classroom "${classroom.name}" deleted.` });
}));

// ─── POST /api/classroom/:id/videos ─────────────────────────────────────────
// Assign video to classroom
router.post('/:id/videos', authenticate, asyncHandler(async (req, res, next) => {
  const classroom = await prisma.classroom.findUnique({ where: { id: req.params.id } });
  if (!classroom) return next(createError('Classroom not found.', 404));

  if (classroom.instructorId !== req.user.id && req.user.role !== 'ADMIN') {
    return next(createError('Access denied.', 403));
  }

  const { videoId } = req.body;
  if (!videoId) return next(createError('videoId is required.', 400));

  const video = await prisma.video.findUnique({ where: { id: videoId } });
  if (!video) return next(createError('Video not found.', 404));

  const link = await prisma.classroomVideo.upsert({
    where: { classroomId_videoId: { classroomId: classroom.id, videoId } },
    update: {},
    create: { classroomId: classroom.id, videoId },
    include: { video: { select: { id: true, title: true, status: true, duration: true } } },
  });

  res.json({ success: true, message: `Added "${video.title}" to ${classroom.name}.`, data: { link } });
}));

// ─── DELETE /api/classroom/:id/videos/:videoId ──────────────────────────────
// Remove video from classroom
router.delete('/:id/videos/:videoId', authenticate, asyncHandler(async (req, res, next) => {
  const classroom = await prisma.classroom.findUnique({ where: { id: req.params.id } });
  if (!classroom) return next(createError('Classroom not found.', 404));

  if (classroom.instructorId !== req.user.id && req.user.role !== 'ADMIN') {
    return next(createError('Access denied.', 403));
  }

  await prisma.classroomVideo.deleteMany({
    where: { classroomId: classroom.id, videoId: req.params.videoId },
  });

  res.json({ success: true, message: 'Video removed from classroom.' });
}));

// ─── POST /api/classroom/join ───────────────────────────────────────────────
// Student joins a classroom via code
router.post('/join', authenticate, asyncHandler(async (req, res, next) => {
  const { code } = req.body;
  if (!code || !code.trim()) return next(createError('Classroom join code is required.', 400));

  const classroom = await prisma.classroom.findUnique({
    where: { code: code.trim().toUpperCase() },
    include: { instructor: { select: { name: true } } },
  });

  if (!classroom) return next(createError('Invalid classroom code. No classroom found with that code.', 404));

  const member = await prisma.classroomMember.upsert({
    where: { classroomId_userId: { classroomId: classroom.id, userId: req.user.id } },
    update: {},
    create: { classroomId: classroom.id, userId: req.user.id },
  });

  // Log activity
  await prisma.activityLog.create({
    data: {
      userId: req.user.id,
      action: 'CLASSROOM_JOIN',
      resourceType: 'classroom',
      resourceId: classroom.id,
      metadata: JSON.stringify({ classroomName: classroom.name }),
    },
  });

  res.json({
    success: true,
    message: `Successfully joined "${classroom.name}" (Instructor: ${classroom.instructor?.name}).`,
    data: { classroom, member },
  });
}));

// ─── GET /api/classroom/overview ────────────────────────────────────────────
// All educator's videos with status + transcript/summary completion (supports ?classroomId=...)
router.get('/overview', authenticate, asyncHandler(async (req, res) => {
  const { classroomId } = req.query;
  const baseFilter = educatorFilter(req.user.id, req.user.role);

  let where = { ...baseFilter };
  if (classroomId) {
    where = {
      ...baseFilter,
      classroomVideos: { some: { classroomId: String(classroomId) } },
    };
  }

  const [videos, classrooms] = await Promise.all([
    prisma.video.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        transcript: { select: { status: true, updatedAt: true } },
        summary:    { select: { status: true, qualityScore: true, shortSummary: true } },
        _count:     { select: { keyMoments: true, bookmarks: true } },
        classroomVideos: { include: { classroom: { select: { id: true, name: true, code: true } } } },
      },
    }),
    prisma.classroom.findMany({
      where: req.user.role === 'ADMIN' ? {} : { instructorId: req.user.id },
      select: { id: true, name: true, code: true, subject: true, _count: { select: { classroomVideos: true, members: true } } },
    }),
  ]);

  const totals = {
    totalVideos:      videos.length,
    readyVideos:      videos.filter((v) => v.status === 'READY').length,
    processingVideos: videos.filter((v) => v.status === 'PROCESSING').length,
    failedVideos:     videos.filter((v) => v.status === 'FAILED').length,
    totalTranscripts: videos.filter((v) => v.transcript?.status === 'COMPLETED').length,
    totalSummaries:   videos.filter((v) => v.summary?.status === 'COMPLETED').length,
    totalViews:       videos.reduce((acc, v) => acc + (v.viewCount || 0), 0),
    totalBookmarks:   videos.reduce((acc, v) => acc + (v._count?.bookmarks || 0), 0),
    totalKeyMoments:  videos.reduce((acc, v) => acc + (v._count?.keyMoments || 0), 0),
    totalClassrooms:  classrooms.length,
  };

  res.json({ success: true, data: { videos, totals, classrooms } });
}));

// ─── GET /api/classroom/analytics ───────────────────────────────────────────
// Per-video analytics (supports ?classroomId=...)
router.get('/analytics', authenticate, asyncHandler(async (req, res) => {
  const { classroomId } = req.query;
  const baseFilter = educatorFilter(req.user.id, req.user.role);

  let where = { ...baseFilter, status: 'READY' };
  if (classroomId) {
    where = {
      ...baseFilter,
      status: 'READY',
      classroomVideos: { some: { classroomId: String(classroomId) } },
    };
  }

  const videos = await prisma.video.findMany({
    where,
    orderBy: { viewCount: 'desc' },
    select: {
      id:        true,
      title:     true,
      viewCount: true,
      duration:  true,
      createdAt: true,
      isPublic:  true,
      summary: {
        select: {
          qualityScore:     true,
          readabilityScore: true,
          tone:             true,
          keywords:         true,
          topics:           true,
        },
      },
      _count: { select: { keyMoments: true, bookmarks: true } },
      classroomVideos: { include: { classroom: { select: { id: true, name: true } } } },
    },
  });

  const avgQuality = videos.length > 0
    ? Math.round(
        videos.reduce((acc, v) => acc + (v.summary?.qualityScore || 0), 0) / videos.length
      )
    : 0;
  const totalViews   = videos.reduce((acc, v) => acc + (v.viewCount || 0), 0);
  const totalMinutes = Math.round(
    videos.reduce((acc, v) => acc + (v.duration || 0), 0) / 60
  );

  res.json({
    success: true,
    data: { videos, avgQuality, totalViews, totalMinutes },
  });
}));

// ─── GET /api/classroom/engagement ──────────────────────────────────────────
// Student engagement (supports ?classroomId=...)
router.get('/engagement', authenticate, asyncHandler(async (req, res) => {
  const { classroomId } = req.query;
  const baseFilter = educatorFilter(req.user.id, req.user.role);

  let where = { ...baseFilter };
  if (classroomId) {
    where = {
      ...baseFilter,
      classroomVideos: { some: { classroomId: String(classroomId) } },
    };
  }

  const myVideos = await prisma.video.findMany({
    where,
    select: { id: true, title: true, viewCount: true },
  });
  const myVideoIds = myVideos.map((v) => v.id);

  if (myVideoIds.length === 0) {
    return res.json({
      success: true,
      data: {
        engagementByVideo: [],
        recentBookmarks: [],
        totalBookmarks: 0,
        totalUniqueEngagements: 0,
      },
    });
  }

  const bookmarks = await prisma.bookmark.findMany({
    where: {
      videoId: { in: myVideoIds },
      userId: req.user.role === 'ADMIN' ? undefined : { not: req.user.id },
    },
    include: {
      user:     { select: { name: true, role: true } },
      video:    { select: { title: true } },
      keyMoment:{ select: { label: true, timestampStart: true } },
    },
    orderBy: { createdAt: 'desc' },
    take: 50,
  });

  const engagementByVideo = myVideos.map((v) => {
    const vBookmarks = bookmarks.filter((b) => b.videoId === v.id);
    const uniqueUsers = new Set(vBookmarks.map((b) => b.userId)).size;
    return {
      videoId:        v.id,
      title:          v.title,
      viewCount:      v.viewCount || 0,
      bookmarkCount:  vBookmarks.length,
      uniqueStudents: uniqueUsers,
      engagementRate: v.viewCount > 0
        ? Math.min(100, Math.round((vBookmarks.length / v.viewCount) * 100))
        : 0,
    };
  }).sort((a, b) => b.bookmarkCount - a.bookmarkCount);

  const uniqueUserIds = new Set(bookmarks.map((b) => b.userId));

  res.json({
    success: true,
    data: {
      engagementByVideo,
      recentBookmarks: bookmarks.slice(0, 20),
      totalBookmarks:           bookmarks.length,
      totalUniqueEngagements:   uniqueUserIds.size,
    },
  });
}));

// ─── GET /api/classroom/activity-feed ───────────────────────────────────────
// Activity feed
router.get('/activity-feed', authenticate, asyncHandler(async (req, res) => {
  const { classroomId } = req.query;
  const baseFilter = educatorFilter(req.user.id, req.user.role);

  let where = { ...baseFilter };
  if (classroomId) {
    where = {
      ...baseFilter,
      classroomVideos: { some: { classroomId: String(classroomId) } },
    };
  }

  const myVideoIds = (
    await prisma.video.findMany({ where, select: { id: true } })
  ).map((v) => v.id);

  const activities = await prisma.activityLog.findMany({
    where: {
      resourceType: 'video',
      resourceId: myVideoIds.length > 0 ? { in: myVideoIds } : undefined,
      userId: req.user.role === 'ADMIN' ? undefined : { not: req.user.id },
    },
    include: {
      user: { select: { name: true, role: true } },
    },
    orderBy: { createdAt: 'desc' },
    take: 30,
  });

  res.json({ success: true, data: { activities } });
}));

module.exports = router;
