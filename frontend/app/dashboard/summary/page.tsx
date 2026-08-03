"use client";

import { useEffect, useState } from "react";
import { getMyVideos, getSummary } from "@/services/video";

export default function SummaryPage() {
  const [summary, setSummary] = useState("Loading...");
  const [videoName, setVideoName] = useState("");

  useEffect(() => {
    const loadSummary = async () => {
      try {
        console.log("Fetching videos...");

        const videos = await getMyVideos();

        console.log("Videos:", videos);

        if (!videos || videos.length === 0) {
          setSummary("No uploaded videos found.");
          return;
        }

        const latestVideo = videos[0];

        console.log("Latest Video:", latestVideo);

        setVideoName(latestVideo.original_filename);

        const data = await getSummary(latestVideo.id);

        console.log("Summary API:", data);

        setSummary(data.summary || "Summary not available.");
      } catch (error) {
        console.error("Summary Error:", error);
        setSummary("Failed to load summary.");
      }
    };

    loadSummary();
  }, []);

  const downloadSummary = () => {
    const blob = new Blob([summary], {
      type: "text/plain",
    });

    const url = window.URL.createObjectURL(blob);

    const link = document.createElement("a");

    link.href = url;
    link.download = `${videoName || "summary"}.txt`;

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    window.URL.revokeObjectURL(url);
  };

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-6">
        📝 AI Summary
      </h1>

      <div className="bg-white rounded-xl shadow-lg p-6">
        <h2 className="font-semibold text-lg mb-4 text-black">
          {videoName}
        </h2>

        <div className="whitespace-pre-wrap leading-8 text-black">
          {summary}
        </div>

        <div className="mt-6 flex justify-end">
          <button
            onClick={downloadSummary}
            className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg shadow transition"
          >
            ⬇ Download Summary
          </button>
        </div>
      </div>
    </div>
  );
}