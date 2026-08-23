const multer = require('multer');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const { createError } = require('./error.middleware');

const ALLOWED_MIME_TYPES = [
  'video/mp4', 'video/mpeg', 'video/quicktime',
  'video/x-msvideo', 'video/webm', 'video/ogg',
  'video/x-matroska', 'video/3gpp',
];

const MAX_FILE_SIZE = parseInt(process.env.MAX_FILE_SIZE) || 524288000; // 500MB

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, '../../uploads'));
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const uniqueName = `${uuidv4()}${ext}`;
    cb(null, uniqueName);
  },
});

const fileFilter = (req, file, cb) => {
  if (ALLOWED_MIME_TYPES.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(createError('Invalid file type. Only video files are allowed.', 400), false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: MAX_FILE_SIZE },
});

const handleMulterError = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return next(createError(`File too large. Maximum size is ${MAX_FILE_SIZE / 1024 / 1024}MB.`, 400));
    }
    return next(createError(`Upload error: ${err.message}`, 400));
  }
  next(err);
};

module.exports = { upload, handleMulterError };
