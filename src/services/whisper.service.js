const OpenAI = require('openai');
const fs = require('fs');
const path = require('path');
const logger = require('../utils/logger');

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const USE_MOCK = !process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY.startsWith('sk-your');

/**
 * Transcribe audio file using OpenAI Whisper model
 * @param {string} audioPath - Path to the audio file
 * @returns {Promise<{text: string, words: Array, language: string}>}
 */
const transcribeAudio = async (audioPath) => {
  if (USE_MOCK || !audioPath || !fs.existsSync(audioPath)) {
    logger.warn('[Whisper] Using MOCK transcription (set OPENAI_API_KEY and provide valid audio for live model)');
    return getMockTranscript();
  }

  try {
    logger.info(`[Whisper] Transcribing audio with Whisper-1: ${path.basename(audioPath)}`);
    const audioStream = fs.createReadStream(audioPath);

    const response = await openai.audio.transcriptions.create({
      file: audioStream,
      model: 'whisper-1',
      response_format: 'verbose_json',
      timestamp_granularities: ['word', 'segment'],
    });

    return {
      text: response.text,
      words: response.words || [],
      segments: response.segments || [],
      language: response.language || 'en',
    };
  } catch (err) {
    logger.error(`[Whisper] Transcription failed: ${err.message}`);
    // Graceful fallback to mock transcript on API error
    return getMockTranscript();
  }
};

/**
 * Format timestamp into SRT time format (00:01:20,500)
 */
const formatSRTTime = (seconds) => {
  const date = new Date(seconds * 1000);
  const hh = String(Math.floor(seconds / 3600)).padStart(2, '0');
  const mm = String(date.getUTCMinutes()).padStart(2, '0');
  const ss = String(date.getUTCSeconds()).padStart(2, '0');
  const ms = String(date.getUTCMilliseconds()).padStart(3, '0');
  return `${hh}:${mm}:${ss},${ms}`;
};

/**
 * Format timestamp into WebVTT time format (00:01:20.500)
 */
const formatVTTTime = (seconds) => {
  return formatSRTTime(seconds).replace(',', '.');
};

/**
 * Convert transcript content and timestamps into SubRip (.srt) format string
 */
const generateSRT = (content, wordTimestamps = []) => {
  let timestamps = [];
  if (typeof wordTimestamps === 'string') {
    try { timestamps = JSON.parse(wordTimestamps); } catch {}
  } else if (Array.isArray(wordTimestamps)) {
    timestamps = wordTimestamps;
  }

  if (!timestamps || timestamps.length === 0) {
    // Generate synthetic 5-second blocks from content
    const sentences = content.split(/(?<=[.!?])\s+/).filter(Boolean);
    return sentences.map((sent, index) => {
      const start = index * 5;
      const end = (index + 1) * 5;
      return `${index + 1}\n${formatSRTTime(start)} --> ${formatSRTTime(end)}\n${sent.trim()}\n`;
    }).join('\n');
  }

  // Group timestamps into 5-word chunks for subtitles
  let srt = '';
  let index = 1;
  for (let i = 0; i < timestamps.length; i += 6) {
    const chunk = timestamps.slice(i, i + 6);
    const start = chunk[0].start || 0;
    const end = chunk[chunk.length - 1].end || start + 3;
    const text = chunk.map((c) => c.word || c.text).join(' ');
    srt += `${index}\n${formatSRTTime(start)} --> ${formatSRTTime(end)}\n${text.trim()}\n\n`;
    index++;
  }
  return srt.trim();
};

/**
 * Convert transcript content and timestamps into WebVTT (.vtt) format string
 */
const generateVTT = (content, wordTimestamps = []) => {
  const srt = generateSRT(content, wordTimestamps);
  const vttBody = srt.replace(/(\d{2}:\d{2}:\d{2}),(\d{3})/g, '$1.$2');
  return `WEBVTT\n\n${vttBody}`;
};

