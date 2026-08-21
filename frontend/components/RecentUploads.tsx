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
    console.log("RecentUploads mounted");

    const fetchVideos = async () => {
      console.log("Calling getMyVideos..");


      try {
        const data = await getMyVideos();
        console.log("Response:", data);
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
        color: "white",
        padding: "30px",
        borderRadius: "20px",
        marginTop: "30px",
      }}
    >
      <h2>📁 Recent Uploads</h2>

      {loading ? (
        <p style={{ marginTop: "20px" }}>Loading...</p>
      ) : videos.length === 0 ? (
        <p style={{ marginTop: "20px" }}>No videos uploaded yet.</p>
      ) : (
        videos.map((video) => (
          <div
            key={video.id}
            style={{
              marginTop: "15px",
              padding: "15px",
              background: "#334155",
              borderRadius: "10px",
            }}
          >
            <strong>🎥 {video.original_filename}</strong>

            <br />

            <span
              style={{
                color: "#94A3B8",
              }}
            >
              Status: {video.status}
            </span>
          </div>
        ))
      )}
    </div>
  );
}