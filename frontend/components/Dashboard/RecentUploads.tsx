"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getAvailableVideos } from "@/services/video";
import { logLearningActivity } from "@/services/user";

interface Video {
  id: number;
  filename: string;
  original_filename: string;
  status: string;
}

export default function RecentUploads() {
  const router = useRouter();

  const [videos, setVideos] = useState<Video[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchVideos = async () => {
      try {
        const data = await getAvailableVideos();
        setVideos(data);
      } catch (error) {
        console.error(
          "Error fetching available videos:",
          error
        );
      } finally {
        setLoading(false);
      }
    };

    fetchVideos();
  }, []);

  return (
    <div
      style={{
        background: "#1E293B",
        borderRadius: "18px",
        padding: "25px",
        color: "white",
      }}
    >
      <h2>📂 Available Videos</h2>

      {loading ? (
        <p style={{ marginTop: "20px" }}>
          Loading videos...
        </p>
      ) : videos.length === 0 ? (
        <p style={{ marginTop: "20px" }}>
          No videos available.
        </p>
      ) : (
        <div
          style={{
            marginTop: "20px",
            display: "flex",
            flexDirection: "column",
            gap: "16px",
          }}
        >
          {videos.map((video) => (
            <div
              key={video.id}
              style={{
                padding: "18px",
                border: "1px solid #334155",
                borderRadius: "14px",
                background: "#0F172A",
              }}
            >
              {/* Video Name */}
              <h4
                style={{
                  margin: 0,
                  color: "#38BDF8",
                  fontSize: "18px",
                }}
              >
                🎥 {video.original_filename}
              </h4>

              {/* Video Status */}
              <p
                style={{
                  margin: "8px 0 14px",
                  color:
                    video.status === "Completed"
                      ? "#22C55E"
                      : "#F59E0B",
                  fontWeight: "600",
                }}
              >
                Status: {video.status}
              </p>

              {/* Actions */}
              {video.status === "Completed" && (
                <div
                  style={{
                    display: "flex",
                    flexWrap: "wrap",
                    gap: "10px",
                  }}
                >

                  {/* Transcript */}
                  <button
                    onClick={async () => {
                      try {
                        await logLearningActivity(
                          "Transcript Viewed",
                          `Viewed transcript for ${video.original_filename}`
                        );
                      } catch (error) {
                        console.error(
                          "Failed to save learning activity:",
                          error
                        );
                      }

                      router.push(
                        `/dashboard/transcript?videoId=${video.id}`
                      );
                    }}
                    style={{
                      padding: "9px 14px",
                      border: "none",
                      borderRadius: "8px",
                      background: "#2563EB",
                      color: "white",
                      cursor: "pointer",
                      fontWeight: "600",
                    }}
                  >
                    📝 Transcript
                  </button>

                  {/* Summary */}
                  <button
                    onClick={async () => {
                      try {
                        await logLearningActivity(
                          "Summary Viewed",
                          `Viewed summary for ${video.original_filename}`
                        );
                      } catch (error) {
                        console.error(
                          "Failed to save learning activity:",
                          error
                        );
                      }

                      router.push(
                        `/dashboard/summary?videoId=${video.id}`
                      );
                    }}
                    style={{
                      padding: "9px 14px",
                      border: "none",
                      borderRadius: "8px",
                      background: "#7C3AED",
                      color: "white",
                      cursor: "pointer",
                      fontWeight: "600",
                    }}
                  >
                    🤖 Summary
                  </button>

                  {/* Keywords */}
                  <button
                    onClick={async () => {
                      try {
                        await logLearningActivity(
                          "Keywords Viewed",
                          `Viewed keywords for ${video.original_filename}`
                        );
                      } catch (error) {
                        console.error(
                          "Failed to save learning activity:",
                          error
                        );
                      }

                      router.push(
                        `/dashboard/keywords?videoId=${video.id}`
                      );
                    }}
                    style={{
                      padding: "9px 14px",
                      border: "none",
                      borderRadius: "8px",
                      background: "#0EA5E9",
                      color: "white",
                      cursor: "pointer",
                      fontWeight: "600",
                    }}
                  >
                    🏷 Keywords
                  </button>

                  {/* Key Moments */}
                  <button
                    onClick={async () => {
                      try {
                        await logLearningActivity(
                          "Key Moments Viewed",
                          `Viewed key moments for ${video.original_filename}`
                        );
                      } catch (error) {
                        console.error(
                          "Failed to save learning activity:",
                          error
                        );
                      }

                      router.push(
                        `/dashboard/key-moments?videoId=${video.id}`
                      );
                    }}
                    style={{
                      padding: "9px 14px",
                      border: "none",
                      borderRadius: "8px",
                      background: "#EAB308",
                      color: "white",
                      cursor: "pointer",
                      fontWeight: "600",
                    }}
                  >
                    ⭐ Key Moments
                  </button>

               

                  {/* AI Report */}
                  <button
                    onClick={async () => {
                      try {
                        await logLearningActivity(
                          "AI Report Viewed",
                          `Viewed AI report for ${video.original_filename}`
                        );
                      } catch (error) {
                        console.error(
                          "Failed to save learning activity:",
                          error
                        );
                      }

                      router.push(
                        `/dashboard/report?videoId=${video.id}`
                      );
                    }}
                    style={{
                      padding: "9px 14px",
                      border: "none",
                      borderRadius: "8px",
                      background: "#EC4899",
                      color: "white",
                      cursor: "pointer",
                      fontWeight: "600",
                    }}
                  >
                    📄 AI Report
                  </button>

                  {/* Watch Video */}
                  <button
                    onClick={async () => {
                      try {
                        await logLearningActivity(
                          "Video Viewed",
                          `Watched video ${video.original_filename}`
                        );
                      } catch (error) {
                        console.error(
                          "Failed to save learning activity:",
                          error
                        );
                      }

                      window.open(
                        `http://127.0.0.1:8000/videos/stream/${video.filename}`,
                        "_blank"
                      );
                    }}
                    style={{
                      padding: "9px 14px",
                      border: "none",
                      borderRadius: "8px",
                      background: "#16A34A",
                      color: "white",
                      cursor: "pointer",
                      fontWeight: "600",
                    }}
                  >
                    ▶ Watch Video
                  </button>

                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}