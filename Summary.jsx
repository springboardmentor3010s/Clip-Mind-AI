import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  FiArrowLeft, FiList, FiEdit3, FiSave, FiX,
  FiAlertCircle, FiLoader,
  FiTrendingUp, FiTarget, FiBookOpen, FiBarChart2,
  FiClock, FiCheckCircle, FiZap,
  FiBookmark, FiDownload,
} from 'react-icons/fi';
import videoService from '../services/videoService.js';
import bookmarkService from '../services/bookmarkService.js';
import SharePanel from '../components/SharePanel.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { createReportDoc, addRichText } from '../utils/pdfExport.js';


const getScoreColor = (score) => {
  if (score >= 90) return "text-green-600";
  if (score >= 75) return "text-blue-600";
  if (score >= 60) return "text-yellow-600";
  return "text-red-600";
};

const ProgressBar = ({ label, value }) => (
  <div className="mb-5">
    <div className="flex justify-between mb-2">
      <span className="text-sm font-medium text-gray-700">
        {label}
      </span>

      <span className="font-semibold">
        {value}%
      </span>
    </div>

    <div className="w-full h-3 sm:h-4 bg-gray-200 rounded-full overflow-hidden">
      <div
        className="h-full bg-primary-600 rounded-full transition-all duration-700"
        style={{
          width: `${Math.min(value, 100)}%`
        }}
      />
    </div>
  </div>
);

const MetricCard = ({
  title,
  value,
  icon,
  color = "text-primary-600"
}) => (
  <div className="bg-white border rounded-xl shadow-sm p-4 sm:p-5 hover:shadow-lg transition">
    <div className="flex justify-between">
      <div>
        <p className="text-gray-500 text-sm">
          {title}
        </p>

        <h2 className={`text-3xl font-bold mt-2 ${color}`}>
          {value}
        </h2>
      </div>

      <div className="text-3xl text-gray-300">
        {icon}
      </div>
    </div>
  </div>
);

