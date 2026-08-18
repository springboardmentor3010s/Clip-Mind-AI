import React, { useState, useEffect } from 'react';
import { VideoItem, VideoTranscript, VideoSummary, KeyMoment } from '../types';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { VideoPlayer } from '../components/VideoPlayer';
import { ProcessingStatus } from '../components/ProcessingStatus';
import { TranscriptViewer } from '../components/TranscriptViewer';
import { SummaryViewer } from '../components/SummaryViewer';
import { KeyMomentsViewer } from '../components/KeyMomentsViewer';
import { ArrowLeft, FileText, Sparkles, Clock, RefreshCw, Bookmark, Share2 } from 'lucide-react';

interface VideoDetailPageProps {
  videoId: string;
  onBack: () => void;
}

export const VideoDetailPage: React.FC<VideoDetailPageProps> = ({ videoId, onBack }) => {
  const { user } = useAuth();
  const [video, setVideo] = useState<VideoItem | null>(null);
  const [transcript, setTranscript] = useState<VideoTranscript | null>(null);
  const [summary, setSummary] = useState<VideoSummary | null>(null);
  const [keyMoments, setKeyMoments] = useState<KeyMoment[]>([]);
  const [activeTab, setActiveTab] = useState<'summary' | 'transcript' | 'key-moments'>('summary');
  const [seekTime, setSeekTime] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const loadData = async () => {
    try {
      const vData = await api.getVideo(videoId);
      setVideo(vData);

      const [tData, sData, kmData] = await Promise.all([
        api.getTranscript(videoId).catch(() => null),
        api.getSummary(videoId).catch(() => null),
        api.getKeyMoments(videoId).catch(() => []),
      ]);

      setTranscript(tData);
      setSummary(sData);
      setKeyMoments(kmData);
    } catch (err) {
      console.error('Error loading video details:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    // Poll for status updates if active
    const interval = setInterval(() => {
      if (video && video.status !== 'COMPLETED' && video.status !== 'FAILED') {
        loadData();
      }
    }, 3000);
    return () => clearInterval(interval);
  }, [videoId]);

  const handleSeek = (seconds: number) => {
    setSeekTime(seconds);
    // Reset seekTime trigger after propagation
    setTimeout(() => setSeekTime(null), 300);
  };

  const handleTriggerReprocess = async () => {
    try {
      await api.triggerTranscribe(videoId);
      alert('AI Processing pipeline re-triggered for this video.');
      loadData();
    } catch (e: any) {
      alert(e.message || 'Failed to re-trigger AI pipeline');
    }
  };

  if (isLoading || !video) {
    return (
      <div className="p-12 text-center text-slate-400 font-semibold">
        Loading video workspace...
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-20">
      {/* Top Back Navigation */}
      <div className="flex items-center justify-between">
        <button
          onClick={onBack}
          className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-xs font-semibold text-slate-300 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Library</span>
        </button>

        <div className="flex items-center gap-2">
          {(user?.role === 'CONTENT_CREATOR' || user?.role === 'EDUCATOR' || user?.role === 'ADMINISTRATOR') && (
            <button
              onClick={handleTriggerReprocess}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-600/20 hover:bg-indigo-600/30 border border-indigo-500/30 text-xs font-semibold text-indigo-300 transition-colors"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Re-run AI Pipeline</span>
            </button>
          )}
        </div>
      </div>

      {/* Video Player Section */}
      <div className="space-y-4">
        <VideoPlayer
          src={video.fileUrl}
          poster={video.thumbnailUrl}
          title={video.title}
          seekTime={seekTime}
        />

        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-2 p-4 rounded-2xl bg-slate-900/60 border border-slate-800">
          <div>
            <h1 className="text-lg font-bold text-white">{video.title}</h1>
            <p className="text-xs text-slate-400 mt-1">{video.description}</p>
          </div>

          <div className="flex items-center gap-2 text-xs text-slate-400">
            <span className="px-2.5 py-1 rounded-lg bg-indigo-500/20 text-indigo-300 font-semibold">
              {video.category}
            </span>
            <span>By {video.uploaderName}</span>
          </div>
        </div>

        {/* Status indicator if processing */}
        {video.status !== 'COMPLETED' && (
          <ProcessingStatus status={video.status} progress={video.progress} />
        )}
      </div>

      {/* Workspace Tabs */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 border-b border-slate-800/80 pb-2">
          <button
            onClick={() => setActiveTab('summary')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'summary'
                ? 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-lg'
                : 'text-slate-400 hover:text-white hover:bg-slate-900/60'
            }`}
          >
            <Sparkles className="w-4 h-4" />
            <span>AI Summaries</span>
          </button>

          <button
            onClick={() => setActiveTab('transcript')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'transcript'
                ? 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-lg'
                : 'text-slate-400 hover:text-white hover:bg-slate-900/60'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>Transcript ({transcript?.segments.length || 0})</span>
          </button>

          <button
            onClick={() => setActiveTab('key-moments')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'key-moments'
                ? 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-lg'
                : 'text-slate-400 hover:text-white hover:bg-slate-900/60'
            }`}
          >
            <Clock className="w-4 h-4" />
            <span>Key Moments ({keyMoments.length})</span>
          </button>
        </div>

        {/* Tab Views */}
        {activeTab === 'summary' && <SummaryViewer summary={summary} />}
        {activeTab === 'transcript' && (
          <TranscriptViewer
            transcript={transcript}
            onSeek={handleSeek}
            canEdit={user?.role === 'EDUCATOR' || user?.role === 'ADMINISTRATOR'}
          />
        )}
        {activeTab === 'key-moments' && (
          <KeyMomentsViewer moments={keyMoments} onSeek={handleSeek} videoId={videoId} />
        )}
      </div>
    </div>
  );
};
