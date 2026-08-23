'use client';
import { useEffect, useState } from 'react';
import { get, put, formatTimeAgo, ROLE_LABELS, ROLE_COLORS } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import Link from 'next/link';

const AVATAR_OPTIONS = ['🎬', '👨‍💻', '👩‍🏫', '🎓', '🚀', '💡', '🤖', '🦁', '⚡', '🌟', '🎯', '🔥'];

export default function ProfilePage() {
  const { user, login } = useAuth();
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Profile Form
  const [name, setName] = useState('');
  const [bio, setBio] = useState('');
  const [avatar, setAvatar] = useState('🎬');
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileMsg, setProfileMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Password Form
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [savingPassword, setSavingPassword] = useState(false);
  const [passwordMsg, setPasswordMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Activity History
  const [activityLogs, setActivityLogs] = useState<any[]>([]);
  const [actionFilter, setActionFilter] = useState('');
  const [loadingLogs, setLoadingLogs] = useState(false);

  const fetchProfileAndActivity = () => {
    Promise.all([
      get('/users/profile'),
      get('/users/activity?limit=25'),
    ])
      .then(([profRes, actRes]) => {
        const u = profRes.data.user;
        setProfile(u);
        setName(u.name || '');
        setBio(u.bio || '');
        setAvatar(u.avatar || '🎬');
        setActivityLogs(actRes.data.logs || []);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchProfileAndActivity();
  }, []);

  const handleFilterActivity = async (action: string) => {
    setActionFilter(action);
    setLoadingLogs(true);
    try {
      const query = action ? `?action=${action}&limit=25` : '?limit=25';
      const res = await get(`/users/activity${query}`);
      setActivityLogs(res.data.logs || []);
    } catch {
      alert('Failed to filter activity logs');
    } finally {
      setLoadingLogs(false);
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return setProfileMsg({ type: 'error', text: 'Name cannot be empty.' });
    setSavingProfile(true);
    setProfileMsg(null);
    try {
      const res = await put('/users/profile', { name, bio, avatar });
      setProfileMsg({ type: 'success', text: 'Profile updated successfully!' });
      // Update local storage user
      if (typeof window !== 'undefined') {
        const current = JSON.parse(localStorage.getItem('cm_user') || '{}');
        localStorage.setItem('cm_user', JSON.stringify({ ...current, name, avatar }));
      }
      setTimeout(() => setProfileMsg(null), 3500);
    } catch (err: any) {
      setProfileMsg({ type: 'error', text: err.message || 'Failed to update profile.' });
    } finally {
      setSavingProfile(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      return setPasswordMsg({ type: 'error', text: 'New passwords do not match.' });
    }
    if (newPassword.length < 6) {
      return setPasswordMsg({ type: 'error', text: 'Password must be at least 6 characters.' });
    }
    setSavingPassword(true);
    setPasswordMsg(null);
    try {
      await put('/users/change-password', { currentPassword, newPassword });
      setPasswordMsg({ type: 'success', text: 'Password changed successfully!' });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setTimeout(() => setPasswordMsg(null), 3500);
    } catch (err: any) {
      setPasswordMsg({ type: 'error', text: err.message || 'Failed to change password.' });
    } finally {
      setSavingPassword(false);
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: 80 }}>
        <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
          <div className="spinner spinner-lg" />
          <p>Loading user profile & activity...</p>
        </div>
      </div>
    );
  }

  const roleKey = profile?.role || user?.role || 'LEARNER';

  return (
    <div style={{ maxWidth: 960, margin: '0 auto' }}>
      <div className="page-header" style={{ marginBottom: 24 }}>
        <h1>👤 User Profile & Activity Management</h1>
        <p>Manage your account settings, security preferences, and audit history</p>
      </div>

      {/* User Overview Header Banner */}
      <div
        style={{
          padding: '24px 28px',
          borderRadius: 'var(--radius-xl)',
          background: 'var(--gradient-glow)',
          border: '1px solid var(--border-subtle)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 20,
          marginBottom: 28,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
          <div
            style={{
              width: 64,
              height: 64,
              borderRadius: '50%',
              background: 'var(--gradient-primary)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '2rem',
              boxShadow: '0 4px 14px rgba(79,142,247,0.3)',
            }}
          >
            {avatar || '🎬'}
          </div>
          <div>
            <h2 style={{ fontSize: '1.3rem', margin: 0, color: 'var(--text-primary)' }}>{profile?.name}</h2>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 6 }}>
              <span className={`badge ${ROLE_COLORS[roleKey]}`}>{ROLE_LABELS[roleKey]}</span>
              <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>{profile?.email}</span>
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 16 }}>
          {roleKey !== 'LEARNER' && (
            <div style={{ textAlign: 'center', padding: '8px 16px', background: 'var(--bg-card)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
              <div style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--accent-blue)' }}>{profile?._count?.videos || 0}</div>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Videos</div>
            </div>
          )}
          <div style={{ textAlign: 'center', padding: '8px 16px', background: 'var(--bg-card)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
            <div style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--accent-violet)' }}>{profile?._count?.bookmarks || 0}</div>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Bookmarks</div>
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, marginBottom: 28 }}>
        {/* Profile Details Card */}
        <div className="card">
          <h3 style={{ marginBottom: 16 }}>📝 Profile Details</h3>
          <form onSubmit={handleSaveProfile} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div>
              <label className="input-label" style={{ display: 'block', marginBottom: 6 }}>Choose Avatar Icon</label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {AVATAR_OPTIONS.map((icon) => (
                  <button
                    key={icon}
                    type="button"
                    onClick={() => setAvatar(icon)}
                    style={{
                      width: 40,
                      height: 40,
                      borderRadius: 'var(--radius-md)',
                      fontSize: '1.2rem',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      background: avatar === icon ? 'rgba(79,142,247,0.25)' : 'var(--bg-subtle)',
                      border: avatar === icon ? '2px solid var(--accent-blue)' : '1px solid var(--border-subtle)',
                      cursor: 'pointer',
                      transition: 'all 0.15s',
                    }}
                  >
                    {icon}
                  </button>
                ))}
              </div>
            </div>

            <div className="input-group">
              <label className="input-label">Display Name *</label>
              <input
                className="input"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>

            <div className="input-group">
              <label className="input-label">Bio / Headline</label>
              <textarea
                className="input"
                rows={3}
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="Share a short bio about yourself or your organization..."
              />
            </div>

            <div className="input-group">
              <label className="input-label">Email Address (Read-only)</label>
              <input className="input" type="email" value={profile?.email || ''} disabled style={{ opacity: 0.7 }} />
            </div>

            {profileMsg && (
              <div className={`alert alert-${profileMsg.type}`}>
                {profileMsg.type === 'success' ? '✅' : '⚠️'} {profileMsg.text}
              </div>
            )}

            <button type="submit" className="btn btn-primary" disabled={savingProfile}>
              {savingProfile ? <><span className="spinner" /> Saving...</> : '💾 Save Profile Changes'}
            </button>
          </form>
        </div>

        {/* Change Password Card */}
        <div className="card">
          <h3 style={{ marginBottom: 16 }}>🔒 Security & Password</h3>
          <form onSubmit={handleChangePassword} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div className="input-group">
              <label className="input-label">Current Password *</label>
              <input
                className="input"
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="••••••••"
                required
              />
            </div>

            <div className="input-group">
              <label className="input-label">New Password *</label>
              <input
                className="input"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Min 6 characters"
                required
              />
            </div>

            <div className="input-group">
              <label className="input-label">Confirm New Password *</label>
              <input
                className="input"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Re-enter new password"
                required
              />
            </div>

            {passwordMsg && (
              <div className={`alert alert-${passwordMsg.type}`}>
                {passwordMsg.type === 'success' ? '✅' : '⚠️'} {passwordMsg.text}
              </div>
            )}

            <button type="submit" className="btn btn-secondary" disabled={savingPassword} style={{ marginTop: 8 }}>
              {savingPassword ? <><span className="spinner" /> Updating...</> : '🔑 Update Password'}
            </button>
          </form>
        </div>
      </div>

      {/* Activity History Audit Trail */}
      <div className="card">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16, flexWrap: 'wrap', gap: 12 }}>
          <div>
            <h3>📋 Personal Activity & Audit History</h3>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: '2px 0 0 0' }}>
              {roleKey === 'LEARNER'
                ? 'Chronological log of your logins, bookmarks, ratings, and account updates'
                : 'Chronological log of your actions, video uploads, transcript edits, and ratings'}
            </p>
          </div>

          {/* Action Filter */}
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {(roleKey === 'LEARNER'
              ? ['', 'LOGIN', 'SUMMARY_RATING', 'BOOKMARK_VIDEO', 'PROFILE_UPDATE']
              : ['', 'LOGIN', 'VIDEO_UPLOAD', 'TRANSCRIPT_EDIT', 'SUMMARY_RATING', 'BOOKMARK_VIDEO', 'PROFILE_UPDATE']
            ).map((act) => (
              <button
                key={act}
                onClick={() => handleFilterActivity(act)}
                className={`btn ${actionFilter === act ? 'btn-primary' : 'btn-ghost'} btn-sm`}
                style={{ fontSize: '0.75rem', padding: '4px 8px' }}
              >
                {act ? act.replace(/_/g, ' ') : 'All Actions'}
              </button>
            ))}
          </div>
        </div>

        {loadingLogs ? (
          <div style={{ padding: 40, textAlign: 'center' }}><div className="spinner" /></div>
        ) : !activityLogs.length ? (
          <p style={{ textAlign: 'center', padding: '32px 0', color: 'var(--text-muted)' }}>No activity logs recorded for this filter.</p>
        ) : (
          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>Action</th>
                  <th>Resource Type</th>
                  <th>Details</th>
                  <th>Timestamp</th>
                </tr>
              </thead>
              <tbody>
                {activityLogs.map((log) => (
                  <tr key={log.id}>
                    <td>
                      <span className="badge badge-violet" style={{ fontSize: '0.72rem' }}>
                        {log.action}
                      </span>
                    </td>
                    <td style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                      {log.resourceType || '—'}
                    </td>
                    <td style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                      {log.metadata ? (
                        <span style={{ fontFamily: 'monospace', fontSize: '0.75rem' }}>{log.metadata}</span>
                      ) : (
                        <span>ID: {log.resourceId?.slice(0, 8) || '—'}</span>
                      )}
                    </td>
                    <td style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                      {formatTimeAgo(log.createdAt)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
