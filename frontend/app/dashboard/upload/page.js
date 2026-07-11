"use client";

import { useState, useRef } from "react";
import Link from "next/link";
import api from "../../../lib/api";
import StatusChip from "../../../components/ui/StatusChip";
import { CloudUploadIcon, CheckCircleIcon, ClockIcon, ChevronDownIcon } from "../../../components/ui/icons";

const ALLOWED_EXTENSIONS = [".mp4", ".mov", ".avi", ".webm"];
const MAX_SIZE_MB = 2048;

const PIPELINE_STEPS = [
  "Validating video",
  "Extracting audio (FFmpeg)",
  "Generating transcript (Whisper)",
  "Generating summary (AI)",
  "Detecting key moments",
  "Extracting keywords",
];

function formatDuration(seconds) {
  if (!seconds && seconds !== 0) return "—";
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

export default function UploadPage() {
  const [file, setFile] = useState(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [visibility, setVisibility] = useState("Private");
  const [dragActive, setDragActive] = useState(false);
  const [progress, setProgress] = useState(0);
  const [phase, setPhase] = useState("idle");
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  const inputRef = useRef(null);

  function validateAndSetFile(selected) {
    setError("");
    if (!selected) return;
    const ext = "." + selected.name.split(".").pop().toLowerCase();
    if (!ALLOWED_EXTENSIONS.includes(ext)) {
      setError(`Unsupported file type '${ext}'. Allowed: ${ALLOWED_EXTENSIONS.join(", ")}`);
      return;
    }
    const sizeMb = selected.size / (1024 * 1024);
    if (sizeMb > MAX_SIZE_MB) {
      setError(`File too large (${sizeMb.toFixed(1)} MB). Max: ${MAX_SIZE_MB} MB.`);
      return;
    }
    setFile(selected);
    if (!title) {
      setTitle(selected.name.replace(/\.[^/.]+$/, ""));
    }
  }

  function handleDrop(e) {
    e.preventDefault();
    setDragActive(false);
    validateAndSetFile(e.dataTransfer.files?.[0]);
  }

  async function handleUpload() {
    if (!file || !title.trim()) return;
    setError("");
    setPhase("uploading");
    setProgress(0);
    const formData = new FormData();
    formData.append("file", file);
    formData.append("title", title.trim());
    formData.append("description", description.trim());
    try {
      const res = await api.post("/api/v1/videos/upload", formData, {
        headers: { "Content-Type": "multipart/form-data" },
        onUploadProgress: (evt) => {
          const pct = Math.round((evt.loaded * 100) / evt.total);
          setProgress(pct);
          if (pct === 100) setPhase("processing");
        },
      });
      setResult(res.data);
      setPhase("done");
    } catch (err) {
      setError(err.response?.data?.detail || "Upload failed. Please try again.");
      setPhase("error");
    }
  }

  function reset() {
    setFile(null);
    setTitle("");
    setDescription("");
    setProgress(0);
    setPhase("idle");
    setResult(null);
    setError("");
  }

  const canUpload = file && title.trim().length > 0;

  // Processing view — mirrors the "Processing Video" wireframe with a step checklist.
  if (phase === "processing") {
    const stepsDone = Math.min(PIPELINE_STEPS.length, Math.floor((80 / 100) * PIPELINE_STEPS.length) + 1);
    const overallPct = Math.round((stepsDone / PIPELINE_STEPS.length) * 100);

    return (
      <div className="max-w-2xl">
        <h1 className="mb-1 font-display text-xl font-semibold tracking-tight text-ink dark:text-paper">Processing Video</h1>
        <p className="mb-6 text-sm text-ink/50 dark:text-paper/50">Please wait while we analyze your video</p>

        <div className="rounded-xl border border-line bg-cloud p-5 dark:border-line-dark dark:bg-graphite">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-16 shrink-0 items-center justify-center rounded-md bg-ink text-white/70">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5.5v13l11-6.5-11-6.5Z" /></svg>
            </div>
            <div>
              <p className="text-sm font-medium text-ink dark:text-paper">{title || file?.name}</p>
              <p className="text-xs text-ink/45 dark:text-paper/45">Uploaded just now</p>
            </div>
          </div>

          <p className="mb-3 mt-6 text-xs font-medium uppercase tracking-wide text-ink/45 dark:text-paper/45">Processing Progress</p>
          <ul className="space-y-3">
            {PIPELINE_STEPS.map((step, i) => {
              const state = i < stepsDone - 1 ? "done" : i === stepsDone - 1 ? "active" : "pending";
              return (
                <li key={step} className="flex items-center justify-between">
                  <span className={`text-sm ${state === "pending" ? "text-ink/40 dark:text-paper/40" : "text-ink dark:text-paper"}`}>
                    {i + 1}. {step}
                  </span>
                  {state === "done" && (
                    <span className="flex items-center gap-1.5 text-xs font-medium text-ok"><CheckCircleIcon width={15} height={15} /> Completed</span>
                  )}
                  {state === "active" && (
                    <span className="flex items-center gap-1.5 text-xs font-medium text-secondary"><ClockIcon width={15} height={15} /> In Progress</span>
                  )}
                  {state === "pending" && (
                    <span className="text-xs text-ink/35 dark:text-paper/35">Pending</span>
                  )}
                </li>
              );
            })}
          </ul>

          <div className="mt-6">
            <div className="h-2 overflow-hidden rounded-full bg-line dark:bg-line-dark">
              <div className="h-full rounded-full bg-signal transition-all" style={{ width: `${overallPct}%` }} />
            </div>
            <p className="mt-1.5 text-right text-xs font-medium text-ink/50 dark:text-paper/50">{overallPct}%</p>
          </div>
        </div>

        <div className="mt-4 rounded-lg bg-signal/5 px-4 py-3 text-center text-xs text-signal">
          You can leave this page. We'll notify you when processing is complete.
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="font-display text-xl font-semibold tracking-tight text-ink dark:text-paper">Upload Video</h1>
          <p className="mt-1 text-sm text-ink/50 dark:text-paper/50">Upload your video to get AI-generated insights</p>
        </div>
        <Link href="/dashboard" className="text-xs font-medium text-ink/50 hover:text-ink dark:text-paper/50 dark:hover:text-paper">
          Back to dashboard
        </Link>
      </div>

      {phase === "done" && result ? (
        <div className="rounded-xl border border-line bg-cloud p-6 dark:border-line-dark dark:bg-graphite">
          <p className="mb-4 text-sm font-medium text-ok">Upload complete</p>
          <dl className="space-y-2 text-sm">
            <div className="flex justify-between">
              <dt className="text-ink/50 dark:text-paper/50">Title</dt>
              <dd className="text-ink dark:text-paper">{result.title || result.filename}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-ink/50 dark:text-paper/50">Duration</dt>
              <dd className="font-mono tabular-nums text-ink dark:text-paper">{formatDuration(result.duration_seconds)}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-ink/50 dark:text-paper/50">Size</dt>
              <dd className="font-mono tabular-nums text-ink dark:text-paper">{result.file_size_mb.toFixed(1)} MB</dd>
            </div>
            <div className="flex items-center justify-between">
              <dt className="text-ink/50 dark:text-paper/50">Status</dt>
              <dd><StatusChip status={result.status} /></dd>
            </div>
          </dl>
          {result.status === "ready" && (
            <Link
              href={`/dashboard/videos/${result.id}`}
              className="mt-6 block rounded-lg bg-signal px-4 py-2.5 text-center text-sm font-medium text-white hover:bg-signal/90"
            >
              Generate transcript &amp; summary
            </Link>
          )}

          <div className="mt-3 flex gap-3">
            <button onClick={reset} className="rounded-lg border border-line px-4 py-2 text-sm text-ink dark:border-line-dark dark:text-paper">
              Upload another
            </button>
            <Link href="/dashboard" className="rounded-lg border border-line px-4 py-2 text-sm text-ink dark:border-line-dark dark:text-paper">
              Go to dashboard
            </Link>
          </div>
        </div>
      ) : (
        <div className="rounded-xl border border-line bg-cloud p-6 dark:border-line-dark dark:bg-graphite">
          <div
            onDragOver={(e) => { e.preventDefault(); setDragActive(true); }}
            onDragLeave={() => setDragActive(false)}
            onDrop={handleDrop}
            className={`rounded-xl border-2 border-dashed p-10 text-center transition ${
              dragActive ? "border-signal bg-signal/5" : "border-line dark:border-line-dark"
            }`}
          >
            <input ref={inputRef} type="file" accept={ALLOWED_EXTENSIONS.join(",")} className="hidden" onChange={(e) => validateAndSetFile(e.target.files?.[0])} />

            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-signal/10 text-signal dark:bg-signal-dark/15 dark:text-signal-dark">
              <CloudUploadIcon width={26} height={26} />
            </div>

            {file ? (
              <p className="mt-4 text-sm font-medium text-ink dark:text-paper">{file.name}</p>
            ) : (
              <>
                <p className="mt-4 text-sm font-medium text-ink dark:text-paper">Drag and drop your video here</p>
                <p className="mt-1 text-xs text-ink/40 dark:text-paper/40">or</p>
              </>
            )}

            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              className="mt-4 rounded-lg bg-signal px-5 py-2 text-sm font-medium text-white hover:bg-signal/90"
            >
              {file ? "Choose a different file" : "Browse Files"}
            </button>

            <p className="mt-4 text-xs text-ink/40 dark:text-paper/40">
              Maximum file size: {MAX_SIZE_MB / 1024}GB &middot; Supported formats: {ALLOWED_EXTENSIONS.map((e) => e.slice(1).toUpperCase()).join(", ")}
            </p>
          </div>

          {error && <p className="mt-3 text-sm text-danger">{error}</p>}

          {phase === "uploading" && (
            <div className="mt-4">
              <div className="flex justify-between text-xs text-ink/50 dark:text-paper/50">
                <span>{file?.name}</span>
                <span className="tabular-nums">{progress}%</span>
              </div>
              <div className="relative mt-1.5 h-1.5 overflow-hidden rounded-full bg-line dark:bg-line-dark">
                <div className="h-full bg-signal transition-all" style={{ width: `${progress}%` }} />
              </div>
            </div>
          )}

          {phase !== "uploading" && (
            <div className="mt-6 space-y-4">
              <div>
                <label className="text-xs font-medium text-ink/60 dark:text-paper/60">Title</label>
                <input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Enter video title"
                  className="mt-1.5 w-full rounded-lg border border-line bg-transparent px-3.5 py-2.5 text-sm text-ink placeholder:text-ink/30 focus:border-signal focus:outline-none focus:ring-2 focus:ring-signal/15 dark:border-line-dark dark:text-paper dark:placeholder:text-paper/30"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-ink/60 dark:text-paper/60">Description (Optional)</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Enter description about the video"
                  rows={3}
                  className="mt-1.5 w-full resize-none rounded-lg border border-line bg-transparent px-3.5 py-2.5 text-sm text-ink placeholder:text-ink/30 focus:border-signal focus:outline-none focus:ring-2 focus:ring-signal/15 dark:border-line-dark dark:text-paper dark:placeholder:text-paper/30"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-ink/60 dark:text-paper/60">Visibility</label>
                <div className="relative mt-1.5">
                  <select value={visibility} onChange={(e) => setVisibility(e.target.value)}
                    className="w-full appearance-none rounded-lg border border-line bg-transparent px-3.5 py-2.5 text-sm text-ink focus:border-signal focus:outline-none focus:ring-2 focus:ring-signal/15 dark:border-line-dark dark:text-paper">
                    <option className="bg-cloud text-ink dark:bg-graphite dark:text-paper">Private</option>
                    <option className="bg-cloud text-ink dark:bg-graphite dark:text-paper">Shared</option>
                    <option className="bg-cloud text-ink dark:bg-graphite dark:text-paper">Public</option>
                  </select>
                  <ChevronDownIcon width={15} height={15} className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-ink/40 dark:text-paper/40" />
                </div>
              </div>

              {file && (
                <div className="flex justify-end gap-3 pt-2">
                  <button onClick={reset} className="rounded-lg border border-line px-4 py-2 text-sm text-ink dark:border-line-dark dark:text-paper">
                    Cancel
                  </button>
                  <button
                    onClick={handleUpload}
                    disabled={!canUpload}
                    className="rounded-lg bg-signal px-5 py-2 text-sm font-medium text-white disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Upload Video
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
