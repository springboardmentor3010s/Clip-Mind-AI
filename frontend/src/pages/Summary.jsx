import { useEffect, useState } from "react";
import {
  FaRobot,
  FaFileAlt,
  FaDownload,
  FaClock,
  FaCheckCircle,
  FaFileSignature,
  FaStar,
  FaChartBar,
} from "react-icons/fa";
import { useNavigate } from "react-router-dom";

import "../styles/Summary.css";

function Summary() {
  const navigate = useNavigate();

  const [video, setVideo] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    try {
      const savedSummary =
        localStorage.getItem("selectedSummary");

      console.log(
        "SUMMARY - selectedSummary:",
        savedSummary
      );

      if (savedSummary) {
        const parsed =
          JSON.parse(savedSummary);

        console.log(
          "SUMMARY - parsed:",
          parsed
        );

        setVideo(parsed);
      }
    } catch (error) {
      console.error(
        "Error loading selected summary:",
        error
      );
    } finally {
      setLoading(false);
    }
  }, []);

  const summary =
    video?.summary ||
    video?.summary_text ||
    video?.content ||
    "";

  const downloadSummary = () => {
    if (!summary) {
      alert("No summary available.");
      return;
    }

    const element =
      document.createElement("a");

    const file = new Blob(
      [summary],
      { type: "text/plain" }
    );

    element.href =
      URL.createObjectURL(file);

    element.download =
      "AI_Summary.txt";

    document.body.appendChild(element);

    element.click();

    document.body.removeChild(element);

    URL.revokeObjectURL(element.href);
  };

  if (loading) {
    return (
      <div className="summary-page">
        <h1>
          <FaRobot /> AI Summary
        </h1>

        <p>
          Loading summary...
        </p>
      </div>
    );
  }

  if (!video) {
    return (
      <div className="summary-page">

        <div className="summary-header">

          <h1>
            <FaRobot /> AI Summary
          </h1>

          <p>
            No selected lecture found.
          </p>

        </div>

        <div
          style={{
            textAlign: "center",
            marginTop: "30px",
          }}
        >
          <button
            className="download-btn"
            onClick={() =>
              navigate("/educator/my-lectures")
            }
          >
            Back to My Lectures
          </button>
        </div>

      </div>
    );
  }

  return (
    <div className="summary-page">

      {/* HEADER */}

      <div className="summary-header">

        <h1>
          <FaRobot /> AI Summary
        </h1>

        <p>
          AI Generated Summary using
          Whisper + BART
        </p>

      </div>

      {/* SUMMARY CARD */}

      <div className="summary-card">

        <div className="video-name">

          <FaFileAlt />

          <span>
            {video.title ||
              video.lecture_title ||
              video.filename ||
              "Lecture"}
          </span>

        </div>

        <div className="status">

          <FaCheckCircle />

          Processing Completed

        </div>

        <div className="summary-text">

          {summary ||
            "No Summary Available"}

        </div>

        <div className="summary-footer">

          <div>

            <FaClock />

            {video.processing_time ||
              video.processingTime ||
              0}{" "}
            sec

          </div>

          <button
            className="download-btn"
            onClick={downloadSummary}
          >

            <FaDownload />

            Download Summary

          </button>

        </div>

      </div>

      {/* ANALYTICS */}

      <div className="analytics-card">

        <h2>

          <FaChartBar />

          AI Analytics

        </h2>

        <div className="analytics-grid">

          <div className="analytics-box">

            <h3>
              {video.transcript_words ??
                video.transcriptWords ??
                0}
            </h3>

            <p>
              Transcript Words
            </p>

          </div>

          <div className="analytics-box">

            <h3>
              {video.summary_words ??
                video.summaryWords ??
                0}
            </h3>

            <p>
              Summary Words
            </p>

          </div>

          <div className="analytics-box">

            <h3>
              {video.compression_ratio ??
                video.compressionRatio ??
                0}
              %
            </h3>

            <p>
              Compression
            </p>

          </div>

          <div className="analytics-box">

            <h3>
              {video.processing_time ??
                video.processingTime ??
                0}s
            </h3>

            <p>
              Processing Time
            </p>

          </div>

        </div>

      </div>

      {/* ACTION BUTTONS */}

      <div
        style={{
          display: "flex",
          gap: "15px",
          justifyContent: "center",
          flexWrap: "wrap",
          marginTop: "25px",
        }}
      >

        <button
          className="download-btn"
          onClick={() =>
            navigate("/transcript")
          }
        >

          <FaFileSignature />

          View Transcript

        </button>

        <button
          className="download-btn"
          onClick={() =>
            navigate("/keymoments")
          }
        >

          <FaStar />

          View Key Moments

        </button>

        <button
          className="download-btn"
          onClick={() =>
            navigate("/educator/my-lectures")
          }
        >

          <FaFileAlt />

          Back to My Lectures

        </button>

      </div>

    </div>
  );
}

export default Summary;