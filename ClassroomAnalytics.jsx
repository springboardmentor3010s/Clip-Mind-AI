import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  FiVideo,
  FiEye,
  FiUsers,
  FiClock,
  FiCheckCircle,
  FiTrendingUp,
  FiLoader,
  FiAlertCircle,
  FiDownload,
  FiActivity,
  FiBookOpen,
  FiArrowRight,
} from 'react-icons/fi';

import educatorService from '../services/educatorService.js';
import { useAuth } from '../context/AuthContext.jsx';

/* =========================================================
   STAT CARD
========================================================= */


const StatCard = ({
  title,
  value,
  icon,
  color = 'text-primary-600',
  hint,
}) => (
  <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-5">
    <div className="flex items-center justify-between gap-3">
      <div className="min-w-0">
        <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">
          {title}
        </p>

        <p
          className={`text-2xl sm:text-3xl font-bold mt-1.5 ${color}`}
        >
          {value}
        </p>

        {hint && (
          <p className="text-xs text-gray-400 mt-0.5">
            {hint}
          </p>
        )}
      </div>

      <div className="text-2xl text-gray-300 shrink-0">
        {icon}
      </div>
    </div>
  </div>
);

/* =========================================================
   FORMAT DURATION
========================================================= */

const formatDuration = (seconds) => {
  if (seconds == null || Number.isNaN(Number(seconds))) {
    return '0m';
  }

  const mins = Math.round(Number(seconds) / 60);

  if (mins < 60) {
    return `${mins}m`;
  }

  const hrs = Math.floor(mins / 60);
  const remainingMins = mins % 60;

  return `${hrs}h ${remainingMins}m`;
};

/* =========================================================
   CLASSROOM ANALYTICS
========================================================= */

