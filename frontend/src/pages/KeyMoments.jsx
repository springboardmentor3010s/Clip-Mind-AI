import { useEffect, useRef, useState } from "react";
import {
  FaStar,
  FaClock,
  FaSearch,
  FaDownload,
  FaPlay,
  FaCopy,
  FaHeart,
  FaFileExport,
} from "react-icons/fa";

import jsPDF from "jspdf";
import "../styles/KeyMoments.css";
import API from "../config";

function KeyMoments() {
  const [moments, setMoments] = useState([]);
  const [videoName, setVideoName] = useState("");
  const [videoURL, setVideoURL] = useState("");
  const [search, setSearch] = useState("");
  const [favorites, setFavorites] = useState([]);

  const videoRef = useRef(null);

    useEffect(() => {

    const loadProcessedVideo = async () => {

      try {

        const token =
          localStorage.getItem("access_token");

        const response =
  await fetch(
    `${API}/videos`,
            {
              headers: {
                Authorization:
                  `Bearer ${token}`,
              },
            }
          );

        if (!response.ok) {
          throw new Error(
            `HTTP ${response.status}`
          );
        }

        const videos =
          await response.json();

        if (videos.length > 0) {

          const latest =
            videos[0];

          const filename =
            latest.filename || "";

          setVideoName(
            filename || "No Video"
          );

          localStorage.setItem(
            "selectedVideo",
            filename
          );

          // -------------------------
          // VIDEO URL
          // -------------------------

          const savedURL =
            localStorage.getItem(
              "selectedVideoURL"
            );

          if (
            savedURL &&
            !savedURL.startsWith("blob:")
          ) {

            setVideoURL(savedURL);

          } else if (filename) {

            setVideoURL(
              `${API}/uploads/${encodeURIComponent(
                filename
              )}`
            );

          }

          // -------------------------
          // KEY MOMENTS
          // -------------------------

let parsedMoments = [];

if (latest.key_moments) {
  try {
    if (typeof latest.key_moments === "string") {
      parsedMoments = JSON.parse(latest.key_moments);
    } else if (Array.isArray(latest.key_moments)) {
      parsedMoments = latest.key_moments;
    }
  } catch (error) {
    console.error(
      "Could not parse key moments:",
      error
    );
    parsedMoments = [];
  }
}

          setMoments(
            Array.isArray(parsedMoments)
              ? parsedMoments
              : []
          );

          localStorage.setItem(
            "keyMoments",
            JSON.stringify(
              parsedMoments
            )
          );

        }

        // -------------------------
        // FAVORITES
        // -------------------------

        const fav =
          JSON.parse(
            localStorage.getItem(
              "favorites"
            ) || "[]"
          );

        setFavorites(
          Array.isArray(fav)
            ? fav
            : []
        );

      } catch (error) {

        console.error(
          "Error loading processed video:",
          error
        );

      }

    };

    loadProcessedVideo();

  }, []);

  // ==========================================
  // CONVERT TIMESTAMP TO SECONDS
  // ==========================================

  const convertToSeconds = (time) => {
    if (!time) return 0;

    const parts = String(time)
      .trim()
      .split(":")
      .map(Number);

    if (parts.some(Number.isNaN)) {
      console.log(
        "Invalid timestamp:",
        time
      );
      return 0;
    }

    // HH:MM:SS
    if (parts.length === 3) {
      return (
        parts[0] * 3600 +
        parts[1] * 60 +
        parts[2]
      );
    }

    // MM:SS
    if (parts.length === 2) {
      return (
        parts[0] * 60 +
        parts[1]
      );
    }

    // SS
    if (parts.length === 1) {
      return parts[0];
    }

    return 0;
  };

  // ==========================================
  // JUMP TO KEY MOMENT
  // ==========================================

  const jumpToMoment = (time) => {
    console.log(
      "JUMP CLICKED:",
      time
    );

    const video = videoRef.current;

    console.log(
      "VIDEO REF:",
      video
    );

    if (!video) {
      console.log(
        "VIDEO REF IS NULL"
      );
      return;
    }

    const seconds =
      convertToSeconds(time);

    console.log(
      "CONVERTED SECONDS:",
      seconds
    );

    console.log(
      "VIDEO DURATION:",
      video.duration
    );

    console.log(
      "VIDEO READY STATE:",
      video.readyState
    );

    const seekVideo = () => {
      console.log(
        "SEEKING TO:",
        seconds
      );

      if (
        Number.isFinite(video.duration) &&
        seconds > video.duration
      ) {
        console.log(
          `Timestamp ${seconds}s is beyond video duration ${video.duration}s`
        );
        return;
      }

      video.currentTime = seconds;

      console.log(
        "CURRENT TIME AFTER SEEK:",
        video.currentTime
      );

      video.addEventListener(
        "seeked",
        () => {
          console.log(
            "SUCCESSFULLY JUMPED TO:",
            video.currentTime
          );
        },
        { once: true }
      );

      const playPromise =
        video.play();

      if (
        playPromise !== undefined
      ) {
        playPromise.catch(
          (error) => {
            console.log(
              "AUTOPLAY PREVENTED:",
              error
            );
          }
        );
      }
    };

    if (video.readyState < 1) {
      console.log(
        "WAITING FOR VIDEO METADATA..."
      );

      video.addEventListener(
        "loadedmetadata",
        seekVideo,
        { once: true }
      );
    } else {
      seekVideo();
    }
  };

  // ==========================================
  // COPY
  // ==========================================

  const copyMoment = (text) => {
    navigator.clipboard.writeText(text);
    alert("Moment copied!");
  };

  // ==========================================
  // FAVORITE
  // ==========================================

  const toggleFavorite = (moment) => {
    let updated;

    if (
      favorites.includes(moment.text)
    ) {
      updated = favorites.filter(
        (item) =>
          item !== moment.text
      );
    } else {
      updated = [
        ...favorites,
        moment.text,
      ];
    }

    setFavorites(updated);

    localStorage.setItem(
      "favorites",
      JSON.stringify(updated)
    );
  };

  // ==========================================
  // EXPORT JSON
  // ==========================================

  const exportJSON = () => {
    const blob = new Blob(
      [
        JSON.stringify(
          moments,
          null,
          2
        ),
      ],
      {
        type: "application/json",
      }
    );

    const url =
      URL.createObjectURL(blob);

    const a =
      document.createElement("a");

    a.href = url;
    a.download =
      "KeyMoments.json";

    a.click();

    URL.revokeObjectURL(url);
  };

  // ==========================================
  // PDF
  // ==========================================

  const downloadPDF = () => {
    const pdf = new jsPDF();

    pdf.setFontSize(18);

    pdf.text(
      "ClipMind AI - Key Moments Report",
      20,
      20
    );

    pdf.setFontSize(12);

    pdf.text(
      "Video : " + videoName,
      20,
      35
    );

    let y = 50;

    moments.forEach(
      (m, index) => {
        pdf.text(
          `${index + 1}. ${m.timestamp} - ${m.text}`,
          20,
          y
        );

        y += 12;

        if (y > 270) {
          pdf.addPage();
          y = 20;
        }
      }
    );

    pdf.save(
      "KeyMoments_Report.pdf"
    );
  };

  // ==========================================
  // FILTER
  // ==========================================

  const filtered =
    moments.filter(
      (m) =>
        (m.text || "")
          .toLowerCase()
          .includes(
            search.toLowerCase()
          )
    );

  return (
    <div className="key-page">

      <div className="key-header">
        <h1>
          <FaStar />
          AI Key Moments
        </h1>

        <p>
          Automatically detected important
          scenes with AI.
        </p>
      </div>

      <div className="toolbar">

        <div className="search-box">
          <FaSearch />

          <input
            placeholder="Search key moments..."
            value={search}
            onChange={(e) =>
              setSearch(e.target.value)
            }
          />
        </div>

        <div className="toolbar-buttons">

          <button
            className="download-btn"
            onClick={downloadPDF}
          >
            <FaDownload />
            PDF
          </button>

          <button
            className="json-btn"
            onClick={exportJSON}
          >
            <FaFileExport />
            JSON
          </button>

        </div>

      </div>

      <div className="stats-row">

        <div className="stat-card">
          <h2>
            {moments.length}
          </h2>

          <p>
            Total Moments
          </p>
        </div>

        <div className="stat-card">
          <h2>
            {favorites.length}
          </h2>

          <p>
            Favorites
          </p>
        </div>

        <div className="stat-card">
          <h2>
            {videoName}
          </h2>

          <p>
            Current Video
          </p>
        </div>

      </div>

      <div className="content-section">

        <div className="video-panel">

          <h3>
            {videoName}
          </h3>

          {videoURL ? (

            <video
              ref={videoRef}
              controls
              width="100%"
              src={videoURL}
              onLoadedMetadata={() => {
                console.log(
                  "VIDEO METADATA LOADED"
                );

                console.log(
                  "VIDEO DURATION:",
                  videoRef.current?.duration
                );
              }}
              onTimeUpdate={() => {
                console.log(
                  "VIDEO TIME:",
                  videoRef.current?.currentTime
                );
              }}
            >
              Your browser does not support
              the video tag.
            </video>

          ) : (

            <p>
              No video available.
            </p>

          )}

        </div>

        <div className="moments-panel">

          {filtered.length === 0 ? (

            <div className="empty">
              No Key Moments Found
            </div>

          ) : (

            filtered.map(
              (item, index) => (

                <div
                  className="moment-card"
                  key={index}
                >

                  <div className="time">
                    <FaClock />
                    {item.timestamp}
                  </div>

                  <h3>
                    {item.text}
                  </h3>

                  <div className="moment-buttons">

                    <button
                      className="jump-btn"
                      onClick={() =>
                        jumpToMoment(
                          item.timestamp
                        )
                      }
                    >
                      <FaPlay />
                      Jump
                    </button>

                    <button
                      className="copy-btn"
                      onClick={() =>
                        copyMoment(
                          item.text
                        )
                      }
                    >
                      <FaCopy />
                      Copy
                    </button>

                    <button
                      className="fav-btn"
                      onClick={() =>
                        toggleFavorite(
                          item
                        )
                      }
                    >
                      <FaHeart />

                      {favorites.includes(
                        item.text
                      )
                        ? "Saved"
                        : "Favorite"}

                    </button>

                  </div>

                </div>

              )
            )

          )}

        </div>

      </div>

    </div>
  );
}

export default KeyMoments;
