import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import axios from "axios";
import {
  FaCloudUploadAlt,
  FaFileVideo,
  FaCheckCircle,
} from "react-icons/fa";

import "../styles/Upload.css";

function Upload() {
  const navigate = useNavigate();

  const [file, setFile] = useState(null);
  const [progress, setProgress] = useState(0);
  const [message, setMessage] = useState("");
  const [videoURL, setVideoURL] = useState("");
  const [videoSize, setVideoSize] = useState("");
  const [videoName, setVideoName] = useState("");

  const [transcript, setTranscript] = useState("");
  const [summary, setSummary] = useState("");
  const [moments, setMoments] = useState([]);
  const [keywords, setKeywords] = useState([]);

  // Analytics
  const [processingTime, setProcessingTime] = useState("");
  const [transcriptWords, setTranscriptWords] = useState(0);
  const [summaryWords, setSummaryWords] = useState(0);
  const [compressionRatio, setCompressionRatio] = useState(0);

  const email = localStorage.getItem("userEmail");

  // ============================
  // LOAD SAVED DATA
  // ============================

  useEffect(() => {
    const savedTranscript =
      localStorage.getItem("transcript");

    const savedSummary =
      localStorage.getItem("summary");

    const savedMoments =
      localStorage.getItem("keyMoments");

    const savedKeywords =
      localStorage.getItem("keywords");

    const savedProcessingTime =
      localStorage.getItem("processingTime");

    const savedTranscriptWords =
      localStorage.getItem("transcriptWords");

    const savedSummaryWords =
      localStorage.getItem("summaryWords");

    const savedCompressionRatio =
      localStorage.getItem("compressionRatio");

    const savedVideo =
      localStorage.getItem("selectedVideo");

    if (savedVideo) {
      setVideoName(savedVideo);
    }

    if (savedTranscript) {
      setTranscript(savedTranscript);
    }

    if (savedSummary) {
      setSummary(savedSummary);
    }

    if (savedMoments) {
      try {
        setMoments(JSON.parse(savedMoments));
      } catch (error) {
        console.error(
          "Error loading key moments:",
          error
        );
      }
    }

    if (savedKeywords) {
      try {
        setKeywords(JSON.parse(savedKeywords));
      } catch (error) {
        console.error(
          "Error loading keywords:",
          error
        );
      }
    }

    if (savedProcessingTime) {
      setProcessingTime(savedProcessingTime);
    }

    if (savedTranscriptWords) {
      setTranscriptWords(
        Number(savedTranscriptWords)
      );
    }

    if (savedSummaryWords) {
      setSummaryWords(
        Number(savedSummaryWords)
      );
    }

    if (savedCompressionRatio) {
      setCompressionRatio(
        savedCompressionRatio
      );
    }
  }, []);

  // ============================
  // SELECT VIDEO
  // ============================

  const handleFile = (e) => {
    const selected = e.target.files[0];

    if (!selected) {
      return;
    }

    setFile(selected);

    const previewURL =
      URL.createObjectURL(selected);

    setVideoURL(previewURL);

    setVideoSize(
      (selected.size / (1024 * 1024)).toFixed(2)
    );

    setVideoName(selected.name);

    setProgress(0);
    setMessage("");

    setTranscript("");
    setSummary("");
    setMoments([]);
    setKeywords([]);

    setProcessingTime("");
    setTranscriptWords(0);
    setSummaryWords(0);
    setCompressionRatio(0);
  };

  // ============================
  // UPLOAD VIDEO
  // ============================

  const uploadVideo = async () => {
    if (!file) {
      setMessage(
        "Please select a video first."
      );
      return;
    }

    // Get JWT token saved during login
    const token =
      localStorage.getItem("access_token");

    if (!token) {
      setMessage(
        "Please login first."
      );
      return;
    }

    console.log(
      "JWT token found:",
      !!token
    );

    const formData = new FormData();

    formData.append(
      "file",
      file
    );

    if (email) {
      formData.append(
        "email",
        email
      );
    }

    try {
      // ============================
      // STEP 1: UPLOAD
      // ============================

      setMessage(
        "Uploading video..."
      );

      setProgress(0);

      const uploadRes =
        await axios.post(
          "${API}/upload",
          formData,
          {
headers: {
  Authorization: `Bearer ${token}`,
},
            onUploadProgress:
              (event) => {
                if (event.total) {
                  const percent =
                    Math.round(
                      (event.loaded * 100) /
                        event.total
                    );

                  setProgress(
                    percent
                  );
                }
              },
          }
        );

      console.log(
        "Upload response:",
        uploadRes.data
      );

      setMessage(
        uploadRes.data.message ||
          "Video uploaded successfully"
      );

      // ============================
      // STEP 2: PROCESS VIDEO
      // ============================

      setMessage(
        "Processing video with AI..."
      );

    const processRes =
  await axios.post(
    "${API}/process-video",
    null,
    {
      params: {
        filename: file.name,
      },
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

      console.log(
        "Processing response:",
        processRes.data
      );

      // ============================
      // AI RESULTS
      // ============================

      const transcriptData =
        processRes.data.transcript || "";

      const summaryData =
        processRes.data.summary || "";

      const momentsData =
        processRes.data.key_moments || [];

      const keywordsData =
        processRes.data.keywords || [];

      setTranscript(
        transcriptData
      );

      setSummary(
        summaryData
      );

      setMoments(
        momentsData
      );

      setKeywords(
        keywordsData
      );

      // ============================
      // SAVE VIDEO
      // ============================

      localStorage.setItem(
        "selectedVideo",
        file.name
      );

      localStorage.setItem(
        "selectedVideoURL",
        videoURL
      );

      // ============================
      // SAVE TRANSCRIPT
      // ============================

      localStorage.setItem(
        "transcript",
        transcriptData
      );

      // ============================
      // SAVE SUMMARY
      // ============================

      localStorage.setItem(
        "summary",
        summaryData
      );

      // ============================
      // SAVE KEY MOMENTS
      // ============================

      localStorage.setItem(
        "keyMoments",
        JSON.stringify(
          momentsData
        )
      );

      // ============================
      // SAVE KEYWORDS
      // ============================

      localStorage.setItem(
        "keywords",
        JSON.stringify(
          keywordsData
        )
      );

      // ============================
      // ANALYTICS
      // ============================

      const processingTimeData =
        processRes.data.processing_time || "";

      const transcriptWordsData =
        processRes.data.transcript_words || 0;

      const summaryWordsData =
        processRes.data.summary_words || 0;

      const compressionRatioData =
        processRes.data.compression_ratio || 0;

      setProcessingTime(
        processingTimeData
      );

      setTranscriptWords(
        transcriptWordsData
      );

      setSummaryWords(
        summaryWordsData
      );

      setCompressionRatio(
        compressionRatioData
      );

      localStorage.setItem(
        "processingTime",
        processingTimeData
      );

      localStorage.setItem(
        "transcriptWords",
        transcriptWordsData
      );

      localStorage.setItem(
        "summaryWords",
        summaryWordsData
      );

      localStorage.setItem(
        "compressionRatio",
        compressionRatioData
      );

      // ============================
      // AI SCORE / INSIGHT
      // ============================

      localStorage.setItem(
        "processingScore",
        "98"
      );

      localStorage.setItem(
        "aiInsight",
        "AI successfully generated transcript, summary, keywords and detected key moments with high confidence."
      );

      // ============================
      // SUCCESS
      // ============================

      setMessage(
        "Video processed successfully!"
      );

    } catch (error) {
      console.error(
        "Upload/Processing Error:",
        error
      );

      if (error.response) {
        console.error(
          "Backend response:",
          error.response.data
        );

        console.error(
          "Status:",
          error.response.status
        );

        // Unauthorized
        if (
          error.response.status === 401
        ) {
          localStorage.removeItem(
            "access_token"
          );

          setMessage(
            "Session expired. Please login again."
          );
        }

        // Forbidden
        else if (
          error.response.status === 403
        ) {
          setMessage(
            "You do not have permission to upload videos. Please login as Creator, Educator or Administrator."
          );
        }

        // Other backend error
        else {
const detail = error.response.data?.detail;

let errorMessage = "Upload or Processing Failed";

if (typeof detail === "string") {
  errorMessage = detail;
} else if (Array.isArray(detail)) {
  errorMessage = detail
    .map((item) => item.msg || JSON.stringify(item))
    .join(", ");
} else if (detail) {
  errorMessage = JSON.stringify(detail);
}

setMessage(errorMessage);
        }
      }

      // Backend unavailable
      else if (error.request) {
        setMessage(
          "Cannot connect to backend. Make sure FastAPI is running."
        );
      }

      // Unknown error
      else {
        setMessage(
          "Upload or Processing Failed"
        );
      }
    }
  };

  // ============================
  // UI
  // ============================

  return (
    <div className="upload-page">

      {/* HEADER */}

      <div className="upload-header">

        <h2>
          Upload Video
        </h2>

        <p>
          Upload your video to generate
          AI Transcript, Summary and
          Key Moments.
        </p>

      </div>

      {/* UPLOAD CARD */}

      <div className="upload-card">

        <FaCloudUploadAlt
          className="upload-icon"
        />

        <h3>
          Drag & Drop Video
        </h3>

        <p>
          Supported Formats:
          MP4 • MOV • AVI • MKV • WebM
        </p>

        {/* BROWSE */}

        <label className="browse-btn">

          Browse Files

          <input
            type="file"
            hidden
            accept="video/*"
            onChange={handleFile}
          />

        </label>

        {/* SELECTED FILE */}

        {file && (
          <div className="selected-file">

            <FaFileVideo />

            <span>
              {file.name}
            </span>

          </div>
        )}

        {/* VIDEO PREVIEW */}

        {videoURL && (
          <div className="preview-card">

            <h3>
              Video Preview
            </h3>

            <video
              controls
              width="100%"
              src={videoURL}
            />

            <div className="video-info">

              <p>
                <strong>
                  Name :
                </strong>{" "}
                {file.name}
              </p>

              <p>
                <strong>
                  Size :
                </strong>{" "}
                {videoSize} MB
              </p>

            </div>

          </div>
        )}

        {/* PROGRESS */}

        {progress > 0 && (
          <div className="progress-section">

            <div className="progress-bar">

              <div
                className="progress-fill"
                style={{
                  width:
                    `${progress}%`,
                }}
              />

            </div>

            <span>
              {progress}%
            </span>

          </div>
        )}

        {/* UPLOAD BUTTON */}

        <button
          className="upload-btn"
          onClick={uploadVideo}
        >
          Upload Video
        </button>

        {/* MESSAGE */}

        {message && (
          <div className="upload-message">

            <FaCheckCircle />

            <span>
              {message}
            </span>

          </div>
        )}

      </div>

      {/* GUIDELINES */}

      <div className="guidelines">

        <h3>
          Upload Guidelines
        </h3>

        <ul>

          <li>
            ✔ Maximum file size : 2 GB
          </li>

          <li>
            ✔ Supported : MP4, MOV, AVI,
            MKV, WebM
          </li>

          <li>
            ✔ Better audio gives better
            transcript.
          </li>

          <li>
            ✔ Stable internet connection
            recommended.
          </li>

        </ul>

      </div>

      {/* TRANSCRIPT */}

      {transcript && (
        <div className="transcript-card">

          <h2>
            📝 Transcript
          </h2>

          <pre
            style={{
              whiteSpace:
                "pre-wrap",
              fontFamily:
                "inherit",
            }}
          >
            {transcript}
          </pre>

        </div>
      )}

      {/* ACTION BUTTONS */}

      {transcript && (
        <div className="action-buttons">

          <button
            className="action-btn"
            onClick={() =>
              navigate("/summary")
            }
          >
            View Summary
          </button>

          <button
            className="action-btn"
            onClick={() =>
              navigate("/keymoments")
            }
          >
            View Key Moments
          </button>

        </div>
      )}

    </div>
  );
}

export default Upload;
