import React, { useEffect, useState } from "react";
import axios from "axios";
import API from "../../config";

const EducatorTranscripts = () => {
  const [transcripts, setTranscripts] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedTranscript, setSelectedTranscript] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchTranscripts();
  }, []);

const fetchTranscripts = async () => {
  try {
    setLoading(true);

    const token = localStorage.getItem("access_token");

    const response = await axios.get(
      `${API}/transcripts`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    console.log("TRANSCRIPTS API URL:", `${API}/transcripts`);
    console.log("TRANSCRIPTS API RESPONSE:", response.data);

    setTranscripts(
      Array.isArray(response.data)
        ? response.data
        : response.data.transcripts || []
    );

    setError("");
  } catch (err) {
    console.error("Error fetching transcripts:", err);
    console.error("TRANSCRIPT ERROR RESPONSE:", err.response?.data);

    setError("Unable to load transcripts.");
    setTranscripts([]);
  } finally {
    setLoading(false);
  }
};

  // Get transcript text regardless of backend field name
  const getTranscriptText = (transcript) => {
    return (
      transcript.transcript_text ||
      transcript.transcript ||
      transcript.content ||
      transcript.text ||
      transcript.transcript_content ||
      "No transcript content available."
    );
  };

  // Get lecture information
  const getLectureName = (transcript) => {
    return (
      transcript.lecture_title ||
      transcript.lecture_name ||
      (transcript.lecture_id
        ? `Lecture ${transcript.lecture_id}`
        : "Lecture")
    );
  };

  // Get course information
  const getCourseName = (transcript) => {
    return (
      transcript.course_title ||
      transcript.course_name ||
      (transcript.course_id
        ? `Course ${transcript.course_id}`
        : "Course information unavailable")
    );
  };

  // Get date
  const getDate = (transcript) => {
    const date =
      transcript.created_at ||
      transcript.generated_at ||
      transcript.updated_at;

    if (!date) {
      return "Recently generated";
    }

    try {
      return new Date(date).toLocaleDateString();
    } catch {
      return "Recently generated";
    }
  };

  // Search
  const filteredTranscripts = transcripts.filter((transcript) => {
    const search = searchTerm.toLowerCase();

    const lecture = getLectureName(transcript).toLowerCase();
    const course = getCourseName(transcript).toLowerCase();
    const content = getTranscriptText(transcript).toLowerCase();

    return (
      lecture.includes(search) ||
      course.includes(search) ||
      content.includes(search) ||
      String(transcript.id || "").includes(search) ||
      String(transcript.lecture_id || "").includes(search)
    );
  });

  return (
    <div style={styles.container}>
      {/* Header */}
      <div style={styles.header}>
        <div>
          <h1 style={styles.title}>Transcripts</h1>

          <p style={styles.subtitle}>
            View and search transcripts generated from your lectures.
          </p>
        </div>

        <div style={styles.countBadge}>
          {transcripts.length} Transcript
          {transcripts.length !== 1 ? "s" : ""}
        </div>
      </div>

      {/* Search */}
      <div style={styles.searchContainer}>
        <span style={styles.searchIcon}>🔍</span>

        <input
          type="text"
          placeholder="Search transcripts, lectures or courses..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          style={styles.searchInput}
        />
      </div>

      {/* Error */}
      {error && <div style={styles.error}>{error}</div>}

      {/* Loading */}
      {loading ? (
        <div style={styles.emptyState}>
          <div style={styles.spinner}>⏳</div>
          <h3>Loading transcripts...</h3>
        </div>
      ) : filteredTranscripts.length === 0 ? (
        <div style={styles.emptyState}>
          <div style={styles.emptyIcon}>📝</div>

          <h2>
            {searchTerm ? "No matching transcripts" : "No transcripts found"}
          </h2>

          <p>
            {searchTerm
              ? "Try searching with another keyword."
              : "Generated lecture transcripts will appear here."}
          </p>
        </div>
      ) : (
        <div style={styles.grid}>
          {filteredTranscripts.map((transcript) => {
            const lectureName = getLectureName(transcript);
            const courseName = getCourseName(transcript);
            const transcriptText = getTranscriptText(transcript);

            return (
              <div key={transcript.id} style={styles.card}>
                {/* Card Header */}
                <div style={styles.cardTop}>
                  <div style={styles.documentIcon}>📄</div>

                  <span style={styles.status}>Generated</span>
                </div>

                {/* Lecture */}
                <h3 style={styles.lectureTitle}>
                  {lectureName}
                </h3>

                {/* Course */}
                <p style={styles.course}>
                  📚 {courseName}
                </p>

                {/* Preview */}
                <p style={styles.preview}>
                  {transcriptText.length > 140
                    ? transcriptText.substring(0, 140) + "..."
                    : transcriptText}
                </p>

                {/* Bottom */}
                <div style={styles.cardBottom}>
                  <span style={styles.date}>
                    {getDate(transcript)}
                  </span>

                  <button
                    style={styles.viewButton}
                    onClick={() =>
                      setSelectedTranscript(transcript)
                    }
                  >
                    Open Transcript →
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Transcript Modal */}
      {selectedTranscript && (
        <div
          style={styles.overlay}
          onClick={() => setSelectedTranscript(null)}
        >
          <div
            style={styles.modal}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div style={styles.modalHeader}>
              <div>
                <h2 style={styles.modalTitle}>
                  {getLectureName(selectedTranscript)}
                </h2>

                <p style={styles.modalCourse}>
                  📚 {getCourseName(selectedTranscript)}
                </p>
              </div>

              <button
                style={styles.closeButton}
                onClick={() => setSelectedTranscript(null)}
              >
                ✕
              </button>
            </div>

            {/* Transcript */}
            <div style={styles.transcriptContent}>
              <h3>Lecture Transcript</h3>

              <p>
                {getTranscriptText(selectedTranscript)}
              </p>
            </div>

            {/* Footer */}
            <div style={styles.modalFooter}>
              <span>
                Generated on {getDate(selectedTranscript)}
              </span>

              <button
                style={styles.doneButton}
                onClick={() => setSelectedTranscript(null)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const styles = {
  container: {
    padding: "32px",
    minHeight: "100vh",
    background: "#f8fafc",
    color: "#172033",
  },

  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "28px",
  },

  title: {
    margin: 0,
    fontSize: "30px",
    fontWeight: "700",
  },

  subtitle: {
    marginTop: "8px",
    color: "#64748b",
    fontSize: "15px",
  },

  countBadge: {
    background: "#eef2ff",
    color: "#4f46e5",
    padding: "10px 16px",
    borderRadius: "20px",
    fontSize: "14px",
    fontWeight: "600",
  },

  searchContainer: {
    display: "flex",
    alignItems: "center",
    background: "#ffffff",
    border: "1px solid #e2e8f0",
    borderRadius: "12px",
    padding: "0 16px",
    marginBottom: "28px",
    maxWidth: "650px",
  },

  searchIcon: {
    fontSize: "18px",
  },

  searchInput: {
    width: "100%",
    border: "none",
    outline: "none",
    padding: "15px 12px",
    fontSize: "15px",
    background: "transparent",
  },

  error: {
    background: "#fef2f2",
    color: "#dc2626",
    padding: "12px 16px",
    borderRadius: "10px",
    marginBottom: "20px",
  },

  grid: {
    display: "grid",
    gridTemplateColumns:
      "repeat(auto-fill, minmax(320px, 1fr))",
    gap: "22px",
  },

  card: {
    background: "#ffffff",
    border: "1px solid #e2e8f0",
    borderRadius: "16px",
    padding: "22px",
    boxShadow: "0 4px 12px rgba(15, 23, 42, 0.04)",
  },

  cardTop: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "18px",
  },

  documentIcon: {
    width: "44px",
    height: "44px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: "#eef2ff",
    borderRadius: "10px",
    fontSize: "22px",
  },

  status: {
    color: "#16a34a",
    background: "#f0fdf4",
    padding: "6px 10px",
    borderRadius: "15px",
    fontSize: "12px",
    fontWeight: "600",
  },

  lectureTitle: {
    fontSize: "18px",
    margin: "0 0 8px",
  },

  course: {
    color: "#4f46e5",
    fontSize: "14px",
    marginBottom: "14px",
  },

  preview: {
    color: "#64748b",
    fontSize: "14px",
    lineHeight: "1.6",
    minHeight: "66px",
  },

  cardBottom: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: "18px",
    paddingTop: "16px",
    borderTop: "1px solid #f1f5f9",
  },

  date: {
    color: "#94a3b8",
    fontSize: "12px",
  },

  viewButton: {
    border: "none",
    background: "#4f46e5",
    color: "#ffffff",
    padding: "9px 13px",
    borderRadius: "8px",
    cursor: "pointer",
    fontWeight: "600",
    fontSize: "13px",
  },

  emptyState: {
    textAlign: "center",
    padding: "80px 20px",
    color: "#64748b",
  },

  emptyIcon: {
    fontSize: "48px",
    marginBottom: "15px",
  },

  spinner: {
    fontSize: "35px",
  },

  overlay: {
    position: "fixed",
    inset: 0,
    background: "rgba(15, 23, 42, 0.65)",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    padding: "20px",
    zIndex: 1000,
  },

  modal: {
    background: "#ffffff",
    borderRadius: "18px",
    width: "100%",
    maxWidth: "850px",
    maxHeight: "85vh",
    overflow: "hidden",
    boxShadow: "0 25px 60px rgba(0,0,0,0.25)",
  },

  modalHeader: {
    padding: "24px",
    borderBottom: "1px solid #e2e8f0",
    display: "flex",
    justifyContent: "space-between",
  },

  modalTitle: {
    margin: 0,
    fontSize: "22px",
  },

  modalCourse: {
    color: "#4f46e5",
    marginTop: "8px",
  },

  closeButton: {
    border: "none",
    background: "#f1f5f9",
    width: "38px",
    height: "38px",
    borderRadius: "50%",
    cursor: "pointer",
    fontSize: "16px",
  },

  transcriptContent: {
    padding: "28px",
    overflowY: "auto",
    maxHeight: "55vh",
    lineHeight: "1.8",
    color: "#334155",
  },

  modalFooter: {
    padding: "18px 24px",
    borderTop: "1px solid #e2e8f0",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    color: "#94a3b8",
    fontSize: "13px",
  },

  doneButton: {
    background: "#4f46e5",
    color: "#ffffff",
    border: "none",
    padding: "9px 18px",
    borderRadius: "8px",
    cursor: "pointer",
    fontWeight: "600",
  },
};

export default EducatorTranscripts;
