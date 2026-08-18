import React, { useState, useEffect } from 'react';
import { VideoItem } from '../types';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { Video, Search, Trash2, Edit, Play, Download, UploadCloud, FileText, Sparkles, Check, X } from 'lucide-react';

interface LibraryPageProps {
  onNavigate: (tab: string, videoId?: string) => void;
  onOpenUploadModal: () => void;
}

export const LibraryPage: React.FC<LibraryPageProps> = ({ onNavigate, onOpenUploadModal }) => {
  const { user } = useAuth();

  const role = (user?.role || '').toUpperCase();
  const isLearner = role === 'LEARNER' || role === 'STUDENT';

  const [videos, setVideos] = useState<VideoItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [editingVideoId, setEditingVideoId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return 'Recently';
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return 'Recently';
      return d.toLocaleDateString();
    } catch (_) {
      return 'Recently';
    }
  };

  const loadVideos = async () => {
    try {
      const data = await api.getVideos();
      setVideos(data);
    } catch (err) {
      console.error('Failed to load video library:', err);
    }
  };

  useEffect(() => {
    loadVideos();
  }, []);

  const handleDelete = async (videoId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm('Are you sure you want to delete this video?')) {
      try {
        await api.deleteVideo(videoId);
        setVideos(videos.filter((v) => v.id !== videoId));
      } catch (err: any) {
        alert(err.message || 'Failed to delete video');
      }
    }
  };

  const handleStartEdit = (video: VideoItem, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingVideoId(video.id);
    setEditTitle(video.title);
  };

  const handleSaveEdit = async (videoId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await api.updateVideo(videoId, { title: editTitle });
      setVideos(videos.map((v) => (v.id === videoId ? { ...v, title: editTitle } : v)));
      setEditingVideoId(null);
    } catch (err: any) {
      alert(err.message || 'Failed to update video');
    }
  };

  const filteredVideos = videos.filter((v) =>
    v.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (v.description && v.description.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="space-y-8 pb-16 max-w-6xl mx-auto">
      
      {/* Title & Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-white">Your Learning Library</h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">Videos shared with you through your classrooms.</p>
        </div>

        {!isLearner && (
          <button
            onClick={() => onNavigate('dashboard')}
            className="px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 shadow-lg shadow-blue-600/25 flex items-center gap-2"
          >
            <UploadCloud className="w-4 h-4" />
            <span>Upload Video</span>
          </button>
        )}
      </div>

      {/* Search Input */}
      <div className="relative max-w-md">
        <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          placeholder="Search your library..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#0D1220] border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
        />
      </div>

      {/* Empty State vs Video Cards Grid */}
      {filteredVideos.length === 0 ? (
        <div className="p-12 text-center rounded-3xl bg-[#0D1220] border border-slate-800/80 space-y-4 max-w-md mx-auto my-12">
          <div className="w-12 h-12 rounded-2xl bg-blue-500/10 border border-blue-500/30 flex items-center justify-center text-blue-400 mx-auto">
            <Video className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white">No videos uploaded yet.</h3>
            <p className="text-xs text-slate-400 mt-1">Upload your first video to generate transcripts and summaries.</p>
          </div>
          {!isLearner && (
            <button
              onClick={() => onNavigate('dashboard')}
              className="px-6 py-2.5 rounded-xl text-xs font-bold text-white bg-blue-600 hover:bg-blue-500 transition-all inline-flex items-center gap-2"
            >
              <UploadCloud className="w-4 h-4" />
              <span>Upload your first video</span>
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredVideos.map((video) => {
            const isEditing = editingVideoId === video.id;

            return (
              <div
                key={video.id}
                onClick={() => onNavigate('detail', video.id)}
                className="p-5 rounded-3xl bg-[#0D1220] border border-slate-800/80 hover:border-blue-500/40 transition-all duration-300 cursor-pointer space-y-4 flex flex-col justify-between group"
              >
                <div className="space-y-3">
                  {/* Thumbnail / Video Placeholder */}
                  <div className="aspect-video rounded-2xl bg-slate-950 relative overflow-hidden flex items-center justify-center border border-slate-800">
                    {video.thumbnailUrl ? (
                      <img src={video.thumbnailUrl} alt={video.title} className="w-full h-full object-cover" />
                    ) : (
                      <div className="flex flex-col items-center gap-1.5 text-slate-600">
                        <Video className="w-8 h-8 text-blue-500/50" />
                        <span className="text-[10px] text-slate-500">Video Content</span>
                      </div>
                    )}

                    <div className="absolute inset-0 bg-slate-950/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <div className="w-12 h-12 rounded-full bg-blue-600/90 text-white flex items-center justify-center shadow-lg shadow-blue-500/30 transform group-hover:scale-105 transition-transform">
                        <Play className="w-5 h-5 ml-0.5 fill-current" />
                      </div>
                    </div>

                    <span className={`absolute top-2.5 left-2.5 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold shadow-md ${
                      video.status === 'COMPLETED' ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' : 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                    }`}>
                      {video.status}
                    </span>
                  </div>

                  {/* Video Title & Date */}
                  {isEditing ? (
                    <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                      <input
                        type="text"
                        value={editTitle}
                        onChange={(e) => setEditTitle(e.target.value)}
                        className="w-full px-2.5 py-1 rounded-lg bg-slate-950 border border-blue-500 text-xs text-white"
                      />
                      <button
                        onClick={(e) => handleSaveEdit(video.id, e)}
                        className="p-1.5 bg-emerald-600 text-white rounded-lg hover:bg-emerald-500"
                      >
                        <Check className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); setEditingVideoId(null); }}
                        className="p-1.5 bg-slate-800 text-slate-300 rounded-lg"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ) : (
                    <div>
                      <h3 className="text-sm font-bold text-white group-hover:text-blue-400 transition-colors truncate">
                        {video.title}
                      </h3>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        Uploaded {formatDate(video.createdAt || (video as any).created_at)}
                      </p>
                    </div>
                  )}
                </div>

                {/* Card Actions & Links */}
                <div className="pt-3 border-t border-slate-800/80 space-y-2" onClick={(e) => e.stopPropagation()}>
                  <div className="flex items-center justify-between text-xs">
                    <button
                      onClick={() => onNavigate('transcripts', video.id)}
                      className="text-[11px] font-semibold text-blue-400 hover:underline flex items-center gap-1"
                    >
                      <FileText className="w-3.5 h-3.5" /> View Transcript
                    </button>
                    <button
                      onClick={() => onNavigate('summaries', video.id)}
                      className="text-[11px] font-semibold text-purple-400 hover:underline flex items-center gap-1"
                    >
                      <Sparkles className="w-3.5 h-3.5" /> View Summary
                    </button>
                  </div>

                  {!isLearner && (
                    <div className="flex items-center justify-end gap-1.5 pt-1">
                      {(video.fileUrl || (video as any).url) && (
                        <a
                        href={video.fileUrl || (video as any).url}
                        download
                        title="Download raw video"
                        className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800/80 transition-colors"
                      >
                        <Download className="w-3.5 h-3.5" />
                      </a>
                    )}
                    <button
                      onClick={(e) => handleStartEdit(video, e)}
                      title="Edit Title"
                      className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800/80 transition-colors"
                    >
                      <Edit className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={(e) => handleDelete(video.id, e)}
                      title="Delete Video"
                      className="p-1.5 rounded-lg text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                    </div>
                  )}
                </div>

              </div>
            );
          })}
        </div>
      )}

    </div>
  );
};
