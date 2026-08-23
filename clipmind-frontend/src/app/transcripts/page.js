"use client";

import { useEffect, useState } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { getMyVideos, getTranscript } from "@/services/videoService";

export default function TranscriptsPage() {
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);

  const [selectedVideo, setSelectedVideo] = useState(null);
  const [transcript, setTranscript] = useState("");
  const [transcriptLoading, setTranscriptLoading] = useState(false);

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

  async function handleViewTranscript(videoId) {
    try {
      setTranscriptLoading(true);
      setSelectedVideo(videoId);

      const data = await getTranscript(videoId);

      setTranscript(data.transcript_text);
    } catch (error) {
      console.error("Failed to load transcript:", error);
      setTranscript("Transcript not available.");
    } finally {
      setTranscriptLoading(false);
    }
  }

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex justify-center items-center h-[60vh] text-xl font-semibold">
          Loading transcripts...
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
            Transcripts
          </h1>

          <p className="mt-3 text-lg text-slate-500">
            View AI-generated transcripts for your uploaded videos.
          </p>
        </div>

        {/* Empty State */}

        {videos.length === 0 ? (
          <div className="bg-white rounded-3xl shadow-lg border border-slate-200 p-12 text-center">

            <h2 className="text-3xl font-bold text-slate-800">
              No Videos Found
            </h2>

            <p className="mt-4 text-slate-500">
              Upload a video first to generate transcripts.
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
                  src={`http://127.0.0.1:8000/${video.thumbnail_path.replace(
                    /\\/g,
                    "/"
                  )}`}
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

                  <button
                    onClick={() => handleViewTranscript(video.id)}
                    className="mt-6 w-full rounded-2xl bg-gradient-to-r from-sky-600 to-cyan-600 text-white py-3 font-semibold hover:opacity-90"
                  >
                    View Transcript
                  </button>

                  {selectedVideo === video.id && transcriptLoading && (

                    <div className="mt-6 rounded-xl bg-blue-50 border border-blue-200 p-4">

                      Loading transcript...

                    </div>

                  )}

                  {selectedVideo === video.id &&
                    !transcriptLoading &&
                    transcript && (

                      <div className="mt-6 rounded-2xl border border-slate-200 bg-slate-50 p-6">

                        <h3 className="text-xl font-bold mb-4">
                          Transcript
                        </h3>

                        <p className="whitespace-pre-wrap text-slate-700 leading-7">
                          {transcript}
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