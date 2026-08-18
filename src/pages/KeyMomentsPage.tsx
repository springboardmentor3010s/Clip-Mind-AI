import React, { useState, useEffect } from 'react';
import { VideoItem, KeyMoment } from '../types';
import { api } from '../services/api';
import { VideoPlayer } from '../components/VideoPlayer';
import { Zap, Play, Clock, Sparkles, Tag, CheckCircle2, RefreshCw } from 'lucide-react';
import { motion } from 'motion/react';

interface KeyMomentsPageProps {
  initialVideoId?: string;
}

export const KeyMomentsPage: React.FC<KeyMomentsPageProps> = ({ initialVideoId }) => {
  const [videos, setVideos] = useState<VideoItem[]>([]);
  const [selectedVideoId, setSelectedVideoId] = useState<string | null>(initialVideoId || null);
  const [moments, setMoments] = useState<KeyMoment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [seekTime, setSeekTime] = useState<number | null>(null);

  useEffect(() => {
    loadVideos();
  }, []);

  useEffect(() => {
    if (selectedVideoId) {
      loadKeyMoments(selectedVideoId);
    }
  }, [selectedVideoId]);

  const loadVideos = async () => {
    try {
      const vList = await api.getVideos();
      setVideos(vList);
      if (vList.length > 0 && !selectedVideoId) {
        setSelectedVideoId(vList[0].id);
      }
    } catch (err) {
      console.error('Failed to load videos:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const loadKeyMoments = async (vId: string) => {
    setIsLoading(true);
    try {
      const data = await api.getKeyMoments(vId);
      setMoments(data);
    } catch (err) {
      console.warn('Key moments not ready or error:', err);
      setMoments([]);
    } finally {
      setIsLoading(false);
    }
  };

  const selectedVideo = videos.find((v) => v.id === selectedVideoId);

  const formatTime = (sec: number) => {
    const mins = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    return `${mins}:${s.toString().padStart(2, '0')}`;
  };

  const getImportanceBadge = (score: number) => {
    if (score >= 0.85) {
      return { label: 'Pivotal Core', color: 'bg-red-500/10 text-red-400 border-red-500/30' };
    } else if (score >= 0.7) {
      return { label: 'High Value', color: 'bg-amber-500/10 text-amber-400 border-amber-500/30' };
    } else {
      return { label: 'Key Moment', color: 'bg-blue-500/10 text-blue-400 border-blue-500/30' };
    }
  };

  return (
    <div className="space-y-8 pb-12">
      
      {/* Header & Video Selector */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-6 rounded-3xl bg-[#0A0F1E] border border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-cyan-400 uppercase tracking-wider">TOPIC SEGMENTATION ENGINE</span>
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
          </div>
          <h1 className="text-2xl font-black text-white mt-1">Timestamped Key Moments</h1>
          <p className="text-xs text-slate-400">Automated topic boundary extraction & one-click video navigation</p>
        </div>

        {/* Video Dropdown Selector */}
        {videos.length > 0 && (
          <div className="w-full sm:w-72">
            <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Select Video:</label>
            <select
              value={selectedVideoId || ''}
              onChange={(e) => setSelectedVideoId(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-cyan-500"
            >
              {videos.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.title}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {selectedVideo ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Left Column - Video Player */}
          <div className="lg:col-span-5 space-y-4">
            <div className="p-4 rounded-3xl bg-[#0A0F1E] border border-slate-800 space-y-3">
              <h3 className="text-sm font-bold text-white line-clamp-2">{selectedVideo.title}</h3>
              <VideoPlayer
                fileUrl={selectedVideo.fileUrl}
                thumbnailUrl={selectedVideo.thumbnailUrl}
                seekToTimestamp={seekTime}
              />
              <div className="pt-2 flex items-center justify-between text-xs text-slate-400">
                <span>Duration: {formatTime(selectedVideo.duration)}</span>
                <span className="px-2 py-0.5 rounded bg-cyan-500/10 text-cyan-400 font-semibold text-[10px]">
                  {moments.length} Detected Moments
                </span>
              </div>
            </div>
          </div>

          {/* Right Column - Key Moment Cards */}
          <div className="lg:col-span-7 space-y-4">
            <div className="p-6 rounded-3xl bg-[#0A0F1E] border border-slate-800 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                <span className="text-xs font-bold text-white uppercase tracking-wider">DETECTED HIGHLIGHT CARDS</span>
                <span className="text-[10px] text-slate-400">Click card to jump video playback</span>
              </div>

              {isLoading ? (
                <div className="py-16 text-center space-y-3">
                  <RefreshCw className="w-8 h-8 text-cyan-400 mx-auto animate-spin" />
                  <p className="text-xs text-slate-400">Detecting key moment boundaries...</p>
                </div>
              ) : moments.length > 0 ? (
                <div className="space-y-3 max-h-[500px] overflow-y-auto pr-2">
                  {moments.map((km) => {
                    const badge = getImportanceBadge(km.importanceScore);
                    return (
                      <motion.div
                        key={km.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800/80 hover:border-cyan-500/50 hover:bg-slate-900/80 transition-all space-y-3 group"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-center gap-2">
                            <span className="px-2.5 py-1 rounded-lg bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 font-mono text-xs font-bold">
                              @ {formatTime(km.timestamp)}
                            </span>
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${badge.color}`}>
                              {badge.label} ({(km.importanceScore * 100).toFixed(0)}%)
                            </span>
                          </div>

                          <button
                            onClick={() => setSeekTime(km.timestamp)}
                            className="px-3 py-1.5 rounded-xl bg-cyan-600/20 hover:bg-cyan-600 text-cyan-300 hover:text-white border border-cyan-500/30 text-xs font-bold flex items-center gap-1.5 transition-all"
                          >
                            <Play className="w-3 h-3 fill-current" />
                            <span>Jump</span>
                          </button>
                        </div>

                        <div>
                          <h4 className="text-sm font-bold text-white group-hover:text-cyan-300 transition-colors">
                            {km.title}
                          </h4>
                          <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                            {km.description}
                          </p>
                        </div>

                        {km.keywords && km.keywords.length > 0 && (
                          <div className="flex flex-wrap items-center gap-1.5 pt-1">
                            {km.keywords.map((kw, i) => (
                              <span key={i} className="px-2 py-0.5 rounded-md bg-slate-900 border border-slate-800 text-[10px] font-medium text-slate-400">
                                #{kw}
                              </span>
                            ))}
                          </div>
                        )}
                      </motion.div>
                    );
                  })}
                </div>
              ) : (
                <div className="py-12 text-center space-y-3">
                  <Zap className="w-12 h-12 text-slate-600 mx-auto" />
                  <p className="text-sm font-bold text-white">No Key Moments Detected</p>
                  <p className="text-xs text-slate-400">Video processing pipeline will automatically populate key moments.</p>
                </div>
              )}

            </div>
          </div>

        </div>
      ) : (
        <div className="p-12 rounded-3xl bg-[#0A0F1E] border border-slate-800 text-center space-y-3">
          <Zap className="w-12 h-12 text-slate-600 mx-auto" />
          <p className="text-sm font-bold text-white">No Videos Found</p>
          <p className="text-xs text-slate-400">Upload a video to detect timestamped key moments.</p>
        </div>
      )}

    </div>
  );
};
