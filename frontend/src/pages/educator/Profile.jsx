import React from "react";
import { useNavigate } from "react-router-dom";

function Profile() {
  const navigate = useNavigate();

  const userName =
    localStorage.getItem("userName") ||
    "ClipMind Educator";

  const userEmail =
    localStorage.getItem("userEmail") ||
    "Not available";

  const role =
    localStorage.getItem("role") ||
    "educator";

  return (
    <div style={styles.page}>
      <div style={styles.header}>
        <div>
          <h1>👤 Educator Profile</h1>

          <p>
            Manage your ClipMind AI educator
            profile.
          </p>
        </div>

        <button
          style={styles.back}
          onClick={() => navigate("/educator")}
        >
          ← Dashboard
        </button>
      </div>

      <div style={styles.profileCard}>
        <div style={styles.avatar}>
          {userName
            .charAt(0)
            .toUpperCase()}
        </div>

        <h2>{userName}</h2>

        <span style={styles.role}>
          👨‍🏫 Educator
        </span>

        <div style={styles.info}>
          <div>
            <label>Name</label>
            <strong>{userName}</strong>
          </div>

          <div>
            <label>Email</label>
            <strong>{userEmail}</strong>
          </div>

          <div>
            <label>Role</label>
            <strong>
              {role.charAt(0).toUpperCase() +
                role.slice(1)}
            </strong>
          </div>

          <div>
            <label>Platform</label>
            <strong>ClipMind AI</strong>
          </div>
        </div>
      </div>

      <div style={styles.section}>
        <h2>🧠 Educator Capabilities</h2>

        <div style={styles.capabilities}>
          <div>🎬 Lecture Management</div>
          <div>📝 AI Transcripts</div>
          <div>✨ AI Summaries</div>
          <div>🎯 Key Moments</div>
          <div>📊 Analytics</div>
          <div>📑 Reports</div>
          <div>💡 Content Insights</div>
          <div>👥 Student Engagement</div>
        </div>
      </div>
    </div>
  );
}

const styles = {
  page: {
    padding: "30px",
    background: "#f7f8fc",
    minHeight: "100vh",
  },

  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "30px",
  },

  back: {
    padding: "11px 18px",
    border: "none",
    borderRadius: "8px",
    background: "#111827",
    color: "white",
    cursor: "pointer",
  },

  profileCard: {
    background: "white",
    padding: "40px",
    borderRadius: "18px",
    textAlign: "center",
    boxShadow:
      "0 3px 15px rgba(0,0,0,0.07)",
  },

  avatar: {
    width: "90px",
    height: "90px",
    borderRadius: "50%",
    background: "#111827",
    color: "white",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "38px",
    margin: "0 auto 15px",
  },

  role: {
    display: "inline-block",
    background: "#eef2ff",
    padding: "7px 15px",
    borderRadius: "20px",
    color: "#3730a3",
  },

  info: {
    marginTop: "35px",
    display: "grid",
    gridTemplateColumns:
      "repeat(auto-fit, minmax(200px, 1fr))",
    gap: "20px",
    textAlign: "left",
  },

  infoItem: {
    padding: "15px",
  },

  section: {
    background: "white",
    padding: "30px",
    borderRadius: "18px",
    marginTop: "25px",
  },

  capabilities: {
    display: "grid",
    gridTemplateColumns:
      "repeat(auto-fit, minmax(220px, 1fr))",
    gap: "15px",
    marginTop: "20px",
  },
};

export default Profile;
