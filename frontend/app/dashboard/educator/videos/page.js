"use client";

import { useEffect, useMemo, useState } from "react";
import api from "../../../../lib/api";
import { VideoTable } from "../../../../components/video/VideoDashboard";
import { SearchIcon } from "../../../../components/ui/icons";

export default function MyVideosPage() {
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");

  useEffect(() => {
    api.get("/api/v1/videos").then((res) => setVideos(res.data)).finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return videos;
    return videos.filter((v) => (v.title || v.filename || "").toLowerCase().includes(q));
  }, [videos, query]);

  return (
    <div>
      <div className="mb-6 flex items-center justify-between gap-4">
        <h1 className="font-display text-xl font-semibold tracking-tight text-ink dark:text-paper">My Videos</h1>
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
      </div>
      {loading ? (
        <p className="font-mono text-xs text-ink/50 dark:text-paper/50">Loading...</p>
      ) : filtered.length === 0 ? (
        <p className="font-mono text-xs text-ink/50 dark:text-paper/50">
          {videos.length === 0 ? "No videos uploaded yet." : "No videos match your search."}
        </p>
      ) : (
        <VideoTable videos={filtered} onDeleted={(id) => setVideos((prev) => prev.filter((v) => v.id !== id))} />
      )}
    </div>
  );
}