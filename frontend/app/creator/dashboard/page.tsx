"use client";

import DashboardLayout from "@/components/Dashboard/DashboardLayout";

export default function CreatorDashboard() {
  return (
    <DashboardLayout allowedRoles={["creator"]}>
      <div
        style={{
          color: "white",
          minHeight: "100vh",
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
            marginBottom: "40px",
          }}
        >
          <div style={cardStyle}>
            <div style={iconStyle}>🎥</div>

            <h2 style={titleStyle}>
              My Videos
            </h2>

            <p style={descriptionStyle}>
              Manage all your uploaded videos.
            </p>
          </div>

          <div style={cardStyle}>
            <div style={iconStyle}>📝</div>

            <h2 style={titleStyle}>
              Transcripts
            </h2>

            <p style={descriptionStyle}>
              Generate and manage video transcripts.
            </p>
          </div>

          <div style={cardStyle}>
            <div style={iconStyle}>🤖</div>

            <h2 style={titleStyle}>
              AI Summaries
            </h2>

            <p style={descriptionStyle}>
              Generate AI-powered summaries.
            </p>
          </div>

          <div style={cardStyle}>
            <div style={iconStyle}>📊</div>

            <h2 style={titleStyle}>
              Analytics
            </h2>

            <p style={descriptionStyle}>
              View performance and content analytics.
            </p>
          </div>
        </div>

        {/* Quick Actions */}
        <h2
          style={{
            fontSize: "26px",
            fontWeight: "600",
            marginBottom: "20px",
          }}
        >
          Quick Actions
        </h2>

        <div
          style={{
            display: "grid",
            gridTemplateColumns:
              "repeat(auto-fit, minmax(220px, 1fr))",
            gap: "20px",
          }}
        >
          <a
            href="/creator/dashboard/upload"
            style={actionStyle}
          >
            <span style={{ fontSize: "30px" }}>
              📤
            </span>

            <span>
              Upload Video
            </span>
          </a>

          <a
            href="/dashboard/my-videos"
            style={actionStyle}
          >
            <span style={{ fontSize: "30px" }}>
              🎥
            </span>

            <span>
              My Videos
            </span>
          </a>

          <a
            href="/dashboard/analytics"
            style={actionStyle}
          >
            <span style={{ fontSize: "30px" }}>
              📊
            </span>

            <span>
              View Analytics
            </span>
          </a>
        </div>
      </div>
    </DashboardLayout>
  );
}

const cardStyle = {
  background: "#1E293B",
  border: "1px solid #334155",
  borderRadius: "18px",
  padding: "25px",
  minHeight: "170px",
};

const iconStyle = {
  fontSize: "35px",
  marginBottom: "20px",
};

const titleStyle = {
  fontSize: "22px",
  fontWeight: "600",
  marginBottom: "10px",
};

const descriptionStyle = {
  color: "#94A3B8",
  fontSize: "16px",
  lineHeight: "1.5",
};

const actionStyle = {
  background: "#1E293B",
  border: "1px solid #334155",
  borderRadius: "15px",
  padding: "22px",
  color: "white",
  textDecoration: "none",
  display: "flex",
  alignItems: "center",
  gap: "15px",
  fontSize: "18px",
  fontWeight: "600",
};