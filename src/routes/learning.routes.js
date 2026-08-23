const express = require('express');
const { authenticate } = require('../middleware/auth.middleware');
const { asyncHandler, createError } = require('../middleware/error.middleware');
const { PrismaClient } = require('@prisma/client');
const { generateLearningMaterials } = require('../services/openai.service');

const prisma = new PrismaClient();
const router = express.Router();

// GET /api/learning/:videoId — Get educational materials for a video
router.get('/:videoId', authenticate, asyncHandler(async (req, res, next) => {
  const video = await prisma.video.findUnique({
    where: { id: req.params.videoId },
    include: {
      transcript: true,
      summary: true,
      user: { select: { name: true, email: true } },
    },
  });

  if (!video) return next(createError('Video not found.', 404));
  if (!video.isPublic && video.userId !== req.user.id && req.user.role !== 'ADMIN') {
    return next(createError('Access denied.', 403));
  }

  const transcriptText = video.transcript?.content || '';
  const materials = await generateLearningMaterials(transcriptText, video.title);

  res.json({
    success: true,
    data: {
      videoId: video.id,
      videoTitle: video.title,
      author: video.user?.name,
      materials,
    },
  });
}));

// POST /api/learning/:videoId/generate — Force regenerate learning materials
router.post('/:videoId/generate', authenticate, asyncHandler(async (req, res, next) => {
  const video = await prisma.video.findUnique({
    where: { id: req.params.videoId },
    include: { transcript: true, user: { select: { name: true } } },
  });

  if (!video) return next(createError('Video not found.', 404));
  if (video.userId !== req.user.id && req.user.role !== 'ADMIN' && req.user.role !== 'EDUCATOR') {
    return next(createError('Only educators or video owners can regenerate learning materials.', 403));
  }

  const transcriptText = video.transcript?.content || '';
  const materials = await generateLearningMaterials(transcriptText, video.title);

  // Log activity
  await prisma.activityLog.create({
    data: {
      userId: req.user.id,
      action: 'LEARNING_MATERIALS_GENERATE',
      resourceType: 'video',
      resourceId: video.id,
      metadata: JSON.stringify({ videoTitle: video.title }),
    },
  });

  res.json({
    success: true,
    message: 'Educational learning materials generated successfully.',
    data: { materials },
  });
}));

// GET /api/learning/:videoId/export-packet — Download full formatted study packet
router.get('/:videoId/export-packet', authenticate, asyncHandler(async (req, res, next) => {
  const video = await prisma.video.findUnique({
    where: { id: req.params.videoId },
    include: {
      transcript: true,
      summary: true,
      keyMoments: { orderBy: { timestampStart: 'asc' } },
      user: { select: { name: true } },
    },
  });

  if (!video) return next(createError('Video not found.', 404));
  const transcriptText = video.transcript?.content || '';
  const materials = await generateLearningMaterials(transcriptText, video.title);

  const safeTitle = (video.title || 'study_packet').replace(/[^a-z0-9]/gi, '_').toLowerCase();

  const studyPacketMd = `# 🎓 Comprehensive Classroom Study Packet: ${video.title}

- **Instructor / Author:** ${video.user?.name || 'Educator'}
- **Date Generated:** ${new Date().toLocaleDateString()}
- **Platform:** ClipMind AI Educational Intelligence

---

## 📋 Executive Overview & Summary
${video.summary?.shortSummary || 'No summary recorded.'}

### 💡 Core Takeaways:
${(() => {
  try {
    const takeaways = JSON.parse(video.summary?.takeaways || '[]');
    return takeaways.map((t) => `- ${t}`).join('\n');
  } catch {
    return 'N/A';
  }
})()}

---

## 📚 Key Concept Definitions & Glossary
${materials.glossary.map((g, i) => `### ${i + 1}. ${g.term}
- **Definition:** ${g.definition}
- **Practical Context:** ${g.context}
`).join('\n')}

---

## 📇 Flashcard Knowledge Checks
${materials.flashcards.map((fc, i) => `### Card #${i + 1}
- **Question:** ${fc.question}
- **Answer:** ${fc.answer}
- *Hint:* ${fc.hint}
`).join('\n')}

---

## 📝 Self-Assessment Quiz
${materials.quiz.map((q, i) => `### Question ${i + 1}: ${q.question}
${q.options.map((opt, optIdx) => `  [${String.fromCharCode(65 + optIdx)}] ${opt}`).join('\n')}

- **Correct Answer:** Option [${String.fromCharCode(65 + q.correctAnswer)}] (${q.options[q.correctAnswer]})
- **Explanation:** ${q.explanation}
`).join('\n')}

---

## 💬 Classroom Discussion & Critical Thinking Prompts
${materials.discussionPrompts.map((dp, i) => `**Prompt ${i + 1}:** ${dp.prompt} *(Audience: ${dp.targetAudience})*`).join('\n\n')}

---
*Created with ClipMind AI — Educational Content Transformation & Learning Intelligence.*
`;

  res.setHeader('Content-Type', 'text/markdown');
  res.setHeader('Content-Disposition', `attachment; filename="${safeTitle}_study_packet.md"`);
  return res.send(studyPacketMd);
}));

module.exports = router;
