import React, {
  useEffect,
  useState
} from "react";

import axios from "axios";
import API from "../../config";

const EducatorSummaries = () => {
  const [summaries, setSummaries] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedSummary, setSelectedSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchSummaries();
  }, []);

  const fetchSummaries = async () => {
    try {
      setLoading(true);

      const token =
  localStorage.getItem("access_token") ||
  localStorage.getItem("token");

      const response = await axios.get(
  `${API}/summaries`,
  {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  }
);

      console.log("SUMMARIES API RESPONSE:", response.data);

      setSummaries(
        Array.isArray(response.data)
          ? response.data
          : response.data.summaries || []
      );

      setError("");
    } catch (err) {
      console.error("Error fetching summaries:", err);

      setError("Unable to load summaries.");
      setSummaries([]);
    } finally {
      setLoading(false);
    }
  };

  // Get summary text from different possible backend field names
  const getSummaryText = (summary) => {
    return (
      summary.summary_text ||
      summary.summary ||
      summary.content ||
      summary.text ||
      summary.summary_content ||
      "No summary content available."
    );
  };

  // Get lecture information
  const getLectureName = (summary) => {
    return (
      summary.lecture_title ||
      summary.lecture_name ||
      (summary.lecture_id
        ? `Lecture ${summary.lecture_id}`
        : "Lecture")
    );
  };

  // Get course information
  const getCourseName = (summary) => {
    return (
      summary.course_title ||
      summary.course_name ||
      (summary.course_id
        ? `Course ${summary.course_id}`
        : "Course information unavailable")
    );
  };

  // Get date
  const getDate = (summary) => {
    const date =
      summary.created_at ||
      summary.generated_at ||
      summary.updated_at;

    if (!date) {
      return "Recently generated";
    }

    try {
      return new Date(date).toLocaleDateString();
    } catch {
      return "Recently generated";
    }
  };

  // Search summaries
  const filteredSummaries = summaries.filter((summary) => {
    const search = searchTerm.toLowerCase();

    const lecture = getLectureName(summary).toLowerCase();
    const course = getCourseName(summary).toLowerCase();
    const content = getSummaryText(summary).toLowerCase();

    return (
      lecture.includes(search) ||
      course.includes(search) ||
      content.includes(search) ||
      String(summary.id || "").includes(search) ||
      String(summary.lecture_id || "").includes(search)
    );
  });

  return (
    <div style={styles.container}>
      {/* Header */}
      <div style={styles.header}>
        <div>
          <h1 style={styles.title}>Summaries</h1>

          <p style={styles.subtitle}>
            View and search summaries generated from your lectures.
          </p>
        </div>

        <div style={styles.countBadge}>
          {summaries.length} Summary
          {summaries.length !== 1 ? "ies" : ""}
        </div>
      </div>

      {/* Search */}
      <div style={styles.searchContainer}>
        <span style={styles.searchIcon}>🔍</span>

        <input
          type="text"
          placeholder="Search summaries, lectures or courses..."
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
          <h3>Loading summaries...</h3>
        </div>
      ) : filteredSummaries.length === 0 ? (
        <div style={styles.emptyState}>
          <div style={styles.emptyIcon}>📋</div>

          <h2>
            {searchTerm
              ? "No matching summaries"
              : "No summaries found"}
          </h2>

          <p>
            {searchTerm
              ? "Try searching with another keyword."
              : "Generated lecture summaries will appear here."}
          </p>
        </div>
      ) : (
        <div style={styles.grid}>
          {filteredSummaries.map((summary) => {
            const lectureName = getLectureName(summary);
            const courseName = getCourseName(summary);
            const summaryText = getSummaryText(summary);

            return (
              <div key={summary.id} style={styles.card}>
                {/* Card Header */}
                <div style={styles.cardTop}>
                  <div style={styles.documentIcon}>📋</div>

                  <span style={styles.status}>
                    Generated
                  </span>
                </div>

                {/* Lecture */}
                <h3 style={styles.lectureTitle}>
                  {lectureName}
                </h3>

                {/* Course */}
                <p style={styles.course}>
                  📚 {courseName}
                </p>

                {/* Summary Preview */}
                <p style={styles.preview}>
                  {summaryText.length > 160
                    ? summaryText.substring(0, 160) + "..."
                    : summaryText}
                </p>

                {/* Bottom */}
                <div style={styles.cardBottom}>
                  <span style={styles.date}>
                    {getDate(summary)}
                  </span>

                  <button
                    style={styles.viewButton}
                    onClick={() =>
                      setSelectedSummary(summary)
                    }
                  >
                    Open Summary →
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Summary Modal */}
      {selectedSummary && (
        <div
          style={styles.overlay}
          onClick={() => setSelectedSummary(null)}
        >
          <div
            style={styles.modal}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div style={styles.modalHeader}>
              <div>
                <h2 style={styles.modalTitle}>
                  {getLectureName(selectedSummary)}
                </h2>

                <p style={styles.modalCourse}>
                  📚 {getCourseName(selectedSummary)}
                </p>
              </div>

              <button
                style={styles.closeButton}
                onClick={() => setSelectedSummary(null)}
              >
                ✕
              </button>
            </div>

            {/* Summary Content */}
            <div style={styles.summaryContent}>
              <h3>Lecture Summary</h3>

              <p>
                {getSummaryText(selectedSummary)}
              </p>
            </div>

            {/* Footer */}
            <div style={styles.modalFooter}>
              <span>
                Generated on {getDate(selectedSummary)}
              </span>

              <button
                style={styles.doneButton}
                onClick={() => setSelectedSummary(null)}
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
    minHeight: "72px",
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

  summaryContent: {
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

export default EducatorSummaries;
