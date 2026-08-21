import React, { useEffect, useState } from "react";
import axios from "axios";
import {
  FaRobot,
  FaCheckCircle,
  FaClock,
  FaVideo,
  FaSyncAlt,
} from "react-icons/fa";

const API = "${API}";

const AdminProcessingJobs = () => {
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchJobs = async () => {
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
      console.error("Processing jobs error:", err);

      if (err.response?.status === 403) {
        setError("Administrator access required.");
      } else if (err.response?.status === 401) {
        setError("Session expired. Please login again.");
      } else {
        setError("Unable to load processing jobs.");
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchJobs();
  }, []);

  // -----------------------------
  // HELPERS
  // -----------------------------

  const hasContent = (value) => {
    if (value === null || value === undefined) {
      return false;
    }

    if (typeof value === "string") {
      return value.trim().length > 0;
    }

    if (Array.isArray(value)) {
      return value.length > 0;
    }

    return Boolean(value);
  };

  const parseKeyMoments = (value) => {
    if (!hasContent(value)) return [];

    if (Array.isArray(value)) {
      return value;
    }

    try {
      const parsed = JSON.parse(value);

      if (Array.isArray(parsed)) {
        return parsed;
      }

      return [parsed];
    } catch {
      return [];
    }
  };

  const isProcessed = (video) => {
    return (
      hasContent(video.transcript) ||
      hasContent(video.summary) ||
      parseKeyMoments(video.key_moments).length > 0
    );
  };

  const processedCount = videos.filter(isProcessed).length;

  const pendingCount =
    videos.length - processedCount;

  return (
    <div style={styles.page}>

      {/* HEADER */}

      <div style={styles.header}>

        <div>
          <h1 style={styles.title}>
            <FaRobot />
            AI Processing Jobs
          </h1>

          <p style={styles.subtitle}>
            Monitor AI video processing and analysis activity.
          </p>
        </div>

        <button
          style={styles.refresh}
          onClick={fetchJobs}
        >
          <FaSyncAlt />
          Refresh
        </button>

      </div>

      {error && (
        <div style={styles.error}>
          {error}
        </div>
      )}

      {/* STATS */}

      <div style={styles.stats}>

        <div style={styles.statCard}>
          <FaVideo style={styles.icon} />

          <div>
            <h2 style={styles.number}>
              {videos.length}
            </h2>

            <p style={styles.label}>
              Total Jobs
            </p>
          </div>
        </div>

        <div style={styles.statCard}>
          <FaCheckCircle style={styles.icon} />

          <div>
            <h2 style={styles.number}>
              {processedCount}
            </h2>

            <p style={styles.label}>
              Completed
            </p>
          </div>
        </div>

        <div style={styles.statCard}>
          <FaClock style={styles.icon} />

          <div>
            <h2 style={styles.number}>
              {pendingCount}
            </h2>

            <p style={styles.label}>
              Pending
            </p>
          </div>
        </div>

      </div>

      {/* TABLE */}

      <div style={styles.card}>

        <h2 style={styles.sectionTitle}>
          Processing Activity
        </h2>

        {loading ? (

          <div style={styles.empty}>
            Loading processing jobs...
          </div>

        ) : videos.length === 0 ? (

          <div style={styles.empty}>

            <FaRobot size={45} />

            <h3>
              No processing jobs found
            </h3>

            <p>
              Processed videos will appear here
              automatically.
            </p>

          </div>

        ) : (

          <div style={styles.tableWrapper}>

            <table style={styles.table}>

              <thead>

                <tr>
                  <th>Video</th>
                  <th>Uploaded By</th>
                  <th>Processing Time</th>
                  <th>Transcript</th>
                  <th>Summary</th>
                  <th>Key Moments</th>
                  <th>Status</th>
                </tr>

              </thead>

              <tbody>

                {videos.map((video) => {

                  const transcriptReady =
                    hasContent(video.transcript);

                  const summaryReady =
                    hasContent(video.summary);

                  const keyMoments =
                    parseKeyMoments(
                      video.key_moments
                    );

                  const keyMomentsReady =
                    keyMoments.length > 0;

                  const completed =
                    transcriptReady ||
                    summaryReady ||
                    keyMomentsReady;

                  return (

                    <tr key={video.id}>

                      <td>
                        <strong>
                          {video.filename ||
                            "Untitled Video"}
                        </strong>
                      </td>

                      <td>
                        {video.uploaded_by ||
                          "Unknown"}
                      </td>

                      <td>
                        {video.processing_time ||
                          "Available"}
                      </td>

                      <td>
                        <Status
                          ready={transcriptReady}
                        />
                      </td>

                      <td>
                        <Status
                          ready={summaryReady}
                        />
                      </td>

                      <td>
                        {keyMomentsReady ? (
                          <span style={styles.success}>
                            ✓ {keyMoments.length} detected
                          </span>
                        ) : (
                          <span style={styles.muted}>
                            No moments
                          </span>
                        )}
                      </td>

                      <td>
                        <span
                          style={{
                            ...styles.status,
                            background:
                              completed
                                ? "#dcfce7"
                                : "#fef3c7",
                            color:
                              completed
                                ? "#166534"
                                : "#92400e",
                          }}
                        >
                          {completed
                            ? "Completed"
                            : "Pending"}
                        </span>
                      </td>

                    </tr>

                  );
                })}

              </tbody>

            </table>

          </div>

        )}

      </div>

    </div>
  );
};


