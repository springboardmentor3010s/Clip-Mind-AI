import React, { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

import API from "../../config";

const AdminDashboard = () => {
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
      console.error("Admin dashboard error:", error);

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

      {/* ================= SIDEBAR ================= */}

      <aside style={styles.sidebar}>

        <div style={styles.logo}>
          🧠 ClipMind AI
        </div>

        <div style={styles.role}>
          🛡 Administrator
        </div>

        <nav style={styles.nav}>

          <button
            style={styles.activeNav}
            onClick={() => navigate("/admin")}
          >
            🏠 Dashboard
          </button>

          <button
            style={styles.navButton}
            onClick={() => navigate("/admin/users")}
          >
            👥 Users
          </button>

          <button
            style={styles.navButton}
            onClick={() => navigate("/admin/videos")}
          >
            🎥 Videos
          </button>

          <button
            style={styles.navButton}
            onClick={() => navigate("/admin/analytics")}
          >
            📊 Analytics
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


      {/* ================= MAIN ================= */}

      <main style={styles.main}>

        <header style={styles.header}>

          <div>

            <h1 style={styles.title}>
              Admin Dashboard 🛡️
            </h1>

            <p style={styles.subtitle}>
              Manage users, videos and ClipMind AI
              platform activity.
            </p>

          </div>

          <div style={styles.profile}>
            🛡️ Administrator
          </div>

        </header>


        {/* ================= STATS ================= */}

        <div style={styles.stats}>

          <div style={styles.card}>

            <div style={styles.icon}>
              👥
            </div>

            <h2>
              —
            </h2>

            <p>
              Total Users
            </p>

          </div>


          <div style={styles.card}>

            <div style={styles.icon}>
              🎥
            </div>

            <h2>
              {loading ? "..." : videos.length}
            </h2>

            <p>
              Total Videos
            </p>

          </div>


          <div style={styles.card}>

            <div style={styles.icon}>
              🧠
            </div>

            <h2>
              AI
            </h2>

            <p>
              AI Processing
            </p>

          </div>


          <div style={styles.card}>

            <div style={styles.icon}>
              📊
            </div>

            <h2>
              Live
            </h2>

            <p>
              System Status
            </p>

          </div>

        </div>


        {/* ================= PLATFORM OVERVIEW ================= */}

        <section style={styles.section}>

          <h2>
            📈 Platform Overview
          </h2>

          <div style={styles.overview}>

            <div style={styles.overviewCard}>

              <span style={styles.bigIcon}>
                👥
              </span>

              <div>

                <h3>
                  User Management
                </h3>

                <p>
                  Manage learners, educators,
                  creators and administrators.
                </p>

                <button
                  style={styles.button}
                  onClick={() => navigate("/admin/users")}
                >
                  Manage Users →
                </button>

              </div>

            </div>


            <div style={styles.overviewCard}>

              <span style={styles.bigIcon}>
                🎥
              </span>

              <div>

                <h3>
                  Video Management
                </h3>

                <p>
                  Monitor uploaded videos and
                  AI processing activity.
                </p>

                <button
                  style={styles.button}
                  onClick={() => navigate("/admin/videos")}
                >
                  Manage Videos →
                </button>

              </div>

            </div>


            <div style={styles.overviewCard}>

              <span style={styles.bigIcon}>
                📊
              </span>

              <div>

                <h3>
                  System Analytics
                </h3>

                <p>
                  View platform usage and
                  content analytics.
                </p>

                <button
                  style={styles.button}
                  onClick={() => navigate("/admin/analytics")}
                >
                  View Analytics →
                </button>

              </div>

            </div>

          </div>

        </section>


        {/* ================= RECENT VIDEOS ================= */}

        <section style={styles.section}>

          <div style={styles.sectionHeader}>

            <div>

              <h2>
                🎬 Recent Videos
              </h2>

              <p style={styles.subtitle}>
                Latest content available on
                the platform.
              </p>

            </div>

            <button
              style={styles.button}
              onClick={() => navigate("/admin/videos")}
            >
              View All →
            </button>

          </div>


          {loading ? (

            <p>
              Loading videos...
            </p>

          ) : videos.length === 0 ? (

            <div style={styles.empty}>

              <div style={styles.emptyIcon}>
                🎬
              </div>

              <h3>
                No videos found
              </h3>

              <p>
                Uploaded videos will appear here.
              </p>

            </div>

          ) : (

            <div style={styles.videoGrid}>

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
                    Video ID: {video.id}
                  </p>

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
    color: "#fbbf24",
    fontSize: "14px",
    marginBottom: "30px",
  },

  nav: {
    display: "flex",
    flexDirection: "column",
    gap: "7px",
  },

  navButton: {
    border: "none",
    background: "transparent",
    color: "#d1d5db",
    padding: "12px 15px",
    textAlign: "left",
    borderRadius: "8px",
    cursor: "pointer",
    fontSize: "14px",
  },

  activeNav: {
    border: "none",
    background: "#374151",
    color: "white",
    padding: "12px 15px",
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

  title: {
    margin: 0,
    fontSize: "30px",
    color: "#111827",
  },

  subtitle: {
    color: "#6b7280",
  },

  profile: {
    background: "white",
    padding: "12px 18px",
    borderRadius: "10px",
    boxShadow: "0 2px 10px rgba(0,0,0,0.06)",
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

  overview: {
    display: "grid",
    gridTemplateColumns: "repeat(3, 1fr)",
    gap: "18px",
    marginTop: "20px",
  },

  overviewCard: {
    border: "1px solid #e5e7eb",
    padding: "20px",
    borderRadius: "12px",
    display: "flex",
    gap: "15px",
  },

  bigIcon: {
    fontSize: "35px",
  },

  button: {
    border: "none",
    background: "#111827",
    color: "white",
    padding: "9px 15px",
    borderRadius: "7px",
    cursor: "pointer",
  },

  videoGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(3, 1fr)",
    gap: "18px",
  },

  videoCard: {
    border: "1px solid #e5e7eb",
    padding: "18px",
    borderRadius: "12px",
  },

  videoIcon: {
    fontSize: "30px",
  },

  empty: {
    textAlign: "center",
    padding: "50px",
  },

  emptyIcon: {
    fontSize: "45px",
  },
};

export default AdminDashboard;
