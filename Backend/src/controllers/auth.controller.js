const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { validationResult } = require('express-validator');
const { PrismaClient } = require('@prisma/client');
const { createError } = require('../middleware/error.middleware');

const prisma = new PrismaClient();

const generateTokens = (userId, role) => {
  const accessToken = jwt.sign(
    { userId, role },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );
  const refreshToken = jwt.sign(
    { userId, role },
    process.env.JWT_REFRESH_SECRET,
    { expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d' }
  );
  return { accessToken, refreshToken };
};

const register = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, errors: errors.array() });
  }

  const { email, password, name, role = 'LEARNER' } = req.body;

  // Prevent self-assigning ADMIN
  const safeRole = role === 'ADMIN' ? 'LEARNER' : role;

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) return next(createError('An account with this email already exists.', 409));

  const passwordHash = await bcrypt.hash(password, 12);
  const user = await prisma.user.create({
    data: { email, passwordHash, name, role: safeRole },
    select: { id: true, email: true, name: true, role: true, createdAt: true },
  });

  const { accessToken, refreshToken } = generateTokens(user.id, user.role);

  // Log activity
  await prisma.activityLog.create({
    data: { userId: user.id, action: 'REGISTER', resourceType: 'user', resourceId: user.id },
  });

  res.status(201).json({
    success: true,
    message: 'Account created successfully.',
    data: { user, accessToken, refreshToken },
  });
};

const login = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, errors: errors.array() });
  }

  const { email, password } = req.body;

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) return next(createError('Invalid email or password.', 401));
  if (!user.isActive) return next(createError('Account is deactivated. Contact support.', 403));

  const isMatch = await bcrypt.compare(password, user.passwordHash);
  if (!isMatch) return next(createError('Invalid email or password.', 401));

  const { accessToken, refreshToken } = generateTokens(user.id, user.role);

  // Log activity
  await prisma.activityLog.create({
    data: { userId: user.id, action: 'LOGIN', resourceType: 'user', resourceId: user.id, ipAddress: req.ip },
  });

  res.json({
    success: true,
    message: 'Login successful.',
    data: {
      user: { id: user.id, email: user.email, name: user.name, role: user.role, avatar: user.avatar },
      accessToken,
      refreshToken,
    },
  });
};

const refreshToken = async (req, res, next) => {
  const { refreshToken: token } = req.body;
  if (!token) return next(createError('Refresh token required.', 400));

  try {
    const decoded = jwt.verify(token, process.env.JWT_REFRESH_SECRET);
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: { id: true, email: true, name: true, role: true, isActive: true },
    });
    if (!user || !user.isActive) return next(createError('Invalid refresh token.', 401));

    const tokens = generateTokens(user.id, user.role);
    res.json({ success: true, data: tokens });
  } catch {
    next(createError('Invalid or expired refresh token.', 401));
  }
};

const getMe = async (req, res) => {
  const user = await prisma.user.findUnique({
    where: { id: req.user.id },
    select: { id: true, email: true, name: true, role: true, avatar: true, bio: true, createdAt: true },
  });
  res.json({ success: true, data: { user } });
};

const logout = async (req, res) => {
  await prisma.activityLog.create({
    data: { userId: req.user.id, action: 'LOGOUT', resourceType: 'user', resourceId: req.user.id },
  });
  res.json({ success: true, message: 'Logged out successfully.' });
};

module.exports = { register, login, refreshToken, getMe, logout };
