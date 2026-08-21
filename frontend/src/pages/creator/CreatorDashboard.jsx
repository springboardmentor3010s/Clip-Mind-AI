import React, { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

import API from "../../config";

const CreatorDashboard = () => {
  const navigate = useNavigate();
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchVideos();
  }, []);

  const fetchVideos = async () => {
    try {
      const token = localStorage.getItem("access_token");

      if (!token) {
        navigate("/login");
        return;
      }

      const response = await axios.get(`${API}/videos`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      setVideos(
        Array.isArray(response.data)
          ? response.data
          : []
      );
    } catch (error) {
      console.error("Creator dashboard error:", error);

      if (error.response?.status === 401) {
        localStorage.removeItem("access_token");
        navigate("/login");
      }
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    localStorage.clear();
    navigate("/login");
  };

  return (
    <div style={styles.container}>

      {/* SIDEBAR */}
      <aside style={styles.sidebar}>

        <div style={styles.logo}>
          🧠 ClipMind AI
        </div>

        <div style={styles.role}>
          🎥 Content Creator
        </div>

        <nav style={styles.nav}>

          <button
            style={styles.activeNav}
            onClick={() => navigate("/creator")}
          >
            🏠 Dashboard
          </button>

          <button
            style={styles.navButton}
            onClick={() => navigate("/upload")}
          >
            ⬆️ Upload Video
          </button>

          <button
            style={styles.navButton}
            onClick={() => navigate("/videos")}
          >
            🎬 My Videos
          </button>

          <button
            style={styles.navButton}
            onClick={() => navigate("/summary")}
          >
            📄 Summaries
          </button>

          <button
            style={styles.navButton}
            onClick={() => navigate("/transcript")}
          >
            📝 Transcripts
          </button>

          <button
            style={styles.navButton}
            onClick={() => navigate("/keymoments")}
          >
            🎯 Key Moments
          </button>

          <button
            style={styles.navButton}
            onClick={() => navigate("/analytics")}
          >
            📊 Analytics
          </button>

          <button
            style={styles.navButton}
            onClick={() => navigate("/settings")}
          >
            ⚙️ Settings
          </button>

        </nav>

        <button
          style={styles.logout}
          onClick={logout}
        >
          🚪 Logout
        </button>

      </aside>


      {/* MAIN */}
      <main style={styles.main}>

        <header style={styles.header}>

          <div>
            <h1>
              Creator Dashboard 🚀
            </h1>

            <p style={styles.subtitle}>
              Create, manage and analyze your video content.
            </p>
          </div>

          <button
            style={styles.uploadButton}
            onClick={() => navigate("/upload")}
          >
            ⬆️ Upload Video
          </button>

        </header>


        {/* STATS */}
        <div style={styles.stats}>

          <div style={styles.card}>
            <div style={styles.icon}>🎬</div>
            <h2>
              {loading ? "..." : videos.length}
            </h2>
            <p>Total Videos</p>
          </div>

          <div style={styles.card}>
            <div style={styles.icon}>📝</div>
            <h2>AI</h2>
            <p>Transcripts</p>
          </div>

          <div style={styles.card}>
            <div style={styles.icon}>🎯</div>
            <h2>AI</h2>
            <p>Key Moments</p>
          </div>

          <div style={styles.card}>
            <div style={styles.icon}>📊</div>
            <h2>AI</h2>
            <p>Analytics</p>
          </div>

        </div>


        {/* VIDEOS */}
        <section style={styles.section}>

          <div style={styles.sectionHeader}>

            <div>
              <h2>🎬 My Content</h2>

              <p style={styles.subtitle}>
                Manage your uploaded video content.
              </p>
            </div>

            <button
              style={styles.viewButton}
              onClick={() =>navigate("/creator/videos")}
            >
              View All →
            </button>

          </div>

          {loading ? (

            <p>Loading videos...</p>

          ) : videos.length === 0 ? (

            <div style={styles.empty}>

              <div style={{ fontSize: "45px" }}>
                🎥
              </div>

              <h3>No videos uploaded yet</h3>

              <p>
                Upload your first video to start generating
                AI insights.
              </p>

              <button
                style={styles.uploadButton}
                onClick={() => navigate("/upload")}
              >
                Upload Your First Video
              </button>

            </div>

          ) : (

            <div style={styles.grid}>

              {videos.slice(0, 6).map((video) => (

                <div
                  key={video.id}
                  style={styles.videoCard}
                >

                  <div style={styles.videoIcon}>
                    🎥
                  </div>

                  <h3>
                    {video.filename || "Untitled Video"}
                  </h3>

                  <p>
                    AI processing and insights available.
                  </p>

                  <button
                    style={styles.smallButton}
                    onClick={() => navigate("/creator/analytics")}
                  >
                    Manage →
                  </button>

                </div>

              ))}

            </div>

          )}

        </section>


        {/* QUICK ACTIONS */}
        <section style={styles.section}>

          <h2>⚡ Creator Tools</h2>

          <div style={styles.tools}>

            <button
              style={styles.tool}
              onClick={() => navigate("/upload")}
            >
              ⬆️
              <span>Upload Video</span>
            </button>

            <button
              style={styles.tool}
              onClick={() => navigate("/summary")}
            >
              📄
              <span>View Summaries</span>
            </button>

            <button
              style={styles.tool}
              onClick={() => navigate("/keymoments")}
            >
              🎯
              <span>Key Moments</span>
            </button>

            <button
              style={styles.tool}
              onClick={() => navigate("/creator/analytics")}
            >
              📊
              <span>Analytics</span>
            </button>

          </div>

        </section>

      </main>

    </div>
  );
};

const styles = {
  container: {
    display: "flex",
    minHeight: "100vh",
    background: "#f5f7fb",
    fontFamily: "Arial, sans-serif",
  },

  sidebar: {
    width: "250px",
    background: "#111827",
    color: "white",
    padding: "25px 18px",
    display: "flex",
    flexDirection: "column",
    position: "fixed",
    left: 0,
    top: 0,
    bottom: 0,
    boxSizing: "border-box",
  },

  logo: {
    fontSize: "22px",
    fontWeight: "bold",
    marginBottom: "12px",
  },

  role: {
    color: "#a5b4fc",
    fontSize: "14px",
    marginBottom: "30px",
  },

  nav: {
    display: "flex",
    flexDirection: "column",
    gap: "8px",
  },

  navButton: {
    border: "none",
    background: "transparent",
    color: "#d1d5db",
    padding: "13px 15px",
    textAlign: "left",
    borderRadius: "8px",
    cursor: "pointer",
    fontSize: "14px",
  },

  activeNav: {
    border: "none",
    background: "#374151",
    color: "white",
    padding: "13px 15px",
    textAlign: "left",
    borderRadius: "8px",
    cursor: "pointer",
    fontSize: "14px",
    fontWeight: "bold",
  },

  logout: {
    marginTop: "auto",
    border: "none",
    background: "#dc2626",
    color: "white",
    padding: "12px",
    borderRadius: "8px",
    cursor: "pointer",
    fontWeight: "bold",
  },

  main: {
    marginLeft: "250px",
    width: "calc(100% - 250px)",
    padding: "30px",
    boxSizing: "border-box",
  },

  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "30px",
  },

  subtitle: {
    color: "#6b7280",
  },

  uploadButton: {
    border: "none",
    background: "#111827",
    color: "white",
    padding: "12px 20px",
    borderRadius: "9px",
    cursor: "pointer",
    fontWeight: "bold",
  },

  stats: {
    display: "grid",
    gridTemplateColumns: "repeat(4, 1fr)",
    gap: "20px",
    marginBottom: "30px",
  },

  card: {
    background: "white",
    padding: "22px",
    borderRadius: "15px",
    boxShadow: "0 3px 15px rgba(0,0,0,0.06)",
  },

  icon: {
    fontSize: "25px",
  },

  section: {
    background: "white",
    padding: "25px",
    borderRadius: "15px",
    marginBottom: "25px",
    boxShadow: "0 3px 15px rgba(0,0,0,0.05)",
  },

  sectionHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "20px",
  },

  viewButton: {
    border: "none",
    background: "#111827",
    color: "white",
    padding: "10px 16px",
    borderRadius: "8px",
    cursor: "pointer",
  },

  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(3, 1fr)",
    gap: "18px",
  },

  videoCard: {
    border: "1px solid #e5e7eb",
    padding: "20px",
    borderRadius: "12px",
  },

  videoIcon: {
    fontSize: "30px",
  },

  smallButton: {
    border: "none",
    background: "#111827",
    color: "white",
    padding: "9px 14px",
    borderRadius: "7px",
    cursor: "pointer",
  },

  empty: {
    textAlign: "center",
    padding: "50px",
  },

  tools: {
    display: "grid",
    gridTemplateColumns: "repeat(4, 1fr)",
    gap: "15px",
    marginTop: "20px",
  },

  tool: {
    border: "1px solid #e5e7eb",
    background: "#fafafa",
    padding: "20px",
    borderRadius: "12px",
    cursor: "pointer",
    fontSize: "24px",
    display: "flex",
    flexDirection: "column",
    gap: "10px",
    alignItems: "center",
  },
};

export default CreatorDashboard;
