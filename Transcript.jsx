import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  FiArrowLeft, FiFileText, FiEdit3, FiSave, FiX,
  FiAlertCircle, FiLoader, FiSearch, FiChevronLeft, FiChevronRight, FiClock,
  FiCheckCircle, FiDownload,
} from 'react-icons/fi';
import videoService from '../services/videoService.js';
import { createReportDoc, addRichText } from '../utils/pdfExport.js';


const Transcript = () => {
  const { videoId } = useParams();
  const navigate = useNavigate();

  const [video, setVideo] = useState(null);
  const [transcript, setTranscript] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [editedTranscript, setEditedTranscript] = useState('');
  const [saving, setSaving] = useState(false);
  const [viewMode, setViewMode] = useState('text'); // 'text' | 'segments' (timestamped view)

  // Keyword / Search state
  const [keywords, setKeywords] = useState([]);
  const [keywordsLoading, setKeywordsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [matchIndices, setMatchIndices] = useState([]);
  const [currentMatchIndex, setCurrentMatchIndex] = useState(0);
  const matchRefs = useRef([]);

  // Transcript accuracy & quality validation
  const [validation, setValidation] = useState(null);
  const [validationLoading, setValidationLoading] = useState(false);

  useEffect(() => {
    fetchData();
  }, [videoId]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [videoData, transcriptData] = await Promise.all([
        videoService.getVideo(videoId),
        videoService.getTranscript(videoId).catch(() => null),
      ]);
      setVideo(videoData);
      setTranscript(transcriptData);
      if (transcriptData) {
        setEditedTranscript(transcriptData.transcript);
      }
    } catch (err) {
      setError('Failed to load transcript');
    } finally {
      setLoading(false);
    }
  };

  // Fetch keywords once transcript is available
  useEffect(() => {
    if (transcript && transcript.transcript) {
      fetchKeywords(transcript.transcript);
    }
  }, [transcript]);

  // Fetch transcript accuracy & quality report once a transcript exists.
  // Re-run whenever the transcript text changes (e.g. after manual edits).
  useEffect(() => {
    if (transcript?.transcript) {
      let cancelled = false;
      setValidationLoading(true);
      videoService
        .validateTranscript(videoId)
        .then((report) => {
          if (!cancelled) setValidation(report);
        })
        .catch(() => {
          if (!cancelled) setValidation(null);
        })
        .finally(() => {
          if (!cancelled) setValidationLoading(false);
        });
      return () => {
        cancelled = true;
      };
    } else {
      setValidation(null);
    }
  }, [transcript, videoId]);

  const fetchKeywords = async (transcriptText) => {
    try {
      setKeywordsLoading(true);
      const data = await videoService.getKeywords(videoId, transcriptText, 20);
      setKeywords(data.keywords || []);
    } catch (err) {
      // Silently fail — keywords are a bonus feature
      console.warn('Failed to load keywords:', err);
      setKeywords([]);
    } finally {
      setKeywordsLoading(false);
    }
  };

  // Compute match indices whenever search query or transcript changes
  useEffect(() => {
    if (!searchQuery.trim() || !transcript?.transcript) {
      setMatchIndices([]);
      setCurrentMatchIndex(0);
      return;
    }

    const query = searchQuery.toLowerCase();
    const text = transcript.transcript.toLowerCase();
    const indices = [];
    let pos = 0;

    while (pos < text.length) {
      const idx = text.indexOf(query, pos);
      if (idx === -1) break;
      indices.push(idx);
      pos = idx + query.length;
    }

    setMatchIndices(indices);
    setCurrentMatchIndex(indices.length > 0 ? 0 : 0);
  }, [searchQuery, transcript]);

  // Scroll to the current match
  useEffect(() => {
    if (matchIndices.length === 0 || matchRefs.current.length === 0) return;

    const ref = matchRefs.current[currentMatchIndex];
    if (ref) {
      ref.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [currentMatchIndex, matchIndices]);

  const handleKeywordClick = (keyword) => {
    setSearchQuery(keyword);
  };

  const handlePrevMatch = () => {
    setCurrentMatchIndex((prev) => Math.max(0, prev - 1));
  };

  const handleNextMatch = () => {
    setCurrentMatchIndex((prev) => Math.min(matchIndices.length - 1, prev + 1));
  };

  // Format seconds (e.g. 12.5) as "0:12" or "1:02:03"
  const formatTimestamp = (seconds) => {
    if (seconds === null || seconds === undefined || isNaN(seconds)) return '0:00';
    const totalSeconds = Math.max(0, Math.floor(seconds));
    const hrs = Math.floor(totalSeconds / 3600);
    const mins = Math.floor((totalSeconds % 3600) / 60);
    const secs = totalSeconds % 60;
    const secsStr = secs.toString().padStart(2, '0');
    const minsStr = hrs > 0 ? mins.toString().padStart(2, '0') : String(mins);
    return hrs > 0 ? `${hrs}:${minsStr}:${secsStr}` : `${minsStr}:${secsStr}`;
  };

  // Highlight search matches inside a single segment (no scroll refs needed)
  const renderSegmentHighlightedText = (text, query) => {
    if (!query.trim()) {
      return <span className="text-gray-700 leading-relaxed">{text}</span>;
    }

    const queryLower = query.toLowerCase();
    const textLower = text.toLowerCase();
    const parts = [];
    let lastEnd = 0;
    let pos = 0;

    while (pos < textLower.length) {
      const idx = textLower.indexOf(queryLower, pos);
      if (idx === -1) break;

      if (idx > lastEnd) {
        parts.push(<span key={`seg-text-${lastEnd}`}>{text.slice(lastEnd, idx)}</span>);
      }

      parts.push(
        <mark key={`seg-match-${idx}`} className="search-highlight">
          {text.slice(idx, idx + queryLower.length)}
        </mark>
      );

      lastEnd = idx + queryLower.length;
      pos = idx + queryLower.length;
    }

    if (lastEnd < text.length) {
      parts.push(<span key={`seg-text-${lastEnd}`}>{text.slice(lastEnd)}</span>);
    }

    return (
      <span className="text-gray-700 leading-relaxed">
        {parts.length > 0 ? parts : text}
      </span>
    );
  };

  // Highlight text with search matches
  const renderHighlightedText = useCallback((text, query) => {
    if (!query.trim()) {
      return <p className="text-gray-700 whitespace-pre-wrap leading-relaxed">{text}</p>;
    }

    const queryLower = query.toLowerCase();
    const textLower = text.toLowerCase();
    const parts = [];
    let lastEnd = 0;
    let matchCounter = 0;

    // Build match refs array
    matchRefs.current = [];

    let pos = 0;
    while (pos < textLower.length) {
      const idx = textLower.indexOf(queryLower, pos);
      if (idx === -1) break;

      // Text before the match
      if (idx > lastEnd) {
        parts.push(
          <span key={`text-${lastEnd}`}>{text.slice(lastEnd, idx)}</span>
        );
      }

      const matchStart = idx;
      const matchEnd = idx + queryLower.length;
      const currentMatch = matchCounter;

      parts.push(
        <span
          key={`match-${idx}`}
          ref={(el) => { matchRefs.current[currentMatch] = el; }}
          className="search-highlight"
          data-match-index={currentMatch}
        >
          {text.slice(matchStart, matchEnd)}
        </span>
      );

      matchCounter++;
      lastEnd = matchEnd;
      pos = idx + queryLower.length;
    }

    // Remaining text after last match
    if (lastEnd < text.length) {
      parts.push(
        <span key={`text-${lastEnd}`}>{text.slice(lastEnd)}</span>
      );
    }

    return (
      <p className="text-gray-700 whitespace-pre-wrap leading-relaxed">
        {parts.length > 0 ? parts : text}
      </p>
    );
  }, []);

  const handleEdit = () => {
    setIsEditing(true);
  };

  const handleCancel = () => {
    setIsEditing(false);
    setEditedTranscript(transcript?.transcript || '');
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      const updated = await videoService.updateTranscript(videoId, {
        transcript: editedTranscript,
      });
      setTranscript(updated);
      setIsEditing(false);
    } catch (err) {
      alert('Failed to save transcript: ' + (err.response?.data?.detail || err.message));
    } finally {
      setSaving(false);
    }
  };

  // Export the current transcript as a PDF, preserving any search highlights.
  const handleExportPdf = () => {
    if (!transcript?.transcript) return;
    try {
      const { doc, pageWidth, pageHeight, margin, contentWidth } = createReportDoc();
      let y = margin;

      // Title
      doc.setFontSize(22);
      doc.setFont(undefined, 'bold');
      doc.setTextColor(20, 40, 60);
      doc.text('Transcript Highlight Report', margin, y);
      y += 12;

      // Video title
      doc.setFontSize(12);
      doc.setFont(undefined, 'bold');
      doc.setTextColor(26, 115, 232);
      const videoTitle = video?.title || 'Untitled Video';
      const titleLines = doc.splitTextToSize(videoTitle, contentWidth);
      doc.text(titleLines, margin, y);
      y += titleLines.length * 6 + 4;

      // Note the highlighted term when one is active
      if (searchQuery.trim()) {
        doc.setFontSize(10);
        doc.setFont(undefined, 'normal');
        doc.setTextColor(100, 100, 100);
        const queryNote = `Highlighted term: "${searchQuery.trim()}"`;
        const queryLines = doc.splitTextToSize(queryNote, contentWidth);
        doc.text(queryLines, margin, y);
        y += queryLines.length * 5 + 4;
      }

      doc.setDrawColor(200, 200, 200);
      doc.line(margin, y, pageWidth - margin, y);
      y += 10;

      const bodyOpts = {
        x: margin,
        y,
        maxWidth: contentWidth,
        fontSize: 11,
        lineHeight: 6,
        baseColor: [60, 60, 60],
        pageHeight,
        margin,
      };

      if (viewMode === 'segments' && transcript.segments?.length > 0) {
        // Timestamped view: render each segment with its time range + highlights
        transcript.segments.forEach((segment) => {
          const timeLabel = `${formatTimestamp(segment.start)} – ${formatTimestamp(segment.end)}`;
          doc.setFontSize(11);
          doc.setFont(undefined, 'bold');
          doc.setTextColor(26, 115, 232);
          doc.text(timeLabel, margin, y);
          y += 5;
          y = addRichText(doc, segment.text || '', searchQuery, {
            ...bodyOpts,
            y,
          });
          y += 6;
          if (y > pageHeight - margin - 10) {
            doc.addPage();
            y = margin;
          }
        });
      } else {
        // Plain text view: export full transcript with search highlights applied
        const text = isEditing ? editedTranscript : transcript.transcript;
        y = addRichText(doc, text, searchQuery, bodyOpts);
      }

      // Footer
      doc.setFontSize(9);
      doc.setFont(undefined, 'normal');
      doc.setTextColor(150, 150, 150);
      doc.text('Generated by ClipMind AI', margin, pageHeight - 10);

      const base = videoTitle;
      const fileName = `transcript-report-${base.replace(/[^a-zA-Z0-9]/g, '_').substring(0, 50)}.pdf`;
      doc.save(fileName);
    } catch (err) {
      console.error('PDF export failed:', err);
      alert('Failed to export PDF. Please try again.');
    }
  };

  if (loading) {
    return (
      <div className="pt-6 pb-12">
        <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 xl:px-10">
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto"></div>
            <p className="text-gray-500 mt-2">Loading transcript...</p>
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

  return (
    <div className="pt-6 pb-12">
      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 xl:px-10">
        {/* Header */}
        <div className="mb-6">
          <button
            onClick={() => navigate(`/videos/${videoId}`)}
            className="flex items-center text-gray-600 hover:text-gray-800 mb-4"
          >
            <FiArrowLeft className="mr-1" /> Back to Video
          </button>
          <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-800">Transcript</h1>
              <p className="text-sm sm:text-base text-gray-600 mt-1">{video.title}</p>
            </div>
            <div className="flex flex-col sm:flex-row gap-2">
              {!isEditing && transcript && (
                <button
                  onClick={handleExportPdf}
                  className="w-full sm:w-auto flex items-center justify-center px-5 py-2 bg-gray-100 text-gray-700 border border-gray-200 rounded-lg hover:bg-gray-200 transition-colors text-sm"
                >
                  <FiDownload className="mr-2" />
                  Export PDF
                </button>
              )}
              {!isEditing ? (
                <button
                  onClick={handleEdit}
                  className="w-full sm:w-auto flex items-center justify-center px-5 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors text-sm"
                >
                  <FiEdit3 className="mr-2" />
                  Edit Transcript
                </button>
              ) : (
                <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2">
                  <button
                    onClick={handleCancel}
                    className="w-full sm:w-auto flex items-center justify-center px-5 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm"
                  >
                    <FiX className="mr-2" />
                    Cancel
                  </button>
                  <button
                    onClick={handleSave}
                    disabled={saving}
                    className="w-full sm:w-auto flex items-center justify-center px-5 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm disabled:opacity-50"
                  >
                    <FiSave className="mr-2" />
                    {saving ? 'Saving...' : 'Save'}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Keywords Section */}
        {transcript && keywords.length > 0 && !isEditing && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 mb-4">
            <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">
              Keywords
            </h2>
            <div className="flex flex-wrap gap-2">
              {keywords.map((kw) => (
                <button
                  key={kw.keyword}
                  onClick={() => handleKeywordClick(kw.keyword)}
                  className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                    searchQuery === kw.keyword
                      ? 'bg-primary-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-primary-100 hover:text-primary-700'
                  }`}
                >
                  {kw.keyword}
                  <span className="ml-1.5 text-xs opacity-60">({kw.count})</span>
                </button>
              ))}
              {keywordsLoading && (
                <span className="text-xs text-gray-400 self-center ml-1">
                  Loading...
                </span>
              )}
            </div>
          </div>
        )}

        {/* Search Bar & Navigation */}
        {transcript && !isEditing && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 mb-4">
            <div className="flex items-center gap-3 flex-wrap">
              <div className="relative flex-1 min-w-[200px]">
                <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search keyword in transcript..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm"
                />
              </div>
              {viewMode === 'text' && matchIndices.length > 0 && (
                <div className="flex items-center gap-2 text-sm">
                  <span className="text-gray-500 whitespace-nowrap">
                    Match {currentMatchIndex + 1} of {matchIndices.length}
                  </span>
                  <button
                    onClick={handlePrevMatch}
                    disabled={currentMatchIndex <= 0}
                    className="p-1.5 rounded-lg border border-gray-300 text-gray-600 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                    title="Previous match"
                  >
                    <FiChevronLeft />
                  </button>
                  <button
                    onClick={handleNextMatch}
                    disabled={currentMatchIndex >= matchIndices.length - 1}
                    className="p-1.5 rounded-lg border border-gray-300 text-gray-600 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                    title="Next match"
                  >
                    <FiChevronRight />
                  </button>
                </div>
              )}
              {searchQuery && matchIndices.length === 0 && (
                <span className="text-sm text-gray-400">No matches found</span>
              )}
            </div>
          </div>
        )}

        {/* Transcript Accuracy & Quality */}
        {transcript && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-6 mb-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
              <h3 className="text-lg font-semibold text-gray-800 flex items-center">
                <FiCheckCircle className="mr-2 text-green-600" />
                Transcript Accuracy
              </h3>

              {validation ? (
                <div className="flex items-center gap-3">
                  <span
                    className={`inline-flex px-3 py-1 text-sm font-medium rounded-full ${
                      validation.rating === 'Excellent'
                        ? 'bg-green-100 text-green-800'
                        : validation.rating === 'Good'
                        ? 'bg-blue-100 text-blue-800'
                        : validation.rating === 'Fair'
                        ? 'bg-yellow-100 text-yellow-800'
                        : 'bg-red-100 text-red-800'
                    }`}
                  >
                    {validation.rating}
                  </span>
                  <span className="text-2xl font-bold text-gray-800">
                    {validation.quality_score}
                    <span className="text-sm font-normal text-gray-400">/100</span>
                  </span>
                </div>
              ) : validationLoading ? (
                <span className="text-sm text-gray-400 flex items-center">
                  <FiLoader className="animate-spin mr-2" /> Validating...
                </span>
              ) : null}
            </div>

            {validation && (
              <>
                {/* Quality score bar */}
                <div className="w-full h-3 bg-gray-200 rounded-full overflow-hidden mb-6">
                  <div
                    className={`h-full rounded-full transition-all duration-700 ${
                      validation.quality_score >= 75
                        ? 'bg-green-500'
                        : validation.quality_score >= 60
                        ? 'bg-yellow-500'
                        : 'bg-red-500'
                    }`}
                    style={{ width: `${Math.min(validation.quality_score, 100)}%` }}
                  />
                </div>

                {/* Flags */}
                {Object.keys(validation.flags || {}).some(k =>
                  k !== 'is_empty' && validation.flags[k]
                ) && (
                  <div className="flex flex-wrap gap-2 mb-6">
                    {validation.flags.too_short && (
                      <span className="text-xs bg-red-50 text-red-700 border border-red-200 px-2 py-1 rounded-full">
                        Too short
                      </span>
                    )}
                    {validation.flags.very_fast && (
                      <span className="text-xs bg-red-50 text-red-700 border border-red-200 px-2 py-1 rounded-full">
                        Speaking speed too high
                      </span>
                    )}
                    {validation.flags.low_confidence && (
                      <span className="text-xs bg-yellow-50 text-yellow-700 border border-yellow-200 px-2 py-1 rounded-full">
                        Low confidence
                      </span>
                    )}
                    {validation.flags.high_filler_ratio && (
                      <span className="text-xs bg-yellow-50 text-yellow-700 border border-yellow-200 px-2 py-1 rounded-full">
                        High filler-word ratio
                      </span>
                    )}
                    {validation.flags.poor_coverage && (
                      <span className="text-xs bg-yellow-50 text-yellow-700 border border-yellow-200 px-2 py-1 rounded-full">
                        Poor duration coverage
                      </span>
                    )}
                    {validation.flags.high_uppercase && (
                      <span className="text-xs bg-yellow-50 text-yellow-700 border border-yellow-200 px-2 py-1 rounded-full">
                        Unusual capitalization
                      </span>
                    )}
                  </div>
                )}

                {/* Metrics */}
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                  <div className="bg-gray-50 rounded-lg p-3">
                    <p className="text-xs text-gray-500">Words</p>
                    <p className="text-lg font-semibold text-gray-800">
                      {validation.metrics.word_count}
                    </p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-3">
                    <p className="text-xs text-gray-500">Sentences</p>
                    <p className="text-lg font-semibold text-gray-800">
                      {validation.metrics.sentence_count}
                    </p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-3">
                    <p className="text-xs text-gray-500">Speaking Speed</p>
                    <p className="text-lg font-semibold text-gray-800">
                      {validation.metrics.speaking_speed ?? '—'}
                      <span className="text-xs font-normal text-gray-400"> wpm</span>
                    </p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-3">
                    <p className="text-xs text-gray-500">Avg Confidence</p>
                    <p className="text-lg font-semibold text-gray-800">
                      {validation.metrics.average_confidence != null
                        ? `${validation.metrics.average_confidence}%`
                        : '—'}
                    </p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-3">
                    <p className="text-xs text-gray-500">Duration Coverage</p>
                    <p className="text-lg font-semibold text-gray-800">
                      {validation.metrics.duration_coverage != null
                        ? `${validation.metrics.duration_coverage}%`
                        : '—'}
                    </p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-3">
                    <p className="text-xs text-gray-500">Filler Ratio</p>
                    <p className="text-lg font-semibold text-gray-800">
                      {(validation.metrics.filler_word_ratio * 100).toFixed(1)}%
                    </p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-3">
                    <p className="text-xs text-gray-500">Empty Segments</p>
                    <p className="text-lg font-semibold text-gray-800">
                      {validation.metrics.empty_segment_count}
                      <span className="text-xs font-normal text-gray-400">
                        {' '}/ {validation.metrics.total_segments}
                      </span>
                    </p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-3">
                    <p className="text-xs text-gray-500">Segments w/ Confidence</p>
                    <p className="text-lg font-semibold text-gray-800">
                      {validation.metrics.segments_with_confidence}
                      <span className="text-xs font-normal text-gray-400">
                        {' '}/ {validation.metrics.total_segments}
                      </span>
                    </p>
                  </div>
                </div>
              </>
            )}
          </div>
        )}

        {/* Transcript Content */}

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-6">
          {transcript ? (
            <div>
              {transcript.language && (
                <div className="mb-4">
                  <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">
                    Language: {transcript.language.toUpperCase()}
                  </span>
                  {transcript.confidence && (
                    <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded ml-2">
                      Confidence: {transcript.confidence}%
                    </span>
                  )}
                </div>
              )}

              {/* Timestamped segmentation toggle */}
              {!isEditing && transcript.segments?.length > 0 && (
                <div className="mb-4 flex items-center gap-3 flex-wrap">
                  <div className="inline-flex rounded-lg border border-gray-200 overflow-hidden">
                    <button
                      onClick={() => setViewMode('text')}
                      className={`px-4 py-2 text-sm font-medium transition-colors ${
                        viewMode === 'text'
                          ? 'bg-primary-600 text-white'
                          : 'bg-white text-gray-600 hover:bg-gray-50'
                      }`}
                    >
                      <FiFileText className="inline mr-1.5" /> Plain Text
                    </button>
                    <button
                      onClick={() => setViewMode('segments')}
                      className={`px-4 py-2 text-sm font-medium transition-colors ${
                        viewMode === 'segments'
                          ? 'bg-primary-600 text-white'
                          : 'bg-white text-gray-600 hover:bg-gray-50'
                      }`}
                    >
                      <FiClock className="inline mr-1.5" /> Timestamped
                    </button>
                  </div>
                  {viewMode === 'segments' && (
                    <span className="text-xs text-gray-400">
                      {transcript.segments.length} segment{transcript.segments.length !== 1 ? 's' : ''} with timestamps
                    </span>
                  )}
                </div>
              )}

              {isEditing ? (
                <textarea
                  value={editedTranscript}
                  onChange={(e) => setEditedTranscript(e.target.value)}
                  className="w-full h-96 p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none"
                  placeholder="Enter transcript text..."
                />
              ) : viewMode === 'segments' && transcript.segments?.length > 0 ? (
                <div className="space-y-2">
                  {transcript.segments.map((segment, index) => (
                    <div
                      key={segment.id ?? index}
                      className="flex items-start gap-3 rounded-lg border border-gray-100 bg-gray-50 p-3 hover:bg-blue-50 hover:border-blue-200 transition-colors"
                    >
                      {/* Timestamp chip */}
                      <div className="flex flex-col items-center justify-center min-w-[76px] px-2 py-1 bg-white rounded-md border border-gray-200 shrink-0">
                        <svg className="w-4 h-4 text-gray-400 mb-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span className="text-sm font-mono font-bold text-blue-700">
                          {formatTimestamp(segment.start)}
                        </span>
                        {segment.end != null && segment.end !== segment.start && (
                          <span className="text-xs text-gray-400 mt-0.5">
                            &rarr; {formatTimestamp(segment.end)}
                          </span>
                        )}
                      </div>

                      {/* Segment text */}
                      <p className="text-sm text-gray-700 leading-relaxed flex-1 pt-1">
                        {renderSegmentHighlightedText(segment.text, searchQuery)}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="prose prose-sm sm:prose lg:prose-lg max-w-none">
                  {renderHighlightedText(transcript.transcript, searchQuery)}
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-12 text-gray-500">
              <FiFileText className="text-4xl mx-auto mb-2 text-gray-300" />
              <p>No transcript available yet.</p>
              <p className="text-sm mt-2">
                Generate a transcript from the video detail page.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Highlight styles */}
      <style>{`
        .search-highlight {
          background-color: #22c55e;
          color: white;
          padding: 2px 4px;
          border-radius: 4px;
          font-weight: 600;
        }
      `}</style>
    </div>
  );
};

export default Transcript;