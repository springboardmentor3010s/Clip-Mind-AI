"use client";

import React, { useEffect, useState } from 'react';
import { authFetch } from '@/lib/authFetch';
import { ShieldCheck, Users, Film, HardDrive, Activity, ScrollText, Trash2, Save, Settings as SettingsIcon, LogOut, BarChart3 } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import ThemeToggle from '@/components/theme/ThemeToggle';

interface SystemStats {
  total_users: number;
  users_by_role: Record<string, number>;
  total_videos: number;
  videos_by_status: Record<string, number>;
  total_storage_used_mb: number;
  active_processing_jobs: number;
}

interface UserRow {
  id: string;
  username: string;
  email: string;
  role: string;
  created_at: string;
}

interface AuditEntry {
  id: number;
  actor_username: string;
  action: string;
  target_type: string | null;
  target_id: string | null;
  detail: string | null;
  created_at: string;
}

const ROLES = ['Creator', 'Learner', 'Educator', 'Administrator'];

interface ProcessingJob {
  video_id: number;
  title: string;
  status: string;
  duration_seconds: number;
  file_size_bytes: number;
  created_at: string;
}
interface StorageVideo {
  video_id: number;
  title: string;
  file_size_mb: number;
  status: string;
  created_at: string;
}
interface PlatformSettings {
  maintenance_mode: boolean;
  allow_new_registrations: boolean;
  max_upload_size_mb: number;
}
interface DashboardMetrics {
  total_videos: number;
  total_views: number;
  total_exports: number;
  avg_processing_time_seconds: number;
  videos_uploaded_today: number;
  videos_uploaded_yesterday: number;
  downloads_today: number;
  downloads_yesterday: number;
  rolling_8_day: { date: string; uploads: number; downloads: number; views: number }[];
  total_keywords: number;
  total_key_moments: number;
  videos_by_status: Record<string, number>;
  avg_views_per_video: number;
}

function StatCard({ label, value, color }: { label: string; value: React.ReactNode; color?: string }) {
  return (
    <div className="bg-md-surface-container rounded-xl p-6">
      <h3 className="text-body-small font-medium text-md-on-surface-variant mb-1">{label}</h3>
      <p className={`text-headline-small font-bold ${color || 'text-md-on-surface'}`}>{value}</p>
    </div>
  );
}

