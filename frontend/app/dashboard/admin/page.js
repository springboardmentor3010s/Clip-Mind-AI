"use client";

import { useEffect, useState } from "react";
import api from "../../../lib/api";
import { useAuth } from "../../../lib/AuthContext";
import StatusChip from "../../../components/ui/StatusChip";
import { TrashIcon } from "../../../components/ui/icons";

const ROLE_LABELS = {
  content_creator: "Content Creator",
  learner: "Learner",
  educator: "Educator",
  administrator: "Administrator",
};

const STATUS_LABELS = {
  uploaded: "Uploaded",
  processing: "Processing",
  ready: "Ready",
  failed: "Failed",
};

const TABS = ["Users", "Content", "Audit Log", "Platform Stats"];

function StatCard({ label, value }) {
  return (
    <div className="rounded-lg border border-line bg-cloud p-4 dark:border-line-dark dark:bg-graphite">
      <p className="font-mono text-[10px] uppercase tracking-widest text-ink/50 dark:text-paper/50">{label}</p>
      <p className="mt-2 font-mono text-2xl tabular-nums text-ink dark:text-paper">{value}</p>
    </div>
  );
}

function BreakdownRow({ label, value, total }) {
  const pct = total > 0 ? Math.round((value / total) * 100) : 0;
  return (
    <div className="flex items-center gap-3 text-sm">
      <span className="w-32 shrink-0 text-ink/60 dark:text-paper/60">{label}</span>
      <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-line dark:bg-line-dark">
        <div className="h-full rounded-full bg-signal" style={{ width: `${pct}%` }} />
      </div>
      <span className="w-10 shrink-0 text-right font-mono tabular-nums text-ink dark:text-paper">{value}</span>
    </div>
  );
}

