const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const { createError } = require('../middleware/error.middleware');

const prisma = new PrismaClient();

const getProfile = async (req, res) => {
  const user = await prisma.user.findUnique({
    where: { id: req.user.id },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      avatar: true,
      bio: true,
      createdAt: true,
      _count: { select: { videos: true, bookmarks: true } },
    },
  });
  res.json({ success: true, data: { user } });
};

const updateProfile = async (req, res) => {
  const { name, bio, avatar } = req.body;
  const updated = await prisma.user.update({
    where: { id: req.user.id },
    data: {
      ...(name && { name }),
      ...(bio !== undefined && { bio }),
      ...(avatar !== undefined && { avatar }),
    },
    select: { id: true, email: true, name: true, role: true, avatar: true, bio: true },
  });

  // Log activity
  await prisma.activityLog.create({
    data: { userId: req.user.id, action: 'PROFILE_UPDATE', resourceType: 'user', resourceId: req.user.id },
  });

  res.json({ success: true, message: 'Profile updated successfully.', data: { user: updated } });
};

const changePassword = async (req, res, next) => {
  const { currentPassword, newPassword } = req.body;
  if (!currentPassword || !newPassword) {
    return next(createError('Current password and new password are required.', 400));
  }
  if (newPassword.length < 6) {
    return next(createError('New password must be at least 6 characters.', 400));
  }

  const user = await prisma.user.findUnique({ where: { id: req.user.id } });
  if (!user) return next(createError('User not found.', 404));

  const isMatch = await bcrypt.compare(currentPassword, user.passwordHash);
  if (!isMatch) return next(createError('Current password is incorrect.', 400));

  const newHash = await bcrypt.hash(newPassword, 12);
  await prisma.user.update({
    where: { id: req.user.id },
    data: { passwordHash: newHash },
  });

  await prisma.activityLog.create({
    data: { userId: req.user.id, action: 'PASSWORD_CHANGE', resourceType: 'user', resourceId: req.user.id },
  });

  res.json({ success: true, message: 'Password changed successfully.' });
};

const getActivityHistory = async (req, res) => {
  const { page = 1, limit = 20, action } = req.query;
  const skip = (parseInt(page) - 1) * parseInt(limit);
  const where = {
    userId: req.user.id,
    ...(action ? { action } : {}),
  };

  const [logs, total] = await Promise.all([
    prisma.activityLog.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip,
      take: parseInt(limit),
    }),
    prisma.activityLog.count({ where }),
  ]);

  res.json({
    success: true,
    data: {
      logs,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit)),
      },
    },
  });
};

const getLearningHistory = async (req, res) => {
  // Fetch user's bookmarked videos, rated summaries, and recent activity
  const [bookmarks, recentActivity, watchedVideos] = await Promise.all([
    prisma.bookmark.findMany({
      where: { userId: req.user.id },
      orderBy: { createdAt: 'desc' },
      take: 10,
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
        keyMoment: true,
      },
    }),
    prisma.activityLog.findMany({
      where: { userId: req.user.id },
      orderBy: { createdAt: 'desc' },
      take: 15,
    }),
    // Public videos available for learning
    prisma.video.findMany({
      where: { isPublic: true, status: 'READY' },
      orderBy: { viewCount: 'desc' },
      take: 6,
      select: {
        id: true,
        title: true,
        duration: true,
        viewCount: true,
        thumbnailPath: true,
        summary: { select: { qualityScore: true, tone: true } },
      },
    }),
  ]);

  res.json({
    success: true,
    data: {
      bookmarks,
      recentActivity,
      recommendedVideos: watchedVideos,
    },
  });
};

module.exports = { getProfile, updateProfile, changePassword, getActivityHistory, getLearningHistory };
