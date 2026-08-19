'use client';

import React, { useState, useMemo, useEffect, useRef } from 'react';
import { TranscriptSegment } from '@/types/transcript';
import { API_BASE_URL } from '@/config';

interface TranscriptViewerProps {
  segments: TranscriptSegment[];
  currentTime: number;
  onSegmentClick: (time: number) => void;
  onUpdateSegment?: (id: string, text: string) => void;
  videoId?: string;
  onRegenerate?: () => void;
  isRegenerating?: boolean;
}

type TabType = 'interactive' | 'full';

export const TranscriptViewer: React.FC<TranscriptViewerProps> = ({
  segments,
  currentTime,
  onSegmentClick,
  onUpdateSegment,
  videoId,
  onRegenerate,
  isRegenerating = false,
}) => {
  const [activeTab, setActiveTab] = useState<TabType>('interactive');
  const [searchQuery, setSearchQuery] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');
  const [isExpanded, setIsExpanded] = useState(false);
  const [isExportMenuOpen, setIsExportMenuOpen] = useState(false);
  const activeSegmentRef = useRef<HTMLDivElement>(null);
  const exportMenuRef = useRef<HTMLDivElement>(null);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const filteredSegments = useMemo(() => {
    if (!searchQuery.trim()) return segments;
    const q = searchQuery.toLowerCase();
    return segments.filter((s) => s.text.toLowerCase().includes(q));
  }, [segments, searchQuery]);

  const activeSegmentId = useMemo(() => {
    if (searchQuery.trim()) return null;
    const active = segments.find(
      (s) => currentTime >= s.start_time && currentTime <= s.end_time
    );
    return active?.id ?? null;
  }, [segments, currentTime, searchQuery]);

  useEffect(() => {
    if (activeSegmentRef.current && !searchQuery.trim()) {
      activeSegmentRef.current.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }, [activeSegmentId, searchQuery]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (exportMenuRef.current && !exportMenuRef.current.contains(e.target as Node)) {
        setIsExportMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const trackExport = (format: string) => {
    fetch(`${API_BASE_URL}/analytics/event`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        video_id: videoId ? Number(videoId) : undefined,
        event_type: 'export_txt',
        metadata_val: `transcript_${format}`,
      }),
    }).catch(() => {});
  };

  const downloadFile = (content: string, filename: string, mimeType: string) => {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const formatSrtTimestamp = (seconds: number) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    const ms = Math.round((seconds - Math.floor(seconds)) * 1000);
    return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')},${ms.toString().padStart(3, '0')}`;
  };

  const handleExportTimestampedTxt = () => {
    const lines = segments.map(
      (s) => `[${formatTime(s.start_time)} - ${formatTime(s.end_time)}]  ${s.text}`
    );
    downloadFile(lines.join('\n'), `transcript_video_${videoId || 'unknown'}.txt`, 'text/plain');
    trackExport('timestamped_txt');
    setIsExportMenuOpen(false);
  };

  const handleExportSrt = () => {
    const lines = segments.map((s, idx) =>
      `${idx + 1}\n${formatSrtTimestamp(s.start_time)} --> ${formatSrtTimestamp(s.end_time)}\n${s.text}\n`
    );
    downloadFile(lines.join('\n'), `transcript_video_${videoId || 'unknown'}.srt`, 'application/x-subrip');
    trackExport('srt');
    setIsExportMenuOpen(false);
  };

  const handleExportFullTxt = () => {
    const text = segments.map((s) => s.text).join(' ');
    downloadFile(text, `transcript_video_${videoId || 'unknown'}_full.txt`, 'text/plain');
    trackExport('full_txt');
    setIsExportMenuOpen(false);
  };

  const tabs: { id: TabType; label: string; icon: React.ReactNode }[] = [
    {
      id: 'interactive',
      label: 'Timestamped',
      icon: (
        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
    },
    {
      id: 'full',
      label: 'Full Text',
      icon: (
        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h10" />
        </svg>
      ),
    },
  ];

  return (
    <div className="bg-md-surface-container rounded-xl overflow-hidden">
      {/* Header */}
      <div className="px-5 pt-5 pb-0">
        <div className="flex items-center justify-between flex-wrap gap-2 mb-4">
          <div className="flex items-center gap-2 flex-wrap min-w-0">
            <div className="w-7 h-7 rounded-lg bg-md-primary-container flex items-center justify-center shrink-0">
              <svg className="w-4 h-4 text-md-on-primary-container" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd" />
              </svg>
            </div>
            <h3 className="font-semibold text-md-on-surface">Transcript</h3>
            {segments.length > 0 && (
              <span className="px-2 py-0.5 text-label-small rounded-full bg-md-surface-container-highest text-md-on-surface-variant font-mono whitespace-nowrap">
                {segments.length} segments
              </span>
            )}
          </div>
          {segments.length > 0 && (
            <div className="flex items-center gap-2 shrink-0">
              {onRegenerate && (
                <button
                  onClick={onRegenerate}
                  disabled={isRegenerating}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-label-small font-medium text-md-on-surface-variant hover:text-md-on-surface bg-md-surface-container-highest hover:bg-md-surface-container-high rounded-full transition-all disabled:opacity-38 disabled:pointer-events-none"
                  title="Regenerate transcript"
                >
                  <svg className={`w-3.5 h-3.5 ${isRegenerating ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  {isRegenerating ? 'Regenerating…' : 'Regenerate'}
                </button>
              )}
              <button
                onClick={() => setIsExpanded((v) => !v)}
                className="flex items-center gap-1.5 px-3 py-1.5 text-label-small font-medium text-md-on-surface-variant hover:text-md-on-surface bg-md-surface-container-highest hover:bg-md-surface-container-high rounded-full transition-all"
                title={isExpanded ? 'Collapse' : 'Expand'}
              >
                {isExpanded ? (
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 15L4 20m0-5h5v5M15 9l5-5m0 5h-5V4" />
                  </svg>
                ) : (
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
                  </svg>
                )}
                {isExpanded ? 'Collapse' : 'Expand'}
              </button>
              <div className="relative" ref={exportMenuRef}>
                <button
                  onClick={() => setIsExportMenuOpen((v) => !v)}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-label-small font-medium text-md-on-surface-variant hover:text-md-on-surface bg-md-surface-container-highest hover:bg-md-surface-container-high rounded-full transition-all"
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                  Export
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                {isExportMenuOpen && (
                  <div className="absolute right-0 mt-1 w-56 py-1 bg-md-surface-container-highest border border-md-outline-variant rounded-lg shadow-xl z-20">
                    <button
                      onClick={handleExportTimestampedTxt}
                      className="w-full text-left px-3 py-2 text-label-small text-md-on-surface-variant hover:bg-md-surface-container-high hover:text-md-on-surface transition-colors"
                    >
                      Timestamped (.txt)
                    </button>
                    <button
                      onClick={handleExportSrt}
                      className="w-full text-left px-3 py-2 text-label-small text-md-on-surface-variant hover:bg-md-surface-container-high hover:text-md-on-surface transition-colors"
                    >
                      Timestamped (.srt)
                    </button>
                    <button
                      onClick={handleExportFullTxt}
                      className="w-full text-left px-3 py-2 text-label-small text-md-on-surface-variant hover:bg-md-surface-container-high hover:text-md-on-surface transition-colors"
                    >
                      Full Text (.txt)
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Tabs */}
        <div className="flex gap-1 bg-md-surface-container-highest p-1 rounded-full">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 px-3 text-label-small font-semibold rounded-full transition-all ${
                activeTab === tab.id
                  ? 'bg-md-primary text-md-on-primary'
                  : 'text-md-on-surface-variant hover:text-md-on-surface'
              }`}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Search bar — shown in Timestamped tab only */}
      {activeTab === 'interactive' && (
        <div className="px-5 pt-4 pb-2">
          <div className="relative">
            <input
              type="text"
              placeholder="Search transcript..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-md-surface-container-highest border border-md-outline-variant rounded-full text-body-small text-md-on-surface placeholder:text-md-on-surface-variant focus:outline-none focus:ring-2 focus:ring-md-primary/50 focus:border-md-primary transition-all"
            />
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-md-on-surface-variant" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
        </div>
      )}

      {/* Content */}
      <div className={`px-5 pt-3 pb-5 ${isExpanded ? '' : 'max-h-[420px] overflow-y-auto'}`}>
        {segments.length === 0 ? (
          <div className="py-12 text-center">
            <div className="w-12 h-12 rounded-2xl bg-md-surface-container-highest flex items-center justify-center mx-auto mb-3">
              <svg className="w-6 h-6 text-md-on-surface-variant" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <p className="text-md-on-surface-variant text-body-small">Transcript not available yet.</p>
            <p className="text-md-on-surface-variant/70 text-label-small mt-1">Processing may still be in progress.</p>
          </div>
        ) : (
          <>
            {/* ── TIMESTAMPED + INTERACTIVE TAB ── */}
            {activeTab === 'interactive' && (
              <div className="space-y-1">
                {filteredSegments.length === 0 ? (
                  <p className="text-md-on-surface-variant text-body-small text-center py-8">No matches found.</p>
                ) : (
                  filteredSegments.map((segment) => {
                    const isActive = segment.id === activeSegmentId;
                    const isEditingThis = editingId === segment.id;

                    return (
                      <div
                        key={segment.id}
                        ref={isActive ? activeSegmentRef : null}
                        onClick={() => !isEditingThis && onSegmentClick(segment.start_time)}
                        className={`group flex gap-3 px-3 py-2.5 rounded-xl cursor-pointer transition-all relative ${
                          isEditingThis
                            ? 'bg-md-tertiary-container/60 border border-md-tertiary/30'
                            : isActive
                            ? 'bg-md-primary-container/60 border border-md-primary/30'
                            : 'hover:bg-md-surface-container-high border border-transparent'
                        }`}
                      >
                        {/* Timestamp badge */}
                        <button
                          onClick={(e) => { e.stopPropagation(); onSegmentClick(segment.start_time); }}
                          className={`text-label-small font-mono font-semibold whitespace-nowrap mt-0.5 px-1.5 py-0.5 rounded h-fit shrink-0 transition-all ${
                            isActive && !isEditingThis
                              ? 'text-md-primary bg-md-primary-container hover:bg-md-primary-container/80'
                              : 'text-md-on-surface-variant bg-md-surface-container-highest hover:text-md-primary hover:bg-md-primary-container'
                          }`}
                          title={`Seek to ${formatTime(segment.start_time)}`}
                        >
                          {formatTime(segment.start_time)}
                        </button>

                        <div className="flex-1 relative">
                          {isEditingThis ? (
                            <div className="flex flex-col gap-2">
                              <textarea
                                className="w-full p-2 text-body-small rounded-lg bg-md-surface-container-highest border border-md-tertiary/40 focus:outline-none focus:ring-2 focus:ring-md-tertiary/50 text-md-on-surface resize-none"
                                rows={3}
                                value={editValue}
                                onChange={(e) => setEditValue(e.target.value)}
                                autoFocus
                              />
                              <div className="flex justify-end gap-2">
                                <button
                                  onClick={(e) => { e.stopPropagation(); setEditingId(null); }}
                                  className="px-3 py-1 text-label-small text-md-on-surface-variant hover:text-md-on-surface bg-md-surface-container-highest hover:bg-md-surface-container-high rounded-lg transition-all"
                                >
                                  Cancel
                                </button>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    if (onUpdateSegment) onUpdateSegment(segment.id, editValue);
                                    setEditingId(null);
                                  }}
                                  className="px-3 py-1 text-label-small bg-md-tertiary text-md-on-tertiary font-semibold rounded-lg transition-all hover:opacity-90"
                                >
                                  Save
                                </button>
                              </div>
                            </div>
                          ) : (
                            <p className={`text-body-small leading-relaxed ${isActive ? 'text-md-on-surface font-medium' : 'text-md-on-surface-variant'}`}>
                              {segment.text}
                            </p>
                          )}

                          {/* Edit button — appears on hover when not editing */}
                          {onUpdateSegment && !isEditingThis && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setEditingId(segment.id);
                                setEditValue(segment.text);
                              }}
                              className="absolute -top-1 -right-1 p-1 bg-md-surface-container-highest hover:bg-md-primary-container rounded-lg text-md-on-surface-variant hover:text-md-primary opacity-0 group-hover:opacity-100 transition-all"
                              title="Edit this segment"
                            >
                              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                              </svg>
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            )}

            {/* ── FULL TEXT TAB ── */}
            {activeTab === 'full' && (
              <p className="text-md-on-surface-variant text-body-small leading-8 whitespace-pre-wrap">
                {segments.map((s) => s.text).join(' ')}
              </p>
            )}
          </>
        )}
      </div>
    </div>
  );
};
