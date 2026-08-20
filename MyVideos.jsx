import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { FiTrash2, FiEye, FiEdit3, FiVideo, FiCalendar, FiHardDrive, FiZap, FiGlobe, FiBookOpen } from 'react-icons/fi';
import videoService from '../services/videoService.js';
import BookmarkButton from '../components/BookmarkButton.jsx';
import { useAuth } from '../context/AuthContext.jsx';


const MyVideos = () => {
  const { user } = useAuth();
  const isEducator = user?.role === 'Educator';

  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchVideos = async () => {
    try {
      const data = await videoService.getVideos();
      setVideos(data);
    } catch (err) {
      setError('Failed to load videos');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVideos();
  }, []);

  const handleDelete = async (videoId) => {
    if (!window.confirm('Are you sure you want to delete this video?')) return;
    try {
      await videoService.deleteVideo(videoId);
      setVideos(videos.filter(v => v.id !== videoId));
    } catch (err) {
      alert('Failed to delete video');
    }
  };

  const togglePublish = async (video) => {
    const next = !video.is_published;
    if (!next && !window.confirm('Unpublish this video? It will be removed from the public library.')) return;
    try {
      const updated = await videoService.updateVideo(video.id, { is_published: next });
      setVideos(videos.map(v => v.id === video.id ? updated : v));
    } catch (err) {
      alert('Failed to update publish status');
    }
  };

  const formatDuration = (seconds) => {
    if (!seconds) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const formatFileSize = (bytes) => {
    if (!bytes) return 'N/A';
    const mb = bytes / (1024 * 1024);
    return `${mb.toFixed(1)} MB`;
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'processed':
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'uploaded':
        return 'bg-yellow-100 text-yellow-800';
      case 'processing':
      case 'processing_summary':
        return 'bg-blue-100 text-blue-800';
      case 'failed':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="pt-6 pb-12">
      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 xl:px-10">
        <div className="mb-4 sm:mb-6 lg:mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-800">My Videos</h1>
            <p className="text-sm sm:text-base text-gray-600 mt-1">
              Manage your uploaded videos
            </p>
          </div>
          <Link
            to="/upload"
            className="w-full sm:w-auto text-center px-5 py-2 bg-primary-600 text-white rounded-lg font-medium hover:bg-primary-700 transition-colors"
          >
            Upload New Video
          </Link>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto"></div>
            <p className="text-gray-500 mt-2">Loading videos...</p>
          </div>
        ) : error ? (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
            {error}
          </div>
        ) : videos.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-xl shadow-sm border border-gray-200">
            <FiVideo className="mx-auto text-4xl text-gray-300 mb-4" />
            <h3 className="text-lg font-medium text-gray-800 mb-2">No videos yet</h3>
            <p className="text-gray-500 mb-4">
              Upload your first video to get started with AI processing
            </p>
            <Link
              to="/upload"
              className="inline-flex items-center px-4 py-2 bg-primary-600 text-white rounded-lg font-medium hover:bg-primary-700 transition-colors"
            >
              Upload Video
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-6">
            {videos.map(video => (
              <div key={video.id} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                {/* Thumbnail */}
                <div className="aspect-video bg-gray-100 relative">
                  {video.thumbnail_url ? (
                    <img
                      src={video.thumbnail_url}
                      alt={video.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <FiVideo className="text-4xl text-gray-300" />
                    </div>
                  )}
                  <div className="absolute bottom-2 right-2 bg-black bg-opacity-70 text-white px-2 py-1 rounded text-xs">
                    {formatDuration(video.duration)}
                  </div>
                </div>

                {/* Video Info */}
                <div className="p-4 sm:p-5">
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <h3 className="font-semibold text-gray-800 line-clamp-1 flex-1">
                      {video.title}
                    </h3>
                    <BookmarkButton videoId={video.id} className="flex-shrink-0 text-lg" />
                  </div>
                  {video.description && (
                    <p className="text-sm text-gray-500 mb-2 line-clamp-2">
                      {video.description}
                    </p>
                  )}

                  <div className="flex items-center justify-between mb-3">
                    <span className={`inline-flex px-2 py-1 text-xs rounded-full ${getStatusColor(video.status)}`}>
                      {video.status}
                    </span>
                    <div className="flex items-center space-x-1 text-xs text-gray-500">
                      <FiHardDrive className="text-sm" />
                      <span>{formatFileSize(video.file_size)}</span>
                    </div>
                  </div>

                  <div className="flex items-center text-xs text-gray-500 mb-3">
                    <FiCalendar className="mr-1" />
                    <span>{new Date(video.created_at).toLocaleDateString()}</span>
                  </div>

                  {/* Actions */}
<div className="flex space-x-2">
                    <Link
                      to={`/videos/${video.id}`}
                      className="flex-1 flex items-center justify-center px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm"
                    >
                      <FiEye className="mr-1" />
                      View
                    </Link>
                    <Link
                      to={`/videos/${video.id}/key-moments`}
                      className="flex-1 flex items-center justify-center px-3 py-2 bg-yellow-50 text-yellow-700 rounded-lg hover:bg-yellow-100 transition-colors text-sm"
                    >
                      <FiZap className="mr-1" />
                      Moments
                    </Link>
                    <button
                      onClick={() => togglePublish(video)}
                      className={`flex-1 flex items-center justify-center px-3 py-2 rounded-lg transition-colors text-sm ${
                        video.is_published
                          ? 'bg-green-50 text-green-700 hover:bg-green-100'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      <FiGlobe className="mr-1" />
                      {video.is_published ? 'Published' : 'Publish'}
                    </button>
                    <button
                      onClick={() => handleDelete(video.id)}
                      className="flex-1 flex items-center justify-center px-3 py-2 bg-red-50 text-red-700 rounded-lg hover:bg-red-100 transition-colors text-sm"
                    >
                      <FiTrash2 className="mr-1" />
                      Delete
                    </button>
                  </div>

                  {/* Classroom navigation — educators only */}
                  {isEducator && (
                    <Link
                      to={`/classrooms/${video.id}`}
                      className="mt-2 w-full flex items-center justify-center px-3 py-2 bg-primary-50 text-primary-700 rounded-lg hover:bg-primary-100 transition-colors text-sm"
                    >
                      <FiBookOpen className="mr-1" />
                      Classroom
                    </Link>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default MyVideos;
