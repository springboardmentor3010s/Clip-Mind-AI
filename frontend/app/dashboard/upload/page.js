"use client";

import { useState, useRef } from "react";
import Link from "next/link";
import api from "../../../lib/api";
import StatusChip from "../../../components/ui/StatusChip";

const ALLOWED_EXTENSIONS = [".mp4", ".mov", ".avi", ".webm"];
const MAX_SIZE_MB = 2048;

function formatDuration(seconds) {
  if (!seconds && seconds !== 0) return "—";
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

function UploadCloudIcon() {
  return (
    <svg width="40" height="40" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M7 18a4.5 4.5 0 0 1-.5-8.97A5.5 5.5 0 0 1 17.3 8.03 4 4 0 0 1 17 16"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path d="M12 11v7m0-7 3 3m-3-3-3 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export default function UploadPage() {
  const [file, setFile] = useState(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
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

  return (
    <div className="max-w-2xl">
      <div className="mb-8 flex items-center justify-between">
        <h1 className="font-display text-xl font-semibold tracking-tight text-ink dark:text-paper">Upload a video</h1>
        <Link href="/dashboard" className="font-mono text-[11px] uppercase tracking-wide text-ink/50 hover:text-ink dark:text-paper/50 dark:hover:text-paper">
          Back to dashboard
        </Link>
      </div>

      {phase === "done" && result ? (
        <div className="rounded-lg border border-line bg-cloud p-6 dark:border-line-dark dark:bg-graphite">
          <p className="mb-4 font-mono text-[11px] uppercase tracking-wide text-ok">Upload complete</p>
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
          <div className="mt-6 flex gap-3">
            <button onClick={reset} className="rounded-md border border-line px-4 py-2 font-mono text-[11px] uppercase tracking-wide text-ink dark:border-line-dark dark:text-paper">
              Upload another
            </button>
            <Link href="/dashboard" className="rounded-md bg-signal px-4 py-2 font-mono text-[11px] uppercase tracking-wide text-white">
              Go to dashboard
            </Link>
          </div>
        </div>
      ) : (
        <>
          <div
            onDragOver={(e) => { e.preventDefault(); setDragActive(true); }}
            onDragLeave={() => setDragActive(false)}
            onDrop={handleDrop}
            className={`rounded-lg border-2 border-dashed p-10 text-center transition ${
              dragActive ? "border-signal bg-signal/5" : "border-line dark:border-line-dark"
            }`}
          >
            <input ref={inputRef} type="file" accept={ALLOWED_EXTENSIONS.join(",")} className="hidden" onChange={(e) => validateAndSetFile(e.target.files?.[0])} />

            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-signal/10 text-signal dark:bg-signal-dark/15 dark:text-signal-dark">
              <UploadCloudIcon />
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
              className="mt-4 rounded-md bg-signal px-5 py-2 text-sm font-medium text-white hover:bg-signal/90"
            >
              {file ? "Choose a different file" : "Browse files"}
            </button>

            <p className="mt-4 font-mono text-[11px] text-ink/40 dark:text-paper/40">
              Max size {MAX_SIZE_MB / 1024}GB &middot; Supported: {ALLOWED_EXTENSIONS.join(", ")}
            </p>
          </div>

          {error && <p className="mt-3 text-sm text-danger">{error}</p>}

          {(phase === "uploading" || phase === "processing") && (
            <div className="mt-4">
              <div className="flex justify-between font-mono text-[11px] text-ink/50 dark:text-paper/50">
                <span>{file?.name}</span>
                <span className="tabular-nums">{phase === "processing" ? "PROCESSING" : `${progress}%`}</span>
              </div>
              <div className="relative mt-1.5 h-1.5 overflow-hidden rounded-full bg-line dark:bg-line-dark">
                <div
                  className="h-full bg-signal transition-all"
                  style={{ width: phase === "processing" ? "100%" : `${progress}%` }}
                />
                {phase === "uploading" && (
                  <div
                    className="absolute top-1/2 h-3 w-1 -translate-y-1/2 rounded-full bg-signal"
                    style={{ left: `calc(${progress}% - 2px)` }}
                  />
                )}
              </div>
              {phase === "processing" && (
                <p className="mt-2 font-mono text-[11px] text-ink/40 dark:text-paper/40">
                  Standardizing format, extracting thumbnail, extracting audio...
                </p>
              )}
            </div>
          )}

          {phase !== "uploading" && phase !== "processing" && (
            <div className="mt-6 space-y-4">
              <div>
                <label className="font-mono text-[10px] uppercase tracking-widest text-ink/50 dark:text-paper/50">Title</label>
                <input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Enter video title"
                  className="mt-1 w-full rounded-md border border-line bg-transparent px-3 py-2 text-sm text-ink focus:border-signal focus:outline-none dark:border-line-dark dark:text-paper"
                />
              </div>
              <div>
                <label className="font-mono text-[10px] uppercase tracking-widest text-ink/50 dark:text-paper/50">Description (optional)</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Enter a description for this video"
                  rows={3}
                  className="mt-1 w-full resize-none rounded-md border border-line bg-transparent px-3 py-2 text-sm text-ink focus:border-signal focus:outline-none dark:border-line-dark dark:text-paper"
                />
              </div>

              {file && (
                <button
                  onClick={handleUpload}
                  disabled={!canUpload}
                  className="rounded-md bg-signal px-4 py-2 text-sm font-medium text-white disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Upload video
                </button>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}