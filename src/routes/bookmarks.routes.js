const express = require('express');
const { authenticate } = require('../middleware/auth.middleware');
const { asyncHandler, createError } = require('../middleware/error.middleware');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();
const router = express.Router();

// All bookmark routes require authentication
router.use(authenticate);

// GET /api/bookmarks — List all bookmarks for current user
router.get('/', asyncHandler(async (req, res) => {
  const bookmarks = await prisma.bookmark.findMany({
    where: { userId: req.user.id },
    orderBy: { createdAt: 'desc' },
    include: {
      video: {
        select: {
          id: true,
          title: true,
          thumbnailPath: true,
          duration: true,
          status: true,
          summary: { select: { shortSummary: true, qualityScore: true } },
        },
      },
      keyMoment: {
        select: {
          id: true,
          label: true,
          description: true,
          timestampStart: true,
          timestampEnd: true,
          topic: true,
        },
      },
    },
  });

  res.json({ success: true, data: { bookmarks } });
}));

// POST /api/bookmarks — Create or toggle a bookmark (video level or key moment level)
router.post('/', asyncHandler(async (req, res, next) => {
  const { videoId, keyMomentId, note } = req.body;
  if (!videoId) return next(createError('videoId is required.', 400));

  const video = await prisma.video.findUnique({ where: { id: videoId } });
  if (!video) return next(createError('Video not found.', 404));

  // Check if bookmark already exists
  const existing = await prisma.bookmark.findFirst({
    where: {
      userId: req.user.id,
      videoId,
      keyMomentId: keyMomentId || null,
    },
  });

  if (existing) {
    // If note is provided, update note; otherwise delete (toggle off)
    if (note !== undefined && note !== existing.note) {
      const updated = await prisma.bookmark.update({
        where: { id: existing.id },
        data: { note },
      });
      return res.json({ success: true, message: 'Bookmark note updated.', data: { bookmark: updated, bookmarked: true } });
    } else {
      await prisma.bookmark.delete({ where: { id: existing.id } });
      await prisma.activityLog.create({
        data: { userId: req.user.id, action: 'BOOKMARK_REMOVE', resourceType: 'video', resourceId: videoId },
      });
      return res.json({ success: true, message: 'Bookmark removed.', data: { bookmark: null, bookmarked: false } });
    }
  }

  // Create new bookmark
  const newBookmark = await prisma.bookmark.create({
    data: {
      userId: req.user.id,
      videoId,
      keyMomentId: keyMomentId || null,
      note: note || null,
    },
    include: {
      keyMoment: true,
    },
  });

  // Log activity
  await prisma.activityLog.create({
    data: {
      userId: req.user.id,
      action: keyMomentId ? 'BOOKMARK_KEY_MOMENT' : 'BOOKMARK_VIDEO',
      resourceType: 'bookmark',
      resourceId: newBookmark.id,
      metadata: JSON.stringify({ videoTitle: video.title, keyMomentId }),
    },
  });

  res.status(201).json({
    success: true,
    message: 'Bookmarked successfully.',
    data: { bookmark: newBookmark, bookmarked: true },
  });
}));

// DELETE /api/bookmarks/:id — Remove a bookmark by ID
router.delete('/:id', asyncHandler(async (req, res, next) => {
  const bookmark = await prisma.bookmark.findUnique({ where: { id: req.params.id } });
  if (!bookmark) return next(createError('Bookmark not found.', 404));
  if (bookmark.userId !== req.user.id && req.user.role !== 'ADMIN') {
    return next(createError('Access denied.', 403));
  }

  await prisma.bookmark.delete({ where: { id: req.params.id } });
  res.json({ success: true, message: 'Bookmark removed.' });
}));

module.exports = router;
