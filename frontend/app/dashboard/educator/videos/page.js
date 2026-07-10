"use client";

import { useEffect, useState } from "react";
import api from "../../../../lib/api";
import { VideoTable } from "../../../../components/video/VideoDashboard";

export default function MyVideosPage() {
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get("/api/v1/videos").then((res) => setVideos(res.data)).finally(() => setLoading(false));
  }, []);

  return (
    <div>
      <h1 className="mb-6 font-display text-xl font-semibold tracking-tight text-ink dark:text-paper">My Videos</h1>
      {loading ? (
        <p className="font-mono text-xs text-ink/50 dark:text-paper/50">Loading...</p>
      ) : videos.length === 0 ? (
        <p className="font-mono text-xs text-ink/50 dark:text-paper/50">No videos uploaded yet.</p>
      ) : (
        <VideoTable videos={videos} />
      )}
    </div>
  );
}