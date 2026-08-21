import React from "react";

const AdminAnalytics = () => {
  return (
    <div style={styles.page}>

      <h1>📊 System Analytics</h1>

      <p style={styles.subtitle}>
        Overview of ClipMind AI platform activity.
      </p>

      <div style={styles.grid}>

        <div style={styles.card}>
          <div style={styles.icon}>👥</div>
          <h2>Users</h2>
          <p>
            Monitor platform users and their roles.
          </p>
        </div>

        <div style={styles.card}>
          <div style={styles.icon}>🎥</div>
          <h2>Videos</h2>
          <p>
            Track uploaded and processed videos.
          </p>
        </div>

        <div style={styles.card}>
          <div style={styles.icon}>📝</div>
          <h2>Transcripts</h2>
          <p>
            AI-generated transcript activity.
          </p>
        </div>

        <div style={styles.card}>
          <div style={styles.icon}>🎯</div>
          <h2>Key Moments</h2>
          <p>
            AI-detected important moments.
          </p>
        </div>

      </div>

      <div style={styles.section}>

        <h2>📈 Platform Activity</h2>

        <div style={styles.activity}>

          <div>
            <strong>Video Processing</strong>
            <div style={styles.bar}>
              <div style={styles.progress}></div>
            </div>
          </div>

          <div>
            <strong>AI Analysis</strong>
            <div style={styles.bar}>
              <div
                style={{
                  ...styles.progress,
                  width: "75%",
                }}
              ></div>
            </div>
          </div>

          <div>
            <strong>Content Generation</strong>
            <div style={styles.bar}>
              <div
                style={{
                  ...styles.progress,
                  width: "60%",
                }}
              ></div>
            </div>
          </div>

        </div>

      </div>

    </div>
  );
};

const styles = {
  page: {
    minHeight: "100vh",
    padding: "35px",
    background: "#f5f7fb",
    fontFamily: "Arial, sans-serif",
  },

  subtitle: {
    color: "#6b7280",
    marginBottom: "30px",
  },

  grid: {
    display: "grid",
    gridTemplateColumns:
      "repeat(auto-fit, minmax(230px, 1fr))",
    gap: "20px",
  },

  card: {
    background: "white",
    padding: "25px",
    borderRadius: "15px",
    boxShadow:
      "0 3px 15px rgba(0,0,0,0.06)",
  },

  icon: {
    fontSize: "35px",
  },

  section: {
    background: "white",
    padding: "25px",
    borderRadius: "15px",
    marginTop: "25px",
    boxShadow:
      "0 3px 15px rgba(0,0,0,0.06)",
  },

  activity: {
    display: "flex",
    flexDirection: "column",
    gap: "25px",
    marginTop: "20px",
  },

  bar: {
    height: "10px",
    background: "#e5e7eb",
    borderRadius: "10px",
    marginTop: "10px",
  },

  progress: {
    width: "85%",
    height: "100%",
    background: "#111827",
    borderRadius: "10px",
  },
};

export default AdminAnalytics;
