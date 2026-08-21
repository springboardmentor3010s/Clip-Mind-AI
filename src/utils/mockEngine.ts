export interface TranscriptSegment {
  id: string;
  seconds: number;
  time: string;
  speaker: string;
  text: string;
}

export interface KeyMoment {
  id: string;
  seconds: number;
  time: string;
  title: string;
  description: string;
  confidence: number;
  tag: string;
}

export interface SummaryResult {
  shortSummary: string;
  abstract: string;
  detailedSummary: string;
  bullets: string[];
  topics: string[];
  actionItems: string[];
  wordCount: number;
  compression: number;
}

export interface AnalyticsResult {
  speakerShare: { speaker: string; pct: number }[];
  keywords: { term: string; count: number }[];
  sentimentTimeline: { seconds: number; value: number }[];
  metrics: { label: string; value: string }[];
}

export interface VideoRecord {
  id: string;
  title: string;
  fileName: string;
  sizeMb: number;
  durationSeconds: number;
  duration: string;
  status: "Queued" | "Processing" | "Processed" | "Failed";
  createdAt: string;
  language: string;
  transcript: TranscriptSegment[];
  summary: SummaryResult | null;
  moments: KeyMoment[];
  analytics: AnalyticsResult | null;
}

export function fmt(seconds: number): string {
  const s = Math.max(0, Math.round(seconds));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  const mm = String(m).padStart(2, "0");
  const ss = String(sec).padStart(2, "0");
  return h > 0 ? `${h}:${mm}:${ss}` : `${mm}:${ss}`;
}

function hash(str: string): number {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return Math.abs(h);
}

function rng(seed: number) {
  let s = seed || 1;
  return () => {
    s = (s * 1664525 + 1013904223) % 4294967296;
    return s / 4294967296;
  };
}

export function titleFromFile(name: string): string {
  return name
    .replace(/\.[a-z0-9]+$/i, "")
    .replace(/[-_]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/\b\w/g, (m) => m.toUpperCase()) || "Untitled recording";
}

const SPEAKERS = ["Presenter", "Participant", "Moderator"];

const LINES = [
  "We begin by outlining the objective of this recording session and the dataset used for the study.",
  "The methodology combines automatic speech recognition with a long-context summarisation model.",
  "Segment boundaries are detected from pauses, speaker turns and lexical cohesion signals.",
  "Note that the evaluation set is intentionally small so results should be read as indicative.",
  "The transcript is aligned to the media timeline, which is what makes timestamp navigation possible.",
  "Key moments are ranked by a salience score combining novelty, emphasis and topic centrality.",
  "For the educator workflow, the extracted moments map cleanly onto lecture chapters.",
  "Here we compare the baseline extractive method against the abstractive pipeline.",
  "Retrieval accuracy improves once the topic model is refreshed on the current corpus.",
  "We close with limitations, reproducibility notes and the next milestone of the project.",
  "Question from the floor: how does the system behave on noisy field recordings?",
  "Answer: word error rate rises, but moment detection degrades gracefully because it uses prosody too.",
];

const TOPIC_POOL = [
  "speech recognition", "summarisation", "topic modelling", "evaluation", "timeline alignment",
  "salience scoring", "lecture indexing", "reproducibility", "corpus design", "annotation",
];

export function buildTranscript(seed: string, durationSeconds: number): TranscriptSegment[] {
  const rand = rng(hash(seed));
  const count = Math.max(8, Math.min(28, Math.round(durationSeconds / 22)));
  const step = durationSeconds / count;
  return Array.from({ length: count }, (_, i) => {
    const seconds = Math.round(i * step);
    return {
      id: `seg-${i}`,
      seconds,
      time: fmt(seconds),
      speaker: SPEAKERS[Math.floor(rand() * SPEAKERS.length)],
      text: LINES[(i + Math.floor(rand() * 3)) % LINES.length],
    };
  });
}

