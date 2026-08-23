const OpenAI = require('openai');
const logger = require('../utils/logger');

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const USE_MOCK = !process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY.startsWith('sk-your');

/**
 * Generate multi-tier NLP AI summary from transcript
 */
const generateSummary = async (transcript, videoTitle = 'Video Content') => {
  if (USE_MOCK) {
    logger.warn('[OpenAI] Using MOCK multi-tier NLP summary (content-aware from submitted transcript)');
    return getMockSummary(videoTitle, transcript);
  }

  try {
    const prompt = `You are an expert NLP content analyst. Analyze the following video transcript titled "${videoTitle}" and provide:
1. A SHORT executive summary (2-3 sentences, max 150 words)
2. A DETAILED summary (comprehensive breakdown, 300-500 words)
3. A list of 4-6 bulleted KEY TAKEAWAYS (actionable insights)
4. A list of 6-10 keywords
5. Main topics covered (array of strings)
6. Tone/Style of the video (e.g. Educational, Informative, Technical, Conversational)

Transcript:
"${transcript.substring(0, 5000)}"

Respond strictly in JSON format:
{
  "shortSummary": "...",
  "detailedSummary": "...",
  "takeaways": ["takeaway 1", "takeaway 2", ...],
  "keywords": ["keyword1", "keyword2", ...],
  "topics": ["topic1", "topic2", ...],
  "tone": "Educational"
}`;

    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [{ role: 'user', content: prompt }],
      response_format: { type: 'json_object' },
      temperature: 0.3,
    });

    const parsed = JSON.parse(response.choices[0].message.content);
    return {
      shortSummary: parsed.shortSummary || '',
      detailedSummary: parsed.detailedSummary || '',
      takeaways: parsed.takeaways || [],
      keywords: parsed.keywords || [],
      topics: parsed.topics || [],
      tone: parsed.tone || 'Informative',
    };
  } catch (err) {
    logger.error(`[OpenAI] Summary generation failed: ${err.message}`);
    return getMockSummary(videoTitle, transcript);
  }
};

/**
 * Detect key moments from transcript
 */
const detectKeyMoments = async (transcript, duration) => {
  if (USE_MOCK) {
    logger.warn('[OpenAI] Using MOCK key moments (content-aware from submitted transcript)');
    return getMockKeyMoments(duration, transcript);
  }

  try {
    const prompt = `You are a video content analyst. Given this transcript from a ${Math.round(duration)}s video, identify 5-8 key moments.

Transcript: "${transcript.substring(0, 4000)}"

For each key moment provide timestamp (as fraction of total duration from 0.0 to 1.0), label, brief description, importance (0-1), and topic.

Respond in JSON: { "keyMoments": [{ "timestampStart": 0.0, "timestampEnd": 0.1, "label": "...", "description": "...", "importanceScore": 0.9, "topic": "..." }] }`;

    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [{ role: 'user', content: prompt }],
      response_format: { type: 'json_object' },
      temperature: 0.3,
    });

    const data = JSON.parse(response.choices[0].message.content);
    return data.keyMoments.map((m) => ({
      ...m,
      timestampStart: m.timestampStart * duration,
      timestampEnd: m.timestampEnd * duration,
    }));
  } catch (err) {
    logger.error(`[OpenAI] Key moments detection failed: ${err.message}`);
    return getMockKeyMoments(duration, transcript);
  }
};

/**
 * Generate educational learning materials (Flashcards, Quizzes, Glossary, Discussion Prompts)
 */
const generateLearningMaterials = async (transcript, videoTitle = 'Lecture Content') => {
  if (USE_MOCK) {
    logger.warn('[OpenAI] Using MOCK educational learning materials');
    return getMockLearningMaterials(videoTitle);
  }

  try {
    const prompt = `You are an expert instructional designer and educational technologist. Based on the following lecture transcript titled "${videoTitle}", generate comprehensive learning materials:
1. 4-6 Interactive Flashcards (question, answer, hint)
2. 4-5 Multiple-Choice Quiz questions (question, 4 options, correctAnswer index 0-3, explanation)
3. 4-6 Key Concept Glossary items (term, definition, practical context)
4. 3 Discussion & Critical Thinking Prompts

Transcript:
"${transcript.substring(0, 5000)}"

Respond strictly in JSON:
{
  "flashcards": [
    { "id": "1", "question": "...", "answer": "...", "hint": "..." }
  ],
  "quiz": [
    { "id": "1", "question": "...", "options": ["A", "B", "C", "D"], "correctAnswer": 0, "explanation": "..." }
  ],
  "glossary": [
    { "term": "...", "definition": "...", "context": "..." }
  ],
  "discussionPrompts": [
    { "prompt": "...", "targetAudience": "Students / Study Groups" }
  ]
}`;

    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [{ role: 'user', content: prompt }],
      response_format: { type: 'json_object' },
      temperature: 0.4,
    });

    const data = JSON.parse(response.choices[0].message.content);
    return {
      flashcards: data.flashcards || [],
      quiz: data.quiz || [],
      glossary: data.glossary || [],
      discussionPrompts: data.discussionPrompts || [],
    };
  } catch (err) {
    logger.error(`[OpenAI] Learning materials generation failed: ${err.message}`);
    return getMockLearningMaterials(videoTitle);
  }
};

