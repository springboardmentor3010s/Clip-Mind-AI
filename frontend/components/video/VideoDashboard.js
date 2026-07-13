"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import api from "../../lib/api";
import StatusChip from "../ui/StatusChip";
import { useAuth } from "../../lib/AuthContext";
import { FilmIcon, ClockIcon, CheckCircleIcon, BarChartIcon, MoreIcon, UploadIcon, TrashIcon } from "../ui/icons";

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
  const { user } = useAuth();

  useEffect(() => {
    api.get("/api/v1/videos").then((res) => setVideos(res.data)).finally(() => setLoading(false));
  }, []);

  function handleDeleted(deletedId) {
    setVideos((prev) => prev.filter((v) => v.id !== deletedId));
  }

  const processing = videos.filter((v) => v.status === "processing" || v.status === "uploaded").length;
  const completed = videos.filter((v) => v.status === "ready").length;
  const totalStorage = videos.reduce((sum, v) => sum + v.file_size_mb, 0);
  const recent = videos.slice(0, 5);

  return (
    <div>
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-semibold tracking-tight text-ink dark:text-paper">Dashboard</h1>
          <p className="mt-1 text-sm text-ink/50 dark:text-paper/50">Welcome back, {user?.full_name || welcomeName}!</p>
        </div>
        <Link href="/dashboard/upload" className="flex items-center gap-2 rounded-lg bg-signal px-4 py-2.5 text-sm font-medium text-white shadow-sm hover:bg-signal/90">
          <UploadIcon width={16} height={16} />
          Upload Video
        </Link>
      </div>

      <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Total Videos" value={videos.length} delta="+12% this month" icon={FilmIcon} iconClasses="bg-signal/10 text-signal" />
        <StatCard label="Processing" value={processing} sub="In progress" icon={ClockIcon} iconClasses="bg-secondary/10 text-secondary" />
        <StatCard label="Completed" value={completed} delta="+8% this month" icon={CheckCircleIcon} iconClasses="bg-ok/10 text-ok" />
        <StatCard label="Total Views" value={`${(totalStorage * 3.2).toFixed(0)}`} delta="+15% this month" icon={BarChartIcon} iconClasses="bg-marker/10 text-marker" />
      </div>

      <div className="mb-3 flex items-center justify-between">
        <h2 className="font-display text-base font-semibold text-ink dark:text-paper">Recent Uploads</h2>
        {videosPath && videos.length > 5 && (
          <Link href={videosPath} className="text-xs font-medium text-signal">View All</Link>
        )}
      </div>

      {loading ? (
        <p className="text-sm text-ink/50 dark:text-paper/50">Loading...</p>
      ) : recent.length === 0 ? (
        <div className="rounded-xl border border-dashed border-line bg-cloud p-10 text-center dark:border-line-dark dark:bg-graphite">
          <p className="text-sm text-ink/50 dark:text-paper/50">No videos uploaded yet.</p>
          <Link href="/dashboard/upload" className="mt-3 inline-block text-sm font-medium text-signal">Upload your first video</Link>
        </div>
      ) : (
        <VideoTable videos={recent} onDeleted={handleDeleted} />
      )}
    </div>
  );
}

function StatCard({ label, value, delta, sub, icon: Icon, iconClasses }) {
  return (
    <div className="rounded-xl border border-line bg-cloud p-4 dark:border-line-dark dark:bg-graphite">
      <div className="flex items-center justify-between">
        <p className="text-xs font-medium uppercase tracking-wide text-ink/45 dark:text-paper/45">{label}</p>
        <span className={`flex h-8 w-8 items-center justify-center rounded-lg ${iconClasses}`}>
          <Icon width={16} height={16} />
        </span>
      </div>
      <p className="mt-3 font-display text-2xl font-semibold tabular-nums text-ink dark:text-paper">{value}</p>
      {delta && <p className="mt-1 text-xs font-medium text-ok">↑ {delta}</p>}
      {sub && <p className="mt-1 text-xs text-ink/45 dark:text-paper/45">{sub}</p>}
    </div>
  );
}

export function VideoTable({ videos, onDeleted }) {
  const router = useRouter();
  const [openMenuId, setOpenMenuId] = useState(null);
  const [deletingId, setDeletingId] = useState(null);
  const [deleteError, setDeleteError] = useState("");

  async function handleDelete(video) {
    setOpenMenuId(null);
    const confirmed = window.confirm(
      `Delete "${video.title || video.filename}"? This will permanently remove the video, its transcript, summary, and key moments. This can't be undone.`
    );
    if (!confirmed) return;

    setDeletingId(video.id);
    setDeleteError("");
    try {
      await api.delete(`/api/v1/videos/${video.id}`);
      onDeleted?.(video.id);
    } catch (err) {
      setDeleteError(err.response?.data?.detail || "Failed to delete video. Please try again.");
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div>
      {deleteError && <p className="mb-3 text-sm text-danger">{deleteError}</p>}
      <div className="overflow-visible rounded-xl border border-line dark:border-line-dark">
        <table className="w-full text-left text-sm">
          <thead className="bg-paper text-xs uppercase tracking-wide text-ink/45 dark:bg-ink dark:text-paper/45">
            <tr>
              <th className="px-4 py-3 font-medium">Video</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium">Duration</th>
              <th className="px-4 py-3 font-medium">Uploaded On</th>
              <th className="px-4 py-3 font-medium text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line bg-cloud dark:divide-line-dark dark:bg-graphite">
            {videos.map((v) => (
          <tr
            key={v.id}
            onDoubleClick={() => router.push(`/dashboard/videos/${v.id}`)}
            title="Double-click to open"
            className={`group cursor-pointer hover:bg-paper/60 dark:hover:bg-graphite-2 ${deletingId === v.id ? "opacity-40" : ""}`}
          >
            <td className="px-4 py-3">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-14 shrink-0 items-center justify-center rounded-md bg-ink text-white/70">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5.5v13l11-6.5-11-6.5Z" /></svg>
                </div>
                <span className="font-medium text-ink dark:text-paper">{v.title || v.filename}</span>
              </div>
            </td>
            <td className="px-4 py-3"><StatusChip status={v.status} /></td>
            <td className="px-4 py-3 font-mono tabular-nums text-ink/60 dark:text-paper/60">{formatDuration(v.duration_seconds)}</td>
            <td className="px-4 py-3 text-ink/50 dark:text-paper/50">{formatDate(v.created_at)}</td>
            <td className="relative px-4 py-3">
              <div className="flex items-center justify-end gap-1 text-ink/40 dark:text-paper/40">
                <button
                  onClick={(e) => { e.stopPropagation(); setOpenMenuId((id) => (id === v.id ? null : v.id)); }}
                  title="More"
                  disabled={deletingId === v.id}
                  className="rounded p-1.5 hover:bg-line/40 hover:text-ink disabled:cursor-not-allowed dark:hover:bg-graphite-2 dark:hover:text-paper"
                >
                  <MoreIcon width={16} height={16} />
                </button>
              </div>

              {openMenuId === v.id && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setOpenMenuId(null)} />
                  <div
                    onClick={(e) => e.stopPropagation()}
                    onDoubleClick={(e) => e.stopPropagation()}
                    className="absolute right-4 top-full z-20 mt-1 w-36 overflow-hidden rounded-lg border border-line bg-cloud shadow-lg dark:border-line-dark dark:bg-graphite-2"
                  >
                    <button
                      onClick={() => handleDelete(v)}
                      className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-danger hover:bg-danger/10"
                    >
                      <TrashIcon width={14} height={14} />
                      Delete video
                    </button>
                  </div>
                </>
              )}
            </td>
          </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}