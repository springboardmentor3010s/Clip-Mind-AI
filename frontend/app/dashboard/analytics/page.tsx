"use client";

import { useEffect, useState } from "react";
import { getVideoStats } from "@/services/video";

interface VideoStats {
  total_videos?: number;
  completed_videos?: number;
  processing_videos?: number;
  failed_videos?: number;
  total_transcripts?: number;
  total_summaries?: number;
}

export default function AnalyticsPage() {
  const [stats, setStats] = useState<VideoStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      setLoading(true);
      setError("");

      const data = await getVideoStats();

      console.log("CREATOR ANALYTICS:", data);

      setStats(data);
    } catch (err: any) {
      console.error("Failed to load analytics:", err);

      setError(
        err?.response?.data?.detail ||
          "Unable to load analytics."
      );
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div
        style={{
          minHeight: "100vh",
          color: "white",
          padding: "20px",
        }}
      >
        <h1
          style={{
            fontSize: "36px",
            fontWeight: "700",
            marginBottom: "10px",
          }}
        >
          Creator Analytics 📊
        </h1>

        <p style={{ color: "#94A3B8", fontSize: "18px" }}>
          Loading analytics...
        </p>
      </div>
    );
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        color: "white",
      }}
    >
      {/* Header */}

      <div style={{ marginBottom: "30px" }}>
        <h1
          style={{
            fontSize: "36px",
            fontWeight: "700",
            marginBottom: "10px",
          }}
        >
          Creator Analytics 📊
        </h1>

        <p
          style={{
            color: "#94A3B8",
            fontSize: "18px",
          }}
        >
          Track your uploaded videos and AI-generated content.
        </p>
      </div>

      {/* Error */}

      {error && (
        <div
          style={{
            marginBottom: "25px",
            padding: "15px",
            borderRadius: "10px",
            background: "#451A1A",
            border: "1px solid #7F1D1D",
            color: "#FCA5A5",
          }}
        >
          {error}
        </div>
      )}

      {/* Statistics */}

      <div
        style={{
          display: "grid",
          gridTemplateColumns:
            "repeat(auto-fit, minmax(220px, 1fr))",
          gap: "20px",
          marginBottom: "30px",
        }}
      >
        <StatCard
          icon="🎥"
          title="Total Videos"
          value={stats?.total_videos ?? 0}
          textColor="#60A5FA"
        />

        <StatCard
          icon="✅"
          title="Completed"
          value={stats?.completed_videos ?? 0}
          textColor="#34D399"
        />

        <StatCard
          icon="⏳"
          title="Processing"
          value={stats?.processing_videos ?? 0}
          textColor="#FBBF24"
        />

        <StatCard
          icon="❌"
          title="Failed"
          value={stats?.failed_videos ?? 0}
          textColor="#F87171"
        />
      </div>

      {/* AI Content */}

      <h2
        style={{
          fontSize: "25px",
          fontWeight: "700",
          marginBottom: "20px",
        }}
      >
        AI Content Generated 🤖
      </h2>

      <div
        style={{
          display: "grid",
          gridTemplateColumns:
            "repeat(auto-fit, minmax(250px, 1fr))",
          gap: "20px",
        }}
      >
        <StatCard
          icon="📝"
          title="Transcripts"
          value={stats?.total_transcripts ?? 0}
          textColor="#A78BFA"
        />

        <StatCard
          icon="🤖"
          title="AI Summaries"
          value={stats?.total_summaries ?? 0}
          textColor="#38BDF8"
        />
      </div>

      {/* Simple Overview */}

      <div
        style={{
          marginTop: "30px",
          background: "#1E293B",
          border: "1px solid #334155",
          borderRadius: "18px",
          padding: "25px",
        }}
      >
        <h2
          style={{
            fontSize: "23px",
            marginBottom: "15px",
          }}
        >
          Platform Overview
        </h2>

        <p
          style={{
            color: "#94A3B8",
            lineHeight: "1.7",
          }}
        >
          You have uploaded{" "}
          <strong style={{ color: "#60A5FA" }}>
            {stats?.total_videos ?? 0}
          </strong>{" "}
          videos.{" "}
          <strong style={{ color: "#34D399" }}>
            {stats?.completed_videos ?? 0}
          </strong>{" "}
          videos have completed processing, while{" "}
          <strong style={{ color: "#FBBF24" }}>
            {stats?.processing_videos ?? 0}
          </strong>{" "}
          are currently processing.
        </p>
      </div>
    </div>
  );
}

function StatCard({
  icon,
  title,
  value,
  textColor,
}: {
  icon: string;
  title: string;
  value: number;
  textColor: string;
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
          color: textColor,
        }}
      >
        {value}
      </p>
    </div>
  );
}