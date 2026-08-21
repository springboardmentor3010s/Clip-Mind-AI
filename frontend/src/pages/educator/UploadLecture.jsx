import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "../../config";
import axios from "axios";
import {
  FaArrowLeft,
  FaVideo,
  FaUpload,
  FaBook,
  FaCheckCircle,
  FaSpinner,
} from "react-icons/fa";

function UploadLecture() {
  const navigate = useNavigate();

  const [courses, setCourses] = useState([]);
  const [selectedCourse, setSelectedCourse] = useState("");
  const [lectureTitle, setLectureTitle] = useState("");
  const [video, setVideo] = useState(null);

  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    try {
      const savedCourses =
        JSON.parse(localStorage.getItem("educatorCourses") || "[]");

      setCourses(Array.isArray(savedCourses) ? savedCourses : []);

      if (savedCourses.length > 0) {
        setSelectedCourse(String(savedCourses[0].id));
      }
    } catch (err) {
      console.error("Error loading courses:", err);
      setCourses([]);
    }
  }, []);

  const handleVideoChange = (e) => {
    const selected = e.target.files?.[0];

    setError("");
    setMessage("");

    if (!selected) {
      setVideo(null);
      return;
    }

    if (!selected.type.startsWith("video/")) {
      setError("Please select a valid video file.");
      setVideo(null);
      return;
    }

    setVideo(selected);
  };

  const getErrorMessage = (err) => {
    const status = err?.response?.status;
    const detail = err?.response?.data?.detail;

    console.error("HTTP STATUS:", status);
    console.error("DETAIL:", detail);

    if (status === 401) {
      return "Session expired. Please login again.";
    }

    if (status === 403) {
      return "You do not have permission. Please login as an Educator, Creator, Content Creator or Admin.";
    }

    if (status === 404) {
      return "Backend endpoint not found.";
    }

    if (Array.isArray(detail)) {
      return detail
        .map((item) => item?.msg || JSON.stringify(item))
        .join(", ");
    }

    if (detail && typeof detail === "object") {
      return detail.msg || JSON.stringify(detail);
    }

    if (typeof detail === "string") {
      return detail;
    }

    if (err?.message) {
      return err.message;
    }

    return "Upload or processing failed.";
  };

  const uploadLecture = async (e) => {
    e.preventDefault();

    setMessage("");
    setError("");

    if (!selectedCourse) {
      setError("Please select a course.");
      return;
    }

    if (!lectureTitle.trim()) {
      setError("Please enter a lecture title.");
      return;
    }

    if (!video) {
      setError("Please select a lecture video.");
      return;
    }

    const token = localStorage.getItem("access_token");

    if (!token) {
      setError("Please login again.");
      return;
    }

    setUploading(true);

    try {
      console.log("================================");
      console.log("CLIPMIND UPLOAD");
      console.log("API:", API);
      console.log("TOKEN EXISTS:", !!token);
      console.log("ROLE:", localStorage.getItem("userRole"));
      console.log("EMAIL:", localStorage.getItem("userEmail"));
      console.log("VIDEO:", video.name);
      console.log("================================");

      // ============================================
      // STEP 1 — UPLOAD
      // ============================================

      setMessage("Uploading lecture video...");

      const formData = new FormData();
      formData.append("file", video);

      const uploadResponse = await axios.post(
        `${API}/upload`,
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      console.log("UPLOAD RESPONSE:", uploadResponse.data);

      const uploadedFilename =
        uploadResponse.data?.filename ||
        uploadResponse.data?.file ||
        uploadResponse.data?.name ||
        video.name;

      if (!uploadedFilename) {
        throw new Error(
          "Upload succeeded but no filename was returned."
        );
      }

      // ============================================
      // STEP 2 — PROCESS
      // ============================================

      setMessage("Video uploaded. AI processing started...");

      const processResponse = await axios.post(
        `${API}/process-video`,
        null,
        {
          params: {
            filename: uploadedFilename,
          },
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      console.log(
        "PROCESS RESPONSE:",
        processResponse.data
      );

      const processed = processResponse.data || {};

      // ============================================
      // STEP 3 — SAVE LECTURE LOCALLY
      // ============================================

      const selectedCourseData = courses.find(
        (course) =>
          String(course.id) === String(selectedCourse)
      );

      let lectures = [];

      try {
        lectures =
          JSON.parse(
            localStorage.getItem("educatorLectures") || "[]"
          );

        if (!Array.isArray(lectures)) {
          lectures = [];
        }
      } catch {
        lectures = [];
      }

      const newLecture = {
        id: Date.now(),

        title: lectureTitle.trim(),

        courseId: selectedCourse,

        courseName:
          selectedCourseData?.name ||
          "Unknown Course",

        filename: uploadedFilename,

        uploadedBy:
          localStorage.getItem("userEmail") ||
          "educator@clipmind.ai",

        uploadedAt:
          new Date().toLocaleDateString(),

        transcript:
          processed.transcript || "",

        summary:
          processed.summary || "",

        keyMoments:
          processed.key_moments || [],

        keywords:
          processed.keywords || [],

        processingTime:
          processed.processing_time || 0,

        transcriptWords:
          processed.transcript_words || 0,

        summaryWords:
          processed.summary_words || 0,

        compressionRatio:
          processed.compression_ratio || 0,
      };

      lectures.push(newLecture);

      localStorage.setItem(
        "educatorLectures",
        JSON.stringify(lectures)
      );

      // ============================================
      // ALSO SAVE COMMON CLIPMIND DATA
      // ============================================

      localStorage.setItem(
        "selectedVideo",
        uploadedFilename
      );

      localStorage.setItem(
        "transcript",
        processed.transcript || ""
      );

      localStorage.setItem(
        "summary",
        processed.summary || ""
      );

      localStorage.setItem(
        "keyMoments",
        JSON.stringify(
          processed.key_moments || []
        )
      );

      localStorage.setItem(
        "keywords",
        JSON.stringify(
          processed.keywords || []
        )
      );

      localStorage.setItem(
        "processingTime",
        processed.processing_time || 0
      );

      localStorage.setItem(
        "transcriptWords",
        processed.transcript_words || 0
      );

      localStorage.setItem(
        "summaryWords",
        processed.summary_words || 0
      );

      localStorage.setItem(
        "compressionRatio",
        processed.compression_ratio || 0
      );

      // ============================================
      // SUCCESS
      // ============================================

      setMessage(
        "✓ Lecture uploaded and processed successfully!"
      );

      window.dispatchEvent(new Event("lectureUploaded"));

      setLectureTitle("");
      setVideo(null);

      const input =
        document.getElementById("lecture-video");

      if (input) {
        input.value = "";
      }

    } catch (err) {
      console.error(
        "UPLOAD LECTURE ERROR:",
        err
      );

      console.error(
        "BACKEND RESPONSE:",
        err?.response?.data
      );

      setError(
        getErrorMessage(err)
      );

    } finally {
      setUploading(false);
    }
  };

  return (
    <div style={styles.page}>

      <div style={styles.header}>

        <button
          style={styles.backButton}
          onClick={() => navigate("/educator")}
        >
          <FaArrowLeft />
          Back
        </button>

        <div>
          <h1 style={styles.title}>
            <FaVideo />
            Upload Lecture
          </h1>

          <p style={styles.subtitle}>
            Upload educational lectures and
            generate AI insights automatically.
          </p>
        </div>

      </div>

      <div style={styles.card}>

        <div style={styles.cardHeader}>

          <div style={styles.iconBox}>
            <FaVideo />
          </div>

          <div>
            <h2 style={styles.cardTitle}>
              Add Lecture
            </h2>

            <p style={styles.cardSubtitle}>
              Select a course and upload your lecture video.
            </p>
          </div>

        </div>

        <form onSubmit={uploadLecture}>

          <div style={styles.formGroup}>

            <label style={styles.label}>
              Select Course
            </label>

            {courses.length === 0 ? (

              <div style={styles.noCourse}>

                <FaBook />

                <span>
                  No courses available.
                  Please create a course first.
                </span>

                <button
                  type="button"
                  style={styles.smallButton}
                  onClick={() =>
                    navigate("/educator/create-course")
                  }
                >
                  Create Course
                </button>

              </div>

            ) : (

              <select
                value={selectedCourse}
                onChange={(e) =>
                  setSelectedCourse(e.target.value)
                }
                style={styles.select}
              >
                {courses.map((course) => (
                  <option
                    key={course.id}
                    value={course.id}
                  >
                    {course.name}
                  </option>
                ))}
              </select>

            )}

          </div>

          <div style={styles.formGroup}>

            <label style={styles.label}>
              Lecture Title
            </label>

            <input
              type="text"
              placeholder="e.g. Introduction to Science"
              value={lectureTitle}
              onChange={(e) =>
                setLectureTitle(e.target.value)
              }
              style={styles.input}
            />

          </div>

          <div style={styles.formGroup}>

            <label style={styles.label}>
              Lecture Video
            </label>

            <div style={styles.uploadBox}>

              <FaUpload style={styles.uploadIcon} />

              <p style={styles.uploadText}>
                Select your lecture video
              </p>

              <p style={styles.uploadHint}>
                MP4, AVI, MOV and other video formats
              </p>

              <label style={styles.chooseButton}>

                Choose Video

                <input
                  id="lecture-video"
                  type="file"
                  accept="video/*"
                  onChange={handleVideoChange}
                  style={{ display: "none" }}
                />

              </label>

              {video && (
                <div style={styles.fileName}>
                  ✓ {video.name}
                </div>
              )}

            </div>

          </div>

          <div style={styles.aiInfo}>

            <div style={styles.aiIcon}>
              🧠
            </div>

            <div>

              <h3 style={styles.aiTitle}>
                ClipMind AI Processing
              </h3>

              <p style={styles.aiText}>
                After upload, ClipMind AI automatically
                generates the transcript, summary,
                key moments and keywords.
              </p>

            </div>

          </div>

          <button
            type="submit"
            style={{
              ...styles.uploadButton,
              opacity: uploading ? 0.7 : 1,
            }}
            disabled={
              uploading ||
              courses.length === 0
            }
          >

            {uploading ? (
              <>
                <FaSpinner />
                Processing Lecture...
              </>
            ) : (
              <>
                <FaUpload />
                Upload & Process Lecture
              </>
            )}

          </button>

        </form>

        {message && (
          <div style={styles.success}>
            <FaCheckCircle />
            {message}
          </div>
        )}

        {error && (
          <div style={styles.error}>
            ⚠️ {error}
          </div>
        )}

      </div>

    </div>
  );
}

const styles = {
  page: {
    minHeight: "100vh",
    background: "#f5f7fb",
    padding: "30px",
    fontFamily: "Arial, sans-serif",
  },

  header: {
    display: "flex",
    alignItems: "center",
    gap: "20px",
    marginBottom: "30px",
  },

  backButton: {
    border: "none",
    background: "#e8ecf5",
    color: "#333",
    padding: "11px 17px",
    borderRadius: "8px",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    gap: "8px",
    fontWeight: "600",
  },

  title: {
    margin: "0",
    fontSize: "30px",
    color: "#222",
    display: "flex",
    alignItems: "center",
    gap: "10px",
  },

  subtitle: {
    margin: "6px 0 0",
    color: "#777",
    fontSize: "14px",
  },

  card: {
    maxWidth: "750px",
    margin: "0 auto",
    background: "#fff",
    padding: "35px",
    borderRadius: "16px",
    boxShadow: "0 5px 25px rgba(0,0,0,0.08)",
    boxSizing: "border-box",
  },

  cardHeader: {
    display: "flex",
    alignItems: "center",
    gap: "15px",
    paddingBottom: "20px",
    marginBottom: "25px",
    borderBottom: "1px solid #eee",
  },

  iconBox: {
    width: "50px",
    height: "50px",
    borderRadius: "12px",
    background: "#eef0ff",
    color: "#5b5ce2",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "22px",
  },

  cardTitle: {
    margin: "0",
    fontSize: "22px",
  },

  cardSubtitle: {
    margin: "5px 0 0",
    color: "#777",
    fontSize: "14px",
  },

  formGroup: {
    marginBottom: "23px",
  },

  label: {
    display: "block",
    marginBottom: "8px",
    fontWeight: "600",
    color: "#333",
    fontSize: "14px",
  },

  input: {
    width: "100%",
    padding: "13px",
    border: "1px solid #d9dce5",
    borderRadius: "8px",
    fontSize: "15px",
    boxSizing: "border-box",
  },

  select: {
    width: "100%",
    padding: "13px",
    border: "1px solid #d9dce5",
    borderRadius: "8px",
    fontSize: "15px",
    background: "#fff",
    boxSizing: "border-box",
  },

  uploadBox: {
    border: "2px dashed #cfd2e6",
    borderRadius: "12px",
    padding: "35px",
    textAlign: "center",
    background: "#fafaff",
  },

  uploadIcon: {
    fontSize: "35px",
    color: "#5b5ce2",
  },

  uploadText: {
    margin: "12px 0 5px",
    fontWeight: "600",
    color: "#333",
  },

  uploadHint: {
    margin: "0 0 18px",
    fontSize: "12px",
    color: "#888",
  },

  chooseButton: {
    display: "inline-block",
    background: "#eef0ff",
    color: "#5b5ce2",
    padding: "10px 18px",
    borderRadius: "8px",
    cursor: "pointer",
    fontWeight: "600",
  },

  fileName: {
    marginTop: "15px",
    color: "#187a3d",
    fontSize: "13px",
    fontWeight: "600",
  },

  noCourse: {
    padding: "15px",
    background: "#fff8e1",
    borderRadius: "8px",
    color: "#795548",
    display: "flex",
    alignItems: "center",
    gap: "10px",
    flexWrap: "wrap",
  },

  smallButton: {
    border: "none",
    background: "#5b5ce2",
    color: "#fff",
    padding: "8px 12px",
    borderRadius: "6px",
    cursor: "pointer",
  },

  aiInfo: {
    display: "flex",
    gap: "15px",
    padding: "18px",
    background: "#eef0ff",
    borderRadius: "10px",
    marginBottom: "25px",
  },

  aiIcon: {
    fontSize: "28px",
  },

  aiTitle: {
    margin: "0 0 5px",
    fontSize: "15px",
  },

  aiText: {
    margin: "0",
    color: "#666",
    fontSize: "13px",
    lineHeight: "1.5",
  },

  uploadButton: {
    width: "100%",
    padding: "14px",
    border: "none",
    borderRadius: "8px",
    background: "#5b5ce2",
    color: "#fff",
    cursor: "pointer",
    fontSize: "15px",
    fontWeight: "600",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    gap: "9px",
  },

  success: {
    marginTop: "20px",
    padding: "13px",
    background: "#e8f7ed",
    color: "#187a3d",
    borderRadius: "8px",
    display: "flex",
    alignItems: "center",
    gap: "8px",
    fontWeight: "600",
    fontSize: "14px",
  },

  error: {
    marginTop: "20px",
    padding: "13px",
    background: "#fff0f0",
    color: "#c62828",
    borderRadius: "8px",
    fontWeight: "600",
    fontSize: "14px",
  },
};

export default UploadLecture;