import React, { useEffect, useMemo, useState } from 'react';
import {
  Search,
  UploadCloud,
  Video,
  Play,
  Pencil,
  Trash2,
  Clock,
  Eye,
  RefreshCw,
  MoreVertical,
} from 'lucide-react';
import { api } from '../services/api';
import { VideoItem } from '../types';

interface CreatorVideosPageProps {
  onNavigate: (tab: string, videoId?: string) => void;
  onOpenUploadModal?: () => void;
}

const formatDuration = (seconds: number) => {
  if (!seconds || seconds < 0) return '00:00';

  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);

  if (hours > 0) {
    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(
      2,
      '0'
    )}:${String(secs).padStart(2, '0')}`;
  }

  return `${String(minutes).padStart(2, '0')}:${String(secs).padStart(
    2,
    '0'
  )}`;
};

const formatDate = (date: string) => {
  if (!date) return '-';

  return new Date(date).toLocaleDateString(undefined, {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
};

const getStatusLabel = (status: string) => {
  switch (status) {
    case 'COMPLETED':
      return 'Completed';
    case 'QUEUED':
      return 'Queued';
    case 'PROCESSING_FFMPEG':
      return 'Processing';
    case 'TRANSCRIBING_WHISPER':
      return 'Transcribing';
    case 'SUMMARIZING_BART':
      return 'Summarizing';
    case 'DETECTING_KEY_MOMENTS':
      return 'Analyzing';
    case 'FAILED':
      return 'Failed';
    default:
      return status || 'Unknown';
  }
};

const getStatusClass = (status: string) => {
  switch (status) {
    case 'COMPLETED':
      return 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20';

    case 'FAILED':
      return 'text-red-400 bg-red-500/10 border-red-500/20';

    case 'QUEUED':
      return 'text-amber-400 bg-amber-500/10 border-amber-500/20';

    default:
      return 'text-blue-400 bg-blue-500/10 border-blue-500/20';
  }
};

export const CreatorProcessingPage: React.FC<CreatorVideosPageProps> = ({
  onNavigate,
  onOpenUploadModal,
}) => {
  const [videos, setVideos] = useState<VideoItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const loadVideos = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const data = await api.getVideos();

      setVideos(
        data.map((video) => ({
          ...video,
          bookmarksCount: video.bookmarksCount ?? 0,
        }))
      );
    } catch (err) {
      console.error('Failed to load creator videos:', err);
      setError('Unable to load your videos.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadVideos();

    const interval = window.setInterval(() => {
      loadVideos();
    }, 3000);

    return () => {
      window.clearInterval(interval);
    };
  }, []);

  const processingVideos = useMemo(() => {
    return videos.filter(
      (video) => video.status !== 'COMPLETED'
    );
  }, [videos]);

  const filteredVideos = useMemo(() => {
    const query = search.trim().toLowerCase();

    if (!query) return processingVideos;

    return processingVideos.filter((video) =>
      [
        video.title,
        video.description,
        video.category,
        video.fileName,
        getStatusLabel(video.status),
      ]
        .filter(Boolean)
        .some((value) =>
          String(value).toLowerCase().includes(query)
        )
    );
  }, [processingVideos, search]);

  const handleDelete = async (video: VideoItem) => {
    const confirmed = window.confirm(
      `Delete "${video.title}"?\n\nThis action cannot be undone.`
    );

    if (!confirmed) return;

    try {
      setDeletingId(video.id);

      await api.deleteVideo(video.id);

      setVideos((current) =>
        current.filter((item) => item.id !== video.id)
      );
    } catch (err) {
      console.error('Failed to delete video:', err);
      window.alert('Unable to delete this video.');
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-7 pb-16">

      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-5">

        <div>
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-blue-600 to-purple-600 flex items-center justify-center">
              <Video className="w-5 h-5 text-white" />
            </div>

            <div>
              <h1 className="text-3xl font-black text-white">
                Processing Queue
              </h1>

              <p className="text-sm text-slate-400 mt-1">
                Monitor your videos as ClipMind AI processes them.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={loadVideos}
            disabled={isLoading}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-800 bg-slate-900/70 text-slate-300 hover:text-white hover:bg-slate-800 transition"
          >
            <RefreshCw
              className={`w-4 h-4 ${
                isLoading ? 'animate-spin' : ''
              }`}
            />
            Refresh
          </button>

          <button
            type="button"
            onClick={() => {
              if (onOpenUploadModal) {
                onOpenUploadModal();
              } else {
                onNavigate('creator-upload');
              }
            }}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold transition shadow-lg shadow-blue-500/20"
          >
            <UploadCloud className="w-4 h-4" />
            Upload Video
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">

        <div className="p-5 rounded-2xl bg-[#0D1220] border border-slate-800/80">
          <p className="text-xs text-slate-500 font-semibold">
            Total Videos
          </p>

          <p className="text-3xl font-black text-white mt-2">
            {videos.length}
          </p>
        </div>

        <div className="p-5 rounded-2xl bg-[#0D1220] border border-slate-800/80">
          <p className="text-xs text-slate-500 font-semibold">
            Completed
          </p>

          <p className="text-3xl font-black text-emerald-400 mt-2">
            {videos.filter((v) => v.status === 'COMPLETED').length}
          </p>
        </div>

        <div className="p-5 rounded-2xl bg-[#0D1220] border border-slate-800/80">
          <p className="text-xs text-slate-500 font-semibold">
            Processing
          </p>

          <p className="text-3xl font-black text-blue-400 mt-2">
            {
              videos.filter(
                (v) =>
                  v.status !== 'COMPLETED' &&
                  v.status !== 'FAILED'
              ).length
            }
          </p>
        </div>

        <div className="p-5 rounded-2xl bg-[#0D1220] border border-slate-800/80">
          <p className="text-xs text-slate-500 font-semibold">
            Total Views
          </p>

          <p className="text-3xl font-black text-purple-400 mt-2">
            {videos.reduce(
              (total, video) =>
                total + (video.viewsCount || 0),
              0
            )}
          </p>
        </div>

      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />

        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search your videos..."
          className="w-full pl-11 pr-4 py-3.5 rounded-2xl bg-[#0D1220] border border-slate-800 text-sm text-white placeholder:text-slate-600 outline-none focus:border-blue-500/50"
        />
      </div>

      {/* Loading */}
      {isLoading && (
        <div className="py-20 flex flex-col items-center justify-center text-slate-500">
          <RefreshCw className="w-7 h-7 animate-spin mb-3" />
          <p className="text-sm">
            Loading your videos...
          </p>
        </div>
      )}

      {/* Error */}
      {!isLoading && error && (
        <div className="p-5 rounded-2xl border border-red-500/20 bg-red-500/5 text-red-400">
          <p className="text-sm font-semibold">
            {error}
          </p>

          <button
            type="button"
            onClick={loadVideos}
            className="mt-3 text-xs underline"
          >
            Try again
          </button>
        </div>
      )}

      {/* Empty */}
      {!isLoading &&
        !error &&
        filteredVideos.length === 0 && (
          <div className="py-20 rounded-3xl border border-dashed border-slate-800 bg-[#0D1220]/60 flex flex-col items-center justify-center text-center">

            <div className="w-16 h-16 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center mb-5">
              <Video className="w-7 h-7 text-blue-400" />
            </div>

            <h2 className="text-lg font-bold text-white">
              {search
                ? 'No videos found'
                : 'No videos uploaded yet'}
            </h2>

            <p className="text-sm text-slate-500 mt-2 max-w-md">
              {search
                ? 'Try a different search term.'
                : 'Upload your first video to start the ClipMind AI processing pipeline.'}
            </p>

            {!search && (
              <button
                type="button"
                onClick={() =>
                  onOpenUploadModal
                    ? onOpenUploadModal()
                    : onNavigate('creator-upload')
                }
                className="mt-5 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-sm font-bold"
              >
                Upload Your First Video
              </button>
            )}

          </div>
        )}

      {/* Video Grid */}
      {!isLoading &&
        !error &&
        filteredVideos.length > 0 && (
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">

            {filteredVideos.map((video) => (
              <div
                key={video.id}
                className="group rounded-3xl bg-[#0D1220] border border-slate-800/80 overflow-hidden hover:border-blue-500/30 transition"
              >

                {/* Thumbnail */}
                <div className="relative aspect-video bg-slate-950 overflow-hidden">

                  {video.thumbnailUrl ? (
                    <img
                      src={video.thumbnailUrl}
                      alt={video.title}
                      className="w-full h-full object-cover group-hover:scale-[1.02] transition duration-300"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-slate-900 to-slate-950">
                      <Video className="w-12 h-12 text-slate-700" />
                    </div>
                  )}

                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />

                  <div className="absolute left-4 bottom-4 flex items-center gap-2">
                    <span className="px-2.5 py-1 rounded-lg bg-black/70 backdrop-blur text-white text-[10px] font-bold flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {formatDuration(video.duration)}
                    </span>

                    <span
                      className={`px-2.5 py-1 rounded-lg border text-[10px] font-bold ${getStatusClass(
                        video.status
                      )}`}
                    >
                      {getStatusLabel(video.status)}
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() =>
                      onNavigate('detail', video.id)
                    }
                    className="absolute right-4 bottom-4 w-10 h-10 rounded-full bg-white text-slate-950 flex items-center justify-center opacity-0 group-hover:opacity-100 transition shadow-xl"
                  >
                    <Play className="w-4 h-4 fill-current ml-0.5" />
                  </button>

                </div>

                {/* Content */}
                <div className="p-5">

                  <div className="flex items-start justify-between gap-4">

                    <div className="min-w-0">
                      <h3 className="text-base font-bold text-white truncate">
                        {video.title}
                      </h3>

                      <p className="text-xs text-slate-500 mt-1 truncate">
                        {video.fileName}
                      </p>
                    </div>

                    <button
                      type="button"
                      className="flex-shrink-0 w-8 h-8 rounded-lg text-slate-500 hover:text-white hover:bg-slate-800 flex items-center justify-center"
                    >
                      <MoreVertical className="w-4 h-4" />
                    </button>

                  </div>

                  <div className="flex flex-wrap items-center gap-x-5 gap-y-2 mt-5 text-[11px] text-slate-500">

                    <span>
                      {video.category}
                    </span>

                    <span>
                      {formatDate(video.createdAt)}
                    </span>

                    <span className="flex items-center gap-1">
                      <Eye className="w-3.5 h-3.5" />
                      {video.viewsCount || 0}
                    </span>

                  </div>

                  {video.status !== 'COMPLETED' &&
                    video.status !== 'FAILED' && (
                      <div className="mt-4">
                        <div className="flex justify-between text-[10px] mb-1.5">
                          <span className="text-slate-500">
                            AI Processing
                          </span>

                          <span className="text-blue-400 font-bold">
                            {video.progress}%
                          </span>
                        </div>

                        <div className="h-1.5 bg-slate-950 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-blue-500 rounded-full transition-all"
                            style={{
                              width: `${Math.min(
                                100,
                                Math.max(0, video.progress)
                              )}%`,
                            }}
                          />
                        </div>
                      </div>
                    )}

                  {/* Actions */}
                  <div className="flex items-center gap-2 mt-5 pt-4 border-t border-slate-800/70">

                    <button
                      type="button"
                      onClick={() =>
                        onNavigate('detail', video.id)
                      }
                      className="flex-1 flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400 hover:bg-blue-500/15 text-xs font-bold transition"
                    >
                      <Play className="w-3.5 h-3.5" />
                      View
                    </button>

                    <button
                      type="button"
                      onClick={() =>
                        onNavigate('detail', video.id)
                      }
                      className="px-3 py-2.5 rounded-xl border border-slate-800 text-slate-400 hover:text-white hover:bg-slate-800 text-xs font-bold transition"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </button>

                    <button
                      type="button"
                      disabled={deletingId === video.id}
                      onClick={() => handleDelete(video)}
                      className="px-3 py-2.5 rounded-xl border border-red-500/20 text-red-400 hover:bg-red-500/10 disabled:opacity-50 text-xs font-bold transition"
                    >
                      {deletingId === video.id ? (
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <Trash2 className="w-3.5 h-3.5" />
                      )}
                    </button>

                  </div>

                </div>
              </div>
            ))}

          </div>
        )}

    </div>
  );
};
