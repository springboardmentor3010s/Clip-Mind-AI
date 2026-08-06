"use client";

import { useEffect, useMemo, useState } from "react";
import { VideoTable } from "../../../components/video/VideoDashboard";
import { SearchIcon, UsersIcon } from "../../../components/ui/icons";
import api from "../../../lib/api";

export default function SharedWithMePage() {
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");

  useEffect(() => {
    api.get("/api/v1/videos/shared-with-me").then((res) => setVideos(res.data)).finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return videos;
    return videos.filter((v) => (v.title || v.filename || "").toLowerCase().includes(q));
  }, [videos, query]);

  return (
    <div>
      <div className="mb-6 flex items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-xl font-semibold tracking-tight text-ink dark:text-paper">Shared with Me</h1>
          <p className="mt-1 text-sm text-ink/50 dark:text-paper/50">Videos other people have shared directly with you</p>
        </div>
        {videos.length > 0 && (
          <div className="flex w-64 items-center gap-2 rounded-full border border-line bg-cloud px-3 py-1.5 dark:border-line-dark dark:bg-graphite">
            <SearchIcon width={15} height={15} className="shrink-0 text-ink/40 dark:text-paper/40" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search videos..."
              className="w-full bg-transparent text-sm text-ink placeholder:text-ink/35 focus:outline-none dark:text-paper dark:placeholder:text-paper/35"
            />
          </div>
        )}
      </div>

      {loading ? (
        <p className="font-mono text-xs text-ink/50 dark:text-paper/50">Loading...</p>
      ) : videos.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-line bg-cloud p-14 text-center dark:border-line-dark dark:bg-graphite">
          <span className="flex h-12 w-12 items-center justify-center rounded-full bg-signal/10 text-signal dark:bg-signal-dark/15 dark:text-signal-dark">
            <UsersIcon width={22} height={22} />
          </span>
          <p className="mt-3 text-sm font-medium text-ink dark:text-paper">Nothing shared with you yet</p>
          <p className="mt-1 max-w-sm text-sm text-ink/45 dark:text-paper/45">
            When someone shares a video with your email, it'll show up here.
          </p>
        </div>
      ) : filtered.length === 0 ? (
        <p className="font-mono text-xs text-ink/50 dark:text-paper/50">No videos match your search.</p>
      ) : (
        <VideoTable videos={filtered} mode="shared" />
      )}
    </div>
  );
}