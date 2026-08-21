"use client";

import { useRef, useState } from "react";
import { uploadVideo } from "@/services/video";

export default function UploadCard() {
  const inputRef = useRef<HTMLInputElement>(null);

  const [selectedFile, setSelectedFile] =
    useState<File | null>(null);

  const [loading, setLoading] =
    useState(false);

  const [message, setMessage] =
    useState("");

  const [uploadedVideo, setUploadedVideo] =
useState<{
  filename: string;
  original_filename: string;
} | null>(null);

  const chooseFile = () => {
    inputRef.current?.click();
  };

  const handleFileChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    if (e.target.files?.length) {
      setSelectedFile(e.target.files[0]);
      setMessage("");
    }
  };

  const handleUpload = async () => {
    console.log("UPLOAD BUTTON CLICKED");
    if (!selectedFile) {
      setMessage("Please choose a video.");
      return;
    }
     console.log("Selected File:", selectedFile);
    try {
      setLoading(true);

    const response = await uploadVideo(
    selectedFile
);

setUploadedVideo({
    filename: response.filename,
    original_filename: response.original_filename,
});

setMessage(
    `✅ Uploaded: ${response.original_filename}`
);

setSelectedFile(null);
    } catch (err: any) {
      setMessage(
        err.response?.data?.detail ||
          "Upload failed."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        background: "#1e293b",
        padding: "40px",
        borderRadius: "20px",
        color: "white",
      }}
    >
      <h2>📤 Upload Video</h2>

      <p
        style={{
          color: "#94a3b8",
          marginBottom: "25px",
        }}
      >
        Upload MP4, AVI or MOV videos for AI processing.
      </p>

      <div
        style={{
          border: "2px dashed #38bdf8",
          borderRadius: "20px",
          minHeight: "260px",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          flexDirection: "column",
          padding: "20px",
        }}
      >
        <input
          type="file"
          hidden
          ref={inputRef}
          accept=".mp4,.avi,.mov,.mkv"
          onChange={handleFileChange}
        />

        <h2>📹 Select Video</h2>

        <button
          onClick={chooseFile}
          style={{
            marginTop: "20px",
            padding: "14px 30px",
            borderRadius: "10px",
            border: "none",
            background: "#0ea5e9",
            color: "white",
            cursor: "pointer",
          }}
        >
          Choose Video
        </button>

        {selectedFile && (
          <p
            style={{
              marginTop: "20px",
              color: "#38bdf8",
            }}
          >
            {selectedFile.name}
          </p>
        )}

        <button
          onClick={handleUpload}
          disabled={loading}
          style={{
            marginTop: "20px",
            padding: "14px 30px",
            borderRadius: "10px",
            border: "none",
            background: "#22c55e",
            color: "white",
            cursor: "pointer",
          }}
        >
          {loading
            ? "Uploading..."
            : "Upload Video"}
        </button>

        {message && (
          <p
            style={{
              marginTop: "20px",
              color: "#38bdf8",
            }}
          >
            {message}
          </p>
        )}
        {uploadedVideo && (

  <div
    style={{
      marginTop: "35px",
      width: "100%",
    }}
  >

    <h3
      style={{
        marginBottom: "15px",
        color: "#38bdf8",
      }}
    >
      🎥 Uploaded Video
    </h3>

    <video
      controls
      style={{
        width: "100%",
        borderRadius: "12px",
      }}
    >

      <source
        src={`http://127.0.0.1:8000/videos/stream/${uploadedVideo.filename}`}
        type="video/mp4"
      />

      Your browser does not support the video tag.

    </video>

    <p
      style={{
        marginTop: "10px",
        color: "#cbd5e1",
      }}
    >
      {uploadedVideo.original_filename}
    </p>

  </div>

)}
      </div>
    </div>
  );
}