function UsersTab() {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [updatingId, setUpdatingId] = useState(null);

  useEffect(() => {
    api.get("/api/v1/users").then((res) => setUsers(res.data)).catch(() => setError("Failed to load users.")).finally(() => setLoading(false));
  }, []);

  const active = users.filter((u) => u.is_active).length;
  const inactive = users.length - active;

  async function toggleActive(user) {
    setUpdatingId(user.id);
    setError("");
    try {
      const endpoint = user.is_active ? "deactivate" : "activate";
      const res = await api.patch(`/api/v1/users/${user.id}/${endpoint}`);
      setUsers((prev) => prev.map((u) => (u.id === user.id ? res.data : u)));
    } catch (err) {
      setError(err.response?.data?.detail || "Failed to update user.");
    } finally {
      setUpdatingId(null);
    }
  }

  async function promoteToAdmin(user) {
    if (user.role === "administrator") return;
    setUpdatingId(user.id);
    setError("");
    try {
      const res = await api.patch(`/api/v1/users/${user.id}/role`, { role: "administrator" });
      setUsers((prev) => prev.map((u) => (u.id === user.id ? res.data : u)));
    } catch (err) {
      setError(err.response?.data?.detail || "Failed to update role.");
    } finally {
      setUpdatingId(null);
    }
  }

  return (
    <div>
      {!loading && !error && (
        <div className="mb-6 grid grid-cols-3 gap-4">
          <StatCard label="Total users" value={users.length} />
          <StatCard label="Active" value={active} />
          <StatCard label="Inactive" value={inactive} />
        </div>
      )}

      {loading ? (
        <p className="font-mono text-xs text-ink/50 dark:text-paper/50">Loading...</p>
      ) : error ? (
        <p className="text-sm text-danger">{error}</p>
      ) : (
        <div className="overflow-visible rounded-lg border border-line dark:border-line-dark">
          <table className="w-full text-left text-sm">
            <thead className="bg-paper font-mono text-[10px] uppercase tracking-widest text-ink/50 dark:bg-ink dark:text-paper/50">
              <tr>
                <th className="px-4 py-2 font-medium">Name</th>
                <th className="px-4 py-2 font-medium">Email</th>
                <th className="px-4 py-2 font-medium">Role</th>
                <th className="px-4 py-2 font-medium">Status</th>
                <th className="px-4 py-2 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line bg-cloud dark:divide-line-dark dark:bg-graphite">
              {users.map((u) => {
                const isSelf = u.id === currentUser?.id;
                return (
                  <tr key={u.id}>
                    <td className="px-4 py-3 text-ink dark:text-paper">
                      {u.full_name}
                      {isSelf && <span className="ml-1.5 text-xs text-ink/35 dark:text-paper/35">(you)</span>}
                    </td>
                    <td className="px-4 py-3 text-ink/60 dark:text-paper/60">{u.email}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <span className="text-ink dark:text-paper">{ROLE_LABELS[u.role] || u.role}</span>
                        {u.role !== "administrator" && (
                          <button
                            type="button"
                            onClick={() => promoteToAdmin(u)}
                            disabled={isSelf || updatingId === u.id}
                            className="rounded-md border border-line px-2 py-1 font-mono text-[10px] uppercase tracking-widest text-ink/60 transition-colors hover:border-signal hover:text-signal disabled:cursor-not-allowed disabled:opacity-40 dark:border-line-dark dark:text-paper/60"
                          >
                            Promote to Admin
                          </button>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center gap-1.5 font-mono text-[11px] uppercase tracking-wide ${u.is_active ? "text-ok" : "text-danger"}`}>
                        <span className={`h-1.5 w-1.5 rounded-full ${u.is_active ? "bg-ok" : "bg-danger"}`} />
                        {u.is_active ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => toggleActive(u)}
                        disabled={isSelf || updatingId === u.id}
                        className={`rounded-md border px-3 py-1 font-mono text-[11px] uppercase tracking-wide disabled:cursor-not-allowed disabled:opacity-50 ${
                          u.is_active
                            ? "border-danger text-danger hover:bg-danger/10"
                            : "border-ok text-ok hover:bg-ok/10"
                        }`}
                      >
                        {updatingId === u.id ? "..." : u.is_active ? "Deactivate" : "Activate"}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function ContentTab() {
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [deletingId, setDeletingId] = useState(null);

  useEffect(() => {
    api.get("/api/v1/admin/videos").then((res) => setVideos(res.data)).catch(() => setError("Failed to load videos.")).finally(() => setLoading(false));
  }, []);

  async function handleDelete(video) {
    const confirmed = window.confirm(
      `Delete "${video.title || video.filename}" by ${video.owner_name}? This permanently removes the video, its transcript, summary, and key moments. This can't be undone.`
    );
    if (!confirmed) return;

    setDeletingId(video.id);
    setError("");
    try {
      await api.delete(`/api/v1/admin/videos/${video.id}`);
      setVideos((prev) => prev.filter((v) => v.id !== video.id));
    } catch (err) {
      setError(err.response?.data?.detail || "Failed to delete video.");
    } finally {
      setDeletingId(null);
    }
  }

  if (loading) return <p className="font-mono text-xs text-ink/50 dark:text-paper/50">Loading...</p>;
  if (error) return <p className="text-sm text-danger">{error}</p>;

  return (
    <div>
      <p className="mb-4 text-sm text-ink/50 dark:text-paper/50">{videos.length} video{videos.length === 1 ? "" : "s"} across all users</p>

      {videos.length === 0 ? (
        <p className="font-mono text-xs text-ink/50 dark:text-paper/50">No videos on the platform yet.</p>
      ) : (
        <div className="overflow-visible rounded-lg border border-line dark:border-line-dark">
          <table className="w-full text-left text-sm">
            <thead className="bg-paper font-mono text-[10px] uppercase tracking-widest text-ink/50 dark:bg-ink dark:text-paper/50">
              <tr>
                <th className="px-4 py-2 font-medium">Video</th>
                <th className="px-4 py-2 font-medium">Owner</th>
                <th className="px-4 py-2 font-medium">Status</th>
                <th className="px-4 py-2 font-medium">Visibility</th>
                <th className="px-4 py-2 font-medium">Size</th>
                <th className="px-4 py-2 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line bg-cloud dark:divide-line-dark dark:bg-graphite">
              {videos.map((v) => (
                <tr key={v.id} className={deletingId === v.id ? "opacity-40" : ""}>
                  <td className="px-4 py-3 font-medium text-ink dark:text-paper">{v.title || v.filename}</td>
                  <td className="px-4 py-3 text-ink/60 dark:text-paper/60">{v.owner_name || "—"}</td>
                  <td className="px-4 py-3"><StatusChip status={v.status} /></td>
                  <td className="px-4 py-3 text-ink/60 dark:text-paper/60">{v.is_published ? "Public" : "Private/Shared"}</td>
                  <td className="px-4 py-3 font-mono tabular-nums text-ink/60 dark:text-paper/60">{v.file_size_mb.toFixed(1)} MB</td>
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={() => handleDelete(v)}
                      disabled={deletingId === v.id}
                      title="Delete video"
                      className="inline-flex rounded-md p-1.5 text-ink/40 hover:bg-danger/10 hover:text-danger disabled:cursor-not-allowed disabled:opacity-50 dark:text-paper/40"
                    >
                      <TrashIcon width={15} height={15} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

const ACTION_LABELS = {
  "user.registered": "Registered",
  "user.login": "Logged in",
  "user.role_changed": "Changed role",
  "user.activated": "Activated user",
  "user.deactivated": "Deactivated user",
  "video.published": "Published video",
  "video.unpublished": "Unpublished video",
  "video.shared": "Shared video",
  "video.deleted": "Deleted video",
  "video.deleted_by_admin": "Deleted video (moderation)",
};

function formatLogDate(iso) {
  return new Date(iso).toLocaleString(undefined, { month: "short", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit" });
}

function AuditLogTab() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    api.get("/api/v1/admin/audit-logs").then((res) => setLogs(res.data)).catch(() => setError("Failed to load audit log.")).finally(() => setLoading(false));
  }, []);

  if (loading) return <p className="font-mono text-xs text-ink/50 dark:text-paper/50">Loading...</p>;
  if (error) return <p className="text-sm text-danger">{error}</p>;

  return (
    <div>
      <p className="mb-4 text-sm text-ink/50 dark:text-paper/50">Most recent {logs.length} action{logs.length === 1 ? "" : "s"} on the platform</p>

      {logs.length === 0 ? (
        <p className="font-mono text-xs text-ink/50 dark:text-paper/50">No activity recorded yet.</p>
      ) : (
        <div className="overflow-visible rounded-lg border border-line dark:border-line-dark">
          <table className="w-full text-left text-sm">
            <thead className="bg-paper font-mono text-[10px] uppercase tracking-widest text-ink/50 dark:bg-ink dark:text-paper/50">
              <tr>
                <th className="px-4 py-2 font-medium">When</th>
                <th className="px-4 py-2 font-medium">Actor</th>
                <th className="px-4 py-2 font-medium">Action</th>
                <th className="px-4 py-2 font-medium">Detail</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line bg-cloud dark:divide-line-dark dark:bg-graphite">
              {logs.map((log) => (
                <tr key={log.id}>
                  <td className="whitespace-nowrap px-4 py-3 font-mono text-xs tabular-nums text-ink/50 dark:text-paper/50">{formatLogDate(log.created_at)}</td>
                  <td className="px-4 py-3 text-ink dark:text-paper">{log.actor_name}</td>
                  <td className="px-4 py-3 text-ink/70 dark:text-paper/70">{ACTION_LABELS[log.action] || log.action}</td>
                  <td className="px-4 py-3 text-ink/50 dark:text-paper/50">{log.detail || "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function PlatformStatsTab() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    api.get("/api/v1/admin/stats").then((res) => setStats(res.data)).catch(() => setError("Failed to load platform stats.")).finally(() => setLoading(false));
  }, []);

  if (loading) return <p className="font-mono text-xs text-ink/50 dark:text-paper/50">Loading...</p>;
  if (error) return <p className="text-sm text-danger">{error}</p>;
  if (!stats) return null;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Total videos" value={stats.total_videos} />
        <StatCard label="Published" value={stats.published_videos} />
        <StatCard label="Total storage" value={`${stats.total_storage_mb.toLocaleString()} MB`} />
        <StatCard label="Avg. video size" value={`${stats.avg_video_size_mb} MB`} />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="rounded-lg border border-line bg-cloud p-5 dark:border-line-dark dark:bg-graphite">
          <p className="mb-4 font-mono text-[10px] uppercase tracking-widest text-ink/50 dark:text-paper/50">Users by role</p>
          <div className="space-y-2.5">
            {Object.entries(stats.users_by_role).map(([role, count]) => (
              <BreakdownRow key={role} label={ROLE_LABELS[role] || role} value={count} total={stats.total_users} />
            ))}
          </div>
        </div>

        <div className="rounded-lg border border-line bg-cloud p-5 dark:border-line-dark dark:bg-graphite">
          <p className="mb-4 font-mono text-[10px] uppercase tracking-widest text-ink/50 dark:text-paper/50">Video processing status</p>
          <div className="space-y-2.5">
            {Object.entries(stats.videos_by_status).map(([s, count]) => (
              <BreakdownRow key={s} label={STATUS_LABELS[s] || s} value={count} total={stats.total_videos} />
            ))}
          </div>
        </div>
      </div>

      <div className="rounded-lg border border-line bg-cloud p-5 dark:border-line-dark dark:bg-graphite">
        <p className="mb-4 font-mono text-[10px] uppercase tracking-widest text-ink/50 dark:text-paper/50">Generated content</p>
        <div className="grid grid-cols-3 gap-4">
          <StatCard label="Transcripts" value={stats.total_transcripts} />
          <StatCard label="Summaries" value={stats.total_summaries} />
          <StatCard label="Key moments sets" value={stats.total_key_moments} />
        </div>
      </div>
    </div>
  );
}

export default function AdminDashboard() {
  const [tab, setTab] = useState("Users");

  return (
    <div>
      <h1 className="mb-6 font-display text-xl font-semibold tracking-tight text-ink dark:text-paper">Admin</h1>

      <div className="mb-6 flex gap-1 border-b border-line dark:border-line-dark">
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

      {tab === "Users" && <UsersTab />}
      {tab === "Content" && <ContentTab />}
      {tab === "Audit Log" && <AuditLogTab />}
      {tab === "Platform Stats" && <PlatformStatsTab />}
    </div>
  );
}