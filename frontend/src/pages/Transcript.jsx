import { useEffect, useState } from "react";
import {
  FaDownload,
  FaCheckCircle,
  FaSearch,
  FaCopy,
  FaFileAlt,
} from "react-icons/fa";
import { useNavigate } from "react-router-dom";

import "../styles/Transcript.css";

function Transcript() {
  const navigate = useNavigate();

  const [video, setVideo] = useState(null);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    try {
      const savedTranscript =
        localStorage.getItem(
          "selectedTranscript"
        );

      console.log(
        "TRANSCRIPT - selectedTranscript:",
        savedTranscript
      );

      if (savedTranscript) {
        const parsed =
          JSON.parse(savedTranscript);

        console.log(
          "TRANSCRIPT - parsed:",
          parsed
        );

        setVideo(parsed);
      }
    } catch (error) {
      console.error(
        "Error loading selected transcript:",
        error
      );
    } finally {
      setLoading(false);
    }
  }, []);

  const transcript =
    video?.transcript ||
    video?.transcript_text ||
    video?.content ||
    video?.text ||
    "";

  const downloadTranscript = () => {
    if (!transcript) {
      alert("No transcript available.");
      return;
    }

    const element =
      document.createElement("a");

    const file = new Blob(
      [transcript],
      { type: "text/plain" }
    );

    element.href =
      URL.createObjectURL(file);

    element.download =
      "Transcript.txt";

    document.body.appendChild(element);

    element.click();

    document.body.removeChild(element);

    URL.revokeObjectURL(element.href);
  };

  const copyTranscript = async () => {
    if (!transcript) {
      alert("No transcript available.");
      return;
    }

    try {
      await navigator.clipboard.writeText(
        transcript
      );

      alert("Transcript copied!");
    } catch (error) {
      console.error(
        "Copy failed:",
        error
      );

      alert("Unable to copy transcript.");
    }
  };

  const filteredTranscript =
    search.trim() === ""
      ? transcript
      : transcript
          .split(" ")
          .map((word) =>
            word
              .toLowerCase()
              .includes(
                search.toLowerCase()
              )
              ? `🔵 ${word}`
              : word
          )
          .join(" ");

  if (loading) {
    return (
      <div className="summary-page">

        <h1>
          <FaFileAlt />

          AI Transcript
        </h1>

        <p>
          Loading transcript...
        </p>

      </div>
    );
  }

  if (!video) {
    return (
      <div className="summary-page">

        <div className="summary-header">

          <h1>
            <FaFileAlt />

            AI Transcript
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
              navigate(
                "/educator/my-lectures"
              )
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

          <FaFileAlt />

          AI Transcript

        </h1>

        <p>

          {video.title ||
            video.lecture_title ||
            video.filename ||
            "Lecture"}

        </p>

      </div>

      {/* TRANSCRIPT */}

      <div className="summary-card">

        <div className="status">

          <FaCheckCircle />

          Processing Completed

        </div>

        {/* SEARCH */}

        <div className="search-box">

          <FaSearch />

          <input
            placeholder="Search transcript..."
            value={search}
            onChange={(e) =>
              setSearch(e.target.value)
            }
          />

        </div>

        {/* TEXT */}

        <div className="summary-text">

          {filteredTranscript ||
            "No Transcript Available"}

        </div>

        {/* ACTIONS */}

        <div className="summary-footer">

          <button
            className="download-btn"
            onClick={copyTranscript}
          >

            <FaCopy />

            Copy Transcript

          </button>

          <button
            className="download-btn"
            onClick={downloadTranscript}
          >

            <FaDownload />

            Download Transcript

          </button>

        </div>

      </div>

      {/* BACK */}

      <div
        style={{
          textAlign: "center",
          marginTop: "25px",
        }}
      >

        <button
          className="download-btn"
          onClick={() =>
            navigate(
              "/educator/my-lectures"
            )
          }
        >

          <FaFileAlt />

          Back to My Lectures

        </button>

      </div>

    </div>
  );
}

export default Transcript;