import React, { useEffect, useState } from "react";
import axios from "axios";
import API from "../../config";

const EducatorReports = () => {
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadReports = async () => {
    try {
      setLoading(true);
      setError("");

      const token = localStorage.getItem("access_token");

      if (!token) {
        setError("Authentication token not found. Please login again.");
        return;
      }

      const response = await axios.get(`${API}/videos`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      console.log("Reports data:", response.data);

      setVideos(
        Array.isArray(response.data)
          ? response.data
          : []
      );
    } catch (err) {
      console.error("Reports error:", err);

      if (err.response?.status === 401) {
        setError("Session expired. Please login again.");
      } else if (err.response?.status === 403) {
        setError("You do not have permission to access reports.");
      } else {
        setError("Unable to load reports.");
      }

      setVideos([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReports();
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

  const transcriptCount = videos.filter(
    (video) =>
      video.transcript ||
      Number(video.transcript_words || 0) > 0
  ).length;

  const summaryCount = videos.filter(
    (video) =>
      video.summary ||
      Number(video.summary_words || 0) > 0
  ).length;

  const keyMomentCount = videos.filter((video) => {
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

  const averageCompression =
    totalVideos > 0
      ? (
          videos.reduce(
            (sum, video) =>
              sum +
              Number(video.compression_ratio || 0),
            0
          ) / totalVideos
        ).toFixed(2)
      : "0.00";

  const averageProcessing =
    totalVideos > 0
      ? (
          videos.reduce(
            (sum, video) =>
              sum +
              Number(video.processing_time || 0),
            0
          ) / totalVideos
        ).toFixed(2)
      : "0.00";

  const exportReport = () => {
    if (videos.length === 0) {
      alert("There is no report data to export.");
      return;
    }

    const rows = [
      [
        "Lecture",
        "Transcript Words",
        "Summary Words",
        "Key Moments",
        "Compression %",
        "Processing Time (s)",
      ],
      ...videos.map((video) => {
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

        return [
          video.filename ||
            video.title ||
            `Video ${video.id}`,
          Number(video.transcript_words || 0),
          Number(video.summary_words || 0),
          momentCount,
          Number(video.compression_ratio || 0).toFixed(2),
          Number(video.processing_time || 0).toFixed(2),
        ];
      }),
    ];

    const csv = rows
      .map((row) =>
        row
          .map((value) =>
            `"${String(value).replace(/"/g, '""')}"`
          )
          .join(",")
      )
      .join("\n");

    const blob = new Blob([csv], {
      type: "text/csv;charset=utf-8;",
    });

    const url = window.URL.createObjectURL(blob);

    const link = document.createElement("a");
    link.href = url;
    link.download = "clipmind-educator-report.csv";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    window.URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div style={styles.center}>
        <div style={styles.loadingIcon}>📋</div>

        <h2>Loading Reports...</h2>

        <p>
          Preparing your educator report.
        </p>
      </div>
    );
  }

  return (
    <div style={styles.page}>

      <div style={styles.header}>
        <div>
          <h1 style={styles.title}>
            📋 Educator Reports
          </h1>

          <p style={styles.subtitle}>
            Detailed report of your processed
            educational content.
          </p>
        </div>

        <div style={styles.headerActions}>
          <button
            style={styles.refreshButton}
            onClick={loadReports}
          >
            ↻ Refresh
          </button>

          <button
            style={styles.exportButton}
            onClick={exportReport}
            disabled={videos.length === 0}
          >
            ⬇ Export CSV
          </button>
        </div>
      </div>

      {error && (
        <div style={styles.error}>
          ⚠️ {error}
        </div>
      )}

      <div style={styles.summaryGrid}>

        <ReportCard
          title="Total Lectures"
          value={totalVideos}
          icon="🎬"
        />

        <ReportCard
          title="Transcript Words"
          value={totalTranscriptWords.toLocaleString()}
          icon="📝"
        />

        <ReportCard
          title="Summary Words"
          value={totalSummaryWords.toLocaleString()}
          icon="📚"
        />

        <ReportCard
          title="Key Moment Lectures"
          value={keyMomentCount}
          icon="⭐"
        />

        <ReportCard
          title="Avg Compression"
          value={`${averageCompression}%`}
          icon="📉"
        />

        <ReportCard
          title="Avg Processing"
          value={`${averageProcessing}s`}
          icon="⚙️"
        />
      </div>

      <section style={styles.section}>

        <div style={styles.sectionHeader}>
          <div>
            <h2 style={styles.sectionTitle}>
              📊 Lecture Processing Report
            </h2>

            <p style={styles.sectionSubtitle}>
              Detailed information for every processed lecture.
            </p>
          </div>
        </div>

        {videos.length === 0 ? (
          <div style={styles.empty}>
            <div style={{ fontSize: "50px" }}>
              📭
            </div>

            <h3>No reports available</h3>

            <p>
              Process a lecture to generate
              your first report.
            </p>
          </div>
        ) : (
          <div style={styles.tableWrapper}>
            <table style={styles.table}>

              <thead>
                <tr>
                  <th style={styles.th}>Lecture</th>
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
                          🎥{" "}
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
                        <span style={styles.badge}>
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
      </section>

      {videos.length > 0 && (
        <section style={styles.insightSection}>

          <h2 style={styles.sectionTitle}>
            📌 Report Summary
          </h2>

          <p>
            You have processed{" "}
            <strong>{totalVideos}</strong>{" "}
            lecture{totalVideos !== 1 ? "s" : ""} containing{" "}
            <strong>
              {totalTranscriptWords.toLocaleString()}
            </strong>{" "}
            transcript words.
          </p>

          <p>
            AI summaries contain approximately{" "}
            <strong>
              {totalSummaryWords.toLocaleString()}
            </strong>{" "}
            words.
          </p>

          <p>
            {transcriptCount} of {totalVideos} lectures
            have transcripts, {summaryCount} have
            summaries, and {keyMomentCount} have
            detected key moments.
          </p>

          <div style={styles.note}>
            ℹ️ These reports describe processed
            learning content. They do not represent
            real student watch time or completion
            unless student activity tracking is
            implemented.
          </div>

        </section>
      )}
    </div>
  );
};

const ReportCard = ({
  title,
  value,
  icon,
}) => (
  <div style={styles.card}>

    <div style={styles.cardIcon}>
      {icon}
    </div>

    <div>
      <p style={styles.cardTitle}>
        {title}
      </p>

      <h2 style={styles.cardValue}>
        {value}
      </h2>
    </div>

  </div>
);

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
    gap: "20px",
    marginBottom: "30px",
  },

  title: {
    margin: 0,
    fontSize: "30px",
    color: "#172033",
  },

  subtitle: {
    color: "#64748b",
    marginTop: "8px",
  },

  headerActions: {
    display: "flex",
    gap: "10px",
  },

  refreshButton: {
    border: "none",
    background: "#4f46e5",
    color: "white",
    padding: "10px 16px",
    borderRadius: "8px",
    cursor: "pointer",
    fontWeight: "600",
  },

  exportButton: {
    border: "none",
    background: "#059669",
    color: "white",
    padding: "10px 16px",
    borderRadius: "8px",
    cursor: "pointer",
    fontWeight: "600",
  },

  summaryGrid: {
    display: "grid",
    gridTemplateColumns:
      "repeat(auto-fit, minmax(190px, 1fr))",
    gap: "18px",
    marginBottom: "30px",
  },

  card: {
    background: "#fff",
    padding: "22px",
    borderRadius: "15px",
    display: "flex",
    alignItems: "center",
    gap: "15px",
    boxShadow:
      "0 4px 15px rgba(0,0,0,0.07)",
  },

  cardIcon: {
    fontSize: "30px",
    width: "50px",
    height: "50px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: "#f1f5ff",
    borderRadius: "12px",
  },

  cardTitle: {
    margin: 0,
    color: "#777",
    fontSize: "13px",
  },

  cardValue: {
    margin: "5px 0 0",
    fontSize: "25px",
    color: "#4f46e5",
  },

  section: {
    background: "#fff",
    padding: "25px",
    borderRadius: "16px",
    boxShadow:
      "0 4px 15px rgba(0,0,0,0.06)",
  },

  sectionHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "20px",
  },

  sectionTitle: {
    margin: 0,
    color: "#172033",
  },

  sectionSubtitle: {
    color: "#64748b",
    marginTop: "6px",
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
    borderBottom: "1px solid #e2e8f0",
    color: "#475569",
    fontSize: "13px",
  },

  td: {
    padding: "15px",
    borderBottom: "1px solid #eef2f7",
    color: "#475569",
  },

  badge: {
    background: "#eef2ff",
    color: "#4f46e5",
    padding: "5px 10px",
    borderRadius: "12px",
    fontWeight: "600",
  },

  empty: {
    textAlign: "center",
    padding: "50px",
    color: "#64748b",
  },

  insightSection: {
    marginTop: "25px",
    background: "#fff",
    padding: "25px",
    borderRadius: "16px",
    boxShadow:
      "0 4px 15px rgba(0,0,0,0.06)",
  },

  note: {
    marginTop: "20px",
    padding: "15px",
    background: "#eff6ff",
    color: "#1e40af",
    borderRadius: "10px",
    lineHeight: "1.6",
  },

  error: {
    background: "#fee2e2",
    color: "#991b1b",
    padding: "13px",
    borderRadius: "8px",
    marginBottom: "20px",
  },

  center: {
    minHeight: "100vh",
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
    alignItems: "center",
    background: "#f7f8fc",
  },

  loadingIcon: {
    fontSize: "45px",
  },
};

export default EducatorReports;