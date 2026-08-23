"use client";

import { useEffect, useState } from "react";

import DashboardLayout from "@/components/layout/DashboardLayout";

import {
  getMyVideos,
  getSummary,
  generateEducationalSummary,
} from "@/services/videoService";


export default function SummariesPage() {

  const [videos, setVideos] = useState([]);

  const [loading, setLoading] = useState(true);

  const [selectedVideo, setSelectedVideo] = useState(null);

  const [summary, setSummary] = useState("");

  const [summaryType, setSummaryType] = useState("");

  const [summaryLoading, setSummaryLoading] = useState(false);

  const [error, setError] = useState("");

  const [userRole, setUserRole] = useState("");


  // ============================================================
  // LOAD USER ROLE
  // ============================================================

  useEffect(() => {

    const storedUser =
      localStorage.getItem("user");

    if (storedUser) {

      try {

        const user =
          JSON.parse(storedUser);

        setUserRole(user?.role || "");

      } catch (error) {

        console.error(
          "Failed to read stored user:",
          error
        );

      }

    }

  }, []);


  // ============================================================
  // LOAD VIDEOS
  // ============================================================

  useEffect(() => {

    loadVideos();

  }, []);


  async function loadVideos() {

    try {

      setLoading(true);

      setError("");

      const data =
        await getMyVideos();

      setVideos(data);

    } catch (error) {

      console.error(
        "Failed to load videos:",
        error
      );

      setError(
        error.response?.data?.detail ||
        "Unable to load videos."
      );

    } finally {

      setLoading(false);

    }

  }


  // ============================================================
  // VIEW SHORT / DETAILED SUMMARY
  // ============================================================

  async function handleViewSummary(
    videoId,
    type
  ) {

    try {

      setSummaryLoading(true);

      setSelectedVideo(videoId);

      setSummaryType(type);

      setSummary("");

      setError("");

      const data =
        await getSummary(
          videoId,
          type
        );

      setSummary(
        data.summary_text
      );

    } catch (error) {

      console.error(
        "Failed to load summary:",
        error
      );

      setSummary("");

      setError(
        error.response?.data?.detail ||
        `${type} summary is not available.`
      );

    } finally {

      setSummaryLoading(false);

    }

  }


  // ============================================================
  // GENERATE EDUCATIONAL SUMMARY
  // Educator only
  // ============================================================

  async function handleGenerateEducationalSummary(
    videoId
  ) {

    try {

      setSummaryLoading(true);

      setSelectedVideo(videoId);

      setSummaryType("educational");

      setSummary("");

      setError("");

      const data =
        await generateEducationalSummary(
          videoId
        );

      setSummary(
        data.summary_text
      );

    } catch (error) {

      console.error(
        "Failed to generate educational summary:",
        error
      );

      setSummary("");

      setError(
        error.response?.data?.detail ||
        "Unable to generate educational summary."
      );

    } finally {

      setSummaryLoading(false);

    }

  }


  // ============================================================
  // LOADING SCREEN
  // ============================================================

  if (loading) {

    return (

      <DashboardLayout>

        <div className="flex min-h-[60vh] items-center justify-center">

          <p className="text-xl font-semibold text-slate-600">

            Loading summaries...

          </p>

        </div>

      </DashboardLayout>

    );

  }


  // ============================================================
  // MAIN PAGE
  // ============================================================

  return (

    <DashboardLayout>

      <div className="space-y-8">

        {/* ==================================================== */}
        {/* HEADER */}
        {/* ==================================================== */}

        <div>

          <p className="text-sm font-semibold text-violet-600">
            AI-Powered Learning
          </p>

          <h1 className="mt-2 text-4xl font-extrabold text-slate-900">
            AI Summaries
          </h1>

          <p className="mt-3 text-lg text-slate-500">

            {userRole === "EDUCATOR"
              ? "Generate and review short, detailed and educational summaries for your lectures."
              : "View AI-generated short and detailed summaries for your uploaded videos."
            }

          </p>

        </div>


        {/* ==================================================== */}
        {/* ERROR */}
        {/* ==================================================== */}

        {error && (

          <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-red-700">

            {error}

          </div>

        )}


        {/* ==================================================== */}
        {/* NO VIDEOS */}
        {/* ==================================================== */}

        {videos.length === 0 ? (

          <div className="rounded-3xl border border-slate-200 bg-white p-12 text-center shadow-lg">

            <h2 className="text-3xl font-bold text-slate-800">

              No Videos Found

            </h2>

            <p className="mt-4 text-slate-500">

              Upload a video first to generate summaries.

            </p>

          </div>

        ) : (

          <div className="grid gap-8 lg:grid-cols-2">

            {videos.map((video) => (

              <div
                key={video.id}
                className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-lg"
              >

                {/* ================================================= */}
                {/* THUMBNAIL */}
                {/* ================================================= */}

                {video.thumbnail_path && (

                  <img
                    src={`http://127.0.0.1:8000/${video.thumbnail_path.replace(
                      /\\/g,
                      "/"
                    )}`}
                    alt={video.filename}
                    className="h-56 w-full object-cover"
                    onError={(e) => {

                      e.currentTarget.src =
                        "https://placehold.co/600x350?text=ClipMind+AI";

                    }}
                  />

                )}


                <div className="p-6">

                  {/* ================================================= */}
                  {/* VIDEO INFORMATION */}
                  {/* ================================================= */}

                  <h2 className="break-words text-2xl font-bold text-slate-800">

                    {video.filename}

                  </h2>


                  <div className="mt-5 space-y-3">

                    <div className="flex justify-between">

                      <span className="text-slate-500">
                        Status
                      </span>

                      <span className="font-semibold text-green-600">
                        {video.status}
                      </span>

                    </div>


                    <div className="flex justify-between">

                      <span className="text-slate-500">
                        Duration
                      </span>

                      <span className="font-semibold">
                        {Number(video.duration).toFixed(2)} sec
                      </span>

                    </div>

                  </div>


                  {/* ================================================= */}
                  {/* SUMMARY BUTTONS */}
                  {/* ================================================= */}

                  <div
                    className={
                      userRole === "EDUCATOR"
                        ? "mt-6 grid grid-cols-1 gap-3 sm:grid-cols-3"
                        : "mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2"
                    }
                  >

                    {/* SHORT */}

                    <button
                      onClick={() =>
                        handleViewSummary(
                          video.id,
                          "short"
                        )
                      }
                      disabled={summaryLoading}
                      className="rounded-xl bg-emerald-600 py-3 font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
                    >

                      Short Summary

                    </button>


                    {/* DETAILED */}

                    <button
                      onClick={() =>
                        handleViewSummary(
                          video.id,
                          "detailed"
                        )
                      }
                      disabled={summaryLoading}
                      className="rounded-xl bg-violet-600 py-3 font-semibold text-white transition hover:bg-violet-700 disabled:cursor-not-allowed disabled:opacity-50"
                    >

                      Detailed Summary

                    </button>


                    {/* EDUCATIONAL */}
                    
                    {userRole === "EDUCATOR" && (

                      <button
                        onClick={() =>
                          handleGenerateEducationalSummary(
                            video.id
                          )
                        }
                        disabled={summaryLoading}
                        className="rounded-xl bg-blue-600 py-3 font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                      >

                        Educational Summary

                      </button>

                    )}

                  </div>


                  {/* ================================================= */}
                  {/* SUMMARY LOADING */}
                  {/* ================================================= */}

                  {selectedVideo === video.id &&
                    summaryLoading && (

                      <div className="mt-6 rounded-xl border border-yellow-200 bg-yellow-50 p-4">

                        <p className="font-medium text-yellow-800">

                          {summaryType === "educational"
                            ? "Generating educational summary..."
                            : "Loading summary..."
                          }

                        </p>

                      </div>

                  )}


                  {/* ================================================= */}
                  {/* SUMMARY DISPLAY */}
                  {/* ================================================= */}

                  {selectedVideo === video.id &&
                    !summaryLoading &&
                    summary && (

                      <div className="mt-6 rounded-2xl border border-slate-200 bg-slate-50 p-6">

                        <div className="mb-4 flex items-center justify-between gap-3">

                          <h3 className="text-xl font-bold text-slate-900">

                            {summaryType === "short"
                              ? "Short Summary"
                              : summaryType === "detailed"
                              ? "Detailed Summary"
                              : "Educational Summary"
                            }

                          </h3>


                          {summaryType === "educational" && (

                            <span className="rounded-full bg-blue-100 px-3 py-1 text-xs font-semibold text-blue-700">

                              Educator

                            </span>

                          )}

                        </div>


                        {/* ================================================= */}
                        {/* EDUCATIONAL SUMMARY EXPLANATION */}
                        {/* ================================================= */}

                        {summaryType === "educational" && (

                          <div className="mb-4 rounded-xl border border-blue-100 bg-blue-50 p-4">

                            <p className="text-sm leading-6 text-blue-800">

                              This summary is generated as
                              student-focused learning material
                              from the lecture transcript.

                            </p>

                          </div>

                        )}


                        <p className="whitespace-pre-wrap leading-8 text-slate-700">

                          {summary}

                        </p>

                      </div>

                  )}

                </div>

              </div>

            ))}

          </div>

        )}

      </div>

    </DashboardLayout>

  );

}