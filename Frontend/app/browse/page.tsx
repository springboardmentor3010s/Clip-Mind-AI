'use client';
import { useEffect, useState } from 'react';
import { get, formatDuration, formatTimeAgo, STATUS_COLORS } from '@/lib/api';
import Link from 'next/link';

export default function BrowsePage() {
  const [videos, setVideos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    const params = new URLSearchParams({ limit: '24' });
    if (search) params.set('search', search);
    get(`/videos?${params}`).then((r) => setVideos(r.data.videos)).catch(() => {}).finally(() => setLoading(false));
  }, [search]);

  return (
    <div>
      <div className="page-header">
        <h1>🔍 Browse Content</h1>
        <p>Discover and explore summarized video content</p>
      </div>

      <div className="input-icon-wrapper" style={{ marginBottom: 28, maxWidth: 500 }}>
        <span className="input-icon">🔍</span>
        <input className="input" placeholder="Search videos by title..." value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>

      {loading ? (
        <div className="video-grid">
          {[...Array(8)].map((_, i) => <div key={i} className="skeleton" style={{ height: 260, borderRadius: 'var(--radius-lg)' }} />)}
        </div>
      ) : !videos.length ? (
        <div style={{ textAlign: 'center', padding: '80px 20px' }}>
          <div style={{ fontSize: '4rem', marginBottom: 16 }}>🔍</div>
          <h2>{search ? 'No videos found' : 'No public videos yet'}</h2>
          <p>{search ? 'Try a different search term.' : 'Content creators will publish videos here.'}</p>
        </div>
      ) : (
        <div className="video-grid">
          {videos.map((v) => (
            <Link key={v.id} href={`/videos/${v.id}`} className="video-card" style={{ display: 'block', textDecoration: 'none' }}>
              <div className="video-thumb">
                {v.thumbnailPath ? (
                  <img src={`http://localhost:5000/uploads/${v.thumbnailPath.split('/').pop()}`} alt={v.title} />
                ) : (
                  <div className="video-thumb-placeholder">🎬</div>
                )}
                {v.duration && <div className="video-duration">{formatDuration(v.duration)}</div>}
              </div>
              <div className="video-info">
                <div className="video-title">{v.title}</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 6 }}>
                  <div className="avatar avatar-sm" style={{ width: 20, height: 20, fontSize: '0.6rem', background: 'var(--gradient-primary)' }}>
                    {v.user?.name?.charAt(0).toUpperCase()}
                  </div>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{v.user?.name}</span>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>· {formatTimeAgo(v.createdAt)}</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
