import React, { useEffect, useState } from "react";
import axios from "axios";
import API from "../../config";

const EducatorInsights = () => {
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadInsights = async () => {
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

      const data = Array.isArray(response.data)
        ? response.data
        : [];

      setVideos(data);

      console.log("Content Insights data:", data);
    } catch (err) {
      console.error("Content Insights error:", err);

      if (err.response?.status === 401) {
        setError("Session expired. Please login again.");
      } else if (err.response?.status === 403) {
        setError("You do not have permission to access insights.");
      } else {
        setError("Unable to load content insights.");
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadInsights();
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

  const averageSummaryRatio =
    totalTranscriptWords > 0
      ? (
          (totalSummaryWords /
            totalTranscriptWords) *
          100
        ).toFixed(1)
      : "0.0";

  const averageCompression =
    videos.length > 0
      ? (
          videos.reduce(
            (sum, video) =>
              sum +
              Number(video.compression_ratio || 0),
            0
          ) / videos.length
        ).toFixed(2)
      : "0.00";

  const longestContent =
    videos.length > 0
      ? videos.reduce((longest, video) =>
          Number(video.transcript_words || 0) >
          Number(longest.transcript_words || 0)
            ? video
            : longest
        )
      : null;

  const highestSummary =
    videos.length > 0
      ? videos.reduce((highest, video) =>
          Number(video.summary_words || 0) >
          Number(highest.summary_words || 0)
            ? video
            : highest
        )
      : null;

  const contentReadiness =
    totalVideos > 0
      ? Math.round(
          (
            (transcriptCount / totalVideos) * 100 +
            (summaryCount / totalVideos) * 100 +
            (keyMomentCount / totalVideos) * 100
          ) / 3
        )
      : 0;

  if (loading) {
    return (
      <div style={styles.center}>
        <div style={styles.loadingIcon}>💡</div>

        <h2>Loading Content Insights...</h2>

        <p>
          Analyzing your processed lectures.
        </p>
      </div>
    );
  }

  return (
    <div style={styles.page}>

      <div style={styles.header}>
        <div>
          <h1 style={styles.title}>
            💡 Content Insights
          </h1>

          <p style={styles.subtitle}>
            AI-powered insights based on your
            processed educational content.
          </p>
        </div>

        <button
          style={styles.refreshButton}
          onClick={loadInsights}
        >
          ↻ Refresh
        </button>
      </div>

      {error && (
        <div style={styles.error}>
          ⚠️ {error}
        </div>
      )}

      <div style={styles.grid}>

        <InsightCard
          icon="📚"
          title="Content Volume"
          value={totalTranscriptWords.toLocaleString()}
          description={
            totalVideos > 0
              ? `${totalVideos} processed lecture${
                  totalVideos !== 1 ? "s" : ""
                } contain approximately ${totalTranscriptWords.toLocaleString()} transcript words.`
              : "No processed lecture content available yet."
          }
        />

        <InsightCard
          icon="📝"
          title="Summary Volume"
          value={totalSummaryWords.toLocaleString()}
          description={
            totalVideos > 0
              ? `AI summaries contain approximately ${totalSummaryWords.toLocaleString()} words.`
              : "Generate lecture summaries to see insights."
          }
        />

        <InsightCard
          icon="📉"
          title="Summary Ratio"
          value={`${averageSummaryRatio}%`}
          description="Summary words compared with total transcript words."
        />

        <InsightCard
          icon="⭐"
          title="Key Moment Lectures"
          value={keyMomentCount}
          description={`${keyMomentCount} lecture${
            keyMomentCount !== 1 ? "s" : ""
          } contain detected key moments.`}
        />

        <InsightCard
          icon="📈"
          title="Content Readiness"
          value={`${contentReadiness}%`}
          description="Average availability of transcripts, summaries and key moments."
        />

        <InsightCard
          icon="⚙️"
          title="Avg Compression"
          value={`${averageCompression}%`}
          description="Average compression value returned by the processing pipeline."
        />

      </div>

      {totalVideos > 0 && (
        <>
          <section style={styles.section}>
            <h2 style={styles.sectionTitle}>
              🔎 Content Analysis
            </h2>

            <div style={styles.analysisGrid}>

              <div style={styles.analysisCard}>
                <span>Longest Lecture</span>

                <strong>
                  {longestContent
                    ? longestContent.filename
                    : "N/A"}
                </strong>

                <small>
                  {longestContent
                    ? `${Number(
                        longestContent.transcript_words || 0
                      ).toLocaleString()} transcript words`
                    : ""}
                </small>
              </div>

              <div style={styles.analysisCard}>
                <span>Largest AI Summary</span>

                <strong>
                  {highestSummary
                    ? highestSummary.filename
                    : "N/A"}
                </strong>

                <small>
                  {highestSummary
                    ? `${Number(
                        highestSummary.summary_words || 0
                      ).toLocaleString()} summary words`
                    : ""}
                </small>
              </div>

              <div style={styles.analysisCard}>
                <span>Transcript Coverage</span>

                <strong>
                  {transcriptCount}/{totalVideos}
                </strong>

                <small>
                  lectures have transcript content
                </small>
              </div>

              <div style={styles.analysisCard}>
                <span>Summary Coverage</span>

                <strong>
                  {summaryCount}/{totalVideos}
                </strong>

                <small>
                  lectures have AI summaries
                </small>
              </div>

            </div>
          </section>

          <section style={styles.section}>
            <h2 style={styles.sectionTitle}>
              💡 Educator Recommendations
            </h2>

            {transcriptCount < totalVideos && (
              <Recommendation
                title="Complete Missing Transcripts"
                text="Some lectures do not currently contain transcript content. Process those lectures to improve learner accessibility."
              />
            )}

            {summaryCount < totalVideos && (
              <Recommendation
                title="Generate More AI Summaries"
                text="Adding summaries can make long lectures easier for learners to review and revise."
              />
            )}

            {keyMomentCount < totalVideos && (
              <Recommendation
                title="Add Key Moments"
                text="Key moments can help learners quickly navigate important parts of a lecture."
              />
            )}

            {contentReadiness >= 80 && (
              <Recommendation
                title="Content Readiness Is Strong"
                text="Most of your processed lectures contain the main AI-generated learning resources."
              />
            )}
          </section>

          <div style={styles.note}>
            <strong>ℹ️ Important:</strong>{" "}
            These insights describe the quality and
            availability of processed learning content.
            They are not direct measurements of student
            watch time, completion, or interaction.
          </div>
        </>
      )}

      {totalVideos === 0 && (
        <div style={styles.empty}>
          <div style={{ fontSize: "50px" }}>
            📭
          </div>

          <h2>No Content Insights Yet</h2>

          <p>
            Upload and process a lecture to generate
            content insights.
          </p>
        </div>
      )}

    </div>
  );
};

const InsightCard = ({
  icon,
  title,
  value,
  description,
}) => (
  <div style={styles.card}>

    <div style={styles.cardIcon}>
      {icon}
    </div>

    <h3>{title}</h3>

    <div style={styles.cardValue}>
      {value}
    </div>

    <p>{description}</p>

  </div>
);

const Recommendation = ({
  title,
  text,
}) => (
  <div style={styles.recommendation}>
    <strong>{title}</strong>
    <p>{text}</p>
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

  refreshButton: {
    border: "none",
    background: "#4f46e5",
    color: "white",
    padding: "10px 18px",
    borderRadius: "8px",
    cursor: "pointer",
    fontWeight: "600",
  },

  grid: {
    display: "grid",
    gridTemplateColumns:
      "repeat(auto-fit, minmax(240px, 1fr))",
    gap: "20px",
    marginBottom: "25px",
  },

  card: {
    background: "white",
    padding: "24px",
    borderRadius: "16px",
    boxShadow:
      "0 4px 16px rgba(0,0,0,0.06)",
  },

  cardIcon: {
    fontSize: "28px",
    marginBottom: "10px",
  },

  cardValue: {
    fontSize: "30px",
    fontWeight: "700",
    color: "#4f46e5",
    margin: "8px 0",
  },

"card p": {
  color: "#64748b",
  lineHeight: "1.5",
},

  section: {
    background: "white",
    padding: "25px",
    borderRadius: "16px",
    marginBottom: "25px",
    boxShadow:
      "0 4px 16px rgba(0,0,0,0.05)",
  },

  sectionTitle: {
    marginTop: 0,
    color: "#172033",
  },

  analysisGrid: {
    display: "grid",
    gridTemplateColumns:
      "repeat(auto-fit, minmax(220px, 1fr))",
    gap: "15px",
  },

  analysisCard: {
    padding: "18px",
    background: "#f8fafc",
    borderRadius: "12px",
    display: "flex",
    flexDirection: "column",
    gap: "7px",
  },

  recommendation: {
    padding: "16px 0",
    borderBottom: "1px solid #eee",
  },

  note: {
    padding: "16px",
    background: "#eff6ff",
    color: "#1e40af",
    borderRadius: "10px",
    lineHeight: "1.6",
  },

  empty: {
    background: "white",
    padding: "60px",
    textAlign: "center",
    borderRadius: "16px",
  },

  error: {
    background: "#fee2e2",
    color: "#991b1b",
    padding: "14px",
    borderRadius: "10px",
    marginBottom: "20px",
  },

  center: {
    minHeight: "100vh",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    background: "#f7f8fc",
  },

  loadingIcon: {
    fontSize: "45px",
  },
};

export default EducatorInsights;