"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  FaCloudUploadAlt,
  FaVideo,
} from "react-icons/fa";

import DashboardLayout from "@/components/layout/DashboardLayout";
import { uploadVideo } from "@/services/videoService";


export default function UploadPage() {
  const router = useRouter();
  const fileInputRef = useRef(null);

  const [selectedFile, setSelectedFile] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const [uploadedVideo, setUploadedVideo] = useState(null);
  const [isDragging, setIsDragging] = useState(false);


  const selectFile = (file) => {
    if (!file) return;

    if (!file.type.startsWith("video/")) {
      setMessage("Please select a valid video file.");
      return;
    }

    setSelectedFile(file);
    setMessage("");
    setUploadProgress(0);
    setUploadedVideo(null);
  };


  const handleFileChange = (event) => {
    const file = event.target.files?.[0];
    selectFile(file);
  };


  const handleDragOver = (event) => {
    event.preventDefault();
    setIsDragging(true);
  };


  const handleDragLeave = (event) => {
    event.preventDefault();
    setIsDragging(false);
  };


  const handleDrop = (event) => {
    event.preventDefault();
    setIsDragging(false);

    const file = event.dataTransfer.files?.[0];
    selectFile(file);
  };


  const handleUpload = async () => {
    if (!selectedFile) {
      setMessage("Please select a video first.");
      return;
    }

    setLoading(true);
    setMessage("");
    setUploadProgress(0);

    try {
      const response = await uploadVideo(
        selectedFile,
        setUploadProgress
      );

      setUploadedVideo(response.video);

      setMessage(
        response.message ||
        "Video uploaded successfully. AI processing has started."
      );

      setSelectedFile(null);

    } catch (error) {

      if (error.response) {
        setMessage(
          error.response.data.detail || "Upload failed."
        );
      } else {
        setMessage("Unable to connect to the server.");
      }

    } finally {
      setLoading(false);
    }
  };


  const handleOpenWorkspace = () => {
    if (!uploadedVideo?.id) return;

    router.push(
      `/videos/${uploadedVideo.id}`
    );
  };


  const handleUploadAnother = () => {
    setSelectedFile(null);
    setUploadProgress(0);
    setMessage("");
    setUploadedVideo(null);

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };


  return (
    <DashboardLayout>

      <div className="max-w-4xl mx-auto py-8">

        <div className="mb-10">

          <h1 className="text-5xl font-extrabold text-slate-900">
            Upload Video
          </h1>

          <p className="mt-4 text-lg text-slate-500 max-w-2xl">
            Upload your videos securely to ClipMind AI.
            Your video will be processed for AI-powered analysis.
          </p>

        </div>


        <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 p-10">

          {!uploadedVideo && (

            <>
              <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                className={`border-2 border-dashed rounded-3xl p-12 flex flex-col items-center justify-center transition-all duration-300 ${
                  isDragging
                    ? "border-violet-600 bg-violet-50"
                    : "border-violet-300 hover:border-violet-500 hover:bg-violet-50"
                }`}
              >

                <FaCloudUploadAlt className="text-6xl text-violet-500" />

                <h2 className="mt-6 text-2xl font-bold text-slate-800">
                  Drag & Drop Your Video
                </h2>

                <p className="mt-3 text-slate-500 text-center max-w-md">
                  Drag and drop a video file here, or click Browse Videos
                  to choose a video from your device.
                </p>


                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="mt-6 cursor-pointer rounded-xl bg-gradient-to-r from-violet-600 to-purple-700 px-8 py-3 font-semibold text-white shadow-lg transition-all duration-300 hover:from-violet-700 hover:to-purple-800"
                >
                  Browse Videos
                </button>


                <input
                  ref={fileInputRef}
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
                      Uploading Video
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


                  {uploadProgress === 100 && (
                    <p className="mt-3 text-sm text-violet-600">
                      Finalizing your upload...
                    </p>
                  )}

                </div>

              )}


              <button
                onClick={handleUpload}
                disabled={loading || !selectedFile}
                className="mt-8 w-full bg-gradient-to-r from-violet-600 to-purple-700 hover:from-violet-700 hover:to-purple-800 text-white py-4 rounded-2xl text-lg font-bold shadow-xl transition-all duration-300 disabled:opacity-50"
              >
                {loading
                  ? "Uploading..."
                  : "Upload Video"}
              </button>

            </>

          )}


          {message && !uploadedVideo && (

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


          {uploadedVideo && (

            <div className="rounded-2xl border border-green-200 bg-green-50 p-8">

              <div className="flex items-center gap-4">

                <div className="w-14 h-14 rounded-2xl bg-green-100 flex items-center justify-center">
                  <FaVideo className="text-green-600 text-2xl" />
                </div>


                <div>

                  <h2 className="text-2xl font-bold text-green-800">
                    Video uploaded successfully
                  </h2>

                  <p className="mt-1 text-green-700">
                    Your video is now being processed for AI analysis.
                  </p>

                </div>

              </div>


              <div className="mt-6 space-y-2 text-slate-700">

                <p>
                  <span className="font-semibold">
                    Video:
                  </span>{" "}
                  {uploadedVideo.filename}
                </p>

                <p>
                  <span className="font-semibold">
                    Video ID:
                  </span>{" "}
                  {uploadedVideo.id}
                </p>

                <p>
                  <span className="font-semibold">
                    Status:
                  </span>{" "}

                  <span className="font-bold text-amber-600">
                    ⏳ {uploadedVideo.status}
                  </span>
                </p>

              </div>


              <div className="mt-6 rounded-xl bg-white border border-slate-200 p-5">

                <p className="font-semibold text-slate-800">
                  AI processing is in progress
                </p>

                <p className="mt-2 text-sm text-slate-500">
                  Your transcript and AI summaries are being generated
                  in the background. You can continue using ClipMind AI
                  while processing continues.
                </p>

              </div>


              <button
                onClick={handleOpenWorkspace}
                className="mt-6 w-full bg-gradient-to-r from-violet-600 to-purple-700 hover:from-violet-700 hover:to-purple-800 text-white py-4 rounded-2xl text-lg font-bold shadow-xl transition-all duration-300"
              >
                Open Workspace →
              </button>


              <button
                onClick={handleUploadAnother}
                className="mt-5 w-full rounded-2xl border-2 border-violet-300 bg-white py-4 text-lg font-bold text-violet-700 transition-all hover:bg-violet-50"
              >
                Upload Another Video
              </button>

            </div>

          )}

        </div>

      </div>

    </DashboardLayout>
  );
}