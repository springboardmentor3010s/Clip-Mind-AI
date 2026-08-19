'use client';

import { API_BASE_URL } from '@/config';
import { authFetch } from '@/lib/authFetch';
import React, { useState, useEffect, useRef } from 'react';
import { useParams } from 'next/navigation';
import { VideoPlayer } from '@/components/video/VideoPlayer';
import { TranscriptViewer } from '@/components/video/TranscriptViewer';
import { SummaryViewer } from '@/components/video/SummaryViewer';
import { KeyMomentsViewer } from '@/components/video/KeyMomentsViewer';
import { KeywordTags } from '@/components/video/KeywordTags';
import { TranscriptSegment } from '@/types/transcript';
import { Summary } from '@/types/summary';
import { KeyMoment } from '@/types/key_moment';
import { useAuth } from '@/context/AuthContext';
import Link from 'next/link';
import { Eye, Download, Tag, Star, Clock, Pencil, Check, X, Bookmark, Share2, GraduationCap } from 'lucide-react';

export default function VideoDetailsPage() {
  const params = useParams();
  const videoId = params?.id as string;
  const { token, user } = useAuth();
  const canManageContent = (user as any)?.role !== 'Learner';
  const hasTrackedViewRef = useRef(false);

  const [currentTime, setCurrentTime] = useState(0);
  const [seekToTime, setSeekToTime] = useState<number | null>(null);

  const [segments, setSegments] = useState<TranscriptSegment[]>([]);
  const [keywords, setKeywords] = useState<string[]>([]);
  const [isLoadingTranscript, setIsLoadingTranscript] = useState(true);

  const [summary, setSummary] = useState<Summary | null>(null);
  const [isLoadingSummary, setIsLoadingSummary] = useState(false);

  const [keyMoments, setKeyMoments] = useState<KeyMoment[]>([]);
  const [isLoadingMoments, setIsLoadingMoments] = useState(false);

  const [videoUrl, setVideoUrl] = useState('');
  const [videoTitle, setVideoTitle] = useState('Video');
  const [videoFilename, setVideoFilename] = useState('');
  const [videoStatus, setVideoStatus] = useState('PROCESSING');
  const [isRenaming, setIsRenaming] = useState(false);
  const [renameValue, setRenameValue] = useState('');
  const [savingRename, setSavingRename] = useState(false);

  interface VideoInsights {
    views: number;
    unique_viewers: number;
    exports: number;
    keyword_count: number;
    key_moment_count: number;
    processing_time_seconds: number | null;
  }
  const [insights, setInsights] = useState<VideoInsights | null>(null);
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [isSummaryBookmarked, setIsSummaryBookmarked] = useState(false);
  const [bookmarkedMomentIds, setBookmarkedMomentIds] = useState<number[]>([]);
  const [isSharing, setIsSharing] = useState(false);
  const [shareUrl, setShareUrl] = useState<string | null>(null);

  useEffect(() => {
    const fetchVideoData = async () => {
      try {
        const [videoRes, transcriptRes, summaryRes, momentsRes] = await Promise.all([
          fetch(`${API_BASE_URL}/upload/video/${videoId}`),
          fetch(`${API_BASE_URL}/transcript/${videoId}`),
          fetch(`${API_BASE_URL}/summary/${videoId}`),
          fetch(`${API_BASE_URL}/key-moments/${videoId}`)
        ]);

        if (videoRes.ok) {
          const videoData = await videoRes.json();
          setVideoTitle(videoData.title || `Video #${videoId}`);
          setVideoFilename(videoData.filename || '');
          setVideoStatus(videoData.status || 'PROCESSING');
          if (videoData.url) {
            setVideoUrl(videoData.url);
          }
        }

        if (transcriptRes.ok) {
          const transcriptData = await transcriptRes.json();
          setSegments(transcriptData.segments || []);
          setKeywords(transcriptData.keywords || []);
        }
        
        if (summaryRes.ok) {
          const summaryData = await summaryRes.json();
          setSummary(summaryData);
        }
        
        if (momentsRes.ok) {
          const momentsData = await momentsRes.json();
          setKeyMoments(momentsData);
        }
      } catch (e) {
        console.error("Failed to fetch video data:", e);
      } finally {
        setIsLoadingTranscript(false);
      }
    };

    const fetchInsights = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/analytics/video/${videoId}`);
        if (res.ok) {
          setInsights(await res.json());
        }
      } catch (e) {
        console.error("Failed to fetch video insights:", e);
      }
    };

    if (videoId) {
      fetchVideoData();
      fetchInsights();
    }
  }, [videoId]);

  useEffect(() => {
    hasTrackedViewRef.current = false;
  }, [videoId]);

  // Poll the video's processing status while it's still uploading/processing,
  // so "Generate Summary" / "Extract Highlights" unlock as soon as it's ready
  // instead of only reflecting whatever status was true at page load.
  useEffect(() => {
    if (!videoId) return;
    if (videoStatus === 'COMPLETED' || videoStatus === 'FAILED') return;

    const interval = setInterval(async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/upload/video/${videoId}`);
        if (res.ok) {
          const data = await res.json();
          setVideoStatus(data.status || 'PROCESSING');
          if (data.url) setVideoUrl(data.url);
          if (data.status === 'COMPLETED') {
            const transcriptRes = await fetch(`${API_BASE_URL}/transcript/${videoId}`);
            if (transcriptRes.ok) {
              const transcriptData = await transcriptRes.json();
              setSegments(transcriptData.segments || []);
              setKeywords(transcriptData.keywords || []);
            }
          }
        }
      } catch (e) {
        console.error("Failed to poll video status:", e);
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [videoId, videoStatus]);

  const isProcessing = videoStatus !== 'COMPLETED';

  const handleVideoPlay = async () => {
    if (hasTrackedViewRef.current) return;
    hasTrackedViewRef.current = true;
    try {
      await fetch(`${API_BASE_URL}/analytics/event`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ video_id: parseInt(videoId), event_type: 'video_view' }),
      });
    } catch (e) {
      console.error("Failed to track video view:", e);
    }
  };

  const createBookmark = async (targetType: 'video' | 'summary' | 'key_moment', targetId?: number) => {
    try {
      const res = await authFetch('/bookmarks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ video_id: parseInt(videoId), target_type: targetType, target_id: targetId }),
      });
      if (res.ok) return true;
      if (res.status === 401) alert('Sign in to bookmark this.');
      return false;
    } catch (e) {
      console.error('Failed to create bookmark:', e);
      return false;
    }
  };

  const handleBookmark = async () => {
    if (await createBookmark('video')) setIsBookmarked(true);
  };

  const handleBookmarkSummary = async () => {
    if (await createBookmark('summary')) setIsSummaryBookmarked(true);
  };

  const handleBookmarkMoment = async (momentId: number) => {
    if (await createBookmark('key_moment', momentId)) {
      setBookmarkedMomentIds((prev) => [...prev, momentId]);
    }
  };

  const handleShare = async () => {
    setIsSharing(true);
    try {
      const res = await authFetch('/share', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ video_id: parseInt(videoId) }),
      });
      if (res.ok) {
        const data = await res.json();
        const url = `${window.location.origin}/share/${data.token}`;
        setShareUrl(url);
        if (navigator.clipboard) {
          navigator.clipboard.writeText(url).catch(() => {});
        }
      } else {
        alert('Failed to create share link.');
      }
    } catch (e) {
      console.error('Failed to create share link:', e);
    } finally {
      setIsSharing(false);
    }
  };

  const handleGenerateSummary = async () => {
    setIsLoadingSummary(true);
    try {
      const fullText = segments.map(s => s.text).join(" ");
      const res = await authFetch(`/summary/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ video_id: parseInt(videoId), text: fullText })
      });
      
      if (res.ok) {
        // Poll the backend for the generated summary
        const pollSummary = async (retries: number = 30) => {
          for (let i = 0; i < retries; i++) {
            await new Promise(resolve => setTimeout(resolve, 3000));
            const checkRes = await fetch(`${API_BASE_URL}/summary/${videoId}`);
            if (checkRes.ok) {
              const data = await checkRes.json();
              if (data.short_summary) {
                setSummary(data);
                setIsLoadingSummary(false);
                return;
              }
            }
          }
          // One final check — the summary may have just completed
          const finalCheck = await fetch(`${API_BASE_URL}/summary/${videoId}`);
          if (finalCheck.ok) {
            const data = await finalCheck.json();
            if (data.short_summary) {
              setSummary(data);
              setIsLoadingSummary(false);
              return;
            }
          }
          setIsLoadingSummary(false);
        };
        pollSummary();
      } else {
        setIsLoadingSummary(false);
      }
    } catch (e) {
      console.error("Failed to trigger generation:", e);
      setIsLoadingSummary(false);
    }
  };

  const handleGenerateMoments = async () => {
    setIsLoadingMoments(true);
    try {
      const res = await authFetch(`/key-moments/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ video_id: parseInt(videoId) })
      });
      
      if (res.ok) {
        // Poll the backend for generated key moments
        const pollMoments = async (retries: number = 10) => {
          for (let i = 0; i < retries; i++) {
            await new Promise(resolve => setTimeout(resolve, 2000));
            const checkRes = await fetch(`${API_BASE_URL}/key-moments/${videoId}`);
            if (checkRes.ok) {
              const data = await checkRes.json();
              if (data.length > 0) {
                setKeyMoments(data);
                setIsLoadingMoments(false);
                const transcriptRes = await fetch(`${API_BASE_URL}/transcript/${videoId}`);
                if (transcriptRes.ok) {
                  const transcriptData = await transcriptRes.json();
                  setKeywords(transcriptData.keywords || []);
                }
                return;
              }
            }
          }
          setIsLoadingMoments(false);
        };
        pollMoments();
      } else {
        setIsLoadingMoments(false);
      }
    } catch (e) {
      console.error("Failed to trigger moments generation:", e);
      setIsLoadingMoments(false);
    }
  };

  const handleUpdateSummary = async (updatedText: string, isDetailed: boolean) => {
    if (!summary) return;
    try {
      const res = await authFetch(`/summary/${videoId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          video_id: parseInt(videoId), 
          text: updatedText, 
          detailed: isDetailed 
        })
      });
      if (res.ok) {
        const updated = await res.json();
        setSummary(updated);
      }
    } catch (e) {
      console.error("Failed to update summary:", e);
    }
  };

  const handleRegenerateTranscript = async () => {
    try {
      const res = await authFetch(`/transcript/${videoId}/regenerate`, {
        method: 'POST',
      });
      if (res.ok) {
        setSegments([]);
        setKeywords([]);
        setVideoStatus('PROCESSING');
      }
    } catch (e) {
      console.error("Failed to trigger transcript regeneration:", e);
    }
  };

  const handleUpdateSegment = async (segmentId: string, updatedText: string) => {
    try {
      const res = await authFetch(`/transcript/${videoId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          segments: [{ id: segmentId, text: updatedText }]
        })
      });

      if (res.ok) {
        const updated = await res.json();
        setSegments(updated.segments || []);
      }
    } catch (e) {
      console.error("Failed to update segment:", e);
    }
  };

  const handleTimeUpdate = (time: number) => {
    setCurrentTime(time);
    if (seekToTime !== null) {
      setSeekToTime(null);
    }
  };

  const handleSegmentClick = (time: number) => {
    setSeekToTime(time);
  };

  const startRename = () => {
    setRenameValue(videoTitle);
    setIsRenaming(true);
  };

  const cancelRename = () => {
    setIsRenaming(false);
    setRenameValue('');
  };

  const saveRename = async () => {
    const trimmed = renameValue.trim();
    if (!trimmed || trimmed === videoTitle) {
      cancelRename();
      return;
    }
    setSavingRename(true);
    try {
      const res = await authFetch(`/upload/video/${videoId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: trimmed }),
      });
      if (res.ok) {
        setVideoTitle(trimmed);
        cancelRename();
      } else {
        alert('Failed to rename video.');
      }
    } catch (e) {
      console.error('Failed to rename video:', e);
      alert('Failed to rename video.');
    } finally {
      setSavingRename(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6 flex items-center justify-between">
        <div className="flex-1 min-w-0">
          {isRenaming ? (
            <div className="flex items-center gap-1.5">
              <input
                autoFocus
                value={renameValue}
                onChange={(e) => setRenameValue(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') saveRename();
                  if (e.key === 'Escape') cancelRename();
                }}
                className="min-w-0 flex-1 max-w-md px-2 py-1 text-headline-medium font-bold bg-md-surface-container-highest text-md-on-surface rounded-md border border-md-outline focus:outline-none focus:ring-2 focus:ring-md-primary"
              />
              <button
                onClick={saveRename}
                disabled={savingRename}
                title="Save"
                className="p-1.5 rounded-full text-md-primary hover:bg-md-primary-container transition-colors disabled:opacity-38"
              >
                <Check size={18} />
              </button>
              <button
                onClick={cancelRename}
                title="Cancel"
                className="p-1.5 rounded-full text-md-on-surface-variant hover:bg-md-surface-container-highest transition-colors"
              >
                <X size={18} />
              </button>
            </div>
          ) : (
            <h1 className="text-headline-medium font-bold text-md-on-surface flex items-center gap-2 group">
              {videoTitle}
              {canManageContent && (
                <button
                  onClick={startRename}
                  title="Rename video"
                  className="p-1 rounded-full text-md-on-surface-variant opacity-0 group-hover:opacity-100 hover:text-md-primary hover:bg-md-primary-container transition-all"
                >
                  <Pencil size={16} />
                </button>
              )}
            </h1>
          )}
          {videoFilename && videoTitle !== videoFilename && (
            <p className="text-label-small text-md-on-surface-variant/70 truncate mt-0.5">
              ({videoFilename})
            </p>
          )}
          <p className="text-body-small text-md-on-surface-variant mt-1">
            Video ID: {videoId}
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <span className={`px-3 py-1 text-label-small font-medium rounded-full ${
            videoStatus === 'COMPLETED'
              ? 'bg-md-success-container text-md-on-success-container'
              : videoStatus === 'FAILED'
              ? 'bg-md-error-container text-md-on-error-container'
              : 'bg-md-secondary-container text-md-on-secondary-container animate-pulse'
          }`}>
            {videoStatus}
          </span>
          <button
            onClick={handleBookmark}
            disabled={isBookmarked}
            title={isBookmarked ? 'Bookmarked' : 'Bookmark this video'}
            className="p-2 rounded-full text-md-on-surface-variant hover:text-md-primary hover:bg-md-primary-container transition-colors disabled:text-md-primary"
          >
            <Bookmark size={18} fill={isBookmarked ? 'currentColor' : 'none'} />
          </button>
          {canManageContent && (
            <button
              onClick={handleShare}
              disabled={isSharing}
              title="Create a shareable read-only link"
              className="p-2 rounded-full text-md-on-surface-variant hover:text-md-primary hover:bg-md-primary-container transition-colors disabled:opacity-50"
            >
              <Share2 size={18} />
            </button>
          )}
          {videoStatus === 'COMPLETED' && (
            <Link
              href={`/dashboard/video/${videoId}/study`}
              title="Study Mode: flashcards & quizzes"
              className="p-2 rounded-full text-md-on-surface-variant hover:text-md-primary hover:bg-md-primary-container transition-colors"
            >
              <GraduationCap size={18} />
            </Link>
          )}
        </div>
      </div>

      {shareUrl && (
        <div className="mb-6 p-3 rounded-lg bg-md-tertiary-container text-md-on-tertiary-container text-body-small flex items-center justify-between gap-3">
          <span className="truncate">Share link copied: {shareUrl}</span>
          <button onClick={() => setShareUrl(null)} className="shrink-0 opacity-70 hover:opacity-100">
            <X size={16} />
          </button>
        </div>
      )}

      {insights && (
        <div className="mb-6 flex flex-wrap gap-2">
          <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-md-surface-container-highest text-label-small text-md-on-surface-variant">
            <Eye size={14} />
            {insights.views} views ({insights.unique_viewers} unique)
          </span>
          <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-md-surface-container-highest text-label-small text-md-on-surface-variant">
            <Download size={14} />
            {insights.exports} exports
          </span>
          <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-md-surface-container-highest text-label-small text-md-on-surface-variant">
            <Tag size={14} />
            {insights.keyword_count} keywords
          </span>
          <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-md-surface-container-highest text-label-small text-md-on-surface-variant">
            <Star size={14} />
            {insights.key_moment_count} key moments
          </span>
          {insights.processing_time_seconds !== null && (
            <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-md-surface-container-highest text-label-small text-md-on-surface-variant">
              <Clock size={14} />
              {insights.processing_time_seconds.toFixed(1)}s processing time
            </span>
          )}
        </div>
      )}

      <div className="flex flex-col lg:flex-row lg:items-start gap-6">
        <div className="w-full lg:w-2/3 flex flex-col gap-6">
          <VideoPlayer
            url={videoUrl || "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4"}
            onTimeUpdate={handleTimeUpdate}
            seekToTime={seekToTime}
            onPlay={handleVideoPlay}
            keyMoments={keyMoments}
          />

          <SummaryViewer
            summary={summary}
            isLoading={isLoadingSummary}
            onGenerateSummary={handleGenerateSummary}
            onUpdateSummary={canManageContent ? handleUpdateSummary : undefined}
            disabled={isProcessing}
            canEdit={canManageContent}
            onBookmark={handleBookmarkSummary}
            isBookmarked={isSummaryBookmarked}
          />
        </div>

        <div className="w-full lg:w-1/3 flex flex-col gap-6">
          <KeywordTags keywords={keywords} />

          <div>
            {isLoadingTranscript ? (
              <div className="bg-md-surface-container p-6 rounded-xl flex items-center justify-center h-32">
                <p className="text-body-small text-md-on-surface-variant animate-pulse">Loading transcript...</p>
              </div>
            ) : (
              <TranscriptViewer
                segments={segments}
                currentTime={currentTime}
                onSegmentClick={handleSegmentClick}
                onUpdateSegment={canManageContent ? handleUpdateSegment : undefined}
                videoId={videoId}
                onRegenerate={canManageContent ? handleRegenerateTranscript : undefined}
                isRegenerating={isProcessing}
              />
            )}
          </div>

          <div>
            <KeyMomentsViewer
              moments={keyMoments}
              isLoading={isLoadingMoments}
              onMomentClick={setSeekToTime}
              onGenerateMoments={handleGenerateMoments}
              currentTime={currentTime}
              videoId={videoId}
              disabled={isProcessing}
              canEdit={canManageContent}
              onBookmarkMoment={handleBookmarkMoment}
              bookmarkedMomentIds={bookmarkedMomentIds}
            />
          </div>
        </div>
      </div>

    </div>
  );
}
