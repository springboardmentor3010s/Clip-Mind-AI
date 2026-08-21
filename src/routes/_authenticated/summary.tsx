import { createFileRoute } from "@tanstack/react-router";
import { motion } from "framer-motion";
import {
  FiBookmark,
  FiCopy,
  FiCpu,
  FiShare2,
} from "react-icons/fi";
import { useEffect, useState } from "react";
import { useWorkspace } from "../../context/WorkspaceContext";
import { EmptyState } from "../../components/EmptyState";
import { VideoSelect } from "../../components/VideoSelect";
import { useToast } from "../../context/ToastContext";
import { useAuth } from "../../context/AuthContext";

export const Route = createFileRoute("/_authenticated/summary")({
  head: () => ({
    meta: [
      { title: "AI Summary — ClipMind AI" },
      {
        name: "description",
        content:
          "Structured AI summary with short summary, detailed summary, abstract, key findings, topics and follow-up actions for your processed recording.",
      },
      {
        property: "og:title",
        content: "AI Summary — ClipMind AI",
      },
      {
        property: "og:description",
        content:
          "Short and detailed summaries, content abstraction, key findings and topic labels generated from your transcript.",
      },
    ],
  }),
  component: SummaryPage,
});

function SummaryPage() {
  const { active } = useWorkspace();
  const { toast } = useToast();
  const { user } = useAuth();

  const [bookmarked, setBookmarked] = useState(false);

  useEffect(() => {
    if (!active || !user) {
      setBookmarked(false);
      return;
    }

    try {
      const key = `clipmind_bookmarked_summaries:${user.id}`;
      const raw = localStorage.getItem(key);
      const ids: string[] = raw ? JSON.parse(raw) : [];

      setBookmarked(ids.includes(active.id));
    } catch {
      setBookmarked(false);
    }
  }, [active?.id, user?.id]);

  if (!active?.summary) {
    return (
      <EmptyState
        icon={<FiCpu />}
        title="No summary generated yet"
        description="Upload and process a recording to generate its short summary, detailed summary, abstract, key findings and topic labels."
      />
    );
  }

  const s = active.summary;

  const copyText = async (
    text: string,
    message: string,
  ) => {
    try {
      await navigator.clipboard.writeText(text);
      toast(message, "success");
    } catch {
      toast("Unable to copy text", "error");
    }
  };

  const toggleBookmark = () => {
    if (!user) return;

    try {
      const key = `clipmind_bookmarked_summaries:${user.id}`;
      const raw = localStorage.getItem(key);
      const ids: string[] = raw ? JSON.parse(raw) : [];

      let nextIds: string[];

      if (ids.includes(active.id)) {
        nextIds = ids.filter((id) => id !== active.id);
        setBookmarked(false);
        toast("Summary removed from bookmarks", "success");
      } else {
        nextIds = [...ids, active.id];
        setBookmarked(true);
        toast("Summary bookmarked", "success");
      }

      localStorage.setItem(
        key,
        JSON.stringify(nextIds),
      );
    } catch {
      toast("Unable to update bookmark", "error");
    }
  };

  const shareSummary = async () => {
    const text = [
      `ClipMind AI — ${active.title}`,
      "",
      "Short Summary:",
      s.shortSummary,
      "",
      "Key Findings:",
      ...s.bullets.map(
        (b, i) => `${i + 1}. ${b}`,
      ),
      "",
      `Topics: ${s.topics.join(", ")}`,
    ].join("\n");

    try {
      if (navigator.share) {
        await navigator.share({
          title: `ClipMind AI — ${active.title}`,
          text,
        });

        toast("Summary shared", "success");
      } else {
        await navigator.clipboard.writeText(text);
        toast(
          "Summary copied for sharing",
          "success",
        );
      }
    } catch (error) {
      // Browser share was cancelled by the user.
      if (
        error instanceof DOMException &&
        error.name === "AbortError"
      ) {
        return;
      }

      toast("Unable to share summary", "error");
    }
  };

  const markAsLearned = () => {
    if (!user) return;

    const key = `clipmind_learned_history:${user.id}`;

    try {
      const raw = localStorage.getItem(key);
      const ids: string[] = raw ? JSON.parse(raw) : [];

      if (!ids.includes(active.id)) {
        localStorage.setItem(
          key,
          JSON.stringify([...ids, active.id]),
        );

        toast("Marked as learned", "success");
      } else {
        toast("Already marked as learned", "success");
      }
    } catch {
      toast(
        "Unable to update learning history",
        "error",
      );
    }
  };

  return (
    <div className="mx-auto max-w-4xl space-y-5">
      {/* Header */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl">
            AI Summary
          </h1>

          <p className="mt-1 text-sm text-muted-foreground">
            {active.title} · {active.duration}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <VideoSelect />

          {/* Share with students */}
          <button
            onClick={shareSummary}
            className="inline-flex h-10 items-center gap-2 rounded-xl border border-border bg-card px-3 text-sm text-muted-foreground hover:bg-muted hover:text-foreground"
          >
            <FiShare2 />
            Share with Students
          </button>

          {/* Bookmark summary */}
          <button
            onClick={toggleBookmark}
            className={`inline-flex h-10 items-center gap-2 rounded-xl border px-3 text-sm transition-colors ${
              bookmarked
                ? "border-primary bg-primary/10 text-primary"
                : "border-border bg-card text-muted-foreground hover:bg-muted hover:text-foreground"
            }`}
          >
            <FiBookmark />

            {bookmarked
              ? "Bookmarked"
              : "Bookmark Summary"}
          </button>

          {/* Learning history */}
          <button
            onClick={markAsLearned}
            className="inline-flex h-10 items-center gap-2 rounded-xl border border-border bg-card px-3 text-sm text-muted-foreground hover:bg-muted hover:text-foreground"
          >
            ✓ Mark as Learned
          </button>
        </div>
      </div>

      {/* Summary metrics */}
      <div className="grid gap-3 sm:grid-cols-3">
        {[
          {
            label: "Transcribed words",
            value: s.wordCount,
          },
          {
            label: "Compression",
            value: `${s.compression}%`,
          },
          {
            label: "Topics detected",
            value: s.topics.length,
          },
        ].map((m) => (
          <div
            key={m.label}
            className="rounded-2xl border border-border bg-card p-4"
          >
            <div className="text-[11px] uppercase tracking-widest text-muted-foreground">
              {m.label}
            </div>

            <div className="mt-1.5 font-display text-xl">
              {m.value}
            </div>
          </div>
        ))}
      </div>

      {/* Short Summary */}
      <motion.section
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-2xl border border-border bg-card p-6"
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="font-display text-lg">
              Short Summary
            </h2>

            <p className="mt-1 text-xs text-muted-foreground">
              A concise overview of the recording.
            </p>
          </div>

          <button
            onClick={() =>
              copyText(
                s.shortSummary,
                "Short summary copied",
              )
            }
            className="inline-flex items-center gap-1.5 rounded-lg border border-border px-2.5 py-1.5 text-xs text-muted-foreground hover:text-foreground"
          >
            <FiCopy />
            Copy
          </button>
        </div>

        <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
          {s.shortSummary}
        </p>
      </motion.section>

      {/* Abstract */}
      <motion.section
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
        className="rounded-2xl border border-border bg-card p-6"
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="font-display text-lg">
              Abstract
            </h2>

            <p className="mt-1 text-xs text-muted-foreground">
              High-level content abstraction.
            </p>
          </div>

          <button
            onClick={() =>
              copyText(
                s.abstract,
                "Abstract copied",
              )
            }
            className="inline-flex items-center gap-1.5 rounded-lg border border-border px-2.5 py-1.5 text-xs text-muted-foreground hover:text-foreground"
          >
            <FiCopy />
            Copy
          </button>
        </div>

        <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
          {s.abstract}
        </p>
      </motion.section>

      {/* Detailed Summary */}
      <motion.section
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="rounded-2xl border border-border bg-card p-6"
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="font-display text-lg">
              Detailed Summary
            </h2>

            <p className="mt-1 text-xs text-muted-foreground">
              A more comprehensive summary of the recorded discussion.
            </p>
          </div>

          <button
            onClick={() =>
              copyText(
                s.detailedSummary,
                "Detailed summary copied",
              )
            }
            className="inline-flex items-center gap-1.5 rounded-lg border border-border px-2.5 py-1.5 text-xs text-muted-foreground hover:text-foreground"
          >
            <FiCopy />
            Copy
          </button>
        </div>

        <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
          {s.detailedSummary}
        </p>
      </motion.section>

      {/* Key Findings */}
      <section className="rounded-2xl border border-border bg-card p-6">
        <h2 className="font-display text-lg">
          Key Findings
        </h2>

        <ul className="mt-3 space-y-2.5">
          {s.bullets.map((b, i) => (
            <li
              key={i}
              className="flex gap-3 text-sm"
            >
              <span className="font-mono-num text-xs text-primary">
                {String(i + 1).padStart(2, "0")}
              </span>

              <span className="text-muted-foreground">
                {b}
              </span>
            </li>
          ))}
        </ul>
      </section>

      {/* Topics + Follow-up Actions */}
      <div className="grid gap-3 md:grid-cols-2">
        <section className="rounded-2xl border border-border bg-card p-6">
          <h2 className="font-display text-lg">
            Topics
          </h2>

          <div className="mt-3 flex flex-wrap gap-2">
            {s.topics.map((t) => (
              <span
                key={t}
                className="rounded-lg border border-border bg-muted px-2.5 py-1 text-xs text-muted-foreground"
              >
                {t}
              </span>
            ))}
          </div>
        </section>

        <section className="rounded-2xl border border-border bg-card p-6">
          <h2 className="font-display text-lg">
            Follow-up Actions
          </h2>

          <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
            {s.actionItems.map((a) => (
              <li key={a}>· {a}</li>
            ))}
          </ul>
        </section>
      </div>
    </div>
  );
}