/**
 * Content-aware mock summary: derives real content from transcript text.
 * Used when OPENAI_API_KEY is not set — extracts actual sentences instead of returning
 * hardcoded AI-topic placeholder data.
 */
const getMockSummary = (title, transcript = '') => {
  const sentences = transcript
    .replace(/\n+/g, ' ')
    .split(/(?<=[.!?])\s+/)
    .map(s => s.trim())
    .filter(s => s.length > 20);

  // Short summary: first 2 meaningful sentences
  const shortSummary = sentences.slice(0, 2).join(' ') ||
    `This video titled "${title}" covers the topics discussed by the presenter.`;

  // Detailed summary: first 8 sentences
  const detailedSummary = sentences.slice(0, 8).join(' ') ||
    `This video "${title}" presents a discussion of the topics covered by the speaker. The content includes key points raised throughout the recording.`;

  // Takeaways: pick sentences from the middle and end of the transcript
  const step = Math.max(1, Math.floor(sentences.length / 4));
  const takeaways = [
    sentences[step]      || sentences[0],
    sentences[step * 2] || sentences[1],
    sentences[step * 3] || sentences[2],
    sentences[sentences.length - 1] || sentences[3],
  ]
    .filter(Boolean)
    .map(s => s.slice(0, 140));

  // Keywords: most frequent unique content words
  const stopWords = new Set(['the','a','an','and','or','but','in','on','at','to','for','of','with','is','are','was','were','it','this','that','they','we','you','i','as','be','by','do','from','has','have','not','so','what','when','who','will']);
  const wordFreq = {};
  transcript.toLowerCase().match(/\b[a-z]{4,}\b/g)?.forEach(w => {
    if (!stopWords.has(w)) wordFreq[w] = (wordFreq[w] || 0) + 1;
  });
  const keywords = Object.entries(wordFreq)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)
    .map(([w]) => w);

  return {
    shortSummary,
    detailedSummary,
    takeaways: takeaways.length > 0 ? takeaways : [`Key content from "${title}"`],
    keywords: keywords.length > 0 ? keywords : [title.toLowerCase()],
    topics: ['Video Content', title],
    tone: 'Informative',
  };
};

/**
 * Content-aware mock key moments: distributes real transcript sentences across the video duration.
 */
const getMockKeyMoments = (duration, transcript = '') => {
  const sentences = transcript
    .replace(/\n+/g, ' ')
    .split(/(?<=[.!?])\s+/)
    .map(s => s.trim())
    .filter(s => s.length > 15);

  // Build 5 evenly-spaced segments, each labelled with real content
  const numSegments = Math.min(5, sentences.length || 5);
  const segDuration = duration / numSegments;

  const fallbackLabels = ['Opening', 'Context & Background', 'Main Discussion', 'Key Points', 'Conclusion'];
  const fallbackDesc = [
    'Introduction and opening remarks.',
    'Background context and framing.',
    'Core discussion of main topics.',
    'Key points and highlights.',
    'Closing remarks and summary.',
  ];

  return Array.from({ length: numSegments }, (_, i) => {
    const sentence = sentences[Math.floor(i * sentences.length / numSegments)] || '';
    const label = sentence
      ? sentence.split(' ').slice(0, 5).join(' ').replace(/[.!?,;]$/, '')
      : fallbackLabels[i] || `Segment ${i + 1}`;
    const description = sentence || fallbackDesc[i] || `Content from segment ${i + 1}.`;

    return {
      timestampStart: Math.round(i * segDuration * 10) / 10,
      timestampEnd:   Math.round(Math.min((i + 1) * segDuration, duration) * 10) / 10,
      label:          label.slice(0, 60),
      description:    description.slice(0, 160),
      importanceScore: 0.7 + (i === 0 || i === numSegments - 1 ? 0.2 : 0.1 * Math.random()),
      topic:          `Segment ${i + 1}`,
    };
  });
};

