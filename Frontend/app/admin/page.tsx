'use client';
import { useEffect, useState } from 'react';
import { get, patch, put, post, del, formatTimeAgo, formatBytes, formatDuration } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

const ROLES = ['ADMIN', 'CONTENT_CREATOR', 'EDUCATOR', 'LEARNER'];

export default function AdminPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'users' | 'jobs' | 'logs' | 'storage' | 'settings' | 'moderation'>('users');
  
  const [users, setUsers] = useState<any[]>([]);
  const [jobs, setJobs] = useState<any[]>([]);
  const [logs, setLogs] = useState<any[]>([]);
  const [metrics, setMetrics] = useState<any>(null);
  const [settings, setSettings] = useState<any>(null);
  const [allVideos, setAllVideos] = useState<any[]>([]);
  
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [retryingJobId, setRetryingJobId] = useState<string | null>(null);
  const [savingSettings, setSavingSettings] = useState(false);
  const [settingsMsg, setSettingsMsg] = useState('');

  const fetchAdminData = () => {
    Promise.all([
      get('/admin/users'),
      get('/admin/jobs'),
      get('/admin/logs'),
      get('/admin/system-metrics'),
      get('/admin/settings'),
      get('/admin/all-videos'),
    ])
      .then(([u, j, l, m, s, v]) => {
        setUsers(u.data.users || []);
        setJobs(j.data.jobs || []);
        setLogs(l.data.logs || []);
        setMetrics(m.data || null);
        setSettings(s.data.settings || null);
        setAllVideos(v.data.videos || []);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    if (user && user.role !== 'ADMIN') {
      router.push('/dashboard');
      return;
    }
    fetchAdminData();
  }, [user]);

  const updateUser = async (id: string, data: any) => {
    try {
      const res = await patch(`/admin/users/${id}`, data);
      setUsers((prev) => prev.map((u) => (u.id === id ? { ...u, ...res.data.user } : u)));
    } catch (e: any) {
      alert(e.message);
    }
  };

  const deleteUser = async (id: string, name: string) => {
    if (!confirm(`Permanently delete user "${name}"?`)) return;
    try {
      await del(`/admin/users/${id}`);
      setUsers((prev) => prev.filter((u) => u.id !== id));
    } catch (e: any) {
      alert(e.message);
    }
  };

  const handleRetryJob = async (jobId: string) => {
    setRetryingJobId(jobId);
    try {
      await post(`/admin/jobs/${jobId}/retry`);
      alert('Job re-queued for processing!');
      fetchAdminData();
    } catch (e: any) {
      alert(e.message || 'Failed to retry job');
    } finally {
      setRetryingJobId(null);
    }
  };

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingSettings(true);
    setSettingsMsg('');
    try {
      const res = await put('/admin/settings', settings);
      setSettings(res.data.settings);
      setSettingsMsg('Platform settings saved successfully.');
      setTimeout(() => setSettingsMsg(''), 4000);
    } catch (e: any) {
      alert(e.message || 'Failed to save settings');
    } finally {
      setSavingSettings(false);
    }
  };

  const handleToggleVideoVisibility = async (videoId: string, isPublic: boolean) => {
    try {
      await patch(`/admin/videos/${videoId}`, { isPublic });
      setAllVideos((prev) =>
        prev.map((v) => (v.id === videoId ? { ...v, isPublic } : v))
      );
    } catch {
      alert('Failed to update video status');
    }
  };

  const filteredUsers = users.filter((u) => {
    const s = search.toLowerCase();
    const matchSearch = !s || u.name.toLowerCase().includes(s) || u.email.toLowerCase().includes(s);
    const matchRole = !roleFilter || u.role === roleFilter;
    return matchSearch && matchRole;
  });

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: 80 }}>
        <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
          <div className="spinner spinner-lg" />
          <p>Loading admin operations & system metrics...</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="page-header">
        <h1>🛡️ Platform Administrator Command Center</h1>
        <p>Manage users, monitor AI processing pipelines, inspect storage utilization, and configure platform parameters</p>
      </div>

      {/* Quick stats */}
      <div className="stats-grid" style={{ marginBottom: 28 }}>
        {[
          { icon: '👥', label: 'Total Users', value: users.length, color: 'var(--accent-blue)', bg: 'rgba(79,142,247,0.12)' },
          { icon: '🎬', label: 'Total Videos', value: metrics?.counts?.totalVideos ?? allVideos.length, color: 'var(--accent-cyan)', bg: 'rgba(6,182,212,0.12)' },
          { icon: '⚙️', label: 'AI Jobs Run', value: jobs.length, color: 'var(--accent-violet)', bg: 'rgba(139,92,246,0.12)' },
          { icon: '💾', label: 'Disk Storage', value: metrics?.storage?.totalDiskFormatted || '0 MB', color: 'var(--accent-emerald)', bg: 'rgba(16,185,129,0.12)' },
        ].map((s) => (
          <div key={s.label} className="stat-card">
            <div className="stat-icon" style={{ background: s.bg, color: s.color }}>{s.icon}</div>
            <div>
              <div className="stat-value">{typeof s.value === 'number' ? s.value.toLocaleString() : s.value}</div>
              <div className="stat-label">{s.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Navigation Tabs */}
      <div style={{ display: 'flex', gap: 4, borderBottom: '1px solid var(--border-subtle)', marginBottom: 24, overflowX: 'auto' }}>
        {[
          { key: 'users', label: `👥 User Management (${users.length})` },
          { key: 'jobs', label: `⚙️ AI Processing Jobs (${jobs.length})` },
          { key: 'moderation', label: `🎬 Content Moderation (${allVideos.length})` },
          { key: 'storage', label: '💾 Storage & Resource Telemetry' },
          { key: 'settings', label: '🔧 Platform Settings' },
          { key: 'logs', label: `📋 Audit Logs (${logs.length})` },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key as any)}
            style={{
              padding: '10px 18px',
              fontSize: '0.875rem',
              fontWeight: 600,
              cursor: 'pointer',
              whiteSpace: 'nowrap',
              color: activeTab === tab.key ? 'var(--accent-blue)' : 'var(--text-muted)',
              borderBottom: activeTab === tab.key ? '2px solid var(--accent-blue)' : '2px solid transparent',
              background: 'none',
              transition: 'all 0.15s',
              marginBottom: -1,
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* TAB 1: USERS */}
      {activeTab === 'users' && (
        <div className="card fade-in">
          <div style={{ display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap' }}>
            <div className="input-icon-wrapper" style={{ flex: 1, minWidth: 200 }}>
              <span className="input-icon">🔍</span>
              <input
                className="input"
                placeholder="Search users by name or email..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <select
              className="input"
              style={{ width: 180 }}
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
            >
              <option value="">All Roles</option>
              {ROLES.map((r) => (
                <option key={r} value={r}>{r}</option>
              ))}
            </select>
          </div>

          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>User</th>
                  <th>Role</th>
                  <th>Status</th>
                  <th>Videos</th>
                  <th>Bookmarks</th>
                  <th>Joined</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map((u) => (
                  <tr key={u.id}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div className="avatar avatar-sm" style={{ background: 'var(--gradient-primary)', fontSize: '0.7rem' }}>
                          {u.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: '0.875rem' }}>{u.name}</div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{u.email}</div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <select
                        value={u.role}
                        disabled={u.id === user?.id}
                        onChange={(e) => updateUser(u.id, { role: e.target.value })}
                        style={{
                          background: 'var(--bg-input)',
                          border: '1px solid var(--border-subtle)',
                          borderRadius: 'var(--radius-sm)',
                          color: 'var(--text-secondary)',
                          padding: '4px 8px',
                          fontSize: '0.8rem',
                          cursor: 'pointer',
                        }}
                      >
                        {ROLES.map((r) => (
                          <option key={r} value={r}>{r}</option>
                        ))}
                      </select>
                    </td>
                    <td>
                      <button
                        onClick={() => updateUser(u.id, { isActive: !u.isActive })}
                        disabled={u.id === user?.id}
                        className={`badge ${u.isActive ? 'badge-green' : 'badge-rose'}`}
                        style={{ cursor: 'pointer', border: 'none' }}
                      >
                        {u.isActive ? '✓ Active' : '✕ Inactive'}
                      </button>
                    </td>
                    <td style={{ fontWeight: 600, color: 'var(--accent-blue)' }}>{u._count?.videos || 0}</td>
                    <td style={{ fontWeight: 600, color: 'var(--accent-violet)' }}>{u._count?.bookmarks || 0}</td>
                    <td style={{ fontSize: '0.8rem' }}>{formatTimeAgo(u.createdAt)}</td>
                    <td>
                      {u.id !== user?.id && (
                        <button className="btn btn-danger btn-sm" onClick={() => deleteUser(u.id, u.name)}>
                          🗑️
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 2: AI PROCESSING JOBS */}
      {activeTab === 'jobs' && (
        <div className="card fade-in">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
            <div>
              <h3 style={{ margin: 0 }}>⚙️ AI Processing Queue & Job Logs</h3>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: '2px 0 0 0' }}>
                Monitor speech transcription, summarization, and key moment jobs
              </p>
            </div>
            <button className="btn btn-secondary btn-sm" onClick={fetchAdminData}>
              🔄 Refresh Queue
            </button>
          </div>

          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>Video Title</th>
                  <th>Job Type</th>
                  <th>Status</th>
                  <th>Progress</th>
                  <th>Created</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {jobs.map((j) => (
                  <tr key={j.id}>
                    <td style={{ maxWidth: 220 }}>
                      <div style={{ fontWeight: 600, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontSize: '0.875rem' }}>
                        {j.video?.title || 'Unknown Video'}
                      </div>
                      {j.error && (
                        <div style={{ fontSize: '0.72rem', color: 'var(--accent-rose)', marginTop: 2 }}>
                          Error: {j.error}
                        </div>
                      )}
                    </td>
                    <td><span className="badge badge-blue" style={{ fontSize: '0.7rem' }}>{j.type}</span></td>
                    <td>
                      <span className={`badge badge-${j.status === 'COMPLETED' ? 'green' : j.status === 'FAILED' ? 'rose' : j.status === 'PROCESSING' ? 'amber' : 'gray'}`}>
                        {j.status}
                      </span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <div className="progress-bar-wrapper" style={{ width: 80 }}>
                          <div className="progress-bar-fill" style={{ width: `${j.progress}%` }} />
                        </div>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{j.progress}%</span>
                      </div>
                    </td>
                    <td style={{ fontSize: '0.8rem' }}>{formatTimeAgo(j.createdAt)}</td>
                    <td>
                      {(j.status === 'FAILED' || j.status === 'PENDING') && (
                        <button
                          className="btn btn-secondary btn-sm"
                          style={{ fontSize: '0.72rem', padding: '3px 8px' }}
                          onClick={() => handleRetryJob(j.id)}
                          disabled={retryingJobId === j.id}
                        >
                          {retryingJobId === j.id ? 'Retrying...' : '⚡ Retry Job'}
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
                {!jobs.length && <tr><td colSpan={6} style={{ textAlign: 'center', padding: 40 }}>No jobs found in queue.</td></tr>}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: CONTENT MODERATION */}
      {activeTab === 'moderation' && (
        <div className="card fade-in">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
            <div>
              <h3 style={{ margin: 0 }}>🎬 Platform Content Moderation ({allVideos.length})</h3>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: '2px 0 0 0' }}>
                Inspect all platform video uploads, manage public visibility, and review AI quality
              </p>
            </div>
          </div>

          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>Title & Creator</th>
                  <th>Duration</th>
                  <th>Visibility</th>
                  <th>Key Moments</th>
                  <th>Quality</th>
                  <th>Uploaded</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {allVideos.map((v) => (
                  <tr key={v.id}>
                    <td style={{ maxWidth: 240 }}>
                      <div style={{ fontWeight: 600, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {v.title}
                      </div>
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                        By {v.user?.name || 'Creator'} ({v.user?.email})
                      </div>
                    </td>
                    <td>{v.duration ? formatDuration(v.duration) : 'N/A'}</td>
                    <td>
                      <button
                        onClick={() => handleToggleVideoVisibility(v.id, !v.isPublic)}
                        className={`badge ${v.isPublic ? 'badge-green' : 'badge-gray'}`}
                        style={{ cursor: 'pointer', border: 'none' }}
                        title="Click to toggle public/private"
                      >
                        {v.isPublic ? '🌐 Public' : '🔒 Private'}
                      </button>
                    </td>
                    <td><span className="badge badge-violet">{v._count?.keyMoments || 0}</span></td>
                    <td>
                      <span className="badge badge-green">
                        {v.summary?.qualityScore ? `${v.summary.qualityScore}%` : '85%'}
                      </span>
                    </td>
                    <td style={{ fontSize: '0.8rem' }}>{formatTimeAgo(v.createdAt)}</td>
                    <td>
                      <Link href={`/videos/${v.id}`} className="btn btn-secondary btn-sm" style={{ fontSize: '0.75rem', padding: '3px 8px' }}>
                        👁️ Inspect
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 4: STORAGE & RESOURCE TELEMETRY */}
      {activeTab === 'storage' && (
        <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16 }}>
            <div className="card">
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Total Uploads Disk Space</div>
              <div style={{ fontSize: '1.6rem', fontWeight: 700, color: 'var(--accent-blue)', marginTop: 6 }}>
                {metrics?.storage?.totalDiskFormatted || '0 MB'}
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 4 }}>
                📁 {metrics?.storage?.videoFilesCount || 0} Videos · 🎵 {metrics?.storage?.audioFilesCount || 0} Audio · 🖼️ {metrics?.storage?.thumbFilesCount || 0} Thumbs
              </div>
            </div>

            <div className="card">
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Node.js Memory (RSS)</div>
              <div style={{ fontSize: '1.6rem', fontWeight: 700, color: 'var(--accent-emerald)', marginTop: 6 }}>
                {metrics?.resources?.memoryRssMB || 0} MB
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 4 }}>
                Heap Used: {metrics?.resources?.heapUsedMB || 0} MB
              </div>
            </div>

            <div className="card">
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Host System RAM</div>
              <div style={{ fontSize: '1.6rem', fontWeight: 700, color: 'var(--accent-violet)', marginTop: 6 }}>
                {Math.round((metrics?.resources?.totalSystemMemMB || 0) / 1024)} GB Total
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 4 }}>
                Free: {Math.round((metrics?.resources?.freeSystemMemMB || 0) / 1024)} GB ({metrics?.resources?.cpuCores || 0} CPU Cores)
              </div>
            </div>

            <div className="card">
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Server Uptime</div>
              <div style={{ fontSize: '1.6rem', fontWeight: 700, color: 'var(--accent-amber)', marginTop: 6 }}>
                {Math.round((metrics?.resources?.uptimeSeconds || 0) / 60)} mins
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 4 }}>
                Runtime: Node {metrics?.resources?.nodeVersion || 'v20'} on {metrics?.resources?.platform || 'os'}
              </div>
            </div>
          </div>

          <div className="card">
            <h3 style={{ marginBottom: 16 }}>📊 Database Entity Counts</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 14 }}>
              {[
                ['👥 Users', metrics?.counts?.totalUsers || 0],
                ['🎬 Videos', metrics?.counts?.totalVideos || 0],
                ['📝 Transcripts', metrics?.counts?.totalTranscripts || 0],
                ['🤖 AI Summaries', metrics?.counts?.totalSummaries || 0],
                ['⏱️ Key Moments', metrics?.counts?.totalMoments || 0],
              ].map(([lbl, count]) => (
                <div key={lbl} style={{ padding: 14, background: 'var(--bg-subtle)', borderRadius: 'var(--radius-md)', textAlign: 'center' }}>
                  <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{lbl}</div>
                  <div style={{ fontSize: '1.4rem', fontWeight: 700, marginTop: 4 }}>{count}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 5: PLATFORM SETTINGS */}
      {activeTab === 'settings' && (
        <div className="card fade-in" style={{ maxWidth: 720 }}>
          <h3 style={{ marginBottom: 16 }}>🔧 Platform Settings & AI Engine Configuration</h3>
          {settings && (
            <form onSubmit={handleSaveSettings} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div className="input-group">
                <label className="input-label">AI Processing Provider</label>
                <input className="input" type="text" value={settings.aiProvider || ''} disabled style={{ opacity: 0.7 }} />
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 4 }}>
                  {settings.mockAiEnabled
                    ? '💡 Operating in Intelligent Fallback Mode (OpenAI Key not set or demo key)'
                    : '⚡ OpenAI GPT-4o & Whisper connected and active'}
                </span>
              </div>

              <div className="input-group">
                <label className="input-label">Max Video Upload Size (MB)</label>
                <input
                  className="input"
                  type="number"
                  value={settings.maxUploadSizeMB || 500}
                  onChange={(e) => setSettings({ ...settings, maxUploadSizeMB: e.target.value })}
                  min={50}
                  max={2000}
                />
              </div>

              <div className="input-group">
                <label className="input-label">Default AI Summary Tone</label>
                <select
                  className="input"
                  value={settings.defaultSummaryTone || 'Educational & Analytical'}
                  onChange={(e) => setSettings({ ...settings, defaultSummaryTone: e.target.value })}
                >
                  <option value="Educational & Analytical">Educational & Analytical</option>
                  <option value="Executive & Concise">Executive & Concise</option>
                  <option value="Technical & Deep-Dive">Technical & Deep-Dive</option>
                  <option value="Conversational & Engaging">Conversational & Engaging</option>
                </select>
              </div>

              <div className="input-group">
                <label className="input-label">Data Retention (Days)</label>
                <input
                  className="input"
                  type="number"
                  value={settings.retentionDays || 90}
                  onChange={(e) => setSettings({ ...settings, retentionDays: e.target.value })}
                />
              </div>

              {settingsMsg && <div className="alert alert-success">✅ {settingsMsg}</div>}

              <button type="submit" className="btn btn-primary" disabled={savingSettings}>
                {savingSettings ? <><span className="spinner" /> Saving...</> : '💾 Save Platform Configuration'}
              </button>
            </form>
          )}
        </div>
      )}

      {/* TAB 6: AUDIT LOGS */}
      {activeTab === 'logs' && (
        <div className="card fade-in">
          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>User</th>
                  <th>Action</th>
                  <th>Resource</th>
                  <th>Time</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((l) => (
                  <tr key={l.id}>
                    <td>
                      <div style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: '0.875rem' }}>{l.user?.name || 'System'}</div>
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{l.user?.email}</div>
                    </td>
                    <td><span className="badge badge-violet" style={{ fontSize: '0.7rem' }}>{l.action}</span></td>
                    <td style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{l.resourceType} {l.resourceId?.slice(0, 8)}...</td>
                    <td style={{ fontSize: '0.8rem' }}>{formatTimeAgo(l.createdAt)}</td>
                  </tr>
                ))}
                {!logs.length && <tr><td colSpan={4} style={{ textAlign: 'center', padding: 40 }}>No logs found.</td></tr>}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
