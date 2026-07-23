"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "../../../lib/AuthContext";
import api from "../../../lib/api";
import { FilmIcon } from "../../../components/ui/icons";
import StatusChip from "../../../components/ui/StatusChip";

function formatDuration(seconds) {
  if (!seconds && seconds !== 0) return "—";
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

export default function LearnerDashboard() {
  const { user } = useAuth();
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get("/api/v1/videos/library").then((res) => setVideos(res.data)).finally(() => setLoading(false));
  }, []);

  return (
    <div>
      <h1 className="font-display text-2xl font-semibold tracking-tight text-ink dark:text-paper">Dashboard</h1>
      <p className="mt-1 mb-8 text-sm text-ink/50 dark:text-paper/50">Welcome back, {user?.full_name}!</p>

      {loading ? (
        <p className="text-sm text-ink/50 dark:text-paper/50">Loading...</p>
      ) : videos.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-line bg-cloud p-14 text-center dark:border-line-dark dark:bg-graphite">
          <span className="flex h-12 w-12 items-center justify-center rounded-full bg-signal/10 text-signal dark:bg-signal-dark/15 dark:text-signal-dark">
            <FilmIcon width={22} height={22} />
          </span>
          <p className="mt-3 text-sm font-medium text-ink dark:text-paper">Nothing published yet</p>
          <p className="mt-1 max-w-sm text-sm text-ink/45 dark:text-paper/45">
            Videos, transcripts, and summaries will show up here once a creator publishes something to the content library.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {videos.map((v) => (
            <Link
              key={v.id}
              href={`/dashboard/videos/${v.id}`}
              className="rounded-xl border border-line bg-cloud p-5 transition-colors hover:border-signal dark:border-line-dark dark:bg-graphite"
            >
              <div className="mb-3 flex items-center justify-between">
                <span className="flex h-9 w-9 items-center justify-center rounded-full bg-signal/10 text-signal dark:bg-signal-dark/15 dark:text-signal-dark">
                  <FilmIcon width={16} height={16} />
                </span>
                <StatusChip status={v.status} />
              </div>
              <p className="truncate text-sm font-medium text-ink dark:text-paper">{v.title || v.filename}</p>
              <p className="mt-1 text-xs text-ink/45 dark:text-paper/45">
                {v.owner_name} · {formatDuration(v.duration_seconds)}
              </p>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}