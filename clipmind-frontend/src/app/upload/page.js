"use client";

import { useState } from "react";
import {
  FaCloudUploadAlt,
  FaVideo,
} from "react-icons/fa";
import DashboardLayout from "@/components/layout/DashboardLayout";
import {
  uploadVideo,
  getTranscript,
  getSummary,
} from "@/services/videoService";

export default function UploadPage() {
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const [videoId, setVideoId] = useState(null);
  const [transcript, setTranscript] = useState("");
  const [transcriptLoading, setTranscriptLoading] = useState(false);  

  const [summary, setSummary] = useState("");
  const [summaryType, setSummaryType] = useState("short");
  const [summaryLoading, setSummaryLoading] = useState(false);
  const [activeTab, setActiveTab] = useState(null);

  const handleFileChange = (e) => {
    if (e.target.files.length > 0) {
      setSelectedFile(e.target.files[0]);
      setMessage("");
      setUploadProgress(0);
    }
  };

  const fetchTranscript = async (id) => {
  try {
    console.log("Fetching transcript for video:", id);

    setTranscriptLoading(true);

    const data = await getTranscript(id);

    console.log("Transcript Response:", data);

    setTranscript(data.transcript_text);

  } catch (error) {

    console.error("Transcript Error:", error);

    if (error.response) {
      console.log("Status:", error.response.status);
      console.log("Response:", error.response.data);
    }

    setMessage("Failed to fetch transcript.");

  } finally {
    setTranscriptLoading(false);
  }
};

const fetchSummary = async (id, type = "short") => {
  try {
    console.log(`Fetching ${type} summary for video:`, id);

    setSummaryLoading(true);

    const data = await getSummary(id, type);

    console.log("Summary Response:", data);

    setSummary(data.summary_text);

    setSummaryType(type);

  } catch (error) {

    console.error("Summary Error:", error);

    if (error.response) {
      console.log("Status:", error.response.status);
      console.log("Response:", error.response.data);
    }

    setMessage(`Failed to fetch ${type} summary.`);

  } finally {
    setSummaryLoading(false);
  }
};


  const handleUpload = async () => {
    if (!selectedFile) {
      setMessage("Please select a video first.");
      return;
    }

    setLoading(true);
    setMessage("");

    try {
      const response = await uploadVideo(
        selectedFile,
        setUploadProgress
      );

      setMessage(response.message || "Video uploaded successfully.");

      if (response.video && response.video.id) {
    setVideoId(response.video.id);

}
      setSelectedFile(null);

      setUploadProgress(100);

    } catch (error) {

      if (error.response) {
        setMessage(error.response.data.detail || "Upload failed.");
      } else {
        setMessage("Unable to connect to the server.");


        


      }

    } finally {

      setLoading(false);

    }
  };

  return (
    <DashboardLayout>

      <div className="max-w-4xl mx-auto py-8">

        <div className="w-full max-w-4xl">
          
        </div>
        <div className="mb-10">

  <h1 className="text-5xl font-extrabold text-slate-900">

    Upload Video

  </h1>

  <p className="mt-4 text-lg text-slate-500 max-w-2xl">

     Upload your videos securely to ClipMind AI.
    Your uploads will be stored and prepared for AI-powered
    processing in upcoming milestones.

  </p>

</div>

        <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 p-10">
          <div className="border-2 border-dashed border-violet-300 rounded-3xl p-12 flex flex-col items-center justify-center hover:border-violet-500 hover:bg-violet-50 transition-all duration-300">

  <FaCloudUploadAlt className="text-6xl text-violet-500" />

  <h2 className="mt-6 text-2xl font-bold text-slate-800">
    Select a Video to Upload
  </h2>

  <p className="mt-3 text-slate-500 text-center max-w-md">
    Click the button below to browse and choose a video from your device.
  </p>

  <label
    htmlFor="videoUpload"
    className="mt-6 cursor-pointer rounded-xl bg-gradient-to-r from-violet-600 to-purple-700 px-8 py-3 font-semibold text-white shadow-lg transition-all duration-300 hover:from-violet-700 hover:to-purple-800"
  >
    Browse Videos
  </label>

  <input
    id="videoUpload"
    type="file"
    accept="video/*"
    onChange={handleFileChange}
    className="hidden"
  />

</div>

          {selectedFile && (

  <div className="mt-8 bg-slate-50 border border-slate-200 rounded-2xl p-6">

    <div className="flex items-center gap-5">

      <div className="w-14 h-14 rounded-2xl bg-violet-100 flex items-center justify-center">

        <FaVideo className="text-violet-600 text-2xl" />

      </div>

      <div>

        <p className="text-sm text-slate-500">

          Selected Video

        </p>

        <p className="font-bold text-slate-800">

          {selectedFile.name}

        </p>

        <p className="text-sm text-slate-500 mt-1">

          {(selectedFile.size / 1024 / 1024).toFixed(2)} MB

        </p>

      </div>

    </div>

  </div>

)}

          {loading && (

  <div className="mt-8">

    <div className="flex justify-between mb-2">

      <span className="font-semibold text-slate-700">

        Upload Progress

      </span>

      <span className="text-violet-600 font-bold">

        {uploadProgress}%

      </span>

    </div>

    <div className="w-full bg-slate-200 rounded-full h-4 overflow-hidden">

      <div
        className="bg-gradient-to-r from-violet-500 to-purple-700 h-4 transition-all duration-300"
        style={{
          width: `${uploadProgress}%`,
        }}
      />

    </div>

  </div>

)}

          <button
  onClick={handleUpload}
  disabled={loading}
  className="mt-8 w-full bg-gradient-to-r from-violet-600 to-purple-700 hover:from-violet-700 hover:to-purple-800 text-white py-4 rounded-2xl text-lg font-bold shadow-xl transition-all duration-300 disabled:opacity-50"
>
  {loading ? "Uploading Video..." : "Upload Video"}
</button>

          {message && (
            <p
              className={`mt-6 ${
                message.toLowerCase().includes("success")
                  ? "text-green-600"
                  : "text-red-600"
              }`}
            >
              {message}
            </p>
          )}

          {videoId && (
  <div className="mt-4 rounded-xl bg-green-50 border border-green-200 p-4">
    <p className="text-green-700 font-semibold">
      Uploaded Video ID: {videoId}
    </p>
  </div>
)}


{videoId && (
  <div className="mt-6 flex gap-4">

    <button
  onClick={async () => {
    console.log("========== Transcript Button ==========");
    console.log("Current videoId:", videoId);

    setActiveTab("transcript");

    await fetchTranscript(videoId);
  }}
  className="px-5 py-2 rounded-xl bg-violet-600 text-white hover:bg-violet-700"
>
  Transcript
</button>

    <button
  onClick={async () => {
    console.log("========== Short Summary ==========");
    console.log("Current videoId:", videoId);

    setActiveTab("short");

    await fetchSummary(videoId, "short");
  }}
  className="px-5 py-2 rounded-xl bg-violet-600 text-white hover:bg-violet-700"
>
  Short Summary
</button>


    <button
  onClick={async () => {
    console.log("========== Detailed Summary ==========");
    console.log("Current videoId:", videoId);

    setActiveTab("detailed");

    await fetchSummary(videoId, "detailed");
  }}
  className="px-5 py-2 rounded-xl bg-violet-600 text-white hover:bg-violet-700"
>
  Detailed Summary
</button>

  </div>
)}

{transcriptLoading && (
  <div className="mt-6 p-4 rounded-xl bg-blue-50 border border-blue-200">
    <p className="text-blue-700 font-medium">
      Fetching transcript...
    </p>
  </div>
)}

{activeTab === "transcript" &&  transcript && (
  <div className="mt-6 rounded-2xl border border-slate-200 bg-slate-50 p-6">
    <h2 className="text-xl font-bold text-slate-800 mb-4">
      Transcript
    </h2>

    <p className="whitespace-pre-wrap text-slate-700 leading-7">
      {transcript}
    </p>
  </div>
)}

{summaryLoading && (
  <div className="mt-6 p-4 rounded-xl bg-yellow-50 border border-yellow-200">
    <p className="text-yellow-700 font-medium">
      Generating summary...
    </p>
  </div>
)}

{(activeTab === "short" || activeTab === "detailed") && summary && (
  <div className="mt-6 rounded-2xl border border-slate-200 bg-slate-50 p-6">

    <h2 className="text-xl font-bold text-slate-800 mb-4">
      AI Summary
    </h2>

    <p className="text-sm text-slate-500 mb-3">
      {summaryType === "short"
        ? "Short Summary"
        : "Detailed Summary"}
    </p>

    <p className="whitespace-pre-wrap text-slate-700 leading-7">
      {summary}
    </p>

  </div>
)}

            
        </div>

      </div>

    </DashboardLayout>
  );
}