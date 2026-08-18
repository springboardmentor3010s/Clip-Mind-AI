import React, { useState } from 'react';
import { VideoTranscript, TranscriptSegment } from '../types';
import { Search, Download, Copy, Check, Edit2, Save, PlayCircle, FileText } from 'lucide-react';

interface TranscriptViewerProps {
  transcript: VideoTranscript | null;
  onSeek: (seconds: number) => void;
  canEdit?: boolean;
}

export const TranscriptViewer: React.FC<TranscriptViewerProps> = ({ transcript, onSeek, canEdit = false }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [copied, setCopied] = useState(false);
  const [editingSegId, setEditingSegId] = useState<string | null>(null);
  const [editText, setEditText] = useState('');
  const [segments, setSegments] = useState<TranscriptSegment[]>(transcript?.segments || []);

  if (!transcript) {
    return (
      <div className="p-8 text-center text-slate-500 border border-dashed border-slate-800 rounded-2xl">
        <FileText className="w-8 h-8 mx-auto text-slate-600 mb-2" />
        <p className="text-xs font-semibold">No transcript generated yet.</p>
      </div>
    );
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const filteredSegments = (segments.length > 0 ? segments : transcript.segments).filter((seg) =>
    seg.text.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleCopy = () => {
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(transcript.fullText).catch(() => {
          fallbackCopy(transcript.fullText);
        });
      } else {
        fallbackCopy(transcript.fullText);
      }
    } catch (_) {
      fallbackCopy(transcript.fullText);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const fallbackCopy = (text: string) => {
    try {
      const textarea = document.createElement('textarea');
      textarea.value = text;
      textarea.style.position = 'fixed';
      textarea.style.opacity = '0';
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
    } catch (e) {
      console.warn('Fallback copy failed', e);
    }
  };

  const handleDownload = () => {
    const element = document.createElement('a');
    const file = new Blob([transcript.fullText], { type: 'text/plain' });
    element.href = URL.createObjectURL(file);
    element.download = `transcript_${transcript.videoId}.txt`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  const handleSaveEdit = (segId: string) => {
    setSegments((prev) =>
      prev.map((s) => (s.id === segId ? { ...s, text: editText } : s))
    );
    setEditingSegId(null);
  };

  return (
    <div className="space-y-4">
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-slate-900/80 p-3 rounded-2xl border border-slate-800">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search words in transcript..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
          />
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleCopy}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 transition-colors"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? 'Copied' : 'Copy'}</span>
          </button>

          <button
            onClick={handleDownload}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-600/20 hover:bg-indigo-600/30 border border-indigo-500/30 text-xs font-semibold text-indigo-300 transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Download</span>
          </button>
        </div>
      </div>

      {/* Segments List */}
      <div className="space-y-2 max-h-[500px] overflow-y-auto pr-1">
        {filteredSegments.map((seg) => {
          const isEditing = editingSegId === seg.id;

          return (
            <div
              key={seg.id}
              className="p-3.5 rounded-xl bg-slate-900/40 border border-slate-800/80 hover:border-slate-700 transition-all group flex items-start gap-3"
            >
              {/* Seek Button */}
              <button
                onClick={() => onSeek(seg.start)}
                className="flex items-center gap-1 px-2 py-1 rounded-lg bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400 text-xs font-mono font-bold transition-colors flex-shrink-0 mt-0.5"
                title="Jump to video timestamp"
              >
                <PlayCircle className="w-3.5 h-3.5" />
                <span>{formatTime(seg.start)}</span>
              </button>

              {/* Segment Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                    {seg.speaker || 'Speaker'} • {(seg.confidence * 100).toFixed(0)}% Confidence
                  </span>

                  {canEdit && !isEditing && (
                    <button
                      onClick={() => {
                        setEditingSegId(seg.id);
                        setEditText(seg.text);
                      }}
                      className="text-slate-500 hover:text-indigo-400 p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                      title="Edit segment text"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                {isEditing ? (
                  <div className="flex items-center gap-2 mt-1">
                    <input
                      type="text"
                      value={editText}
                      onChange={(e) => setEditText(e.target.value)}
                      className="flex-1 px-3 py-1 rounded-lg bg-slate-950 border border-indigo-500 text-xs text-white focus:outline-none"
                    />
                    <button
                      onClick={() => handleSaveEdit(seg.id)}
                      className="p-1.5 rounded-lg bg-emerald-600 text-white text-xs font-bold"
                    >
                      <Save className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ) : (
                  <p className="text-xs text-slate-200 leading-relaxed">{seg.text}</p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
