"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getMyVideos } from "@/services/video";

interface Video {
  id: number;
  filename?: string;
  original_filename?: string;
  status?: string;
}

export default function CreatorDashboard() {
  const [videos, setVideos] = useState<Video[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadVideos();
  }, []);

  const loadVideos = async () => {
    try {
      setLoading(true);

      const data = await getMyVideos();

      if (Array.isArray(data)) {
        setVideos(data);
      } else {
        setVideos([]);
      }
    } catch (error) {
      console.error("Failed to load creator videos:", error);
      setVideos([]);
    } finally {
      setLoading(false);
    }
  };

  const completedVideos = videos.filter(
    (video) =>
      video.status?.toLowerCase() === "completed"
  ).length;

  const processingVideos = videos.filter(
    (video) =>
      video.status?.toLowerCase() === "processing"
  ).length;

  return (
    <div
      style={{
        minHeight: "100vh",
        color: "white",
      }}
    >
      {/* Header */}
      <div style={{ marginBottom: "35px" }}>
        <h1
          style={{
            fontSize: "36px",
            fontWeight: "700",
            marginBottom: "10px",
          }}
        >
          Content Creator Dashboard 🎬
        </h1>

        <p
          style={{
            color: "#94A3B8",
            fontSize: "18px",
          }}
        >
          Create, manage and analyze your video content.
        </p>
      </div>

      {/* Statistics */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns:
            "repeat(auto-fit, minmax(220px, 1fr))",
          gap: "20px",
          marginBottom: "35px",
        }}
      >
        <StatCard
          icon="🎥"
          title="Total Videos"
          value={loading ? "..." : videos.length}
          color="#60A5FA"
        />

        <StatCard
          icon="✅"
          title="Completed"
          value={loading ? "..." : completedVideos}
          color="#34D399"
        />

        <StatCard
          icon="⏳"
          title="Processing"
          value={loading ? "..." : processingVideos}
          color="#FBBF24"
        />
      </div>

      {/* Quick Actions */}
      <h2
        style={{
          fontSize: "25px",
          marginBottom: "20px",
        }}
      >
        Quick Actions
      </h2>

      <div
        style={{
          display: "grid",
          gridTemplateColumns:
            "repeat(auto-fit, minmax(260px, 1fr))",
          gap: "20px",
          marginBottom: "35px",
        }}
      >
        <ActionCard
          icon="📤"
          title="Upload Video"
          description="Upload a new video for transcription and AI processing."
          href="/dashboard/upload"
        />

        <ActionCard
          icon="🎥"
          title="My Videos"
          description="View and manage all your uploaded videos."
          href="/dashboard/my-videos"
        />

        <ActionCard
          icon="📊"
          title="Content Analytics"
          description="View analytics and insights about your content."
          href="/dashboard/analytics"
        />
      </div>

      {/* Recent Videos */}
      <h2
        style={{
          fontSize: "25px",
          marginBottom: "20px",
        }}
      >
        Recent Uploads
      </h2>

      <div
        style={{
          background: "#1E293B",
          border: "1px solid #334155",
          borderRadius: "18px",
          padding: "25px",
          overflowX: "auto",
        }}
      >
        {loading ? (
          <p style={{ color: "#94A3B8" }}>
            Loading videos...
          </p>
        ) : videos.length === 0 ? (
          <div>
            <p
              style={{
                color: "#94A3B8",
                marginBottom: "15px",
              }}
            >
              You have not uploaded any videos yet.
            </p>

            <Link
              href="/dashboard/upload"
              style={{
                display: "inline-block",
                padding: "10px 18px",
                borderRadius: "9px",
                background: "#2563EB",
                color: "white",
                textDecoration: "none",
                fontWeight: "600",
              }}
            >
              Upload Your First Video
            </Link>
          </div>
        ) : (
          <table
            style={{
              width: "100%",
              borderCollapse: "collapse",
            }}
          >
            <thead>
              <tr>
                <th style={thStyle}>ID</th>
                <th style={thStyle}>Video</th>
                <th style={thStyle}>Status</th>
              </tr>
            </thead>

            <tbody>
              {videos.slice(0, 10).map((video) => (
                <tr key={video.id}>
                  <td style={tdStyle}>
                    {video.id}
                  </td>

                  <td style={tdStyle}>
                    {video.original_filename ||
                      video.filename ||
                      "Unnamed Video"}
                  </td>

                  <td style={tdStyle}>
                    <span
                      style={{
                        display: "inline-block",
                        padding: "6px 10px",
                        borderRadius: "8px",
                        background:
                          video.status?.toLowerCase() ===
                          "completed"
                            ? "#065F46"
                            : "#334155",
                        color: "white",
                        fontSize: "14px",
                      }}
                    >
                      {video.status || "Uploaded"}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

/* =========================================
   STAT CARD
========================================= */

function StatCard({
  icon,
  title,
  value,
  color,
}: {
  icon: string;
  title: string;
  value: number | string;
  color: string;
}) {
  return (
    <div
      style={{
        background: "#1E293B",
        border: "1px solid #334155",
        borderRadius: "18px",
        padding: "25px",
      }}
    >
      <div
        style={{
          fontSize: "38px",
          marginBottom: "15px",
        }}
      >
        {icon}
      </div>

      <h3
        style={{
          fontSize: "20px",
          marginBottom: "10px",
        }}
      >
        {title}
      </h3>

      <p
        style={{
          fontSize: "32px",
          fontWeight: "700",
          color,
        }}
      >
        {value}
      </p>
    </div>
  );
}

/* =========================================
   ACTION CARD
========================================= */

function ActionCard({
  icon,
  title,
  description,
  href,
}: {
  icon: string;
  title: string;
  description: string;
  href: string;
}) {
  return (
    <Link
      href={href}
      style={{
        textDecoration: "none",
        color: "white",
      }}
    >
      <div
        style={{
          background: "#1E293B",
          border: "1px solid #334155",
          borderRadius: "18px",
          padding: "25px",
          height: "100%",
          boxSizing: "border-box",
        }}
      >
        <div
          style={{
            fontSize: "38px",
            marginBottom: "15px",
          }}
        >
          {icon}
        </div>

        <h3
          style={{
            fontSize: "21px",
            marginBottom: "10px",
          }}
        >
          {title}
        </h3>

        <p
          style={{
            color: "#94A3B8",
            lineHeight: "1.6",
          }}
        >
          {description}
        </p>
      </div>
    </Link>
  );
}

/* =========================================
   TABLE STYLES
========================================= */

const thStyle = {
  textAlign: "left" as const,
  padding: "12px",
  borderBottom: "1px solid #475569",
  color: "#CBD5E1",
};

const tdStyle = {
  padding: "14px 12px",
  borderBottom: "1px solid #334155",
  color: "#E2E8F0",
};