const getMockLearningMaterials = (title) => ({
  flashcards: [
    {
      id: 'fc-1',
      question: 'Who coined the term "Artificial Intelligence" and in what year?',
      answer: 'John McCarthy in 1956 during the Dartmouth Summer Research Project on Artificial Intelligence.',
      hint: 'Think of the Dartmouth conference in the 1950s.',
    },
    {
      id: 'fc-2',
      question: 'What are the three primary paradigms of Machine Learning?',
      answer: '1. Supervised Learning\n2. Unsupervised Learning\n3. Reinforcement Learning',
      hint: 'One uses labels, one finds clusters, one learns by reward/penalty.',
    },
    {
      id: 'fc-3',
      question: 'How does Supervised Learning differ from Unsupervised Learning?',
      answer: 'Supervised learning trains models on labeled input-output pairs, whereas unsupervised learning analyzes unlabeled data to discover hidden patterns and groupings.',
      hint: 'Ground truth labels vs pattern discovery.',
    },
    {
      id: 'fc-4',
      question: 'What is Deep Learning and what makes it powerful?',
      answer: 'Deep Learning is a subset of machine learning using multi-layered artificial neural networks capable of learning hierarchical feature representations directly from raw data.',
      hint: 'Multi-layer neural networks.',
    },
    {
      id: 'fc-5',
      question: 'What is Reinforcement Learning (RL)?',
      answer: 'An agent learns optimal decision-making policies through trial-and-error interactions with an environment, maximizing cumulative scalar rewards.',
      hint: 'Agent, actions, environment, reward signals.',
    },
  ],
  quiz: [
    {
      id: 'q-1',
      question: 'In what year was the term "Artificial Intelligence" first coined?',
      options: ['1945', '1956', '1968', '1982'],
      correctAnswer: 1,
      explanation: 'John McCarthy coined the term Artificial Intelligence in 1956 at the famous Dartmouth conference.',
    },
    {
      id: 'q-2',
      question: 'Which machine learning paradigm uses labeled datasets with known ground truth?',
      options: ['Unsupervised Learning', 'Supervised Learning', 'Reinforcement Learning', 'Heuristic Clustering'],
      correctAnswer: 1,
      explanation: 'Supervised Learning pairs input features with verified target labels to learn mapping functions.',
    },
    {
      id: 'q-3',
      question: 'What core architectural component gives Deep Learning its name?',
      options: [
        'Relational SQL databases',
        'Multiple hidden layers in artificial neural networks',
        'Linear regression formulas',
        'Decision trees with binary splitting',
      ],
      correctAnswer: 1,
      explanation: 'Deep learning is termed "deep" because of the multiple cascading hidden layers within its neural networks.',
    },
    {
      id: 'q-4',
      question: 'In which scenario is Reinforcement Learning most appropriately applied?',
      options: [
        'Predicting house prices from square footage',
        'Clustering customer demographic segments',
        'Autonomous robotics and game playing (e.g., chess, Go)',
        'Filtering spam emails based on keywords',
      ],
      correctAnswer: 2,
      explanation: 'Reinforcement Learning excels in sequential decision problems like robotics, autonomous driving, and gameplay where an agent earns rewards.',
    },
  ],
  glossary: [
    {
      term: 'Artificial Intelligence (AI)',
      definition: 'The simulation of human intelligence processes by computational systems, including learning, reasoning, and self-correction.',
      context: 'Foundational discipline encompassing machine learning, NLP, computer vision, and robotics.',
    },
    {
      term: 'Neural Network',
      definition: 'A computational model inspired by the biological brain structure, consisting of interconnected nodes (neurons) organized into input, hidden, and output layers.',
      context: 'Core engine behind modern deep learning models for vision, speech, and generative AI.',
    },
    {
      term: 'Supervised Learning',
      definition: 'A machine learning approach where models are trained using labeled datasets containing both input features and corresponding ground truth targets.',
      context: 'Common for classification, object detection, and regression forecasting.',
    },
    {
      term: 'Reinforcement Learning',
      definition: 'A goal-oriented learning framework where an autonomous agent learns behavior policies through environmental feedback (rewards and penalties).',
      context: 'Applied in robotics, gaming AI, and dynamic resource management.',
    },
  ],
  discussionPrompts: [
    {
      prompt: 'How will the transition from traditional supervised machine learning to self-supervised foundation models impact future enterprise AI development?',
      targetAudience: 'Educators & Advanced Students',
    },
    {
      prompt: 'Discuss ethical considerations and potential biases when deploying deep learning neural networks in high-stakes domains like healthcare diagnosis and criminal justice.',
      targetAudience: 'Classroom Seminars & Discussion Forums',
    },
  ],
});

module.exports = { generateSummary, detectKeyMoments, generateLearningMaterials };
