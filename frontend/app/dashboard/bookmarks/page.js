"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import api from "../../../lib/api";
import { BookmarkIcon, FilmIcon, DocumentIcon, KeyMomentIcon, TrashIcon } from "../../../components/ui/icons";

function formatTimestamp(seconds) {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

function formatDate(iso) {
  return new Date(iso).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}

const TYPE_META = {
  video: { icon: FilmIcon, label: "Video" },
  summary: { icon: DocumentIcon, label: "Summary" },
  highlight: { icon: KeyMomentIcon, label: "Highlight" },
};

const FILTERS = [
  { key: "all", label: "All" },
  { key: "video", label: "Videos" },
  { key: "summary", label: "Summaries" },
  { key: "highlight", label: "Highlights" },
];

export default function BookmarksPage() {
  const [bookmarks, setBookmarks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");

  useEffect(() => {
    api.get("/api/v1/bookmarks").then((res) => setBookmarks(res.data)).finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(
    () => (filter === "all" ? bookmarks : bookmarks.filter((b) => b.type === filter)),
    [bookmarks, filter]
  );

  async function handleRemove(bookmarkId) {
    setBookmarks((prev) => prev.filter((b) => b.id !== bookmarkId));
    try {
      await api.delete(`/api/v1/bookmarks/${bookmarkId}`);
    } catch {
      api.get("/api/v1/bookmarks").then((res) => setBookmarks(res.data)).catch(() => {});
    }
  }

  return (
    <div>
      <h1 className="mb-1 font-display text-xl font-semibold tracking-tight text-ink dark:text-paper">Bookmarks</h1>
      <p className="mb-6 text-sm text-ink/50 dark:text-paper/50">Videos, summaries, and highlights you've saved for later</p>

      {!loading && bookmarks.length > 0 && (
        <div className="mb-6 flex gap-1.5">
          {FILTERS.map((f) => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              className={`rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
                filter === f.key
                  ? "bg-signal/10 text-signal dark:bg-signal-dark/15 dark:text-signal-dark"
                  : "text-ink/50 hover:bg-paper dark:text-paper/50 dark:hover:bg-graphite-2"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      )}

      {loading ? (
        <p className="font-mono text-xs text-ink/50 dark:text-paper/50">Loading...</p>
      ) : bookmarks.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-line bg-cloud p-14 text-center dark:border-line-dark dark:bg-graphite">
          <span className="flex h-12 w-12 items-center justify-center rounded-full bg-signal/10 text-signal dark:bg-signal-dark/15 dark:text-signal-dark">
            <BookmarkIcon width={22} height={22} />
          </span>
          <p className="mt-3 text-sm font-medium text-ink dark:text-paper">No bookmarks yet</p>
          <p className="mt-1 max-w-sm text-sm text-ink/45 dark:text-paper/45">
            Bookmark a video, its summary, or a highlight from the video page to find them here.
          </p>
        </div>
      ) : filtered.length === 0 ? (
        <p className="font-mono text-xs text-ink/50 dark:text-paper/50">No {filter} bookmarks.</p>
      ) : (
        <div className="space-y-3">
          {filtered.map((b) => {
            const meta = TYPE_META[b.type];
            const Icon = meta.icon;
            return (
              <div
                key={b.id}
                className="flex items-start gap-3 rounded-xl border border-line bg-cloud p-4 dark:border-line-dark dark:bg-graphite"
              >
                <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-signal/10 text-signal dark:bg-signal-dark/15 dark:text-signal-dark">
                  <Icon width={16} height={16} />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 text-xs text-ink/45 dark:text-paper/45">
                    <span className="font-medium uppercase tracking-wide">{meta.label}</span>
                    {b.type === "summary" && <span className="capitalize">· {b.variant}</span>}
                    {b.type === "highlight" && <span className="font-mono">· {formatTimestamp(b.start)}&ndash;{formatTimestamp(b.end)}</span>}
                    <span>· {formatDate(b.created_at)}</span>
                  </div>
                  <Link
                    href={`/dashboard/videos/${b.video_id}`}
                    className="mt-1 block truncate text-sm font-medium text-ink hover:text-signal dark:text-paper"
                  >
                    {b.video_title}
                  </Link>
                  {b.text && (
                    <p className="mt-1 line-clamp-2 text-sm text-ink/65 dark:text-paper/65">{b.text}</p>
                  )}
                </div>
                <button
                  onClick={() => handleRemove(b.id)}
                  title="Remove bookmark"
                  className="shrink-0 rounded-md p-1.5 text-ink/35 hover:bg-danger/10 hover:text-danger dark:text-paper/35"
                >
                  <TrashIcon width={15} height={15} />
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}