"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import api from "../../../../lib/api";
import StatusChip from "../../../../components/ui/StatusChip";
import BookmarkButton from "../../../../components/ui/BookmarkButton";
import { PlayIcon, DownloadIcon, KeyMomentIcon, BarChartIcon } from "../../../../components/ui/icons";

function formatDuration(seconds) {
  if (!seconds && seconds !== 0) return "—";
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

function formatDate(iso) {
  return new Date(iso).toLocaleString(undefined, { month: "short", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit" });
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

const TABS = ["Overview", "Transcript", "Summary", "Key Moments", "Analytics"];

export default function VideoDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const [video, setVideo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [tab, setTab] = useState("Overview");

  const [transcript, setTranscript] = useState(null);
  const [transcriptLoading, setTranscriptLoading] = useState(false);
  const [transcriptError, setTranscriptError] = useState("");
  const [showSegments, setShowSegments] = useState(false);

  const [editing, setEditing] = useState(false);
  const [editedText, setEditedText] = useState("");
  const [savingEdit, setSavingEdit] = useState(false);

  const [summary, setSummary] = useState(null);
  const [summaryLoading, setSummaryLoading] = useState(false);
  const [summaryError, setSummaryError] = useState("");

  const [keyMoments, setKeyMoments] = useState(null);
  const [keyMomentsLoading, setKeyMomentsLoading] = useState(false);
  const [keyMomentsError, setKeyMomentsError] = useState("");

  const [bookmarks, setBookmarks] = useState([]);

  useEffect(() => {
    api.get(`/api/v1/videos/${id}`).then((res) => setVideo(res.data)).catch((err) => {
      setError(err.response?.status === 404 ? "Video not found." : "Failed to load video.");
    }).finally(() => setLoading(false));

    api.get(`/api/v1/videos/${id}/transcript`).then((res) => setTranscript(res.data)).catch(() => {});
    api.get(`/api/v1/videos/${id}/summary`).then((res) => setSummary(res.data)).catch(() => {});
    api.get(`/api/v1/videos/${id}/key-moments`).then((res) => setKeyMoments(res.data)).catch(() => {});
    api.get(`/api/v1/bookmarks`, { params: { video_id: id } }).then((res) => setBookmarks(res.data)).catch(() => {});
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

  function startEditing() {
    setEditedText(transcript.text);
    setEditing(true);
  }

  function cancelEditing() {
    setEditing(false);
    setEditedText("");
  }

  async function saveEditedTranscript() {
    setSavingEdit(true);
    setTranscriptError("");
    try {
      const res = await api.patch(`/api/v1/videos/${id}/transcript`, { text: editedText });
      setTranscript(res.data);
      setEditing(false);
    } catch (err) {
      setTranscriptError(err.response?.data?.detail || "Failed to save transcript.");
    } finally {
      setSavingEdit(false);
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


  async function handleGenerateKeyMoments() {
    setKeyMomentsLoading(true);
    setKeyMomentsError("");
    try {
      const res = await api.post(`/api/v1/videos/${id}/key-moments`);
      setKeyMoments(res.data);
    } catch (err) {
      setKeyMomentsError(err.response?.data?.detail || "Failed to detect key moments.");
    } finally {
      setKeyMomentsLoading(false);
    }
  }

  if (loading) return <p className="text-sm text-ink/50 dark:text-paper/50">Loading...</p>;

  if (error || !video) {
    return (
      <div>
        <p className="text-sm text-danger">{error || "Video not found."}</p>
        <button onClick={() => router.back()} className="mt-4 text-sm font-medium text-signal">&larr; Go back</button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl">
      <div className="mb-4 flex items-center justify-between">
        <button onClick={() => router.back()} className="flex items-center gap-1.5 text-sm font-medium text-ink/50 hover:text-ink dark:text-paper/50 dark:hover:text-paper">
          &larr; {video.title || video.filename}
        </button>
        <BookmarkButton videoId={id} target={{ type: "video" }} bookmarks={bookmarks} onChange={setBookmarks} />
      </div>

      <div className="mb-5 flex gap-1 border-b border-line dark:border-line-dark">
        {TABS.map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`-mb-px border-b-2 px-3 py-2.5 text-sm font-medium transition-colors ${
              tab === t
                ? "border-signal text-signal"
                : "border-transparent text-ink/50 hover:text-ink dark:text-paper/50 dark:hover:text-paper"
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {tab === "Overview" && (
        <div className="grid grid-cols-1 gap-5 md:grid-cols-[1.4fr_1fr]">
          <div className="flex aspect-video flex-col items-center justify-center rounded-xl bg-ink text-white/70">
            <span className="flex h-14 w-14 items-center justify-center rounded-full bg-white/10">
              <PlayIcon width={22} height={22} className="text-white translate-x-0.5" />
            </span>
            <p className="mt-3 font-mono text-xs tabular-nums text-white/40">00:00 / {formatDuration(video.duration_seconds)}</p>
          </div>

          <div className="rounded-xl border border-line bg-cloud p-5 dark:border-line-dark dark:bg-graphite">
            <p className="mb-4 text-xs font-medium uppercase tracking-wide text-ink/45 dark:text-paper/45">Video Details</p>
            <dl className="space-y-3 text-sm">
              <Row label="Duration" value={formatDuration(video.duration_seconds)} mono />
              <Row label="Uploaded On" value={formatDate(video.created_at)} />
              <Row label="Status" value={<StatusChip status={video.status} />} />
              <Row label="File Size" value={`${video.file_size_mb.toFixed(1)} MB`} mono />
              <Row label="Format" value={video.content_type} />
            </dl>
          </div>

          {video.status === "failed" && (
            <p className="md:col-span-2 text-sm text-danger">Processing failed for this video. Try re-uploading it.</p>
          )}

          <div className="rounded-xl border border-line bg-cloud p-5 dark:border-line-dark dark:bg-graphite">
            <p className="mb-3 text-xs font-medium uppercase tracking-wide text-ink/45 dark:text-paper/45">AI Summary</p>
            {summary ? (
              <p className="line-clamp-4 text-sm leading-relaxed text-ink/75 dark:text-paper/75">{summary.short_summary || summary.detailed_summary}</p>
            ) : (
              <p className="text-sm text-ink/40 dark:text-paper/40">Not generated yet — see the Summary tab.</p>
            )}
            <button onClick={() => setTab("Summary")} className="mt-3 text-xs font-medium text-signal">Read More</button>
          </div>

          <div className="rounded-xl border border-line bg-cloud p-5 dark:border-line-dark dark:bg-graphite">
            <p className="mb-3 text-xs font-medium uppercase tracking-wide text-ink/45 dark:text-paper/45">Key Moments</p>
            {keyMoments && keyMoments.highlights.length > 0 ? (
              <div className="space-y-2">
                {keyMoments.highlights.slice(0, 2).map((h, i) => (
                  <div key={i} className="flex gap-2 text-sm">
                    <span className="shrink-0 font-mono text-xs tabular-nums text-signal">{formatTimestamp(h.start)}</span>
                    <span className="line-clamp-1 text-ink/75 dark:text-paper/75">{h.text}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-ink/40 dark:text-paper/40">Key moments detection isn't available for this video yet.</p>
            )}
            <button onClick={() => setTab("Key Moments")} className="mt-3 text-xs font-medium text-signal">View All</button>
          </div>
        </div>
      )}

      {tab === "Transcript" && (
        <div className="rounded-xl border border-line bg-cloud p-6 dark:border-line-dark dark:bg-graphite">
          <div className="mb-4 flex items-center justify-between">
            <p className="text-xs font-medium uppercase tracking-wide text-ink/45 dark:text-paper/45">Transcript</p>
            {transcript && !editing && (
              <div className="flex items-center gap-4">
                <button
                  onClick={() => downloadText(
                    `${(video.title || video.filename).replace(/\.[^/.]+$/, "")}-transcript.txt`,
                    showSegments ? transcript.segments.map((seg) => `[${formatTimestamp(seg.start)}] ${seg.text}`).join("\n") : transcript.text
                  )}
                  className="flex items-center gap-1.5 text-xs font-medium text-signal"
                >
                  <DownloadIcon width={14} height={14} /> Download
                </button>
                {!showSegments && (
                  <button onClick={startEditing} className="text-xs font-medium text-signal">Edit</button>
                )}
                <button onClick={() => setShowSegments((s) => !s)} className="text-xs font-medium text-signal">
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
                className="rounded-lg bg-signal px-4 py-2.5 text-sm font-medium text-white disabled:cursor-not-allowed disabled:opacity-50"
              >
                {transcriptLoading ? "Transcribing..." : "Generate transcript"}
              </button>
              {transcriptLoading && <p className="mt-2 text-xs text-ink/40 dark:text-paper/40">This can take a minute or two, especially the first time (model loading onto GPU).</p>}
              {transcriptError && <p className="mt-2 text-sm text-danger">{transcriptError}</p>}
            </div>
          ) : editing ? (
            <div>
              <textarea
                value={editedText}
                onChange={(e) => setEditedText(e.target.value)}
                rows={10}
                className="w-full resize-y rounded-lg border border-line bg-transparent px-3.5 py-2.5 text-sm text-ink focus:border-signal focus:outline-none dark:border-line-dark dark:text-paper"
              />
              <div className="mt-3 flex items-center gap-3">
                <button onClick={saveEditedTranscript} disabled={savingEdit || !editedText.trim()} className="rounded-lg bg-signal px-4 py-2 text-sm font-medium text-white disabled:cursor-not-allowed disabled:opacity-50">
                  {savingEdit ? "Saving..." : "Save changes"}
                </button>
                <button onClick={cancelEditing} disabled={savingEdit} className="text-sm text-ink/50 hover:text-ink dark:text-paper/50 dark:hover:text-paper">Cancel</button>
              </div>
              {transcriptError && <p className="mt-2 text-sm text-danger">{transcriptError}</p>}
            </div>
          ) : showSegments ? (
            <div className="max-h-96 space-y-2 overflow-y-auto pr-1">
              {transcript.segments.map((seg, i) => (
                <div key={i} className="flex gap-3 text-sm">
                  <span className="shrink-0 font-mono text-xs tabular-nums text-ink/40 dark:text-paper/40">{formatTimestamp(seg.start)}</span>
                  <span className="text-ink/80 dark:text-paper/80">{seg.text}</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="max-h-96 overflow-y-auto whitespace-pre-wrap text-sm leading-relaxed text-ink/80 dark:text-paper/80">{transcript.text}</p>
          )}
        </div>
      )}

      {tab === "Summary" && (
        <div className="rounded-xl border border-line bg-cloud p-6 dark:border-line-dark dark:bg-graphite">
          <div className="mb-4 flex items-center justify-between">
            <p className="text-xs font-medium uppercase tracking-wide text-ink/45 dark:text-paper/45">AI Summary</p>
            {summary && (
              <div className="flex items-center gap-4">
                <BookmarkButton
                  videoId={id}
                  target={{ type: "summary", variant: "detailed" }}
                  bookmarks={bookmarks}
                  onChange={setBookmarks}
                />
                <button
                  onClick={() => downloadText(`${(video.title || video.filename).replace(/\.[^/.]+$/, "")}-summary.txt`, summary.detailed_summary)}
                  className="flex items-center gap-1.5 text-xs font-medium text-signal"
                >
                  <DownloadIcon width={14} height={14} /> Download
                </button>
              </div>
            )}
          </div>

          {!summary ? (
            <div>
              <button
                onClick={handleGenerateSummary}
                disabled={summaryLoading || !transcript}
                className="rounded-lg bg-signal px-4 py-2.5 text-sm font-medium text-white disabled:cursor-not-allowed disabled:opacity-50"
              >
                {summaryLoading ? "Summarizing..." : "Generate summary"}
              </button>
              {!transcript && <p className="mt-2 text-xs text-ink/40 dark:text-paper/40">Generate the transcript first.</p>}
              {summaryLoading && <p className="mt-2 text-xs text-ink/40 dark:text-paper/40">This can take a minute, especially the first time (model loading onto GPU).</p>}
              {summaryError && <p className="mt-2 text-sm text-danger">{summaryError}</p>}
            </div>
          ) : (
            <p className="whitespace-pre-wrap text-sm leading-relaxed text-ink/80 dark:text-paper/80">{summary.detailed_summary}</p>
          )}
        </div>
      )}

      {tab === "Key Moments" && (
        <div className="space-y-5">
          {!keyMoments ? (
            <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-line bg-cloud p-12 text-center dark:border-line-dark dark:bg-graphite">
              <span className="flex h-12 w-12 items-center justify-center rounded-full bg-signal/10 text-signal dark:bg-signal-dark/15 dark:text-signal-dark">
                <KeyMomentIcon width={22} height={22} />
              </span>
              <p className="mt-3 text-sm font-medium text-ink dark:text-paper">No key moments yet</p>
              <p className="mt-1 max-w-sm text-sm text-ink/45 dark:text-paper/45">
                Detect keywords, highlight segments, and topic boundaries from this video's transcript.
              </p>
              <button
                onClick={handleGenerateKeyMoments}
                disabled={keyMomentsLoading || !transcript}
                className="mt-4 rounded-lg bg-signal px-4 py-2.5 text-sm font-medium text-white disabled:cursor-not-allowed disabled:opacity-50"
              >
                {keyMomentsLoading ? "Analyzing..." : "Detect key moments"}
              </button>
              {!transcript && <p className="mt-2 text-xs text-ink/40 dark:text-paper/40">Generate the transcript first.</p>}
              {keyMomentsError && <p className="mt-2 text-sm text-danger">{keyMomentsError}</p>}
            </div>
          ) : (
            <>
              <div className="rounded-xl border border-line bg-cloud p-6 dark:border-line-dark dark:bg-graphite">
                <p className="mb-3 text-xs font-medium uppercase tracking-wide text-ink/45 dark:text-paper/45">Keywords</p>
                {keyMoments.keywords.length === 0 ? (
                  <p className="text-sm text-ink/40 dark:text-paper/40">No keywords detected.</p>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {keyMoments.keywords.map((kw) => (
                      <span key={kw} className="rounded-full bg-signal/10 px-3 py-1 text-xs font-medium text-signal dark:bg-signal-dark/15 dark:text-signal-dark">
                        {kw}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              <div className="rounded-xl border border-line bg-cloud p-6 dark:border-line-dark dark:bg-graphite">
                <p className="mb-4 text-xs font-medium uppercase tracking-wide text-ink/45 dark:text-paper/45">Highlights</p>
                {keyMoments.highlights.length === 0 ? (
                  <p className="text-sm text-ink/40 dark:text-paper/40">No standout segments detected.</p>
                ) : (
                  <div className="space-y-4">
                    {keyMoments.highlights.map((h, i) => (
                      <div key={i} className="border-b border-line pb-4 last:border-0 last:pb-0 dark:border-line-dark">
                        <div className="mb-1.5 flex items-center justify-between gap-3">
                          <div className="flex items-center gap-3">
                            <span className="font-mono text-xs font-medium tabular-nums text-signal">
                              {formatTimestamp(h.start)}&ndash;{formatTimestamp(h.end)}
                            </span>
                            <div className="h-1 flex-1 max-w-24 overflow-hidden rounded-full bg-line dark:bg-line-dark">
                              <div className="h-full rounded-full bg-signal" style={{ width: `${Math.round(h.importance_score * 100)}%` }} />
                            </div>
                          </div>
                          <BookmarkButton
                            videoId={id}
                            target={{ type: "highlight", start: h.start }}
                            bookmarks={bookmarks}
                            onChange={setBookmarks}
                            label=""
                          />
                        </div>
                        <p className="text-sm leading-relaxed text-ink/80 dark:text-paper/80">{h.text}</p>
                        {h.keywords.length > 0 && (
                          <div className="mt-2 flex flex-wrap gap-1.5">
                            {h.keywords.map((kw) => (
                              <span key={kw} className="rounded-full bg-paper px-2 py-0.5 text-[11px] text-ink/50 dark:bg-graphite-2 dark:text-paper/50">
                                {kw}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="rounded-xl border border-line bg-cloud p-6 dark:border-line-dark dark:bg-graphite">
                <p className="mb-4 text-xs font-medium uppercase tracking-wide text-ink/45 dark:text-paper/45">Topics</p>
                {keyMoments.topics.length === 0 ? (
                  <p className="text-sm text-ink/40 dark:text-paper/40">No topic segments detected.</p>
                ) : (
                  <div className="space-y-3">
                    {keyMoments.topics.map((t, i) => (
                      <div key={i} className="flex items-start gap-3 rounded-lg bg-paper px-3.5 py-3 dark:bg-graphite-2">
                        <span className="shrink-0 font-mono text-xs tabular-nums text-ink/40 dark:text-paper/40">
                          {formatTimestamp(t.start)}&ndash;{formatTimestamp(t.end)}
                        </span>
                        <div className="min-w-0">
                          <p className="text-sm font-medium capitalize text-ink dark:text-paper">{t.label}</p>
                          <p className="mt-0.5 text-xs text-ink/45 dark:text-paper/45">
                            {t.segment_count} segment{t.segment_count === 1 ? "" : "s"}
                            {t.keywords.length > 0 && ` · ${t.keywords.join(", ")}`}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      )}

      {tab === "Analytics" && (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-line bg-cloud p-12 text-center dark:border-line-dark dark:bg-graphite">
          <span className="flex h-12 w-12 items-center justify-center rounded-full bg-marker/10 text-marker">
            <BarChartIcon width={22} height={22} />
          </span>
          <p className="mt-3 text-sm font-medium text-ink dark:text-paper">Per-video analytics coming soon</p>
          <p className="mt-1 max-w-sm text-sm text-ink/45 dark:text-paper/45">
            View counts, watch time, and audience data will appear here once tracking is implemented.
          </p>
        </div>
      )}
    </div>
  );
}

function Row({ label, value, mono }) {
  return (
    <div className="flex items-center justify-between">
      <dt className="text-ink/50 dark:text-paper/50">{label}</dt>
      <dd className={`text-ink dark:text-paper ${mono ? "font-mono tabular-nums" : ""}`}>{value}</dd>
    </div>
  );
}