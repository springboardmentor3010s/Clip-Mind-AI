"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import api from "../../lib/api";
import StatusChip from "../ui/StatusChip";

function formatDuration(seconds) {
  if (!seconds) return "00:00";
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

function formatDate(iso) {
  return new Date(iso).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}

export default function VideoDashboard({ welcomeName, videosPath }) {
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get("/api/v1/videos").then((res) => setVideos(res.data)).finally(() => setLoading(false));
  }, []);

  const processing = videos.filter((v) => v.status === "processing" || v.status === "uploaded").length;
  const completed = videos.filter((v) => v.status === "ready").length;
  const totalStorage = videos.reduce((sum, v) => sum + v.file_size_mb, 0);
  const recent = videos.slice(0, 5);

  return (
    <div>
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="font-display text-4xl font-semibold tracking-tight text-ink dark:text-paper">Dashboard</h1>
          <p className="mt-1.5 text-lg text-ink/50 dark:text-paper/50">Welcome back, {welcomeName}!</p>
        </div>
        <Link href="/dashboard/upload" className="rounded-md bg-signal px-4 py-2 text-sm font-medium text-white hover:bg-signal/90">
          + Upload Video
        </Link>
      </div>

      <div className="mb-10 grid grid-cols-4 gap-4">
        <StatCard label="Total videos" value={videos.length} />
        <StatCard label="Processing" value={processing} accent="text-marker" />
        <StatCard label="Completed" value={completed} accent="text-ok" />
        <StatCard label="Storage used" value={`${totalStorage.toFixed(1)} MB`} />
      </div>

      <div className="mb-3 flex items-center justify-between">
        <h2 className="font-display text-base font-semibold text-ink dark:text-paper">Recent uploads</h2>
        {videosPath && videos.length > 5 && (
          <Link href={videosPath} className="font-mono text-[11px] uppercase tracking-wide text-signal">View all</Link>
        )}
      </div>

      {loading ? (
        <p className="font-mono text-xs text-ink/50 dark:text-paper/50">Loading...</p>
      ) : recent.length === 0 ? (
        <p className="font-mono text-xs text-ink/50 dark:text-paper/50">No videos uploaded yet.</p>
      ) : (
        <VideoTable videos={recent} />
      )}
    </div>
  );
}

function StatCard({ label, value, accent = "" }) {
  return (
    <div className="rounded-lg border border-line bg-cloud p-4 dark:border-line-dark dark:bg-graphite">
      <p className="font-mono text-xs uppercase tracking-widest text-ink/50 dark:text-paper/50">{label}</p>
      <p className={`mt-2 font-mono text-2xl tabular-nums ${accent || "text-ink dark:text-paper"}`}>{value}</p>
    </div>
  );
}

export function VideoTable({ videos }) {
  const router = useRouter();

  return (
    <div className="overflow-hidden rounded-lg border border-line dark:border-line-dark">
      <table className="w-full text-left text-sm">
        <thead className="bg-paper font-mono text-xs uppercase tracking-widest text-ink/50 dark:bg-ink dark:text-paper/50">
          <tr>
            <th className="px-4 py-2 font-medium">Video</th>
            <th className="px-4 py-2 font-medium">Status</th>
            <th className="px-4 py-2 font-medium">Duration</th>
            <th className="px-4 py-2 font-medium">Uploaded on</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-line bg-cloud dark:divide-line-dark dark:bg-graphite">
          {videos.map((v) => (
            <tr
              key={v.id}
              onClick={() => router.push(`/dashboard/videos/${v.id}`)}
              className="cursor-pointer hover:bg-line/20 dark:hover:bg-graphite-2"
            >
              <td className="flex items-center gap-3 px-4 py-3 text-ink dark:text-paper">
                <div className="flex h-9 w-14 items-center justify-center rounded border border-dashed border-line font-mono text-[9px] text-ink/30 dark:border-line-dark dark:text-paper/30">
                  {v.content_type?.split("/")[1]?.toUpperCase() || "VID"}
                </div>
                {v.title || v.filename}
              </td>
              <td className="px-4 py-3"><StatusChip status={v.status} /></td>
              <td className="px-4 py-3 font-mono tabular-nums text-ink/70 dark:text-paper/70">{formatDuration(v.duration_seconds)}</td>
              <td className="px-4 py-3 text-ink/50 dark:text-paper/50">{formatDate(v.created_at)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}