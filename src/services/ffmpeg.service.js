const path = require('path');
const { PrismaClient } = require('@prisma/client');
const logger = require('../utils/logger');

const prisma = new PrismaClient();
const UPLOADS_DIR = path.join(__dirname, '../../uploads');

// Try to load ffmpeg — gracefully skip if not installed
let ffmpeg = null;
try {
  ffmpeg = require('fluent-ffmpeg');
  logger.info('[FFmpeg] fluent-ffmpeg loaded successfully');
} catch {
  logger.warn('[FFmpeg] fluent-ffmpeg not available — using mock processing');
}

/**
 * Get video metadata using ffprobe with a timeout safeguard
 */
const getVideoMetadata = (filePath, timeoutMs = 8000) =>
  new Promise((resolve, reject) => {
    if (!ffmpeg) return reject(new Error('FFmpeg not loaded'));

    const timer = setTimeout(() => {
      reject(new Error(`ffprobe timed out after ${timeoutMs}ms`));
    }, timeoutMs);

    ffmpeg.ffprobe(filePath, (err, metadata) => {
      clearTimeout(timer);
      if (err) reject(err);
      else resolve(metadata);
    });
  });

/**
 * Get real duration and stream details from file using ffprobe
 * Falls back to null if unavailable
 */
const getRealDuration = async (filePath) => {
  if (!ffmpeg) return null;
  try {
    const metadata = await getVideoMetadata(filePath);
    const duration = parseFloat(
      metadata.streams?.find((s) => s.codec_type === 'video')?.duration ||
      metadata.format?.duration || 0
    );
    return duration > 0 ? duration : null;
  } catch (err) {
    logger.warn(`[FFmpeg] ffprobe duration read failed: ${err.message}`);
    return null;
  }
};

/**
 * Process uploaded video with optimized parallel execution:
 * 1. Extract real duration via fast ffprobe
 * 2. Concurrently extract audio & capture high-definition thumbnail in parallel
 * 3. Update database status to READY
 */
const processUpload = async (videoId, filePath) => {
  const startTime = Date.now();
  try {
    logger.info(`[FFmpeg] Starting optimized pipeline processing for video ${videoId}`);
    await prisma.video.update({ where: { id: videoId }, data: { status: 'PROCESSING' } });

    if (!ffmpeg) {
      logger.warn('[FFmpeg] Using MOCK processing (FFmpeg not installed) — attempting ffprobe for duration');
      // Still try to get real duration even in mock mode
      let mockDuration = null;
      try {
        mockDuration = await getRealDuration(filePath);
      } catch {}
      await new Promise((r) => setTimeout(r, 400));
      await prisma.video.update({
        where: { id: videoId },
        data: { status: 'READY', duration: mockDuration, thumbnailPath: null, audioPath: null },
      });
      logger.info(`[FFmpeg] Mock processing complete for video ${videoId} (duration=${mockDuration}s)`);
      return { duration: mockDuration, thumbnailPath: null, audioPath: null, elapsedMs: Date.now() - startTime };
    }

    // Step 1: Read real duration via ffprobe
    let duration = null;
    try {
      duration = await getRealDuration(filePath);
      logger.info(`[FFmpeg] Real duration from ffprobe: ${duration}s for video ${videoId}`);
    } catch {
      logger.warn(`[FFmpeg] Could not read duration for video ${videoId}`);
    }

    // Step 2: Parallel Media Extraction (Audio + Thumbnail concurrently)
    const thumbnailName = `thumb_${videoId}.jpg`;
    const audioName = `audio_${videoId}.mp3`;
    const thumbnailPath = path.join(UPLOADS_DIR, thumbnailName);
    const audioPath = path.join(UPLOADS_DIR, audioName);

    const thumbnailTime = Math.max(0.5, (duration || 10) * 0.1);

    const [thumbResult, audioResult] = await Promise.allSettled([
      generateThumbnail(filePath, thumbnailPath, thumbnailTime),
      extractSpeechOptimizedAudio(filePath, audioPath),
    ]);

    const finalThumbnailPath = thumbResult.status === 'fulfilled' ? thumbnailPath : null;
    const finalAudioPath = audioResult.status === 'fulfilled' ? audioPath : null;

    if (thumbResult.status === 'rejected') {
      logger.warn(`[FFmpeg] Thumbnail capture non-fatal failure: ${thumbResult.reason?.message}`);
    }
    if (audioResult.status === 'rejected') {
      logger.warn(`[FFmpeg] Audio extraction non-fatal failure: ${audioResult.reason?.message}`);
    }

    const elapsedMs = Date.now() - startTime;

    // Step 3: Update video record to READY
    await prisma.video.update({
      where: { id: videoId },
      data: {
        status: 'READY',
        ...(duration !== null && { duration }),
        ...(finalThumbnailPath && { thumbnailPath: finalThumbnailPath }),
        ...(finalAudioPath && { audioPath: finalAudioPath }),
      },
    });

    logger.info(`[FFmpeg] Processing completed in ${elapsedMs}ms for video ${videoId} (duration=${duration}s)`);
    return {
      duration,
      thumbnailPath: finalThumbnailPath,
      audioPath: finalAudioPath,
      elapsedMs,
    };

  } catch (err) {
    logger.error(`[FFmpeg] Processing critical failure for video ${videoId}: ${err.message}`);
    await prisma.video.update({ where: { id: videoId }, data: { status: 'FAILED' } }).catch(() => {});
    throw err;
  }
};

/**
 * Generate 1280x720 thumbnail screenshot at specific timestamp
 */
const generateThumbnail = (inputPath, outputPath, timemarkSeconds) =>
  new Promise((resolve, reject) => {
    ffmpeg(inputPath)
      .screenshots({
        timestamps: [timemarkSeconds],
        filename: path.basename(outputPath),
        folder: path.dirname(outputPath),
        size: '1280x720',
      })
      .on('end', () => resolve(outputPath))
      .on('error', reject);
  });

/**
 * Extract audio optimized for Whisper ASR model:
 * - 16kHz sample rate (Whisper native frequency)
 * - Mono audio channel (reduces memory & upload size by 50%)
 * - 64k CBR MP3 (lightweight, high clarity for speech)
 */
const extractSpeechOptimizedAudio = (inputPath, outputPath) =>
  new Promise((resolve, reject) => {
    ffmpeg(inputPath)
      .noVideo()
      .audioCodec('libmp3lame')
      .audioFrequency(16000)
      .audioChannels(1)
      .audioBitrate('64k')
      .output(outputPath)
      .on('end', () => resolve(outputPath))
      .on('error', reject)
      .run();
  });

const formatTimestamp = (seconds) => {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  return [h, m, s].map((v) => String(v).padStart(2, '0')).join(':');
};

module.exports = {
  processUpload,
  getRealDuration,
  formatTimestamp,
  extractSpeechOptimizedAudio,
  generateThumbnail,
};
