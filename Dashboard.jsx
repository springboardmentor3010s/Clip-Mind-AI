import React, { useEffect, useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import { FiUpload, FiClock, FiCheckCircle, FiVideo, FiEye, FiBarChart2, FiZap, FiBookmark } from 'react-icons/fi';
import DashboardCards from '../components/DashboardCards.jsx';
import ProfileCard from '../components/ProfileCard.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import videoService from '../services/videoService.js';
import bookmarkService from '../services/bookmarkService.js';


const Dashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    total_uploads: 0,
    recent_uploads: 0,
    processing: 0,
    completed: 0,
  });
  const [analyticsSummary, setAnalyticsSummary] = useState(null);
  const [recentVideos, setRecentVideos] = useState([]);
  const [bookmarkCount, setBookmarkCount] = useState(0);
  const [todayBookmarkCount, setTodayBookmarkCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const refreshRef = useRef(null);

  useEffect(() => {
    fetchDashboardData();
    return () => {
      if (refreshRef.current) {
        clearTimeout(refreshRef.current);
      }
    };
  }, []);

  const computeStatsFromVideos = (videoList) => ({
    total_uploads: videoList.length,
    recent_uploads: videoList.filter(v => {
      const daysAgo = (Date.now() - new Date(v.created_at).getTime()) / (1000 * 60 * 60 * 24);
      return daysAgo <= 7;
    }).length,
    processing: videoList.filter(v => v.status === 'uploaded' || v.status === 'processing').length,
    completed: videoList.filter(v => v.status === 'processed').length,
  });

  const fetchDashboardData = async () => {
    try {
      const [videos, statsResp, analytics, bookmarks] = await Promise.allSettled([
        // Only fetch the most recent videos for the list — the stat counters
        // come from a dedicated aggregate endpoint, so we don't need to pull
        // every video row just to count them.
        videoService.getVideos(0, 5),
        videoService.getDashboardStats().catch(() => null),
        videoService.getAnalyticsSummary().catch(() => null),
        bookmarkService.getBookmarks().catch(() => []),
      ]);

      if (videos.status === 'fulfilled') {
        const videoList = videos.value;
        setRecentVideos(videoList.slice(0, 5));
      }

      if (statsResp.status === 'fulfilled' && statsResp.value) {
        setStats(statsResp.value);
      } else if (videos.status === 'fulfilled') {
        // Fallback: derive counters client-side from the video list.
        setStats(computeStatsFromVideos(videos.value));
      }

      if (analytics.status === 'fulfilled') {
        setAnalyticsSummary(analytics.value);
      }

      if (bookmarks.status === 'fulfilled') {
        const bookmarkList = bookmarks.value;
        setBookmarkCount(bookmarkList.length);
        setTodayBookmarkCount(
          bookmarkList.filter(item =>
            new Date(item.created_at).toDateString() === new Date().toDateString()
          ).length
        );
      }
    } catch (err) {
      console.error('Failed to load dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  // Auto-refresh while anything is still processing so the dashboard
  // reflects completed pipelines without a manual page reload.
  useEffect(() => {
    if (!loading && stats.processing > 0 && !refreshRef.current) {
      refreshRef.current = setTimeout(() => {
        refreshRef.current = null;
        fetchDashboardData();
      }, 10000);
    }
  }, [loading, stats.processing]);

  const formatDuration = (seconds) => {
    if (!seconds) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="pt-6 pb-12">
      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 xl:px-10">
        {/* Header */}
        <div className="mb-4 sm:mb-6 lg:mb-8">
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-800">Dashboard</h1>
          <p className="text-sm sm:text-base text-gray-600 mt-1">
            Welcome back, {user?.full_name || user?.username}!
          </p>
        </div>

        {/* Dashboard Cards */}
        <DashboardCards stats={stats} />

        {/* Analytics Summary */}
        {analyticsSummary && (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-4 sm:mb-6 lg:mb-8">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 text-center">
              <FiEye className="text-blue-500 text-2xl mx-auto mb-2" />
              <p className="text-2xl font-bold text-gray-800">{analyticsSummary.total_views}</p>
              <p className="text-xs text-gray-500">Total Views</p>
            </div>
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 text-center">
              <FiVideo className="text-green-500 text-2xl mx-auto mb-2" />
              <p className="text-2xl font-bold text-gray-800">{analyticsSummary.processed_videos}</p>
              <p className="text-xs text-gray-500">Processed Videos</p>
            </div>
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 text-center">
              <FiBarChart2 className="text-purple-500 text-2xl mx-auto mb-2" />
              <p className="text-2xl font-bold text-gray-800">{analyticsSummary.avg_completion_rate}%</p>
              <p className="text-xs text-gray-500">Avg Completion</p>
            </div>
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 text-center">
              <FiZap className="text-yellow-500 text-2xl mx-auto mb-2" />
              <p className="text-2xl font-bold text-gray-800">{analyticsSummary.avg_views_per_video}</p>
              <p className="text-xs text-gray-500">Avg Views/Video</p>
            </div>
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 text-center">
              <FiBookmark className="text-indigo-500 text-2xl mx-auto mb-2" />
              <p className="text-2xl font-bold text-gray-800">{bookmarkCount}</p>
              <p className="text-xs text-gray-500">Bookmarks</p>
            </div>
          </div>
        )}

        {/* Bookmark Widget */}
        {!loading && bookmarkCount > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4 sm:mb-6 lg:mb-8">
            <div className="bg-white rounded-xl shadow-md p-4 sm:p-6">
              <p className="text-gray-500">Bookmarked Videos</p>
              <h2 className="text-3xl sm:text-4xl font-bold text-gray-800">{bookmarkCount}</h2>
            </div>
            <div className="bg-white rounded-xl shadow-md p-4 sm:p-6">
              <p className="text-gray-500">Today's Bookmarks</p>
              <h2 className="text-3xl sm:text-4xl font-bold text-gray-800">{todayBookmarkCount}</h2>
            </div>
          </div>
        )}

        {/* Two Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Profile Card */}
          <div className="lg:col-span-1">
            <ProfileCard />
          </div>

          {/* Recent Videos & Processing Status */}
          <div className="lg:col-span-2 space-y-6">
            {/* Recent Videos */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-4">
                <h3 className="text-lg font-semibold text-gray-800">Recent Videos</h3>
                <Link to="/my-videos" className="text-sm text-primary-600 hover:text-primary-700">
                  View All
                </Link>
              </div>

              {recentVideos.length > 0 ? (
                <div className="space-y-3">
                  {recentVideos.map(video => (
                    <Link
                      key={video.id}
                      to={`/videos/${video.id}`}
                      className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                    >
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center">
                          <FiVideo className="text-primary-600" />
                        </div>
                        <div>
                          <p className="font-medium text-gray-800 text-sm">{video.title}</p>
                          <p className="text-xs text-gray-500">
                            {formatDuration(video.duration)} • {new Date(video.created_at).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <span className={`inline-flex px-2 py-1 text-xs rounded-full ${
                        video.status === 'processed' ? 'bg-green-100 text-green-800' :
                        video.status === 'uploaded' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-blue-100 text-blue-800'
                      }`}>
                        {video.status}
                      </span>
                    </Link>
                  ))}
                </div>
              ) : (
                <div className="border-2 border-dashed border-gray-200 rounded-lg p-8 text-center">
                  <FiUpload className="mx-auto text-3xl text-gray-300 mb-3" />
                  <p className="text-gray-500 mb-3">No videos uploaded yet</p>
                  <Link
                    to="/upload"
                    className="inline-flex items-center px-4 py-2 bg-primary-600 text-white rounded-lg font-medium hover:bg-primary-700 transition-colors text-sm"
                  >
                    <FiUpload className="mr-2" /> Upload Your First Video
                  </Link>
                </div>
              )}
            </div>

            {/* Processing Status */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">
                Processing Status
              </h3>

              {stats.processing > 0 ? (
                <div className="space-y-3">
                  {recentVideos.filter(v => v.status === 'uploaded' || v.status === 'processing').map(video => (
                    <div key={video.id} className="flex items-center justify-between p-4 bg-blue-50 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                          <FiClock className="text-blue-600 text-xl" />
                        </div>
                        <div>
                          <p className="font-medium text-gray-800">{video.title}</p>
                          <p className="text-sm text-blue-600">Processing...</p>
                        </div>
                      </div>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                      <FiCheckCircle className="text-green-600 text-xl" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-800">All caught up!</p>
                      <p className="text-sm text-gray-500">
                        {stats.completed > 0
                          ? `${stats.completed} videos processed successfully`
                          : 'No videos are currently being processed'}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;