// src/pages/VideoLibrary.jsx

import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { FaPlayCircle, FaSearch, FaBookReader, FaClock, FaGlobe } from "react-icons/fa";

import { getAllVideos } from "../api";
import Loader from "../components/Loader";

function VideoLibrary() {
  const navigate = useNavigate();

  const [videos, setVideos] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchVideos();
  }, []);

  const fetchVideos = async () => {
    try {
      setLoading(true);
      const response = await getAllVideos();
      const rawVids = response.data || [];

      // 🟢 1. REPETITION FIX: Remove duplicate videos based on filename / video_name
      const uniqueVideos = [];
      const seenNames = new Set();

      rawVids.forEach((vid) => {
        const identifier = (vid.filename || vid.video_name || "").toLowerCase().trim();
        if (identifier && !seenNames.has(identifier)) {
          seenNames.add(identifier);
          uniqueVideos.push(vid);
        }
      });

      setVideos(uniqueVideos);
    } catch (error) {
      console.error("Failed to load video library:", error);
      toast.error("Failed to load lesson videos");
    } finally {
      setLoading(false);
    }
  };

  // 🟢 Filter Videos based on Search Query
  const filteredVideos = videos.filter((vid) => {
    const vName = vid.video_name || vid.filename || "";
    return vName.toLowerCase().includes(searchQuery.toLowerCase());
  });

  // 🟢 Select Video & Navigate to Interactive Learning (Transcript)
  const handleSelectVideo = (video) => {
    const fname = video.filename || video.video_name;

    localStorage.setItem("uploadedVideo", fname);
    localStorage.setItem("videoName", video.video_name || fname);
    localStorage.setItem(
      "videoURL",
      `http://127.0.0.1:8000/uploads/videos/${fname}`
    );

    toast.info(`Selected Course: ${video.video_name || fname}`);
    navigate("/transcript");
  };

  return (
    <div style={{ minHeight: "100vh", background: "#f8fafc", padding: "20px" }}>
      {/* Header Banner */}
      <div
        style={{
          background: "linear-gradient(90deg, #2563eb, #1d4ed8)",
          color: "#ffffff",
          padding: "30px",
          borderRadius: "16px",
          marginBottom: "30px",
          boxShadow: "0 10px 25px rgba(37, 99, 235, 0.2)",
          display: "flex",
          justify: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "20px",
        }}
      >
        <div>
          <h1 style={{ margin: 0, fontSize: "30px", fontWeight: "700" }}>
            📚 Educational Video Library
          </h1>
          <p style={{ margin: "8px 0 0 0", fontSize: "15px", opacity: 0.9 }}>
            Browse lesson lectures and study with AI Transcripts, Summaries, and Key Moments.
          </p>
        </div>
        <div
          style={{
            background: "rgba(255, 255, 255, 0.2)",
            padding: "10px 20px",
            borderRadius: "12px",
            textAlign: "center",
          }}
        >
          <h2 style={{ margin: 0, fontSize: "26px" }}>{filteredVideos.length}</h2>
          <span style={{ fontSize: "13px" }}>Lessons</span>
        </div>
      </div>

      {/* Search Bar */}
      <div style={{ marginBottom: "30px", maxWidth: "500px", position: "relative" }}>
        <input
          type="text"
          placeholder="🔍 Search lessons by title..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          style={{
            width: "100%",
            padding: "12px 20px 12px 42px",
            borderRadius: "10px",
            border: "1px solid #cbd5e1",
            fontSize: "15px",
            outline: "none",
            background: "#ffffff",
          }}
        />
        <FaSearch
          style={{
            position: "absolute",
            left: "15px",
            top: "16px",
            color: "#94a3b8",
            fontSize: "15px",
          }}
        />
      </div>

      {/* Video Cards Grid */}
      {loading ? (
        <Loader />
      ) : filteredVideos.length === 0 ? (
        <div
          style={{
            background: "#ffffff",
            padding: "50px 20px",
            borderRadius: "16px",
            textAlign: "center",
            border: "1px solid #e2e8f0",
          }}
        >
          <h2 style={{ color: "#64748b", margin: "0 0 10px 0" }}>No Lessons Found</h2>
          <p style={{ color: "#94a3b8", margin: 0 }}>
            {searchQuery
              ? "No videos match your search criteria."
              : "No educational videos uploaded yet."}
          </p>
        </div>
      ) : (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
            gap: "25px",
          }}
        >
          {filteredVideos.map((video) => {
            const fname = video.filename || video.video_name;
            const videoSrc = `http://127.0.0.1:8000/uploads/videos/${fname}`;

            return (
              <div
                key={video.id || fname}
                style={{
                  background: "#ffffff",
                  borderRadius: "16px",
                  border: "1px solid #e2e8f0",
                  boxShadow: "0 4px 12px rgba(0,0,0,0.05)",
                  overflow: "hidden",
                  display: "flex",
                  flexDirection: "column",
                  justify: "space-between",
                }}
              >
                {/* 🟢 2. REAL VIDEO THUMBNAIL PREVIEW (Replaces plain blue box) */}
                <div
                  style={{
                    position: "relative",
                    height: "170px",
                    background: "#000000",
                    overflow: "hidden",
                  }}
                >
                  <video
                    src={`${videoSrc}#t=0.5`}
                    preload="metadata"
                    style={{
                      width: "100%",
                      height: "100%",
                      objectFit: "cover",
                      opacity: 0.85,
                    }}
                  />
                  <div
                    style={{
                      position: "absolute",
                      top: 0,
                      left: 0,
                      width: "100%",
                      height: "100%",
                      display: "flex",
                      justify: "center",
                      alignItems: "center",
                      background: "rgba(0, 0, 0, 0.25)",
                      color: "#ffffff",
                      fontSize: "45px",
                      cursor: "pointer",
                    }}
                    onClick={() => handleSelectVideo(video)}
                  >
                    <FaPlayCircle style={{ filter: "drop-shadow(0 2px 8px rgba(0,0,0,0.5))" }} />
                  </div>
                </div>

                {/* Card Body */}
                <div style={{ padding: "18px", flex: 1 }}>
                  <h3
                    style={{
                      color: "#1e293b",
                      fontSize: "16px",
                      fontWeight: "700",
                      margin: "0 0 10px 0",
                      lineHeight: "22px",
                      wordBreak: "break-word",
                    }}
                  >
                    {video.video_name || video.filename}
                  </h3>

                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: "6px",
                      fontSize: "13px",
                      color: "#64748b",
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                      <FaGlobe style={{ color: "#2563eb" }} />
                      <span>
                        Language: <b>{video.language || "English"}</b>
                      </span>
                    </div>

                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                      <FaClock style={{ color: "#d97706" }} />
                      <span>
                        Duration:{" "}
                        <b>
                          {video.duration ? `${video.duration} sec` : "Full Lecture"}
                        </b>
                      </span>
                    </div>
                  </div>
                </div>

                {/* Card Footer Actions */}
                <div
                  style={{
                    padding: "12px 18px",
                    borderTop: "1px solid #f1f5f9",
                    background: "#f8fafc",
                  }}
                >
                  <button
                    onClick={() => handleSelectVideo(video)}
                    style={{
                      width: "100%",
                      background: "#2563eb",
                      color: "#ffffff",
                      border: "none",
                      padding: "10px",
                      borderRadius: "8px",
                      fontWeight: "700",
                      fontSize: "14px",
                      cursor: "pointer",
                      display: "flex",
                      justify: "center",
                      alignItems: "center",
                      gap: "8px",
                    }}
                  >
                    <FaBookReader /> Watch &amp; Learn Lesson
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

export default VideoLibrary;