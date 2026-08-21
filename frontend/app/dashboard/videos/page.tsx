"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { getMyVideos } from "@/services/video";

type Video = {
  id: number;
  filename: string;
  original_filename: string;
  status: string;
};

export default function VideosPage() {
  const router = useRouter();

  const [videos, setVideos] = useState<Video[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadVideos = async () => {
      try {
        setLoading(true);
        setError("");

        const data = await getMyVideos();

        setVideos(data);
      } catch (err) {
        console.error("Failed to load videos:", err);
        setError("Failed to load your videos.");
      } finally {
        setLoading(false);
      }
    };

    loadVideos();
  }, []);

  const viewTranscript = (videoId: number) => {
    router.push(
      `/dashboard/transcript?videoId=${videoId}`
    );
  };

  return (
    <div className="p-8">

      <h1 className="text-3xl font-bold mb-2">
        📝 Review Transcripts
      </h1>

      <p className="text-gray-500 mb-8">
        Select one of your lectures to review and edit
        its transcript.
      </p>

      {loading && (
        <div className="bg-white rounded-xl shadow p-6">
          <p className="text-gray-600">
            Loading your lectures...
          </p>
        </div>
      )}

      {error && (
        <div className="bg-red-100 text-red-700 rounded-xl p-5">
          {error}
        </div>
      )}

      {!loading && !error && videos.length === 0 && (
        <div className="bg-white rounded-xl shadow p-8 text-center">
          <p className="text-gray-600 text-lg">
            No lectures uploaded yet.
          </p>

          <button
            onClick={() =>
              router.push("/dashboard/upload")
            }
            className="mt-4 bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded-lg"
          >
            Upload Lecture
          </button>
        </div>
      )}

      {!loading && !error && videos.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">

          {videos.map((video) => (
            <div
              key={video.id}
              className="bg-white rounded-xl shadow-lg p-6"
            >

              <h2 className="text-lg font-semibold text-gray-800 mb-3">
                📹 {video.original_filename}
              </h2>

              <p className="text-sm text-gray-500 mb-4">
                Status:{" "}
                <span className="font-semibold">
                  {video.status}
                </span>
              </p>

              <button
                onClick={() =>
                  viewTranscript(video.id)
                }
                className="w-full bg-blue-600 hover:bg-blue-700 text-white px-4 py-3 rounded-lg font-semibold transition"
              >
                📝 View Transcript
              </button>

            </div>
          ))}

        </div>
      )}

    </div>
  );
}