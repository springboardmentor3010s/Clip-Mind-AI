'use client';
import { useEffect, useState } from 'react';
import { get, post, del, formatDuration, formatTimeAgo } from '@/lib/api';
import Link from 'next/link';

export default function BookmarksPage() {
  const [bookmarks, setBookmarks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState<'ALL' | 'VIDEOS' | 'MOMENTS'>('ALL');
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [noteText, setNoteText] = useState('');
  const [savingNote, setSavingNote] = useState(false);

  const fetchBookmarks = () => {
    get('/bookmarks')
      .then((r) => setBookmarks(r.data.bookmarks || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchBookmarks();
  }, []);

  const handleDelete = async (id: string) => {
    try {
      await del(`/bookmarks/${id}`);
      setBookmarks((prev) => prev.filter((b) => b.id !== id));
    } catch {
      alert('Failed to remove bookmark.');
    }
  };

  const handleSaveNote = async (bookmark: any) => {
    setSavingNote(true);
    try {
      await post('/bookmarks', {
        videoId: bookmark.videoId,
        keyMomentId: bookmark.keyMomentId || undefined,
        note: noteText,
      });
      setBookmarks((prev) =>
        prev.map((b) => (b.id === bookmark.id ? { ...b, note: noteText } : b))
      );
      setEditingNoteId(null);
    } catch {
      alert('Failed to update note.');
    } finally {
      setSavingNote(false);
    }
  };

  const filteredBookmarks = bookmarks.filter((b) => {
    if (filterType === 'VIDEOS') return !b.keyMomentId;
    if (filterType === 'MOMENTS') return !!b.keyMomentId;
    return true;
  });

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: 80 }}>
        <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
          <div className="spinner spinner-lg" />
          <p>Loading bookmarks & saved study notes...</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 960, margin: '0 auto' }}>
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 16 }}>
        <div>
          <h1>🔖 Saved Bookmarks & Study Notes</h1>
          <p>Quickly access your bookmarked lectures, summaries, and key moments with study notes</p>
        </div>
        <div style={{ display: 'flex', gap: 6 }}>
          {(['ALL', 'VIDEOS', 'MOMENTS'] as const).map((t) => (
            <button
              key={t}
              onClick={() => setFilterType(t)}
              className={`btn ${filterType === t ? 'btn-primary' : 'btn-secondary'} btn-sm`}
            >
              {t === 'ALL' ? `All (${bookmarks.length})` : t === 'VIDEOS' ? '📹 Full Videos' : '⏱️ Key Moments'}
            </button>
          ))}
        </div>
      </div>

      {!filteredBookmarks.length ? (
        <div className="card" style={{ textAlign: 'center', padding: '60px 20px' }}>
          <div style={{ fontSize: '3.5rem', marginBottom: 12 }}>🔖</div>
          <h2 style={{ fontSize: '1.2rem', marginBottom: 8 }}>No bookmarks found</h2>
          <p style={{ color: 'var(--text-muted)', marginBottom: 20 }}>
            {filterType === 'ALL'
              ? 'You haven\'t bookmarked any videos or key moments yet. Browse videos to start saving highlights!'
              : 'No items match your current filter.'}
          </p>
          <Link href="/browse" className="btn btn-primary">
            🔍 Browse Videos
          </Link>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {filteredBookmarks.map((b) => (
            <div
              key={b.id}
              className="card"
              style={{
                display: 'flex',
                gap: 20,
                alignItems: 'flex-start',
                border: '1px solid var(--border-subtle)',
                transition: 'all 0.15s ease',
              }}
            >
              <div
                style={{
                  width: 56,
                  height: 56,
                  borderRadius: 'var(--radius-md)',
                  background: b.keyMomentId ? 'rgba(139,92,246,0.15)' : 'rgba(79,142,247,0.15)',
                  color: b.keyMomentId ? 'var(--accent-violet)' : 'var(--accent-blue)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '1.8rem',
                  flexShrink: 0,
                }}
              >
                {b.keyMomentId ? '⏱️' : '🎬'}
              </div>

              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span className={`badge ${b.keyMomentId ? 'badge-violet' : 'badge-blue'}`} style={{ fontSize: '0.7rem' }}>
                        {b.keyMomentId ? 'Key Moment' : 'Full Video'}
                      </span>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        Saved {formatTimeAgo(b.createdAt)}
                      </span>
                    </div>

                    <Link
                      href={`/videos/${b.videoId}`}
                      style={{
                        fontSize: '1.05rem',
                        fontWeight: 600,
                        color: 'var(--text-primary)',
                        display: 'block',
                        marginTop: 4,
                        textDecoration: 'none',
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--accent-blue)')}
                      onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--text-primary)')}
                    >
                      {b.video?.title || 'Video Lecture'}
                    </Link>
                  </div>

                  <div style={{ display: 'flex', gap: 8 }}>
                    <Link href={`/videos/${b.videoId}`} className="btn btn-secondary btn-sm">
                      👁️ Open Video
                    </Link>
                    <button
                      className="btn btn-ghost btn-sm"
                      style={{ color: 'var(--accent-rose)' }}
                      onClick={() => handleDelete(b.id)}
                      title="Remove bookmark"
                    >
                      🗑️
                    </button>
                  </div>
                </div>

                {/* Key Moment Details if applicable */}
                {b.keyMoment && (
                  <div
                    style={{
                      margin: '12px 0',
                      padding: '10px 14px',
                      borderRadius: 'var(--radius-sm)',
                      background: 'var(--bg-subtle)',
                      borderLeft: '3px solid var(--accent-violet)',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span className="moment-timestamp" style={{ fontSize: '0.75rem' }}>
                        {formatDuration(b.keyMoment.timestampStart)} - {formatDuration(b.keyMoment.timestampEnd)}
                      </span>
                      <strong style={{ fontSize: '0.88rem' }}>{b.keyMoment.label}</strong>
                    </div>
                    {b.keyMoment.description && (
                      <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', margin: '4px 0 0 0' }}>
                        {b.keyMoment.description}
                      </p>
                    )}
                  </div>
                )}

                {/* Video short summary if video level */}
                {!b.keyMoment && b.video?.summary?.shortSummary && (
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: 8, lineHeight: 1.6 }}>
                    {b.video.summary.shortSummary}
                  </p>
                )}

                {/* User Study Note Section */}
                <div style={{ marginTop: 12, paddingTop: 10, borderTop: '1px dashed var(--border-subtle)' }}>
                  {editingNoteId === b.id ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                      <textarea
                        className="input"
                        rows={2}
                        value={noteText}
                        onChange={(e) => setNoteText(e.target.value)}
                        placeholder="Add your personal study note or key takeaway..."
                        style={{ fontSize: '0.85rem' }}
                      />
                      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
                        <button className="btn btn-ghost btn-sm" onClick={() => setEditingNoteId(null)}>
                          Cancel
                        </button>
                        <button className="btn btn-primary btn-sm" onClick={() => handleSaveNote(b)} disabled={savingNote}>
                          {savingNote ? 'Saving...' : 'Save Note'}
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
                      <div style={{ fontSize: '0.82rem', color: b.note ? 'var(--text-primary)' : 'var(--text-muted)' }}>
                        <strong style={{ color: 'var(--accent-amber)' }}>📌 Study Note: </strong>
                        {b.note ? b.note : <em>No personal note added yet.</em>}
                      </div>
                      <button
                        className="btn btn-ghost btn-sm"
                        style={{ fontSize: '0.75rem', padding: '2px 8px' }}
                        onClick={() => {
                          setEditingNoteId(b.id);
                          setNoteText(b.note || '');
                        }}
                      >
                        ✏️ {b.note ? 'Edit Note' : 'Add Note'}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
