const express = require('express');
const { authenticate } = require('../middleware/auth.middleware');
const { asyncHandler } = require('../middleware/error.middleware');
const {
  getProfile,
  updateProfile,
  changePassword,
  getActivityHistory,
  getLearningHistory,
} = require('../controllers/user.controller');

const router = express.Router();

router.get('/profile', authenticate, asyncHandler(getProfile));
router.put('/profile', authenticate, asyncHandler(updateProfile));
router.put('/change-password', authenticate, asyncHandler(changePassword));
router.get('/activity', authenticate, asyncHandler(getActivityHistory));
router.get('/learning-history', authenticate, asyncHandler(getLearningHistory));

module.exports = router;
