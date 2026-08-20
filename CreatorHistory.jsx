import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { FiPlay, FiTrash2, FiVideo, FiClock } from 'react-icons/fi';
import historyService from '../services/historyService';
// Content Creator history page.
//
// Per the creator's own watch history (videos they have watched as a
// learner), shown with each video's watch percentage and a
// "Clear History" button. This mirrors the learner Watch History view
// because the /history route is restricted to Learners; creators are
// routed here via /creator-history by the Sidebar.

const CreatorHistory = () => {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadHistory = async () => {
    try {
      setLoading(true);
      const data = await historyService.getCreatorHistory();
      setHistory(data || []);
    } catch (err) {
      setError('Failed to load history');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadHistory();
  }, []);

  const handleRemove = async (videoId) => {
    if (!window.confirm('Remove this video from your history?')) return;
    try {
      await historyService.remove(videoId);
      setHistory(history.filter((h) => h.video_id !== videoId));
    } catch (err) {
      alert('Failed to remove history entry');
    }
  };

  const handleClear = async () => {
    if (!window.confirm('Clear your entire watch history? This cannot be undone.')) return;
    try {
      await historyService.clear();
      setHistory([]);
    } catch (err) {
      alert('Failed to clear history');
    }
  };

  const formatDuration = (seconds) => {
    if (!seconds) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const formatPercent = (value) => `${Math.round((value || 0) * 100)}%`;

  return (
    <div className="pt-6 pb-12">
      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 xl:px-10">
        <div className="mb-4 sm:mb-6 lg:mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-800">Watch History</h1>
            <p className="text-sm sm:text-base text-gray-600 mt-1">
              Videos you've watched, ordered by most recent
            </p>
          </div>
          {history.length > 0 && (
            <button
              onClick={handleClear}
              className="w-full sm:w-auto text-center px-5 py-2 bg-red-50 text-red-700 rounded-lg font-medium hover:bg-red-100 transition-colors"
            >
              Clear History
            </button>
          )}
        </div>

        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto"></div>
            <p className="text-gray-500 mt-2">Loading history...</p>
          </div>
        ) : error ? (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">{error}</div>
        ) : history.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-xl shadow-sm border border-gray-200">
            <FiClock className="mx-auto text-4xl text-gray-300 mb-4" />
            <h3 className="text-lg font-medium text-gray-800 mb-2">No history yet</h3>
            <p className="text-sm text-gray-500">Start watching videos to build your learning history.</p>
            <Link to="/browse" className="inline-flex items-center mt-4 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors text-sm">
              <FiPlay className="mr-2" /> Browse Videos
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {history.map((entry) => {
              const video = entry.video || {};
              return (
                <div key={entry.id} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow">
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
                      <p className="text-xs text-gray-500 mt-1">
                        Watched {formatPercent(entry.completion_rate)} · Last watched {new Date(entry.last_watched_at).toLocaleDateString()}
                      </p>
                    </div>
                  </Link>
                  <div className="px-4 pb-4">
                    <button
                      onClick={() => handleRemove(video.id)}
                      className="w-full flex items-center justify-center px-3 py-2 bg-red-50 text-red-700 rounded-lg hover:bg-red-100 transition-colors text-sm"
                    >
                      <FiTrash2 className="mr-1" /> Remove
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default CreatorHistory;
