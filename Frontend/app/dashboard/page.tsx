'use client';
import { useEffect, useState, useRef, useCallback } from 'react';
import { useAuth } from '@/lib/auth';
import { get, formatDuration, formatTimeAgo, STATUS_COLORS, ROLE_LABELS, ROLE_COLORS } from '@/lib/api';
import Link from 'next/link';

interface Stats {
  totalVideos: number;
  totalTranscripts: number;
  totalSummaries: number;
  keyMomentsCount?: number;
  recentVideos: any[];
  jobSummary: Record<string, number>;
}

export default function DashboardPage() {
  const { user } = useAuth();
  const [stats, setStats] = useState<Stats | null>(null);
  const [contentInsights, setContentInsights] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [activeFilter, setActiveFilter] = useState<'ALL' | 'PROCESSING' | 'READY' | 'COMPLETED'>('ALL');
  const [lastRefreshedAt, setLastRefreshedAt] = useState<Date>(new Date());

  const isTabVisibleRef = useRef(true);

  const fetchDashboardData = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    else setIsRefreshing(true);

    try {
      const [statsRes, insightsRes] = await Promise.allSettled([
        get('/analytics/overview'),
        get('/analytics/content-insights'),
      ]);

      if (statsRes.status === 'fulfilled') {
        setStats(statsRes.value.data);
      }
      if (insightsRes.status === 'fulfilled') {
        setContentInsights(insightsRes.value.data);
      }
      setLastRefreshedAt(new Date());
    } catch {
      // non-fatal
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  // Smart polling when jobs are active & tab is visible
  useEffect(() => {
    const handleVisibilityChange = () => {
      isTabVisibleRef.current = document.visibilityState === 'visible';
      if (isTabVisibleRef.current) {
        fetchDashboardData(true);
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    const hasActiveJobs = (stats?.jobSummary?.PENDING ?? 0) > 0 || (stats?.jobSummary?.PROCESSING ?? 0) > 0;
    const intervalTime = hasActiveJobs ? 3000 : 15000;

    const interval = setInterval(() => {
      if (isTabVisibleRef.current) {
        fetchDashboardData(true);
      }
    }, intervalTime);

    return () => {
      clearInterval(interval);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [stats?.jobSummary, fetchDashboardData]);

  const initials = user?.name?.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2) || 'U';

  const hasActiveJobs = (stats?.jobSummary?.PENDING ?? 0) > 0 || (stats?.jobSummary?.PROCESSING ?? 0) > 0;

  // Filter recent videos
  const filteredVideos = (stats?.recentVideos || []).filter((v) => {
    if (activeFilter === 'ALL') return true;
    if (activeFilter === 'PROCESSING') return v.status === 'PROCESSING' || v.status === 'UPLOADING';
    if (activeFilter === 'READY') return v.status === 'READY';
    if (activeFilter === 'COMPLETED') return v.status === 'COMPLETED' || v.status === 'READY';
    return true;
  });

  return (
    <div>
      {/* Welcome Banner with Live Status Indicator */}
      <div style={{ marginBottom: 24, padding: '24px 28px', borderRadius: 'var(--radius-xl)', background: 'var(--gradient-glow)', border: '1px solid var(--border-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
          <div className="avatar avatar-xl" style={{ background: 'var(--gradient-primary)' }}>{initials}</div>
          <div>
            <h1 style={{ fontSize: '1.4rem', marginBottom: 4 }}>Welcome back, {user?.name?.split(' ')[0]}! 👋</h1>
            <p style={{ fontSize: '0.875rem' }}>
              <span className={`badge ${ROLE_COLORS[user?.role || '']}`}>{ROLE_LABELS[user?.role || '']}</span>
              <span style={{ marginLeft: 10 }}>AI video intelligence & analytics dashboard.</span>
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.78rem', color: 'var(--text-muted)', background: 'var(--bg-card)', padding: '6px 12px', borderRadius: 'var(--radius-full)', border: '1px solid var(--border-subtle)' }}>
            <span className={hasActiveJobs ? 'pulse-indicator' : ''} style={{ background: hasActiveJobs ? 'var(--accent-amber)' : 'var(--accent-emerald)' }} />
            <span>{hasActiveJobs ? 'AI Pipeline Active' : 'System Ready'}</span>
            <span>·</span>
            <span>Updated {lastRefreshedAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</span>
          </div>
          <button
            onClick={() => fetchDashboardData(true)}
            className="btn btn-secondary btn-sm"
            disabled={isRefreshing}
            title="Refresh dashboard data"
          >
            {isRefreshing ? <span className="spinner" /> : '🔄 Refresh'}
          </button>
        </div>
      </div>

      {/* KPI Stats Grid */}
      {loading ? (
        <div className="stats-grid" style={{ marginBottom: 24 }}>
          {[...Array(4)].map((_, i) => <div key={i} className="stat-card"><div className="skeleton" style={{ height: 80 }} /></div>)}
        </div>
      ) : (
        <div className="stats-grid" style={{ marginBottom: 24 }}>
          <StatCard icon="🎬" label="Total Videos" value={stats?.totalVideos ?? 0} color="var(--accent-blue)" bg="rgba(79,142,247,0.12)" change="Library corpus" />
          <StatCard icon="📝" label="Transcripts" value={stats?.totalTranscripts ?? 0} color="var(--accent-violet)" bg="rgba(139,92,246,0.12)" change="Whisper verified" />
          <StatCard icon="🤖" label="AI Summaries" value={stats?.totalSummaries ?? 0} color="var(--accent-cyan)" bg="rgba(6,182,212,0.12)" change={`${contentInsights?.avgQualityScore || 85}% avg quality`} />
          <StatCard icon="⚡" label="Key Moments" value={stats?.keyMomentsCount ?? contentInsights?.totalKeyMomentsDetected ?? 0} color="var(--accent-emerald)" bg="rgba(16,185,129,0.12)" change="Segment markers" />
        </div>
      )}

      {/* Live Pipeline & Health Overview */}
      <div className="dashboard-grid-2col" style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: 20, marginBottom: 24 }}>
        {/* Real-time Video Processing Pipeline Monitor */}
        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
            <h3 style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '1rem' }}>
              <span>⚙️</span> Video Processing Pipeline Monitor
            </h3>
            <span className={`badge ${hasActiveJobs ? 'badge-amber' : 'badge-green'}`}>
              {hasActiveJobs ? '⚡ Processing in background' : '✓ All jobs completed'}
            </span>
          </div>

          {loading ? (
            <div className="skeleton" style={{ height: 120 }} />
          ) : (
            <div>
              {/* Job breakdown counters */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10, marginBottom: 18 }}>
                {[
                  ['PENDING', '⏳ Pending', stats?.jobSummary?.PENDING ?? 0, 'badge-gray'],
                  ['PROCESSING', '⚡ Running', stats?.jobSummary?.PROCESSING ?? 0, 'badge-amber'],
                  ['COMPLETED', '✅ Done', stats?.jobSummary?.COMPLETED ?? 0, 'badge-green'],
                  ['FAILED', '❌ Failed', stats?.jobSummary?.FAILED ?? 0, 'badge-rose'],
                ].map(([status, label, count, cls]) => (
                  <div key={status} style={{ padding: '10px 12px', borderRadius: 'var(--radius-md)', background: 'var(--bg-card)', border: '1px solid var(--border-subtle)', textAlign: 'center' }}>
                    <div style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--text-primary)' }}>{count}</div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: 2 }}>{label}</div>
                  </div>
                ))}
              </div>

              {/* Quality & Performance benchmarks preview */}
              <div style={{ padding: 14, borderRadius: 'var(--radius-md)', background: 'rgba(79,142,247,0.05)', border: '1px solid rgba(79,142,247,0.15)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
                <div>
                  <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)' }}>AI Quality Benchmarking Engine</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>ROUGE evaluation, faithfulness validation & subtitle linting enabled</div>
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <span className="badge badge-blue">ROUGE-L F1 active</span>
                  <span className="badge badge-green">{contentInsights?.avgQualityScore || 85}% avg quality</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Quick Actions & Educator Tools */}
        <div className="card">
          <h3 style={{ marginBottom: 16, fontSize: '1rem' }}>⚡ Quick Workflows</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {user?.role !== 'LEARNER' && (
              <Link href="/upload" className="btn btn-primary" style={{ justifyContent: 'flex-start' }}>
                <span>⬆️</span> Upload & Transcribe Video
              </Link>
            )}
            <Link href="/browse" className="btn btn-secondary" style={{ justifyContent: 'flex-start' }}>
              <span>🔍</span> Browse Video Corpus
            </Link>
            {user?.role !== 'LEARNER' && (
              <Link href="/analytics" className="btn btn-secondary" style={{ justifyContent: 'flex-start' }}>
                <span>📊</span> Content Intelligence Analytics
              </Link>
            )}
            {(user?.role === 'ADMIN' || user?.role === 'EDUCATOR') && (
              <Link href="/classroom" className="btn btn-secondary" style={{ justifyContent: 'flex-start' }}>
                <span>🏫</span> Classroom & Student Hub
              </Link>
            )}
            {user?.role === 'ADMIN' && (
              <Link href="/admin" className="btn btn-secondary" style={{ justifyContent: 'flex-start', color: 'var(--accent-rose)' }}>
                <span>🛡️</span> Admin Controls
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* Recent Videos & Content Repository */}
      <div className="card">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
          <div>
            <h3 style={{ fontSize: '1.1rem' }}>🎬 Recent Video Intelligence</h3>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Direct access to transcript validation, AI summaries, and key moments</p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            {/* Filter Tabs */}
            <div style={{ display: 'flex', background: 'var(--bg-subtle)', borderRadius: 'var(--radius-md)', padding: 3, border: '1px solid var(--border-subtle)' }}>
              {(['ALL', 'PROCESSING', 'READY'] as const).map((filter) => (
                <button
                  key={filter}
                  onClick={() => setActiveFilter(filter)}
                  style={{
                    padding: '4px 10px',
                    fontSize: '0.75rem',
                    fontWeight: 600,
                    borderRadius: 'var(--radius-sm)',
                    background: activeFilter === filter ? 'rgba(79,142,247,0.2)' : 'transparent',
                    color: activeFilter === filter ? 'var(--accent-blue)' : 'var(--text-muted)',
                    transition: 'all 0.15s',
                  }}
                >
                  {filter}
                </button>
              ))}
            </div>

            <Link href="/videos" className="btn btn-ghost btn-sm">View all →</Link>
          </div>
        </div>

        {loading ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {[...Array(3)].map((_, i) => <div key={i} className="skeleton" style={{ height: 64 }} />)}
          </div>
        ) : !filteredVideos.length ? (
          <div style={{ textAlign: 'center', padding: '40px 20px' }}>
            <div style={{ fontSize: '3rem', marginBottom: 12 }}>🎬</div>
            <p style={{ marginBottom: 16 }}>No videos found in this view.</p>
            {user?.role !== 'LEARNER' && <Link href="/upload" className="btn btn-primary">Upload Video</Link>}
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {filteredVideos.map((v: any) => (
              <Link
                key={v.id}
                href={`/videos/${v.id}`}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 16,
                  padding: '14px 16px',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--border-subtle)',
                  background: 'var(--bg-card)',
                  transition: 'all 0.15s ease',
                  flexWrap: 'wrap',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.borderColor = 'rgba(79,142,247,0.3)')}
                onMouseLeave={(e) => (e.currentTarget.style.borderColor = 'var(--border-subtle)')}
              >
                <div style={{ width: 56, height: 40, borderRadius: 'var(--radius-sm)', background: 'var(--gradient-glow)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem', flexShrink: 0 }}>
                  🎬
                </div>
                <div style={{ flex: 1, minWidth: 200 }}>
                  <div style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {v.title}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 2, display: 'flex', gap: 12 }}>
                    <span>{formatTimeAgo(v.createdAt)}</span>
                    <span>👁️ {v.viewCount || 0} views</span>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span className={`badge ${STATUS_COLORS[v.status] || 'badge-gray'}`}>{v.status}</span>
                  <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>→</span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function StatCard({ icon, label, value, color, bg, change }: { icon: string; label: string; value: number; color: string; bg: string; change?: string }) {
  return (
    <div className="stat-card">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div className="stat-icon" style={{ background: bg, color }}>{icon}</div>
        {change && <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 500 }}>{change}</span>}
      </div>
      <div>
        <div className="stat-value">{value.toLocaleString()}</div>
        <div className="stat-label">{label}</div>
      </div>
    </div>
  );
}
