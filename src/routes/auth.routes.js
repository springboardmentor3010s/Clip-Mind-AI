const express = require('express');
const { body } = require('express-validator');
const { register, login, refreshToken, getMe, logout } = require('../controllers/auth.controller');
const { authenticate } = require('../middleware/auth.middleware');
const { asyncHandler } = require('../middleware/error.middleware');

const router = express.Router();

// POST /api/auth/register
router.post('/register', [
  body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
  body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/).withMessage('Password must contain uppercase, lowercase, and number'),
  body('name').trim().isLength({ min: 2, max: 100 }).withMessage('Name must be 2-100 characters'),
  body('role').optional().isIn(['CONTENT_CREATOR', 'EDUCATOR', 'LEARNER']).withMessage('Invalid role'),
], asyncHandler(register));

// POST /api/auth/login
router.post('/login', [
  body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
  body('password').notEmpty().withMessage('Password is required'),
], asyncHandler(login));

// POST /api/auth/refresh
router.post('/refresh', asyncHandler(refreshToken));

// GET /api/auth/me
router.get('/me', authenticate, asyncHandler(getMe));

// POST /api/auth/logout
router.post('/logout', authenticate, asyncHandler(logout));

module.exports = router;