export function buildMoments(seed: string, transcript: TranscriptSegment[]): KeyMoment[] {
  const rand = rng(hash(seed + "moments"));
  const picks = transcript.filter((_, i) => i % Math.max(2, Math.floor(transcript.length / 6)) === 0).slice(0, 6);
  const tags = ["Objective", "Method", "Result", "Discussion", "Q&A", "Conclusion"];
  return picks.map((seg, i) => ({
    id: `moment-${i}`,
    seconds: seg.seconds,
    time: seg.time,
    title: tags[i % tags.length] + " — " + seg.text.split(" ").slice(0, 6).join(" "),
    description: seg.text,
    confidence: Math.round((0.72 + rand() * 0.26) * 100) / 100,
    tag: tags[i % tags.length],
  }));
}

export function buildSummary(seed: string, title: string, transcript: TranscriptSegment[]): SummaryResult {
  const rand = rng(hash(seed + "summary"));
  const words = transcript.reduce((n, s) => n + s.text.split(" ").length, 0);
  const bullets = transcript
    .filter((_, i) => i % 3 === 0)
    .slice(0, 5)
    .map((s) => s.text.replace(/^We |^The /, ""));
  const topics = [...TOPIC_POOL].sort(() => rand() - 0.5).slice(0, 5);
  return {
  shortSummary:
    `This recording discusses ${topics.slice(0, 3).join(", ")} and explains the main methodology, evaluation process, and key observations.`,

  abstract:
    `"${title}" is a ${fmt(transcript[transcript.length - 1]?.seconds ?? 0)} recording processed by the ClipMind AI pipeline. ` +
    `The session covers ${topics.slice(0, 3).join(", ")}, with the discussion moving from problem framing through method description to evaluation and limitations. ` +
    `The abstractive model condensed ${words} transcribed words into the structured notes below.`,

  detailedSummary:
    `The recording begins with an overview of the project objectives and problem context. ` +
    `It then discusses ${topics.slice(0, 3).join(", ")} and explains the methodology used during the session. ` +
    `The discussion also covers evaluation considerations, limitations, and the next steps for the project.`,

  bullets,
  topics,
  actionItems: [
    "Archive the aligned transcript with the source recording.",
    "Review flagged low-confidence segments before citation.",
    "Export key moments into the study index for Milestone 3.",
  ],
  wordCount: words,
  compression: Math.round(
    (1 - (bullets.join(" ").split(" ").length / Math.max(1, words))) * 100
  ),
 };
}

export function buildAnalytics(seed: string, transcript: TranscriptSegment[], moments: KeyMoment[]): AnalyticsResult {
  const rand = rng(hash(seed + "analytics"));
  const totals: Record<string, number> = {};
  transcript.forEach((s) => { totals[s.speaker] = (totals[s.speaker] ?? 0) + 1; });
  const sum = Object.values(totals).reduce((a, b) => a + b, 0) || 1;
  const speakerShare = Object.entries(totals).map(([speaker, n]) => ({
    speaker,
    pct: Math.round((n / sum) * 100),
  }));

  const freq: Record<string, number> = {};
  transcript.forEach((s) =>
    s.text.toLowerCase().replace(/[^a-z\s]/g, "").split(/\s+/).forEach((w) => {
      if (w.length > 5) freq[w] = (freq[w] ?? 0) + 1;
    }),
  );
  const keywords = Object.entries(freq)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)
    .map(([term, count]) => ({ term, count }));

  const sentimentTimeline = transcript.map((s) => ({
    seconds: s.seconds,
    value: Math.round((0.35 + rand() * 0.55) * 100) / 100,
  }));

  const duration = transcript[transcript.length - 1]?.seconds ?? 0;
  return {
    speakerShare,
    keywords,
    sentimentTimeline,
    metrics: [
      { label: "Segments", value: String(transcript.length) },
      { label: "Key moments", value: String(moments.length) },
      { label: "Speakers", value: String(speakerShare.length) },
      { label: "Duration", value: fmt(duration) },
    ],
  };
}
