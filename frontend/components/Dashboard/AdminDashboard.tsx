"use client";

import { useEffect, useState } from "react";
import {
  getAdminStats,
  getAdminUsers,
  getAdminVideos,
} from "@/services/admin";

export default function AdminDashboard() {
  const [stats, setStats] = useState<any>(null);
  const [users, setUsers] = useState<any[]>([]);
  const [videos, setVideos] = useState<any[]>([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeFeature, setActiveFeature] = useState("");

  useEffect(() => {
    loadAdminData();
  }, []);

  const loadAdminData = async () => {
    try {
      setLoading(true);
      setError("");

      const [statsData, usersData, videosData] =
        await Promise.all([
          getAdminStats(),
          getAdminUsers(),
          getAdminVideos(),
        ]);

      setStats(statsData);
      setUsers(Array.isArray(usersData) ? usersData : []);
      setVideos(Array.isArray(videosData) ? videosData : []);
    } catch (error: any) {
      console.error("Admin dashboard error:", error);

      setError(
        error?.response?.data?.detail ||
          "Unable to load admin dashboard."
      );
    } finally {
      setLoading(false);
    }
  };

  const getRoleCount = (role: string) => {
    return users.filter((user) => user.role === role).length;
  };

  const handleFeatureClick = (feature: string) => {
    setActiveFeature(feature);

    if (feature === "users") {
      setTimeout(() => {
        document
          .getElementById("recent-users")
          ?.scrollIntoView({
            behavior: "smooth",
            block: "start",
          });
      }, 100);
    }

    if (feature === "activity" || feature === "content") {
      setTimeout(() => {
        document
          .getElementById("uploaded-content")
          ?.scrollIntoView({
            behavior: "smooth",
            block: "start",
          });
      }, 100);
    }

    if (feature === "analytics") {
      window.scrollTo({
        top: 0,
        behavior: "smooth",
      });
    }
  };

  const completedVideos = videos.filter(
    (video) => video.status === "Completed"
  ).length;

  const processingVideos = videos.filter(
    (video) => video.status === "Processing"
  ).length;

  const failedVideos = videos.filter(
    (video) => video.status === "Failed"
  ).length;

  return (
    <div
      style={{
        minHeight: "100vh",
        color: "white",
        paddingBottom: "50px",
      }}
    >
      {/* HEADER */}
      <div style={headerStyle}>
        <h1 style={mainTitleStyle}>
          Administrator Dashboard 🛠️
        </h1>

        <p style={subtitleStyle}>
          Manage users, content, platform activity and system
          performance.
        </p>
      </div>

      {/* ERROR */}
      {error && (
        <div style={errorStyle}>
          {error}
        </div>
      )}

      {/* PLATFORM OVERVIEW */}
      <h2 style={sectionTitleStyle}>
        Platform Overview
      </h2>

      <div style={statsGridStyle}>
        {/* TOTAL USERS */}
        <div style={statCardStyle}>
          <div style={iconStyle}>👥</div>

          <h3 style={cardTitleStyle}>
            Total Users
          </h3>

          <p
            style={{
              ...statNumberStyle,
              color: "#60A5FA",
            }}
          >
            {loading
              ? "..."
              : stats?.total_users ?? users.length}
          </p>
        </div>

        {/* EDUCATORS */}
        <div style={statCardStyle}>
          <div style={iconStyle}>👨‍🏫</div>

          <h3 style={cardTitleStyle}>
            Educators
          </h3>

          <p
            style={{
              ...statNumberStyle,
              color: "#A78BFA",
            }}
          >
            {loading
              ? "..."
              : stats?.educators ?? getRoleCount("educator")}
          </p>
        </div>

        {/* LEARNERS */}
        <div style={statCardStyle}>
          <div style={iconStyle}>🎓</div>

          <h3 style={cardTitleStyle}>
            Learners
          </h3>

          <p
            style={{
              ...statNumberStyle,
              color: "#34D399",
            }}
          >
            {loading
              ? "..."
              : stats?.learners ?? getRoleCount("learner")}
          </p>
        </div>

        {/* VIDEOS */}
        <div style={statCardStyle}>
          <div style={iconStyle}>🎥</div>

          <h3 style={cardTitleStyle}>
            Uploaded Videos
          </h3>

          <p
            style={{
              ...statNumberStyle,
              color: "#FBBF24",
            }}
          >
            {loading
              ? "..."
              : stats?.total_videos ?? videos.length}
          </p>
        </div>
      </div>

      {/* ADMINISTRATION */}
      <h2 style={sectionTitleStyle}>
        Administration
      </h2>

      <div style={featureGridStyle}>

        {/* MANAGE USERS */}
        <button
          type="button"
          onClick={() => handleFeatureClick("users")}
          style={featureCardStyle}
        >
          <div style={featureIconStyle}>👥</div>

          <h3 style={featureTitleStyle}>
            Manage Users & Roles
          </h3>

          <p style={featureTextStyle}>
            View registered users and monitor their assigned
            roles.
          </p>
        </button>

        {/* PLATFORM ACTIVITY */}
        <button
          type="button"
          onClick={() => handleFeatureClick("activity")}
          style={featureCardStyle}
        >
          <div style={featureIconStyle}>📊</div>

          <h3 style={featureTitleStyle}>
            Monitor Platform Activity
          </h3>

          <p style={featureTextStyle}>
            Monitor users, uploaded videos and overall platform
            activity.
          </p>
        </button>

        {/* UPLOADED CONTENT */}
        <button
          type="button"
          onClick={() => handleFeatureClick("content")}
          style={featureCardStyle}
        >
          <div style={featureIconStyle}>🎬</div>

          <h3 style={featureTitleStyle}>
            Manage Uploaded Content
          </h3>

          <p style={featureTextStyle}>
            Review uploaded lecture videos and their processing
            status.
          </p>
        </button>

        {/* ANALYTICS */}
        <button
          type="button"
          onClick={() => handleFeatureClick("analytics")}
          style={featureCardStyle}
        >
          <div style={featureIconStyle}>📈</div>

          <h3 style={featureTitleStyle}>
            System Analytics
          </h3>

          <p style={featureTextStyle}>
            View user, content and platform statistics.
          </p>
        </button>

        {/* SETTINGS */}
        <button
          type="button"
          onClick={() => setActiveFeature("settings")}
          style={featureCardStyle}
        >
          <div style={featureIconStyle}>⚙️</div>

          <h3 style={featureTitleStyle}>
            Platform Settings
          </h3>

          <p style={featureTextStyle}>
            Configure and monitor important platform settings.
          </p>
        </button>

        {/* AI JOBS */}
        <button
          type="button"
          onClick={() => setActiveFeature("ai")}
          style={featureCardStyle}
        >
          <div style={featureIconStyle}>🤖</div>

          <h3 style={featureTitleStyle}>
            AI Processing Jobs
          </h3>

          <p style={featureTextStyle}>
            Monitor video processing, transcription and AI
            summary jobs.
          </p>
        </button>

        {/* STORAGE */}
        <button
          type="button"
          onClick={() => setActiveFeature("storage")}
          style={featureCardStyle}
        >
          <div style={featureIconStyle}>💾</div>

          <h3 style={featureTitleStyle}>
            Storage & Resources
          </h3>

          <p style={featureTextStyle}>
            Monitor uploaded content and available system
            resources.
          </p>
        </button>

        {/* AUDIT LOGS */}
        <button
          type="button"
          onClick={() => setActiveFeature("audit")}
          style={featureCardStyle}
        >
          <div style={featureIconStyle}>📋</div>

          <h3 style={featureTitleStyle}>
            Audit Logs & Reports
          </h3>

          <p style={featureTextStyle}>
            Review platform activity and administrative reports.
          </p>
        </button>
      </div>

      {/* ACTIVE FEATURE PANEL */}
      {activeFeature && (
        <div style={featurePanelStyle}>
          <div style={featurePanelHeaderStyle}>
            <h2 style={{ fontSize: "25px", margin: 0 }}>
              {activeFeature === "settings" &&
                "⚙️ Platform Settings"}

              {activeFeature === "ai" &&
                "🤖 AI Processing Jobs"}

              {activeFeature === "storage" &&
                "💾 Storage & Resources"}

              {activeFeature === "audit" &&
                "📋 Audit Logs & Reports"}
            </h2>

            <button
              type="button"
              onClick={() => setActiveFeature("")}
              style={closeButtonStyle}
            >
              ✕
            </button>
          </div>

          {/* SETTINGS */}
          {activeFeature === "settings" && (
            <div>
              <p style={featurePanelTextStyle}>
                Configure and monitor important platform settings.
              </p>

              <div style={statusBoxStyle}>
                <strong>Platform Status:</strong>{" "}
                <span style={{ color: "#34D399" }}>
                  Active
                </span>
              </div>

              <div style={statusBoxStyle}>
                <strong>API Status:</strong>{" "}
                <span style={{ color: "#34D399" }}>
                  Connected
                </span>
              </div>

              <div style={statusBoxStyle}>
                <strong>Database:</strong>{" "}
                <span style={{ color: "#34D399" }}>
                  Connected
                </span>
              </div>
            </div>
          )}

          {/* AI PROCESSING */}
          {activeFeature === "ai" && (
            <div>
              <p style={featurePanelTextStyle}>
                Monitor video processing, transcription and AI
                summary jobs.
              </p>

              <div style={statusBoxStyle}>
                <strong>Total Videos:</strong>{" "}
                {stats?.total_videos ?? videos.length}
              </div>

              <div style={statusBoxStyle}>
                <strong>Completed:</strong>{" "}
                {completedVideos}
              </div>

              <div style={statusBoxStyle}>
                <strong>Processing:</strong>{" "}
                {processingVideos}
              </div>

              <div style={statusBoxStyle}>
                <strong>Failed:</strong>{" "}
                {failedVideos}
              </div>
            </div>
          )}

          {/* STORAGE */}
          {activeFeature === "storage" && (
            <div>
              <p style={featurePanelTextStyle}>
                Monitor uploaded content and available system
                resources.
              </p>

              <div style={statusBoxStyle}>
                <strong>Uploaded Videos:</strong>{" "}
                {videos.length}
              </div>

              <div style={statusBoxStyle}>
                <strong>Storage Status:</strong>{" "}
                <span style={{ color: "#34D399" }}>
                  Available
                </span>
              </div>

              <div style={statusBoxStyle}>
                <strong>Content Monitoring:</strong>{" "}
                Active
              </div>
            </div>
          )}

          {/* AUDIT LOGS */}
          {activeFeature === "audit" && (
            <div>
              <p style={featurePanelTextStyle}>
                Review platform activity and administrative
                reports.
              </p>

              <div style={statusBoxStyle}>
                <strong>Registered Users:</strong>{" "}
                {users.length}
              </div>

              <div style={statusBoxStyle}>
                <strong>Uploaded Videos:</strong>{" "}
                {videos.length}
              </div>

              <div style={statusBoxStyle}>
                <strong>Platform Activity:</strong>{" "}
                <span style={{ color: "#34D399" }}>
                  Active
                </span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* PART 2 CONTINUES */}
            {/* RECENT USERS */}
      <h2
        id="recent-users"
        style={sectionTitleStyle}
      >
        Recent Users
      </h2>

      <div style={tableContainerStyle}>
        {loading ? (
          <p style={mutedTextStyle}>
            Loading users...
          </p>
        ) : users.length === 0 ? (
          <p style={mutedTextStyle}>
            No users found.
          </p>
        ) : (
          <table style={tableStyle}>
            <thead>
              <tr>
                <th style={thStyle}>ID</th>
                <th style={thStyle}>Username</th>
                <th style={thStyle}>Email</th>
                <th style={thStyle}>Role</th>
              </tr>
            </thead>

            <tbody>
              {users.slice(0, 10).map((user) => (
                <tr key={user.id}>
                  <td style={tdStyle}>
                    {user.id}
                  </td>

                  <td style={tdStyle}>
                    {user.username}
                  </td>

                  <td style={tdStyle}>
                    {user.email}
                  </td>

                  <td style={tdStyle}>
                    <span style={roleBadgeStyle}>
                      {user.role}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* UPLOADED CONTENT */}
      <h2
        id="uploaded-content"
        style={sectionTitleStyle}
      >
        Uploaded Content
      </h2>

      <div style={tableContainerStyle}>
        {loading ? (
          <p style={mutedTextStyle}>
            Loading content...
          </p>
        ) : videos.length === 0 ? (
          <p style={mutedTextStyle}>
            No uploaded videos found.
          </p>
        ) : (
          <table style={tableStyle}>
            <thead>
              <tr>
                <th style={thStyle}>ID</th>
                <th style={thStyle}>File</th>
                <th style={thStyle}>Original Name</th>
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
                    {video.filename}
                  </td>

                  <td style={tdStyle}>
                    {video.original_filename}
                  </td>

                  <td style={tdStyle}>
                    <span
                      style={{
                        ...statusBadgeStyle,
                        ...(video.status === "Completed"
                          ? {
                              background: "#064E3B",
                              color: "#6EE7B7",
                            }
                          : video.status === "Failed"
                          ? {
                              background: "#451A1A",
                              color: "#FCA5A5",
                            }
                          : {
                              background: "#3F3210",
                              color: "#FCD34D",
                            }),
                      }}
                    >
                      {video.status}
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

/* =========================================================
   STYLES
   ========================================================= */

const headerStyle = {
  marginBottom: "35px",
};

const mainTitleStyle = {
  fontSize: "36px",
  fontWeight: "700",
  marginBottom: "10px",
};

const subtitleStyle = {
  color: "#94A3B8",
  fontSize: "18px",
};

const sectionTitleStyle = {
  fontSize: "25px",
  marginBottom: "20px",
};

const errorStyle = {
  marginBottom: "25px",
  padding: "16px",
  borderRadius: "10px",
  background: "#451A1A",
  border: "1px solid #7F1D1D",
  color: "#FCA5A5",
};

const statsGridStyle = {
  display: "grid",
  gridTemplateColumns:
    "repeat(auto-fit, minmax(220px, 1fr))",
  gap: "20px",
  marginBottom: "35px",
};

const statCardStyle = {
  background: "#1E293B",
  border: "1px solid #334155",
  borderRadius: "18px",
  padding: "25px",
};

const iconStyle = {
  fontSize: "38px",
  marginBottom: "15px",
};

const cardTitleStyle = {
  fontSize: "21px",
  marginBottom: "8px",
};

const statNumberStyle = {
  fontSize: "30px",
  fontWeight: "700",
};

const featureGridStyle = {
  display: "grid",
  gridTemplateColumns:
    "repeat(auto-fit, minmax(280px, 1fr))",
  gap: "20px",
  marginBottom: "35px",
};

const featureCardStyle = {
  background: "#1E293B",
  border: "1px solid #334155",
  borderRadius: "18px",
  padding: "25px",
  textAlign: "left" as const,
  color: "white",
  cursor: "pointer",
  minHeight: "190px",
  transition: "all 0.2s ease",
};

const featureIconStyle = {
  fontSize: "38px",
  marginBottom: "15px",
};

const featureTitleStyle = {
  fontSize: "21px",
  marginBottom: "10px",
};

const featureTextStyle = {
  color: "#94A3B8",
  lineHeight: "1.6",
};

const featurePanelStyle = {
  background: "#1E293B",
  border: "1px solid #334155",
  borderRadius: "18px",
  padding: "25px",
  marginBottom: "35px",
};

const featurePanelHeaderStyle = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  marginBottom: "20px",
};

const closeButtonStyle = {
  background: "#334155",
  color: "white",
  border: "none",
  borderRadius: "8px",
  padding: "8px 14px",
  cursor: "pointer",
  fontSize: "16px",
};

const featurePanelTextStyle = {
  color: "#94A3B8",
  fontSize: "17px",
  marginBottom: "20px",
};

const statusBoxStyle = {
  background: "#25344D",
  border: "1px solid #334155",
  borderRadius: "10px",
  padding: "15px",
  marginBottom: "10px",
  color: "#E2E8F0",
};

const tableContainerStyle = {
  background: "#1E293B",
  border: "1px solid #334155",
  borderRadius: "18px",
  padding: "25px",
  marginBottom: "35px",
  overflowX: "auto" as const,
};

const tableStyle = {
  width: "100%",
  borderCollapse: "collapse" as const,
};

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

const mutedTextStyle = {
  color: "#94A3B8",
};

const roleBadgeStyle = {
  padding: "6px 10px",
  borderRadius: "8px",
  background: "#334155",
  color: "#E2E8F0",
};

const statusBadgeStyle = {
  padding: "6px 10px",
  borderRadius: "8px",
};