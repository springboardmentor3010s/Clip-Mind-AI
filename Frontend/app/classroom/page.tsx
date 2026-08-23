'use client';
import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/auth';
import {
  getClassroomsList, createClassroom, deleteClassroom, addVideoToClassroom, removeVideoFromClassroom,
  joinClassroom, getClassroomOverview, getClassroomAnalytics, getClassroomEngagement, getClassroomActivityFeed,
  downloadCsvAnalyticsReport, formatDuration, formatTimeAgo, formatBytes, STATUS_COLORS,
} from '@/lib/api';

/* ─── Types ─────────────────────────────────────────────────────────────── */
interface Classroom {
  id: string;
  name: string;
  code: string;
  subject: string | null;
  description: string | null;
  createdAt: string;
  instructor?: { id: string; name: string; email: string };
  _count: { classroomVideos: number; members: number };
  classroomVideos?: { video: { id: string; title: string; status: string; duration: number | null } }[];
  members?: { user: { id: string; name: string; email: string; role: string } }[];
}

interface OverviewVideo {
  id: string; title: string; status: string; viewCount: number; duration: number | null;
  fileSize: number; isPublic: boolean; createdAt: string;
  transcript: { status: string; updatedAt: string } | null;
  summary: { status: string; qualityScore: number | null; shortSummary: string } | null;
  _count: { keyMoments: number; bookmarks: number };
  classroomVideos?: { classroom: { id: string; name: string; code: string } }[];
}

interface AnalyticsVideo {
  id: string; title: string; viewCount: number; duration: number | null; createdAt: string;
  isPublic: boolean;
  summary: { qualityScore: number | null; readabilityScore: number | null; tone: string | null; keywords: string; topics: string } | null;
  _count: { keyMoments: number; bookmarks: number };
  classroomVideos?: { classroom: { id: string; name: string } }[];
}

interface EngagementItem {
  videoId: string; title: string; viewCount: number; bookmarkCount: number;
  uniqueStudents: number; engagementRate: number;
}

interface BookmarkItem {
  id: string; note: string | null; createdAt: string;
  user: { name: string; role: string };
  video: { title: string };
  keyMoment: { label: string; timestampStart: number } | null;
}

interface ActivityItem {
  id: string; action: string; resourceId: string | null; metadata: string | null; createdAt: string;
  user: { name: string; role: string };
}

/* ─── Helpers ─────────────────────────────────────────────────────────────── */
const TABS = [
  { key: 'classrooms', icon: '🏫', label: 'Classrooms' },
  { key: 'content',    icon: '📚', label: 'Course Content' },
  { key: 'analytics',  icon: '📊', label: 'Analytics' },
  { key: 'engagement', icon: '🎓', label: 'Student Engagement' },
  { key: 'activity',   icon: '📋', label: 'Activity Feed' },
];

const roleColor = (role: string) => ({
  LEARNER: '#22c55e', EDUCATOR: '#a78bfa', CONTENT_CREATOR: '#60a5fa', ADMIN: '#f87171',
})[role] || '#94a3b8';

const PALETTE = [
  '#4f8ef7','#a78bfa','#34d399','#fb923c','#f472b6','#38bdf8','#facc15','#f87171',
];

