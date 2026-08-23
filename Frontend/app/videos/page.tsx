'use client';
import { useEffect, useState } from 'react';
import { get, del, formatDuration, formatTimeAgo, formatBytes, STATUS_COLORS } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import Link from 'next/link';

export default function VideosPage() {
  const { user } = useAuth();
  const [videos, setVideos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [deleting, setDeleting] = useState<string | null>(null);

  const fetchVideos = () => {
    const params = new URLSearchParams();
    if (search) params.set('search', search);
    if (status) params.set('status', status);
    get(`/videos?${params}`).then((r) => setVideos(r.data.videos)).catch(() => {}).finally(() => setLoading(false));
  };

  useEffect(() => { fetchVideos(); }, [search, status]);

  const handleDelete = async (id: string, title: string) => {
    if (!confirm(`Delete "${title}"? This cannot be undone.`)) return;
    setDeleting(id);
    try {
      await del(`/videos/${id}`);
      setVideos((v) => v.filter((vid) => vid.id !== id));
    } catch (e: any) { alert(e.message); }
    finally { setDeleting(null); }
  };

  return (
    <div>
      <div className="page-header">
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
          <div>
            <h1>My Videos</h1>
            <p>Manage your uploaded video content</p>
          </div>
          {user?.role !== 'LEARNER' && (
            <Link href="/upload" className="btn btn-primary">⬆️ Upload Video</Link>
          )}
        </div>
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 24, flexWrap: 'wrap' }}>
        <div className="input-icon-wrapper" style={{ flex: 1, minWidth: 200 }}>
          <span className="input-icon">🔍</span>
          <input className="input" placeholder="Search videos..." value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <select className="input" style={{ width: 160 }} value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="">All Status</option>
          <option value="READY">Ready</option>
          <option value="PROCESSING">Processing</option>
          <option value="UPLOADING">Uploading</option>
          <option value="FAILED">Failed</option>
        </select>
      </div>

      {loading ? (
        <div className="video-grid">
          {[...Array(6)].map((_, i) => <div key={i} className="skeleton" style={{ height: 280, borderRadius: 'var(--radius-lg)' }} />)}
        </div>
      ) : !videos.length ? (
        <div style={{ textAlign: 'center', padding: '80px 20px' }}>
          <div style={{ fontSize: '4rem', marginBottom: 16 }}>🎬</div>
          <h2 style={{ marginBottom: 8 }}>No videos found</h2>
          <p style={{ marginBottom: 24 }}>{search ? 'Try a different search term.' : 'Upload your first video to get started!'}</p>
          {user?.role !== 'LEARNER' && <Link href="/upload" className="btn btn-primary">Upload Video</Link>}
        </div>
      ) : (
        <div className="video-grid">
          {videos.map((v) => (
            <div key={v.id} className="video-card">
              <Link href={`/videos/${v.id}`}>
                <div className="video-thumb">
                  {v.thumbnailPath ? (
                    <img src={`http://localhost:5000/uploads/${v.thumbnailPath.split('/').pop()}`} alt={v.title} />
                  ) : (
                    <div className="video-thumb-placeholder">🎬</div>
                  )}
                  {v.duration && <div className="video-duration">{formatDuration(v.duration)}</div>}
                  <div className="video-status-badge">
                    <span className={`badge ${STATUS_COLORS[v.status]}`}>{v.status}</span>
                  </div>
                </div>
                <div className="video-info">
                  <div className="video-title">{v.title}</div>
                  <div className="video-meta">
                    <span>👁️ {v.viewCount}</span>
                    <span>{formatTimeAgo(v.createdAt)}</span>
                    <span>{formatBytes(v.fileSize)}</span>
                  </div>
                </div>
              </Link>
              {(user?.role === 'ADMIN' || v.user?.id === user?.id) && (
                <div style={{ padding: '0 14px 14px', display: 'flex', gap: 8 }}>
                  {v.status === 'READY' && (
                    <button className="btn btn-secondary btn-sm" style={{ flex: 1, fontSize: '0.75rem' }}
                      onClick={async () => { try { await fetch(`http://localhost:5000/api/videos/${v.id}/process`, { method: 'POST', headers: { Authorization: `Bearer ${localStorage.getItem('cm_token')}` } }); alert('Processing started!'); } catch (e: any) { alert(e.message); } }}>
                      🤖 Process AI
                    </button>
                  )}
                  <button className="btn btn-danger btn-sm" disabled={deleting === v.id} onClick={() => handleDelete(v.id, v.title)}>
                    {deleting === v.id ? <span className="spinner" /> : '🗑️'}
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
