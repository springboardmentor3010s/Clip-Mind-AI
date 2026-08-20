import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  FiArrowLeft, FiClock, FiFileText, FiList, FiBarChart2,
  FiBookmark, FiPlay, FiDownload, FiTrash2, FiEdit3,
  FiCheck, FiX, FiAlertCircle, FiLoader, FiZap, FiBookOpen,
} from 'react-icons/fi';
import videoService from '../services/videoService.js';
import bookmarkService from '../services/bookmarkService.js';
import reportService from '../services/reportService.js';
import historyService from '../services/historyService.js';


const VideoDetail = () => {
  const { videoId } = useParams();
  const navigate = useNavigate();
  const videoRef = useRef(null);

  const [video, setVideo] = useState(null);
  const [transcript, setTranscript] = useState(null);
  const [summary, setSummary] = useState(null);
  const [summaryStatus, setSummaryStatus] = useState(null); // null | 'processing' | 'failed'
  const [keyMoments, setKeyMoments] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [bookmarks, setBookmarks] = useState([]);
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [bookmarkToggling, setBookmarkToggling] = useState(false);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('moments');
  const [detectingMoments, setDetectingMoments] = useState(false);
  const [generatingTranscript, setGeneratingTranscript] = useState(false);
  const [generatingSummary, setGeneratingSummary] = useState(false);
  const [viewRecorded, setViewRecorded] = useState(false);
  const [downloadingPDF, setDownloadingPDF] = useState(false);
  const [downloadingCSV, setDownloadingCSV] = useState(false);

  const pollingRef = useRef(null);
  const keyMomentPolling = useRef(null);

  // Cleanup polling on unmount
  useEffect(() => {
    return () => {
      if (pollingRef.current) {
        clearInterval(pollingRef.current);
      }
      if (keyMomentPolling.current) {
        clearInterval(keyMomentPolling.current);
      }
    };
  }, []);

  useEffect(() => {
    fetchVideoData();
  }, [videoId]);

  // Record a view when the video page is loaded
  useEffect(() => {
    if (videoId && !viewRecorded) {
      // Record view after a short delay to ensure page is fully loaded
      const timer = setTimeout(async () => {
        try {
          await videoService.recordView(videoId, 0, true);
          setViewRecorded(true);
        } catch (err) {
          // Silently fail - view tracking is non-critical
          console.warn('Failed to record view:', err);
        }
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [videoId, viewRecorded]);

  // Track video playback for watch time and completion
  const handleVideoTimeUpdate = async () => {
    if (!videoRef.current || !video?.duration) return;
    const watchedDuration = videoRef.current.currentTime;
    const videoDuration = video.duration;

    // Update completion rate periodically (every 10 seconds of playback)
    if (Math.floor(watchedDuration) % 10 === 0 && watchedDuration > 0) {
      try {
        await videoService.updateCompletion(videoId, watchedDuration);
      } catch (err) {
        // Silently fail
      }
    }

    // Record watch history
    try {
      const completion = videoDuration ? watchedDuration / videoDuration : 0;
      await historyService.record(videoId, {
        watch_duration: watchedDuration,
        completion_rate: Math.min(completion, 1),
      });
    } catch (err) {
      // Non-critical
    }
  };

  const startPolling = () => {
  if (pollingRef.current) {
    clearInterval(pollingRef.current);
  }

  pollingRef.current = setInterval(async () => {
    try {
      const result = await videoService.getSummary(videoId);

      if (result?.short_summary) {
        setSummary(result);
        setSummaryStatus(null);
        setGeneratingSummary(false);

        clearInterval(pollingRef.current);
        pollingRef.current = null;

        fetchVideoData();
      }

    } catch (err) {

      if (err.response?.status === 202) {
        return;
      }

      if (err.response?.status === 404) {
        return;
      }

      clearInterval(pollingRef.current);
      pollingRef.current = null;
      setGeneratingSummary(false);
      setSummaryStatus("failed");

    }

  }, 30000);
};

  const startKeyMomentPolling = () => {
    if (keyMomentPolling.current) {
      clearInterval(keyMomentPolling.current);
    }

    keyMomentPolling.current = setInterval(async () => {
      try {
        const moments = await videoService.getKeyMoments(videoId);

        if (moments && moments.length > 0) {
          setKeyMoments(moments);

          clearInterval(keyMomentPolling.current);
          keyMomentPolling.current = null;
        }
      } catch (e) {
        // Silently retry
      }
    }, 3000);
  };

  const fetchVideoData = async () => {
    try {
      setLoading(true);

      const [videoData, transcriptData, summaryResult, momentsData, analyticsData, bookmarksData] =
        await Promise.allSettled([
          videoService.getVideo(videoId),
          videoService.getTranscript(videoId),
          videoService.getSummary(videoId),
          videoService.getKeyMoments(videoId),
          videoService.getVideoAnalytics(videoId),
          videoService.getBookmarks(videoId),
        ]);

      if (videoData.status === 'fulfilled') {
        setVideo(videoData.value);

        if (videoData.value.status === "completed") {
          if (pollingRef.current) {
            clearInterval(pollingRef.current);
            pollingRef.current = null;
          }
          setSummaryStatus(null);
          setGeneratingSummary(false);
        }
      }
      if (transcriptData.status === 'fulfilled') setTranscript(transcriptData.value);
      if (momentsData.status === 'fulfilled') setKeyMoments(momentsData.value);
      if (analyticsData.status === 'fulfilled') setAnalytics(analyticsData.value);
      if (bookmarksData.status === 'fulfilled') setBookmarks(bookmarksData.value);

      // Check if this video is bookmarked by the current user
      try {
        const bookmarked = await bookmarkService.checkBookmark(videoId);
        setIsBookmarked(bookmarked);
      } catch (_) {
        setIsBookmarked(false);
      }

      // Track whether we should auto-generate summary
      let shouldAutoGenerate = false;

      // Handle summary - check for 202 (processing/failed) or 200 (ready) or 404 (not found)
      if (summaryResult.status === 'fulfilled') {
        // Summary was returned successfully (200)
        setSummary(summaryResult.value);
      } else {
        // Promise was rejected - check the error status
        const err = summaryResult.reason;
        const statusCode = err?.response?.status;
        const responseData = err?.response?.data;
        
        if (statusCode === 202) {
          if (responseData?.status === 'failed') {
            setSummaryStatus('failed');
          } else if (responseData?.status === 'processing_summary' || responseData?.status === 'processing') {
            // Start polling since summary is being generated
            setSummaryStatus("processing");

            if (!pollingRef.current) {
              startPolling();
            }
          }
        } else if (statusCode === 404) {
          // No summary exists - auto-generate if transcript exists
          shouldAutoGenerate = true;
        }
      }

      // If transcript exists and no summary, trigger generation
      if (
        shouldAutoGenerate &&
        transcriptData.status === 'fulfilled' &&
        transcriptData.value
      ) {
        handleGenerateSummary(false);
      }
    } catch (err) {
      setError('Failed to load video data');
    } finally {
      setLoading(false);
    }
  };

  const handleDetectMoments = async () => {
    try {
      setDetectingMoments(true);
      await videoService.detectKeyMoments(videoId);
      // Key moment detection is being processed in the background
      // Switch to moments tab and start polling
      setActiveTab("moments");
      startKeyMomentPolling();
    } catch (err) {
      // Ignore 202 Accepted errors - this is expected for async processing
      if (err.response?.status !== 202) {
        console.error('Failed to detect key moments:', err.response?.data?.detail || err.message);
      } else {
        setActiveTab("moments");
        startKeyMomentPolling();
      }
    } finally {
      setDetectingMoments(false);
    }
  };

  const handleGenerateTranscript = async () => {
    try {
      setGeneratingTranscript(true);
      const transcript = await videoService.generateTranscript(videoId);
      setTranscript(transcript);
    } catch (err) {
      alert('Failed to generate transcript: ' + (err.response?.data?.detail || err.message));
    } finally {
      setGeneratingTranscript(false);
    }
  };

  const handleGenerateSummary = async (showAlert = true) => {
    try {
      setGeneratingSummary(true);
      const result = await videoService.generateSummary(videoId);

      // If summary was already generated, update state immediately
      if (result && result.short_summary) {
        setSummary(result);
        setGeneratingSummary(false);
        return;
      }

      // Backend returned 202 Accepted - start polling
      startPolling();
      setActiveTab("summary");
      setSummaryStatus("processing");
      setGeneratingSummary(false);
      return;

    } catch (err) {
      const status = err.response?.status;
      const data = err.response?.data;

      // If backend returned 202 with status info
      if (status === 202) {
        if (data?.status === 'processing_summary' || data?.status === 'processing') {
          startPolling();
          setActiveTab("summary");
          setSummaryStatus("processing");
        }
      } else {
        console.error('Failed to generate summary:', err.response?.data?.detail || err.message);
      }
    } finally {
      setGeneratingSummary(false);
    }
  };

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

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this video?')) return;
    try {
      await videoService.deleteVideo(videoId);
      navigate('/my-videos');
    } catch (err) {
      alert('Failed to delete video');
    }
  };

  const handleDownloadPDF = async () => {
    try {
      setDownloadingPDF(true);
      await reportService.downloadPDF(videoId);
    } catch (err) {
      alert("Failed to download PDF.");
    } finally {
      setDownloadingPDF(false);
    }
  };

  const handleDownloadCSV = async () => {
    try {
      setDownloadingCSV(true);
      await reportService.downloadCSV(videoId);
    } catch (err) {
      alert("Failed to download CSV.");
    } finally {
      setDownloadingCSV(false);
    }
  };

  const seekTo = (seconds) => {
    if (videoRef.current) {
      videoRef.current.currentTime = seconds;
      videoRef.current.play();
    }
  };

  const formatDuration = (seconds) => {
    if (!seconds) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const formatTimestamp = (seconds) => {
    if (seconds === null || seconds === undefined) return 'N/A';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const formatFileSize = (bytes) => {
    if (!bytes) return 'N/A';
    const mb = bytes / (1024 * 1024);
    return `${mb.toFixed(1)} MB`;
  };

  if (loading) {
    return (
      <div className="pt-6 pb-12">
        <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 xl:px-10">
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto"></div>
            <p className="text-gray-500 mt-2">Loading video...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error || !video) {
    return (
      <div className="pt-6 pb-12">
        <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 xl:px-10">
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-center">
            <FiAlertCircle className="mr-2" />
            {error || 'Video not found'}
          </div>
        </div>
      </div>
    );
  }

  const tabs = [
    { id: 'transcript', label: 'Transcript', icon: FiFileText, disabled: !transcript },
    { id: 'summary', label: 'Summary', icon: FiList, disabled: !transcript },
    { id: 'moments', label: 'Key Moments', icon: FiZap, disabled: false },
    { id: 'analytics', label: 'Analytics', icon: FiBarChart2, disabled: false },
    { id: 'bookmarks', label: 'Bookmarks', icon: FiBookmark, disabled: false },
  ];

  return (
    <div className="pt-6 pb-12">
      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 xl:px-10">
        {/* Header */}
        <div className="mb-6">
          <button
            onClick={() => navigate('/my-videos')}
            className="flex items-center text-gray-600 hover:text-gray-800 mb-4"
          >
            <FiArrowLeft className="mr-1" /> Back to My Videos
          </button>
          <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-800">{video.title}</h1>
              {video.description && (
                <p className="text-sm sm:text-base text-gray-600 mt-1">{video.description}</p>
              )}
            </div>
            <div className="flex flex-wrap gap-2">
              {transcript && (
                <Link
                  to={`/videos/${videoId}/transcript`}
                  className="flex items-center px-3 py-2 bg-primary-50 text-primary-700 rounded-lg hover:bg-primary-100 transition-colors text-sm"
                >
                  <FiFileText className="mr-1" /> View Transcript
                </Link>
              )}
              {summary && (
                <Link
                  to={`/videos/${videoId}/summary`}
                  className="flex items-center px-3 py-2 bg-green-50 text-green-700 rounded-lg hover:bg-green-100 transition-colors text-sm"
                >
                  <FiList className="mr-1" /> View Summary
                </Link>
              )}
              <Link
                to={`/videos/${videoId}/key-moments`}
                className="flex items-center px-3 py-2 bg-yellow-50 text-yellow-700 rounded-lg hover:bg-yellow-100 transition-colors text-sm"
              >
                <FiZap className="mr-1" /> Key Moments
              </Link>
              {(transcript || summary) && (
                <Link
                  to={`/videos/${videoId}/quiz`}
                  className="flex items-center px-3 py-2 bg-purple-50 text-purple-700 rounded-lg hover:bg-purple-100 transition-colors text-sm"
                >
                  <FiZap className="mr-1" /> Generate Quiz
                </Link>
              )}
              {(transcript || summary) && (
                <Link
                  to={`/videos/${videoId}/notes`}
                  className="flex items-center px-3 py-2 bg-indigo-50 text-indigo-700 rounded-lg hover:bg-indigo-100 transition-colors text-sm"
                >
                  <FiBookOpen className="mr-1" /> View Notes
                </Link>
              )}
              <button
                onClick={handleDownloadPDF}
                disabled={downloadingPDF}
                className="flex items-center px-3 py-2 bg-red-50 text-red-700 rounded-lg hover:bg-red-100"
              >
                <FiDownload className="mr-1" />
                {downloadingPDF ? "Downloading..." : "PDF Report"}
              </button>
              <button
                onClick={handleDownloadCSV}
                disabled={downloadingCSV}
                className="flex items-center px-3 py-2 bg-green-50 text-green-700 rounded-lg hover:bg-green-100"
              >
                <FiDownload className="mr-1" />
                {downloadingCSV ? "Downloading..." : "CSV Report"}
              </button>
              <button
                onClick={handleDelete}
                className="flex items-center px-3 py-2 bg-red-50 text-red-700 rounded-lg hover:bg-red-100 transition-colors text-sm"
              >
                <FiTrash2 className="mr-1" /> Delete
              </button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Video Player & Info */}
          <div className="lg:col-span-2 space-y-6">
            {/* Video Player */}
            <div className="bg-black rounded-xl overflow-hidden aspect-video flex items-center justify-center">
              {video.video_url ? (
                <video
                  ref={videoRef}
                  controls
                  className="w-full h-full"
                  src={video.video_url}
                  poster={video.thumbnail_url}
                  onTimeUpdate={handleVideoTimeUpdate}
                >
                  Your browser does not support the video tag.
                </video>
              ) : video.file_path ? (
                <video
                  ref={videoRef}
                  controls
                  className="w-full h-full"
                  src={video.file_path}
                  poster={video.thumbnail_url}
                  onTimeUpdate={handleVideoTimeUpdate}
                >
                  Your browser does not support the video tag.
                </video>
              ) : (
                <div className="text-white text-center">
                  <FiPlay className="text-6xl mx-auto mb-2" />
                  <p>Video file not available</p>
                </div>
              )}
            </div>

            {/* Video Metadata */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-5">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center">
                  <p className="text-sm text-gray-500">Duration</p>
                  <p className="font-semibold text-gray-800 flex items-center justify-center">
                    <FiClock className="mr-1 text-primary-500" />
                    {formatDuration(video.duration)}
                  </p>
                </div>
                <div className="text-center">
                  <p className="text-sm text-gray-500">File Size</p>
                  <p className="font-semibold text-gray-800">{formatFileSize(video.file_size)}</p>
                </div>
                <div className="text-center">
                  <p className="text-sm text-gray-500">Status</p>
                  <span className={`inline-flex px-2 py-1 text-xs rounded-full font-medium ${
                    video.status === 'processed' || video.status === 'completed' ? 'bg-green-100 text-green-800' :
                    video.status === 'uploaded' ? 'bg-yellow-100 text-yellow-800' :
                    video.status === 'processing' || video.status === 'processing_summary' ? 'bg-blue-100 text-blue-800' :
                    'bg-red-100 text-red-800'
                  }`}>
                    {video.status}
                  </span>
                </div>
                <div className="text-center">
                  <p className="text-sm text-gray-500">Uploaded</p>
                  <p className="font-semibold text-gray-800 text-sm">
                    {new Date(video.created_at).toLocaleDateString()}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar - Tabs Content */}
          <div className="space-y-4">
            {/* Action Buttons */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
              <div className="space-y-2">
                {!transcript && (
                  <button
                    onClick={handleGenerateTranscript}
                    disabled={generatingTranscript}
                    className="w-full flex items-center justify-center px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors text-sm disabled:opacity-50"
                  >
                    <FiFileText className="mr-2" />
                    {generatingTranscript ? 'Generating Transcript...' : 'Generate Transcript'}
                  </button>
                )}
                {transcript && !summary && !generatingSummary && summaryStatus !== "processing" && (
                  <button
                    onClick={() => handleGenerateSummary(true)}
                    disabled={generatingSummary}
                    className="w-full flex items-center justify-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm disabled:opacity-50"
                  >
                    <FiList className="mr-2" />
                    Generate Summary
                  </button>
                )}
                {(generatingSummary || summaryStatus === "processing") && (
                  <div className="w-full flex items-center justify-center px-4 py-2 bg-blue-50 text-blue-700 rounded-lg text-sm">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-700 mr-2"></div>
                    Generating Summary...
                  </div>
                )}
                {transcript && summary && (
                  <div className="text-center text-sm text-green-700 bg-green-50 px-3 py-2 rounded-lg">
                    ✓ All AI processing complete
                  </div>
                )}
              </div>
            </div>

            {/* Tab Navigation */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="flex flex-wrap">
                {tabs.map(tab => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    disabled={tab.disabled}
                    className={`flex-1 flex items-center justify-center px-3 py-3 text-sm font-medium transition-colors ${
                      activeTab === tab.id
                        ? 'bg-primary-50 text-primary-700 border-b-2 border-primary-600'
                        : tab.disabled
                        ? 'text-gray-300 cursor-not-allowed'
                        : 'text-gray-600 hover:bg-gray-50 border-b-2 border-transparent'
                    }`}
                  >
                    <tab.icon className="mr-1" />
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Tab Content */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-5 min-h-[300px]">
              {/* Transcript Tab */}
              {activeTab === 'transcript' && (
                <div>
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="font-semibold text-gray-800 flex items-center">
                      <FiFileText className="mr-2 text-primary-500" />
                      Transcript
                    </h3>
                    {transcript?.language && (
                      <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">
                        {transcript.language.toUpperCase()}
                      </span>
                    )}
                  </div>
                  {transcript ? (
                    <div className="prose prose-sm max-w-none">
                      <p className="text-gray-700 whitespace-pre-wrap leading-relaxed">
                        {transcript.transcript}
                      </p>
                      {transcript.confidence && (
                        <p className="text-xs text-gray-400 mt-4">
                          Confidence: {transcript.confidence}%
                        </p>
                      )}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      <FiFileText className="text-4xl mx-auto mb-2 text-gray-300" />
                      <p>No transcript available yet.</p>
                      <p className="text-sm">Video may still be processing.</p>
                    </div>
                  )}
                </div>
              )}

              {/* Summary Tab */}
              {activeTab === 'summary' && (
                <div>
                  <h3 className="font-semibold text-gray-800 flex items-center mb-4">
                    <FiList className="mr-2 text-primary-500" />
                    AI Summary
                  </h3>
                  {summary ? (
                    <div className="space-y-4">
                      <div>
                        <h4 className="text-sm font-semibold text-gray-700 mb-2">Short Summary</h4>
                        <p className="text-gray-700 leading-relaxed">{summary.short_summary}</p>
                      </div>
                      <div>
                        <h4 className="text-sm font-semibold text-gray-700 mb-2">Detailed Summary</h4>
                        <p className="text-gray-700 leading-relaxed">{summary.detailed_summary}</p>
                      </div>
                      {summary.model_used && (
                        <p className="text-xs text-gray-400">
                          Generated using: {summary.model_used}
                        </p>
                      )}
                    </div>
                  ) : summaryStatus === 'processing' || generatingSummary || video?.status === "processing_summary" ? (
                    <div className="text-center py-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto mb-3"></div>
                      <p className="text-gray-600 font-medium">Generating summary...</p>
                      <p className="text-sm text-gray-500 mt-2">This may take a few minutes depending on video length.</p>
                    </div>
                  ) : summaryStatus === 'failed' ? (
                    <div className="text-center py-8 text-red-500">
                      <FiAlertCircle className="text-4xl mx-auto mb-2 text-red-300" />
                      <p className="font-medium">Summary generation failed.</p>
                      <p className="text-sm mt-2">Click "Generate Summary" to retry.</p>
                    </div>
                  ) : transcript ? (
                    <div className="text-center py-8 text-gray-500">
                      <FiList className="text-4xl mx-auto mb-2 text-gray-300" />
                      <p>No summary available yet.</p>
                      <p className="text-sm mt-2">Click "Generate Summary" to create one.</p>
                    </div>
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      <FiFileText className="text-4xl mx-auto mb-2 text-gray-300" />
                      <p>Please generate a transcript first.</p>
                    </div>
                  )}
                </div>
              )}

              {/* Key Moments Tab - YouTube Style Timeline */}
              {activeTab === 'moments' && (
                <div>
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="font-semibold text-gray-800 flex items-center">
                      <FiZap className="mr-2 text-yellow-500" />
                      Key Moments
                    </h3>
                    <button
                      onClick={handleDetectMoments}
                      disabled={detectingMoments}
                      className="flex items-center px-3 py-1.5 bg-yellow-50 text-yellow-700 rounded-lg hover:bg-yellow-100 transition-colors text-sm disabled:opacity-50"
                    >
                      <FiZap className="mr-1" />
                      {detectingMoments ? 'Detecting...' : 'Auto Detect'}
                    </button>
                  </div>
                  {keyMoments.length > 0 ? (
                    <div className="space-y-2">
                      {keyMoments.map((moment, index) => (
                        <button
                          key={moment.id || index}
                          onClick={() => seekTo(moment.start_time)}
                          className="w-full text-left p-3 bg-gray-50 rounded-lg border border-gray-100 hover:bg-yellow-50 hover:border-yellow-200 transition-all cursor-pointer group"
                        >
                          <div className="flex justify-between items-start mb-1">
                            <h4 className="font-medium text-gray-800 text-sm group-hover:text-yellow-700 transition-colors">
                              {moment.title}
                            </h4>
                            <span className="text-xs bg-primary-100 text-primary-700 px-2 py-0.5 rounded-full whitespace-nowrap ml-2">
                            {formatTimestamp(moment.start_time)}
                            </span>
                          </div>
                          <p className="text-sm text-gray-600 line-clamp-2">{moment.description}</p>
                          <div className="mt-2 flex items-center gap-3">
                            {moment.end_time && moment.end_time !== moment.start_time && (
                              <span className="text-xs text-gray-400">
                                {formatTimestamp(moment.start_time)} &ndash; {formatTimestamp(moment.end_time)}
                              </span>
                            )}
                            {moment.confidence !== null && moment.confidence !== undefined && (
                              <div className="flex items-center flex-1">
                                <div className="flex-1 bg-gray-200 rounded-full h-1.5 max-w-[100px]">
                                  <div
                                    className="bg-yellow-500 h-1.5 rounded-full transition-all"
                                    style={{ width: `${Math.min((moment.confidence || 0) * 100, 100)}%` }}
                                  ></div>
                                </div>
                                <span className="text-xs text-gray-500 ml-2">
                                  {moment.confidence && typeof moment.confidence === 'number' && moment.confidence <= 1
                                    ? `${Math.round(moment.confidence * 100)}%`
                                    : `${Math.round(moment.confidence || 0)}%`
                                  }
                                </span>
                              </div>
                            )}
                          </div>
                        </button>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      <FiZap className="text-4xl mx-auto mb-2 text-gray-300" />
                      <p>No key moments detected yet.</p>
                      <p className="text-sm">Click "Auto Detect" to analyze the transcript.</p>
                    </div>
                  )}
                </div>
              )}

              {/* Analytics Tab */}
              {activeTab === 'analytics' && (
                <div>
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="font-semibold text-gray-800 flex items-center">
                      <FiBarChart2 className="mr-2 text-primary-500" />
                      Video Analytics
                    </h3>
                    <Link
                      to={`/videos/${videoId}/analytics`}
                      className="flex items-center px-3 py-1.5 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors text-sm"
                    >
                      <FiBarChart2 className="mr-1" />
                      Full Dashboard
                    </Link>
                  </div>
                  {analytics ? (
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="p-3 bg-blue-50 rounded-lg text-center">
                          <p className="text-2xl font-bold text-blue-700">{analytics.views}</p>
                          <p className="text-xs text-blue-600">Views</p>
                        </div>
                        <div className="p-3 bg-green-50 rounded-lg text-center">
                          <p className="text-2xl font-bold text-green-700">{analytics.unique_viewers}</p>
                          <p className="text-xs text-green-600">Unique Viewers</p>
                        </div>
                        <div className="p-3 bg-purple-50 rounded-lg text-center">
                          <p className="text-2xl font-bold text-purple-700">
                            {Math.round(analytics.avg_watch_duration)}s
                          </p>
                          <p className="text-xs text-purple-600">Avg Watch Time</p>
                        </div>
                        <div className="p-3 bg-orange-50 rounded-lg text-center">
                          <p className="text-2xl font-bold text-orange-700">
                            {Math.round(analytics.completion_rate * 100)}%
                          </p>
                          <p className="text-xs text-orange-600">Completion Rate</p>
                        </div>
                      </div>

                      {/* Bookmark Toggle */}
                      <div className="pt-2 border-t border-gray-100">
                        <button
                          onClick={handleToggleBookmark}
                          disabled={bookmarkToggling}
                          className={`w-full flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium rounded-lg border transition-colors disabled:opacity-50 ${
                            isBookmarked
                              ? 'bg-primary-600 text-white border-primary-600 hover:bg-primary-700'
                              : 'text-gray-700 bg-white border-gray-300 hover:bg-gray-50'
                          }`}
                        >
                          <FiBookmark className={`w-4 h-4 ${isBookmarked ? 'fill-current' : ''}`} />
                          {isBookmarked ? 'Bookmarked' : 'Bookmark this video'}
                        </button>
                        {isBookmarked && (
                          <p className="text-xs text-gray-400 text-center mt-2">
                            Saved to your bookmarks
                          </p>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      <FiBarChart2 className="text-4xl mx-auto mb-2 text-gray-300" />
                      <p>No analytics data yet.</p>
                      <p className="text-sm">Analytics will appear as viewers watch your video.</p>
                      <Link
                        to={`/videos/${videoId}/analytics`}
                        className="inline-flex items-center mt-3 px-4 py-2 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors text-sm"
                      >
                        <FiBarChart2 className="mr-1" />
                        View Full Analytics Dashboard
                      </Link>
                    </div>
                  )}
                </div>
              )}

              {/* Bookmarks Tab */}
              {activeTab === 'bookmarks' && (
                <div>
                  <h3 className="font-semibold text-gray-800 flex items-center mb-4">
                    <FiBookmark className="mr-2 text-primary-500" />
                    Bookmarks
                  </h3>
                  {bookmarks.length > 0 ? (
                    <div className="space-y-3">
                      {bookmarks.map((bookmark, index) => (
                        <div key={bookmark.id || index} className="p-3 bg-gray-50 rounded-lg border border-gray-100">
                          <div className="flex justify-between items-start">
                            <div>
                              <p className="text-sm font-medium text-gray-800">
                                {bookmark.video?.title || video?.title || 'Bookmarked Video'}
                              </p>
                              <p className="text-xs text-gray-400 mt-1">
                                Saved on {new Date(bookmark.created_at).toLocaleDateString()}
                              </p>
                            </div>
                            <span className="text-xs bg-primary-100 text-primary-700 px-2 py-0.5 rounded-full">
                              <FiBookmark className="inline mr-1" />
                              Saved
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      <FiBookmark className="text-4xl mx-auto mb-2 text-gray-300" />
                      <p>No bookmarks yet.</p>
                      <p className="text-sm">Bookmark this video to save it for later.</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VideoDetail;