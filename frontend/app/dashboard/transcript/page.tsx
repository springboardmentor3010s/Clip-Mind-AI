"use client";

import { useEffect, useState } from "react";
import { getMyVideos, getTranscript } from "@/services/video";

export default function TranscriptPage() {
  const [transcript, setTranscript] = useState("Loading...");
  const [videoName, setVideoName] = useState("");

  useEffect(() => {
  const loadTranscript = async () => {
    try {
      console.log("Fetching videos...");

      const videos = await getMyVideos();

      console.log("Videos:", videos);

      if (!videos || videos.length === 0) {
        setTranscript("No uploaded videos found.");
        return;
      }

      const latestVideo = videos[0];

      console.log("Latest Video:", latestVideo);

      setVideoName(latestVideo.original_filename);

      const data = await getTranscript(latestVideo.id);

      console.log("Transcript API:", data);

      setTranscript(data.transcript || "Transcript not available.");
    } catch (error) {
      console.error("Transcript Error:", error);
      setTranscript("Failed to load transcript.");
    }
  };

  loadTranscript();
}, []);

const downloadTranscript = () => {
  const blob = new Blob([transcript], { type: "text/plain" });

  const url = window.URL.createObjectURL(blob);

  const link = document.createElement("a");

  link.href = url;
  link.download = `${videoName || "transcript"}.txt`;

  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  window.URL.revokeObjectURL(url);
};
  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-6">
  📝 Transcript
</h1>

<div className="bg-white rounded-xl shadow-lg p-6">

  <h2 className="font-semibold text-lg mb-4 text-black">
    {videoName}
  </h2>

  <div className="whitespace-pre-wrap leading-8 text-black">
    {transcript}
  </div>

  <div className="mt-6 flex justify-end">
    <button
      onClick={downloadTranscript}
      className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg shadow transition"
    >
      ⬇ Download Transcript
    </button>
  </div>

</div>



 </div>
    
  );
}
