"use client";

import { useState } from "react";
import { uploadVideo } from "@/services/video";

export default function UploadVideo() {
  const [file, setFile] = useState<File | null>(null);
  const [message, setMessage] = useState("");

  const handleUpload = async () => {
    if (!file) {
      setMessage("Please select a video.");
      return;
    }

    
    try {
      await uploadVideo(file);
      setMessage("✅ Video uploaded successfully!");
      setFile(null);
    } catch (error) {
      console.error(error);
      setMessage("❌ Upload failed.");
    }
  };

  return (
    <div
      style={{
        padding: "30px",
        color: "white",
        maxWidth: "700px",
      }}
    >
      <h1>📤 Upload Video</h1>

      <input
  id="videoFile"
  type="file"
  accept="video/*"
  hidden
  onChange={(e) => {
    if (e.target.files && e.target.files.length > 0) {
      setFile(e.target.files[0]);
    }
  }}
/>

<label
  htmlFor="videoFile"
  style={{
    display: "inline-block",
    padding: "12px 20px",
    background: "#2563EB",
    color: "white",
    borderRadius: "8px",
    cursor: "pointer",
    marginTop: "20px",
  }}
>
  📂 Choose Video
</label>

{file && (
  <p style={{ marginTop: "15px", color: "#38BDF8" }}>
    Selected: {file.name}
  </p>
)}

      <br />
      <br />

      <button
        onClick={handleUpload}
        style={{
          padding: "12px 20px",
          border: "none",
          borderRadius: "8px",
          background: "#2563EB",
          color: "white",
          cursor: "pointer",
        }}
      >
        Upload
      </button>

      <p style={{ marginTop: "20px" }}>{message}</p>
    </div>
  );
}