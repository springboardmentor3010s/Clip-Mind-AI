"use client";

import { useEffect, useState } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { getMyVideos, getSummary } from "@/services/videoService";

export default function SummariesPage() {
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);

  const [selectedVideo, setSelectedVideo] = useState(null);
  const [summary, setSummary] = useState("");
  const [summaryType, setSummaryType] = useState("short");
  const [summaryLoading, setSummaryLoading] = useState(false);

  useEffect(() => {
    loadVideos();
  }, []);

  async function loadVideos() {
    try {
      const data = await getMyVideos();
      setVideos(data);
    } catch (error) {
      console.error("Failed to load videos:", error);
    } finally {
      setLoading(false);
    }
  }

  async function handleViewSummary(videoId, type) {
    try {
      setSummaryLoading(true);
      setSelectedVideo(videoId);
      setSummaryType(type);

      const data = await getSummary(videoId, type);

      setSummary(data.summary_text);
    } catch (error) {
      console.error("Failed to load summary:", error);
      setSummary("Summary not available.");
    } finally {
      setSummaryLoading(false);
    }
  }

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex justify-center items-center h-[60vh] text-xl font-semibold">
          Loading summaries...
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-8">

        {/* Header */}

        <div>
          <h1 className="text-5xl font-extrabold text-slate-900">
            AI Summaries
          </h1>

          <p className="mt-3 text-lg text-slate-500">
            View AI-generated summaries for your uploaded videos.
          </p>
        </div>

        {/* Empty State */}

        {videos.length === 0 ? (
          <div className="bg-white rounded-3xl shadow-lg border border-slate-200 p-12 text-center">

            <h2 className="text-3xl font-bold text-slate-800">
              No Videos Found
            </h2>

            <p className="mt-4 text-slate-500">
              Upload a video first to generate summaries.
            </p>

          </div>
        ) : (

          <div className="grid lg:grid-cols-2 gap-8">

            {videos.map((video) => (

              <div
                key={video.id}
                className="bg-white rounded-3xl border border-slate-200 shadow-lg overflow-hidden"
              >

                <img
                  src={`http://127.0.0.1:8000/${video.thumbnail_path.replace(/\\/g, "/")}`}
                  alt={video.filename}
                  className="w-full h-56 object-cover"
                  onError={(e) => {
                    e.currentTarget.src =
                      "https://placehold.co/600x350?text=ClipMind+AI";
                  }}
                />

                <div className="p-6">

                  <h2 className="text-2xl font-bold text-slate-800 break-words">
                    {video.filename}
                  </h2>

                  <div className="mt-5 space-y-3">

                    <div className="flex justify-between">
                      <span className="text-slate-500">Status</span>

                      <span className="font-semibold text-green-600">
                        {video.status}
                      </span>
                    </div>

                    <div className="flex justify-between">
                      <span className="text-slate-500">Duration</span>

                      <span className="font-semibold">
                        {Number(video.duration).toFixed(2)} sec
                      </span>
                    </div>

                  </div>

                  <div className="grid grid-cols-2 gap-3 mt-6">

                    <button
                      onClick={() =>
                        handleViewSummary(video.id, "short")
                      }
                      className="rounded-xl bg-emerald-600 text-white py-3 font-semibold hover:bg-emerald-700 transition"
                    >
                      Short Summary
                    </button>

                    <button
                      onClick={() =>
                        handleViewSummary(video.id, "detailed")
                      }
                      className="rounded-xl bg-violet-600 text-white py-3 font-semibold hover:bg-violet-700 transition"
                    >
                      Detailed Summary
                    </button>

                  </div>

                  {selectedVideo === video.id && summaryLoading && (

                    <div className="mt-6 rounded-xl bg-yellow-50 border border-yellow-200 p-4">

                      Loading summary...

                    </div>

                  )}

                  {selectedVideo === video.id &&
                    !summaryLoading &&
                    summary && (

                      <div className="mt-6 rounded-2xl border border-slate-200 bg-slate-50 p-6">

                        <h3 className="text-xl font-bold mb-2">
                          {summaryType === "short"
                            ? "Short Summary"
                            : "Detailed Summary"}
                        </h3>

                        <p className="whitespace-pre-wrap text-slate-700 leading-7">
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