const Summary = () => {
  const { videoId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [video, setVideo] = useState(null);
  const isOwner = !!user && video && video.user_id === user.id;
  const [summary, setSummary] = useState(null);
  const [evaluation, setEvaluation] = useState(null);
  const [evaluationLoading, setEvaluationLoading] = useState(false);
  // Summary accuracy & quality validation
  const [validation, setValidation] = useState(null);
  const [validationLoading, setValidationLoading] = useState(false);
  const [summaryStatus, setSummaryStatus] = useState(null); // null | 'processing' | 'failed'
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [editedShortSummary, setEditedShortSummary] = useState('');
  const [editedDetailedSummary, setEditedDetailedSummary] = useState('');
  const [saving, setSaving] = useState(false);

  // Bullet points state
  const [bulletsLoading, setBulletsLoading] = useState(false);
  const [bulletsError, setBulletsError] = useState('');

  const [savingSummary, setSavingSummary] = useState(false);
  const [isSummarySaved, setIsSummarySaved] = useState(false);

  const pollingRef = useRef(null);

  // Cleanup polling on unmount
  useEffect(() => {
    return () => {
      if (pollingRef.current) {
        clearInterval(pollingRef.current);
      }
    };
  }, []);

  const startPolling = () => {
    if (pollingRef.current) {
      clearInterval(pollingRef.current);
    }

    setSummaryStatus('processing');

    pollingRef.current = setInterval(async () => {
      try {
        const summaryData = await videoService.getSummary(videoId);
        setSummary(summaryData);

        await fetchEvaluation();
        await fetchValidation();

        setSummaryStatus(null);
        if (summaryData) {
          setEditedShortSummary(summaryData.short_summary);
          setEditedDetailedSummary(summaryData.detailed_summary);
        }
        if (pollingRef.current) {
          clearInterval(pollingRef.current);
          pollingRef.current = null;
        }
      } catch (err) {
        const status = err.response?.status;
        const data = err.response?.data;

        if (status === 202) {
          if (data?.status === 'failed') {
            setSummaryStatus('failed');
            if (pollingRef.current) {
              clearInterval(pollingRef.current);
              pollingRef.current = null;
            }
          } else if (data?.status === 'processing_summary' || data?.status === 'processing') {
            setSummaryStatus('processing');
          }
        } else if (status === 404) {
          setSummaryStatus(null);
          if (pollingRef.current) {
            clearInterval(pollingRef.current);
            pollingRef.current = null;
          }
        } else {
          setSummaryStatus(null);
          if (pollingRef.current) {
            clearInterval(pollingRef.current);
            pollingRef.current = null;
          }
        }
      }
    }, 2000);

    // Stop polling after 5 minutes (300s)
    setTimeout(() => {
      if (pollingRef.current) {
        clearInterval(pollingRef.current);
        pollingRef.current = null;
        setSummaryStatus('failed');
      }
    }, 300000);
  };

  const fetchEvaluation = async () => {
    try {
      setEvaluationLoading(true);

      const data =
        await videoService.getSummaryEvaluation(videoId);

      setEvaluation(data);
    } catch (err) {
      console.log("Evaluation not available");
      setEvaluation(null);
    } finally {
      setEvaluationLoading(false);
    }
  };

  const fetchValidation = async () => {
    try {
      setValidationLoading(true);

      const data = await videoService.validateSummary(videoId);

      setValidation(data);
    } catch (err) {
      setValidation(null);
    } finally {
      setValidationLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [videoId]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const videoPromise = videoService.getVideo(videoId);
      const summaryPromise = videoService.getSummary(videoId);

      const [videoData, summaryResult] = await Promise.allSettled([
        videoPromise,
        summaryPromise,
      ]);

      if (videoData.status === 'fulfilled') {
        setVideo(videoData.value);
      }

      if (summaryResult.status === 'fulfilled') {
        const summaryData = summaryResult.value;
        setSummary(summaryData);

        setEditedShortSummary(
            summaryData.short_summary
        );

        setEditedDetailedSummary(
            summaryData.detailed_summary
        );

        await fetchEvaluation();
        await fetchValidation();
      } else {
        const err = summaryResult.reason;
        const statusCode = err?.response?.status;
        const responseData = err?.response?.data;

        if (statusCode === 202) {
          if (responseData?.status === 'failed') {
            setSummaryStatus('failed');
          } else if (responseData?.status === 'processing_summary' || responseData?.status === 'processing') {
            startPolling();
          }
        } else if (statusCode === 404) {
          // No summary exists - that's ok for this page
          setSummaryStatus(null);
        }
      }
    } catch (err) {
      setError('Failed to load summary');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = () => {
    setIsEditing(true);
  };

  const handleCancel = () => {
    setIsEditing(false);
    if (summary) {
      setEditedShortSummary(summary.short_summary);
      setEditedDetailedSummary(summary.detailed_summary);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      const updated = await videoService.updateSummary(videoId, {
        short_summary: editedShortSummary,
        detailed_summary: editedDetailedSummary,
      });
      setSummary(updated);

      await fetchEvaluation();
      await fetchValidation();

      setIsEditing(false);
    } catch (err) {
      alert('Failed to save summary: ' + (err.response?.data?.detail || err.message));
    } finally {
      setSaving(false);
    }
  };

  const handleGenerateBullets = async () => {
    try {
      setBulletsLoading(true);
      setBulletsError('');
      const updated = await videoService.generateBulletPoints(videoId);
      setSummary(updated);
    } catch (err) {
      setBulletsError(err.response?.data?.detail || 'Failed to generate bullet points.');
    } finally {
      setBulletsLoading(false);
    }
  };

  const handleSaveSummaryItem = async () => {
    if (!summary || savingSummary) return;
    try {
      setSavingSummary(true);
      await bookmarkService.saveContentItem('summary', summary.id);
      setIsSummarySaved(true);
    } catch (err) {
      alert('Failed to save summary');
    } finally {
      setSavingSummary(false);
    }
  };

  // Export the current summary as a PDF report.
  const handleExportPdf = () => {
    if (!summary) return;
    try {
      const { doc, pageWidth, pageHeight, margin, contentWidth } = createReportDoc();
      let y = margin;

      // Title
      doc.setFontSize(22);
      doc.setFont(undefined, 'bold');
      doc.setTextColor(20, 40, 60);
      doc.text('Summary Highlight Report', margin, y);
      y += 12;

      // Video title
      doc.setFontSize(12);
      doc.setFont(undefined, 'bold');
      doc.setTextColor(26, 115, 232);
      const videoTitle = video?.title || 'Untitled Video';
      const videoLines = doc.splitTextToSize(videoTitle, contentWidth);
      doc.text(videoLines, margin, y);
      y += videoLines.length * 6 + 4;

      // Generated-with note
      if (summary.model_used) {
        doc.setFontSize(10);
        doc.setFont(undefined, 'normal');
        doc.setTextColor(100, 100, 100);
        doc.text(`Generated using: ${summary.model_used}`, margin, y);
        y += 8;
      }

      doc.setDrawColor(200, 200, 200);
      doc.line(margin, y, pageWidth - margin, y);
      y += 10;

      const bodyOpts = {
        x: margin,
        maxWidth: contentWidth,
        fontSize: 11,
        lineHeight: 6,
        baseColor: [60, 60, 60],
        pageHeight,
        margin,
      };

      const renderSection = (title, text) => {
        if (!text) return;
        if (y > pageHeight - margin - 30) {
          doc.addPage();
          y = margin;
        }
        doc.setFontSize(16);
        doc.setFont(undefined, 'bold');
        doc.setTextColor(26, 115, 232);
        doc.text(title, margin, y);
        y += 8;
        y = addRichText(doc, text, '', { ...bodyOpts, y });
        y += 10;
      };

      renderSection('Short Summary', summary.short_summary);
      renderSection('Detailed Summary', summary.detailed_summary);

      if (summary.bullet_points?.length) {
        if (y > pageHeight - margin - 30) {
          doc.addPage();
          y = margin;
        }
        doc.setFontSize(16);
        doc.setFont(undefined, 'bold');
        doc.setTextColor(26, 115, 232);
        doc.text('Key Points', margin, y);
        y += 8;
        summary.bullet_points.forEach((point) => {
          y = addRichText(doc, `• ${point}`, '', { ...bodyOpts, y });
          y += 4;
          if (y > pageHeight - margin - 10) {
            doc.addPage();
            y = margin;
          }
        });
      }

      // Footer
      doc.setFontSize(9);
      doc.setFont(undefined, 'normal');
      doc.setTextColor(150, 150, 150);
      doc.text('Generated by ClipMind AI', margin, pageHeight - 10);

      const base = videoTitle;
      const fileName = `summary-report-${base.replace(/[^a-zA-Z0-9]/g, '_').substring(0, 50)}.pdf`;
      doc.save(fileName);
    } catch (err) {
      console.error('PDF export failed:', err);
      alert('Failed to export PDF. Please try again.');
    }
  };

  if (loading) {
    return (
      <div className="pt-6 pb-12">
        <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 xl:px-12">
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto"></div>
            <p className="text-gray-500 mt-2">Loading summary...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error || !video) {
    return (
      <div className="pt-6 pb-12">
        <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 xl:px-12">
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
      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 xl:px-12">
        {/* Header */}
        <div className="mb-6">
          <button
            onClick={() => navigate(`/videos/${videoId}`)}
            className="flex items-center text-gray-600 hover:text-gray-800 mb-4"
          >
            <FiArrowLeft className="mr-1" /> Back to Video
          </button>
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
            <div>
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-800">AI Summary</h1>
              <p className="text-sm sm:text-base text-gray-600 mt-1">{video.title}</p>
            </div>
<div className="flex flex-col sm:flex-row gap-2">
              {summary && !isEditing ? (
                <>
                  <button
                    onClick={handleExportPdf}
                    className="w-full sm:w-auto flex items-center justify-center px-5 py-2 bg-gray-100 text-gray-700 border border-gray-200 rounded-lg hover:bg-gray-200 transition-colors text-sm"
                  >
                    <FiDownload className="mr-2" />
                    Export PDF
                  </button>
                  <button
                    onClick={handleEdit}
                    className="w-full sm:w-auto flex items-center justify-center px-5 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors text-sm"
                  >
                    <FiEdit3 className="mr-2" />
                    Edit Summary
                  </button>
                  {user?.role === 'Learner' && !isSummarySaved && (
                    <button
                      onClick={handleSaveSummaryItem}
                      disabled={savingSummary}
                      className="w-full sm:w-auto flex items-center justify-center px-5 py-2 bg-blue-50 text-blue-700 border border-blue-200 rounded-lg hover:bg-blue-100 transition-colors text-sm disabled:opacity-50"
                    >
                      <FiBookmark className="mr-2" />
                      {savingSummary ? 'Saving...' : 'Save Summary'}
                    </button>
                  )}
                </>
              ) : summary && isEditing ? (
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
              ) : null}
            </div>
          </div>
        </div>

      {isOwner && summary && !isEditing && user?.role === 'Educator' && (
        <div className="mb-6">
          <SharePanel videoId={videoId} />
        </div>
      )}

{/* Summary Content */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-6 lg:p-8">
          {summary ? (
            <div className="space-y-6">
              {summary.model_used && (
                <div>
                  <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">
                    Generated using: {summary.model_used}
                  </span>
                </div>
              )}

              <div>
                <h3 className="text-lg font-semibold text-gray-800 mb-3">Short Summary</h3>
                {isEditing ? (
                  <textarea
                    value={editedShortSummary}
                    onChange={(e) => setEditedShortSummary(e.target.value)}
                    className="w-full h-32 p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none"
                    placeholder="Enter short summary..."
                  />
                ) : (
                  <div className="prose prose-sm sm:prose lg:prose-lg max-w-none">
                    <p className="text-gray-700 leading-relaxed">{summary.short_summary}</p>
                  </div>
                )}
              </div>

              <div>
                <h3 className="text-lg font-semibold text-gray-800 mb-3">Detailed Summary</h3>
                {isEditing ? (
                  <textarea
                    value={editedDetailedSummary}
                    onChange={(e) => setEditedDetailedSummary(e.target.value)}
                    className="w-full h-64 p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none"
                    placeholder="Enter detailed summary..."
                  />
                ) : (
                  <div className="prose prose-sm sm:prose lg:prose-lg max-w-none">
                    <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
                      {summary.detailed_summary}
                    </p>
                  </div>
                )}
              </div>

              {/* ================= Key Points (Bullet Points) ================= */}
              <div>
                <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
                  <h3 className="text-lg font-semibold text-gray-800 flex items-center">
                    <FiCheckCircle className="mr-2 text-primary-500" /> Key Points
                  </h3>
                  {!isEditing && summary.bullet_points?.length > 0 && (
                    <button
                      onClick={handleGenerateBullets}
                      disabled={bulletsLoading}
                      className="flex items-center px-3 py-1.5 text-xs font-medium text-primary-700 bg-primary-50 border border-primary-200 rounded-lg hover:bg-primary-100 transition-colors disabled:opacity-50"
                    >
                      <FiZap className="mr-1.5" />
                      {bulletsLoading ? 'Regenerating...' : 'Regenerate'}
                    </button>
                  )}
                </div>

                {summary.bullet_points?.length > 0 ? (
                  <ul className="space-y-2.5">
                    {summary.bullet_points.map((point, index) => (
                      <li key={`bullet-${index}`} className="flex items-start gap-3">
                        <span className="mt-1.5 w-2 h-2 rounded-full bg-primary-500 shrink-0" />
                        <span className="text-sm text-gray-700 leading-relaxed">{point}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                    <p className="text-sm text-gray-500 mb-3">
                      No key points yet. Generate bullet points from this summary.
                    </p>
                    {!isEditing && (
                      <button
                        onClick={handleGenerateBullets}
                        disabled={bulletsLoading}
                        className="flex items-center px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50"
                      >
                        {bulletsLoading ? (
                          <FiLoader className="animate-spin mr-2" />
                        ) : (
                          <FiZap className="mr-2" />
                        )}
                        {bulletsLoading ? 'Generating...' : 'Generate Bullet Points'}
                      </button>
                    )}
                  </div>
                )}
                {bulletsError && (
                  <p className="text-xs text-red-500 mt-2">{bulletsError}</p>
                )}
              </div>
            </div>
          ) : summaryStatus === 'processing' ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto mb-3"></div>
              <p className="text-gray-600 font-medium">Generating summary...</p>
              <p className="text-sm text-gray-500 mt-2">This may take a few minutes depending on video length.</p>
            </div>
          ) : summaryStatus === 'failed' ? (
            <div className="text-center py-12 text-red-500">
              <FiAlertCircle className="text-4xl mx-auto mb-2 text-red-300" />
              <p className="font-medium">Summary generation failed.</p>
              <p className="text-sm mt-2">
                Go to the video detail page to retry.
              </p>
            </div>
          ) : (
            <div className="text-center py-12 text-gray-500">
              <FiList className="text-4xl mx-auto mb-2 text-gray-300" />
              <p>No summary available yet.</p>
              <p className="text-sm mt-2">
                Generate a summary from the video detail page.
              </p>
            </div>
          )}

          {/* ===================== Summary Evaluation Metrics ===================== */}

          {summary && (
            <>
              <hr className="my-8" />

              {/* ===================== Summary Quality Validation ===================== */}

              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-6 mb-8">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
                  <h3 className="text-lg font-semibold text-gray-800 flex items-center">
                    <FiCheckCircle className="mr-2 text-green-600" />
                    Summary Quality
                  </h3>

                  {validation ? (
                    <div className="flex items-center gap-3">
                      <span
                        className={'inline-flex px-3 py-1 text-sm font-medium rounded-full ' + (
                          validation.rating === 'Excellent'
                            ? 'bg-green-100 text-green-800'
                            : validation.rating === 'Good'
                            ? 'bg-blue-100 text-blue-800'
                            : validation.rating === 'Fair'
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-red-100 text-red-800'
                        )}
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

                {validation ? (
                  <>
                    {/* Quality score bar */}
                    <div className="w-full h-3 bg-gray-200 rounded-full overflow-hidden mb-6">
                      <div
                        className={'h-full rounded-full transition-all duration-700 ' + (
                          validation.quality_score >= 15
                            ? 'bg-green-500'
                            : validation.quality_score >= 20
                            ? 'bg-yellow-500'
                            : 'bg-red-500'
                        )}
                        style={{ width: Math.min(validation.quality_score, 100) + '%' }}
                      />
                    </div>

                    {/* Flags */}
                    {validation.flags && (
                      <div className="flex flex-wrap gap-2 mb-6">
                        {validation.flags.too_short && (
                          <span className="text-xs bg-red-50 text-red-700 border border-red-200 px-2 py-1 rounded-full">Too short</span>
                        )}
                        {validation.flags.overlong && (
                          <span className="text-xs bg-red-50 text-red-700 border border-red-200 px-2 py-1 rounded-full">Too long</span>
                        )}
                        {validation.flags.poor_compression && (
                          <span className="text-xs bg-yellow-50 text-yellow-700 border border-yellow-200 px-2 py-1 rounded-full">Low compression</span>
                        )}
                        {validation.flags.low_content_coverage && (
                          <span className="text-xs bg-yellow-50 text-yellow-700 border border-yellow-200 px-2 py-1 rounded-full">Low content coverage</span>
                        )}
                        {validation.flags.low_keyword_coverage && (
                          <span className="text-xs bg-yellow-50 text-yellow-700 border border-yellow-200 px-2 py-1 rounded-full">Low keyword coverage</span>
                        )}
                        {validation.flags.no_bullet_points && (
                          <span className="text-xs bg-yellow-50 text-yellow-700 border border-yellow-200 px-2 py-1 rounded-full">No bullet points</span>
                        )}
                        {validation.flags.high_uppercase && (
                          <span className="text-xs bg-yellow-50 text-yellow-700 border border-yellow-200 px-2 py-1 rounded-full">Unusual capitalization</span>
                        )}
                      </div>
                    )}

                    {/* Metrics */}
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                      <div className="bg-gray-50 rounded-lg p-3">
                        <p className="text-xs text-gray-500">Summary Words</p>
                        <p className="text-lg font-semibold text-gray-800">{validation.metrics.summary_words}</p>
                      </div>
                      <div className="bg-gray-50 rounded-lg p-3">
                        <p className="text-xs text-gray-500">Sentences</p>
                        <p className="text-lg font-semibold text-gray-800">{validation.metrics.sentence_count}</p>
                      </div>
                      <div className="bg-gray-50 rounded-lg p-3">
                        <p className="text-xs text-gray-500">Reading Time</p>
                        <p className="text-lg font-semibold text-gray-800">
                          {validation.metrics.reading_time_minutes}
                          <span className="text-xs font-normal text-gray-400"> min</span>
                        </p>
                      </div>
                      <div className="bg-gray-50 rounded-lg p-3">
                        <p className="text-xs text-gray-500">Compression</p>
                        <p className="text-lg font-semibold text-gray-800">{validation.metrics.compression_ratio}%</p>
                      </div>
                      <div className="bg-gray-50 rounded-lg p-3">
                        <p className="text-xs text-gray-500">Content Coverage</p>
                        <p className="text-lg font-semibold text-gray-800">{validation.metrics.content_coverage}%</p>
                      </div>
                      <div className="bg-gray-50 rounded-lg p-3">
                        <p className="text-xs text-gray-500">Keyword Coverage</p>
                        <p className="text-lg font-semibold text-gray-800">{validation.metrics.keyword_coverage}%</p>
                      </div>
                      <div className="bg-gray-50 rounded-lg p-3">
                        <p className="text-xs text-gray-500">Bullet Points</p>
                        <p className="text-lg font-semibold text-gray-800">{validation.metrics.bullet_point_count}</p>
                      </div>
                      <div className="bg-gray-50 rounded-lg p-3">
                        <p className="text-xs text-gray-500">ROUGE-L</p>
                        <p className="text-lg font-semibold text-gray-800">{validation.metrics.rougeL}%</p>
                      </div>
                    </div>
                  </>
                ) : validationLoading ? null : (
                  <div className="bg-gray-50 rounded-lg text-center py-8">
                    <p className="text-gray-500">Validation report not available.</p>
                  </div>
                )}
              </div>

              <div>
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
                  <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-800">
                    📊 Summary Evaluation Metrics
                  </h2>

                  {evaluationLoading && (
                    <div className="flex items-center text-primary-600">
                      <FiLoader className="animate-spin mr-2" />
                      Evaluating...
                    </div>
                  )}
                </div>

                {evaluation ? (
                  <div className="space-y-8">
                    {/* ================= Overall Score ================= */}

                    <div className="bg-gradient-to-r from-indigo-600 to-blue-600 rounded-2xl p-6 sm:p-8 text-white">
                      <div className="flex flex-col lg:flex-row items-center justify-between gap-8">
                        <div className="flex flex-col items-center">
                        <div className="relative w-32 h-32 sm:w-40 sm:h-40 lg:w-48 lg:h-48">
                          <svg
                            className="transform -rotate-90 w-full h-full"
                            viewBox="0 0 160 160"
                          >
                            <circle
                              cx="80"
                              cy="80"
                              r="70"
                              stroke="#ffffff30"
                              strokeWidth="12"
                              fill="none"
                            />

                            <circle
                              cx="80"
                              cy="80"
                              r="70"
                              stroke="#fff"
                              strokeWidth="12"
                              fill="none"
                              strokeDasharray={440}
                              strokeDashoffset={
                                440 -
                                (440 * evaluation.overall_score.score) / 100
                              }
                              strokeLinecap="round"
                            />
                          </svg>

                          <div className="absolute inset-0 flex flex-col items-center justify-center">
                            <h2
                              className={`text-3xl sm:text-5xl lg:text-6xl font-bold ${getScoreColor(
                                evaluation.overall_score.score
                              )}`}
                            >
                              {evaluation.overall_score.score}
                            </h2>

                            <p className="text-sm">/100</p>
                          </div>
                        </div>

                        <h3 className="mt-4 text-xl sm:text-2xl lg:text-3xl font-semibold">
                          {evaluation.overall_score.rating}
                        </h3>

                        <p className="opacity-90 mt-2">
                          Overall AI Summary Quality
                        </p>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 mt-8 w-full">
                          <div className="text-center">
                            <FiClock className="mx-auto text-3xl mb-2" />
                            <p className="text-sm opacity-80">Reading Time</p>
                            <p className="font-bold">
                              {evaluation.reading_time.label}
                            </p>
                          </div>

                          <div className="text-center">
                            <FiCheckCircle className="mx-auto text-3xl mb-2" />
                            <p className="text-sm opacity-80">Keywords</p>
                            <p className="font-bold">
                              {evaluation.keyword.matched_keywords}/
                              {evaluation.keyword.total_keywords}
                            </p>
                          </div>

                          <div className="text-center">
                            <FiTrendingUp className="mx-auto text-3xl mb-2" />
                            <p className="text-sm opacity-80">Compression</p>
                            <p className="font-bold">
                              {evaluation.compression.compression_ratio}%
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* ================= Metric Cards ================= */}

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                      <MetricCard
                        title="ROUGE-1"
                        value={`${evaluation.rouge.rouge1}%`}
                        icon={<FiTrendingUp />}
                        color="text-blue-600"
                      />

                      <MetricCard
                        title="ROUGE-2"
                        value={`${evaluation.rouge.rouge2}%`}
                        icon={<FiTarget />}
                        color="text-green-600"
                      />

                      <MetricCard
                        title="ROUGE-L"
                        value={`${evaluation.rouge.rougeL}%`}
                        icon={<FiBookOpen />}
                        color="text-purple-600"
                      />

                      <MetricCard
                        title="Coverage"
                        value={`${evaluation.content_coverage}%`}
                        icon={<FiBarChart2 />}
                        color="text-orange-600"
                      />
                    </div>

                    {/* ================= Compression ================= */}

                    <div className="bg-white rounded-xl border p-4 sm:p-6">
                      <h3 className="font-bold text-xl mb-5">
                        Compression Statistics
                      </h3>

                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                        <div>
                          <p className="text-gray-500">Transcript Words</p>
                          <h2 className="text-3xl font-bold">
                            {evaluation.compression.transcript_words}
                          </h2>
                        </div>

                        <div>
                          <p className="text-gray-500">Summary Words</p>
                          <h2 className="text-3xl font-bold">
                            {evaluation.compression.summary_words}
                          </h2>
                        </div>

                        <div>
                          <p className="text-gray-500">Compression</p>
                          <h2 className="text-3xl font-bold text-green-600">
                            {evaluation.compression.compression_ratio}%
                          </h2>
                        </div>
                      </div>
                    </div>

                    {/* ================= Progress Bars ================= */}

                    <div className="bg-white rounded-xl border p-4 sm:p-6">
                      <h3 className="font-bold text-xl mb-6">
                        Performance Metrics
                      </h3>

                      <div className="space-y-5">

                      <ProgressBar
                        label="ROUGE-1"
                        value={evaluation.rouge.rouge1}
                      />

                      <ProgressBar
                        label="ROUGE-2"
                        value={evaluation.rouge.rouge2}
                      />

                      <ProgressBar
                        label="ROUGE-L"
                        value={evaluation.rouge.rougeL}
                      />

                      <ProgressBar
                        label="Keyword Coverage"
                        value={evaluation.keyword.keyword_coverage}
                      />

                      <ProgressBar
                        label="Content Coverage"
                        value={evaluation.content_coverage}
                      />
                      </div>
                    </div>

                    {/* ================= Summary Statistics ================= */}

                    <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                      <div className="bg-white rounded-xl border p-4 sm:p-6">
                        <h3 className="font-bold text-xl mb-5">
                          Keyword Statistics
                        </h3>

                        <div className="space-y-4">
                          <div className="flex justify-between">
                            <span>Total Keywords</span>
                            <strong>{evaluation.keyword.total_keywords}</strong>
                          </div>

                          <div className="flex justify-between">
                            <span>Matched Keywords</span>
                            <strong>{evaluation.keyword.matched_keywords}</strong>
                          </div>

                          <div className="flex justify-between">
                            <span>Coverage</span>
                            <strong>{evaluation.keyword.keyword_coverage}%</strong>
                          </div>
                        </div>
                      </div>

                      <div className="bg-white rounded-xl border p-4 sm:p-6">
                        <h3 className="font-bold text-xl mb-5">Readability</h3>

                        <div className="space-y-4">
                          <div className="flex justify-between">
                            <span>Reading Time</span>
                            <strong>{evaluation.reading_time.label}</strong>
                          </div>

                          <div className="flex justify-between">
                            <span>Transcript Sentences</span>
                            <strong>{evaluation.sentence.transcript_sentences}</strong>
                          </div>

                          <div className="flex justify-between">
                            <span>Summary Sentences</span>
                            <strong>{evaluation.sentence.summary_sentences}</strong>
                          </div>

                          <div className="flex justify-between">
                            <span>Sentence Reduction</span>
                            <strong>{evaluation.sentence.sentence_reduction}%</strong>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="bg-gray-50 rounded-xl border text-center py-12">
                    <p className="text-gray-500">
                      Evaluation metrics not available.
                    </p>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default Summary;