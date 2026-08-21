"use client";

import { useAuth } from "@/context/AuthContext";
import Link from "next/link";

export default function UploadWidget() {
  const { user } = useAuth();

  if (!user) return null;

  // Admin View
  if (user.role === "admin") {
    return (
      <div
        style={{
          background: "#1E293B",
          borderRadius: "18px",
          padding: "25px",
          color: "white",
          marginBottom: "25px",
        }}
      >
        <h2>⚡ Quick Actions</h2>

        <div
          style={{
            display: "flex",
            gap: "15px",
            marginTop: "20px",
            flexWrap: "wrap",
          }}
        >
          <Link href="/dashboard/users">
            <button
              style={{
                padding: "12px 20px",
                borderRadius: "10px",
                border: "none",
                cursor: "pointer",
                background: "#2563EB",
                color: "white",
                fontWeight: "bold",
              }}
            >
              👥 Manage Users
            </button>
          </Link>

          <Link href="/dashboard/manage-videos">
            <button
              style={{
                padding: "12px 20px",
                borderRadius: "10px",
                border: "none",
                cursor: "pointer",
                background: "#0EA5E9",
                color: "white",
                fontWeight: "bold",
              }}
            >
              🎥 Manage Videos
            </button>
          </Link>

          <Link href="/dashboard/analytics">
            <button
              style={{
                padding: "12px 20px",
                borderRadius: "10px",
                border: "none",
                cursor: "pointer",
                background: "#22C55E",
                color: "white",
                fontWeight: "bold",
              }}
            >
              📊 View Analytics
            </button>
          </Link>
        </div>
      </div>
    );
  }

if (
  user.role === "creator" ||
  user.role === "educator"
) {
  return (
    <div
      style={{
        background: "#1E293B",
        borderRadius: "18px",
        padding: "25px",
        color: "white",
        marginBottom: "25px",
      }}
    >
      <h2>
        {user.role === "educator"
          ? "📤 Upload Lecture"
          : "📤 Upload Video"}
      </h2>

      <p
        style={{
          color: "#CBD5E1",
          marginTop: "10px",
        }}
      >
        {user.role === "educator"
          ? "Upload lecture videos and let ClipMind AI generate summaries, transcripts and key moments."
          : "Upload a new video and let ClipMind AI generate summaries, transcripts and key moments."}
      </p>

      <Link href="/dashboard/upload">
        <button
          style={{
            marginTop: "20px",
            padding: "14px 28px",
            border: "none",
            borderRadius: "12px",
            background: "#0EA5E9",
            color: "white",
            fontWeight: "bold",
            cursor: "pointer",
            fontSize: "16px",
          }}
        >
          📤{" "}
          {user.role === "educator"
            ? "Upload Lecture"
            : "Upload New Video"}
        </button>
      </Link>
    </div>
  );
}

// Learner does not get an upload widget
return null;  
}