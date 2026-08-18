import React, { useEffect, useMemo, useState } from 'react';
import {
  Bookmark,
  Search,
  RefreshCw,
  Video,
  Clock,
  FileText,
  Sparkles,
  Zap,
  AlertCircle,
} from 'lucide-react';

import { api } from '../services/api';

interface BookmarkItem {
  id: string;
  videoId: string;
  type: string;
  contentSnippet: string;
  timestampSec?: number | null;
}

const formatTime = (seconds?: number | null) => {
  if (seconds === undefined || seconds === null) {
    return null;
  }

  const total = Math.max(0, Math.floor(seconds));
  const minutes = Math.floor(total / 60);
  const secs = total % 60;

  return `${minutes}:${String(secs).padStart(2, '0')}`;
};

const getTypeIcon = (type: string) => {
  const normalized = type.toUpperCase();

  if (normalized === 'TRANSCRIPT') {
    return <FileText className="w-4 h-4 text-cyan-400" />;
  }

  if (normalized === 'SUMMARY') {
    return <Sparkles className="w-4 h-4 text-purple-400" />;
  }

  if (normalized === 'HIGHLIGHT') {
    return <Zap className="w-4 h-4 text-yellow-400" />;
  }

  return <Bookmark className="w-4 h-4 text-blue-400" />;
};

