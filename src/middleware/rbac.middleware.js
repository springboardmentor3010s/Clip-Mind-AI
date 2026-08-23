const { createError } = require('./error.middleware');

// Role hierarchy
const ROLES = {
  ADMIN: 4,
  EDUCATOR: 3,
  CONTENT_CREATOR: 2,
  LEARNER: 1,
};

// Permission map per resource/action
const PERMISSIONS = {
  video: {
    upload: ['ADMIN', 'CONTENT_CREATOR', 'EDUCATOR'],
    delete: ['ADMIN', 'CONTENT_CREATOR', 'EDUCATOR'],
    manage_all: ['ADMIN'],
    view: ['ADMIN', 'CONTENT_CREATOR', 'EDUCATOR', 'LEARNER'],
  },
  transcript: {
    generate: ['ADMIN', 'CONTENT_CREATOR', 'EDUCATOR'],
    edit: ['ADMIN', 'CONTENT_CREATOR', 'EDUCATOR'],
    view: ['ADMIN', 'CONTENT_CREATOR', 'EDUCATOR', 'LEARNER'],
  },
  summary: {
    generate: ['ADMIN', 'CONTENT_CREATOR', 'EDUCATOR'],
    view: ['ADMIN', 'CONTENT_CREATOR', 'EDUCATOR', 'LEARNER'],
  },
  analytics: {
    view_own: ['ADMIN', 'CONTENT_CREATOR', 'EDUCATOR'],
    view_all: ['ADMIN'],
  },
  user: {
    manage: ['ADMIN'],
    view_all: ['ADMIN'],
  },
};

/**
 * Require specific roles to access a route
 * @param  {...string} roles - Allowed roles
 */
const requireRole = (...roles) => (req, res, next) => {
  if (!req.user) return next(createError('Authentication required.', 401));
  if (!roles.includes(req.user.role)) {
    return next(createError(`Access denied. Required role: ${roles.join(' or ')}.`, 403));
  }
  next();
};

/**
 * Require a specific permission
 * @param {string} resource - Resource name (e.g. 'video')
 * @param {string} action   - Action name (e.g. 'upload')
 */
const requirePermission = (resource, action) => (req, res, next) => {
  if (!req.user) return next(createError('Authentication required.', 401));
  const allowed = PERMISSIONS[resource]?.[action] || [];
  if (!allowed.includes(req.user.role)) {
    return next(createError(`You do not have permission to ${action} ${resource}.`, 403));
  }
  next();
};

/**
 * Ensure the user owns the resource OR is an admin
 */
const requireOwnerOrAdmin = (userIdField = 'userId') => (req, res, next) => {
  if (!req.user) return next(createError('Authentication required.', 401));
  if (req.user.role === 'ADMIN') return next();
  const resourceOwnerId = req.resource?.[userIdField];
  if (resourceOwnerId && resourceOwnerId !== req.user.id) {
    return next(createError('You do not have permission to access this resource.', 403));
  }
  next();
};

module.exports = { requireRole, requirePermission, requireOwnerOrAdmin, PERMISSIONS };
