import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import api from "../lib/api";
import { useToast } from "../components/ui/Toast";
import { pageFade } from "../lib/motion";
import { ROLE_LABELS } from "../lib/roles";

const TABS = [
  { key: "users", label: "Users" },
  { key: "activity", label: "Activity" },
  { key: "content", label: "Content" },
  { key: "jobs", label: "Processing Jobs" },
  { key: "storage", label: "Storage" },
  { key: "messages", label: "Messages" },
  { key: "settings", label: "Settings" },
  { key: "audit", label: "Audit Logs" },
];

const ROLE_OPTIONS = ["content_creator", "learner", "educator", "admin"];

function mb(bytes) {
  return `${((bytes || 0) / (1024 * 1024)).toFixed(2)} MB`;
}

function when(iso) {
  return iso ? new Date(iso).toLocaleString() : "—";
}

function StatCard({ icon, value, label, color }) {
  return (
    <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl">
      <div className={`w-10 h-10 rounded-xl ${color} flex items-center justify-center text-lg mb-3`}>
        {icon}
      </div>
      <p className="text-3xl font-black">{value}</p>
      <p className="text-sm text-gray-400 mt-1">{label}</p>
    </div>
  );
}

/** Administrator module — users, activity, content, jobs, storage, settings, audit. */
function AdminDashboard() {
  const { toast, Toaster } = useToast();

  const [tab, setTab] = useState("users");
  const [stats, setStats] = useState(null);
  const [payload, setPayload] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");

  // Stats header loads once.
  useEffect(() => {
    api
      .get("/admin/stats")
      .then((res) => res.data.success && setStats(res.data.data))
      .catch((err) => setError(err.response?.data?.message || "Failed to load statistics."));
  }, []);

  const endpointFor = useCallback((key) => {
    switch (key) {
      case "users": return `/admin/users${search ? `?search=${encodeURIComponent(search)}` : ""}`;
      case "activity": return "/admin/activity";
      case "content": return `/admin/content${search ? `?search=${encodeURIComponent(search)}` : ""}`;
      case "jobs": return "/admin/jobs";
      case "storage": return "/admin/storage";
      case "settings": return "/admin/settings";
      case "messages": return "/admin/contact-messages";
      case "audit": return "/admin/audit-logs";
      default: return "/admin/stats";
    }
  }, [search]);

  // Refetches whenever the tab or search term changes. State is only written
  // in async continuations and guarded, so switching tabs quickly cannot let a
  // stale response overwrite a newer one.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await api.get(endpointFor(tab));
        if (!cancelled && res.data.success) setPayload(res.data.data);
      } catch (err) {
        if (!cancelled) setError(err.response?.data?.message || "Failed to load data.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [tab, endpointFor]);

  // ── Actions ────────────────────────────────────────────────────────
  const updateUser = async (id, body) => {
    try {
      const res = await api.patch(`/admin/users/${id}`, body);
      if (res.data.success) {
        setPayload((prev) => prev.map((u) => (u.id === id ? res.data.data : u)));
        toast("User updated.", "success");
      }
    } catch (err) {
      toast(err.response?.data?.message || "Update failed.", "error");
    }
  };

  const deleteContent = async (id) => {
    if (!window.confirm("Delete this video and all of its AI data?")) return;
    try {
      await api.delete(`/videos/${id}`);
      setPayload((prev) => ({
        ...prev,
        results: prev.results.filter((v) => v.id !== id),
        count: prev.count - 1,
      }));
      toast("Video deleted.", "success");
    } catch (err) {
      toast(err.response?.data?.message || "Delete failed.", "error");
    }
  };

  const markRead = async (id, isRead) => {
    try {
      const res = await api.patch("/admin/contact-messages", { id, is_read: isRead });
      if (res.data.success) {
        setPayload((prev) => ({
          ...prev,
          results: prev.results.map((m) => (m.id === id ? res.data.data : m)),
          unread_count: prev.unread_count + (isRead ? -1 : 1),
        }));
      }
    } catch (err) {
      toast(err.response?.data?.message || "Update failed.", "error");
    }
  };

  const updateSetting = async (key, value) => {
    try {
      const res = await api.patch("/admin/settings", { [key]: value });
      if (res.data.success) {
        setPayload(res.data.data);
        toast("Setting saved.", "success");
      }
    } catch (err) {
      toast(err.response?.data?.message || "Failed to save setting.", "error");
    }
  };

  const showSearch = ["users", "content"].includes(tab);

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <Toaster />
      <motion.div {...pageFade} className="max-w-7xl mx-auto">
        <h1 className="text-4xl font-extrabold tracking-tight">Admin Dashboard</h1>
        <p className="text-gray-400 mt-2">
          Manage users, content, and monitor platform activity.
        </p>

        {/* System statistics */}
        {stats && (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mt-8">
            <StatCard icon="👥" value={stats.total_users} label="Total Users" color="bg-blue-600/20" />
            <StatCard icon="🎥" value={stats.total_videos} label="Total Videos" color="bg-indigo-600/20" />
            <StatCard icon="💾" value={`${stats.storage_mb} MB`} label="Storage Used" color="bg-emerald-600/20" />
            <StatCard icon="🛡️" value={stats.administrators} label="Administrators" color="bg-amber-600/20" />
          </div>
        )}

        {/* Tabs */}
        <div className="flex gap-2 mt-8 overflow-x-auto border-b border-slate-800 pb-px">
          {TABS.map((t) => (
            <button
              key={t.key}
              onClick={() => {
                setTab(t.key);
                setPayload(null);
                setLoading(true);
                setError("");
              }}
              className={`px-4 py-2.5 rounded-t-lg font-semibold text-sm whitespace-nowrap transition ${
                tab === t.key
                  ? "bg-blue-600 text-white"
                  : "text-gray-400 hover:text-white hover:bg-slate-800"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {showSearch && (
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={tab === "users" ? "Search by name or email…" : "Search by title or owner…"}
            className="mt-4 w-full max-w-md bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 outline-none focus:border-blue-500 transition text-sm"
          />
        )}

        {loading && <p className="text-gray-400 mt-8 animate-pulse">Loading…</p>}
        {error && (
          <div className="mt-6 bg-red-950/40 border border-red-900 text-red-300 rounded-xl p-4">
            {error}
          </div>
        )}

        {!loading && payload && (
          <div className="mt-6 bg-slate-900 border border-slate-800 rounded-2xl p-6">
            {/* ---------- USERS ---------- */}
            {tab === "users" && (
              <div className="overflow-x-auto">
                <h2 className="font-bold text-lg mb-4">All Users</h2>
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="text-gray-400 border-b border-slate-800">
                      <th className="pb-3 font-semibold">User</th>
                      <th className="pb-3 font-semibold">Role</th>
                      <th className="pb-3 font-semibold">Videos</th>
                      <th className="pb-3 font-semibold">Storage</th>
                      <th className="pb-3 font-semibold">Status</th>
                      <th className="pb-3 font-semibold">Joined</th>
                      <th className="pb-3 font-semibold text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/50">
                    {payload.map((user) => (
                      <tr key={user.id}>
                        <td className="py-3">
                          <p className="font-medium">{user.full_name || user.first_name}</p>
                          <p className="text-xs text-gray-500">{user.email}</p>
                        </td>
                        <td className="py-3">
                          <select
                            value={user.role}
                            onChange={(e) => updateUser(user.id, { role: e.target.value })}
                            className="bg-slate-950 border border-slate-700 rounded-lg px-2 py-1.5 text-xs outline-none focus:border-blue-500"
                          >
                            {ROLE_OPTIONS.map((r) => (
                              <option key={r} value={r}>{ROLE_LABELS[r]}</option>
                            ))}
                          </select>
                        </td>
                        <td className="py-3 text-gray-300">{user.video_count}</td>
                        <td className="py-3 text-gray-300">{mb(user.storage_bytes)}</td>
                        <td className="py-3">
                          <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
                            user.is_active
                              ? "bg-emerald-500/10 text-emerald-400"
                              : "bg-red-500/10 text-red-400"
                          }`}>
                            {user.is_active ? "Active" : "Inactive"}
                          </span>
                        </td>
                        <td className="py-3 text-gray-400 text-xs">
                          {new Date(user.created_at).toLocaleDateString()}
                        </td>
                        <td className="py-3 text-right">
                          <button
                            onClick={() => updateUser(user.id, { is_active: !user.is_active })}
                            className="bg-slate-800 hover:bg-slate-700 text-xs px-3 py-1.5 rounded-lg font-medium transition"
                          >
                            {user.is_active ? "Deactivate" : "Activate"}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* ---------- ACTIVITY ---------- */}
            {tab === "activity" && (
              <div>
                <h2 className="font-bold text-lg mb-4">Recent Platform Activity</h2>
                <div className="divide-y divide-slate-800/60">
                  {payload.results.map((entry) => (
                    <div key={entry.id} className="py-3 flex justify-between gap-4">
                      <div className="min-w-0">
                        <p className="text-sm">
                          <span className="font-semibold">{entry.user_name || entry.user_email}</span>
                          <span className="text-gray-500"> ({entry.user_role})</span>
                          <span className="text-gray-300"> — {entry.action_display}</span>
                        </p>
                        {entry.description && (
                          <p className="text-xs text-gray-500 truncate">{entry.description}</p>
                        )}
                      </div>
                      <span className="text-xs text-gray-500 shrink-0">{when(entry.created_at)}</span>
                    </div>
                  ))}
                  {payload.results.length === 0 && (
                    <p className="py-6 text-center text-gray-500">No activity recorded yet.</p>
                  )}
                </div>
              </div>
            )}

            {/* ---------- CONTENT ---------- */}
            {tab === "content" && (
              <div className="overflow-x-auto">
                <h2 className="font-bold text-lg mb-4">All Content ({payload.count})</h2>
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="text-gray-400 border-b border-slate-800">
                      <th className="pb-3 font-semibold">Title</th>
                      <th className="pb-3 font-semibold">Owner</th>
                      <th className="pb-3 font-semibold">Status</th>
                      <th className="pb-3 font-semibold">Shared</th>
                      <th className="pb-3 font-semibold">Created</th>
                      <th className="pb-3 font-semibold text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/50">
                    {payload.results.map((video) => (
                      <tr key={video.id}>
                        <td className="py-3 max-w-xs truncate font-medium">{video.title}</td>
                        <td className="py-3 text-gray-400 text-xs">{video.owner_email}</td>
                        <td className="py-3">
                          <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-800">
                            {video.status}
                          </span>
                        </td>
                        <td className="py-3">
                          {video.is_shared ? "✓" : <span className="text-gray-600">—</span>}
                        </td>
                        <td className="py-3 text-gray-400 text-xs">
                          {new Date(video.created_at).toLocaleDateString()}
                        </td>
                        <td className="py-3 text-right">
                          <button
                            onClick={() => deleteContent(video.id)}
                            className="bg-red-950/40 hover:bg-red-900/60 text-red-400 text-xs px-3 py-1.5 rounded-lg font-medium transition"
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* ---------- JOBS ---------- */}
            {tab === "jobs" && (
              <div>
                <h2 className="font-bold text-lg mb-4">AI Processing Jobs</h2>
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                  <StatCard icon="⚙️" value={payload.active_count} label="Active" color="bg-blue-600/20" />
                  <StatCard icon="⏳" value={payload.queued_count} label="Queued" color="bg-amber-600/20" />
                  <StatCard icon="✅" value={payload.completed_count} label="Completed" color="bg-emerald-600/20" />
                  <StatCard icon="❌" value={payload.failed_count} label="Failed" color="bg-red-600/20" />
                </div>
                {payload.success_rate_24h != null && (
                  <p className="text-sm text-gray-400 mb-4">
                    24h success rate:{" "}
                    <span className="text-emerald-400 font-bold">{payload.success_rate_24h}%</span>
                  </p>
                )}

                <h3 className="font-semibold mt-6 mb-2">Active jobs</h3>
                {payload.active.length === 0 ? (
                  <p className="text-gray-500 text-sm">No jobs running right now.</p>
                ) : (
                  payload.active.map((job) => (
                    <div key={job.video_id} className="py-3 border-b border-slate-800/60">
                      <div className="flex justify-between text-sm">
                        <span className="truncate font-medium">{job.title}</span>
                        <span className="text-blue-400">{job.progress}%</span>
                      </div>
                      <div className="h-1.5 bg-slate-800 rounded-full mt-2 overflow-hidden">
                        <div className="h-full bg-blue-500" style={{ width: `${job.progress}%` }} />
                      </div>
                      <p className="text-xs text-gray-500 mt-1">
                        {job.current_step} · {job.owner}
                      </p>
                    </div>
                  ))
                )}

                <h3 className="font-semibold mt-6 mb-2">Recent failures</h3>
                {payload.recent_failures.length === 0 ? (
                  <p className="text-gray-500 text-sm">No recent failures.</p>
                ) : (
                  payload.recent_failures.map((job) => (
                    <div key={job.video_id} className="py-2 border-b border-slate-800/60">
                      <p className="text-sm truncate font-medium">{job.title}</p>
                      <p className="text-xs text-red-400 truncate">{job.error_message}</p>
                    </div>
                  ))
                )}
              </div>
            )}

            {/* ---------- STORAGE ---------- */}
            {tab === "storage" && (
              <div>
                <h2 className="font-bold text-lg mb-4">Storage & Resource Utilisation</h2>
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                  <StatCard icon="💾" value={`${payload.total_mb} MB`} label="Video Storage" color="bg-emerald-600/20" />
                  <StatCard icon="🖼️" value={mb(payload.thumbnail_bytes)} label="Thumbnails" color="bg-purple-600/20" />
                  <StatCard icon="📁" value={mb(payload.media_root_bytes)} label="Total Media" color="bg-blue-600/20" />
                  <StatCard icon="🎬" value={payload.video_count} label="Stored Files" color="bg-indigo-600/20" />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h3 className="font-semibold mb-3">Storage by Format</h3>
                    {payload.by_format.map((row) => (
                      <div key={row.format} className="flex justify-between py-2 border-b border-slate-800/60 text-sm">
                        <span className="text-gray-300">{row.format}</span>
                        <span className="text-gray-400">{row.mb} MB</span>
                      </div>
                    ))}
                    {payload.by_format.length === 0 && (
                      <p className="text-gray-500 text-sm">No files stored.</p>
                    )}
                  </div>
                  <div>
                    <h3 className="font-semibold mb-3">Top Users by Storage</h3>
                    {payload.top_users.map((row) => (
                      <div key={row.email} className="flex justify-between py-2 border-b border-slate-800/60 text-sm">
                        <span className="text-gray-300 truncate max-w-[60%]">{row.email}</span>
                        <span className="text-gray-400">{row.mb} MB</span>
                      </div>
                    ))}
                    {payload.top_users.length === 0 && (
                      <p className="text-gray-500 text-sm">No usage yet.</p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* ---------- CONTACT MESSAGES ---------- */}
            {tab === "messages" && (
              <div>
                <h2 className="font-bold text-lg mb-4">
                  Contact Messages ({payload.count})
                  {payload.unread_count > 0 && (
                    <span className="ml-2 bg-blue-600 text-xs px-2.5 py-1 rounded-full align-middle">
                      {payload.unread_count} unread
                    </span>
                  )}
                </h2>
                <div className="space-y-3">
                  {payload.results.map((msg) => (
                    <div
                      key={msg.id}
                      className={`rounded-xl p-5 border ${
                        msg.is_read
                          ? "bg-slate-950/60 border-slate-800"
                          : "bg-slate-950 border-blue-800/60"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="min-w-0">
                          <p className="font-semibold">{msg.subject}</p>
                          <p className="text-xs text-gray-500 mt-0.5">
                            {msg.name} ·{" "}
                            <a href={`mailto:${msg.email}`} className="text-blue-400 hover:underline">
                              {msg.email}
                            </a>{" "}
                            · {when(msg.created_at)}
                          </p>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          {!msg.email_sent && (
                            <span
                              className="bg-amber-500/10 text-amber-400 text-xs px-2.5 py-1 rounded-full"
                              title="The notification email could not be delivered — reply manually."
                            >
                              not emailed
                            </span>
                          )}
                          <button
                            onClick={() => markRead(msg.id, !msg.is_read)}
                            className="bg-slate-800 hover:bg-slate-700 text-xs px-3 py-1.5 rounded-lg font-medium transition"
                          >
                            {msg.is_read ? "Mark unread" : "Mark read"}
                          </button>
                        </div>
                      </div>
                      <p className="text-sm text-gray-300 mt-3 whitespace-pre-wrap">
                        {msg.message}
                      </p>
                    </div>
                  ))}
                  {payload.results.length === 0 && (
                    <p className="py-6 text-center text-gray-500">
                      No messages from the contact form yet.
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* ---------- SETTINGS ---------- */}
            {tab === "settings" && (
              <div>
                <h2 className="font-bold text-lg mb-4">Platform Settings</h2>
                <div className="space-y-4">
                  {payload.map((setting) => (
                    <div
                      key={setting.key}
                      className="flex items-center justify-between gap-4 py-3 border-b border-slate-800/60"
                    >
                      <div className="min-w-0">
                        <p className="font-medium text-sm">{setting.key}</p>
                        <p className="text-xs text-gray-500">{setting.description}</p>
                      </div>
                      {typeof setting.value === "boolean" ? (
                        <button
                          onClick={() => updateSetting(setting.key, !setting.value)}
                          className={`px-4 py-2 rounded-lg text-xs font-semibold transition shrink-0 ${
                            setting.value
                              ? "bg-emerald-600 hover:bg-emerald-700"
                              : "bg-slate-700 hover:bg-slate-600"
                          }`}
                        >
                          {setting.value ? "Enabled" : "Disabled"}
                        </button>
                      ) : typeof setting.value === "number" ? (
                        <input
                          type="number"
                          defaultValue={setting.value}
                          onBlur={(e) => {
                            const next = Number(e.target.value);
                            if (next !== setting.value) updateSetting(setting.key, next);
                          }}
                          className="w-32 bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm outline-none focus:border-blue-500 shrink-0"
                        />
                      ) : (
                        <input
                          defaultValue={setting.value}
                          onBlur={(e) => {
                            if (e.target.value !== setting.value) {
                              updateSetting(setting.key, e.target.value);
                            }
                          }}
                          className="w-40 bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm outline-none focus:border-blue-500 shrink-0"
                        />
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ---------- AUDIT ---------- */}
            {tab === "audit" && (
              <div>
                <h2 className="font-bold text-lg mb-4">Audit Logs ({payload.count})</h2>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead>
                      <tr className="text-gray-400 border-b border-slate-800">
                        <th className="pb-3 font-semibold">When</th>
                        <th className="pb-3 font-semibold">Actor</th>
                        <th className="pb-3 font-semibold">Action</th>
                        <th className="pb-3 font-semibold">Detail</th>
                        <th className="pb-3 font-semibold">IP</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/50">
                      {payload.results.map((log) => (
                        <tr key={log.id}>
                          <td className="py-3 text-xs text-gray-400">{when(log.created_at)}</td>
                          <td className="py-3 text-xs">{log.actor_email || "—"}</td>
                          <td className="py-3">
                            <span className="bg-slate-800 px-2.5 py-1 rounded text-xs font-mono">
                              {log.action}
                            </span>
                          </td>
                          <td className="py-3 text-xs text-gray-400 max-w-md truncate">{log.detail}</td>
                          <td className="py-3 text-xs text-gray-500">{log.ip_address || "—"}</td>
                        </tr>
                      ))}
                      {payload.results.length === 0 && (
                        <tr>
                          <td colSpan={5} className="py-6 text-center text-gray-500">
                            No administrative actions recorded yet.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}
      </motion.div>
    </div>
  );
}

export default AdminDashboard;