// --------------------------------
// STATUS COMPONENT
// --------------------------------

const Status = ({ ready }) => {

  if (ready) {
    return (
      <span style={styles.success}>
        ✓ Available
      </span>
    );
  }

  return (
    <span style={styles.muted}>
      Not available
    </span>
  );
};


// --------------------------------
// STYLES
// --------------------------------

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
    alignItems: "center",
    gap: "10px",
  },

  subtitle: {
    color: "#6b7280",
    marginTop: "8px",
  },

  refresh: {
    border: "none",
    background: "#111827",
    color: "white",
    padding: "12px 18px",
    borderRadius: "8px",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    gap: "8px",
  },

  error: {
    background: "#fee2e2",
    color: "#991b1b",
    padding: "12px",
    borderRadius: "8px",
    marginBottom: "20px",
  },

  stats: {
    display: "grid",
    gridTemplateColumns:
      "repeat(auto-fit, minmax(220px, 1fr))",
    gap: "20px",
    marginBottom: "25px",
  },

  statCard: {
    background: "white",
    padding: "22px",
    borderRadius: "15px",
    display: "flex",
    alignItems: "center",
    gap: "18px",
    boxShadow:
      "0 3px 15px rgba(0,0,0,0.06)",
  },

  icon: {
    fontSize: "30px",
  },

  number: {
    margin: 0,
  },

  label: {
    margin: 0,
    color: "#6b7280",
  },

  card: {
    background: "white",
    padding: "25px",
    borderRadius: "16px",
    boxShadow:
      "0 3px 15px rgba(0,0,0,0.06)",
  },

  sectionTitle: {
    marginTop: 0,
    marginBottom: "20px",
  },

  tableWrapper: {
    overflowX: "auto",
  },

  table: {
    width: "100%",
    borderCollapse: "collapse",
    fontSize: "14px",
  },

  success: {
    color: "#166534",
    fontWeight: "600",
    whiteSpace: "nowrap",
  },

  muted: {
    color: "#9ca3af",
    whiteSpace: "nowrap",
  },

  status: {
    display: "inline-block",
    padding: "6px 10px",
    borderRadius: "20px",
    fontSize: "12px",
    fontWeight: "600",
  },

  empty: {
    textAlign: "center",
    padding: "60px 20px",
    color: "#6b7280",
  },
};

export default AdminProcessingJobs;
