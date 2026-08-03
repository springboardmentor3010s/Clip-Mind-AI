"use client";

import { useEffect, useState } from "react";
import { getMyVideos } from "@/services/video";

interface Video {
  id: number;
  filename: string;
  original_filename: string;
  status: string;
}

export default function RecentUploads() {
  const [videos, setVideos] = useState<Video[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchVideos = async () => {
      try {
        const data = await getMyVideos();
        setVideos(data);
      } catch (error) {
        console.error("Error fetching videos:", error);
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
      <h2>📂 Recent Uploads</h2>

      {loading ? (
        <p style={{ marginTop: "20px" }}>Loading...</p>
      ) : videos.length === 0 ? (
        <p style={{ marginTop: "20px" }}>
          No videos uploaded yet.
        </p>
      ) : (
        <div style={{ marginTop: "20px" }}>
          {videos.map((video) => (
            <div
              key={video.id}
              style={{
                padding: "12px 0",
                borderBottom: "1px solid #334155",
              }}
            >
              <h4
                style={{
                  margin: 0,
                  color: "#38BDF8",
                }}
              >
                🎥 {video.original_filename}
              </h4>

              <p
                style={{
                  margin: "6px 0 0",
                  color: "#94A3B8",
                }}
              >
                Status: {video.status}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}