import React from 'react';
import { KeyMoment } from '@/types/key_moment';
import { API_BASE_URL } from '@/config';

interface KeyMomentsViewerProps {
  moments: KeyMoment[];
  isLoading: boolean;
  onMomentClick: (time: number) => void;
  onGenerateMoments: () => void;
  currentTime: number;
  videoId: string;
  disabled?: boolean;
  canEdit?: boolean;
  onBookmarkMoment?: (momentId: number) => void;
  bookmarkedMomentIds?: number[];
}

export const KeyMomentsViewer: React.FC<KeyMomentsViewerProps> = ({
  moments,
  isLoading,
  onMomentClick,
  onGenerateMoments,
  currentTime,
  videoId,
  disabled = false,
  canEdit = true,
  onBookmarkMoment,
  bookmarkedMomentIds = [],
}) => {
  if (isLoading) {
    return (
      <div className="bg-md-surface-container rounded-xl overflow-hidden flex-1">
        <div className="p-4 border-b border-md-outline-variant bg-md-surface-container-high">
          <h3 className="text-title-large font-semibold text-md-on-surface">Key Moments</h3>
        </div>
        <div className="p-4 space-y-4 animate-pulse">
          {[1, 2, 3].map(i => (
            <div key={i} className="flex gap-4 p-3 rounded-lg border border-md-outline-variant">
              <div className="w-12 h-4 bg-md-surface-container-highest rounded mt-1"></div>
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-md-surface-container-highest rounded w-3/4"></div>
                <div className="h-3 bg-md-surface-container-highest rounded w-full"></div>
              </div>
            </div>
          ))}
          <p className="text-body-small text-md-on-surface-variant text-center italic mt-4">Analyzing transcript for key moments...</p>
        </div>
      </div>
    );
  }

  if (!moments || moments.length === 0) {
    return (
      <div className="bg-md-surface-container rounded-xl overflow-hidden flex-1 flex flex-col">
        <div className="p-4 border-b border-md-outline-variant bg-md-surface-container-high">
          <h3 className="text-title-large font-semibold text-md-on-surface">Key Moments</h3>
        </div>
        <div className="p-6 flex-1 flex flex-col items-center justify-center text-center">
          <svg className="w-12 h-12 text-md-on-surface-variant mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
          <p className="text-body-small text-md-on-surface-variant mb-4">
            {disabled
              ? "The video is still being transcribed. Key moments can be extracted once processing finishes."
              : canEdit
              ? "No key moments have been generated yet."
              : "No key moments have been generated for this video yet."}
          </p>
          {canEdit && (
            <button
              onClick={onGenerateMoments}
              disabled={disabled}
              title={disabled ? "Waiting for transcription to finish" : undefined}
              className="px-4 py-2 bg-md-tertiary hover:opacity-90 text-md-on-tertiary text-label-large font-medium rounded-full transition-colors disabled:opacity-38 disabled:pointer-events-none"
            >
              {disabled ? "Processing video…" : "Extract Highlights"}
            </button>
          )}
        </div>
      </div>
    );
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="bg-md-surface-container rounded-xl overflow-hidden flex-1 flex flex-col h-full">
      <div className="p-4 border-b border-md-outline-variant bg-md-surface-container-high flex flex-wrap justify-between items-center gap-2">
        <h3 className="text-title-large font-semibold text-md-on-surface flex items-center gap-2 min-w-0">
          <svg className="w-5 h-5 text-md-tertiary shrink-0" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
          </svg>
          <span className="truncate">Key Moments</span>
        </h3>
        <div className="flex items-center gap-2 flex-wrap shrink-0">
          {canEdit && (
            <button
              onClick={onGenerateMoments}
              disabled={disabled}
              title={disabled ? "Waiting for transcription to finish" : "Regenerate key moments"}
              className="flex items-center gap-1.5 px-3 py-1.5 text-label-small font-medium text-md-tertiary hover:bg-md-tertiary-container rounded-full transition-colors whitespace-nowrap disabled:opacity-38 disabled:pointer-events-none"
            >
              Regenerate
            </button>
          )}
          <a
            href={`${API_BASE_URL}/key-moments/${videoId}/export`}
            download
            className="flex items-center gap-1.5 px-3 py-1.5 text-label-small font-medium text-md-tertiary hover:bg-md-tertiary-container rounded-full transition-colors whitespace-nowrap"
            title="Download Highlight Report"
          >
            Export Report
          </a>
          <span className="text-label-small font-medium text-md-on-surface-variant bg-md-surface-container-highest px-2 py-1 rounded-full whitespace-nowrap">
            {moments.length} clips
          </span>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {moments.map((moment) => {
          const isActive = currentTime >= moment.start_time && currentTime < moment.end_time;
          return (
            <div
              key={moment.id}
              onClick={() => onMomentClick(moment.start_time)}
              className={`p-3 rounded-lg cursor-pointer transition-all border flex items-start justify-between gap-2 ${
                isActive
                  ? 'bg-md-tertiary-container border-transparent'
                  : 'hover:bg-md-surface-container-high border-transparent'
              }`}
            >
              <div className="flex gap-3 min-w-0">
                <span className={`text-label-small font-mono font-medium mt-0.5 shrink-0 ${isActive ? 'text-md-on-tertiary-container' : 'text-md-on-surface-variant'}`}>
                  {formatTime(moment.start_time)}
                </span>
                <div className="min-w-0">
                  <h4 className={`text-body-small font-semibold mb-1 ${isActive ? 'text-md-on-tertiary-container' : 'text-md-on-surface'}`}>
                    {moment.title}
                  </h4>
                  {moment.description && (
                    <p className={`text-label-small line-clamp-2 ${isActive ? 'text-md-on-tertiary-container' : 'text-md-on-surface-variant'}`}>
                      {moment.description}
                    </p>
                  )}
                </div>
              </div>
              {onBookmarkMoment && (
                <button
                  onClick={(e) => { e.stopPropagation(); onBookmarkMoment(moment.id); }}
                  disabled={bookmarkedMomentIds.includes(moment.id)}
                  title={bookmarkedMomentIds.includes(moment.id) ? 'Highlight bookmarked' : 'Bookmark this highlight'}
                  className={`p-1.5 rounded-full shrink-0 transition-colors ${
                    isActive ? 'text-md-on-tertiary-container' : 'text-md-on-surface-variant'
                  } hover:text-md-primary hover:bg-md-primary-container disabled:text-md-primary`}
                >
                  <svg className="w-3.5 h-3.5" fill={bookmarkedMomentIds.includes(moment.id) ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z"></path></svg>
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
