import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import API from "../../config";
import {
  FaVideo,
  FaFileAlt,
  FaSync,
  FaArrowLeft,
  FaClock,
  FaChartBar,
} from "react-icons/fa";

function MyLectures() {
  const navigate = useNavigate();

  const [lectures, setLectures] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  const loadLectures = async () => {
    setLoading(true);
    setMessage("");

    try {
      const token =
        localStorage.getItem("access_token") ||
        localStorage.getItem("token");

      const response = await axios.get(
  `${API}/videos`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      console.log("MY LECTURES API:", response.data);

      let data = Array.isArray(response.data)
        ? response.data
        : response.data.videos || response.data.lectures || [];

      /*
       * IMPORTANT:
       * UploadLecture already stores the fully processed
       * lecture in educatorLectures.
       *
       * Merge that information with /videos.
       */
      const savedLectures =
        JSON.parse(
          localStorage.getItem("educatorLectures")
        ) || [];

      const merged = data.map((video) => {
        const saved = savedLectures.find(
          (item) =>
            item.filename === video.filename ||
            item.filepath === video.filepath ||
            item.file_path === video.file_path ||
            String(item.id) === String(video.id)
        );

        return {
          ...video,
          ...(saved || {}),
        };
      });

      /*
       * If backend /videos does not return the lecture,
       * still show the successfully processed local lecture.
       */
      const finalLectures =
        merged.length > 0
          ? merged
          : savedLectures;

      setLectures(finalLectures);
    } catch (error) {
      console.error(
        "Error loading lectures:",
        error
      );

      /*
       * Even if /videos fails, use the processed
       * lecture saved by UploadLecture.
       */
      const savedLectures =
        JSON.parse(
          localStorage.getItem("educatorLectures")
        ) || [];

      if (savedLectures.length > 0) {
        setLectures(savedLectures);
        setMessage("");
      } else if (error.response?.status === 401) {
        setMessage(
          "Session expired. Please login again."
        );
      } else {
        setMessage(
          "Unable to load lectures."
        );
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLectures();
  }, []);

  /*
   * OPEN SUMMARY
   */
  const viewSummary = (lecture) => {
    localStorage.setItem(
      "selectedLecture",
      JSON.stringify(lecture)
    );

    localStorage.setItem(
      "selectedSummary",
      JSON.stringify({
        ...lecture,
        summary_text:
          lecture.summary ||
          lecture.summary_text ||
          lecture.content ||
          "",
        lecture_title:
          lecture.title ||
          lecture.lecture_title ||
          lecture.filename ||
          "Lecture",
        course_name:
          lecture.courseName ||
          lecture.course_name ||
          lecture.course_title ||
          "Course",
      })
    );

    navigate("/summary");
  };

  /*
   * OPEN TRANSCRIPT
   */
  const viewTranscript = (lecture) => {
    localStorage.setItem(
      "selectedLecture",
      JSON.stringify(lecture)
    );

    localStorage.setItem(
      "selectedTranscript",
      JSON.stringify({
        ...lecture,
        transcript_text:
          lecture.transcript ||
          lecture.transcript_text ||
          lecture.content ||
          lecture.text ||
          "",
        lecture_title:
          lecture.title ||
          lecture.lecture_title ||
          lecture.filename ||
          "Lecture",
        course_name:
          lecture.courseName ||
          lecture.course_name ||
          lecture.course_title ||
          "Course",
      })
    );

    navigate("/transcript");
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#f5f7fb",
        padding: "30px",
        fontFamily: "Arial, sans-serif",
      }}
    >
      {/* HEADER */}

      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "30px",
        }}
      >
        <div>
          <button
            onClick={() => navigate("/educator")}
            style={{
              border: "none",
              background: "transparent",
              cursor: "pointer",
              color: "#555",
              marginBottom: "10px",
              display: "flex",
              alignItems: "center",
              gap: "8px",
            }}
          >
            <FaArrowLeft />
            Back to Dashboard
          </button>

          <h1
            style={{
              margin: 0,
              color: "#1f2937",
            }}
          >
            My Lectures
          </h1>

          <p
            style={{
              color: "#6b7280",
              marginTop: "8px",
            }}
          >
            View and manage your uploaded lecture videos.
          </p>
        </div>

        <button
          onClick={loadLectures}
          style={{
            border: "none",
            background: "#4f46e5",
            color: "white",
            padding: "12px 20px",
            borderRadius: "8px",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: "8px",
            fontWeight: "600",
          }}
        >
          <FaSync />
          Refresh
        </button>
      </div>

      {/* MESSAGE */}

      {message && (
        <div
          style={{
            background: "#fee2e2",
            color: "#991b1b",
            padding: "15px",
            borderRadius: "8px",
            marginBottom: "20px",
          }}
        >
          {message}
        </div>
      )}

      {/* LOADING */}

      {loading && (
        <div
          style={{
            background: "white",
            padding: "50px",
            textAlign: "center",
            borderRadius: "12px",
          }}
        >
          <FaSync />
          <p>Loading lectures...</p>
        </div>
      )}

      {/* EMPTY */}

      {!loading &&
        lectures.length === 0 &&
        !message && (
          <div
            style={{
              background: "white",
              padding: "60px 30px",
              textAlign: "center",
              borderRadius: "12px",
              boxShadow:
                "0 2px 10px rgba(0,0,0,0.05)",
            }}
          >
            <FaVideo
              size={45}
              style={{
                color: "#9ca3af",
                marginBottom: "15px",
              }}
            />

            <h2>No lectures found</h2>

            <p style={{ color: "#6b7280" }}>
              Upload your first lecture to see it here.
            </p>

            <button
              onClick={() =>
                navigate(
                  "/educator/upload-lecture"
                )
              }
              style={{
                marginTop: "15px",
                border: "none",
                background: "#4f46e5",
                color: "white",
                padding: "12px 22px",
                borderRadius: "8px",
                cursor: "pointer",
                fontWeight: "600",
              }}
            >
              Upload Lecture
            </button>
          </div>
        )}

      {/* LECTURE LIST */}

      {!loading && lectures.length > 0 && (
        <div
          style={{
            display: "grid",
            gridTemplateColumns:
              "repeat(auto-fit, minmax(320px, 1fr))",
            gap: "20px",
          }}
        >
          {lectures.map((lecture, index) => {
            const transcriptWords =
              lecture.transcript_words ??
              lecture.transcriptWords ??
              0;

            const summaryWords =
              lecture.summary_words ??
              lecture.summaryWords ??
              0;

            const compression =
              lecture.compression_ratio ??
              lecture.compressionRatio ??
              0;

            const processingTime =
              lecture.processing_time ??
              lecture.processingTime ??
              0;

            return (
              <div
                key={lecture.id || index}
                style={{
                  background: "white",
                  borderRadius: "12px",
                  padding: "22px",
                  boxShadow:
                    "0 2px 10px rgba(0,0,0,0.06)",
                }}
              >
                {/* TITLE */}

                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "12px",
                    marginBottom: "15px",
                  }}
                >
                  <div
                    style={{
                      width: "45px",
                      height: "45px",
                      borderRadius: "10px",
                      background: "#eef2ff",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <FaVideo color="#4f46e5" />
                  </div>

                  <div>
                    <h3
                      style={{
                        margin: 0,
                        color: "#1f2937",
                      }}
                    >
                      {lecture.title ||
                        lecture.filename ||
                        "Lecture"}
                    </h3>

                    <small
                      style={{
                        color: "#6b7280",
                      }}
                    >
                      Uploaded by{" "}
                      {lecture.uploaded_by ||
                        lecture.uploadedBy ||
                        "Educator"}
                    </small>
                  </div>
                </div>

                {/* STATISTICS */}

                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns:
                      "1fr 1fr",
                    gap: "10px",
                    marginBottom: "20px",
                  }}
                >
                  <div
                    style={{
                      background: "#f9fafb",
                      padding: "12px",
                      borderRadius: "8px",
                    }}
                  >
                    <small>Transcript</small>

                    <strong
                      style={{
                        display: "block",
                        marginTop: "5px",
                      }}
                    >
                      {transcriptWords} words
                    </strong>
                  </div>

                  <div
                    style={{
                      background: "#f9fafb",
                      padding: "12px",
                      borderRadius: "8px",
                    }}
                  >
                    <small>Summary</small>

                    <strong
                      style={{
                        display: "block",
                        marginTop: "5px",
                      }}
                    >
                      {summaryWords} words
                    </strong>
                  </div>

                  <div
                    style={{
                      background: "#f9fafb",
                      padding: "12px",
                      borderRadius: "8px",
                    }}
                  >
                    <small>
                      <FaChartBar /> Compression
                    </small>

                    <strong
                      style={{
                        display: "block",
                        marginTop: "5px",
                      }}
                    >
                      {compression}%
                    </strong>
                  </div>

                  <div
                    style={{
                      background: "#f9fafb",
                      padding: "12px",
                      borderRadius: "8px",
                    }}
                  >
                    <small>
                      <FaClock /> Processing
                    </small>

                    <strong
                      style={{
                        display: "block",
                        marginTop: "5px",
                      }}
                    >
                      {processingTime}s
                    </strong>
                  </div>
                </div>

                {/* ACTIONS */}

                <div
                  style={{
                    display: "flex",
                    gap: "10px",
                  }}
                >
                  <button
                    onClick={() =>
                      viewSummary(lecture)
                    }
                    style={{
                      flex: 1,
                      border: "none",
                      background: "#4f46e5",
                      color: "white",
                      padding: "10px",
                      borderRadius: "7px",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      justifyContent:
                        "center",
                      gap: "6px",
                    }}
                  >
                    <FaFileAlt />
                    Summary
                  </button>

                  <button
                    onClick={() =>
                      viewTranscript(lecture)
                    }
                    style={{
                      flex: 1,
                      border:
                        "1px solid #4f46e5",
                      background: "white",
                      color: "#4f46e5",
                      padding: "10px",
                      borderRadius: "7px",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      justifyContent:
                        "center",
                      gap: "6px",
                    }}
                  >
                    Transcript
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default MyLectures;
