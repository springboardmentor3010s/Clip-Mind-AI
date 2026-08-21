import React, { useEffect, useState } from "react";
import axios from "axios";
import API from "../../config";

function StudentEngagement() {
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadData = async () => {
    try {
      setLoading(true);
      setError("");

      const token = localStorage.getItem("access_token");

      if (!token) {
        setError("Authentication token not found. Please login again.");
        setVideos([]);
        return;
      }

      console.log("========== STUDENT ENGAGEMENT ==========");
      console.log("API:", API);
      console.log("URL:", `${API}/videos`);

      const response = await axios.get(`${API}/videos`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      console.log("VIDEOS RESPONSE:", response.data);

      const data = Array.isArray(response.data)
        ? response.data
        : [];

      setVideos(data);
    } catch (error) {
      console.error("Student engagement error:", error);
      console.error(
        "Student engagement response:",
        error.response?.data
      );

      if (error.response?.status === 401) {
        setError("Session expired. Please login again.");
      } else if (error.response?.status === 403) {
        setError("You do not have permission to access this data.");
      } else {
        setError("Unable to load engagement data.");
      }

      setVideos([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // --------------------------------------------------
  // CONTENT METRICS
  // --------------------------------------------------

  const totalLectures = videos.length;

  const transcriptCount = videos.filter((video) => {
    return (
      video.transcript ||
      Number(video.transcript_words || 0) > 0
    );
  }).length;

  const summaryCount = videos.filter((video) => {
    return (
      video.summary ||
      Number(video.summary_words || 0) > 0
    );
  }).length;

  const keyMomentCount = videos.filter((video) => {
    if (!video.key_moments) {
      return false;
    }

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

  const totalTranscriptWords = videos.reduce(
    (sum, video) =>
      sum + Number(video.transcript_words || 0),
    0
  );

  // --------------------------------------------------
  // COVERAGE
  // --------------------------------------------------

  const transcriptCoverage =
    totalLectures > 0
      ? Math.round(
          (transcriptCount / totalLectures) * 100
        )
      : 0;

  const summaryCoverage =
    totalLectures > 0
      ? Math.round(
          (summaryCount / totalLectures) * 100
        )
      : 0;

  const keyMomentCoverage =
    totalLectures > 0
      ? Math.round(
          (keyMomentCount / totalLectures) * 100
        )
      : 0;

  // This measures content readiness, not real student activity.
  const contentScore =
    totalLectures > 0
      ? Math.round(
          (
            transcriptCoverage +
            summaryCoverage +
            keyMomentCoverage
          ) / 3
        )
      : 0;

  const getScoreLabel = () => {
    if (contentScore >= 80) return "Excellent";
    if (contentScore >= 50) return "Good";
    if (contentScore > 0) return "Needs Improvement";
    return "No Data";
  };

  const getScoreColor = () => {
    if (contentScore >= 80) return "#16a34a";
    if (contentScore >= 50) return "#2563eb";
    if (contentScore > 0) return "#f59e0b";
    return "#6b7280";
  };

  return (
    <div style={styles.page}>

      {/* HEADER */}

      <div style={styles.header}>
        <div>
          <h1 style={styles.title}>
            👥 Student Engagement
          </h1>

          <p style={styles.subtitle}>
            Monitor learning content activity and
            engagement readiness.
          </p>
        </div>

        <button
          style={styles.refreshButton}
          onClick={loadData}
          disabled={loading}
        >
          ↻ Refresh
        </button>
      </div>

      {/* ERROR */}

      {error && (
        <div style={styles.error}>
          ⚠️ {error}
        </div>
      )}

      {loading ? (
        <div style={styles.loading}>
          <div style={styles.loadingIcon}>
            ⏳
          </div>

          <h3>
            Loading engagement data...
          </h3>

          <p>
            Please wait while ClipMind AI loads
            your lecture information.
          </p>
        </div>
      ) : (
        <>
          {/* STATISTICS */}

          <div style={styles.cards}>

            {/* LECTURES */}

            <div style={styles.card}>
              <div
                style={{
                  ...styles.icon,
                  background: "#eef2ff",
                }}
              >
                🎬
              </div>

              <div>
                <h2 style={styles.number}>
                  {totalLectures}
                </h2>

                <p style={styles.label}>
                  Processed Lectures
                </p>
              </div>
            </div>

            {/* CONTENT SCORE */}

            <div style={styles.card}>
              <div
                style={{
                  ...styles.icon,
                  background: "#ecfdf5",
                }}
              >
                📊
              </div>

              <div>
                <h2
                  style={{
                    ...styles.number,
                    color: getScoreColor(),
                  }}
                >
                  {contentScore}%
                </h2>

                <p style={styles.label}>
                  Content Engagement Score
                </p>

                <small
                  style={{
                    color: getScoreColor(),
                    fontWeight: "600",
                  }}
                >
                  {getScoreLabel()}
                </small>
              </div>
            </div>

            {/* TRANSCRIPT WORDS */}

            <div style={styles.card}>
              <div
                style={{
                  ...styles.icon,
                  background: "#fff7ed",
                }}
              >
                📝
              </div>

              <div>
                <h2 style={styles.number}>
                  {totalTranscriptWords.toLocaleString()}
                </h2>

                <p style={styles.label}>
                  Learning Content Words
                </p>
              </div>
            </div>

            {/* KEY MOMENTS */}

            <div style={styles.card}>
              <div
                style={{
                  ...styles.icon,
                  background: "#fdf2f8",
                }}
              >
                ⭐
              </div>

              <div>
                <h2 style={styles.number}>
                  {keyMomentCount}
                </h2>

                <p style={styles.label}>
                  Lectures With Key Moments
                </p>
              </div>
            </div>
          </div>

          {/* CONTENT COVERAGE */}

          <div style={styles.section}>
            <h2 style={styles.sectionTitle}>
              📈 Learning Content Coverage
            </h2>

            <p style={styles.sectionDescription}>
              Track how many lectures contain the AI
              learning resources needed by students.
            </p>

            <div style={styles.progressContainer}>
              <div style={styles.progressHeader}>
                <span>Transcripts</span>
                <strong>
                  {transcriptCount}/{totalLectures}
                </strong>
              </div>

              <div style={styles.progressBackground}>
                <div
                  style={{
                    ...styles.progressBar,
                    width: `${transcriptCoverage}%`,
                  }}
                />
              </div>
            </div>

            <div style={styles.progressContainer}>
              <div style={styles.progressHeader}>
                <span>AI Summaries</span>
                <strong>
                  {summaryCount}/{totalLectures}
                </strong>
              </div>

              <div style={styles.progressBackground}>
                <div
                  style={{
                    ...styles.progressBar,
                    width: `${summaryCoverage}%`,
                  }}
                />
              </div>
            </div>

            <div style={styles.progressContainer}>
              <div style={styles.progressHeader}>
                <span>Key Moments</span>
                <strong>
                  {keyMomentCount}/{totalLectures}
                </strong>
              </div>

              <div style={styles.progressBackground}>
                <div
                  style={{
                    ...styles.progressBar,
                    width: `${keyMomentCoverage}%`,
                  }}
                />
              </div>
            </div>
          </div>

          {/* LECTURES */}

          <div style={styles.section}>
            <div style={styles.sectionHeader}>
              <div>
                <h2 style={styles.sectionTitle}>
                  📚 Lecture Engagement
                </h2>

                <p style={styles.sectionDescription}>
                  Review the learning resources available
                  for each processed lecture.
                </p>
              </div>
            </div>

            {videos.length === 0 ? (
              <div style={styles.empty}>
                <div style={{ fontSize: 50 }}>
                  📭
                </div>

                <h3>
                  No engagement data yet
                </h3>

                <p>
                  Upload and process lectures to
                  generate engagement insights.
                </p>
              </div>
            ) : (
              <div>
                {videos.map((video) => {
                  const hasTranscript =
                    video.transcript ||
                    Number(video.transcript_words || 0) > 0;

                  const hasSummary =
                    video.summary ||
                    Number(video.summary_words || 0) > 0;

                  let hasKeyMoments = false;

                  if (video.key_moments) {
                    try {
                      const moments =
                        typeof video.key_moments === "string"
                          ? JSON.parse(video.key_moments)
                          : video.key_moments;

                      hasKeyMoments =
                        Array.isArray(moments)
                          ? moments.length > 0
                          : true;
                    } catch {
                      hasKeyMoments = true;
                    }
                  }

                  const resourceCount = [
                    hasTranscript,
                    hasSummary,
                    hasKeyMoments,
                  ].filter(Boolean).length;

                  return (
                    <div
                      key={video.id}
                      style={styles.video}
                    >
                      <div style={styles.videoInfo}>
                        <strong style={styles.videoTitle}>
                          🎥{" "}
                          {video.filename ||
                            video.title ||
                            `Lecture ${video.id}`}
                        </strong>

                        <p style={styles.videoWords}>
                          {Number(
                            video.transcript_words || 0
                          ).toLocaleString()}{" "}
                          transcript words
                        </p>

                        <div style={styles.badges}>
                          <span
                            style={
                              hasTranscript
                                ? styles.badgeActive
                                : styles.badgeInactive
                            }
                          >
                            {hasTranscript
                              ? "✓ Transcript"
                              : "○ Transcript"}
                          </span>

                          <span
                            style={
                              hasSummary
                                ? styles.badgeActive
                                : styles.badgeInactive
                            }
                          >
                            {hasSummary
                              ? "✓ Summary"
                              : "○ Summary"}
                          </span>

                          <span
                            style={
                              hasKeyMoments
                                ? styles.badgeActive
                                : styles.badgeInactive
                            }
                          >
                            {hasKeyMoments
                              ? "✓ Key Moments"
                              : "○ Key Moments"}
                          </span>
                        </div>
                      </div>

                      <div style={styles.resourceScore}>
                        <strong>
                          {resourceCount}/3
                        </strong>

                        <span>
                          Resources
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* RECOMMENDATIONS */}

          <div style={styles.section}>
            <h2 style={styles.sectionTitle}>
              💡 Educator Recommendations
            </h2>

            <div style={styles.tip}>
              <strong>
                📌 Use Key Moments
              </strong>

              <p>
                Highlight important sections of
                lectures to help learners revise
                faster.
              </p>
            </div>

            <div style={styles.tip}>
              <strong>
                📝 Use AI Summaries
              </strong>

              <p>
                Provide concise summaries for
                quick learning and revision.
              </p>
            </div>

            <div style={styles.tip}>
              <strong>
                📊 Monitor Content
              </strong>

              <p>
                Review analytics regularly to
                understand content effectiveness.
              </p>
            </div>

            <div style={styles.note}>
              <strong>
                ℹ️ About this score
              </strong>

              <p>
                The current score measures learning
                content readiness based on transcripts,
                AI summaries, and key moments. It does
                not represent actual student watch time,
                views, or completion activity.
              </p>
            </div>
          </div>
        </>
      )}
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
    gap: "20px",
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
    marginBottom: 0,
  },

  refreshButton: {
    border: "none",
    background: "#2563eb",
    color: "white",
    padding: "11px 18px",
    borderRadius: "10px",
    cursor: "pointer",
    fontWeight: "600",
    fontSize: "14px",
  },

  error: {
    background: "#fee2e2",
    color: "#991b1b",
    padding: "14px 18px",
    borderRadius: "10px",
    marginBottom: "20px",
  },

  loading: {
    background: "white",
    padding: "60px",
    textAlign: "center",
    borderRadius: "15px",
    boxShadow: "0 3px 15px rgba(0,0,0,0.05)",
  },

  loadingIcon: {
    fontSize: "40px",
    marginBottom: "10px",
  },

  cards: {
    display: "grid",
    gridTemplateColumns:
      "repeat(auto-fit, minmax(220px, 1fr))",
    gap: "20px",
    marginBottom: "30px",
  },

  card: {
    background: "white",
    padding: "22px",
    borderRadius: "15px",
    display: "flex",
    alignItems: "center",
    gap: "18px",
    boxShadow:
      "0 3px 15px rgba(0,0,0,0.07)",
  },

  icon: {
    width: "52px",
    height: "52px",
    borderRadius: "13px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "25px",
    flexShrink: 0,
  },

  number: {
    margin: 0,
    fontSize: "27px",
    color: "#111827",
  },

  label: {
    margin: "5px 0 0",
    color: "#6b7280",
    fontSize: "14px",
  },

  section: {
    background: "white",
    padding: "25px",
    borderRadius: "15px",
    marginBottom: "25px",
    boxShadow:
      "0 3px 15px rgba(0,0,0,0.05)",
  },

  sectionHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  },

  sectionTitle: {
    margin: "0 0 8px",
    color: "#111827",
  },

  sectionDescription: {
    color: "#6b7280",
    marginTop: 0,
    marginBottom: "20px",
    lineHeight: 1.6,
  },

  progressContainer: {
    marginBottom: "20px",
  },

  progressHeader: {
    display: "flex",
    justifyContent: "space-between",
    marginBottom: "8px",
    color: "#374151",
    fontSize: "14px",
  },

  progressBackground: {
    height: "9px",
    background: "#e5e7eb",
    borderRadius: "10px",
    overflow: "hidden",
  },

  progressBar: {
    height: "100%",
    background: "#2563eb",
    borderRadius: "10px",
    transition: "width 0.4s ease",
  },

  video: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "20px",
    padding: "18px 0",
    borderBottom: "1px solid #eee",
  },

  videoInfo: {
    flex: 1,
  },

  videoTitle: {
    color: "#111827",
    fontSize: "15px",
  },

  videoWords: {
    color: "#6b7280",
    margin: "7px 0",
    fontSize: "13px",
  },

  badges: {
    display: "flex",
    flexWrap: "wrap",
    gap: "8px",
    marginTop: "8px",
  },

  badgeActive: {
    background: "#dcfce7",
    color: "#166534",
    padding: "5px 9px",
    borderRadius: "15px",
    fontSize: "12px",
    fontWeight: "600",
  },

  badgeInactive: {
    background: "#f3f4f6",
    color: "#6b7280",
    padding: "5px 9px",
    borderRadius: "15px",
    fontSize: "12px",
  },

  resourceScore: {
    minWidth: "80px",
    textAlign: "center",
    display: "flex",
    flexDirection: "column",
    gap: "3px",
    color: "#2563eb",
  },

  empty: {
    textAlign: "center",
    padding: "40px",
    color: "#6b7280",
  },

  tip: {
    padding: "15px 0",
    borderBottom: "1px solid #eee",
  },

  note: {
    marginTop: "20px",
    padding: "15px",
    background: "#eff6ff",
    color: "#1e40af",
    borderRadius: "10px",
  },
};

export default StudentEngagement;