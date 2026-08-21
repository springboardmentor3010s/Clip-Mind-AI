import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import {
  FiBookOpen,
  FiCheck,
  FiDownload,
  FiEdit3,
  FiFileText,
  FiSearch,
  FiX,
} from "react-icons/fi";

import { useWorkspace } from "../../context/WorkspaceContext";
import { EmptyState } from "../../components/EmptyState";
import { VideoSelect } from "../../components/VideoSelect";
import { transcriptService } from "../../services/transcript";
import { useToast } from "../../context/ToastContext";
import { useAuth } from "../../context/AuthContext";

export const Route = createFileRoute("/_authenticated/transcript")({
  head: () => ({
    meta: [
      { title: "Transcript — ClipMind AI" },
      {
        name: "description",
        content:
          "Timestamp-aligned transcript segments generated from your uploaded recording.",
      },
      {
        property: "og:title",
        content: "Transcript — ClipMind AI",
      },
      {
        property: "og:description",
        content: "Search and review speaker-labelled transcript segments.",
      },
    ],
  }),
  component: TranscriptPage,
});

function TranscriptPage() {
  const { active } = useWorkspace();
  const { toast } = useToast();
  const { user } = useAuth();

  const [query, setQuery] = useState("");
  const [speaker, setSpeaker] = useState("All");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingText, setEditingText] = useState("");
  const [showLearningMaterial, setShowLearningMaterial] = useState(false);

  /*
   * EDUCATOR ONLY
   *
   * Learning Material is available only to Educators.
   * Content Creators, Learners and Administrators do not get this feature.
   */
  const isEducator = user?.role === "Educator";

  /*
   * IMPORTANT:
   * All hooks are declared before the empty-state return.
   */

  const speakers = useMemo(
    () => [
      "All",
      ...Array.from(
        new Set(active?.transcript.map((s) => s.speaker) ?? [])
      ),
    ],
    [active]
  );

  const rows = useMemo(() => {
    const segments = active?.transcript ?? [];
    const q = query.trim().toLowerCase();

    return segments.filter(
      (s) =>
        (speaker === "All" || s.speaker === speaker) &&
        (!q || s.text.toLowerCase().includes(q))
    );
  }, [active, query, speaker]);

  /*
   * EDUCATOR LEARNING MATERIAL
   */
  const learningMaterial = useMemo(() => {
    const transcript = active?.transcript ?? [];

    const allText = transcript.map((s) => s.text).join(" ");

    const sentences = allText
      .split(/[.!?]+/)
      .map((s) => s.trim())
      .filter(Boolean);

    const keyPoints = sentences.slice(0, 6).map((s) =>
      s.length > 140 ? `${s.slice(0, 137)}...` : s
    );

    const title = active?.title ?? "Recording";

    const objectives = [
      `Understand the main concepts discussed in ${title}.`,
      "Identify the major ideas and supporting points from the recording.",
      "Review important information using the generated transcript.",
    ];

    const questions = [
      "What is the main topic of the recording?",
      "What are the most important ideas discussed?",
      "Which points would be useful for further study?",
      "What practical conclusions can be drawn from the discussion?",
      "What topic would you review again after watching this recording?",
    ];

    return {
      title: `Learning Material — ${title}`,

      overview:
        sentences.slice(0, 3).join(". ") ||
        "This learning material was generated from the uploaded transcript.",

      objectives,

      keyPoints:
        keyPoints.length > 0
          ? keyPoints
          : [
              "Review the transcript to identify the main concepts discussed.",
            ],

      questions,
    };
  }, [active]);

  /*
   * EMPTY STATE
   */
  if (!active) {
    return (
      <EmptyState
        icon={<FiFileText />}
        title="No transcript yet"
        description="Transcript segments appear here once a recording has been processed."
      />
    );
  }

  /*
   * EXPORT TRANSCRIPT
   */
  const download = () => {
    const text = active.transcript
      .map((s) => `[${s.time}] ${s.speaker}: ${s.text}`)
      .join("\n");

    const url = URL.createObjectURL(
      new Blob([text], {
        type: "text/plain",
      })
    );

    const a = document.createElement("a");
    a.href = url;
    a.download = `${active.title}-transcript.txt`;
    a.click();

    URL.revokeObjectURL(url);

    toast("Transcript exported", "success");
  };

  /*
   * EDITING
   */
  const startEditing = (id: string, text: string) => {
    setEditingId(id);
    setEditingText(text);
  };

  const cancelEditing = () => {
    setEditingId(null);
    setEditingText("");
  };

  const saveEditing = async (id: string) => {
    const updatedTranscript = active.transcript.map((segment) =>
      segment.id === id
        ? {
            ...segment,
            text: editingText.trim(),
          }
        : segment
    );

    try {
      await transcriptService.update(active.id, updatedTranscript);

      setEditingId(null);
      setEditingText("");

      toast("Transcript updated", "success");
    } catch (error) {
      console.error("Failed to save transcript:", error);

      toast("Unable to save transcript", "error");
    }
  };

  /*
   * EDUCATOR ONLY:
   * OPEN LEARNING MATERIAL
   */
  const createLearningMaterial = () => {
    if (!isEducator) return;

    setShowLearningMaterial(true);
  };

  /*
   * EDUCATOR ONLY:
   * EXPORT LEARNING MATERIAL
   */
  const exportLearningMaterial = () => {
    if (!isEducator) return;

    const text = [
      learningMaterial.title,
      "",
      "Overview",
      learningMaterial.overview,
      "",
      "Learning Objectives",
      ...learningMaterial.objectives.map((x, i) => `${i + 1}. ${x}`),
      "",
      "Key Points",
      ...learningMaterial.keyPoints.map((x, i) => `${i + 1}. ${x}`),
      "",
      "Discussion Questions",
      ...learningMaterial.questions.map((x, i) => `${i + 1}. ${x}`),
    ].join("\n");

    const url = URL.createObjectURL(
      new Blob([text], {
        type: "text/plain;charset=utf-8",
      })
    );

    const a = document.createElement("a");
    a.href = url;
    a.download = `${active.title}-learning-material.txt`;
    a.click();

    URL.revokeObjectURL(url);

    toast("Learning material exported", "success");
  };

  return (
    <div className="space-y-5">
      {/* HEADER */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl">Transcript</h1>

          <p className="mt-1 text-sm text-muted-foreground">
            {active.transcript.length} segments · {active.language} ·{" "}
            {active.duration}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <VideoSelect />

          {/* EDUCATOR ONLY */}
          {isEducator && (
            <button
              type="button"
              onClick={createLearningMaterial}
              className="h-10 inline-flex items-center gap-2 rounded-xl bg-primary px-3 text-sm font-medium text-white hover:opacity-90 transition"
            >
              <FiBookOpen />
              Create Learning Material
            </button>
          )}

          {/* TRANSCRIPT EXPORT */}
          <button
            type="button"
            onClick={download}
            className="h-10 inline-flex items-center gap-2 rounded-xl border border-border bg-card px-3 text-sm hover:bg-muted transition"
          >
            <FiDownload />
            Export
          </button>
        </div>
      </div>

      {/* SEARCH + SPEAKER FILTER */}
      <div className="flex flex-wrap gap-2">
        <div className="relative min-w-56 flex-1">
          <FiSearch className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />

          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search transcript…"
            className="h-10 w-full rounded-xl border border-border bg-card pl-9 pr-3 text-sm outline-none focus:ring-focus"
          />
        </div>

        <select
          value={speaker}
          onChange={(e) => setSpeaker(e.target.value)}
          className="h-10 rounded-xl border border-border bg-card px-3 text-sm outline-none focus:ring-focus"
        >
          {speakers.map((s) => (
            <option key={s}>{s}</option>
          ))}
        </select>
      </div>

      {/* TRANSCRIPT */}
      <div className="divide-y divide-border rounded-2xl border border-border bg-card">
        {rows.map((s) => {
          const isEditing = editingId === s.id;

          return (
            <div
              key={s.id}
              className="flex gap-4 p-4 hover:bg-muted/40"
            >
              <span className="font-mono-num shrink-0 pt-1 text-xs text-primary">
                {s.time}
              </span>

              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-3">
                  <div className="text-xs uppercase tracking-wide text-muted-foreground">
                    {s.speaker}
                  </div>

                  {!isEditing && (
                    <button
                      type="button"
                      onClick={() => startEditing(s.id, s.text)}
                      className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs text-muted-foreground hover:bg-muted hover:text-foreground"
                    >
                      <FiEdit3 />
                      Edit
                    </button>
                  )}
                </div>

                {isEditing ? (
                  <div className="mt-2 space-y-2">
                    <textarea
                      autoFocus
                      value={editingText}
                      onChange={(e) => setEditingText(e.target.value)}
                      rows={4}
                      className="w-full resize-y rounded-xl border border-primary/40 bg-background p-3 text-sm leading-relaxed outline-none focus:ring-2 focus:ring-primary/30"
                    />

                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => saveEditing(s.id)}
                        className="inline-flex items-center gap-1.5 rounded-lg bg-gradient-primary px-3 py-2 text-xs font-medium text-white"
                      >
                        <FiCheck />
                        Save
                      </button>

                      <button
                        type="button"
                        onClick={cancelEditing}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-card px-3 py-2 text-xs hover:bg-muted"
                      >
                        <FiX />
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <p className="mt-1 text-sm leading-relaxed">
                    {s.text}
                  </p>
                )}
              </div>
            </div>
          );
        })}

        {rows.length === 0 && (
          <div className="p-8 text-center text-sm text-muted-foreground">
            No segments match the current filters.
          </div>
        )}
      </div>

      {/* =======================================================
          EDUCATOR LEARNING MATERIAL MODAL
          ======================================================= */}
      {isEducator && showLearningMaterial && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm"
          onClick={() => setShowLearningMaterial(false)}
        >
          <div
            className="relative max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-3xl border border-border bg-card p-6 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* MODAL HEADER */}
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="mb-2 inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
                  <FiBookOpen />
                  Educator Learning Material
                </div>

                <h2 className="font-display text-2xl">
                  {learningMaterial.title}
                </h2>

                <p className="mt-1 text-xs text-muted-foreground">
                  Generated from the current transcript.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setShowLearningMaterial(false)}
                className="shrink-0 rounded-xl p-2 text-muted-foreground hover:bg-muted hover:text-foreground"
                aria-label="Close learning material"
              >
                <FiX className="text-lg" />
              </button>
            </div>

            {/* OVERVIEW */}
            <section className="mt-6 rounded-2xl border border-border bg-muted/30 p-4">
              <h3 className="font-display text-base">
                Overview
              </h3>

              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                {learningMaterial.overview}
              </p>
            </section>

            {/* OBJECTIVES */}
            <section className="mt-5">
              <h3 className="font-display text-base">
                Learning Objectives
              </h3>

              <ul className="mt-3 space-y-2 text-sm">
                {learningMaterial.objectives.map((item, index) => (
                  <li
                    key={index}
                    className="flex gap-3 rounded-xl border border-border/60 bg-card p-3"
                  >
                    <span className="font-semibold text-primary">
                      {index + 1}.
                    </span>

                    <span className="text-muted-foreground">
                      {item}
                    </span>
                  </li>
                ))}
              </ul>
            </section>

            {/* KEY POINTS */}
            <section className="mt-5">
              <h3 className="font-display text-base">
                Key Points
              </h3>

              <ul className="mt-3 space-y-2.5">
                {learningMaterial.keyPoints.map((item, index) => (
                  <li
                    key={index}
                    className="flex gap-3 rounded-xl border border-border/60 bg-card p-3 text-sm"
                  >
                    <span className="font-mono-num text-xs font-semibold text-primary">
                      {String(index + 1).padStart(2, "0")}
                    </span>

                    <span className="leading-relaxed text-muted-foreground">
                      {item}
                    </span>
                  </li>
                ))}
              </ul>
            </section>

            {/* QUESTIONS */}
            <section className="mt-5">
              <h3 className="font-display text-base">
                Discussion Questions
              </h3>

              <ol className="mt-3 space-y-2">
                {learningMaterial.questions.map((question, index) => (
                  <li
                    key={index}
                    className="rounded-xl border border-border/60 bg-card p-3 text-sm text-muted-foreground"
                  >
                    <span className="mr-2 font-semibold text-primary">
                      {index + 1}.
                    </span>

                    {question}
                  </li>
                ))}
              </ol>
            </section>

            {/* FOOTER ACTIONS */}
            <div className="mt-7 flex flex-wrap justify-end gap-2 border-t border-border/60 pt-5">
              <button
                type="button"
                onClick={() => setShowLearningMaterial(false)}
                className="inline-flex items-center gap-2 rounded-xl border border-border bg-card px-4 py-2.5 text-sm hover:bg-muted"
              >
                Close
              </button>

              <button
                type="button"
                onClick={exportLearningMaterial}
                className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-medium text-white hover:opacity-90"
              >
                <FiDownload />
                Export Learning Material
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}