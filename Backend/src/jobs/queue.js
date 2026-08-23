const { PrismaClient } = require('@prisma/client');
const { transcribeAudio } = require('../services/whisper.service');
const { generateSummary, detectKeyMoments, generateLearningMaterials } = require('../services/openai.service');
const { evaluateSummaryQuality } = require('../services/evaluation.service');
const { validateTranscriptAccuracy } = require('../services/transcript-validation.service');
const { getRealDuration } = require('../services/ffmpeg.service');
const path = require('path');
const logger = require('../utils/logger');

const prisma = new PrismaClient();

// ─── Pipeline Stage Progress Tracking Helper ─────────────────────────────────

const updateJobStage = async (jobId, { progress, status = 'PROCESSING', stage, details = {} }) => {
  try {
    await prisma.job.update({
      where: { id: jobId },
      data: {
        status,
        progress,
        metadata: JSON.stringify({ stage, ...details, updatedAt: new Date().toISOString() }),
      },
    });
  } catch (err) {
    logger.warn(`[Queue] Failed to update job ${jobId} stage: ${err.message}`);
  }
};

// ─── Full End-to-End AI Video Processing Pipeline ─────────────────────────────

const processTranscription = async (videoId) => {
  const pipelineStartTime = Date.now();
  logger.info(`[Pipeline] Full AI processing pipeline starting for video ${videoId}`);

  const video = await prisma.video.findUnique({ where: { id: videoId } });
  if (!video) throw new Error('Video not found');

  const mainJob = await prisma.job.create({
    data: {
      videoId,
      type: 'AI_PIPELINE',
      status: 'PROCESSING',
      progress: 15,
      metadata: JSON.stringify({ stage: 'INGESTION', startedAt: new Date().toISOString() }),
    },
  });

  try {
    // Stage 1 & 2: Verify Media & Extract speech
    await updateJobStage(mainJob.id, {
      progress: 30,
      stage: 'TRANSCRIPTION_PREPARATION',
      details: { fileName: video.fileName, hasAudio: Boolean(video.audioPath) },
    });

    // Stage 3: Whisper Speech-to-Text Transcription
    logger.info(`[Pipeline] Stage 3: Whisper transcription for video ${videoId}`);
    const transcriptResult = await transcribeAudio(video.audioPath);

    // Validate transcript accuracy automatically
    const transcriptValidation = validateTranscriptAccuracy(
      transcriptResult.text,
      transcriptResult.words,
      video.duration
    );

    await prisma.transcript.upsert({
      where: { videoId },
      update: {
        content: transcriptResult.text,
        wordTimestamps: JSON.stringify(transcriptResult.words || []),
        language: transcriptResult.language || 'en',
        status: 'COMPLETED',
      },
      create: {
        videoId,
        content: transcriptResult.text,
        language: transcriptResult.language || 'en',
        wordTimestamps: JSON.stringify(transcriptResult.words || []),
        status: 'COMPLETED',
      },
    });

    await updateJobStage(mainJob.id, {
      progress: 55,
      stage: 'TRANSCRIPTION_COMPLETE',
      details: {
        wordCount: transcriptValidation.metrics.wordCount,
        accuracyScore: transcriptValidation.accuracyScore,
      },
    });

    // Stage 4: Multi-Tier AI Summarization & NLP Quality Benchmark
    logger.info(`[Pipeline] Stage 4: AI Summarization & Quality Benchmark for video ${videoId}`);
    await updateJobStage(mainJob.id, {
      progress: 65,
      stage: 'SUMMARIZATION_IN_PROGRESS',
    });

    const summaryData = await generateSummary(transcriptResult.text, video.title);
    
    // Evaluate summary quality with ROUGE, Faithfulness & Readability
    const evalResult = evaluateSummaryQuality(
      transcriptResult.text,
      summaryData.shortSummary,
      summaryData.detailedSummary,
      summaryData.takeaways || []
    );

    await prisma.summary.upsert({
      where: { videoId },
      update: {
        shortSummary: summaryData.shortSummary,
        detailedSummary: summaryData.detailedSummary,
        takeaways: JSON.stringify(summaryData.takeaways || []),
        keywords: JSON.stringify(summaryData.keywords || []),
        topics: JSON.stringify(summaryData.topics || []),
        tone: summaryData.tone || 'Informative',
        readabilityScore: evalResult.readabilityScore,
        qualityScore: evalResult.qualityScore,
        metrics: JSON.stringify(evalResult.metrics || {}),
        status: 'COMPLETED',
      },
      create: {
        videoId,
        shortSummary: summaryData.shortSummary,
        detailedSummary: summaryData.detailedSummary,
        takeaways: JSON.stringify(summaryData.takeaways || []),
        keywords: JSON.stringify(summaryData.keywords || []),
        topics: JSON.stringify(summaryData.topics || []),
        tone: summaryData.tone || 'Informative',
        readabilityScore: evalResult.readabilityScore,
        qualityScore: evalResult.qualityScore,
        metrics: JSON.stringify(evalResult.metrics || {}),
        status: 'COMPLETED',
      },
    });

    await updateJobStage(mainJob.id, {
      progress: 80,
      stage: 'SUMMARIZATION_COMPLETE',
      details: {
        qualityScore: evalResult.qualityScore,
        readabilityGrade: evalResult.metrics?.readabilityGrade,
      },
    });

    // Stage 5: Key Moments Detection & Educational Learning Pack
    logger.info(`[Pipeline] Stage 5: Key Moments & Learning Materials for video ${videoId}`);
    await updateJobStage(mainJob.id, {
      progress: 85,
      stage: 'KEY_MOMENTS_IN_PROGRESS',
    });

    // Resolve duration — prefer stored value, then re-probe the actual file
    let duration = video.duration;
    if (!duration || duration <= 0) {
      try {
        const filePath = path.join(__dirname, '../../uploads', video.fileName);
        const probed = await getRealDuration(filePath);
        if (probed && probed > 0) {
          duration = probed;
          await prisma.video.update({ where: { id: videoId }, data: { duration } }).catch(() => {});
          logger.info(`[Pipeline] Resolved real duration from ffprobe: ${duration}s for video ${videoId}`);
        }
      } catch (e) {
        logger.warn(`[Pipeline] Could not probe duration for video ${videoId}: ${e.message}`);
      }
    }

    // Last resort: estimate from transcript (only if ffprobe completely unavailable)
    if (!duration || duration <= 0) {
      const wordCount = transcriptResult.text.split(/\s+/).filter(Boolean).length;
      duration = Math.max(30, Math.round((wordCount / 140) * 60));
      logger.warn(`[Pipeline] Using word-count estimated duration: ${duration}s for video ${videoId}`);
      await prisma.video.update({ where: { id: videoId }, data: { duration } }).catch(() => {});
    }

    const moments = await detectKeyMoments(transcriptResult.text, duration);
    await prisma.keyMoment.deleteMany({ where: { videoId } });
    if (moments.length > 0) {
      await prisma.keyMoment.createMany({ data: moments.map((m) => ({ videoId, ...m })) });
    }

    // Optional: Pre-warm learning materials
    try {
      await generateLearningMaterials(transcriptResult.text, video.title);
    } catch {
      // non-fatal
    }

    // Stage 6: Finalization
    const totalPipelineElapsedMs = Date.now() - pipelineStartTime;
    await updateJobStage(mainJob.id, {
      progress: 100,
      status: 'COMPLETED',
      stage: 'READY',
      details: {
        totalElapsedMs: totalPipelineElapsedMs,
        keyMomentsCount: moments.length,
        qualityScore: evalResult.qualityScore,
        accuracyScore: transcriptValidation.accuracyScore,
      },
    });

    logger.info(`[Pipeline] Video ${videoId} AI pipeline finished in ${totalPipelineElapsedMs}ms (Quality: ${evalResult.qualityScore}%, Accuracy: ${transcriptValidation.accuracyScore}%)`);

  } catch (err) {
    logger.error(`[Pipeline] Video ${videoId} pipeline failure: ${err.message}`);
    await prisma.job.update({
      where: { id: mainJob.id },
      data: { status: 'FAILED', error: err.message },
    }).catch(() => {});
    throw err;
  }
};

// ─── Public API ───────────────────────────────────────────────────────────────

const addTranscriptionJob = (videoId) => {
  setImmediate(() => {
    processTranscription(videoId).catch((err) =>
      logger.error(`[Queue] Pipeline job error for ${videoId}: ${err.message}`)
    );
  });
  logger.info(`[Queue] AI pipeline job scheduled for video ${videoId}`);
};

module.exports = {
  addTranscriptionJob,
  processTranscription,
};