const ClassroomAnalytics = () => {
  const { user } = useAuth();

  const [analytics, setAnalytics] = useState(null);
  const [engagement, setEngagement] = useState(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [exporting, setExporting] = useState(false);

  /* =======================================================
     FETCH DATA
  ======================================================= */

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError('');

      const [analyticsData, engagementData] = await Promise.all([
        educatorService.getEducatorAnalytics(),
        educatorService.getStudentEngagement(),
      ]);

      setAnalytics(analyticsData);
      setEngagement(engagementData);
    } catch (err) {
      console.error('Classroom analytics error:', err);

      setError(
        err?.response?.data?.detail ||
          err?.response?.data?.message ||
          'Failed to load classroom analytics. This dashboard is available to Educator and Administrator accounts.'
      );
    } finally {
      setLoading(false);
    }
  };

  /* =======================================================
     EXPORT CSV
  ======================================================= */

  const handleExportCSV = async () => {
    try {
      setExporting(true);
      setError('');

      await educatorService.exportEngagementCSV();
    } catch (err) {
      console.error('Export error:', err);

      setError(
        err?.response?.data?.detail ||
          err?.response?.data?.message ||
          'Failed to export engagement CSV.'
      );
    } finally {
      setExporting(false);
    }
  };

  /* =======================================================
     LOADING STATE
  ======================================================= */

  if (loading) {
    return (
      <div className="pt-6 pb-12">
        <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 xl:px-10">
          <div className="min-h-[50vh] flex flex-col items-center justify-center">
            <FiLoader className="animate-spin text-3xl text-primary-600" />

            <p className="text-gray-500 mt-3">
              Loading classroom analytics...
            </p>
          </div>
        </div>
      </div>
    );
  }

  /* =======================================================
     PAGE
  ======================================================= */

  return (
    <div className="pt-6 pb-12">
      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 xl:px-10">

        {/* =================================================
            HEADER
        ================================================== */}

        <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">

          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-800">
              Classroom Analytics
            </h1>

            <p className="text-sm text-gray-600 mt-1">
              Monitor content performance and student engagement
              across your lectures.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">

            <Link
              to="/my-videos"
              className="inline-flex items-center px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm"
            >
              <FiVideo className="mr-2" />
              My Lectures
            </Link>

            <button
              type="button"
              onClick={handleExportCSV}
              disabled={
                exporting ||
                !engagement?.learners?.length
              }
              className="inline-flex items-center px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors text-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {exporting ? (
                <FiLoader className="animate-spin mr-2" />
              ) : (
                <FiDownload className="mr-2" />
              )}

              {exporting
                ? 'Exporting...'
                : 'Export Engagement'}
            </button>

          </div>
        </div>

        {/* =================================================
            ERROR
        ================================================== */}

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6 flex items-start">
            <FiAlertCircle className="mr-2 mt-0.5 shrink-0" />

            <span>{error}</span>
          </div>
        )}

        {/* =================================================
            NO ANALYTICS
        ================================================== */}

        {!analytics ? (
          <div className="border-2 border-dashed border-gray-200 rounded-xl p-10 text-center">
            <FiActivity className="mx-auto text-4xl text-gray-300 mb-3" />

            <p className="text-gray-500">
              No analytics available yet.
            </p>
          </div>
        ) : (
          <>
            {/* =================================================
                SUMMARY STATISTICS
            ================================================== */}

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mb-6">

              <StatCard
                title="Lectures"
                value={analytics.total_videos ?? 0}
                icon={<FiVideo />}
              />

              <StatCard
                title="Total Views"
                value={analytics.total_views ?? 0}
                icon={<FiEye />}
                color="text-blue-600"
              />

              <StatCard
                title="Unique Viewers"
                value={analytics.total_unique_viewers ?? 0}
                icon={<FiUsers />}
                color="text-purple-600"
              />

              <StatCard
                title="Watch Time"
                value={formatDuration(
                  analytics.total_watch_time_seconds
                )}
                icon={<FiClock />}
                color="text-amber-600"
              />

              <StatCard
                title="Avg Completion"
                value={`${analytics.avg_completion_rate ?? 0}%`}
                icon={<FiCheckCircle />}
                color="text-green-600"
              />

              <StatCard
                title="Views / Lecture"
                value={analytics.avg_views_per_video ?? 0}
                icon={<FiTrendingUp />}
                color="text-primary-600"
              />

            </div>

            {/* =================================================
                ENGAGEMENT SUMMARY
            ================================================== */}

            {engagement && (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-6">

                <StatCard
                  title="Total Learners"
                  value={engagement.total_learners ?? 0}
                  icon={<FiUsers />}
                  color="text-primary-600"
                />

                <StatCard
                  title="Active (7 days)"
                  value={engagement.active_learners ?? 0}
                  icon={<FiActivity />}
                  color="text-green-600"
                />

                <StatCard
                  title="Watch Events"
                  value={engagement.total_watch_events ?? 0}
                  icon={<FiClock />}
                  color="text-blue-600"
                />

              </div>
            )}

            {/* =================================================
                CLASSROOM CARDS
            ================================================== */}

            {engagement?.per_video?.length > 0 ? (
              <div className="mb-6">

                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-4">

                  <h2 className="text-lg font-semibold text-gray-900 flex items-center">
                    <FiBookOpen className="mr-2 text-primary-500" />
                    Classrooms
                  </h2>

                  <p className="text-xs text-gray-500">
                    Select a classroom to view shared resources
                    and classroom controls.
                  </p>

                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">

                  {engagement.per_video.map((v, idx) => (

                    <div
                      key={v.video_id}
                      className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 flex flex-col hover:shadow-md transition-shadow"
                    >

                      {/* Classroom heading */}
                      <div className="flex items-center justify-between gap-3 mb-3">

                        <span className="text-xs font-semibold text-primary-600 uppercase tracking-wide">
                          Classroom {idx + 1}
                        </span>

                        <span className="text-xs text-gray-400">
                          {v.learners ?? 0}{' '}
                          {Number(v.learners) === 1
                            ? 'learner'
                            : 'learners'}
                        </span>

                      </div>

                      {/* Title */}
                      <h3 className="font-semibold text-gray-800 text-lg mb-4 line-clamp-2">
                        {v.title || 'Untitled Lecture'}
                      </h3>

                      {/* Learner count */}
                      <div className="flex items-center gap-3">

                        <div className="flex items-center justify-center h-14 w-14 rounded-full bg-primary-50 text-primary-600 shrink-0">
                          <FiUsers className="text-2xl" />
                        </div>

                        <div>
                          <p className="text-3xl font-bold text-gray-900 leading-none">
                            {v.learners ?? 0}
                          </p>

                          <p className="text-xs text-gray-500 mt-1">
                            Learners in this classroom
                          </p>
                        </div>

                      </div>

                      {/* Statistics */}
                      <div className="mt-5 grid grid-cols-3 gap-2 border-t border-gray-100 pt-3 text-center">

                        <div>
                          <p className="text-sm font-semibold text-gray-800">
                            {v.watches ?? 0}
                          </p>

                          <p className="text-[11px] text-gray-400">
                            Watches
                          </p>
                        </div>

                        <div>
                          <p className="text-sm font-semibold text-gray-800">
                            {v.avg_completion_rate ?? 0}%
                          </p>

                          <p className="text-[11px] text-gray-400">
                            Completion
                          </p>
                        </div>

                        <div>
                          <p className="text-sm font-semibold text-gray-800">
                            {formatDuration(
                              v.avg_watch_duration_seconds
                            )}
                          </p>

                          <p className="text-[11px] text-gray-400">
                            Watch Time
                          </p>
                        </div>

                      </div>

                      {/* =================================================
                          VIEW CLASSROOM
                      ================================================== */}

                      <Link
                        to={`/classrooms/${v.video_id}`}
                        className="mt-5 w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors text-sm font-medium"
                      >
                        <FiBookOpen />

                        View Classroom

                        <FiArrowRight className="ml-auto" />
                      </Link>

                    </div>

                  ))}

                </div>
              </div>
            ) : (
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 mb-6 text-center">

                <FiBookOpen className="mx-auto text-4xl text-gray-300 mb-3" />

                <h3 className="font-semibold text-gray-800">
                  No Classrooms Available
                </h3>

                <p className="text-sm text-gray-500 mt-1">
                  Your lecture classrooms will appear here once
                  lectures are available.
                </p>

              </div>
            )}

            {/* =================================================
                LECTURE ENGAGEMENT
            ================================================== */}

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-6 mb-6">

              <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <FiBookOpen className="mr-2 text-primary-500" />
                Lecture Engagement
              </h2>

              {engagement?.per_video?.length > 0 ? (

                <div className="overflow-x-auto">

                  <table className="w-full text-sm">

                    <thead>
                      <tr className="text-left text-gray-500 border-b border-gray-100">

                        <th className="py-2 pr-3 font-medium">
                          Lecture
                        </th>

                        <th className="py-2 px-3 font-medium">
                          Learners
                        </th>

                        <th className="py-2 px-3 font-medium">
                          Watches
                        </th>

                        <th className="py-2 px-3 font-medium">
                          Avg Completion
                        </th>

                        <th className="py-2 px-3 font-medium">
                          Avg Watch Time
                        </th>

                        <th className="py-2 px-3 font-medium">
                          Classroom
                        </th>

                      </tr>
                    </thead>

                    <tbody className="divide-y divide-gray-100">

                      {engagement.per_video.map((v) => (

                        <tr
                          key={v.video_id}
                          className="hover:bg-gray-50"
                        >

                          <td className="py-2.5 pr-3 font-medium text-gray-800">
                            <Link
                              to={`/videos/${v.video_id}`}
                              className="hover:text-primary-600"
                            >
                              {v.title || 'Untitled Lecture'}
                            </Link>
                          </td>

                          <td className="py-2.5 px-3">
                            {v.learners ?? 0}
                          </td>

                          <td className="py-2.5 px-3">
                            {v.watches ?? 0}
                          </td>

                          <td className="py-2.5 px-3">
                            {v.avg_completion_rate ?? 0}%
                          </td>

                          <td className="py-2.5 px-3">
                            {formatDuration(
                              v.avg_watch_duration_seconds
                            )}
                          </td>

                          <td className="py-2.5 px-3">

                            <Link
                              to={`/classrooms/${v.video_id}`}
                              className="inline-flex items-center gap-1 text-primary-600 hover:text-primary-700 font-medium"
                            >
                              View
                              <FiArrowRight />
                            </Link>

                          </td>

                        </tr>

                      ))}

                    </tbody>

                  </table>

                </div>

              ) : (

                <div className="text-center py-8 text-gray-400 text-sm">
                  No student activity yet. Share lectures or
                  classroom resources with students to start
                  tracking engagement.
                </div>

              )}

            </div>

            {/* =================================================
                STUDENT ENGAGEMENT
            ================================================== */}

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-6">

              <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <FiUsers className="mr-2 text-primary-500" />
                Student Engagement
              </h2>

              {engagement?.learners?.length > 0 ? (

                <div className="overflow-x-auto">

                  <table className="w-full text-sm">

                    <thead>
                      <tr className="text-left text-gray-500 border-b border-gray-100">

                        <th className="py-2 pr-3 font-medium">
                          Student
                        </th>

                        <th className="py-2 px-3 font-medium">
                          Videos Watched
                        </th>

                        <th className="py-2 px-3 font-medium">
                          Watch Time
                        </th>

                        <th className="py-2 px-3 font-medium">
                          Avg Completion
                        </th>

                        <th className="py-2 px-3 font-medium">
                          Last Active
                        </th>

                      </tr>
                    </thead>

                    <tbody className="divide-y divide-gray-100">

                      {engagement.learners.map((learner) => (

                        <tr
                          key={learner.user_id}
                          className="hover:bg-gray-50"
                        >

                          <td className="py-2.5 pr-3">

                            <p className="font-medium text-gray-800">
                              {learner.full_name ||
                                'Unknown Student'}
                            </p>

                            <p className="text-xs text-gray-400">
                              @{learner.username || 'unknown'}
                            </p>

                          </td>

                          <td className="py-2.5 px-3">
                            {learner.videos_watched ?? 0}
                          </td>

                          <td className="py-2.5 px-3">
                            {formatDuration(
                              learner.total_watch_time_seconds
                            )}
                          </td>

                          <td className="py-2.5 px-3">
                            {learner.avg_completion_rate ?? 0}%
                          </td>

                          <td className="py-2.5 px-3 text-gray-500">

                            {learner.last_active
                              ? new Date(
                                  learner.last_active
                                ).toLocaleDateString()
                              : 'Never'}

                          </td>

                        </tr>

                      ))}

                    </tbody>

                  </table>

                </div>

              ) : (

                <div className="text-center py-8 text-gray-400 text-sm">
                  No learner activity recorded yet. Student
                  watch history will appear here as your class
                  watches the lectures.
                </div>

              )}

            </div>

          </>
        )}

      </div>
    </div>
  );
};

export default ClassroomAnalytics;