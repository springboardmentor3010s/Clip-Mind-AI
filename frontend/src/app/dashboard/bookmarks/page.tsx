"use client";

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { authFetch } from '@/lib/authFetch';
import { Bookmark, Trash2, Play } from 'lucide-react';

interface BookmarkItem {
  id: number;
  video_id: number;
  video_title: string | null;
  target_type: string;
  target_id: number | null;
  note: string | null;
  created_at: string;
}

export default function BookmarksPage() {
  const [bookmarks, setBookmarks] = useState<BookmarkItem[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchBookmarks = async () => {
    try {
      const res = await authFetch('/bookmarks');
      if (res.ok) setBookmarks(await res.json());
    } catch (e) {
      console.error('Failed to load bookmarks:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBookmarks();
  }, []);

  const handleRemove = async (id: number) => {
    try {
      const res = await authFetch(`/bookmarks/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setBookmarks((prev) => prev.filter((b) => b.id !== id));
      }
    } catch (e) {
      console.error('Failed to remove bookmark:', e);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 max-w-4xl">
      <header>
        <h1 className="text-headline-medium font-bold text-md-on-surface tracking-tight flex items-center gap-3">
          Bookmarks
          <Bookmark className="text-md-primary h-6 w-6" />
        </h1>
        <p className="text-md-on-surface-variant mt-2">Videos, summaries, and highlights you've saved for later.</p>
      </header>

      {loading ? (
        <p className="text-md-on-surface-variant">Loading...</p>
      ) : bookmarks.length === 0 ? (
        <div className="bg-md-surface-container p-12 rounded-xl text-center space-y-3">
          <Bookmark className="mx-auto text-md-on-surface-variant" size={32} />
          <h3 className="text-title-large font-semibold text-md-on-surface">No bookmarks yet</h3>
          <p className="text-md-on-surface-variant">
            Open a video and use the bookmark button to save it here for later.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {bookmarks.map((b) => (
            <div key={b.id} className="bg-md-surface-container rounded-xl p-5 flex items-center justify-between gap-4">
              <div className="min-w-0">
                <p className="text-title-medium font-semibold text-md-on-surface truncate">
                  {b.video_title || `Video #${b.video_id}`}
                </p>
                <p className="text-label-small text-md-on-surface-variant mt-0.5">
                  {b.target_type === 'key_moment' ? 'Key moment' : b.target_type === 'summary' ? 'Summary' : 'Video'}
                  {b.note && ` — ${b.note}`}
                </p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <Link
                  href={`/dashboard/video/${b.video_id}`}
                  className="flex items-center gap-1.5 px-4 py-2 bg-md-primary hover:opacity-90 text-md-on-primary text-label-large font-semibold rounded-full transition-all"
                >
                  <Play size={14} />
                  Open
                </Link>
                <button
                  onClick={() => handleRemove(b.id)}
                  title="Remove bookmark"
                  className="p-2 rounded-full text-md-on-surface-variant hover:text-md-error hover:bg-md-error-container transition-colors"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
