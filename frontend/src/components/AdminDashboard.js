"use client";

import { useState, useEffect } from "react";
import {
  Users, Video, HardDrive, Trash2, Ban, CheckCircle2, Shield,
  Activity, FileWarning, Settings as SettingsIcon, FileDown, Loader2, AlertTriangle,
} from "lucide-react";
import { useTheme } from "@/context/ThemeContext";

const roleLabels = {
  creator: "Content Creator",
  learner: "Learner",
  educator: "Educator",
  admin: "Administrator",
};

const TABS = ["Users", "Activity", "Content", "Processing Jobs", "Storage", "Trending", "Settings", "Audit Logs"];

export default function AdminDashboard() {
  const { isDark } = useTheme();
  const [tab, setTab] = useState("Users");
  const [users, setUsers] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [contentFilter, setContentFilter] = useState("");

  function goToUsers() {
    setTab("Users");
  }

  function goToContent(filterUser = "") {
    setContentFilter(filterUser);
    setTab("Content");
  }

  function goToStorage() {
    setTab("Storage");
  }

  const cardBg = isDark ? "bg-[#181B23] border-white/10" : "bg-white border-gray-200";
  const textPrimary = isDark ? "text-gray-100" : "text-gray-900";
  const textSecondary = isDark ? "text-gray-400" : "text-gray-500";

  async function fetchData() {
    const token = localStorage.getItem("clipmind_token");
    try {
      const [usersRes, statsRes] = await Promise.all([
        fetch("http://localhost:8000/api/v1/admin/users", { headers: { Authorization: `Bearer ${token}` } }),
        fetch("http://localhost:8000/api/v1/admin/stats", { headers: { Authorization: `Bearer ${token}` } }),
      ]);
      if (usersRes.ok) setUsers(await usersRes.json());
      if (statsRes.ok) setStats(await statsRes.json());
    } catch (err) {
      // ignore
    }
    setLoading(false);
  }

  useEffect(() => {
    fetchData();
  }, []);

  async function changeRole(userId, newRole) {
    const token = localStorage.getItem("clipmind_token");
    await fetch(`http://localhost:8000/api/v1/admin/users/${userId}/role`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ role: newRole }),
    });
    fetchData();
  }

  async function toggleActive(userId) {
    const token = localStorage.getItem("clipmind_token");
    await fetch(`http://localhost:8000/api/v1/admin/users/${userId}/toggle-active`, {
      method: "PATCH",
      headers: { Authorization: `Bearer ${token}` },
    });
    fetchData();
  }

  async function deleteUser(userId, username) {
    if (!confirm(`Delete user "${username}"? This cannot be undone.`)) return;
    const token = localStorage.getItem("clipmind_token");
    await fetch(`http://localhost:8000/api/v1/admin/users/${userId}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });
    fetchData();
  }

  const statCards = stats
    ? [
        { label: "Total Users", value: stats.total_users, icon: Users, color: "bg-navy", onClick: goToUsers },
        { label: "Total Videos", value: stats.total_videos, icon: Video, color: "bg-blue", onClick: () => goToContent("") },
        { label: "Storage Used", value: `${stats.total_storage_mb} MB`, icon: HardDrive, color: "bg-teal", onClick: goToStorage },
        { label: "Administrators", value: stats.role_counts?.admin || 0, icon: Shield, color: "bg-amber", onClick: goToUsers },
      ]
    : [];

  return (
    <div>
      <h2 className={`text-2xl font-bold ${textPrimary}`}>Admin Dashboard</h2>
      <p className={`${textSecondary} mt-1 mb-6`}>Manage users, content, and monitor platform activity.</p>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {statCards.map((s) => {
          const Icon = s.icon;
          return (
            <button
              key={s.label}
              onClick={s.onClick}
              className={`${cardBg} border rounded-xl p-4 shadow-sm text-left transition-all duration-200 hover:shadow-lg hover:-translate-y-1 cursor-pointer`}
            >
              <div className={`w-9 h-9 rounded-lg ${s.color} flex items-center justify-center mb-3`}>
                <Icon size={18} className="text-white" />
              </div>
              <div className={`text-2xl font-bold ${textPrimary}`}>{s.value}</div>
              <div className={`text-xs ${textSecondary} mt-1`}>{s.label}</div>
            </button>
          );
        })}
      </div>

      <div className="flex items-center gap-1 mb-5 overflow-x-auto pb-1">
        {TABS.map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`text-xs font-semibold px-3 py-2 rounded-full whitespace-nowrap transition ${
              tab === t
                ? "bg-blue text-white"
                : isDark
                ? "text-gray-300 hover:bg-white/5"
                : "text-gray-600 hover:bg-gray-100"
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {tab === "Users" && (
        <div className={`${cardBg} border rounded-xl shadow-sm overflow-hidden`}>
          <div className="p-5 border-b border-gray-200/10">
            <h3 className={`font-semibold ${textPrimary}`}>All Users</h3>
          </div>
          {loading ? (
            <p className={`text-sm ${textSecondary} p-6`}>Loading...</p>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className={`text-left ${isDark ? "text-gray-400 border-white/10" : "text-gray-500 border-gray-100"} border-b`}>
                  <th className="px-5 py-3 font-medium">User</th>
                  <th className="px-5 py-3 font-medium">Role</th>
                  <th className="px-5 py-3 font-medium">Videos</th>
                  <th className="px-5 py-3 font-medium">Status</th>
                  <th className="px-5 py-3 font-medium">Joined</th>
                  <th className="px-5 py-3 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u.user_id} className={`border-b last:border-0 ${isDark ? "border-white/5" : "border-gray-50"}`}>
                    <td className="px-5 py-3">
                      <p className={isDark ? "text-gray-200" : "text-gray-800"}>{u.username}</p>
                      <p className={`text-xs ${textSecondary}`}>{u.email}</p>
                    </td>
                    <td className="px-5 py-3">
                      <select
                        value={u.role}
                        onChange={(e) => changeRole(u.user_id, e.target.value)}
                        className={`text-xs rounded-full px-2 py-1 border ${
                          isDark ? "bg-white/5 border-white/10 text-gray-200" : "bg-gray-50 border-gray-200 text-gray-700"
                        }`}
                      >
                        {Object.entries(roleLabels).map(([val, label]) => (
                          <option key={val} value={val}>{label}</option>
                        ))}
                      </select>
                    </td>
                    <td className={`px-5 py-3 ${textSecondary}`}>{u.video_count}</td>
                    <td className="px-5 py-3">
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${u.is_active ? "bg-teal/15 text-teal" : "bg-red-500/15 text-red-500"}`}>
                        {u.is_active ? "Active" : "Deactivated"}
                      </span>
                    </td>
                    <td className={`px-5 py-3 ${textSecondary}`}>
                      {new Date(u.created_at).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => toggleActive(u.user_id)}
                          title={u.is_active ? "Deactivate" : "Activate"}
                          className="text-gray-400 hover:text-amber transition-colors"
                        >
                          {u.is_active ? <Ban size={15} /> : <CheckCircle2 size={15} />}
                        </button>
                        <button
                          onClick={() => deleteUser(u.user_id, u.username)}
                          title="Delete user"
                          className="text-gray-400 hover:text-red-500 transition-colors"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {tab === "Activity" && <ActivityTab cardBg={cardBg} textPrimary={textPrimary} textSecondary={textSecondary} isDark={isDark} />}
      {tab === "Content" && (
        <ContentTab
          cardBg={cardBg}
          textPrimary={textPrimary}
          textSecondary={textSecondary}
          isDark={isDark}
          initialFilter={contentFilter}
        />
      )}
      {tab === "Processing Jobs" && <ProcessingJobsTab cardBg={cardBg} textPrimary={textPrimary} textSecondary={textSecondary} isDark={isDark} />}
      {tab === "Storage" && (
        <StorageTab
          cardBg={cardBg}
          textPrimary={textPrimary}
          textSecondary={textSecondary}
          isDark={isDark}
          onManageUser={goToContent}
        />
      )}
      {tab === "Trending" && <AdminTrendingTab cardBg={cardBg} textPrimary={textPrimary} textSecondary={textSecondary} isDark={isDark} />}
      {tab === "Settings" && <SettingsTab cardBg={cardBg} textPrimary={textPrimary} textSecondary={textSecondary} isDark={isDark} />}
      {tab === "Audit Logs" && <AuditLogsTab cardBg={cardBg} textPrimary={textPrimary} textSecondary={textSecondary} isDark={isDark} />}
    </div>
  );
}

// ── Trending Tab ──────────────────────────────────────────────

function AdminTrendingTab({ cardBg, textPrimary, textSecondary, isDark }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("clipmind_token");
    fetch("http://localhost:8000/api/v1/admin/trending", { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => r.json())
      .then(setData)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <p className={`text-sm ${textSecondary}`}>Loading...</p>;

  const keywords = data?.top_keywords || [];
  const maxKw = keywords.length ? Math.max(...keywords.map((k) => k.count)) : 1;

  return (
    <div className="flex flex-col gap-4">
      <div className={`${cardBg} border rounded-xl p-5`}>
        <h4 className={`font-semibold ${textPrimary} mb-4`}>Top Keywords Platform-Wide</h4>
        {keywords.length ? (
          <div className="flex flex-wrap gap-2">
            {keywords.map((k) => (
              <span
                key={k.word}
                style={{ opacity: 0.5 + (k.count / maxKw) * 0.5 }}
                className="text-xs font-semibold px-3 py-1.5 rounded-full bg-purple text-white"
                title={`${k.count} mentions`}
              >
                {k.word}
              </span>
            ))}
          </div>
        ) : (
          <p className={`text-sm ${textSecondary}`}>No data yet.</p>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className={`${cardBg} border rounded-xl p-5`}>
          <h4 className={`font-semibold ${textPrimary} mb-3`}>Most Engaged Videos</h4>
          {data?.top_videos?.length ? (
            <div className="flex flex-col gap-2">
              {data.top_videos.map((v) => (
                <div key={v.video_id} className="flex items-center justify-between text-sm">
                  <span className={`truncate max-w-[70%] ${isDark ? "text-gray-300" : "text-gray-700"}`}>{v.title}</span>
                  <span className={textSecondary}>{v.engagement} events</span>
                </div>
              ))}
            </div>
          ) : (
            <p className={`text-sm ${textSecondary}`}>No data yet.</p>
          )}
        </div>

        <div className={`${cardBg} border rounded-xl p-5`}>
          <h4 className={`font-semibold ${textPrimary} mb-3`}>Most Active Users</h4>
          {data?.top_users?.length ? (
            <div className="flex flex-col gap-2">
              {data.top_users.map((u) => (
                <div key={u.username} className="flex items-center justify-between text-sm">
                  <span className={isDark ? "text-gray-300" : "text-gray-700"}>{u.username}</span>
                  <span className={textSecondary}>{u.events} actions</span>
                </div>
              ))}
            </div>
          ) : (
            <p className={`text-sm ${textSecondary}`}>No data yet.</p>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Activity Tab ──────────────────────────────────────────────

function ActivityTab({ cardBg, textPrimary, textSecondary, isDark }) {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("clipmind_token");
    fetch("http://localhost:8000/api/v1/admin/activity", { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => r.json())
      .then((data) => setEvents(Array.isArray(data) ? data : []))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className={`${cardBg} border rounded-xl shadow-sm overflow-hidden`}>
      <div className="p-5 border-b border-gray-200/10 flex items-center gap-2">
        <Activity size={16} className={textPrimary} />
        <h3 className={`font-semibold ${textPrimary}`}>Recent Platform Activity</h3>
      </div>
      {loading ? (
        <p className={`text-sm ${textSecondary} p-6`}>Loading...</p>
      ) : events.length === 0 ? (
        <p className={`text-sm ${textSecondary} p-6`}>No activity recorded yet.</p>
      ) : (
        <div className="divide-y divide-gray-200/10 max-h-[500px] overflow-y-auto">
          {events.map((e) => (
            <div key={e.event_id} className="px-5 py-3 flex items-center justify-between gap-3">
              <div>
                <p className={`text-sm ${isDark ? "text-gray-200" : "text-gray-800"}`}>
                  <span className="font-semibold">{e.username}</span>{" "}
                  <span className={textSecondary}>({roleLabels[e.role] || e.role})</span> —{" "}
                  {e.event_type.replace(/_/g, " ")}
                </p>
                <p className={`text-xs ${textSecondary}`}>{e.video_title}</p>
              </div>
              <p className={`text-xs ${textSecondary} shrink-0`}>
                {new Date(e.timestamp).toLocaleString("en-IN", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Content Tab ───────────────────────────────────────────────

function ContentTab({ cardBg, textPrimary, textSecondary, isDark, initialFilter = "" }) {
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState(initialFilter);

  useEffect(() => {
    setFilter(initialFilter);
  }, [initialFilter]);
  function fetchContent() {
    const token = localStorage.getItem("clipmind_token");
    fetch("http://localhost:8000/api/v1/admin/content", { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => r.json())
      .then((data) => setVideos(Array.isArray(data) ? data : []))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    fetchContent();
  }, []);

  async function removeVideo(videoId, title) {
    if (!confirm(`Remove video "${title}" from the platform?`)) return;
    const token = localStorage.getItem("clipmind_token");
    await fetch(`http://localhost:8000/api/v1/admin/content/${videoId}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });
    fetchContent();
  }

  const filteredVideos = filter
    ? videos.filter(
        (v) =>
          v.owner_username.toLowerCase().includes(filter.toLowerCase()) ||
          v.title.toLowerCase().includes(filter.toLowerCase())
      )
    : videos;

  return (
    <div className={`${cardBg} border rounded-xl shadow-sm overflow-hidden`}>
      <div className="p-5 border-b border-gray-200/10 flex items-center justify-between gap-3 flex-wrap">
        <h3 className={`font-semibold ${textPrimary}`}>All Uploaded Content</h3>
        <input
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          placeholder="Filter by title or owner..."
          className={`text-xs rounded-full px-3 py-1.5 border ${
            isDark ? "bg-white/5 border-white/10 text-gray-200" : "bg-gray-50 border-gray-200 text-gray-700"
          }`}
        />
      </div>
      {loading ? (
        <p className={`text-sm ${textSecondary} p-6`}>Loading...</p>
      ) : filteredVideos.length === 0 ? (
        <p className={`text-sm ${textSecondary} p-6`}>No videos found.</p>
      ) : (
        <table className="w-full text-sm">
          <thead>
            <tr className={`text-left ${isDark ? "text-gray-400 border-white/10" : "text-gray-500 border-gray-100"} border-b`}>
              <th className="px-5 py-3 font-medium">Title</th>
              <th className="px-5 py-3 font-medium">Owner</th>
              <th className="px-5 py-3 font-medium">Format</th>
              <th className="px-5 py-3 font-medium">Size</th>
              <th className="px-5 py-3 font-medium">Status</th>
              <th className="px-5 py-3 font-medium text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredVideos.map((v) => (
              <tr key={v.video_id} className={`border-b last:border-0 ${isDark ? "border-white/5" : "border-gray-50"}`}>
                <td className={`px-5 py-3 ${isDark ? "text-gray-200" : "text-gray-800"} truncate max-w-xs`}>{v.title}</td>
                <td className={`px-5 py-3 ${textSecondary}`}>{v.owner_username}</td>
                <td className={`px-5 py-3 ${textSecondary}`}>{v.file_format}</td>
                <td className={`px-5 py-3 ${textSecondary}`}>{v.file_size_mb} MB</td>
                <td className="px-5 py-3">
                  <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                    v.status === "completed" ? "bg-teal/15 text-teal" : v.status === "failed" ? "bg-red-500/15 text-red-500" : "bg-amber/15 text-amber"
                  }`}>
                    {v.status}
                  </span>
                </td>
                <td className="px-5 py-3 text-right">
                  <button
                    onClick={() => removeVideo(v.video_id, v.title)}
                    title="Remove content"
                    className="text-gray-400 hover:text-red-500 transition-colors"
                  >
                    <Trash2 size={15} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

// ── Processing Jobs Tab ──────────────────────────────────────

function ProcessingJobsTab({ cardBg, textPrimary, textSecondary, isDark }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("clipmind_token");
    fetch("http://localhost:8000/api/v1/admin/processing-jobs", { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => r.json())
      .then(setData)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <p className={`text-sm ${textSecondary}`}>Loading...</p>;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div className={`${cardBg} border rounded-xl p-5`}>
        <h4 className={`font-semibold ${textPrimary} mb-3 flex items-center gap-2`}>
          <Loader2 size={16} className="text-amber" />
          Currently Processing ({data?.processing_count || 0})
        </h4>
        {data?.processing?.length ? (
          <div className="flex flex-col gap-2">
            {data.processing.map((v) => (
              <div key={v.video_id} className={`text-sm p-2 rounded-lg ${isDark ? "bg-white/5" : "bg-gray-50"}`}>
                <p className={isDark ? "text-gray-200" : "text-gray-800"}>{v.title}</p>
                <p className={`text-xs ${textSecondary}`}>{v.owner_username}</p>
              </div>
            ))}
          </div>
        ) : (
          <p className={`text-sm ${textSecondary}`}>Nothing processing right now.</p>
        )}
      </div>

      <div className={`${cardBg} border rounded-xl p-5`}>
        <h4 className={`font-semibold ${textPrimary} mb-3 flex items-center gap-2`}>
          <FileWarning size={16} className="text-red-500" />
          Failed Jobs ({data?.failed_count || 0})
        </h4>
        {data?.failed?.length ? (
          <div className="flex flex-col gap-2">
            {data.failed.map((v) => (
              <div key={v.video_id} className={`text-sm p-2 rounded-lg ${isDark ? "bg-white/5" : "bg-gray-50"}`}>
                <p className={isDark ? "text-gray-200" : "text-gray-800"}>{v.title}</p>
                <p className={`text-xs ${textSecondary}`}>{v.owner_username}</p>
              </div>
            ))}
          </div>
        ) : (
          <p className={`text-sm ${textSecondary}`}>No failed jobs.</p>
        )}
      </div>
    </div>
  );
}

// ── Storage Tab ───────────────────────────────────────────────

function StorageTab({ cardBg, textPrimary, textSecondary, isDark, onManageUser }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("clipmind_token");
    fetch("http://localhost:8000/api/v1/admin/storage", { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => r.json())
      .then(setData)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <p className={`text-sm ${textSecondary}`}>Loading...</p>;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div className={`${cardBg} border rounded-xl p-5`}>
        <h4 className={`font-semibold ${textPrimary} mb-3`}>Storage by Format</h4>
        {data?.storage_by_format && Object.keys(data.storage_by_format).length ? (
          <div className="flex flex-col gap-2">
            {Object.entries(data.storage_by_format).map(([fmt, mb]) => (
              <div key={fmt} className="flex items-center justify-between text-sm">
                <span className={isDark ? "text-gray-300" : "text-gray-700"}>.{fmt}</span>
                <span className={textSecondary}>{mb} MB</span>
              </div>
            ))}
          </div>
        ) : (
          <p className={`text-sm ${textSecondary}`}>No data yet.</p>
        )}
      </div>

      <div className={`${cardBg} border rounded-xl p-5`}>
        <h4 className={`font-semibold ${textPrimary} mb-3`}>Top Users by Storage</h4>
        {data?.top_users_by_storage?.length ? (
          <div className="flex flex-col gap-2">
            {data.top_users_by_storage.map((u) => (
              <div key={u.username} className="flex items-center justify-between text-sm">
                <span className={isDark ? "text-gray-300" : "text-gray-700"}>{u.username}</span>
                <div className="flex items-center gap-3">
                  <span className={textSecondary}>{u.storage_mb} MB</span>
                  <button
                    onClick={() => onManageUser?.(u.username)}
                    className="text-xs font-semibold text-blue hover:underline"
                  >
                    Manage
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className={`text-sm ${textSecondary}`}>No data yet.</p>
        )}
      </div>
    </div>
  );
}

// ── Settings Tab ──────────────────────────────────────────────

function SettingsTab({ cardBg, textPrimary, textSecondary, isDark }) {
  const [settings, setSettings] = useState({ platform_name: "", max_upload_size_mb: 500, maintenance_mode: false });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("clipmind_token");
    fetch("http://localhost:8000/api/v1/admin/settings", { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => r.json())
      .then(setSettings)
      .finally(() => setLoading(false));
  }, []);

  async function save() {
    setSaving(true);
    const token = localStorage.getItem("clipmind_token");
    await fetch("http://localhost:8000/api/v1/admin/settings", {
      method: "PUT",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify(settings),
    });
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  if (loading) return <p className={`text-sm ${textSecondary}`}>Loading...</p>;

  return (
    <div className={`${cardBg} border rounded-xl p-5 max-w-lg`}>
      <h4 className={`font-semibold ${textPrimary} mb-4 flex items-center gap-2`}>
        <SettingsIcon size={16} />
        Platform Settings
      </h4>

      <label className={`text-xs font-semibold ${textSecondary} mb-1.5 block`}>Platform Name</label>
      <input
        value={settings.platform_name}
        onChange={(e) => setSettings({ ...settings, platform_name: e.target.value })}
        className={`w-full text-sm rounded-lg border px-3 py-2 mb-4 ${
          isDark ? "bg-white/5 border-white/10 text-gray-200" : "bg-gray-50 border-gray-200 text-gray-800"
        }`}
      />

      <label className={`text-xs font-semibold ${textSecondary} mb-1.5 block`}>Max Upload Size (MB)</label>
      <input
        type="number"
        value={settings.max_upload_size_mb}
        onChange={(e) => setSettings({ ...settings, max_upload_size_mb: parseInt(e.target.value) || 0 })}
        className={`w-full text-sm rounded-lg border px-3 py-2 mb-4 ${
          isDark ? "bg-white/5 border-white/10 text-gray-200" : "bg-gray-50 border-gray-200 text-gray-800"
        }`}
      />

      <label className="flex items-center gap-2 mb-5 cursor-pointer">
        <input
          type="checkbox"
          checked={settings.maintenance_mode}
          onChange={(e) => setSettings({ ...settings, maintenance_mode: e.target.checked })}
        />
        <span className={`text-sm ${isDark ? "text-gray-300" : "text-gray-700"}`}>Maintenance Mode</span>
      </label>

      <button
        onClick={save}
        disabled={saving}
        className="bg-blue text-white text-sm font-semibold px-4 py-2 rounded-full hover:opacity-90 transition disabled:opacity-50"
      >
        {saving ? "Saving..." : saved ? "Saved ✓" : "Save Settings"}
      </button>
    </div>
  );
}

// ── Audit Logs Tab ────────────────────────────────────────────

function AuditLogsTab({ cardBg, textPrimary, textSecondary }) {
  async function download() {
    const token = localStorage.getItem("clipmind_token");
    const res = await fetch("http://localhost:8000/api/v1/admin/audit-logs/download", {
      headers: { Authorization: `Bearer ${token}` },
    });
    const blob = await res.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "clipmind_audit_log.txt";
    a.click();
    window.URL.revokeObjectURL(url);
  }

  return (
    <div className={`${cardBg} border rounded-xl p-8 text-center`}>
      <FileDown className="text-gray-400 mx-auto mb-3" size={28} />
      <p className={`text-sm font-semibold ${textPrimary}`}>Download Full Audit Log</p>
      <p className={`text-xs ${textSecondary} mt-1 mb-4`}>A complete record of all user actions across the platform.</p>
      <button
        onClick={download}
        className="bg-blue text-white text-sm font-semibold px-4 py-2 rounded-full hover:opacity-90 transition"
      >
        Download .txt
      </button>
    </div>
  );
}