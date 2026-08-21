import React, { useEffect, useRef, useState } from "react";
import axios from "axios";
import {
  FaPlay,
  FaCopy,
  FaHeart,
  FaSearch,
  FaClock,
  FaVideo,
  FaTimes,
} from "react-icons/fa";
import API from "../../config";


const EducatorKeyMoments = () => {
  const [videos, setVideos] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedVideo, setSelectedVideo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [favorites, setFavorites] = useState([]);

  const videoRef = useRef(null);

  useEffect(() => {
    fetchVideos();

    try {
      const saved = JSON.parse(
        localStorage.getItem("educatorKeyMomentFavorites") || "[]"
      );

      setFavorites(Array.isArray(saved) ? saved : []);
    } catch {
      setFavorites([]);
    }
  }, []);

  const fetchVideos = async () => {
    try {
      setLoading(true);
      setError("");

      const token = localStorage.getItem("access_token");

      if (!token) {
        setError("You are not logged in. Please login again.");
        return;
      }

      const response = await axios.get(`${API}/videos`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      setVideos(
        Array.isArray(response.data) ? response.data : []
      );
    } catch (err) {
      console.error("Key Moments API Error:", err);

      if (err.response?.status === 401) {
        setError("Session expired. Please login again.");
      } else {
        setError("Unable to load key moments.");
      }
    } finally {
      setLoading(false);
    }
  };

  // ==========================================
  // PARSE KEY MOMENTS
  // ==========================================

  const parseKeyMoments = (value) => {
    if (!value) return [];

    if (Array.isArray(value)) {
      return value;
    }

    if (typeof value === "object") {
      return [value];
    }

    try {
      const parsed = JSON.parse(value);

      return Array.isArray(parsed)
        ? parsed
        : [parsed];
    } catch {
      try {
        const parsed = JSON.parse(
          String(value).replace(/'/g, '"')
        );

        return Array.isArray(parsed)
          ? parsed
          : [parsed];
      } catch {
        return String(value)
          .split(/\n|(?<=\.)\s+(?=[A-Z])/)
          .filter(Boolean)
          .map((item) => ({
            description: item,
          }));
      }
    }
  };

  // ==========================================
  // GET MOMENT TEXT
  // ==========================================

  const getMomentText = (moment, index) => {
    return (
      moment?.description ||
      moment?.text ||
      moment?.content ||
      moment?.summary ||
      moment?.title ||
      moment?.name ||
      `Key Moment ${index + 1}`
    );
  };

  // ==========================================
  // GET TIMESTAMP
  // ==========================================

  const getTimestamp = (moment) => {
    return (
      moment?.timestamp ||
      moment?.time ||
      moment?.start_time ||
      moment?.start ||
      "00:00"
    );
  };

  // ==========================================
  // CONVERT TIME TO SECONDS
  // ==========================================

  const convertToSeconds = (time) => {
    if (time === undefined || time === null) {
      return 0;
    }

    if (typeof time === "number") {
      return time;
    }

    const value = String(time).trim();

    // Plain seconds
    if (/^\d+(\.\d+)?$/.test(value)) {
      return Number(value);
    }

    const parts = value
      .split(":")
      .map((part) => Number(part));

    if (parts.some((part) => Number.isNaN(part))) {
      return 0;
    }

    if (parts.length === 3) {
      return (
        parts[0] * 3600 +
        parts[1] * 60 +
        parts[2]
      );
    }

    if (parts.length === 2) {
      return parts[0] * 60 + parts[1];
    }

    return 0;
  };

  // ==========================================
  // VIDEO URL
  // ==========================================

  const getVideoURL = (video) => {
    if (!video) return "";

    if (video.video_url) {
      return video.video_url.startsWith("http")
        ? video.video_url
        : `${API}${video.video_url}`;
    }

    if (video.url) {
      return video.url.startsWith("http")
        ? video.url
        : `${API}${video.url}`;
    }

    if (video.file_url) {
      return video.file_url.startsWith("http")
        ? video.file_url
        : `${API}${video.file_url}`;
    }

    if (video.filename) {
      return `${API}/uploads/${encodeURIComponent(
        video.filename
      )}`;
    }

    if (video.filepath) {
      const filename = video.filepath
        .split(/[\\/]/)
        .pop();

      return `${API}/uploads/${encodeURIComponent(
        filename
      )}`;
    }

    return "";
  };

  // ==========================================
  // JUMP TO MOMENT
  // ==========================================

  const jumpToMoment = (moment) => {
    const seconds = convertToSeconds(
      getTimestamp(moment)
    );

    const video = videoRef.current;

    if (!video) {
      alert("Video player is not available.");
      return;
    }

    const seek = () => {
      try {
        video.currentTime = seconds;

        const playPromise = video.play();

        if (playPromise) {
          playPromise.catch(() => {
            // Browser may block autoplay.
          });
        }
      } catch (error) {
        console.error("Unable to jump:", error);
      }
    };

    if (video.readyState >= 1) {
      seek();
    } else {
      video.addEventListener(
        "loadedmetadata",
        seek,
        { once: true }
      );
    }
  };

  // ==========================================
  // COPY
  // ==========================================

  const copyMoment = async (moment, index) => {
    const text =
      `${getTimestamp(moment)} - ${getMomentText(
        moment,
        index
      )}`;

    try {
      await navigator.clipboard.writeText(text);
      alert("Key moment copied!");
    } catch (error) {
      console.error("Copy failed:", error);
      alert("Unable to copy key moment.");
    }
  };

  // ==========================================
  // FAVORITE
  // ==========================================

  const getFavoriteId = (video, moment, index) => {
    return `${video.id || video.filename}-${getTimestamp(
      moment
    )}-${index}`;
  };

  const isFavorite = (video, moment, index) => {
    const id = getFavoriteId(
      video,
      moment,
      index
    );

    return favorites.includes(id);
  };

  const toggleFavorite = (video, moment, index) => {
    const id = getFavoriteId(
      video,
      moment,
      index
    );

    let updatedFavorites;

    if (favorites.includes(id)) {
      updatedFavorites = favorites.filter(
        (item) => item !== id
      );
    } else {
      updatedFavorites = [
        ...favorites,
        id,
      ];
    }

    setFavorites(updatedFavorites);

    localStorage.setItem(
      "educatorKeyMomentFavorites",
      JSON.stringify(updatedFavorites)
    );
  };

  // ==========================================
  // FILTER VIDEOS
  // ==========================================

  const filteredVideos = videos.filter((video) => {
    const filename = String(
      video.filename || ""
    ).toLowerCase();

    const moments = parseKeyMoments(
      video.key_moments
    );

    const momentText = moments
      .map((moment, index) =>
        getMomentText(moment, index)
      )
      .join(" ")
      .toLowerCase();

    const search =
      searchTerm.toLowerCase();

    return (
      filename.includes(search) ||
      momentText.includes(search)
    );
  });

  // ==========================================
  // LOADING
  // ==========================================

  if (loading) {
    return (
      <div style={styles.center}>
        <div style={styles.loader}>
          Loading Key Moments...
        </div>
      </div>
    );
  }

  return (
    <div style={styles.page}>

      {/* HEADER */}

      <div style={styles.header}>
        <div>
          <h1 style={styles.title}>
            🎯 Key Moments
          </h1>

          <p style={styles.subtitle}>
            AI-detected important moments from
            your processed lectures
          </p>
        </div>

        <div style={styles.badge}>
          {videos.length} Videos
        </div>
      </div>

      {/* ERROR */}

      {error && (
        <div style={styles.error}>
          {error}
        </div>
      )}

      {/* SEARCH */}

      <div style={styles.searchWrapper}>
        <FaSearch color="#64748b" />

        <input
          type="text"
          placeholder="Search videos or key moments..."
          value={searchTerm}
          onChange={(e) =>
            setSearchTerm(e.target.value)
          }
          style={styles.search}
        />
      </div>

      {/* EMPTY */}

      {filteredVideos.length === 0 ? (
        <div style={styles.empty}>
          <div style={{ fontSize: 45 }}>
            🎬
          </div>

          <h2>
            No processed videos found
          </h2>

          <p>
            Process a lecture first to generate
            key moments.
          </p>
        </div>
      ) : (

        /* VIDEO GRID */

        <div style={styles.grid}>

          {filteredVideos.map((video) => {

            const moments =
              parseKeyMoments(
                video.key_moments
              );

            return (
              <div
                key={video.id}
                style={styles.card}
              >

                {/* CARD HEADER */}

                <div style={styles.cardHeader}>

                  <div
                    style={{
                      display: "flex",
                      gap: "10px",
                      alignItems: "center",
                    }}
                  >
                    <FaVideo color="#4f46e5" />

                    <h3 style={{ margin: 0 }}>
                      {video.filename}
                    </h3>
                  </div>

                  <span style={styles.count}>
                    {moments.length} moments
                  </span>

                </div>

                {/* MOMENT PREVIEW */}

                <div>

                  {moments
                    .slice(0, 5)
                    .map(
                      (moment, index) => (

                        <div
                          key={index}
                          style={styles.moment}
                        >

                          <div
                            style={
                              styles.number
                            }
                          >
                            {index + 1}
                          </div>

                          <div
                            style={{
                              flex: 1,
                            }}
                          >

                            <strong>
                              {moment.title ||
                                moment.name ||
                                `Key Moment ${
                                  index + 1
                                }`}
                            </strong>

                            <p
                              style={
                                styles.description
                              }
                            >
                              {getMomentText(
                                moment,
                                index
                              )}
                            </p>

                            <span
                              style={
                                styles.timestamp
                              }
                            >
                              <FaClock />

                              {" "}

                              {getTimestamp(
                                moment
                              )}
                            </span>

                          </div>

                        </div>

                      )
                    )}

                </div>

                {/* VIEW ALL */}

                <button
                  style={styles.button}
                  onClick={() =>
                    setSelectedVideo(video)
                  }
                >
                  View All Moments →
                </button>

              </div>
            );
          })}

        </div>
      )}

      {/* ====================================== */}
      {/* MODAL */}
      {/* ====================================== */}

      {selectedVideo && (

        <div style={styles.overlay}>

          <div style={styles.modal}>

            {/* CLOSE */}

            <button
              style={styles.close}
              onClick={() =>
                setSelectedVideo(null)
              }
            >
              <FaTimes />
            </button>

            {/* TITLE */}

            <h2 style={styles.modalTitle}>
              🎯 {selectedVideo.filename}
            </h2>

            <p style={styles.modalSubtitle}>
              Key moments detected by ClipMind AI
            </p>

            {/* VIDEO */}

            {getVideoURL(selectedVideo) ? (

              <video
                ref={videoRef}
                controls
                src={getVideoURL(
                  selectedVideo
                )}
                style={styles.video}
              >
                Your browser does not support
                the video player.
              </video>

            ) : (

              <div style={styles.noVideo}>
                No video available for this
                lecture.
              </div>

            )}

            {/* MOMENTS */}

            <div style={styles.modalMoments}>

              {parseKeyMoments(
                selectedVideo.key_moments
              ).map(
                (moment, index) => {

                  const favorite =
                    isFavorite(
                      selectedVideo,
                      moment,
                      index
                    );

                  return (

                    <div
                      key={index}
                      style={{
                        ...styles.modalMoment,
                        ...(favorite
                          ? styles.favoriteMoment
                          : {}),
                      }}
                    >

                      <div
                        style={
                          styles.modalMomentHeader
                        }
                      >

                        <div
                          style={
                            styles.momentNumber
                          }
                        >
                          {index + 1}
                        </div>

                        <div
                          style={{
                            flex: 1,
                          }}
                        >

                          <h3
                            style={{
                              margin:
                                "0 0 5px",
                            }}
                          >
                            {moment.title ||
                              moment.name ||
                              `Key Moment ${
                                index + 1
                              }`}
                          </h3>

                          <span
                            style={
                              styles.modalTimestamp
                            }
                          >
                            <FaClock />

                            {" "}

                            {getTimestamp(
                              moment
                            )}
                          </span>

                        </div>

                      </div>

                      <p
                        style={
                          styles.modalDescription
                        }
                      >
                        {getMomentText(
                          moment,
                          index
                        )}
                      </p>

                      {/* ACTION BUTTONS */}

                      <div
                        style={
                          styles.actionButtons
                        }
                      >

                        {/* JUMP */}

                        <button
                          style={
                            styles.jumpButton
                          }
                          onClick={() =>
                            jumpToMoment(
                              moment
                            )
                          }
                        >
                          <FaPlay />
                          Jump
                        </button>

                        {/* COPY */}

                        <button
                          style={
                            styles.copyButton
                          }
                          onClick={() =>
                            copyMoment(
                              moment,
                              index
                            )
                          }
                        >
                          <FaCopy />
                          Copy
                        </button>

                        {/* FAVOURITE */}

                        <button
                          style={{
                            ...styles.favoriteButton,
                            ...(favorite
                              ? styles.favoriteActive
                              : {}),
                          }}
                          onClick={() =>
                            toggleFavorite(
                              selectedVideo,
                              moment,
                              index
                            )
                          }
                        >
                          <FaHeart />

                          {favorite
                            ? "Saved"
                            : "Favourite"}
                        </button>

                      </div>

                    </div>
                  );
                }
              )}

            </div>

          </div>

        </div>
      )}

    </div>
  );
};

// ==========================================
// STYLES
// ==========================================

const styles = {

  page: {
    padding: "30px",
    background: "#f7f8fc",
    minHeight: "100vh",
    fontFamily:
      "Arial, sans-serif",
    color: "#172033",
  },

  header: {
    display: "flex",
    justifyContent:
      "space-between",
    alignItems: "center",
    marginBottom: "25px",
  },

  title: {
    margin: 0,
    fontSize: "30px",
    fontWeight: "700",
  },

  subtitle: {
    color: "#64748b",
    marginTop: "8px",
  },

  badge: {
    background: "#111827",
    color: "white",
    padding: "10px 18px",
    borderRadius: "20px",
    fontWeight: "600",
  },

  searchWrapper: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    background: "white",
    border: "1px solid #e2e8f0",
    borderRadius: "10px",
    padding: "0 14px",
    marginBottom: "25px",
  },

  search: {
    flex: 1,
    border: "none",
    outline: "none",
    padding: "14px 5px",
    fontSize: "15px",
    boxSizing: "border-box",
  },

  grid: {
    display: "grid",
    gridTemplateColumns:
      "repeat(auto-fit, minmax(330px, 1fr))",
    gap: "20px",
  },

  card: {
    background: "white",
    padding: "22px",
    borderRadius: "15px",
    boxShadow:
      "0 3px 15px rgba(0,0,0,0.08)",
  },

  cardHeader: {
    display: "flex",
    justifyContent:
      "space-between",
    alignItems: "center",
    gap: "10px",
    marginBottom: "15px",
  },

  count: {
    fontSize: "12px",
    background: "#eef2ff",
    color: "#4f46e5",
    padding: "6px 10px",
    borderRadius: "15px",
    whiteSpace: "nowrap",
  },

  moment: {
    display: "flex",
    gap: "12px",
    padding: "13px 0",
    borderBottom:
      "1px solid #eee",
  },

  number: {
    minWidth: "30px",
    height: "30px",
    borderRadius: "50%",
    background: "#111827",
    color: "white",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    fontSize: "13px",
    fontWeight: "700",
  },

  description: {
    margin: "6px 0",
    color: "#666",
    fontSize: "14px",
    lineHeight: "1.5",
  },

  timestamp: {
    fontSize: "12px",
    color: "#4f46e5",
    display: "inline-flex",
    alignItems: "center",
    gap: "5px",
  },

  button: {
    width: "100%",
    marginTop: "18px",
    padding: "12px",
    border: "none",
    borderRadius: "8px",
    background: "#4f46e5",
    color: "white",
    cursor: "pointer",
    fontWeight: "600",
  },

  empty: {
    textAlign: "center",
    padding: "80px 20px",
    background: "white",
    borderRadius: "15px",
  },

  center: {
    minHeight: "70vh",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
  },

  loader: {
    fontSize: "18px",
  },

  error: {
    background: "#fee2e2",
    color: "#991b1b",
    padding: "12px",
    borderRadius: "8px",
    marginBottom: "15px",
  },

  overlay: {
    position: "fixed",
    inset: 0,
    background:
      "rgba(0,0,0,0.65)",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    padding: "20px",
    zIndex: 1000,
  },

  modal: {
    position: "relative",
    background: "white",
    width: "90%",
    maxWidth: "850px",
    maxHeight: "90vh",
    overflowY: "auto",
    padding: "30px",
    borderRadius: "15px",
    boxSizing: "border-box",
  },

  close: {
    position: "absolute",
    right: "20px",
    top: "20px",
    width: "36px",
    height: "36px",
    border: "none",
    background: "#f1f5f9",
    borderRadius: "50%",
    fontSize: "16px",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },

  modalTitle: {
    margin: "0 45px 5px 0",
    fontSize: "24px",
  },

  modalSubtitle: {
    color: "#64748b",
    marginTop: "5px",
    marginBottom: "20px",
  },

  video: {
    width: "100%",
    maxHeight: "420px",
    background: "#000",
    borderRadius: "10px",
    marginBottom: "25px",
  },

  noVideo: {
    background: "#f8fafc",
    padding: "35px",
    textAlign: "center",
    borderRadius: "10px",
    color: "#64748b",
    marginBottom: "20px",
  },

  modalMoments: {
    display: "flex",
    flexDirection: "column",
    gap: "15px",
  },

  modalMoment: {
    padding: "18px",
    border: "1px solid #e2e8f0",
    borderRadius: "12px",
    background: "#fff",
  },

  favoriteMoment: {
    border:
      "1px solid #f59e0b",
    background: "#fffbeb",
  },

  modalMomentHeader: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
  },

  momentNumber: {
    minWidth: "34px",
    height: "34px",
    borderRadius: "50%",
    background: "#4f46e5",
    color: "white",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontWeight: "700",
  },

  modalTimestamp: {
    display: "inline-flex",
    alignItems: "center",
    gap: "5px",
    color: "#4f46e5",
    fontSize: "13px",
  },

  modalDescription: {
    color: "#475569",
    lineHeight: "1.6",
    margin:
      "12px 0 15px",
  },

  actionButtons: {
    display: "flex",
    gap: "8px",
    flexWrap: "wrap",
  },

  jumpButton: {
    border: "none",
    background: "#4f46e5",
    color: "white",
    padding: "9px 14px",
    borderRadius: "7px",
    cursor: "pointer",
    fontWeight: "600",
    display: "flex",
    alignItems: "center",
    gap: "6px",
  },

  copyButton: {
    border: "1px solid #cbd5e1",
    background: "white",
    color: "#334155",
    padding: "9px 14px",
    borderRadius: "7px",
    cursor: "pointer",
    fontWeight: "600",
    display: "flex",
    alignItems: "center",
    gap: "6px",
  },

  favoriteButton: {
    border: "1px solid #f59e0b",
    background: "white",
    color: "#d97706",
    padding: "9px 14px",
    borderRadius: "7px",
    cursor: "pointer",
    fontWeight: "600",
    display: "flex",
    alignItems: "center",
    gap: "6px",
  },

  favoriteActive: {
    background: "#f59e0b",
    color: "white",
  },
};

export default EducatorKeyMoments;
