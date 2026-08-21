"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { uploadVideo } from "@/services/video";

export default function CreatorUploadPage() {
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const handleUpload = async () => {
    if (!file) {
      setError("Please select a video file.");
      return;
    }

    try {
      setLoading(true);
      setError("");
      setMessage("");
      const result = await uploadVideo(file);
      setMessage(`Video uploaded successfully: ${result.original_filename || result.filename}`);
      setFile(null);
    } catch (err: any) {
      setError(err?.response?.data?.detail || "Video upload failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ color: "white", maxWidth: "800px" }}>
      <h1 style={{ fontSize: "36px", marginBottom: "10px" }}>Upload Video 📤</h1>
      <p style={{ color: "#94A3B8", marginBottom: "30px" }}>Upload content for AI transcription, summaries and insights.</p>

      <div style={{ background: "#1E293B", border: "1px solid #334155", borderRadius: "18px", padding: "30px" }}>
        <input
          type="file"
          accept="video/mp4,video/avi,video/quicktime,video/x-matroska,video/*"
          onChange={(e) => setFile(e.target.files?.[0] || null)}
          style={{ width: "100%", padding: "14px", background: "#0F172A", color: "white", borderRadius: "10px", border: "1px solid #475569", marginBottom: "18px" }}
        />

        {file && <p style={{ color: "#CBD5E1", marginBottom: "18px" }}>Selected: {file.name}</p>}
        {error && <div style={{ background: "#451A1A", color: "#FCA5A5", padding: "14px", borderRadius: "10px", marginBottom: "18px" }}>{error}</div>}
        {message && <div style={{ background: "#064E3B", color: "#A7F3D0", padding: "14px", borderRadius: "10px", marginBottom: "18px" }}>{message}</div>}

        <button
          onClick={handleUpload}
          disabled={loading}
          style={{ width: "100%", padding: "14px", border: "none", borderRadius: "10px", background: loading ? "#475569" : "#2563EB", color: "white", fontWeight: 700, cursor: loading ? "not-allowed" : "pointer" }}
        >
          {loading ? "Processing..." : "Upload Video 🚀"}
        </button>

        <button
          onClick={() => router.push("/dashboard/my-videos")}
          style={{ width: "100%", padding: "12px", marginTop: "12px", borderRadius: "10px", background: "transparent", border: "1px solid #475569", color: "#CBD5E1", cursor: "pointer" }}
        >
          View My Videos
        </button>
      </div>
    </div>
  );
}
