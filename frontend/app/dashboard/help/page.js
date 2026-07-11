import { HelpIcon } from "../../../components/ui/icons";

const FAQS = [
  { q: "What video formats are supported?", a: "MP4, MOV, AVI, and WebM, up to 2GB per file." },
  { q: "How long does processing take?", a: "Most videos finish transcription and summarization within a few minutes, depending on length." },
  { q: "Can I edit the generated transcript?", a: "Yes — open a video's Transcript tab and select Edit to make corrections." },
];

export default function HelpPage() {
  return (
    <div className="max-w-2xl">
      <h1 className="mb-1 font-display text-xl font-semibold tracking-tight text-ink dark:text-paper">Help &amp; Support</h1>
      <p className="mb-8 text-sm text-ink/50 dark:text-paper/50">Answers to common questions</p>

      <div className="space-y-3">
        {FAQS.map((f) => (
          <div key={f.q} className="rounded-xl border border-line bg-cloud p-5 dark:border-line-dark dark:bg-graphite">
            <p className="text-sm font-medium text-ink dark:text-paper">{f.q}</p>
            <p className="mt-1.5 text-sm text-ink/60 dark:text-paper/60">{f.a}</p>
          </div>
        ))}
      </div>

      <div className="mt-6 flex items-center gap-3 rounded-xl border border-line bg-cloud p-5 dark:border-line-dark dark:bg-graphite">
        <span className="flex h-10 w-10 items-center justify-center rounded-full bg-signal/10 text-signal dark:bg-signal-dark/15 dark:text-signal-dark">
          <HelpIcon width={18} height={18} />
        </span>
        <div>
          <p className="text-sm font-medium text-ink dark:text-paper">Still need help?</p>
          <p className="text-sm text-ink/50 dark:text-paper/50">Reach out at support@clipmind.ai</p>
        </div>
      </div>
    </div>
  );
}
