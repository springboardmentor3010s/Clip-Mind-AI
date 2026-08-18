import React, { useState, useEffect, useRef } from 'react';
import { VideoItem, VideoTranscript } from '../types';
import { api } from '../services/api';
import { VideoPlayer } from '../components/VideoPlayer';
import { FileText, Search, Copy, Download, Clock, Check, Sparkles, PlayCircle, RefreshCw } from 'lucide-react';
import { motion } from 'motion/react';

interface TranscriptsPageProps {
  initialVideoId?: string;
}

export const TranscriptsPage: React.FC<TranscriptsPageProps> = ({ initialVideoId }) => {
  const [videos, setVideos] = useState<VideoItem[]>([]);
  const [selectedVideoId, setSelectedVideoId] = useState<string | null>(initialVideoId || null);
  const [transcript, setTranscript] = useState<VideoTranscript | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [copied, setCopied] = useState(false);
  const [seekTime, setSeekTime] = useState<number | null>(null);

  useEffect(() => {
    loadVideos();
  }, []);

  useEffect(() => {
    if (selectedVideoId) {
      loadTranscript(selectedVideoId);
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

  const loadTranscript = async (vId: string) => {
    setIsLoading(true);
    try {
      const data = await api.getTranscript(vId);
      setTranscript(data);
    } catch (err) {
      console.warn('Transcript not ready or error:', err);
      setTranscript(null);
    } finally {
      setIsLoading(false);
    }
  };

  const handleTriggerTranscribe = async () => {
    if (!selectedVideoId) return;
    setIsTranscribing(true);
    try {
      await api.triggerTranscribe(selectedVideoId);
      setTimeout(() => {
        loadTranscript(selectedVideoId);
        setIsTranscribing(false);
      }, 3000);
    } catch (err) {
      console.error('Failed to trigger transcription:', err);
      setIsTranscribing(false);
    }
  };

  const selectedVideo = videos.find((v) => v.id === selectedVideoId);

  const handleCopy = () => {
    if (!transcript) return;
    const textToCopy = transcript.fullText;
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(textToCopy).catch(() => {
          fallbackCopy(textToCopy);
        });
      } else {
        fallbackCopy(textToCopy);
      }
    } catch (_) {
      fallbackCopy(textToCopy);
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
    if (!transcript || !selectedVideo) return;
    const element = document.createElement('a');
    const file = new Blob([`Transcript for: ${selectedVideo.title}\n\n${transcript.fullText}`], { type: 'text/plain' });
    element.href = URL.createObjectURL(file);
    element.download = `${selectedVideo.title.replace(/\s+/g, '_')}_transcript.txt`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  const formatTime = (sec: number) => {
    const mins = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    return `${mins}:${s.toString().padStart(2, '0')}`;
  };

  const filteredSegments = transcript?.segments.filter((seg) =>
    seg.text.toLowerCase().includes(searchQuery.toLowerCase())
  ) || [];

  return (
    <div className="space-y-8 pb-12">
      
      {/* Header & Video Selector */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-6 rounded-3xl bg-[#0A0F1E] border border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-blue-400 uppercase tracking-wider">WHISPER AI ENGINE</span>
            <span className="w-1.5 h-1.5 rounded-full bg-blue-400" />
          </div>
          <h1 className="text-2xl font-black text-white mt-1">Video Transcripts</h1>
          <p className="text-xs text-slate-400">Searchable speech recognition & timestamped segment transcriptions</p>
        </div>

        {/* Video Dropdown Selector */}
        {videos.length > 0 && (
          <div className="w-full sm:w-72">
            <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Select Video:</label>
            <select
              value={selectedVideoId || ''}
              onChange={(e) => setSelectedVideoId(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-blue-500"
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
                <span className="px-2 py-0.5 rounded bg-blue-500/10 text-blue-400 font-semibold text-[10px]">
                  {selectedVideo.status}
                </span>
              </div>
            </div>
          </div>

          {/* Right Column - Full Transcript & Timestamps */}
          <div className="lg:col-span-7 space-y-4">
            <div className="p-6 rounded-3xl bg-[#0A0F1E] border border-slate-800 space-y-6">
              
              {/* Controls Header */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-4 border-b border-slate-800">
                <div className="relative w-full sm:w-64">
                  <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search transcript text..."
                    className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={handleCopy}
                    disabled={!transcript}
                    className="px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 text-xs text-slate-200 flex items-center gap-1.5 transition-colors disabled:opacity-50"
                  >
                    {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-slate-400" />}
                    <span>{copied ? 'Copied' : 'Copy'}</span>
                  </button>

                  <button
                    onClick={handleDownload}
                    disabled={!transcript}
                    className="px-3 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-xs text-white font-bold flex items-center gap-1.5 transition-colors shadow-lg shadow-blue-500/20 disabled:opacity-50"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download TXT</span>
                  </button>
                </div>
              </div>

              {/* Transcript Display Area */}
              {isLoading ? (
                <div className="py-16 text-center space-y-3">
                  <RefreshCw className="w-8 h-8 text-blue-400 mx-auto animate-spin" />
                  <p className="text-xs text-slate-400">Loading transcript from Whisper pipeline...</p>
                </div>
              ) : transcript ? (
                <div className="space-y-6">
                  
                  {/* Full Text Block */}
                  <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-2">
                    <p className="text-[10px] font-bold text-blue-400 uppercase tracking-wider">FULL TRANSCRIPT OVERVIEW</p>
                    <p className="text-xs text-slate-300 leading-relaxed max-h-40 overflow-y-auto pr-2 font-normal">
                      {transcript.fullText}
                    </p>
                  </div>

                  {/* Timestamp Segments List */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs font-bold text-slate-300">
                      <span>TIMESTAMPED SEGMENTS ({filteredSegments.length})</span>
                      <span className="text-[10px] text-slate-500">Click timestamp to seek video</span>
                    </div>

                    <div className="space-y-2 max-h-96 overflow-y-auto pr-2">
                      {filteredSegments.length > 0 ? (
                        filteredSegments.map((seg) => (
                          <div
                            key={seg.id}
                            onClick={() => setSeekTime(seg.start)}
                            className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/80 hover:border-blue-500/40 hover:bg-slate-900/60 cursor-pointer transition-all flex items-start gap-3 group"
                          >
                            <span className="px-2 py-1 rounded-lg bg-blue-500/10 border border-blue-500/30 text-blue-400 text-[10px] font-mono font-bold flex-shrink-0 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                              {formatTime(seg.start)}
                            </span>
                            <p className="text-xs text-slate-200 leading-relaxed pt-0.5">
                              {seg.text}
                            </p>
                          </div>
                        ))
                      ) : (
                        <p className="text-xs text-slate-500 italic py-4 text-center">No segments matching "{searchQuery}"</p>
                      )}
                    </div>
                  </div>

                </div>
              ) : (
                <div className="py-12 text-center space-y-4">
                  <FileText className="w-12 h-12 text-slate-600 mx-auto" />
                  <div>
                    <p className="text-sm font-bold text-white">Transcript Not Available</p>
                    <p className="text-xs text-slate-400 mt-1">This video has not been transcribed yet or transcription is queued.</p>
                  </div>
                  <button
                    onClick={handleTriggerTranscribe}
                    disabled={isTranscribing}
                    className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-xs font-bold text-white inline-flex items-center gap-2 transition-all"
                  >
                    {isTranscribing ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                    <span>{isTranscribing ? 'Processing Whisper Speech-to-Text...' : 'Trigger Whisper Transcription'}</span>
                  </button>
                </div>
              )}

            </div>
          </div>

        </div>
      ) : (
        <div className="p-12 rounded-3xl bg-[#0A0F1E] border border-slate-800 text-center space-y-3">
          <FileText className="w-12 h-12 text-slate-600 mx-auto" />
          <p className="text-sm font-bold text-white">No Videos Found</p>
          <p className="text-xs text-slate-400">Upload a video to start extracting Whisper speech transcripts.</p>
        </div>
      )}

    </div>
  );
};
