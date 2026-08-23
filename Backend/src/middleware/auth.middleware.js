const jwt = require('jsonwebtoken');
const { PrismaClient } = require('@prisma/client');
const { createError } = require('./error.middleware');

const prisma = new PrismaClient();

const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return next(createError('Authentication required. Please provide a valid token.', 401));
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: { id: true, email: true, name: true, role: true, isActive: true },
    });

    if (!user) return next(createError('User not found.', 401));
    if (!user.isActive) return next(createError('Account is deactivated. Contact support.', 403));

    req.user = user;
    next();
  } catch (err) {
    next(err);
  }
};

const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await prisma.user.findUnique({
        where: { id: decoded.userId },
        select: { id: true, email: true, name: true, role: true, isActive: true },
      });
      if (user && user.isActive) req.user = user;
    }
    next();
  } catch {
    next();
  }
};

module.exports = { authenticate, optionalAuth };
