import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell,
  BarChart, Bar,
} from 'recharts';
import {
  FiEye, FiClock, FiCheckCircle, FiZap, FiFileText, FiList,
  FiBookmark, FiEdit3, FiPlay, FiArrowLeft, FiRefreshCw, FiAlertCircle,
  FiDownload,
} from 'react-icons/fi';
import videoService from '../services/videoService';
import bookmarkService from '../services/bookmarkService';
import reportService from '../services/reportService';


const COLORS = {
  primary: '#3B82F6',
  success: '#10B981',
  warning: '#F59E0B',
  danger: '#EF4444',
  purple: '#8B5CF6',
  gray: '#6B7280',
};

function Analytics() {
  const { videoId } = useParams();
  const navigate = useNavigate();
  const [video, setVideo] = useState(null);
  const [analytics, setAnalytics] = useState(null); // RichAnalyticsRead — includes AI stats
  const [keyMoments, setKeyMoments] = useState([]);
  const [bookmarks, setBookmarks] = useState([]);
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [bookmarkToggling, setBookmarkToggling] = useState(false);
  const [transcriptLanguage, setTranscriptLanguage] = useState('English');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [downloadingPDF, setDownloadingPDF] = useState(false);
  const [downloadingCSV, setDownloadingCSV] = useState(false);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);

      // The analytics endpoint (RichAnalyticsRead) now returns ALL computed
      // AI statistics (transcript_words, summary_words, compression_ratio,
      // key_moment_count, average_confidence) along with views/watch-time.
      // We still fetch key-moments and bookmarks separately for detail views.
      const [videoData, analyticsData, momentsData, bookmarksData] = await Promise.all([
        videoService.getVideo(videoId),
        videoService.getVideoAnalytics(videoId),
        videoService.getKeyMoments(videoId).catch(() => []),
        videoService.getBookmarks(videoId).catch(() => []),
      ]);

      setVideo(videoData);
      setAnalytics(analyticsData);
      setKeyMoments(Array.isArray(momentsData) ? momentsData : []);
      setBookmarks(Array.isArray(bookmarksData) ? bookmarksData : []);

      // Check if this specific video is bookmarked by the current user
      try {
        const bookmarked = await bookmarkService.checkBookmark(videoId);
        setIsBookmarked(bookmarked);
      } catch (_) {
        setIsBookmarked(false);
      }

      // Try to get the transcript language for display (non-critical)
      try {
        const t = await videoService.getTranscript(videoId);
        if (t?.language) setTranscriptLanguage(t.language);
      } catch (_) {
        // ignore
      }
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to load analytics data.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (videoId) loadData();
  }, [videoId]);

  const handleToggleBookmark = async () => {
    if (bookmarkToggling) return;
    setBookmarkToggling(true);
    try {
      if (isBookmarked) {
        await bookmarkService.removeBookmark(videoId);
        setIsBookmarked(false);
        setBookmarks((prev) => prev.filter((b) => b.video?.id !== Number(videoId)));
      } else {
        await bookmarkService.addBookmark(videoId);
        setIsBookmarked(true);
        const updated = await videoService.getBookmarks(videoId).catch(() => []);
        setBookmarks(Array.isArray(updated) ? updated : []);
      }
    } catch (err) {
      console.error('Failed to toggle bookmark:', err);
    } finally {
      setBookmarkToggling(false);
    }
  };

  const handleDownloadPDF = async () => {
    try {
      setDownloadingPDF(true);
      await reportService.downloadPDF(videoId);
    } finally {
      setDownloadingPDF(false);
    }
  };

  const handleDownloadCSV = async () => {
    try {
      setDownloadingCSV(true);
      await reportService.downloadCSV(videoId);
    } finally {
      setDownloadingCSV(false);
    }
  };

  const formatDuration = (seconds) => {
    if (!seconds && seconds !== 0) return 'N/A';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return 'N/A';
    return new Date(dateStr).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const formatNumber = (num) => {
    if (num === null || num === undefined) return '0';
    return num.toLocaleString();
  };

  const formatTimestamp = (seconds) => {
    if (!seconds && seconds !== 0) return 'N/A';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // All AI content statistics come directly from the RichAnalyticsRead response
  const transcriptWords = analytics?.transcript_word_count ?? 0;
  const summaryWords = analytics?.summary_word_count ?? 0;
  const videoDuration = video?.duration || 0;
  const compressionRatio = analytics?.compression_ratio ?? 0;
  const keywordCount = analytics?.keyword_count ?? 0;
  const completionRate = analytics?.completion_rate
    ? Math.round(analytics.completion_rate * 100)
    : 0;
  const totalViews = analytics?.views || 0;
  const totalWatchTimeMinutes = analytics?.total_watch_time
    ? Math.round(analytics.total_watch_time / 60)
    : 0;
  const hasWatchData = totalViews > 0;
  const avgConfidence = analytics?.average_confidence ?? (
    keyMoments.length > 0
      ? Math.round(keyMoments.reduce((sum, m) => sum + (m.confidence || 0), 0) / keyMoments.length * 100)
      : 0
  );
  const keyMomentCount = analytics?.key_moment_count ?? keyMoments.length;

  // Notes count: 1 if the video has all three AI-generated content pieces (transcript, summary, and key moments)
  const notesCount = (transcriptWords > 0 && summaryWords > 0 && keyMomentCount > 0) ? 1 : 0;

  // Watch time trend data (simulated from available data)
  const watchTimeData = [
    { day: 'Day 1', minutes: Math.round(totalWatchTimeMinutes * 0.15) },
    { day: 'Day 2', minutes: Math.round(totalWatchTimeMinutes * 0.35) },
    { day: 'Day 3', minutes: Math.round(totalWatchTimeMinutes * 0.25) },
    { day: 'Day 4', minutes: Math.round(totalWatchTimeMinutes * 0.18) },
    { day: 'Day 5', minutes: Math.round(totalWatchTimeMinutes * 0.07) },
  ];

  // AI Detection Confidence data
  const confidenceData = keyMoments.slice(0, 6).map((moment, index) => ({
    name: `Moment ${index + 1}`,
    confidence: moment.confidence ? Math.round(moment.confidence * 100) : 0,
    title: moment.title || `Moment ${index + 1}`,
  }));

  // Sort key moments by confidence for "Most Important" section
  const topMoments = [...keyMoments]
    .sort((a, b) => (b.confidence || 0) - (a.confidence || 0))
    .slice(0, 4);

  // User activity stats
  const userActivity = [
    { label: 'Bookmarks Created', value: bookmarks.length, max: 20, icon: FiBookmark, color: 'bg-blue-500' },
    { label: 'Notes Count', value: notesCount, max: 10, icon: FiEdit3, color: 'bg-green-500' },
    { label: 'Key Moments Viewed', value: keyMomentCount, max: 15, icon: FiPlay, color: 'bg-purple-500' },
  ];

  if (error) {
    return (
      <div className="pt-6 pb-12">
      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 xl:px-10">
        <div className="bg-red-50 border-2 border-red-300 text-red-800 px-6 py-4 rounded-xl mb-6 shadow-sm">
          <div className="flex items-start gap-3">
            <FiAlertCircle className="w-6 h-6 text-red-500 mt-0.5 flex-shrink-0" />
            <div>
              <h3 className="font-semibold text-red-800 text-lg">Failed to Load Analytics</h3>
              <p className="text-red-700 mt-1">{error}</p>
              <p className="text-red-500 text-sm mt-2">
                This could be because no analytics data exists yet for this video, or there's a temporary server issue.
              </p>
            </div>
          </div>
        </div>
        <div className="flex flex-wrap gap-3">
          <button
            onClick={loadData}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
          >
            <FiRefreshCw className="w-4 h-4" />
            Retry
          </button>
          <button
            onClick={() => navigate(`/videos/${videoId}`)}
            className="flex items-center gap-2 px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium"
          >
            <FiArrowLeft /> Back to Video
          </button>
        </div>
      </div>
    </div>
    );
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="pt-6 pb-12">
      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 xl:px-10">
      {/* Header */}
      <div className="mb-4 sm:mb-6 lg:mb-8">
        <button
          onClick={() => navigate(`/videos/${videoId}`)}
          className="text-blue-600 hover:text-blue-800 text-sm mb-3 inline-flex items-center gap-1"
        >
          <FiArrowLeft /> Back to Video
        </button>
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900">Video Analytics</h1>
            <p className="text-base sm:text-lg text-gray-600 mt-1">{video?.title || 'Untitled Video'}</p>
            <div className="flex flex-wrap items-center gap-4 mt-1 text-sm text-gray-500">
              <span>Uploaded: {formatDate(video?.created_at)}</span>
              <span>Last updated: {formatDate(video?.updated_at)}</span>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={handleToggleBookmark}
              disabled={bookmarkToggling}
              className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg border transition-colors disabled:opacity-50 ${
                isBookmarked
                  ? 'bg-blue-600 text-white border-blue-600 hover:bg-blue-700'
                  : 'text-gray-700 bg-white border-gray-300 hover:bg-gray-50'
              }`}
            >
              <FiBookmark className={`w-4 h-4 ${isBookmarked ? 'fill-current' : ''}`} />
              {isBookmarked ? 'Bookmarked' : 'Bookmark'}
            </button>
            <button
              onClick={handleDownloadPDF}
              disabled={downloadingPDF}
              className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
            >
              <FiDownload />
              {downloadingPDF ? "Downloading..." : "Export PDF"}
            </button>
            <button
              onClick={handleDownloadCSV}
              disabled={downloadingCSV}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
            >
              <FiDownload />
              {downloadingCSV ? "Downloading..." : "Export CSV"}
            </button>
            <button
              onClick={loadData}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <FiRefreshCw className="w-4 h-4" />
              Refresh
            </button>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6 mb-4 sm:mb-6 lg:mb-8">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-blue-100 rounded-lg">
              <FiEye className="w-6 h-6 text-blue-600" />
            </div>
          </div>
          <p className="text-3xl font-bold text-gray-900">{formatNumber(totalViews)}</p>
          <p className="text-sm text-gray-500 mt-1">Total Views</p>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-green-100 rounded-lg">
              <FiClock className="w-6 h-6 text-green-600" />
            </div>
          </div>
          <p className="text-3xl font-bold text-gray-900">{formatNumber(totalWatchTimeMinutes)}</p>
          <p className="text-sm text-gray-500 mt-1">Total Watch Time (min)</p>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-purple-100 rounded-lg">
              <FiCheckCircle className="w-6 h-6 text-purple-600" />
            </div>
          </div>
          <p className="text-3xl font-bold text-gray-900">{completionRate}%</p>
          <p className="text-sm text-gray-500 mt-1">Completion Rate</p>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-orange-100 rounded-lg">
              <FiZap className="w-6 h-6 text-orange-600" />
            </div>
          </div>
          <p className="text-3xl font-bold text-gray-900">{keyMomentCount}</p>
          <p className="text-sm text-gray-500 mt-1">AI Key Moments</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-6 mb-4 sm:mb-6 lg:mb-8">
        {/* AI Content Statistics */}
        <div className="lg:col-span-1 bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">AI Content Statistics</h2>

          <div className="space-y-6">
            {/* Transcript */}
            <div>
              <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wider flex items-center gap-2 mb-3">
                <FiFileText className="w-4 h-4 text-blue-500" />
                Transcript
              </h3>
              <div className="bg-gray-50 rounded-lg p-4 space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">Language</span>
                  <span className="font-medium text-gray-900">{transcriptLanguage || 'English'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Words</span>
                  <span className="font-medium text-gray-900">{formatNumber(transcriptWords)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Duration</span>
                  <span className="font-medium text-gray-900">{formatDuration(videoDuration)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Keywords</span>
                  <span className="font-medium text-gray-900">{keywordCount}</span>
                </div>
              </div>
            </div>

            {/* Summary */}
            <div>
              <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wider flex items-center gap-2 mb-3">
                <FiList className="w-4 h-4 text-green-500" />
                Summary
              </h3>
              <div className="bg-gray-50 rounded-lg p-4 space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">Summary Length</span>
                  <span className="font-medium text-gray-900">{formatNumber(summaryWords)} words</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Compression</span>
                  <span className="font-medium text-gray-900">{compressionRatio}%</span>
                </div>
              </div>
            </div>

            {/* Key Moments */}
            <div>
              <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wider flex items-center gap-2 mb-3">
                <FiZap className="w-4 h-4 text-purple-500" />
                Key Moments
              </h3>
              <div className="bg-gray-50 rounded-lg p-4 space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">Detected</span>
                  <span className="font-medium text-gray-900">{keyMomentCount}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Average Confidence</span>
                  <span className="font-medium text-gray-900">{avgConfidence}%</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Charts */}
        <div className="lg:col-span-2 space-y-6">
          {/* Watch Time Trend */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Watch Time Trend</h2>
            <div className="h-64 sm:h-80 lg:h-96">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={watchTimeData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" />
                  <XAxis dataKey="day" stroke="#9CA3AF" fontSize={12} />
                  <YAxis stroke="#9CA3AF" fontSize={12} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#FFF',
                      border: '1px solid #E5E7EB',
                      borderRadius: '8px',
                      boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)',
                    }}
                    formatter={(value) => [`${value} min`, 'Watch Time']}
                  />
                  <Line
                    type="monotone"
                    dataKey="minutes"
                    stroke={COLORS.primary}
                    strokeWidth={2}
                    dot={{ fill: COLORS.primary, strokeWidth: 2, r: 4 }}
                    activeDot={{ r: 6, fill: COLORS.primary }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Video Completion Rate - Donut Chart */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Video Completion Rate</h2>
              <div className="h-56 flex items-center justify-center">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={[
                        { name: 'Completed', value: completionRate },
                        { name: 'Not Completed', value: 100 - completionRate },
                      ]}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={90}
                      startAngle={90}
                      endAngle={-270}
                      dataKey="value"
                    >
                      <Cell fill={COLORS.primary} />
                      <Cell fill="#E5E7EB" />
                    </Pie>
                    <Tooltip
                      formatter={(value) => [`${value}%`, '']}
                      contentStyle={{
                        backgroundColor: '#FFF',
                        border: '1px solid #E5E7EB',
                        borderRadius: '8px',
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
                <div className="absolute flex flex-col items-center">
                  <span className="text-3xl font-bold text-gray-900">{completionRate}%</span>
                  <span className="text-xs text-gray-500">completed</span>
                </div>
              </div>
            </div>

            {/* AI Detection Confidence - Bar Chart */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">AI Detection Confidence</h2>
              <div className="h-56">
                {confidenceData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={confidenceData} layout="vertical" margin={{ left: 10, right: 30 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" horizontal={false} />
                      <XAxis type="number" domain={[0, 100]} stroke="#9CA3AF" fontSize={12} tickFormatter={(v) => `${v}%`} />
                      <YAxis type="category" dataKey="name" stroke="#9CA3AF" fontSize={11} width={70} />
                      <Tooltip
                        formatter={(value, name, props) => [`${value}%`, props.payload.title]}
                        contentStyle={{
                          backgroundColor: '#FFF',
                          border: '1px solid #E5E7EB',
                          borderRadius: '8px',
                        }}
                      />
                      <Bar dataKey="confidence" fill={COLORS.purple} radius={[0, 4, 4, 0]} barSize={16} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex items-center justify-center h-full text-gray-400 text-sm">
                    No key moments data available
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Video Statistics Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-6 mb-4 sm:mb-6 lg:mb-8">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Video Statistics</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-4 font-medium text-gray-500">Metric</th>
                <th className="text-right py-3 px-4 font-medium text-gray-500">Value</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              <tr className="hover:bg-gray-50">
                <td className="py-3 px-4 text-gray-700">Total Views</td>
                <td className="py-3 px-4 text-right font-medium text-gray-900">{formatNumber(totalViews)}</td>
              </tr>
              <tr className="hover:bg-gray-50">
                <td className="py-3 px-4 text-gray-700">Total Watch Time</td>
                <td className="py-3 px-4 text-right font-medium text-gray-900">{totalWatchTimeMinutes} min</td>
              </tr>
              <tr className="hover:bg-gray-50">
                <td className="py-3 px-4 text-gray-700">Completion Rate</td>
                <td className="py-3 px-4 text-right font-medium text-gray-900">{completionRate}%</td>
              </tr>
              <tr className="hover:bg-gray-50">
                <td className="py-3 px-4 text-gray-700">Video Duration</td>
                <td className="py-3 px-4 text-right font-medium text-gray-900">{formatDuration(videoDuration)}</td>
              </tr>
              <tr className="hover:bg-gray-50">
                <td className="py-3 px-4 text-gray-700">Transcript Length</td>
                <td className="py-3 px-4 text-right font-medium text-gray-900">{formatNumber(transcriptWords)} words</td>
              </tr>
              <tr className="hover:bg-gray-50">
                <td className="py-3 px-4 text-gray-700">Summary Length</td>
                <td className="py-3 px-4 text-right font-medium text-gray-900">{formatNumber(summaryWords)} words</td>
              </tr>
              <tr className="hover:bg-gray-50">
                <td className="py-3 px-4 text-gray-700">Compression Ratio</td>
                <td className="py-3 px-4 text-right font-medium text-gray-900">{compressionRatio}%</td>
              </tr>
              <tr className="hover:bg-gray-50">
                <td className="py-3 px-4 text-gray-700">Keywords</td>
                <td className="py-3 px-4 text-right font-medium text-gray-900">{keywordCount}</td>
              </tr>
              <tr className="hover:bg-gray-50">
                <td className="py-3 px-4 text-gray-700">Key Moments</td>
                <td className="py-3 px-4 text-right font-medium text-gray-900">{keyMomentCount}</td>
              </tr>
              <tr className="hover:bg-gray-50">
                <td className="py-3 px-4 text-gray-700">Bookmarks</td>
                <td className="py-3 px-4 text-right font-medium text-gray-900">{bookmarks.length}</td>
              </tr>
              <tr className="hover:bg-gray-50">
                <td className="py-3 px-4 text-gray-700">AI Confidence</td>
                <td className="py-3 px-4 text-right font-medium text-gray-900">{avgConfidence}%</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* AI Insights */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-6 mb-4 sm:mb-6 lg:mb-8">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">AI Insights</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-indigo-50 rounded-lg p-4">
            <p className="text-sm text-indigo-600 font-medium">Speaking Speed</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">
              {analytics?.speaking_speed ?? 0} wpm
            </p>
          </div>
          <div className="bg-green-50 rounded-lg p-4">
            <p className="text-sm text-green-600 font-medium">Reading Time</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">
              {analytics?.reading_time ?? 0} min
            </p>
          </div>
          <div className="bg-blue-50 rounded-lg p-4">
            <p className="text-sm text-blue-600 font-medium">Compression</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">
              {analytics?.compression_ratio ?? 0}%
            </p>
          </div>
          <div className="bg-purple-50 rounded-lg p-4">
            <p className="text-sm text-purple-600 font-medium">AI Confidence</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">
              {analytics?.average_confidence ?? 0}%
            </p>
          </div>
          <div className="bg-orange-50 rounded-lg p-4">
            <p className="text-sm text-orange-600 font-medium">Processing Score</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">
              {analytics?.processing_score ?? 0}%
            </p>
          </div>
          <div className="bg-teal-50 rounded-lg p-4">
            <p className="text-sm text-teal-600 font-medium">Video Quality</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">
              {analytics?.video_quality ?? 'N/A'}
            </p>
          </div>
          <div className="bg-rose-50 rounded-lg p-4">
            <p className="text-sm text-rose-600 font-medium">Summary Quality</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">
              {analytics?.summary_quality ?? 'N/A'}
            </p>
          </div>
          <div className="bg-cyan-50 rounded-lg p-4">
            <p className="text-sm text-cyan-600 font-medium">Transcript Density</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">
              {analytics?.transcript_density ?? 0} wpm
            </p>
          </div>
        </div>
      </div>

      {/* Top 10 Keywords */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-6 mb-4 sm:mb-6 lg:mb-8">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Top 10 Keywords</h2>
        {analytics?.top_keywords && analytics.top_keywords.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {analytics.top_keywords.map((item) => (
              <span
                key={item.keyword}
                className="px-3 py-1 rounded-full bg-indigo-100 text-indigo-700 text-sm font-medium"
              >
                {item.keyword} ({item.count})
              </span>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-gray-400 text-sm">
            No keywords extracted yet. Generate a transcript to see keywords here.
          </div>
        )}
      </div>

      {/* Most Important Key Moments */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-6 mb-4 sm:mb-6 lg:mb-8">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Most Important Key Moments</h2>
        {topMoments.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 font-medium text-gray-500">Time</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-500">Title</th>
                  <th className="text-right py-3 px-4 font-medium text-gray-500">Confidence</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {topMoments.map((moment) => (
                  <tr
                    key={moment.id}
                    className="hover:bg-gray-50 cursor-pointer"
                    onClick={() => navigate(`/videos/${videoId}?t=${moment.start_time || 0}`)}
                  >
                    <td className="py-3 px-4 font-mono text-blue-600 font-medium">
                      {formatTimestamp(moment.start_time)}
                    </td>
                    <td className="py-3 px-4 text-gray-900 font-medium">{moment.title}</td>
                    <td className="py-3 px-4 text-right">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-50 text-green-700 border border-green-200">
                        {moment.confidence ? Math.round(moment.confidence * 100) : 0}%
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-8 text-gray-400 text-sm">
            No key moments detected yet. Generate key moments to see them here.
          </div>
        )}
      </div>

      {/* User Activity */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-6 mb-4 sm:mb-6 lg:mb-8">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">User Activity</h2>
        <div className="space-y-4">
          {userActivity.map((activity) => {
            const Icon = activity.icon;
            const percentage = activity.max > 0 ? Math.min((activity.value / activity.max) * 100, 100) : 0;
            return (
              <div key={activity.label} className="flex items-center gap-4">
                <div className={`p-2 rounded-lg ${activity.color} bg-opacity-10`}>
                  <Icon className={`w-5 h-5 ${activity.color.replace('bg-', 'text-')}`} />
                </div>
                <div className="flex-1">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-sm font-medium text-gray-700">{activity.label}</span>
                    <span className="text-sm font-bold text-gray-900">{activity.value}</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2.5">
                    <div
                      className={`h-2.5 rounded-full transition-all duration-500 ${activity.color}`}
                      style={{ width: `${percentage}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Footer */}
      <div className="text-center py-6 border-t border-gray-200">
        <p className="text-sm text-gray-400">Generated by ClipMind AI</p>
        <p className="text-xs text-gray-400 mt-1">
          Last Updated: {new Date().toLocaleDateString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: 'numeric',
            minute: '2-digit',
            hour12: true,
          })}
        </p>
      </div>
      </div>
    </div>
  );
}

export default Analytics;