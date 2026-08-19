import React, { useState, useEffect } from 'react';
import { API_BASE_URL } from '@/config';
import { Summary } from '@/types/summary';

interface SummaryViewerProps {
  summary: Summary | null;
  isLoading: boolean;
  onGenerateSummary: () => void;
  onUpdateSummary?: (updatedText: string, isDetailed: boolean) => void;
  disabled?: boolean;
  canEdit?: boolean;
  onBookmark?: () => void;
  isBookmarked?: boolean;
}

export const SummaryViewer: React.FC<SummaryViewerProps> = ({
  summary,
  isLoading,
  onGenerateSummary,
  onUpdateSummary,
  disabled = false,
  canEdit = true,
  onBookmark,
  isBookmarked = false,
}) => {
  const [activeTab, setActiveTab] = useState<'short' | 'detailed'>('short');
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState("");

  const activeContent = summary ? (activeTab === 'short' ? summary.short_summary : summary.detailed_summary) : null;

  // Reset edit value when switching tabs or when summary changes
  useEffect(() => {
    setEditValue(activeContent || "");
    setIsEditing(false);
  }, [activeTab, summary, activeContent]);

  const handleSave = () => {
    if (onUpdateSummary) {
      onUpdateSummary(editValue, activeTab === 'detailed');
    }
    setIsEditing(false);
  };

  if (isLoading) {
    return (
      <div className="bg-md-surface-container p-6 rounded-xl flex-1 h-full flex flex-col">
        <h2 className="text-title-large font-semibold mb-4 text-md-on-surface">Summary</h2>
        <div className="animate-pulse space-y-4 flex-1">
          <div className="h-4 bg-md-surface-container-highest rounded w-3/4"></div>
          <div className="h-4 bg-md-surface-container-highest rounded w-full"></div>
          <div className="h-4 bg-md-surface-container-highest rounded w-5/6"></div>
          <div className="h-4 bg-md-surface-container-highest rounded w-2/3"></div>
        </div>
        <p className="text-body-small text-md-on-surface-variant mt-4 italic animate-pulse">Generating AI summary... This may take a few moments.</p>
      </div>
    );
  }

  if (!summary) {
    return (
      <div className="bg-md-surface-container p-6 rounded-xl flex-1 h-full flex flex-col items-center justify-center text-center">
        <h2 className="text-title-large font-semibold mb-2 text-md-on-surface">No Summary Available</h2>
        <p className="text-body-small text-md-on-surface-variant mb-6 max-w-sm">
          {disabled
            ? "The video is still being transcribed. Summary generation will be available once processing finishes."
            : canEdit
            ? "A summary has not been generated for this video yet. Click the button below to analyze the transcript and generate one."
            : "A summary has not been generated for this video yet."}
        </p>
        {canEdit && (
          <button
            onClick={onGenerateSummary}
            disabled={disabled}
            title={disabled ? "Waiting for transcription to finish" : undefined}
            className="px-4 py-2 bg-md-primary hover:opacity-90 text-md-on-primary font-medium rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-md-primary focus:ring-offset-2 focus:ring-offset-md-surface-container disabled:opacity-38 disabled:pointer-events-none"
          >
            {disabled ? "Processing video…" : "Generate Summary"}
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="bg-md-surface-container p-0 rounded-xl flex-1 flex flex-col h-full overflow-hidden">
      <div className="flex justify-between items-center border-b border-md-outline-variant bg-md-surface-container-high">
        <div className="flex">
          <button
            onClick={() => setActiveTab('short')}
            className={`py-3 px-4 text-label-large font-medium transition-colors ${
              activeTab === 'short'
                ? 'text-md-primary border-b-2 border-md-primary bg-md-surface-container'
                : 'text-md-on-surface-variant hover:text-md-on-surface'
            }`}
          >
            Quick Summary
          </button>
          <button
            onClick={() => setActiveTab('detailed')}
            className={`py-3 px-4 text-label-large font-medium transition-colors ${
              activeTab === 'detailed'
                ? 'text-md-primary border-b-2 border-md-primary bg-md-surface-container'
                : 'text-md-on-surface-variant hover:text-md-on-surface'
            }`}
          >
            Detailed Notes
          </button>
        </div>

        {summary && (
          <div className="mr-4 flex items-center gap-2">
            {onBookmark && (
              <button
                onClick={onBookmark}
                disabled={isBookmarked}
                title={isBookmarked ? 'Summary bookmarked' : 'Bookmark this summary'}
                className="flex items-center gap-1.5 px-3 py-1.5 text-label-small font-medium text-md-on-surface bg-md-surface-container border border-md-outline-variant rounded-full hover:bg-md-surface-container-highest transition-colors disabled:text-md-primary"
              >
                <svg className="w-3.5 h-3.5" fill={isBookmarked ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z"></path></svg>
                {isBookmarked ? 'Bookmarked' : 'Bookmark'}
              </button>
            )}
            {canEdit && (
              <button
                onClick={onGenerateSummary}
                disabled={disabled}
                title={disabled ? "Waiting for transcription to finish" : "Regenerate summary"}
                className="flex items-center gap-1.5 px-3 py-1.5 text-label-small font-medium text-md-on-surface bg-md-surface-container border border-md-outline-variant rounded-full hover:bg-md-surface-container-highest transition-colors focus:outline-none focus:ring-2 focus:ring-md-primary disabled:opacity-38 disabled:pointer-events-none"
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path></svg>
                Regenerate
              </button>
            )}
            <a
              href={`${API_BASE_URL}/summary/${summary.video_id}/export?type=${activeTab}`}
              download
              className="flex items-center gap-1.5 px-3 py-1.5 text-label-small font-medium text-md-on-surface bg-md-surface-container border border-md-outline-variant rounded-full hover:bg-md-surface-container-highest transition-colors focus:outline-none focus:ring-2 focus:ring-md-primary"
              title="Download Summary as TXT"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path></svg>
              Export TXT
            </a>
          </div>
        )}
      </div>

      <div className="p-6 overflow-y-auto flex-1 text-md-on-surface leading-relaxed text-body-medium flex flex-col relative group">
        {onUpdateSummary && !isEditing && activeContent && (
          <button
            onClick={() => setIsEditing(true)}
            className="absolute top-4 right-4 p-2 bg-md-surface-container-highest rounded-full text-md-on-surface-variant hover:text-md-primary opacity-0 group-hover:opacity-100 transition-opacity"
            title="Edit Summary"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"></path></svg>
          </button>
        )}

        {isEditing ? (
          <div className="flex-1 flex flex-col h-full">
            <textarea
              className="flex-1 w-full p-3 border-b-2 border-md-primary rounded-t-md focus:outline-none bg-md-surface-container-highest text-md-on-surface resize-none"
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
            />
            <div className="mt-4 flex justify-end gap-2">
              <button
                onClick={() => setIsEditing(false)}
                className="px-3 py-1.5 text-body-small text-md-on-surface-variant hover:bg-md-surface-container-highest rounded-full transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                className="px-3 py-1.5 text-body-small bg-md-primary hover:opacity-90 text-md-on-primary font-medium rounded-full transition-colors"
              >
                Save Changes
              </button>
            </div>
          </div>
        ) : activeContent ? (
          <p className="whitespace-pre-wrap">{activeContent}</p>
        ) : (
          <p className="italic text-md-on-surface-variant">Content not available.</p>
        )}
      </div>
    </div>
  );
};
