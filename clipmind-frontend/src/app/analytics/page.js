"use client";

import { useEffect, useState } from "react";
import {
  FaVideo,
  FaClock,
  FaFileAlt,
  FaFilm,
  FaTags,
  FaRobot,
} from "react-icons/fa";

import DashboardLayout from "@/components/layout/DashboardLayout";
import { getUsageAnalytics } from "@/services/analyticsService";

export default function AnalyticsPage() {
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    loadAnalytics();
  }, []);

  async function loadAnalytics() {
    try {
      const data = await getUsageAnalytics();
      setAnalytics(data);
    } catch (error) {
      console.error("Failed to load usage analytics:", error);
      setError("Unable to load analytics.");
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex justify-center items-center h-[60vh] text-xl font-semibold text-slate-600">
          Loading analytics...
        </div>
      </DashboardLayout>
    );
  }

  if (error) {
    return (
      <DashboardLayout>
        <div className="flex justify-center items-center h-[60vh]">
          <div className="bg-red-50 border border-red-200 text-red-700 px-6 py-4 rounded-2xl">
            {error}
          </div>
        </div>
      </DashboardLayout>
    );
  }

  const totalDurationMinutes =
    (analytics.total_video_duration / 60).toFixed(2);

  const averageDurationMinutes =
    (analytics.average_video_duration / 60).toFixed(2);

  return (
    <DashboardLayout>

      <div className="space-y-10">

        {/* Page Header */}

        <div>
          <h1 className="text-5xl font-extrabold text-slate-900">
            Analytics
          </h1>

          <p className="mt-3 text-lg text-slate-500">
            Understand your video content and AI processing activity.
          </p>
        </div>


        {/* Usage Overview */}

        <div>

          <h2 className="text-3xl font-bold text-slate-900">
            Usage Overview
          </h2>

          <p className="mt-2 text-slate-500">
            Overall statistics across your uploaded videos.
          </p>

        </div>


        <div className="grid md:grid-cols-2 xl:grid-cols-4 gap-6">

          {/* Total Videos */}

          <div className="bg-white rounded-3xl border border-slate-200 shadow-lg p-6">

            <div className="w-14 h-14 rounded-2xl bg-violet-100 text-violet-600 flex items-center justify-center text-2xl">
              <FaVideo />
            </div>

            <p className="mt-5 text-slate-500 font-medium">
              Total Videos
            </p>

            <h3 className="mt-2 text-4xl font-extrabold text-slate-900">
              {analytics.total_videos}
            </h3>

          </div>


          {/* Total Duration */}

          <div className="bg-white rounded-3xl border border-slate-200 shadow-lg p-6">

            <div className="w-14 h-14 rounded-2xl bg-sky-100 text-sky-600 flex items-center justify-center text-2xl">
              <FaClock />
            </div>

            <p className="mt-5 text-slate-500 font-medium">
              Total Duration
            </p>

            <h3 className="mt-2 text-4xl font-extrabold text-slate-900">
              {totalDurationMinutes}
            </h3>

            <p className="text-slate-500 mt-1">
              minutes
            </p>

          </div>


          {/* Average Duration */}

          <div className="bg-white rounded-3xl border border-slate-200 shadow-lg p-6">

            <div className="w-14 h-14 rounded-2xl bg-emerald-100 text-emerald-600 flex items-center justify-center text-2xl">
              <FaClock />
            </div>

            <p className="mt-5 text-slate-500 font-medium">
              Average Video
            </p>

            <h3 className="mt-2 text-4xl font-extrabold text-slate-900">
              {averageDurationMinutes}
            </h3>

            <p className="text-slate-500 mt-1">
              minutes/video
            </p>

          </div>


          {/* Transcript Words */}

          <div className="bg-white rounded-3xl border border-slate-200 shadow-lg p-6">

            <div className="w-14 h-14 rounded-2xl bg-orange-100 text-orange-600 flex items-center justify-center text-2xl">
              <FaFileAlt />
            </div>

            <p className="mt-5 text-slate-500 font-medium">
              Transcript Words
            </p>

            <h3 className="mt-2 text-4xl font-extrabold text-slate-900">
              {analytics.total_transcript_words.toLocaleString()}
            </h3>

          </div>

        </div>


        {/* AI Content Insights */}

        <div>

          <h2 className="text-3xl font-bold text-slate-900">
            AI Content Insights
          </h2>

          <p className="mt-2 text-slate-500">
            Statistics generated from your processed video content.
          </p>

        </div>


        <div className="grid md:grid-cols-2 xl:grid-cols-4 gap-6">

          {/* Transcript Segments */}

          <div className="bg-white rounded-3xl border border-slate-200 shadow-lg p-6">

            <div className="w-14 h-14 rounded-2xl bg-blue-100 text-blue-600 flex items-center justify-center text-2xl">
              <FaFileAlt />
            </div>

            <p className="mt-5 text-slate-500">
              Transcript Segments
            </p>

            <h3 className="mt-2 text-4xl font-extrabold text-slate-900">
              {analytics.total_transcript_segments}
            </h3>

          </div>


          {/* Key Moments */}

          <div className="bg-white rounded-3xl border border-slate-200 shadow-lg p-6">

            <div className="w-14 h-14 rounded-2xl bg-purple-100 text-purple-600 flex items-center justify-center text-2xl">
              <FaFilm />
            </div>

            <p className="mt-5 text-slate-500">
              Key Moments
            </p>

            <h3 className="mt-2 text-4xl font-extrabold text-slate-900">
              {analytics.total_key_moments}
            </h3>

          </div>


          {/* Keywords */}

          <div className="bg-white rounded-3xl border border-slate-200 shadow-lg p-6">

            <div className="w-14 h-14 rounded-2xl bg-yellow-100 text-yellow-600 flex items-center justify-center text-2xl">
              <FaTags />
            </div>

            <p className="mt-5 text-slate-500">
              Keywords
            </p>

            <h3 className="mt-2 text-4xl font-extrabold text-slate-900">
              {analytics.total_keywords}
            </h3>

          </div>


          {/* Summaries */}

          <div className="bg-white rounded-3xl border border-slate-200 shadow-lg p-6">

            <div className="w-14 h-14 rounded-2xl bg-emerald-100 text-emerald-600 flex items-center justify-center text-2xl">
              <FaRobot />
            </div>

            <p className="mt-5 text-slate-500">
              AI Summaries
            </p>

            <h3 className="mt-2 text-4xl font-extrabold text-slate-900">
              {analytics.total_summaries}
            </h3>

          </div>

        </div>


        {/* Key Moment Density */}

        <div className="bg-white rounded-3xl border border-slate-200 shadow-lg p-8">

          <h2 className="text-2xl font-bold text-slate-900">
            Key Moment Activity
          </h2>

          <p className="text-slate-500 mt-2">
            Average number of detected key moments per uploaded video.
          </p>

          <div className="mt-6 flex items-end gap-4">

            <span className="text-6xl font-extrabold text-violet-600">
              {analytics.average_key_moments_per_video}
            </span>

            <span className="text-slate-500 mb-2">
              key moments / video
            </span>

          </div>

        </div>


        {/* Most Frequent Keywords */}

        <div className="bg-white rounded-3xl border border-slate-200 shadow-lg p-8">

          <h2 className="text-2xl font-bold text-slate-900">
            Most Frequent Keywords
          </h2>

          <p className="text-slate-500 mt-2">
            The most frequently occurring keywords across your videos.
          </p>

          <div className="mt-8 space-y-5">

            {analytics.most_frequent_keywords.length === 0 ? (

              <p className="text-slate-500">
                No keyword data available.
              </p>

            ) : (

              analytics.most_frequent_keywords.map(
                (item, index) => {

                  const maxFrequency =
                    analytics.most_frequent_keywords[0]
                      .total_frequency;

                  const width =
                    (item.total_frequency / maxFrequency) * 100;

                  return (
                    <div key={item.keyword}>

                      <div className="flex justify-between mb-2">

                        <span className="font-semibold text-slate-700">
                          {index + 1}. {item.keyword}
                        </span>

                        <span className="font-semibold text-violet-600">
                          {item.total_frequency}
                        </span>

                      </div>

                      <div className="w-full bg-slate-100 rounded-full h-3">

                        <div
                          className="bg-gradient-to-r from-violet-500 to-purple-600 h-3 rounded-full"
                          style={{
                            width: `${width}%`,
                          }}
                        />

                      </div>

                    </div>
                  );
                }
              )

            )}

          </div>

        </div>

      </div>

    </DashboardLayout>
  );
}