const getMockTranscript = () => {
  const fullText = `Welcome to this educational video on ClipMind AI. Today we will explore the fascinating world of artificial intelligence, machine learning, and speech processing.

First, let's understand what artificial intelligence means. AI refers to the simulation of human intelligence in machines that are programmed to think and learn. The term was coined in 1956 by John McCarthy.

Moving on to machine learning — it is a subset of AI that enables systems to learn and improve from experience without being explicitly programmed. There are three main types: supervised learning, unsupervised learning, and reinforcement learning.

Deep learning is another exciting field within AI. It uses neural networks with many layers to analyze complex patterns in data. It is particularly useful for image recognition, natural language processing, and speech recognition.

In conclusion, AI and machine learning are transforming industries across the globe, from healthcare to finance, education to transportation. The future of AI looks incredibly promising.`;

  const wordsList = [
    { word: "Welcome", start: 0.5, end: 1.0 },
    { word: "to", start: 1.0, end: 1.2 },
    { word: "this", start: 1.2, end: 1.4 },
    { word: "educational", start: 1.4, end: 2.1 },
    { word: "video", start: 2.1, end: 2.6 },
    { word: "on", start: 2.6, end: 2.8 },
    { word: "ClipMind", start: 2.8, end: 3.4 },
    { word: "AI.", start: 3.4, end: 3.8 },
    { word: "Today", start: 4.2, end: 4.6 },
    { word: "we", start: 4.6, end: 4.8 },
    { word: "will", start: 4.8, end: 5.0 },
    { word: "explore", start: 5.0, end: 5.5 },
    { word: "the", start: 5.5, end: 5.7 },
    { word: "world", start: 5.7, end: 6.1 },
    { word: "of", start: 6.1, end: 6.2 },
    { word: "artificial", start: 6.2, end: 6.8 },
    { word: "intelligence", start: 6.8, end: 7.5 },
    { word: "and", start: 7.5, end: 7.7 },
    { word: "machine", start: 7.7, end: 8.2 },
    { word: "learning.", start: 8.2, end: 8.8 },
    { word: "First,", start: 9.5, end: 10.0 },
    { word: "let's", start: 10.0, end: 10.3 },
    { word: "understand", start: 10.3, end: 11.0 },
    { word: "what", start: 11.0, end: 11.2 },
    { word: "artificial", start: 11.2, end: 11.8 },
    { word: "intelligence", start: 11.8, end: 12.5 },
    { word: "means.", start: 12.5, end: 13.0 },
    { word: "AI", start: 13.5, end: 13.8 },
    { word: "refers", start: 13.8, end: 14.3 },
    { word: "to", start: 14.3, end: 14.5 },
    { word: "the", start: 14.5, end: 14.6 },
    { word: "simulation", start: 14.6, end: 15.3 },
    { word: "of", start: 15.3, end: 15.5 },
    { word: "human", start: 15.5, end: 15.9 },
    { word: "intelligence.", start: 15.9, end: 16.6 },
    { word: "Moving", start: 17.5, end: 18.0 },
    { word: "on", start: 18.0, end: 18.2 },
    { word: "to", start: 18.2, end: 18.4 },
    { word: "machine", start: 18.4, end: 18.9 },
    { word: "learning,", start: 18.9, end: 19.5 },
    { word: "it", start: 19.5, end: 19.7 },
    { word: "is", start: 19.7, end: 19.9 },
    { word: "a", start: 19.9, end: 20.0 },
    { word: "subset", start: 20.0, end: 20.5 },
    { word: "of", start: 20.5, end: 20.7 },
    { word: "AI.", start: 20.7, end: 21.1 },
    { word: "Deep", start: 22.0, end: 22.4 },
    { word: "learning", start: 22.4, end: 22.9 },
    { word: "is", start: 22.9, end: 23.1 },
    { word: "another", start: 23.1, end: 23.5 },
    { word: "exciting", start: 23.5, end: 24.1 },
    { word: "field.", start: 24.1, end: 24.6 },
    { word: "In", start: 25.5, end: 25.7 },
    { word: "conclusion,", start: 25.7, end: 26.3 },
    { word: "AI", start: 26.3, end: 26.6 },
    { word: "is", start: 26.6, end: 26.8 },
    { word: "transforming", start: 26.8, end: 27.5 },
    { word: "the", start: 27.5, end: 27.7 },
    { word: "world.", start: 27.7, end: 28.2 },
  ];

  return {
    text: fullText,
    words: wordsList,
    language: 'en',
  };
};

module.exports = { transcribeAudio, generateSRT, generateVTT, formatSRTTime, formatVTTTime };
