"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import api from "../../../../lib/api";
import StatusChip from "../../../../components/ui/StatusChip";

function formatDuration(seconds) {
  if (!seconds && seconds !== 0) return "—";
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

function formatDate(iso) {
  return new Date(iso).toLocaleDateString(undefined, {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

function formatTimestamp(seconds) {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

function downloadText(filename, content) {
  const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

function PipelineStep({ label, done }) {
  return (
    <div className="flex items-center justify-between border-b border-line py-2 last:border-0 dark:border-line-dark">
      <span className="text-sm text-ink/70 dark:text-paper/70">{label}</span>
      <span
        className={`font-mono text-[11px] uppercase tracking-wide ${
          done ? "text-ok" : "text-ink/40 dark:text-paper/40"
        }`}
      >
        {done ? "Done" : "Pending"}
      </span>
    </div>
  );
}

export default function VideoDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const [video, setVideo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [transcript, setTranscript] = useState(null);
  const [transcriptLoading, setTranscriptLoading] = useState(false);
  const [transcriptError, setTranscriptError] = useState("");
  const [showSegments, setShowSegments] = useState(false);

  const [summary, setSummary] = useState(null);
  const [summaryLoading, setSummaryLoading] = useState(false);
  const [summaryError, setSummaryError] = useState("");

  useEffect(() => {
    api
      .get(`/api/v1/videos/${id}`)
      .then((res) => setVideo(res.data))
      .catch((err) => {
        setError(err.response?.status === 404 ? "Video not found." : "Failed to load video.");
      })
      .finally(() => setLoading(false));

    api.get(`/api/v1/videos/${id}/transcript`).then((res) => setTranscript(res.data)).catch(() => {});
    api.get(`/api/v1/videos/${id}/summary`).then((res) => setSummary(res.data)).catch(() => {});
  }, [id]);

  async function handleGenerateTranscript() {
    setTranscriptLoading(true);
    setTranscriptError("");
    try {
      const res = await api.post(`/api/v1/videos/${id}/transcript`);
      setTranscript(res.data);
    } catch (err) {
      setTranscriptError(err.response?.data?.detail || "Failed to generate transcript.");
    } finally {
      setTranscriptLoading(false);
    }
  }

  async function handleGenerateSummary() {
    setSummaryLoading(true);
    setSummaryError("");
    try {
      const res = await api.post(`/api/v1/videos/${id}/summary`);
      setSummary(res.data);
    } catch (err) {
      setSummaryError(err.response?.data?.detail || "Failed to generate summary.");
    } finally {
      setSummaryLoading(false);
    }
  }

  if (loading) {
    return <p className="font-mono text-xs text-ink/50 dark:text-paper/50">Loading...</p>;
  }

  if (error || !video) {
    return (
      <div>
        <p className="text-sm text-danger">{error || "Video not found."}</p>
        <button
          onClick={() => router.back()}
          className="mt-4 font-mono text-[11px] uppercase tracking-wide text-signal"
        >
          &larr; Go back
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-2xl">
      <div className="mb-8 flex items-center justify-between">
        <h1 className="font-display text-xl font-semibold tracking-tight text-ink dark:text-paper">
          Video details
        </h1>
        <button
          onClick={() => router.back()}
          className="font-mono text-[11px] uppercase tracking-wide text-ink/50 hover:text-ink dark:text-paper/50 dark:hover:text-paper"
        >
          &larr; Back
        </button>
      </div>

      <div className="mb-6 rounded-lg border border-line bg-cloud p-6 dark:border-line-dark dark:bg-graphite">
        <div className="mb-4 flex items-start justify-between gap-4">
          <p className="break-all text-sm font-medium text-ink dark:text-paper">{video.title || video.filename}</p>
          <StatusChip status={video.status} />
        </div>

        {video.description && (
          <p className="mb-4 text-sm text-ink/70 dark:text-paper/70">{video.description}</p>
        )}

        <dl className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <dt className="font-mono text-[10px] uppercase tracking-widest text-ink/50 dark:text-paper/50">
              Filename
            </dt>
            <dd className="mt-1 break-all text-ink dark:text-paper">{video.filename}</dd>
          </div>
          <div>
            <dt className="font-mono text-[10px] uppercase tracking-widest text-ink/50 dark:text-paper/50">
              Duration
            </dt>
            <dd className="mt-1 font-mono tabular-nums text-ink dark:text-paper">
              {formatDuration(video.duration_seconds)}
            </dd>
          </div>
          <div>
            <dt className="font-mono text-[10px] uppercase tracking-widest text-ink/50 dark:text-paper/50">
              File size
            </dt>
            <dd className="mt-1 font-mono tabular-nums text-ink dark:text-paper">
              {video.file_size_mb.toFixed(1)} MB
            </dd>
          </div>
          <div>
            <dt className="font-mono text-[10px] uppercase tracking-widest text-ink/50 dark:text-paper/50">
              Format
            </dt>
            <dd className="mt-1 text-ink dark:text-paper">{video.content_type}</dd>
          </div>
          <div>
            <dt className="font-mono text-[10px] uppercase tracking-widest text-ink/50 dark:text-paper/50">
              Uploaded on
            </dt>
            <dd className="mt-1 text-ink dark:text-paper">{formatDate(video.created_at)}</dd>
          </div>
        </dl>
      </div>

      <div className="mb-6 rounded-lg border border-line bg-cloud p-6 dark:border-line-dark dark:bg-graphite">
        <p className="mb-3 font-mono text-[10px] uppercase tracking-widest text-ink/50 dark:text-paper/50">
          Processing pipeline
        </p>
        <PipelineStep label="Format standardization" done={Boolean(video.processed_path)} />
        <PipelineStep label="Thumbnail extraction" done={Boolean(video.thumbnail_path)} />
        <PipelineStep label="Audio extraction (noise-reduced)" done={Boolean(video.audio_path)} />
      </div>

      {video.status === "failed" && (
        <p className="mb-6 text-sm text-danger">
          Processing failed for this video. Try re-uploading it.
        </p>
      )}

      {/* Transcript */}
      <div className="mb-6 rounded-lg border border-line bg-cloud p-6 dark:border-line-dark dark:bg-graphite">
        <div className="mb-3 flex items-center justify-between">
          <p className="font-mono text-[10px] uppercase tracking-widest text-ink/50 dark:text-paper/50">
            Transcript
          </p>
          {transcript && (
            <div className="flex items-center gap-4">
              <button
                onClick={() =>
                  downloadText(
                    `${(video.title || video.filename).replace(/\.[^/.]+$/, "")}-transcript.txt`,
                    showSegments
                      ? transcript.segments.map((seg) => `[${formatTimestamp(seg.start)}] ${seg.text}`).join("\n")
                      : transcript.text
                  )
                }
                className="font-mono text-[11px] uppercase tracking-wide text-signal"
              >
                Download
              </button>
              <button
                onClick={() => setShowSegments((s) => !s)}
                className="font-mono text-[11px] uppercase tracking-wide text-signal"
              >
                {showSegments ? "Show full text" : "Show timestamps"}
              </button>
            </div>
          )}
        </div>

        {!transcript ? (
          <div>
            <button
              onClick={handleGenerateTranscript}
              disabled={transcriptLoading || video.status !== "ready"}
              className="rounded-md bg-signal px-4 py-2 text-sm font-medium text-white disabled:cursor-not-allowed disabled:opacity-50"
            >
              {transcriptLoading ? "Transcribing..." : "Generate transcript"}
            </button>
            {transcriptLoading && (
              <p className="mt-2 font-mono text-[11px] text-ink/40 dark:text-paper/40">
                This can take a minute or two, especially the first time (model loading onto GPU).
              </p>
            )}
            {transcriptError && <p className="mt-2 text-sm text-danger">{transcriptError}</p>}
          </div>
        ) : showSegments ? (
          <div className="max-h-72 space-y-2 overflow-y-auto pr-1">
            {transcript.segments.map((seg, i) => (
              <div key={i} className="flex gap-3 text-sm">
                <span className="shrink-0 font-mono text-[11px] tabular-nums text-ink/40 dark:text-paper/40">
                  {formatTimestamp(seg.start)}
                </span>
                <span className="text-ink/80 dark:text-paper/80">{seg.text}</span>
              </div>
            ))}
          </div>
        ) : (
          <p className="max-h-72 overflow-y-auto whitespace-pre-wrap text-sm text-ink/80 dark:text-paper/80">
            {transcript.text}
          </p>
        )}
      </div>

      {/* Summary */}
      <div className="rounded-lg border border-line bg-cloud p-6 dark:border-line-dark dark:bg-graphite">
        <div className="mb-3 flex items-center justify-between">
          <p className="font-mono text-[10px] uppercase tracking-widest text-ink/50 dark:text-paper/50">
            AI Summary
          </p>
          {summary && (
            <button
              onClick={() =>
                downloadText(
                  `${(video.title || video.filename).replace(/\.[^/.]+$/, "")}-summary.txt`,
                  summary.detailed_summary
                )
              }
              className="font-mono text-[11px] uppercase tracking-wide text-signal"
            >
              Download
            </button>
          )}
        </div>

        {!summary ? (
          <div>
            <button
              onClick={handleGenerateSummary}
              disabled={summaryLoading || !transcript}
              className="rounded-md bg-signal px-4 py-2 text-sm font-medium text-white disabled:cursor-not-allowed disabled:opacity-50"
            >
              {summaryLoading ? "Summarizing..." : "Generate summary"}
            </button>
            {!transcript && (
              <p className="mt-2 font-mono text-[11px] text-ink/40 dark:text-paper/40">
                Generate the transcript first.
              </p>
            )}
            {summaryLoading && (
              <p className="mt-2 font-mono text-[11px] text-ink/40 dark:text-paper/40">
                This can take a minute, especially the first time (model loading onto GPU).
              </p>
            )}
            {summaryError && <p className="mt-2 text-sm text-danger">{summaryError}</p>}
          </div>
        ) : (
          <p className="whitespace-pre-wrap text-sm text-ink/80 dark:text-paper/80">
            {summary.detailed_summary}
          </p>
        )}
      </div>
    </div>
  );
}