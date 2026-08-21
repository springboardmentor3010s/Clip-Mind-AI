"use client";

import { useEffect, useState } from "react";
import { getAdminStats } from "@/services/admin";

interface AdminStats {
  total_users: number;
  educators: number;
  learners: number;
  content_creators: number;
  admins: number;
  total_videos: number;
}

export default function AdminAnalyticsPage() {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      setLoading(true);
      setError("");

      const data = await getAdminStats();

      setStats(data);
    } catch (err: any) {
      console.error("Admin analytics error:", err);

      setError(
        err?.response?.data?.detail ||
          "Unable to load system analytics."
      );
    } finally {
      setLoading(false);
    }
  };

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
          System Analytics 📊
        </h1>

        <p
          style={{
            color: "#94A3B8",
            fontSize: "18px",
          }}
        >
          Overview of users, roles and uploaded content.
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
        }}
      >
        {/* Total Users */}
        <StatCard
          icon="👥"
          title="Total Users"
          value={
            loading
              ? "..."
              : stats?.total_users ?? 0
          }
          color="#60A5FA"
        />

        {/* Admins */}
        <StatCard
          icon="🛠️"
          title="Administrators"
          value={
            loading
              ? "..."
              : stats?.admins ?? 0
          }
          color="#C084FC"
        />

        {/* Educators */}
        <StatCard
          icon="👨‍🏫"
          title="Educators"
          value={
            loading
              ? "..."
              : stats?.educators ?? 0
          }
          color="#A78BFA"
        />

        {/* Learners */}
        <StatCard
          icon="🎓"
          title="Learners"
          value={
            loading
              ? "..."
              : stats?.learners ?? 0
          }
          color="#34D399"
        />

        {/* Creators */}
        <StatCard
          icon="🎬"
          title="Content Creators"
          value={
            loading
              ? "..."
              : stats?.content_creators ?? 0
          }
          color="#F472B6"
        />

        {/* Videos */}
        <StatCard
          icon="🎥"
          title="Uploaded Videos"
          value={
            loading
              ? "..."
              : stats?.total_videos ?? 0
          }
          color="#FBBF24"
        />
      </div>

      {/* Simple Summary */}
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
            fontSize: "24px",
            marginBottom: "15px",
          }}
        >
          Platform Summary
        </h2>

        <p
          style={{
            color: "#94A3B8",
            fontSize: "16px",
            lineHeight: "1.7",
          }}
        >
          The system currently has{" "}
          <strong style={{ color: "white" }}>
            {loading ? "..." : stats?.total_users ?? 0}
          </strong>{" "}
          registered users and{" "}
          <strong style={{ color: "white" }}>
            {loading ? "..." : stats?.total_videos ?? 0}
          </strong>{" "}
          uploaded videos.
        </p>

        <div
          style={{
            display: "flex",
            gap: "30px",
            flexWrap: "wrap",
            marginTop: "20px",
          }}
        >
          <SummaryItem
            label="Administrators"
            value={
              loading ? "..." : stats?.admins ?? 0
            }
          />

          <SummaryItem
            label="Educators"
            value={
              loading ? "..." : stats?.educators ?? 0
            }
          />

          <SummaryItem
            label="Learners"
            value={
              loading ? "..." : stats?.learners ?? 0
            }
          />

          <SummaryItem
            label="Creators"
            value={
              loading
                ? "..."
                : stats?.content_creators ?? 0
            }
          />
        </div>
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
   SUMMARY ITEM
========================================= */

function SummaryItem({
  label,
  value,
}: {
  label: string;
  value: number | string;
}) {
  return (
    <div>
      <p
        style={{
          color: "#94A3B8",
          marginBottom: "5px",
        }}
      >
        {label}
      </p>

      <p
        style={{
          fontSize: "24px",
          fontWeight: "700",
        }}
      >
        {value}
      </p>
    </div>
  );
}