function GroupedBarChart({
  title,
  data,
  series,
}: {
  title: string;
  data: Record<string, string | number>[];
  series: { key: string; label: string; color: string }[];
}) {
  const maxVal = Math.max(1, ...data.flatMap((d) => series.map((s) => Number(d[s.key]) || 0)));

  return (
    <div className="bg-md-surface-container rounded-xl p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-title-large font-semibold text-md-on-surface">{title}</h3>
        <div className="flex items-center gap-4">
          {series.map((s) => (
            <div key={s.key} className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: s.color }} />
              <span className="text-label-small text-md-on-surface-variant">{s.label}</span>
            </div>
          ))}
        </div>
      </div>

      {data.length === 0 ? (
        <div className="h-48 flex items-center justify-center text-md-on-surface-variant italic">
          No activity data recorded yet.
        </div>
      ) : (
        <div className="h-64 flex items-end gap-3">
          {data.map((d, idx) => (
            <div key={idx} className="relative flex flex-col items-center flex-1 group">
              <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 bg-md-inverse-surface text-md-inverse-on-surface text-label-small py-1.5 px-2.5 rounded-lg opacity-0 group-hover:opacity-100 whitespace-nowrap pointer-events-none transition-opacity z-20 shadow-lg">
                <div className="font-semibold mb-0.5">{String(d.label ?? d.date)}</div>
                {series.map((s) => (
                  <div key={s.key} className="flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: s.color }} />
                    {s.label}: {Number(d[s.key]) || 0}
                  </div>
                ))}
              </div>
              <div className="w-full flex items-end justify-center gap-1 h-full pb-2">
                {series.map((s) => {
                  const val = Number(d[s.key]) || 0;
                  const heightPct = (val / maxVal) * 100;
                  return (
                    <div key={s.key} className="flex-1 max-w-[22px] h-full flex items-end">
                      <div
                        className="w-full rounded-t-sm transition-all"
                        style={{ height: `${heightPct}%`, minHeight: '3px', backgroundColor: s.color }}
                      />
                    </div>
                  );
                })}
              </div>
              <span className="text-label-small text-md-on-surface-variant truncate w-full text-center">
                {String(d.label ?? d.date)}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function AdminPage() {
  const { logout } = useAuth();
  const [stats, setStats] = useState<SystemStats | null>(null);
  const [users, setUsers] = useState<UserRow[]>([]);
  const [auditLog, setAuditLog] = useState<AuditEntry[]>([]);
  const [jobs, setJobs] = useState<{ in_flight: ProcessingJob[]; recent: ProcessingJob[] } | null>(null);
  const [storage, setStorage] = useState<{ total_storage_used_mb: number; videos: StorageVideo[] } | null>(null);
  const [settings, setSettings] = useState<PlatformSettings | null>(null);
  const [savingSettings, setSavingSettings] = useState(false);
  const [loading, setLoading] = useState(true);
  const [savingUserId, setSavingUserId] = useState<string | null>(null);
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);

  const fetchAll = async () => {
    try {
      const [statsRes, usersRes, auditRes, jobsRes, storageRes, settingsRes, metricsRes] = await Promise.all([
        authFetch('/admin/system-stats'),
        authFetch('/users'),
        authFetch('/admin/audit-log?limit=50'),
        authFetch('/admin/processing-jobs'),
        authFetch('/admin/storage'),
        authFetch('/admin/settings'),
        authFetch('/analytics/dashboard'),
      ]);
      if (statsRes.ok) setStats(await statsRes.json());
      if (usersRes.ok) setUsers(await usersRes.json());
      if (auditRes.ok) setAuditLog(await auditRes.json());
      if (jobsRes.ok) setJobs(await jobsRes.json());
      if (storageRes.ok) setStorage(await storageRes.json());
      if (settingsRes.ok) setSettings(await settingsRes.json());
      if (metricsRes.ok) setMetrics(await metricsRes.json());
    } catch (e) {
      console.error('Failed to load admin data:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteVideo = async (videoId: number) => {
    if (!window.confirm('Delete this video and all its data to free storage?')) return;
    const res = await authFetch(`/upload/video/${videoId}`, { method: 'DELETE' });
    if (res.ok) fetchAll();
    else alert('Failed to delete video.');
  };

  const handleSaveSettings = async () => {
    if (!settings) return;
    setSavingSettings(true);
    try {
      const res = await authFetch('/admin/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      });
      if (res.ok) {
        setSettings(await res.json());
        fetchAll();
      } else {
        alert('Failed to save settings.');
      }
    } catch (e) {
      console.error(e);
    } finally {
      setSavingSettings(false);
    }
  };

  useEffect(() => {
    fetchAll();
  }, []);

  const handleRoleChange = async (userId: string, newRole: string) => {
    setSavingUserId(userId);
    try {
      const res = await authFetch(`/users/${userId}/role`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: newRole }),
      });
      if (res.ok) {
        setUsers((prev) => prev.map((u) => (u.id === userId ? { ...u, role: newRole } : u)));
        fetchAll();
      } else {
        alert('Failed to update role.');
      }
    } catch (e) {
      console.error('Failed to update role:', e);
      alert('Failed to update role.');
    } finally {
      setSavingUserId(null);
    }
  };

  const rollingData = metrics
    ? metrics.rolling_8_day.map((d) => ({
        label: d.date.slice(5),
        uploads: d.uploads,
        downloads: d.downloads,
        views: d.views,
      }))
    : [];

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 max-w-6xl">
      <header className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-headline-medium font-bold text-md-on-surface tracking-tight flex items-center gap-3">
            Admin Panel
            <ShieldCheck className="text-md-primary h-6 w-6" />
          </h1>
          <p className="text-md-on-surface-variant mt-2">Manage users, monitor platform activity, and view system resource usage.</p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <ThemeToggle />
          <button
            onClick={logout}
            className="flex items-center gap-2 px-4 py-2.5 rounded-full text-label-large font-medium text-md-error hover:bg-md-error/10 transition-all cursor-pointer"
          >
            <LogOut size={18} />
            Sign Out
          </button>
        </div>
      </header>

      {loading ? (
        <p className="text-md-on-surface-variant">Loading...</p>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="bg-md-surface-container rounded-xl p-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-body-small text-md-on-surface-variant">Total Users</span>
                <Users size={18} className="text-md-primary" />
              </div>
              <p className="text-headline-small font-bold text-md-on-surface">{stats?.total_users ?? 0}</p>
              <div className="flex flex-wrap gap-1 mt-2">
                {Object.entries(stats?.users_by_role || {}).map(([role, count]) => (
                  <span key={role} className="px-2 py-0.5 rounded-full bg-md-surface-container-highest text-label-small text-md-on-surface-variant">
                    {role}: {count}
                  </span>
                ))}
              </div>
            </div>
            <div className="bg-md-surface-container rounded-xl p-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-body-small text-md-on-surface-variant">Total Videos</span>
                <Film size={18} className="text-md-secondary" />
              </div>
              <p className="text-headline-small font-bold text-md-on-surface">{stats?.total_videos ?? 0}</p>
              <div className="flex flex-wrap gap-1 mt-2">
                {Object.entries(stats?.videos_by_status || {}).map(([status, count]) => (
                  <span key={status} className="px-2 py-0.5 rounded-full bg-md-surface-container-highest text-label-small text-md-on-surface-variant">
                    {status}: {count}
                  </span>
                ))}
              </div>
            </div>
            <div className="bg-md-surface-container rounded-xl p-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-body-small text-md-on-surface-variant">Storage Used</span>
                <HardDrive size={18} className="text-md-tertiary" />
              </div>
              <p className="text-headline-small font-bold text-md-on-surface">{stats?.total_storage_used_mb ?? 0} MB</p>
            </div>
            <div className="bg-md-surface-container rounded-xl p-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-body-small text-md-on-surface-variant">Active AI Jobs</span>
                <Activity size={18} className="text-md-primary" />
              </div>
              <p className="text-headline-small font-bold text-md-on-surface">{stats?.active_processing_jobs ?? 0}</p>
            </div>
          </div>

          <div className="space-y-6">
            <div className="flex items-center gap-2">
              <BarChart3 size={18} className="text-md-on-surface-variant" />
              <h2 className="text-title-large font-semibold text-md-on-surface">Analytics</h2>
            </div>

            {metrics && (
              <>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                  <StatCard label="Total Videos" value={metrics.total_videos} />
                  <StatCard label="Total Video Views" value={metrics.total_views} />
                  <StatCard label="Total Exports" value={metrics.total_exports} color="text-md-primary" />
                  <StatCard label="Avg AI Processing Time" value={`${metrics.avg_processing_time_seconds.toFixed(1)}s`} color="text-md-tertiary" />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                  <StatCard label="Uploads — Yesterday" value={metrics.videos_uploaded_yesterday} />
                  <StatCard label="Uploads — Today" value={metrics.videos_uploaded_today} />
                  <StatCard label="Downloads — Yesterday" value={metrics.downloads_yesterday} />
                  <StatCard label="Downloads — Today" value={metrics.downloads_today} />
                </div>

                <GroupedBarChart
                  title="Last 8 Days"
                  data={rollingData}
                  series={[
                    { key: 'uploads', label: 'Uploads', color: 'var(--color-md-primary)' },
                    { key: 'downloads', label: 'Downloads', color: 'var(--color-md-tertiary)' },
                    { key: 'views', label: 'Views', color: 'var(--color-md-secondary)' },
                  ]}
                />

                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                  <StatCard label="Avg Views / Video" value={metrics.avg_views_per_video.toFixed(1)} />
                  <StatCard label="Total Keywords Extracted" value={metrics.total_keywords} />
                  <StatCard label="Total Key Moments" value={metrics.total_key_moments} />
                  <div className="bg-md-surface-container rounded-xl p-6">
                    <h3 className="text-body-small font-medium text-md-on-surface-variant mb-2">Videos by Status</h3>
                    <div className="flex flex-wrap gap-1.5">
                      {Object.entries(metrics.videos_by_status).length === 0 ? (
                        <span className="text-body-small text-md-on-surface-variant italic">No videos yet</span>
                      ) : (
                        Object.entries(metrics.videos_by_status).map(([status, count]) => (
                          <span key={status} className="px-2.5 py-1 rounded-full bg-md-surface-container-high text-label-small text-md-on-surface">
                            {status}: {count}
                          </span>
                        ))
                      )}
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>

          <div className="bg-md-surface-container rounded-xl overflow-hidden">
            <div className="p-4 border-b border-md-outline-variant bg-md-surface-container-high">
              <h3 className="text-title-large font-semibold text-md-on-surface">Users & Roles</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="text-label-small text-md-on-surface-variant border-b border-md-outline-variant">
                    <th className="px-4 py-3 font-medium">Username</th>
                    <th className="px-4 py-3 font-medium">Email</th>
                    <th className="px-4 py-3 font-medium">Role</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((u) => (
                    <tr key={u.id} className="border-b border-md-outline-variant last:border-0 hover:bg-md-surface-container-high/50">
                      <td className="px-4 py-3 text-body-small text-md-on-surface font-medium">{u.username}</td>
                      <td className="px-4 py-3 text-body-small text-md-on-surface-variant">{u.email}</td>
                      <td className="px-4 py-3">
                        <select
                          value={u.role}
                          disabled={savingUserId === u.id}
                          onChange={(e) => handleRoleChange(u.id, e.target.value)}
                          className="px-3 py-1.5 rounded-full bg-md-surface-container-highest text-md-on-surface text-label-small font-medium border border-md-outline-variant focus:outline-none focus:ring-2 focus:ring-md-primary disabled:opacity-50"
                        >
                          {ROLES.map((r) => (
                            <option key={r} value={r}>{r}</option>
                          ))}
                        </select>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="bg-md-surface-container rounded-xl overflow-hidden">
            <div className="p-4 border-b border-md-outline-variant bg-md-surface-container-high flex items-center gap-2">
              <ScrollText size={18} className="text-md-on-surface-variant" />
              <h3 className="text-title-large font-semibold text-md-on-surface">Audit Log</h3>
            </div>
            {auditLog.length === 0 ? (
              <p className="p-6 text-body-small text-md-on-surface-variant italic">No audited actions recorded yet.</p>
            ) : (
              <div className="divide-y divide-md-outline-variant max-h-96 overflow-y-auto">
                {auditLog.map((entry) => (
                  <div key={entry.id} className="px-4 py-3 flex items-start justify-between gap-4">
                    <div>
                      <p className="text-body-small text-md-on-surface">
                        <span className="font-semibold">{entry.actor_username}</span> — {entry.action.replace(/_/g, ' ')}
                        {entry.detail && <span className="text-md-on-surface-variant"> ({entry.detail})</span>}
                      </p>
                    </div>
                    <span className="text-label-small text-md-on-surface-variant whitespace-nowrap">
                      {new Date(entry.created_at).toLocaleString()}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="bg-md-surface-container rounded-xl overflow-hidden">
            <div className="p-4 border-b border-md-outline-variant bg-md-surface-container-high flex items-center gap-2">
              <Activity size={18} className="text-md-on-surface-variant" />
              <h3 className="text-title-large font-semibold text-md-on-surface">AI Processing Jobs</h3>
            </div>
            {!jobs || (jobs.in_flight.length === 0 && jobs.recent.length === 0) ? (
              <p className="p-6 text-body-small text-md-on-surface-variant italic">No jobs recorded yet.</p>
            ) : (
              <div className="divide-y divide-md-outline-variant max-h-96 overflow-y-auto">
                {jobs.in_flight.map((j) => (
                  <div key={j.video_id} className="px-4 py-3 flex items-center justify-between gap-4">
                    <p className="text-body-small text-md-on-surface truncate">{j.title}</p>
                    <span className="px-2.5 py-1 rounded-full bg-md-secondary-container text-md-on-secondary-container text-label-small font-semibold animate-pulse shrink-0">
                      {j.status}
                    </span>
                  </div>
                ))}
                {jobs.recent.map((j) => (
                  <div key={j.video_id} className="px-4 py-3 flex items-center justify-between gap-4">
                    <p className="text-body-small text-md-on-surface truncate">{j.title}</p>
                    <span className={`px-2.5 py-1 rounded-full text-label-small font-semibold shrink-0 ${
                      j.status === 'COMPLETED' ? 'bg-md-success-container text-md-on-success-container' : 'bg-md-error-container text-md-on-error-container'
                    }`}>
                      {j.status}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="bg-md-surface-container rounded-xl overflow-hidden">
            <div className="p-4 border-b border-md-outline-variant bg-md-surface-container-high flex items-center gap-2">
              <HardDrive size={18} className="text-md-on-surface-variant" />
              <h3 className="text-title-large font-semibold text-md-on-surface">Storage — {storage?.total_storage_used_mb ?? 0} MB used</h3>
            </div>
            {!storage || storage.videos.length === 0 ? (
              <p className="p-6 text-body-small text-md-on-surface-variant italic">No videos uploaded yet.</p>
            ) : (
              <div className="divide-y divide-md-outline-variant max-h-96 overflow-y-auto">
                {storage.videos.map((v) => (
                  <div key={v.video_id} className="px-4 py-3 flex items-center justify-between gap-4">
                    <p className="text-body-small text-md-on-surface truncate">{v.title}</p>
                    <div className="flex items-center gap-3 shrink-0">
                      <span className="text-label-small text-md-on-surface-variant">{v.file_size_mb} MB</span>
                      <button
                        onClick={() => handleDeleteVideo(v.video_id)}
                        title="Delete to free storage"
                        className="p-1.5 rounded-full text-md-on-surface-variant hover:text-md-error hover:bg-md-error-container transition-colors"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="bg-md-surface-container rounded-xl overflow-hidden">
            <div className="p-4 border-b border-md-outline-variant bg-md-surface-container-high flex items-center gap-2">
              <SettingsIcon size={18} className="text-md-on-surface-variant" />
              <h3 className="text-title-large font-semibold text-md-on-surface">Platform Settings</h3>
            </div>
            {settings && (
              <div className="p-5 space-y-4">
                <label className="flex items-center justify-between gap-4 cursor-pointer">
                  <div>
                    <p className="text-body-medium text-md-on-surface">Maintenance mode</p>
                    <p className="text-label-small text-md-on-surface-variant">Blocks new uploads (except by Administrators) while enabled.</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={settings.maintenance_mode}
                    onChange={(e) => setSettings({ ...settings, maintenance_mode: e.target.checked })}
                    className="w-5 h-5 accent-md-primary shrink-0"
                  />
                </label>
                <label className="flex items-center justify-between gap-4 cursor-pointer">
                  <div>
                    <p className="text-body-medium text-md-on-surface">Allow new registrations</p>
                    <p className="text-label-small text-md-on-surface-variant">Turn off to stop new accounts from signing up.</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={settings.allow_new_registrations}
                    onChange={(e) => setSettings({ ...settings, allow_new_registrations: e.target.checked })}
                    className="w-5 h-5 accent-md-primary shrink-0"
                  />
                </label>
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-body-medium text-md-on-surface">Max upload size (MB)</p>
                    <p className="text-label-small text-md-on-surface-variant">Uploads larger than this are rejected.</p>
                  </div>
                  <input
                    type="number"
                    min={1}
                    value={settings.max_upload_size_mb}
                    onChange={(e) => setSettings({ ...settings, max_upload_size_mb: parseInt(e.target.value) || 1 })}
                    className="w-28 px-3 py-2 bg-md-surface-container-highest rounded-lg text-md-on-surface text-right focus:outline-none focus:ring-2 focus:ring-md-primary"
                  />
                </div>
                <div className="pt-2 flex justify-end">
                  <button
                    onClick={handleSaveSettings}
                    disabled={savingSettings}
                    className="flex items-center gap-1.5 px-4 py-2 bg-md-primary hover:opacity-90 text-md-on-primary text-label-large font-semibold rounded-full transition-all disabled:opacity-50"
                  >
                    <Save size={14} />
                    {savingSettings ? 'Saving...' : 'Save Settings'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
