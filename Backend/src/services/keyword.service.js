const logger = require('../utils/logger');

/**
 * Advanced TF-IDF & NLP Keyword Extraction Workflow Service
 * Analyzes video transcript text, calculates term frequencies, filters stopwords,
 * and categorizes extracted keywords into entity types with relevance weights.
 *
 * @param {string} text - Full transcript text
 * @param {number} topN - Number of top keywords to return (default 15)
 * @returns {Array<{word: string, frequency: number, weight: number, category: string}>}
 */
const extractKeywords = (text, topN = 15) => {
  if (!text || typeof text !== 'string') return [];

  try {
    const stopWords = new Set([
      'the','be','to','of','and','a','in','that','have','i','it','for','not','on','with','he','as','you','do','at',
      'this','but','his','by','from','they','we','say','her','she','or','an','will','my','one','all','would','there',
      'their','what','so','up','out','if','about','who','get','which','go','me','when','make','can','like','time','no',
      'just','him','know','take','people','into','year','your','good','some','could','them','see','other','than','then',
      'now','look','only','come','its','over','think','also','back','after','use','two','how','our','work','first','well',
      'way','even','new','want','because','any','these','give','day','most','us','is','are','was','were','been','has',
      'had','does','did','shall','should','may','might','must','can','could','today','video','today\'s','welcome'
    ]);

    // Tokenization and normalization
    const tokens = text.toLowerCase().match(/\b[a-z]{3,}\b/g) || [];
    const totalTokens = tokens.length;
    if (totalTokens === 0) return [];

    // Term Frequency (TF)
    const frequencyMap = {};
    tokens.forEach((word) => {
      if (!stopWords.has(word)) {
        frequencyMap[word] = (frequencyMap[word] || 0) + 1;
      }
    });

    const entries = Object.entries(frequencyMap);
    if (entries.length === 0) return [];

    const maxFreq = Math.max(...entries.map(([, count]) => count));

    // Sort by frequency
    const sorted = entries.sort((a, b) => b[1] - a[1]).slice(0, topN);

    return sorted.map(([word, freq]) => {
      // Calculate normalized relevance weight (0 - 100%)
      const weight = Math.round((freq / maxFreq) * 100);
      const category = classifyKeywordCategory(word);
      return {
        word,
        frequency: freq,
        weight: Math.max(10, weight),
        category,
      };
    });
  } catch (err) {
    logger.warn(`[KeywordService] Extraction error: ${err.message}`);
    return [];
  }
};

/**
 * Classify keyword into standard domain categories
 */
const classifyKeywordCategory = (word) => {
  const techTerms = new Set([
    'ai', 'learning', 'machine', 'neural', 'networks', 'model', 'data', 'algorithm', 'system', 'deep',
    'python', 'code', 'software', 'technology', 'intelligence', 'speech', 'text', 'digital', 'processing'
  ]);
  const businessTerms = new Set([
    'market', 'growth', 'strategy', 'finance', 'company', 'industry', 'business', 'customers', 'sales',
    'management', 'product', 'impact', 'performance', 'metrics', 'users', 'value', 'revenue'
  ]);
  const academicTerms = new Set([
    'research', 'study', 'education', 'analysis', 'theory', 'concept', 'science', 'framework', 'definition',
    'history', 'types', 'principles', 'overview'
  ]);

  if (techTerms.has(word)) return 'Technology';
  if (businessTerms.has(word)) return 'Business';
  if (academicTerms.has(word)) return 'Academic';
  return 'Core Concept';
};

module.exports = { extractKeywords };
