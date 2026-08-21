import React, { useEffect, useState } from "react";
import axios from "axios";
import API from "../../config";

const EducatorAnalytics = () => {
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadAnalytics = async () => {
    try {
      setLoading(true);
      setError("");

      const token = localStorage.getItem("access_token");

      if (!token) {
        setError("Authentication token not found. Please login again.");
        return;
      }

      console.log("========== EDUCATOR ANALYTICS ==========");
      console.log("API:", API);
      console.log("URL:", `${API}/videos`);

      const response = await axios.get(`${API}/videos`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      console.log("Analytics response:", response.data);

      setVideos(
        Array.isArray(response.data)
          ? response.data
          : []
      );
    } catch (err) {
      console.error("Analytics error:", err);
      console.error("Analytics response:", err.response?.data);

      if (err.response?.status === 401) {
        setError("Session expired. Please login again.");
      } else if (err.response?.status === 403) {
        setError("You do not have permission to access analytics.");
      } else {
        setError("Unable to load analytics data.");
      }

      setVideos([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAnalytics();
  }, []);

  const totalVideos = videos.length;

  const totalTranscriptWords = videos.reduce(
    (sum, video) =>
      sum + Number(video.transcript_words || 0),
    0
  );

  const totalSummaryWords = videos.reduce(
    (sum, video) =>
      sum + Number(video.summary_words || 0),
    0
  );

  const transcriptVideos = videos.filter(
    (video) =>
      video.transcript ||
      Number(video.transcript_words || 0) > 0
  ).length;

  const summaryVideos = videos.filter(
    (video) =>
      video.summary ||
      Number(video.summary_words || 0) > 0
  ).length;

  const keyMomentVideos = videos.filter((video) => {
    if (!video.key_moments) return false;

    try {
      const moments =
        typeof video.key_moments === "string"
          ? JSON.parse(video.key_moments)
          : video.key_moments;

      return Array.isArray(moments)
        ? moments.length > 0
        : true;
    } catch {
      return true;
    }
  }).length;

  const averageProcessing =
    totalVideos > 0
      ? (
          videos.reduce(
            (sum, video) =>
              sum + Number(video.processing_time || 0),
            0
          ) / totalVideos
        ).toFixed(2)
      : "0.00";

  const averageCompression =
    totalVideos > 0
      ? (
          videos.reduce(
            (sum, video) =>
              sum + Number(video.compression_ratio || 0),
            0
          ) / totalVideos
        ).toFixed(2)
      : "0.00";

  const transcriptCoverage =
    totalVideos > 0
      ? Math.round(
          (transcriptVideos / totalVideos) * 100
        )
      : 0;

  const summaryCoverage =
    totalVideos > 0
      ? Math.round(
          (summaryVideos / totalVideos) * 100
        )
      : 0;

  const keyMomentCoverage =
    totalVideos > 0
      ? Math.round(
          (keyMomentVideos / totalVideos) * 100
        )
      : 0;

  const contentReadiness =
    totalVideos > 0
      ? Math.round(
          (
            transcriptCoverage +
            summaryCoverage +
            keyMomentCoverage
          ) / 3
        )
      : 0;

  if (loading) {
    return (
      <div style={styles.center}>
        <div style={styles.loadingIcon}>📊</div>
        <h2>Loading Analytics...</h2>
        <p>Fetching your processed lecture data.</p>
      </div>
    );
  }

  if (error) {
    return (
      <div style={styles.page}>
        <div style={styles.errorBox}>
          <div style={styles.errorIcon}>⚠️</div>

          <h2>Unable to Load Analytics</h2>

          <p>{error}</p>

          <button
            style={styles.retryButton}
            onClick={loadAnalytics}
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.page}>

      <div style={styles.header}>
        <div>
          <h1 style={styles.title}>
            📊 Educator Analytics
          </h1>

          <p style={styles.subtitle}>
            Overview of your AI-powered lecture
            processing activity.
          </p>
        </div>

        <button
          style={styles.refreshButton}
          onClick={loadAnalytics}
        >
          ↻ Refresh
        </button>
      </div>

      <div style={styles.cards}>

        <StatCard
          title="Total Videos"
          value={totalVideos}
          icon="🎬"
        />

        <StatCard
          title="Transcript Words"
          value={totalTranscriptWords.toLocaleString()}
          icon="📝"
        />

        <StatCard
          title="Summary Words"
          value={totalSummaryWords.toLocaleString()}
          icon="📚"
        />

        <StatCard
          title="Avg Processing"
          value={`${averageProcessing}s`}
          icon="⚙️"
        />

        <StatCard
          title="Key Moment Lectures"
          value={keyMomentVideos}
          icon="⭐"
        />

        <StatCard
          title="Content Readiness"
          value={`${contentReadiness}%`}
          icon="📈"
        />
      </div>

      <div style={styles.section}>

        <div style={styles.sectionHeader}>
          <div>
            <h2 style={styles.sectionTitle}>
              📈 Content Coverage
            </h2>

            <p style={styles.sectionSubtitle}>
              Availability of AI-generated learning resources.
            </p>
          </div>
        </div>

        <Coverage
          label="Transcripts"
          value={transcriptCoverage}
          count={transcriptVideos}
          total={totalVideos}
        />

        <Coverage
          label="AI Summaries"
          value={summaryCoverage}
          count={summaryVideos}
          total={totalVideos}
        />

        <Coverage
          label="Key Moments"
          value={keyMomentCoverage}
          count={keyMomentVideos}
          total={totalVideos}
        />
      </div>

      <div style={styles.section}>

        <div style={styles.sectionHeader}>
          <div>
            <h2 style={styles.sectionTitle}>
              🎥 Video Processing Overview
            </h2>

            <p style={styles.sectionSubtitle}>
              Processing statistics for your lectures.
            </p>
          </div>

          <span style={styles.countBadge}>
            {totalVideos} Video{totalVideos !== 1 ? "s" : ""}
          </span>
        </div>

        {videos.length === 0 ? (
          <div style={styles.emptyState}>
            <div style={styles.emptyIcon}>📭</div>

            <h3>No processed videos available</h3>

            <p>
              Upload and process a lecture to
              generate analytics.
            </p>
          </div>
        ) : (
          <div style={styles.tableWrapper}>
            <table style={styles.table}>
              <thead>
                <tr>
                  <th style={styles.th}>Video</th>
                  <th style={styles.th}>Transcript</th>
                  <th style={styles.th}>Summary</th>
                  <th style={styles.th}>Key Moments</th>
                  <th style={styles.th}>Compression</th>
                  <th style={styles.th}>Processing</th>
                </tr>
              </thead>

              <tbody>
                {videos.map((video) => {
                  let momentCount = 0;

                  if (video.key_moments) {
                    try {
                      const moments =
                        typeof video.key_moments === "string"
                          ? JSON.parse(video.key_moments)
                          : video.key_moments;

                      if (Array.isArray(moments)) {
                        momentCount = moments.length;
                      }
                    } catch {
                      momentCount = 0;
                    }
                  }

                  return (
                    <tr key={video.id}>
                      <td style={styles.td}>
                        <strong>
                          {video.filename ||
                            video.title ||
                            `Video ${video.id}`}
                        </strong>
                      </td>

                      <td style={styles.td}>
                        {Number(
                          video.transcript_words || 0
                        ).toLocaleString()}
                      </td>

                      <td style={styles.td}>
                        {Number(
                          video.summary_words || 0
                        ).toLocaleString()}
                      </td>

                      <td style={styles.td}>
                        <span style={styles.momentBadge}>
                          {momentCount}
                        </span>
                      </td>

                      <td style={styles.td}>
                        {Number(
                          video.compression_ratio || 0
                        ).toFixed(2)}
                        %
                      </td>

                      <td style={styles.td}>
                        {Number(
                          video.processing_time || 0
                        ).toFixed(2)}
                        s
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {videos.length > 0 && (
        <div style={styles.insightBox}>
          <div style={styles.insightIcon}>💡</div>

          <div>
            <h3>AI Processing Summary</h3>

            <p>
              ClipMind AI processed{" "}
              <strong>{totalVideos}</strong>{" "}
              lecture{totalVideos !== 1 ? "s" : ""} containing{" "}
              <strong>
                {totalTranscriptWords.toLocaleString()}
              </strong>{" "}
              transcript words and{" "}
              <strong>
                {totalSummaryWords.toLocaleString()}
              </strong>{" "}
              summary words.
            </p>

            <p>
              Average compression is{" "}
              <strong>{averageCompression}%</strong>{" "}
              and average processing time is{" "}
              <strong>{averageProcessing}s</strong>.
            </p>
          </div>
        </div>
      )}

    </div>
  );
};

const StatCard = ({ title, value, icon }) => (
  <div style={styles.card}>
    <div style={styles.icon}>{icon}</div>

    <div>
      <p style={styles.cardTitle}>{title}</p>
      <h2 style={styles.cardValue}>{value}</h2>
    </div>
  </div>
);

const Coverage = ({
  label,
  value,
  count,
  total,
}) => (
  <div style={styles.coverage}>
    <div style={styles.coverageHeader}>
      <span>{label}</span>

      <strong>
        {count}/{total} ({value}%)
      </strong>
    </div>

    <div style={styles.progressBackground}>
      <div
        style={{
          ...styles.progressBar,
          width: `${value}%`,
        }}
      />
    </div>
  </div>
);

const styles = {
  page: {
    padding: "35px",
    background: "#f7f8fc",
    minHeight: "100vh",
    boxSizing: "border-box",
  },

  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "30px",
    gap: "20px",
  },

  title: {
    margin: 0,
    fontSize: "32px",
    color: "#172554",
  },

  subtitle: {
    color: "#64748b",
    marginTop: "8px",
  },

  refreshButton: {
    border: "none",
    background: "#4f46e5",
    color: "white",
    padding: "11px 18px",
    borderRadius: "9px",
    cursor: "pointer",
    fontWeight: "600",
  },

  cards: {
    display: "grid",
    gridTemplateColumns:
      "repeat(auto-fit, minmax(190px, 1fr))",
    gap: "18px",
    marginBottom: "30px",
  },

  card: {
    background: "#ffffff",
    padding: "22px",
    borderRadius: "16px",
    display: "flex",
    gap: "15px",
    alignItems: "center",
    boxShadow:
      "0 4px 18px rgba(15, 23, 42, 0.06)",
    border: "1px solid #eef2f7",
  },

  icon: {
    fontSize: "28px",
    width: "55px",
    height: "55px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: "#f1f5ff",
    borderRadius: "14px",
  },

  cardTitle: {
    color: "#64748b",
    margin: 0,
    fontSize: "14px",
  },

  cardValue: {
    margin: "5px 0 0",
    fontSize: "25px",
    color: "#111827",
  },

  section: {
    background: "#ffffff",
    padding: "28px",
    borderRadius: "18px",
    boxShadow:
      "0 4px 18px rgba(15, 23, 42, 0.06)",
    border: "1px solid #eef2f7",
    marginBottom: "25px",
  },

  sectionHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "22px",
  },

  sectionTitle: {
    margin: 0,
    color: "#172554",
  },

  sectionSubtitle: {
    margin: "5px 0 0",
    color: "#64748b",
  },

  countBadge: {
    background: "#f1f5ff",
    color: "#4f46e5",
    padding: "8px 14px",
    borderRadius: "15px",
    fontWeight: "600",
  },

  coverage: {
    marginBottom: "22px",
  },

  coverageHeader: {
    display: "flex",
    justifyContent: "space-between",
    marginBottom: "8px",
    color: "#374151",
    fontSize: "14px",
  },

  progressBackground: {
    height: "10px",
    background: "#e5e7eb",
    borderRadius: "10px",
    overflow: "hidden",
  },

  progressBar: {
    height: "100%",
    background: "#4f46e5",
    borderRadius: "10px",
    transition: "width 0.4s ease",
  },

  tableWrapper: {
    overflowX: "auto",
  },

  table: {
    width: "100%",
    borderCollapse: "collapse",
    minWidth: "850px",
  },

  th: {
    textAlign: "left",
    padding: "14px",
    background: "#f8fafc",
    color: "#475569",
    fontSize: "13px",
    borderBottom: "1px solid #e2e8f0",
  },

  td: {
    padding: "15px 14px",
    borderBottom: "1px solid #eef2f7",
    color: "#475569",
  },

  momentBadge: {
    background: "#eef2ff",
    color: "#4f46e5",
    padding: "5px 10px",
    borderRadius: "12px",
    fontWeight: "600",
  },

  emptyState: {
    textAlign: "center",
    padding: "60px 20px",
    color: "#64748b",
  },

  emptyIcon: {
    fontSize: "50px",
    marginBottom: "10px",
  },

  insightBox: {
    background: "#eef2ff",
    padding: "22px",
    borderRadius: "16px",
    display: "flex",
    gap: "15px",
    alignItems: "flex-start",
    color: "#3730a3",
  },

  insightIcon: {
    fontSize: "28px",
  },

  errorBox: {
    maxWidth: "600px",
    margin: "80px auto",
    background: "#ffffff",
    padding: "40px",
    textAlign: "center",
    borderRadius: "18px",
    boxShadow:
      "0 4px 20px rgba(15, 23, 42, 0.08)",
  },

  errorIcon: {
    fontSize: "45px",
  },

  retryButton: {
    marginTop: "15px",
    padding: "11px 22px",
    border: "none",
    borderRadius: "9px",
    background: "#4f46e5",
    color: "white",
    cursor: "pointer",
    fontWeight: "600",
  },

  loadingIcon: {
    fontSize: "45px",
  },

  center: {
    padding: "100px",
    textAlign: "center",
    background: "#f7f8fc",
    minHeight: "100vh",
  },
};

export default EducatorAnalytics;