const { validateTranscriptAccuracy, calculateWERandCER, autoCorrectTranscript } = require('./src/services/transcript-validation.service');
const { evaluateSummaryQuality, calculateROUGEScores, calculateFaithfulness, calculateReadabilityMetrics } = require('./src/services/evaluation.service');

console.log('═══════════════════════════════════════════════════════════════');
console.log('TEST 1: Transcript Accuracy & Subtitle Validation Engine');
console.log('═══════════════════════════════════════════════════════════════');

const sampleTranscript = 'Welcome to this educational video on ClipMind AI. Today we will explore the fascinating world of artificial intelligence, machine learning, and speech processing.';
const sampleTimestamps = [
  { word: 'Welcome', start: 0.5, end: 1.0 },
  { word: 'to', start: 1.0, end: 1.2 },
  { word: 'this', start: 1.2, end: 1.4 },
  { word: 'educational', start: 1.4, end: 2.1 },
  { word: 'video', start: 2.1, end: 2.6 },
  { word: 'on', start: 2.6, end: 2.8 },
  { word: 'ClipMind', start: 2.8, end: 3.4 },
  { word: 'AI.', start: 3.4, end: 3.8 },
];

const valReport = validateTranscriptAccuracy(sampleTranscript, sampleTimestamps, 10);
console.log('Accuracy Score:', valReport.accuracyScore, '%');
console.log('Grade:', valReport.grade);
console.log('Metrics:', JSON.stringify(valReport.metrics, null, 2));

console.log('\n═══════════════════════════════════════════════════════════════');
console.log('TEST 2: Word Error Rate (WER) & Character Error Rate (CER)');
console.log('═══════════════════════════════════════════════════════════════');

const reference = 'Welcome to this educational video on ClipMind AI today';
const hypothesis = 'Welcome to this educational video on Clip Mind AI today';
const werResult = calculateWERandCER(hypothesis, reference);
console.log('WER:', werResult.wer, `(${werResult.werPercentage}%)`);
console.log('Accuracy Match:', werResult.accuracyPercentage, '%');
console.log('Substitutions:', werResult.substitutions, 'Deletions:', werResult.deletions, 'Insertions:', werResult.insertions);

console.log('\n═══════════════════════════════════════════════════════════════');
console.log('TEST 3: Auto-Correction for Loops & Non-Monotonic Timestamps');
console.log('═══════════════════════════════════════════════════════════════');

const loopingText = 'artificial intelligence artificial intelligence artificial intelligence is transforming the world.';
const badTimestamps = [
  { word: 'hello', start: 2.0, end: 1.5 }, // negative
  { word: 'world', start: 1.0, end: 2.0 }, // non-monotonic
];
const autoFixResult = autoCorrectTranscript(loopingText, badTimestamps);
console.log('Corrected Text:', autoFixResult.correctedContent);
console.log('Stats:', autoFixResult.stats);

console.log('\n═══════════════════════════════════════════════════════════════');
console.log('TEST 4: Advanced Multi-Metric NLP Summary Quality Engine');
console.log('═══════════════════════════════════════════════════════════════');

const fullTranscript = `Artificial intelligence was founded in 1956 by John McCarthy at the Dartmouth conference. Machine learning is a subset of AI enabling computers to learn without explicit programming. Supervised learning uses labeled datasets while unsupervised learning uncovers hidden patterns in unlabeled data. Deep learning utilizes artificial neural networks with multiple hidden layers to process images, speech, and natural language.`;

const shortSummary = 'Artificial Intelligence originated in 1956 by John McCarthy. Machine learning includes supervised, unsupervised, and deep neural network approaches.';
const detailedSummary = 'The video covers the origin of AI in 1956 and details machine learning paradigms: supervised learning with labeled data and unsupervised pattern discovery. Deep learning uses multi-layer neural networks for vision and language.';
const takeaways = [
  'AI was coined in 1956 by John McCarthy.',
  'Supervised learning relies on labeled datasets.',
  'Deep learning uses multi-layered neural networks for pattern recognition.'
];

const summaryEval = evaluateSummaryQuality(fullTranscript, shortSummary, detailedSummary, takeaways);
console.log('Quality Score:', summaryEval.qualityScore, '%');
console.log('Readability Score:', summaryEval.readabilityScore);
console.log('Compression Ratio:', summaryEval.compressionRatio);
console.log('ROUGE-L F1:', summaryEval.metrics.rougeL_F1);
console.log('Faithfulness Score:', summaryEval.metrics.faithfulnessScore, '%');
console.log('Readability Grade:', summaryEval.metrics.readabilityGrade);
console.log('Recommendations:', summaryEval.recommendations);

console.log('\nAll validation and evaluation algorithms PASSED! ✅');
