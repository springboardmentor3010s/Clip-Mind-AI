import React, { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

const API = "${API}";

const LearnerDashboard = () => {
  const navigate = useNavigate();

  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);

  const userName =
    localStorage.getItem("userName") || "Learner";

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
      console.error("Learner dashboard error:", error);

      if (error.response?.status === 401) {
        localStorage.removeItem("access_token");
        navigate("/login");
      }
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem("access_token");
    localStorage.removeItem("userEmail");
    localStorage.removeItem("userName");
    localStorage.removeItem("userId");
    localStorage.removeItem("role");

    navigate("/login");
  };

  return (
    <div style={styles.container}>

      {/* SIDEBAR */}
      <aside style={styles.sidebar}>

        <div style={styles.logo}>
          ClipMind AI
        </div>

        <div style={styles.role}>
          Learner Portal
        </div>

        <nav style={styles.nav}>

          <button
            style={styles.activeNav}
            onClick={() => navigate("/learner")}
          >
            Dashboard
          </button>

          <button
            style={styles.navButton}
            onClick={() => navigate("/learner/videos")}
          >
            Videos
          </button>

          <button
            style={styles.navButton}
            onClick={() => navigate("/learner/transcripts")}
          >
            Transcripts
          </button>

          <button
            style={styles.navButton}
            onClick={() => navigate("/learner/summaries")}
          >
            Summaries
          </button>

          <button
            style={styles.navButton}
            onClick={() => navigate("/learner/key-moments")}
          >
            Key Moments
          </button>

          <button
            style={styles.navButton}
            onClick={() => navigate("/learner/analytics")}
          >
            Analytics
          </button>

        </nav>

        <button
          style={styles.logout}
          onClick={logout}
        >
          Logout
        </button>

      </aside>


      {/* MAIN CONTENT */}
      <main style={styles.main}>

        {/* HEADER */}
        <div style={styles.header}>

          <div>
            <h1 style={styles.title}>
              Welcome, {userName}!
            </h1>

            <p style={styles.subtitle}>
              Learn smarter with AI-powered video intelligence.
            </p>
          </div>

          <div style={styles.profile}>
            Learner
          </div>

        </div>


        {/* STATS */}
        <div style={styles.stats}>

          <div style={styles.card}>
            <div style={styles.icon}>Videos</div>

            <h2>
              {loading ? "..." : videos.length}
            </h2>

            <p>Available Videos</p>
          </div>


          <div style={styles.card}>
            <div style={styles.icon}>AI</div>

            <h2>
              {loading ? "..." : videos.length}
            </h2>

            <p>Processed Videos</p>
          </div>


          <div style={styles.card}>
            <div style={styles.icon}>Key</div>

            <h2>AI</h2>

            <p>Key Moments</p>
          </div>


          <div style={styles.card}>
            <div style={styles.icon}>Analytics</div>

            <h2>Smart</h2>

            <p>Learning Insights</p>
          </div>

        </div>


        {/* QUICK ACTIONS */}
        <section style={styles.section}>

          <h2 style={styles.sectionTitle}>
            Learning Tools
          </h2>

          <div style={styles.actions}>

            <button
              style={styles.actionButton}
              onClick={() => navigate("/learner/videos")}
            >
              View Videos
            </button>

            <button
              style={styles.actionButton}
              onClick={() => navigate("/learner/transcripts")}
            >
              View Transcripts
            </button>

            <button
              style={styles.actionButton}
              onClick={() => navigate("/learner/summaries")}
            >
              AI Summaries
            </button>

            <button
              style={styles.actionButton}
              onClick={() => navigate("/learner/key-moments")}
            >
              Key Moments
            </button>

          </div>

        </section>


        {/* RECENT VIDEOS */}
        <section style={styles.section}>

          <div style={styles.sectionHeader}>

            <h2 style={styles.sectionTitle}>
              Available Learning Videos
            </h2>

            <button
              style={styles.viewButton}
              onClick={() => navigate("/learner/videos")}
            >
              View All
            </button>

          </div>

          {loading ? (
            <div style={styles.empty}>
              Loading videos...
            </div>
          ) : videos.length === 0 ? (
            <div style={styles.empty}>
              <h3>No videos available</h3>

              <p>
                Processed educational videos will appear here.
              </p>
            </div>
          ) : (
            <div style={styles.videoGrid}>

              {videos.slice(0, 6).map((video, index) => (

                <div
                  key={video.id || index}
                  style={styles.videoCard}
                >

                  <h3>
                    {video.title ||
                      video.filename ||
                      `Video ${index + 1}`}
                  </h3>

                  <p>
                    AI-powered learning content
                  </p>

                  <button
                    style={styles.smallButton}
                    onClick={() =>
                      navigate("/learner/videos")
                    }
                  >
                    Open
                  </button>

                </div>

              ))}

            </div>
          )}

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
    width: "240px",
    background: "#111827",
    color: "white",
    padding: "25px 18px",
    display: "flex",
    flexDirection: "column",
    boxSizing: "border-box",
  },

  logo: {
    fontSize: "24px",
    fontWeight: "bold",
    marginBottom: "8px",
  },

  role: {
    color: "#9ca3af",
    fontSize: "14px",
    marginBottom: "30px",
  },

  nav: {
    display: "flex",
    flexDirection: "column",
    gap: "10px",
  },

  activeNav: {
    border: "none",
    background: "#2563eb",
    color: "white",
    padding: "13px",
    borderRadius: "8px",
    textAlign: "left",
    cursor: "pointer",
    fontSize: "15px",
  },

  navButton: {
    border: "none",
    background: "transparent",
    color: "#d1d5db",
    padding: "13px",
    borderRadius: "8px",
    textAlign: "left",
    cursor: "pointer",
    fontSize: "15px",
  },

  logout: {
    marginTop: "auto",
    border: "none",
    background: "#dc2626",
    color: "white",
    padding: "13px",
    borderRadius: "8px",
    cursor: "pointer",
    fontSize: "15px",
  },

  main: {
    flex: 1,
    padding: "35px",
    boxSizing: "border-box",
  },

  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "30px",
  },

  title: {
    margin: 0,
    fontSize: "30px",
    color: "#111827",
  },

  subtitle: {
    color: "#6b7280",
    marginTop: "8px",
  },

  profile: {
    background: "white",
    padding: "12px 20px",
    borderRadius: "10px",
    fontWeight: "bold",
    color: "#2563eb",
  },

  stats: {
    display: "grid",
    gridTemplateColumns:
      "repeat(auto-fit, minmax(180px, 1fr))",
    gap: "20px",
    marginBottom: "35px",
  },

  card: {
    background: "white",
    padding: "22px",
    borderRadius: "14px",
    boxShadow: "0 4px 15px rgba(0,0,0,0.06)",
  },

  icon: {
    fontSize: "13px",
    color: "#2563eb",
    fontWeight: "bold",
    marginBottom: "10px",
  },

  section: {
    background: "white",
    padding: "25px",
    borderRadius: "14px",
    marginBottom: "25px",
    boxShadow: "0 4px 15px rgba(0,0,0,0.05)",
  },

  sectionHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  },

  sectionTitle: {
    marginTop: 0,
    color: "#111827",
  },

  actions: {
    display: "flex",
    flexWrap: "wrap",
    gap: "15px",
  },

  actionButton: {
    border: "none",
    background: "#2563eb",
    color: "white",
    padding: "13px 20px",
    borderRadius: "8px",
    cursor: "pointer",
  },

  viewButton: {
    border: "none",
    background: "#eff6ff",
    color: "#2563eb",
    padding: "10px 15px",
    borderRadius: "8px",
    cursor: "pointer",
  },

  empty: {
    textAlign: "center",
    padding: "40px",
    color: "#6b7280",
  },

  videoGrid: {
    display: "grid",
    gridTemplateColumns:
      "repeat(auto-fit, minmax(220px, 1fr))",
    gap: "18px",
  },

  videoCard: {
    border: "1px solid #e5e7eb",
    padding: "18px",
    borderRadius: "10px",
  },

  smallButton: {
    border: "none",
    background: "#2563eb",
    color: "white",
    padding: "8px 14px",
    borderRadius: "6px",
    cursor: "pointer",
  },

};

export default LearnerDashboard;
