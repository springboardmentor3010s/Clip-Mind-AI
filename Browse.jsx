import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { FiVideo, FiSearch, FiPlay, FiBookmark, FiHardDrive, FiCalendar } from 'react-icons/fi';
import videoService from '../services/videoService';
import BookmarkButton from '../components/BookmarkButton';


const Browse = () => {
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');

  useEffect(() => {
    loadVideos();
  }, []);

  const loadVideos = async () => {
    try {
      setLoading(true);
      const data = await videoService.getBrowseVideos();
      setVideos(data || []);
    } catch (err) {
      setError('Failed to load library');
    } finally {
      setLoading(false);
    }
  };

  const filtered = videos.filter(v =>
    (v.title || '').toLowerCase().includes(search.toLowerCase()) ||
    (v.description || '').toLowerCase().includes(search.toLowerCase())
  );

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

  return (
    <div className="pt-6 pb-12">
      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 xl:px-10">
        <div className="mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-800">Browse Library</h1>
          <p className="text-sm sm:text-base text-gray-600 mt-1">
            Discover published videos from the community
          </p>
        </div>

        {search !== undefined && (
          <div className="relative mb-6">
            <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              className="border border-gray-300 rounded-lg pl-10 pr-4 py-3 w-full focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
              placeholder="Search published videos..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        )}

        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto"></div>
            <p className="text-gray-500 mt-2">Loading library...</p>
          </div>
        ) : error ? (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">{error}</div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-xl shadow-sm border border-gray-200">
            <FiVideo className="mx-auto text-4xl text-gray-300 mb-4" />
            <h3 className="text-lg font-medium text-gray-800 mb-2">No published videos yet</h3>
            <p className="text-sm text-gray-500">Check back later for new content.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filtered.map((video) => (
              <div key={video.id} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow">
                <Link to={`/videos/${video.id}`} className="block">
                  <div className="aspect-video bg-gray-100 relative">
                    {video.thumbnail_url ? (
                      <img src={video.thumbnail_url} alt={video.title} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <FiVideo className="text-4xl text-gray-300" />
                      </div>
                    )}
                    <div className="absolute bottom-2 right-2 bg-black bg-opacity-70 text-white px-2 py-1 rounded text-xs">
                      {formatDuration(video.duration)}
                    </div>
                  </div>
                  <div className="p-4">
                    <h3 className="font-semibold text-gray-800 line-clamp-1">{video.title}</h3>
                    {video.description && (
                      <p className="text-sm text-gray-500 mt-1 line-clamp-2">{video.description}</p>
                    )}
                    <div className="flex items-center justify-between mt-3 text-xs text-gray-500">
                      <span className="flex items-center gap-1">
                        <FiCalendar className="text-sm" />
                        {new Date(video.created_at).toLocaleDateString()}
                      </span>
                      <span className="flex items-center gap-1">
                        <FiHardDrive className="text-sm" />
                        {formatFileSize(video.file_size)}
                      </span>
                    </div>
                  </div>
                </Link>
                <div className="px-4 pb-4">
                  <div className="flex items-center gap-2">
                    <Link
                      to={`/videos/${video.id}`}
                      className="flex-1 flex items-center justify-center px-3 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors text-sm"
                    >
                      <FiPlay className="mr-1" /> Watch
                    </Link>
                    <BookmarkButton videoId={video.id} className="flex-shrink-0 text-lg" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Browse;