export const BookmarksPage: React.FC = () => {
  const [bookmarks, setBookmarks] = useState<BookmarkItem[]>([]);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('ALL');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadBookmarks = async () => {
    try {
      setLoading(true);
      setError(null);

      const data = await api.getBookmarks();

      setBookmarks(
        Array.isArray(data)
          ? (data as BookmarkItem[])
          : []
      );
    } catch (err: any) {
      console.error(
        '[BOOKMARKS] Failed to load:',
        err
      );

      setError(
        err?.message ||
          'Unable to load bookmarks.'
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBookmarks();
  }, []);

  const filteredBookmarks = useMemo(() => {
    const query = search.trim().toLowerCase();

    return bookmarks.filter((bookmark) => {
      const matchesType =
        filter === 'ALL' ||
        bookmark.type.toUpperCase() === filter;

      const matchesSearch =
        !query ||
        bookmark.contentSnippet
          ?.toLowerCase()
          .includes(query) ||
        bookmark.videoId
          ?.toLowerCase()
          .includes(query);

      return matchesType && matchesSearch;
    });
  }, [bookmarks, search, filter]);

  return (
    <div className="space-y-8 pb-16">

      {/* HEADER */}
      <div>
        <div className="inline-flex items-center gap-2 rounded-full border border-blue-500/20 bg-blue-500/10 px-3 py-1.5 mb-4">
          <Bookmark className="w-3.5 h-3.5 text-blue-400" />

          <span className="text-[10px] font-black uppercase tracking-wider text-blue-300">
            Saved Learning
          </span>
        </div>

        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-black text-white">
              Bookmarks
            </h1>

            <p className="text-xs text-slate-400 mt-2">
              Save important moments from your videos for quick access.
            </p>
          </div>

          <button
            type="button"
            onClick={loadBookmarks}
            disabled={loading}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-800 bg-slate-900/70 px-4 py-3 text-xs font-bold text-slate-300 hover:bg-slate-800 disabled:opacity-50"
          >
            <RefreshCw
              className={`w-4 h-4 ${
                loading ? 'animate-spin' : ''
              }`}
            />

            Refresh
          </button>
        </div>
      </div>

      {/* ERROR */}
      {error && (
        <div className="rounded-2xl border border-red-500/30 bg-red-500/10 p-4">
          <div className="flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-red-400" />

            <div>
              <p className="text-xs font-bold text-red-300">
                Unable to load bookmarks
              </p>

              <p className="text-[10px] text-red-400/80 mt-1">
                {error}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* STATS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

        <Stat
          label="Total Bookmarks"
          value={String(bookmarks.length)}
          detail="Saved items"
        />

        <Stat
          label="Transcript"
          value={String(
            bookmarks.filter(
              (b) =>
                b.type.toUpperCase() ===
                'TRANSCRIPT'
            ).length
          )}
          detail="Saved transcript moments"
        />

        <Stat
          label="Highlights"
          value={String(
            bookmarks.filter(
              (b) =>
                b.type.toUpperCase() ===
                'HIGHLIGHT'
            ).length
          )}
          detail="Saved key moments"
        />

      </div>

      {/* SEARCH + FILTER */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4">

        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-600" />

          <input
            type="text"
            value={search}
            onChange={(event) =>
              setSearch(event.target.value)
            }
            placeholder="Search your bookmarks..."
            className="w-full rounded-xl border border-slate-800 bg-slate-950/70 pl-11 pr-4 py-3 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-blue-500/50"
          />
        </div>

        <div className="flex flex-wrap gap-2 mt-4">

          {[
            ['ALL', 'All'],
            ['TRANSCRIPT', 'Transcripts'],
            ['SUMMARY', 'Summaries'],
            ['HIGHLIGHT', 'Highlights'],
          ].map(([value, label]) => (
            <button
              key={value}
              type="button"
              onClick={() => setFilter(value)}
              className={`rounded-lg px-3 py-2 text-[10px] font-bold transition ${
                filter === value
                  ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                  : 'bg-slate-950/60 text-slate-500 border border-slate-800 hover:text-slate-300'
              }`}
            >
              {label}
            </button>
          ))}

        </div>
      </div>

      {/* CONTENT */}
      {loading ? (
        <div className="py-20 text-center">
          <RefreshCw className="w-7 h-7 mx-auto text-blue-400 animate-spin" />

          <p className="text-xs text-slate-500 mt-3">
            Loading bookmarks...
          </p>
        </div>
      ) : filteredBookmarks.length === 0 ? (
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 py-20 text-center">

          <Bookmark className="w-12 h-12 mx-auto text-slate-700 mb-4" />

          <h3 className="text-sm font-bold text-slate-300">
            {bookmarks.length === 0
              ? 'No bookmarks yet'
              : 'No bookmarks found'}
          </h3>

          <p className="text-xs text-slate-600 mt-2">
            {bookmarks.length === 0
              ? 'Bookmark important moments while reviewing your videos.'
              : 'Try another search or filter.'}
          </p>

        </div>
      ) : (
        <div className="space-y-3">

          {filteredBookmarks.map((bookmark) => (

            <div
              key={bookmark.id}
              className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 hover:border-slate-700 transition"
            >

              <div className="flex items-start gap-4">

                {/* ICON */}
                <div className="w-10 h-10 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-center shrink-0">
                  {getTypeIcon(bookmark.type)}
                </div>

                {/* CONTENT */}
                <div className="flex-1 min-w-0">

                  <div className="flex flex-wrap items-center gap-2">

                    <span className="text-[9px] uppercase tracking-wider font-black text-slate-500">
                      {bookmark.type}
                    </span>

                    {formatTime(
                      bookmark.timestampSec
                    ) && (
                      <span className="inline-flex items-center gap-1 text-[9px] text-slate-500">
                        <Clock className="w-3 h-3" />
                        {formatTime(
                          bookmark.timestampSec
                        )}
                      </span>
                    )}

                  </div>

                  <p className="text-sm text-slate-200 leading-6 mt-2">
                    {bookmark.contentSnippet}
                  </p>

                  <div className="flex items-center gap-2 mt-3 text-[9px] text-slate-600">
                    <Video className="w-3 h-3" />

                    Video ID:
                    <span className="text-slate-500">
                      {bookmark.videoId}
                    </span>
                  </div>

                </div>

              </div>

            </div>

          ))}

        </div>
      )}

    </div>
  );
};

const Stat: React.FC<{
  label: string;
  value: string;
  detail: string;
}> = ({
  label,
  value,
  detail,
}) => (
  <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5">

    <p className="text-[10px] uppercase tracking-wider font-bold text-slate-500">
      {label}
    </p>

    <p className="text-2xl font-black text-white mt-2">
      {value}
    </p>

    <p className="text-[10px] text-slate-600 mt-1">
      {detail}
    </p>

  </div>
);

export default BookmarksPage;
