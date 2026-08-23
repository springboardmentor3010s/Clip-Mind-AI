"use client";

import { useEffect, useState } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";

import {
  getMyVideos,
  getSummariesByVideo,
} from "@/services/videoService";

import { getEducatorClassrooms } from "@/services/classroomService";


import { shareSummary } from "@/services/summaryShareService";

export default function ShareSummariesPage() {
  const [videos, setVideos] = useState([]);
  const [classrooms, setClassrooms] = useState([]);

  const [selectedVideoId, setSelectedVideoId] = useState("");
  const [selectedSummaryId, setSelectedSummaryId] = useState("");
  const [selectedClassroomId, setSelectedClassroomId] = useState("");

  const [summaries, setSummaries] = useState([]);

  const [loading, setLoading] = useState(true);
  const [loadingSummaries, setLoadingSummaries] = useState(false);
  const [sharing, setSharing] = useState(false);

  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  // ============================================================
  // LOAD EDUCATOR VIDEOS AND CLASSROOMS
  // ============================================================

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        setError("");

        const [videosData, classroomsData] = await Promise.all([
          getMyVideos(),
           getEducatorClassrooms(),
        ]);

        setVideos(videosData);
        setClassrooms(classroomsData);
      } catch (error) {
        console.error("Failed to load data:", error);

        setError(
          error.response?.data?.detail ||
            "Unable to load videos or classrooms."
        );
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  // ============================================================
  // LOAD SUMMARIES WHEN VIDEO IS SELECTED
  // ============================================================

  const handleVideoChange = async (videoId) => {
  setSelectedVideoId(videoId);
  setSelectedSummaryId("");
  setSummaries([]);
  setMessage("");
  setError("");

  if (!videoId) {
    return;
  }

  try {
    setLoadingSummaries(true);

    const data = await getSummariesByVideo(
      Number(videoId)
    );

    setSummaries(data);

  } catch (error) {
    console.error("Failed to load summaries:", error);

    setError(
      error.response?.data?.detail ||
        "Unable to load summaries for this video."
    );

    setSummaries([]);

  } finally {
    setLoadingSummaries(false);
  }
};

  // ============================================================
  // SHARE SUMMARY
  // ============================================================

  const handleShareSummary = async () => {
    setMessage("");
    setError("");

    if (!selectedVideoId) {
      setError("Please select a video.");
      return;
    }

    if (!selectedSummaryId) {
      setError("Please select a summary.");
      return;
    }

    if (!selectedClassroomId) {
      setError("Please select a classroom.");
      return;
    }

    try {
      setSharing(true);

      await shareSummary(
        Number(selectedSummaryId),
        Number(selectedClassroomId)
      );

      setMessage(
        "Summary shared successfully with the selected classroom."
      );

      setSelectedSummaryId("");
      setSelectedClassroomId("");
    } catch (error) {
      console.error("Failed to share summary:", error);

      setError(
        error.response?.data?.detail ||
          "Unable to share the summary."
      );
    } finally {
      setSharing(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="min-h-screen p-6 md:p-8">
        
        {/* ===================================================== */}
        {/* HEADER */}
        {/* ===================================================== */}

        <div className="mb-8">
          <p className="text-sm font-semibold text-violet-600">
            Classroom Learning Resources
          </p>

          <h1 className="mt-2 text-3xl font-bold text-slate-900">
            Share Summaries
          </h1>

          <p className="mt-2 text-slate-600">
            Share your educational video summaries with learners
            through your classrooms.
          </p>
        </div>

        {/* ===================================================== */}
        {/* LOADING */}
        {/* ===================================================== */}

        {loading && (
          <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center text-slate-500">
            Loading videos and classrooms...
          </div>
        )}

        {/* ===================================================== */}
        {/* MAIN FORM */}
        {/* ===================================================== */}

        {!loading && (
          <div className="max-w-3xl rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            
            {/* VIDEO */}

            <div className="mb-6">
              <label className="mb-2 block text-sm font-bold text-slate-700">
                1. Select Video
              </label>

              <select
                value={selectedVideoId}
                onChange={(e) =>
                  handleVideoChange(e.target.value)
                }
                className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-violet-500"
              >
                <option value="">
                  Select one of your videos
                </option>

                {videos.map((video) => (
                  <option key={video.id} value={video.id}>
                    {video.original_filename || video.filename} — ID:{" "}
                    {video.id}
                  </option>
                ))}
              </select>
            </div>

            {/* SUMMARY */}

            <div className="mb-6">
              <label className="mb-2 block text-sm font-bold text-slate-700">
                2. Select Summary
              </label>

              <select
                value={selectedSummaryId}
                onChange={(e) =>
                  setSelectedSummaryId(e.target.value)
                }
                disabled={!selectedVideoId || loadingSummaries}
                className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none disabled:cursor-not-allowed disabled:bg-slate-100 focus:border-violet-500"
              >
                <option value="">
                  {loadingSummaries
                    ? "Loading summaries..."
                    : "Select a summary"}
                </option>

                {summaries.map((summary) => (
                  <option key={summary.id} value={summary.id}>
                    {summary.summary_type} Summary — ID: {summary.id}
                  </option>
                ))}
              </select>

              {selectedVideoId &&
                !loadingSummaries &&
                summaries.length === 0 && (
                  <p className="mt-2 text-sm text-amber-600">
                    No summaries are available for this video.
                  </p>
                )}
            </div>

            {/* CLASSROOM */}

            <div className="mb-8">
              <label className="mb-2 block text-sm font-bold text-slate-700">
                3. Select Classroom
              </label>

              <select
                value={selectedClassroomId}
                onChange={(e) =>
                  setSelectedClassroomId(e.target.value)
                }
                className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-violet-500"
              >
                <option value="">
                  Select a classroom
                </option>

                {classrooms.map((classroom) => (
                  <option
                    key={classroom.id}
                    value={classroom.id}
                  >
                    {classroom.name}
                  </option>
                ))}
              </select>

              {classrooms.length === 0 && (
                <p className="mt-2 text-sm text-amber-600">
                  You have not created any classrooms yet.
                </p>
              )}
            </div>

            {/* SUCCESS MESSAGE */}

            {message && (
              <div className="mb-6 rounded-xl border border-green-200 bg-green-50 p-4 text-green-700">
                {message}
              </div>
            )}

            {/* ERROR MESSAGE */}

            {error && (
              <div className="mb-6 rounded-xl border border-red-200 bg-red-50 p-4 text-red-700">
                {error}
              </div>
            )}

            {/* SHARE BUTTON */}

            <button
              onClick={handleShareSummary}
              disabled={
                sharing ||
                !selectedVideoId ||
                !selectedSummaryId ||
                !selectedClassroomId
              }
              className="w-full rounded-xl bg-violet-600 px-5 py-4 font-bold text-white transition hover:bg-violet-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {sharing
                ? "Sharing Summary..."
                : "Share Summary with Classroom"}
            </button>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}