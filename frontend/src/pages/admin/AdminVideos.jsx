import React, { useEffect, useState } from "react";
import axios from "axios";
import {
  FaVideo,
  FaCheckCircle,
  FaClock,
  FaUser,
  FaSync,
} from "react-icons/fa";

const API = "${API}";

const AdminVideos = () => {
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchVideos = async () => {
    try {
      setLoading(true);
      setError("");

      const token = localStorage.getItem("access_token");

      if (!token) {
        setError("Please login again.");
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
    } catch (err) {
      console.error("Admin videos error:", err);

      if (err.response?.status === 401) {
        setError("Session expired. Please login again.");
      } else if (err.response?.status === 403) {
        setError("Administrator access required.");
      } else {
        setError("Unable to load videos.");
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVideos();
  }, []);

  return (
    <div style={styles.page}>

      <div style={styles.header}>

        <div>
          <h1 style={styles.title}>
            <FaVideo /> Video Management
          </h1>

          <p style={styles.subtitle}>
            Monitor all videos uploaded to ClipMind AI.
          </p>
        </div>

        <button
          onClick={fetchVideos}
          style={styles.refresh}
        >
          <FaSync />
          Refresh
        </button>

      </div>

      {error && (
        <div style={styles.error}>
          {error}
        </div>
      )}

      {loading ? (
        <div style={styles.empty}>
          Loading videos...
        </div>
      ) : videos.length === 0 ? (
        <div style={styles.empty}>

          <FaVideo
            size={50}
            style={{ marginBottom: "15px" }}
          />

          <h2>No videos found</h2>

          <p>
            Videos uploaded to the platform
            will appear here.
          </p>

        </div>
      ) : (

        <div style={styles.grid}>

          {videos.map((video) => (

            <div
              key={video.id}
              style={styles.videoCard}
            >

              <div style={styles.iconBox}>
                <FaVideo />
              </div>

              <h3 style={styles.filename}>
                {video.filename}
              </h3>

              <div style={styles.info}>
                <FaUser />
                <span>
                  {video.uploaded_by || "Unknown"}
                </span>
              </div>

              <div style={styles.info}>
                {video.processed ? (
                  <>
                    <FaCheckCircle />
                    <span>
                      AI Processing Completed
                    </span>
                  </>
                ) : (
                  <>
                    <FaClock />
                    <span>
                      Awaiting AI Processing
                    </span>
                  </>
                )}
              </div>

              <div style={styles.stats}>

                <div>
                  <strong>
                    {video.transcript_words || 0}
                  </strong>
                  <small>Transcript Words</small>
                </div>

                <div>
                  <strong>
                    {video.summary_words || 0}
                  </strong>
                  <small>Summary Words</small>
                </div>

                <div>
                  <strong>
                    {video.status || "Uploaded"}
                  </strong>
                  <small>Status</small>
                </div>

              </div>

            </div>

          ))}

        </div>

      )}

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
    display: "flex",
    gap: "10px",
    alignItems: "center",
  },

  subtitle: {
    color: "#6b7280",
    marginTop: "8px",
  },

  refresh: {
    border: "none",
    background: "#4f46e5",
    color: "white",
    padding: "12px 18px",
    borderRadius: "8px",
    cursor: "pointer",
    display: "flex",
    gap: "8px",
    alignItems: "center",
  },

  grid: {
    display: "grid",
    gridTemplateColumns:
      "repeat(auto-fit, minmax(300px, 1fr))",
    gap: "20px",
  },

  videoCard: {
    background: "white",
    padding: "24px",
    borderRadius: "15px",
    boxShadow:
      "0 3px 15px rgba(0,0,0,0.07)",
  },

  iconBox: {
    width: "50px",
    height: "50px",
    borderRadius: "12px",
    background: "#eef2ff",
    color: "#4f46e5",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "22px",
  },

  filename: {
    marginTop: "15px",
    color: "#111827",
    wordBreak: "break-word",
  },

  info: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    color: "#6b7280",
    fontSize: "14px",
    marginTop: "10px",
  },

  stats: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr 1fr",
    gap: "8px",
    marginTop: "20px",
  },

  empty: {
    background: "white",
    textAlign: "center",
    padding: "70px 20px",
    borderRadius: "15px",
    color: "#6b7280",
  },

  error: {
    background: "#fee2e2",
    color: "#991b1b",
    padding: "14px",
    borderRadius: "8px",
    marginBottom: "20px",
  },
};

export default AdminVideos;
