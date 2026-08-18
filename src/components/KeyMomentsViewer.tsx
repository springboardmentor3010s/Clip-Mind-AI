import React from 'react';
import { KeyMoment } from '../types';
import { Play, Sparkles, Tag, Star, Bookmark } from 'lucide-react';
import { api } from '../services/api';

interface KeyMomentsViewerProps {
  moments: KeyMoment[];
  onSeek: (seconds: number) => void;
  videoId?: string;
}

export const KeyMomentsViewer: React.FC<KeyMomentsViewerProps> = ({ moments, onSeek, videoId }) => {
  if (!moments || moments.length === 0) {
    return (
      <div className="p-8 text-center text-slate-500 border border-dashed border-slate-800 rounded-2xl">
        <Sparkles className="w-8 h-8 mx-auto text-slate-600 mb-2" />
        <p className="text-xs font-semibold">No key moments detected yet.</p>
      </div>
    );
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleBookmark = async (moment: KeyMoment) => {
    if (!videoId) return;
    try {
      await api.createBookmark({
        videoId,
        type: 'HIGHLIGHT',
        contentSnippet: `${moment.title}: ${moment.description}`,
        timestampSec: moment.startTime,
      });
      alert('Key moment saved to your learning bookmarks!');
    } catch (e: any) {
      alert(e.message || 'Failed to bookmark moment');
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between px-1">
        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-indigo-400" />
          <span>Detected Key Moments & Highlights ({moments.length})</span>
        </h3>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {moments.map((m) => (
          <div
            key={m.id}
            className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800/80 hover:border-indigo-500/40 transition-all duration-300 flex flex-col justify-between space-y-4 group"
          >
            <div>
              {/* Header: Timestamp pill & Bookmark */}
              <div className="flex items-center justify-between mb-3">
                <button
                  onClick={() => onSeek(m.startTime)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-600/20 hover:bg-indigo-600/40 border border-indigo-500/30 text-indigo-300 text-xs font-mono font-bold transition-all shadow-md group-hover:scale-105"
                >
                  <Play className="w-3.5 h-3.5 fill-current" />
                  <span>
                    {formatTime(m.startTime)} - {formatTime(m.endTime)}
                  </span>
                </button>

                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1 text-[11px] font-bold text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded-lg">
                    <Star className="w-3 h-3 fill-current" />
                    <span>{m.importanceScore}%</span>
                  </div>

                  <button
                    onClick={() => handleBookmark(m)}
                    className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
                    title="Bookmark this key moment"
                  >
                    <Bookmark className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Title & Description */}
              <h4 className="text-sm font-bold text-white mb-1.5 group-hover:text-indigo-300 transition-colors">
                {m.title}
              </h4>
              <p className="text-xs text-slate-300 leading-relaxed">{m.description}</p>
            </div>

            {/* Keywords */}
            {m.keywords && m.keywords.length > 0 && (
              <div className="pt-3 border-t border-slate-800/60 flex items-center gap-1.5 flex-wrap">
                <Tag className="w-3 h-3 text-slate-500" />
                {m.keywords.map((kw, idx) => (
                  <span
                    key={idx}
                    className="text-[10px] font-semibold text-slate-400 bg-slate-950 px-2 py-0.5 rounded-md border border-slate-800"
                  >
                    #{kw}
                  </span>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};
