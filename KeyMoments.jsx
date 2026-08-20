import { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  detectKeyMoments,
  getKeyMoments,
} from '../services/keyMomentService';
import bookmarkService from '../services/bookmarkService';


function KeyMoments() {
  const { videoId } = useParams();
  const navigate = useNavigate();
  const [moments, setMoments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [detecting, setDetecting] = useState(false);
  const [error, setError] = useState(null);
  const [savingId, setSavingId] = useState(null);
  const [savedIds, setSavedIds] = useState(new Set());
  const pollingRef = useRef(null);

  // Cleanup polling on unmount
  useEffect(() => {
    return () => {
      if (pollingRef.current) {
        clearInterval(pollingRef.current);
        pollingRef.current = null;
      }
    };
  }, []);

  const startPolling = () => {
    if (pollingRef.current) {
      clearInterval(pollingRef.current);
    }

    setDetecting(true);

    pollingRef.current = setInterval(async () => {
      try {
        const momentsData = await getKeyMoments(videoId);
        setMoments(momentsData);
        setDetecting(false);
        setError(null);
        if (pollingRef.current) {
          clearInterval(pollingRef.current);
          pollingRef.current = null;
        }
      } catch (err) {
        console.log('Polling for key moments...');
      }
    }, 3000);

    // Stop polling after 5 minutes
    setTimeout(() => {
      if (pollingRef.current) {
        clearInterval(pollingRef.current);
        pollingRef.current = null;
        setDetecting(false);
        setError('Chapter detection timed out. Please try again.');
      }
    }, 300000);
  };

  const loadMoments = async () => {
    try {
      setLoading(true);
      const data = await getKeyMoments(videoId);
      setMoments(data);
      setError(null);
    } catch (err) {
      setError('Failed to load chapters.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const detect = async () => {
    try {
      setDetecting(true);
      setError(null);
      await detectKeyMoments(videoId);
      alert('Chapter detection started. This may take a few minutes. The page will refresh automatically.');
      setTimeout(() => {
        loadMoments();
      }, 3000);
    } catch (err) {
      if (err.response?.status === 202) {
        alert('Chapter detection started. This may take a few minutes. The page will refresh automatically.');
        startPolling();
      } else {
        const detail = err.response?.data?.detail || err.message;
        setError(`Detection failed: ${detail}`);
        setDetecting(false);
        console.error(err);
      }
    }
  };

  useEffect(() => {
    loadMoments();
  }, [videoId]);

  const formatTimestamp = (seconds) => {
    if (!seconds && seconds !== 0) return 'N/A';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getImportanceColor = (importance) => {
    switch ((importance || '').toLowerCase()) {
      case 'very high': return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'high':      return 'bg-red-100 text-red-800 border-red-200';
      case 'medium':    return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'low':       return 'bg-gray-100 text-gray-600 border-gray-200';
      default:          return 'bg-blue-100 text-blue-800 border-blue-200';
    }
  };

  const handleMomentClick = (moment) => {
    const startTime = moment.start_time || 0;
    navigate(`/videos/${videoId}?t=${startTime}`);
  };

  const handleSaveMoment = async (moment) => {
    if (savingId) return;
    setSavingId(moment.id);
    try {
      await bookmarkService.saveContentItem('key_moment', moment.id);
      setSavedIds((prev) => new Set(prev).add(moment.id));
    } catch (err) {
      alert('Failed to save highlight');
    } finally {
      setSavingId(null);
    }
  };

  return (
    <div className="pt-6 pb-12">
      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 xl:px-10">
      <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4 mb-6">
        <div>
          <button
            onClick={() => navigate(`/videos/${videoId}`)}
            className="text-blue-600 hover:text-blue-800 text-sm mb-2 inline-block"
          >
            &larr; Back to Video
          </button>
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900">
            Key Moments
          </h1>
          <p className="text-sm sm:text-base text-gray-500 mt-1">
            YouTube-style chapters detected from your video transcript.
            Each chapter has a timestamp, title, description, and importance level.
            Click any chapter to jump to that point in the video.
          </p>
        </div>
        <button
          onClick={detect}
          disabled={detecting}
          className={`w-full sm:w-auto px-6 py-3 rounded-lg font-medium text-white transition-colors ${
            detecting
              ? 'bg-gray-400 cursor-not-allowed'
              : 'bg-blue-600 hover:bg-blue-700'
          }`}
        >
          {detecting ? (
            <span className="flex items-center justify-center gap-2">
              <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              Detecting...
            </span>
          ) : (
            'Generate Chapters'
          )}
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
          {error}
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      ) : moments.length === 0 ? (
        <div className="text-center py-16 bg-gray-50 rounded-xl border-2 border-dashed border-gray-200">
          <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
          <h3 className="mt-4 text-lg font-medium text-gray-900">No chapters yet</h3>
          <p className="mt-1 text-sm text-gray-500">
            Click "Generate Chapters" to analyze your video transcript and create YouTube-style chapters.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-sm text-gray-500 px-2 mb-2">
            <span className="font-semibold text-gray-700">
              {moments.length} chapter{moments.length !== 1 ? 's' : ''}
            </span>
            <span className="text-gray-300">|</span>
            <span>Click to seek video</span>
          </div>

      {moments.map((moment, index) => (
            <button
              key={moment.id}
              onClick={() => handleMomentClick(moment)}
              className="w-full text-left border border-gray-200 rounded-xl p-3 sm:p-4 shadow-sm hover:shadow-md hover:border-blue-300 hover:bg-blue-50 transition-all bg-white cursor-pointer group flex items-stretch gap-3 sm:gap-4"
            >
              {/* Left: Timestamp column like YouTube chapters */}
              <div className="flex flex-col items-center justify-center min-w-[72px] py-2 px-1 bg-gray-50 rounded-lg border border-gray-100">
                <svg className="w-4 h-4 text-gray-400 mb-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="text-sm font-mono font-bold text-blue-700">
                  {formatTimestamp(moment.start_time)}
                </span>
                {moment.end_time && moment.end_time !== moment.start_time && (
                  <span className="text-xs text-gray-400 mt-0.5">
                    &rarr; {formatTimestamp(moment.end_time)}
                  </span>
                )}
              </div>

              {/* Right: Chapter info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs text-gray-400 font-mono">
                    #{index + 1}
                  </span>
                  <h3 className="text-base font-semibold text-gray-900 group-hover:text-blue-700 transition-colors truncate">
                    {moment.title}
                  </h3>
                </div>
                <p className="mt-1 text-sm text-gray-600 leading-relaxed line-clamp-2">
                  {moment.description}
                </p>
                <div className="mt-2 flex items-center gap-2 flex-wrap">
                  {moment.importance && (
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getImportanceColor(moment.importance)}`}>
                      {moment.importance}
                    </span>
                  )}
                  {moment.confidence && (
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs bg-green-50 text-green-700 border border-green-200">
                      {Math.round(moment.confidence * 100)}%
                    </span>
                  )}
                  {!savedIds.has(moment.id) && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleSaveMoment(moment);
                      }}
                      disabled={savingId === moment.id}
                      className="inline-flex items-center px-2 py-1 text-xs font-medium text-blue-700 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 transition-colors disabled:opacity-50"
                    >
                      Save
                    </button>
                  )}
                </div>
              </div>

              {/* Chevron indicator */}
              <div className="flex items-center">
                <svg className="w-5 h-5 text-gray-300 group-hover:text-blue-400 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
    </div>
  );
}

export default KeyMoments;