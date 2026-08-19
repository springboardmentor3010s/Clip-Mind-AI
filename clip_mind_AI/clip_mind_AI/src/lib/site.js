/**
 * Public-site content constants.
 *
 * NOTE: the contact address is intentionally NOT hardcoded to a made-up value.
 * Set VITE_CONTACT_EMAIL in your .env (and rebuild — Vite inlines it at build
 * time). Until you do, the placeholder below is displayed verbatim so it is
 * obvious it still needs configuring.
 */
export const CONTACT_EMAIL =
  import.meta.env.VITE_CONTACT_EMAIL || "set-VITE_CONTACT_EMAIL@example.com";

/** Capabilities per role — mirrors the platform's access-control rules. */
export const ROLE_SHOWCASE = [
  {
    icon: "🎬",
    role: "Content Creator",
    tagline: "Create and manage summarized content for audiences.",
    color: "text-blue-400",
    ring: "border-blue-600/40",
    points: [
      "Upload videos or import from YouTube",
      "Auto-generated transcripts and AI summaries",
      "Key moments with timestamps and thumbnails",
      "Download transcripts and summaries",
      "Content analytics and upload history",
    ],
  },
  {
    icon: "🎓",
    role: "Learner",
    tagline: "Consume educational content efficiently.",
    color: "text-emerald-400",
    ring: "border-emerald-600/40",
    points: [
      "Browse videos shared with you",
      "Read summaries and full transcripts",
      "Jump to key moments by timestamp",
      "Search spoken words across every video",
      "Bookmark highlights and keep a learning history",
    ],
  },
  {
    icon: "👨‍🏫",
    role: "Educator",
    tagline: "Turn long lectures into concise learning resources.",
    color: "text-purple-400",
    ring: "border-purple-600/40",
    points: [
      "Upload lectures and review AI transcripts",
      "Correct transcripts without losing timings",
      "Generate study notes, quizzes and flashcards",
      "Share content with a class or a public link",
      "Track student engagement and completion",
    ],
  },
  {
    icon: "🛡️",
    role: "Administrator",
    tagline: "Maintain platform operations, security and performance.",
    color: "text-amber-400",
    ring: "border-amber-600/40",
    points: [
      "Manage users, roles and account status",
      "Monitor platform-wide activity",
      "Watch AI processing jobs in real time",
      "Track storage and resource utilisation",
      "Review audit logs and configure settings",
    ],
  },
];

/** Answers reflect the platform's actual limits and behaviour. */
export const FAQS = [
  {
    q: "What video formats can I upload?",
    a: "MP4, MOV, AVI, MKV and WebM, up to 2 GB per file. Uploads are checked by file signature, not just the extension, so a renamed file is rejected. You can also paste a YouTube URL instead of uploading.",
  },
  {
    q: "How long does processing take?",
    a: "Usually a fraction of the video's length. The pipeline compresses the video, extracts audio, transcribes it with Whisper, then generates the summary and key moments. You can watch each stage live on the Processing page.",
  },
  {
    q: "Which languages are supported?",
    a: "Transcription auto-detects the spoken language and supports the full Whisper language set, including Hindi, Urdu, Tamil, Telugu, Bengali, Spanish, French, German, Arabic, Japanese and more. Summaries are written in English by default, and any output can be translated on demand.",
  },
  {
    q: "How accurate are the AI summaries?",
    a: "Summaries are generated strictly from the transcript, and the model is instructed never to introduce facts the transcript does not support. Accuracy still depends on audio quality — always verify anything critical against the source video. Educators can correct transcripts by hand, and a corrected transcript is marked as human-reviewed.",
  },
  {
    q: "Who can see my videos?",
    a: "Only you, until you explicitly share. Video files are served through short-lived signed URLs, so an unshared video cannot be fetched even if someone guesses its address. Sharing is per-video and can be revoked at any time, which immediately invalidates the public link.",
  },
  {
    q: "What exactly does search look through?",
    a: "The spoken words inside your videos, taken from the AI transcript — not filenames or titles. Results come back with timestamps, so one click jumps the player to the exact moment the phrase was said. Search only ever covers videos you own or that were shared with you.",
  },
  {
    q: "What are key moments?",
    a: "The most important segments of a video, identified by the AI along with a title, an explanation of why the moment matters, a timestamp and a thumbnail generated from that frame. They let you skim a long video in seconds.",
  },
  {
    q: "Can I export my content?",
    a: "Yes. Transcripts and summaries download as text files, and educator-generated learning materials export as structured JSON.",
  },
];