export default function ClassroomPage() {
  const { user } = useAuth();
  const [tab, setTab] = useState('classrooms');
  const [selectedClassroomId, setSelectedClassroomId] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [copying, setCopying] = useState<string | null>(null);

  // Classroom Creation Modal State
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newClassName, setNewClassName] = useState('');
  const [newClassSubject, setNewClassSubject] = useState('');
  const [newClassDesc, setNewClassDesc] = useState('');
  const [newClassCode, setNewClassCode] = useState('');
  const [creatingClass, setCreatingClass] = useState(false);

  // Assign Lecture Modal State
  const [showAssignModal, setShowAssignModal] = useState<Classroom | null>(null);
  const [selectedVideoToAssign, setSelectedVideoToAssign] = useState('');
  const [assigningVideo, setAssigningVideo] = useState(false);

  // Student Join State
  const [joinCodeInput, setJoinCodeInput] = useState('');
  const [joining, setJoining] = useState(false);

  // Data states
  const [classrooms, setClassrooms] = useState<Classroom[]>([]);
  const [overview, setOverview] = useState<any>(null);
  const [analytics, setAnalytics] = useState<any>(null);
  const [engagement, setEngagement] = useState<any>(null);
  const [activity, setActivity] = useState<any>(null);

  const loadData = useCallback(async (clsId?: string) => {
    setLoading(true);
    setError('');
    try {
      const [clsListRes, ovRes, anRes, enRes, acRes] = await Promise.all([
        getClassroomsList(),
        getClassroomOverview(clsId),
        getClassroomAnalytics(clsId),
        getClassroomEngagement(clsId),
        getClassroomActivityFeed(clsId),
      ]);
      setClassrooms(clsListRes.data?.classrooms || []);
      setOverview(ovRes.data);
      setAnalytics(anRes.data);
      setEngagement(enRes.data);
      setActivity(acRes.data);
    } catch (e: any) {
      setError(e.message || 'Failed to load classroom hub data.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData(selectedClassroomId || undefined);
  }, [loadData, selectedClassroomId]);

  const handleCreateClassroom = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newClassName.trim()) return;
    setCreatingClass(true);
    setError('');
    try {
      const res = await createClassroom({
        name: newClassName,
        subject: newClassSubject || undefined,
        description: newClassDesc || undefined,
        customCode: newClassCode || undefined,
      });
      setSuccessMsg(res.message || 'Classroom created!');
      setNewClassName('');
      setNewClassSubject('');
      setNewClassDesc('');
      setNewClassCode('');
      setShowCreateModal(false);
      await loadData(selectedClassroomId || undefined);
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (err: any) {
      setError(err.message || 'Failed to create classroom.');
    } finally {
      setCreatingClass(false);
    }
  };

  const handleDeleteClassroom = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete the classroom "${name}"?`)) return;
    try {
      await deleteClassroom(id);
      setSuccessMsg(`Classroom "${name}" deleted.`);
      if (selectedClassroomId === id) setSelectedClassroomId('');
      await loadData();
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (err: any) {
      setError(err.message || 'Failed to delete classroom.');
    }
  };

  const handleAssignVideo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!showAssignModal || !selectedVideoToAssign) return;
    setAssigningVideo(true);
    try {
      await addVideoToClassroom(showAssignModal.id, selectedVideoToAssign);
      setSuccessMsg('Video added to classroom!');
      setShowAssignModal(null);
      setSelectedVideoToAssign('');
      await loadData(selectedClassroomId || undefined);
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (err: any) {
      setError(err.message || 'Failed to assign video.');
    } finally {
      setAssigningVideo(false);
    }
  };

  const handleRemoveVideoFromClass = async (classroomId: string, videoId: string) => {
    try {
      await removeVideoFromClassroom(classroomId, videoId);
      setSuccessMsg('Video removed from classroom.');
      await loadData(selectedClassroomId || undefined);
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch (err: any) {
      setError(err.message || 'Failed to remove video.');
    }
  };

  const handleJoinClassroom = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!joinCodeInput.trim()) return;
    setJoining(true);
    setError('');
    try {
      const res = await joinClassroom(joinCodeInput.trim());
      setSuccessMsg(res.message || 'Joined classroom!');
      setJoinCodeInput('');
      await loadData();
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (err: any) {
      setError(err.message || 'Failed to join classroom.');
    } finally {
      setJoining(false);
    }
  };

  const copyCodeOrLink = async (text: string, id: string) => {
    await navigator.clipboard.writeText(text);
    setCopying(id);
    setTimeout(() => setCopying(null), 2000);
  };

  const totals = overview?.totals || {};
  const videos: OverviewVideo[] = overview?.videos || [];
  const aVideos: AnalyticsVideo[] = analytics?.videos || [];
  const maxViews = Math.max(...aVideos.map((v) => v.viewCount), 1);
  const engList: EngagementItem[] = engagement?.engagementByVideo || [];
  const recentBM: BookmarkItem[] = engagement?.recentBookmarks || [];
  const acts: ActivityItem[] = activity?.activities || [];

  return (
    <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 8px 48px' }}>
      {/* ── Hero Header ──────────────────────────────────────────────── */}
      <div style={{
        background: 'linear-gradient(135deg, rgba(79,142,247,0.12) 0%, rgba(167,139,250,0.14) 100%)',
        border: '1px solid rgba(79,142,247,0.25)',
        borderRadius: 'var(--radius-xl)',
        padding: '24px 28px',
        marginBottom: 24,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: 16,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{
            width: 48, height: 48, borderRadius: 'var(--radius-lg)',
            background: 'var(--gradient-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '1.6rem', boxShadow: '0 4px 16px rgba(79,142,247,0.3)',
          }}>
            🏫
          </div>
          <div>
            <h1 style={{ fontSize: '1.45rem', fontWeight: 700, margin: 0, letterSpacing: '-0.02em' }}>
              Classroom &amp; Cohort Management
            </h1>
            <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '0.82rem' }}>
              Create different classrooms, organize lecture modules, distribute join codes, and monitor cohort engagement.
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          {(user?.role === 'EDUCATOR' || user?.role === 'ADMIN') && (
            <button
              id="create-classroom-btn"
              onClick={() => setShowCreateModal(true)}
              className="btn btn-primary"
              style={{ gap: 6, fontSize: '0.82rem' }}
            >
              ➕ Create New Classroom
            </button>
          )}
          <Link href="/upload" className="btn btn-secondary" style={{ gap: 6, fontSize: '0.82rem' }}>
            ⬆️ Upload Lecture
          </Link>
        </div>
      </div>

      {/* Notifications */}
      {successMsg && <div className="alert alert-success" style={{ marginBottom: 16 }}>{successMsg}</div>}
      {error && <div className="alert alert-error" style={{ marginBottom: 16 }}>{error}</div>}

      {/* ── Student Join Bar (If Learner or for testing codes) ───────── */}
      <div className="card" style={{ padding: '14px 20px', marginBottom: 20, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12, background: 'rgba(79,142,247,0.04)', border: '1px dashed rgba(79,142,247,0.3)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: '1.2rem' }}>🔑</span>
          <div>
            <span style={{ fontWeight: 600, fontSize: '0.85rem' }}>Join a Classroom by Code</span>
            <p style={{ margin: 0, fontSize: '0.72rem', color: 'var(--text-muted)' }}>Students enter the educator's 6-character code (e.g. AI-9824) to enroll.</p>
          </div>
        </div>
        <form onSubmit={handleJoinClassroom} style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <input
            id="join-code-input"
            className="input input-sm"
            style={{ width: 140, textTransform: 'uppercase', fontWeight: 600, textAlign: 'center', letterSpacing: '0.08em' }}
            placeholder="CODE-1234"
            value={joinCodeInput}
            onChange={(e) => setJoinCodeInput(e.target.value)}
            required
          />
          <button type="submit" className="btn btn-primary btn-sm" disabled={joining}>
            {joining ? 'Joining...' : 'Join Classroom →'}
          </button>
        </form>
      </div>

      {/* ── Filter / Classroom Switcher Bar ─────────────────────────── */}
      {classrooms.length > 0 && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20, flexWrap: 'wrap', background: 'var(--bg-card)', padding: '10px 16px', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-subtle)' }}>
          <span style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-muted)' }}>Filter by Classroom:</span>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', flex: 1 }}>
            <button
              onClick={() => setSelectedClassroomId('')}
              className={`btn btn-sm ${selectedClassroomId === '' ? 'btn-primary' : 'btn-secondary'}`}
              style={{ fontSize: '0.72rem' }}
            >
              🌐 All Classrooms ({totals.totalVideos ?? 0} lectures)
            </button>
            {classrooms.map((c) => (
              <button
                key={c.id}
                onClick={() => setSelectedClassroomId(c.id)}
                className={`btn btn-sm ${selectedClassroomId === c.id ? 'btn-primary' : 'btn-secondary'}`}
                style={{ fontSize: '0.72rem' }}
              >
                🏫 {c.name} <span style={{ opacity: 0.7, marginLeft: 4 }}>({c._count?.classroomVideos || 0})</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ── KPI Strip ─────────────────────────────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: 10, marginBottom: 24 }}>
        {[
          { icon: '🏫', label: 'Classrooms', val: classrooms.length, color: '#a78bfa' },
          { icon: '🎬', label: 'Lectures', val: totals.totalVideos ?? 0, color: '#4f8ef7' },
          { icon: '👁️', label: 'Total Views', val: totals.totalViews ?? 0, color: '#34d399' },
          { icon: '🔖', label: 'Bookmarks', val: totals.totalBookmarks ?? 0, color: '#fb923c' },
          { icon: '📝', label: 'Transcripts', val: totals.totalTranscripts ?? 0, color: '#38bdf8' },
          { icon: '✨', label: 'Summaries', val: totals.totalSummaries ?? 0, color: '#f472b6' },
        ].map((kpi) => (
          <div key={kpi.label} className="card" style={{ padding: '14px 16px', textAlign: 'center', borderTop: `3px solid ${kpi.color}` }}>
            <div style={{ fontSize: '1.3rem', marginBottom: 2 }}>{kpi.icon}</div>
            <div style={{ fontSize: '1.4rem', fontWeight: 700, color: kpi.color }}>{kpi.val}</div>
            <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>{kpi.label}</div>
          </div>
        ))}
      </div>

      {/* ── Navigation Tabs ───────────────────────────────────────────── */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 24, borderBottom: '1px solid var(--border-subtle)' }}>
        {TABS.map((t) => (
          <button
            key={t.key}
            id={`tab-${t.key}`}
            onClick={() => setTab(t.key)}
            style={{
              padding: '10px 18px',
              fontWeight: 600,
              fontSize: '0.82rem',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: tab === t.key ? 'var(--accent-blue)' : 'var(--text-muted)',
              borderBottom: tab === t.key ? '2px solid var(--accent-blue)' : '2px solid transparent',
              transition: 'all 0.18s',
              whiteSpace: 'nowrap',
            }}
          >
            {t.icon} {t.label}
          </button>
        ))}
      </div>

      {/* ══════════════════════════════════════════════════════════════════ */}
      {/* TAB 1 — Manage Classrooms                                         */}
      {/* ══════════════════════════════════════════════════════════════════ */}
      {tab === 'classrooms' && (
        <div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
            <h2 style={{ fontSize: '1rem', fontWeight: 700, margin: 0 }}>
              Your Active Classrooms &amp; Cohorts ({classrooms.length})
            </h2>
            <button onClick={() => setShowCreateModal(true)} className="btn btn-primary btn-sm">
              ➕ New Classroom
            </button>
          </div>

          {classrooms.length === 0 ? (
            <div className="card" style={{ padding: 48, textAlign: 'center' }}>
              <div style={{ fontSize: '3rem', marginBottom: 12 }}>🏫</div>
              <h3 style={{ fontSize: '1.1rem', marginBottom: 6 }}>No Classrooms Created Yet</h3>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', maxWidth: 460, margin: '0 auto 20px' }}>
                Create separate classrooms (e.g. "Intro to AI", "Machine Learning 2026", "Web Architecture") to group lectures and provide join codes to your students.
              </p>
              <button onClick={() => setShowCreateModal(true)} className="btn btn-primary">
                ➕ Create Your First Classroom
              </button>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: 16 }}>
              {classrooms.map((cls) => (
                <div key={cls.id} className="card" style={{ padding: '20px 22px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                  <div>
                    {/* Header */}
                    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 10, marginBottom: 8 }}>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <span style={{ fontSize: '1.2rem' }}>🎓</span>
                          <h3 style={{ fontSize: '1.05rem', fontWeight: 700, margin: 0 }}>{cls.name}</h3>
                        </div>
                        {cls.subject && (
                          <span className="badge badge-violet" style={{ marginTop: 4, display: 'inline-block' }}>
                            {cls.subject}
                          </span>
                        )}
                      </div>
                      <button
                        onClick={() => handleDeleteClassroom(cls.id, cls.name)}
                        className="btn btn-secondary btn-sm"
                        style={{ color: 'var(--accent-rose)', padding: '4px 8px', fontSize: '0.7rem' }}
                        title="Delete Classroom"
                      >
                        🗑️
                      </button>
                    </div>

                    {cls.description && (
                      <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: 14, lineHeight: 1.4 }}>
                        {cls.description}
                      </p>
                    )}

                    {/* Join Code Box */}
                    <div style={{
                      background: 'rgba(79,142,247,0.06)',
                      border: '1px solid rgba(79,142,247,0.2)',
                      borderRadius: 'var(--radius-md)',
                      padding: '10px 14px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      marginBottom: 16,
                    }}>
                      <div>
                        <div style={{ fontSize: '0.65rem', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 700 }}>
                          Student Join Code
                        </div>
                        <div style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--accent-blue)', letterSpacing: '0.08em' }}>
                          {cls.code}
                        </div>
                      </div>
                      <button
                        onClick={() => copyCodeOrLink(cls.code, `code-${cls.id}`)}
                        className="btn btn-secondary btn-sm"
                        style={{ fontSize: '0.72rem' }}
                      >
                        {copying === `code-${cls.id}` ? '✅ Copied Code' : '📋 Copy Code'}
                      </button>
                    </div>

                    {/* Stats */}
                    <div style={{ display: 'flex', gap: 16, fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: 16 }}>
                      <span>🎬 <strong>{cls._count?.classroomVideos || 0}</strong> Lectures</span>
                      <span>👨‍🎓 <strong>{cls._count?.members || 0}</strong> Enrolled Students</span>
                    </div>

                    {/* Assigned Videos List Preview */}
                    {cls.classroomVideos && cls.classroomVideos.length > 0 && (
                      <div style={{ marginBottom: 16 }}>
                        <div style={{ fontSize: '0.72rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 6 }}>
                          Assigned Lectures ({cls.classroomVideos.length}):
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 4, maxHeight: 120, overflowY: 'auto' }}>
                          {cls.classroomVideos.map(({ video }) => (
                            <div key={video.id} style={{
                              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                              background: 'var(--bg-surface)', padding: '4px 8px', borderRadius: 'var(--radius-sm)',
                              fontSize: '0.72rem',
                            }}>
                              <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 220 }}>
                                🎬 {video.title}
                              </span>
                              <button
                                onClick={() => handleRemoveVideoFromClass(cls.id, video.id)}
                                style={{ background: 'none', border: 'none', color: 'var(--accent-rose)', cursor: 'pointer', fontSize: '0.7rem' }}
                                title="Remove from classroom"
                              >
                                ✕
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Enrolled Students List Preview */}
                    {cls.members && cls.members.length > 0 && (
                      <div style={{ marginBottom: 16 }}>
                        <div style={{ fontSize: '0.72rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 6 }}>
                          Enrolled Students ({cls.members.length}):
                        </div>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                          {cls.members.map(({ user: memberUser }) => (
                            <span key={memberUser.id} style={{
                              fontSize: '0.68rem', padding: '2px 8px', borderRadius: 12,
                              background: 'rgba(52,211,153,0.12)', color: '#34d399',
                            }}>
                              👤 {memberUser.name}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                    <button
                      onClick={() => setShowAssignModal(cls)}
                      className="btn btn-primary btn-sm btn-full"
                      style={{ fontSize: '0.75rem' }}
                    >
                      ➕ Assign Lectures
                    </button>
                    <button
                      onClick={() => { setSelectedClassroomId(cls.id); setTab('content'); }}
                      className="btn btn-secondary btn-sm"
                      style={{ fontSize: '0.75rem' }}
                    >
                      View Lectures →
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════ */}
      {/* TAB 2 — Course Content / Lectures                                  */}
      {/* ══════════════════════════════════════════════════════════════════ */}
      {tab === 'content' && (
        <div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
            <h2 style={{ fontSize: '1rem', fontWeight: 700, margin: 0 }}>
              {selectedClassroomId
                ? `Lectures in "${classrooms.find((c) => c.id === selectedClassroomId)?.name || 'Classroom'}"`
                : 'All Uploaded Course Lectures'} ({videos.length})
            </h2>
            <Link href="/upload" className="btn btn-primary btn-sm">
              ⬆️ Upload New Lecture
            </Link>
          </div>

          {videos.length === 0 ? (
            <div className="card" style={{ padding: 48, textAlign: 'center' }}>
              <div style={{ fontSize: '3rem', marginBottom: 12 }}>🎬</div>
              <p style={{ color: 'var(--text-muted)', marginBottom: 20 }}>
                {selectedClassroomId ? 'No lectures assigned to this classroom yet.' : 'You haven\'t uploaded any lecture videos yet.'}
              </p>
              <Link href="/upload" className="btn btn-primary">Upload Lecture</Link>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {videos.map((v) => {
                const assignedClassrooms = v.classroomVideos?.map((cv) => cv.classroom) || [];
                return (
                  <div key={v.id} className="card" style={{ padding: '18px 20px' }}>
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16, flexWrap: 'wrap' }}>
                      <div style={{
                        width: 50, height: 50, borderRadius: 'var(--radius-md)',
                        background: 'linear-gradient(135deg, rgba(79,142,247,0.2), rgba(167,139,250,0.2))',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: '1.5rem', flexShrink: 0,
                      }}>
                        🎬
                      </div>

                      <div style={{ flex: 1, minWidth: 200 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 4 }}>
                          <span style={{ fontWeight: 700, fontSize: '0.95rem' }}>{v.title}</span>
                          <span className={`badge ${STATUS_COLORS[v.status]}`}>{v.status}</span>
                          {assignedClassrooms.map((c) => (
                            <span key={c.id} className="badge badge-violet">
                              🏫 {c.name}
                            </span>
                          ))}
                        </div>

                        <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', color: 'var(--text-muted)', fontSize: '0.78rem' }}>
                          <span>⏱ {v.duration ? formatDuration(v.duration) : 'N/A'}</span>
                          <span>👁 {v.viewCount} views</span>
                          <span>⚡ {v._count.keyMoments} moments</span>
                          <span>🔖 {v._count.bookmarks} bookmarks</span>
                          <span>📦 {formatBytes(v.fileSize)}</span>
                          <span>🕐 {formatTimeAgo(v.createdAt)}</span>
                        </div>

                        <div style={{ display: 'flex', gap: 8, marginTop: 8, flexWrap: 'wrap' }}>
                          <span style={{
                            fontSize: '0.72rem', padding: '2px 8px', borderRadius: 12,
                            background: v.transcript?.status === 'COMPLETED' ? 'rgba(52,211,153,0.15)' : 'rgba(148,163,184,0.15)',
                            color: v.transcript?.status === 'COMPLETED' ? '#34d399' : 'var(--text-muted)',
                          }}>
                            📝 Transcript: {v.transcript?.status || 'None'}
                          </span>
                          <span style={{
                            fontSize: '0.72rem', padding: '2px 8px', borderRadius: 12,
                            background: v.summary?.status === 'COMPLETED' ? 'rgba(52,211,153,0.15)' : 'rgba(148,163,184,0.15)',
                            color: v.summary?.status === 'COMPLETED' ? '#34d399' : 'var(--text-muted)',
                          }}>
                            ✨ Summary: {v.summary?.status || 'None'}
                            {v.summary?.qualityScore ? ` (${v.summary.qualityScore}%)` : ''}
                          </span>
                        </div>
                      </div>

                      <div style={{ display: 'flex', flexDirection: 'column', gap: 6, alignItems: 'flex-end' }}>
                        <Link href={`/videos/${v.id}`} className="btn btn-secondary btn-sm" style={{ fontSize: '0.75rem' }}>
                          🔍 View &amp; Study Tools
                        </Link>
                        <button
                          onClick={() => copyCodeOrLink(`${window.location.origin}/videos/${v.id}`, `share-${v.id}`)}
                          className="btn btn-secondary btn-sm"
                          style={{ fontSize: '0.75rem', color: copying === `share-${v.id}` ? '#34d399' : undefined }}
                        >
                          {copying === `share-${v.id}` ? '✅ Copied!' : '📤 Share Link'}
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════ */}
      {/* TAB 3 — Classroom Analytics                                       */}
      {/* ══════════════════════════════════════════════════════════════════ */}
      {tab === 'analytics' && (
        <div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 14, marginBottom: 24 }}>
            {[
              { label: 'Avg Quality Score', val: `${analytics?.avgQuality ?? 0}%`, icon: '⭐', color: '#facc15' },
              { label: 'Total Views', val: analytics?.totalViews ?? 0, icon: '👁️', color: '#4f8ef7' },
              { label: 'Total Watch Time', val: `${analytics?.totalMinutes ?? 0} min`, icon: '⏱', color: '#34d399' },
              { label: 'Ready Lectures', val: aVideos.length, icon: '✅', color: '#a78bfa' },
            ].map((s) => (
              <div key={s.label} className="card" style={{ padding: '18px 20px', display: 'flex', alignItems: 'center', gap: 14 }}>
                <div style={{ fontSize: '1.8rem' }}>{s.icon}</div>
                <div>
                  <div style={{ fontSize: '1.3rem', fontWeight: 700, color: s.color }}>{s.val}</div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 600 }}>{s.label}</div>
                </div>
              </div>
            ))}
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 16 }}>
            <button className="btn btn-secondary btn-sm" onClick={() => downloadCsvAnalyticsReport()}>
              ⬇️ Download CSV Report
            </button>
          </div>

          {aVideos.length === 0 ? (
            <div className="card" style={{ padding: 48, textAlign: 'center', color: 'var(--text-muted)' }}>
              No analytics available yet for this selection.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {aVideos.map((v, idx) => {
                let keywords: string[] = [];
                try { keywords = JSON.parse(v.summary?.keywords || '[]'); } catch {}
                const barPct = maxViews > 0 ? Math.max(4, Math.round((v.viewCount / maxViews) * 100)) : 4;
                const color = PALETTE[idx % PALETTE.length];

                return (
                  <div key={v.id} className="card" style={{ padding: '18px 22px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8, marginBottom: 12 }}>
                      <div style={{ fontWeight: 700, fontSize: '0.95rem' }}>{v.title}</div>
                      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                        <span className="badge badge-green">{v.viewCount} views</span>
                        {v.summary?.tone && <span className="badge badge-violet">{v.summary.tone}</span>}
                        {v.summary?.qualityScore && <span className="badge badge-amber">⭐ {v.summary.qualityScore}%</span>}
                        <span className="badge badge-blue">⚡ {v._count.keyMoments} moments</span>
                      </div>
                    </div>

                    <div style={{ marginBottom: 10 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem', color: 'var(--text-muted)', marginBottom: 4 }}>
                        <span>Views</span><span>{v.viewCount}</span>
                      </div>
                      <div style={{ height: 8, borderRadius: 4, background: 'rgba(255,255,255,0.06)', overflow: 'hidden' }}>
                        <div style={{
                          height: '100%', width: `${barPct}%`,
                          background: `linear-gradient(90deg, ${color}, ${color}aa)`,
                          borderRadius: 4, transition: 'width 0.6s ease',
                        }} />
                      </div>
                    </div>

                    <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap', marginTop: 4 }}>
                      <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                        ⏱ {v.duration ? formatDuration(v.duration) : 'N/A'}
                      </span>
                      <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                        🔖 {v._count.bookmarks} bookmarks
                      </span>
                      {keywords.slice(0, 4).map((kw) => (
                        <span key={kw} style={{
                          fontSize: '0.65rem', padding: '2px 7px', borderRadius: 10,
                          background: 'rgba(79,142,247,0.12)', color: 'var(--accent-blue)',
                        }}>{kw}</span>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════ */}
      {/* TAB 4 — Student Engagement                                        */}
      {/* ══════════════════════════════════════════════════════════════════ */}
      {tab === 'engagement' && (
        <div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 14, marginBottom: 24 }}>
            {[
              { label: 'Total Bookmarks', val: engagement?.totalBookmarks ?? 0, icon: '🔖', color: '#a78bfa' },
              { label: 'Unique Students', val: engagement?.totalUniqueEngagements ?? 0, icon: '🎓', color: '#34d399' },
            ].map((s) => (
              <div key={s.label} className="card" style={{ padding: '18px 20px', display: 'flex', alignItems: 'center', gap: 14 }}>
                <div style={{ fontSize: '1.8rem' }}>{s.icon}</div>
                <div>
                  <div style={{ fontSize: '1.5rem', fontWeight: 700, color: s.color }}>{s.val}</div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 600 }}>{s.label}</div>
                </div>
              </div>
            ))}
          </div>

          <h3 style={{ fontSize: '0.9rem', fontWeight: 700, marginBottom: 14, color: 'var(--text-secondary)' }}>
            📊 Student Engagement by Lecture
          </h3>
          {engList.length === 0 ? (
            <div className="card" style={{ padding: 36, textAlign: 'center', color: 'var(--text-muted)', marginBottom: 28 }}>
              No student engagement recorded yet.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 28 }}>
              {engList.map((e, idx) => (
                <div key={e.videoId} className="card" style={{ padding: '16px 20px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8, marginBottom: 10 }}>
                    <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>{e.title}</span>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <span className="badge badge-green">👁 {e.viewCount}</span>
                      <span className="badge badge-violet">🔖 {e.bookmarkCount}</span>
                      <span className="badge badge-blue">🎓 {e.uniqueStudents} students</span>
                    </div>
                  </div>
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem', color: 'var(--text-muted)', marginBottom: 4 }}>
                      <span>Engagement Rate</span><span>{e.engagementRate}%</span>
                    </div>
                    <div style={{ height: 8, borderRadius: 4, background: 'rgba(255,255,255,0.06)', overflow: 'hidden' }}>
                      <div style={{
                        height: '100%',
                        width: `${Math.max(e.engagementRate, 2)}%`,
                        background: `linear-gradient(90deg, ${PALETTE[idx % PALETTE.length]}, ${PALETTE[(idx + 2) % PALETTE.length]})`,
                        borderRadius: 4,
                      }} />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          <h3 style={{ fontSize: '0.9rem', fontWeight: 700, marginBottom: 14, color: 'var(--text-secondary)' }}>
            🔖 Recent Student Bookmarks &amp; Notes
          </h3>
          {recentBM.length === 0 ? (
            <div className="card" style={{ padding: 36, textAlign: 'center', color: 'var(--text-muted)' }}>
              No student bookmarks yet.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {recentBM.map((bm) => (
                <div key={bm.id} className="card" style={{ padding: '12px 18px', display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                  <div style={{
                    width: 36, height: 36, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '0.75rem', fontWeight: 700, flexShrink: 0,
                    background: 'rgba(167,139,250,0.15)', color: roleColor(bm.user.role),
                  }}>
                    {bm.user.name.charAt(0).toUpperCase()}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 2 }}>
                      <span style={{ fontWeight: 600, fontSize: '0.82rem' }}>{bm.user.name}</span>
                      <span style={{ fontSize: '0.68rem', color: roleColor(bm.user.role), textTransform: 'uppercase', fontWeight: 700 }}>{bm.user.role}</span>
                      <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{formatTimeAgo(bm.createdAt)}</span>
                    </div>
                    <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                      Bookmarked <strong>{bm.video.title}</strong>
                      {bm.keyMoment && ` → Key Moment: "${bm.keyMoment.label}" at ${formatDuration(bm.keyMoment.timestampStart)}`}
                    </div>
                    {bm.note && (
                      <div style={{ marginTop: 4, fontSize: '0.75rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>
                        📝 "{bm.note}"
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════ */}
      {/* TAB 5 — Activity Feed                                             */}
      {/* ══════════════════════════════════════════════════════════════════ */}
      {tab === 'activity' && (
        <div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
            <h3 style={{ margin: 0, fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-secondary)' }}>
              📋 Cohort &amp; Learner Activity Log
            </h3>
            <button onClick={() => loadData(selectedClassroomId || undefined)} className="btn btn-secondary btn-sm">
              🔄 Refresh
            </button>
          </div>

          {acts.length === 0 ? (
            <div className="card" style={{ padding: 48, textAlign: 'center' }}>
              <div style={{ fontSize: '3rem', marginBottom: 12 }}>📭</div>
              <p style={{ color: 'var(--text-muted)' }}>
                No learner activity recorded yet.
              </p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {acts.map((act) => {
                let meta: any = {};
                try { meta = JSON.parse(act.metadata || '{}'); } catch {}
                const actionLabel: Record<string, string> = {
                  VIDEO_VIEW: '👁 Viewed Lecture',
                  BOOKMARK_CREATE: '🔖 Saved Bookmark',
                  LEARNING_MATERIALS_GENERATE: '🎓 Generated Study Packet',
                  TRANSCRIPT_EDIT: '✏️ Edited Transcript',
                  SUMMARY_RATE: '⭐ Rated Summary',
                  CLASSROOM_CREATE: '🏫 Created Classroom',
                  CLASSROOM_JOIN: '🔑 Joined Classroom',
                };
                return (
                  <div key={act.id} className="card" style={{ padding: '12px 18px', display: 'flex', alignItems: 'center', gap: 14 }}>
                    <div style={{
                      width: 36, height: 36, borderRadius: '50%',
                      background: 'rgba(79,142,247,0.12)', color: roleColor(act.user.role),
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontWeight: 700, fontSize: '0.8rem', flexShrink: 0,
                    }}>
                      {act.user.name.charAt(0).toUpperCase()}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: '0.82rem' }}>
                        <strong>{act.user.name}</strong>
                        <span style={{ color: 'var(--text-muted)', margin: '0 6px' }}>·</span>
                        <span style={{ color: 'var(--text-secondary)' }}>{actionLabel[act.action] || act.action}</span>
                        {meta.videoTitle && <span style={{ color: 'var(--text-muted)' }}>: <em>{meta.videoTitle}</em></span>}
                        {meta.name && <span style={{ color: 'var(--text-muted)' }}>: <em>{meta.name}</em></span>}
                      </div>
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: 2 }}>
                        {formatTimeAgo(act.createdAt)}
                        <span style={{ marginLeft: 8, color: roleColor(act.user.role), textTransform: 'uppercase', fontSize: '0.65rem', fontWeight: 700 }}>{act.user.role}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ── MODAL: Create New Classroom ──────────────────────────────── */}
      {showCreateModal && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(6px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 16,
        }}>
          <div className="card" style={{ maxWidth: 480, width: '100%', padding: '24px 28px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ fontSize: '1.4rem' }}>🏫</span>
                <h3 style={{ fontSize: '1.2rem', fontWeight: 700, margin: 0 }}>Create New Classroom</h3>
              </div>
              <button onClick={() => setShowCreateModal(false)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '1.2rem' }}>
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateClassroom} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div className="input-group">
                <label className="input-label">Classroom Name *</label>
                <input
                  className="input"
                  placeholder="e.g. CS101: Artificial Intelligence"
                  value={newClassName}
                  onChange={(e) => setNewClassName(e.target.value)}
                  required
                />
              </div>

              <div className="input-group">
                <label className="input-label">Subject / Topic</label>
                <input
                  className="input"
                  placeholder="e.g. Computer Science, Machine Learning"
                  value={newClassSubject}
                  onChange={(e) => setNewClassSubject(e.target.value)}
                />
              </div>

              <div className="input-group">
                <label className="input-label">Description / Syllabus</label>
                <textarea
                  className="input"
                  rows={3}
                  placeholder="Brief overview of what students will learn in this classroom..."
                  value={newClassDesc}
                  onChange={(e) => setNewClassDesc(e.target.value)}
                />
              </div>

              <div className="input-group">
                <label className="input-label">Custom Join Code (Optional)</label>
                <input
                  className="input"
                  placeholder="e.g. AI-2026 (leave empty for auto-generated)"
                  value={newClassCode}
                  onChange={(e) => setNewClassCode(e.target.value.toUpperCase())}
                  style={{ textTransform: 'uppercase', letterSpacing: '0.05em' }}
                />
              </div>

              <div style={{ display: 'flex', gap: 10, marginTop: 12, justifyContent: 'flex-end' }}>
                <button type="button" onClick={() => setShowCreateModal(false)} className="btn btn-secondary">
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={creatingClass}>
                  {creatingClass ? 'Creating...' : 'Create Classroom'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── MODAL: Assign Lectures to Classroom ───────────────────────── */}
      {showAssignModal && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(6px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 16,
        }}>
          <div className="card" style={{ maxWidth: 480, width: '100%', padding: '24px 28px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ fontSize: '1.4rem' }}>➕</span>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 700, margin: 0 }}>
                  Assign Lecture to {showAssignModal.name}
                </h3>
              </div>
              <button onClick={() => setShowAssignModal(null)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '1.2rem' }}>
                ✕
              </button>
            </div>

            <form onSubmit={handleAssignVideo} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div className="input-group">
                <label className="input-label">Select Video Lecture *</label>
                <select
                  className="input"
                  value={selectedVideoToAssign}
                  onChange={(e) => setSelectedVideoToAssign(e.target.value)}
                  required
                >
                  <option value="">-- Choose a lecture video --</option>
                  {videos.map((v) => (
                    <option key={v.id} value={v.id}>
                      {v.title} ({v.duration ? formatDuration(v.duration) : 'Ready'})
                    </option>
                  ))}
                </select>
              </div>

              <div style={{ display: 'flex', gap: 10, marginTop: 12, justifyContent: 'flex-end' }}>
                <button type="button" onClick={() => setShowAssignModal(null)} className="btn btn-secondary">
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={assigningVideo || !selectedVideoToAssign}>
                  {assigningVideo ? 'Assigning...' : 'Add to Classroom'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
