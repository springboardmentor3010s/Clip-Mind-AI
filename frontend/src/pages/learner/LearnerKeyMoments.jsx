import React, { useEffect, useState } from "react";
import axios from "axios";
import {
  FaStar,
  FaClock,
  FaPlay,
  FaCopy,
  FaHeart,
} from "react-icons/fa";

const API = "${API}";

const LearnerKeyMoments = () => {
  const [videos, setVideos] = useState([]);
  const [selectedVideo, setSelectedVideo] = useState(null);
  const [favorites, setFavorites] = useState([]);

  useEffect(() => {
    loadVideos();

    const saved =
      JSON.parse(
        localStorage.getItem("learnerFavorites") ||
          "[]"
      );

    setFavorites(saved);
  }, []);

  const loadVideos = async () => {
    try {
      const token =
        localStorage.getItem("access_token");

      const response = await axios.get(
        `${API}/videos`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      setVideos(
        Array.isArray(response.data)
          ? response.data
          : []
      );
    } catch (error) {
      console.error(
        "Learner Key Moments error:",
        error
      );
    }
  };

  const parseMoments = (value) => {
    if (!value) return [];

    if (Array.isArray(value)) return value;

    try {
      const parsed = JSON.parse(
        String(value).replace(/'/g, '"')
      );

      return Array.isArray(parsed)
        ? parsed
        : [];
    } catch {
      return [];
    }
  };

  const copyMoment = (text) => {
    navigator.clipboard.writeText(text);
    alert("Moment copied!");
  };

  const toggleFavorite = (moment) => {
    const key =
      moment.text ||
      moment.description ||
      moment.content ||
      "";

    let updated;

    if (favorites.includes(key)) {
      updated = favorites.filter(
        (item) => item !== key
      );
    } else {
      updated = [...favorites, key];
    }

    setFavorites(updated);

    localStorage.setItem(
      "learnerFavorites",
      JSON.stringify(updated)
    );
  };

  const jumpToMoment = (video, timestamp) => {
    localStorage.setItem(
      "selectedVideo",
      video.filename
    );

    localStorage.setItem(
      "selectedVideoURL",
      `${API}/uploads/${encodeURIComponent(
        video.filename
      )}`
    );

    localStorage.setItem(
      "keyMoments",
      JSON.stringify(
        parseMoments(video.key_moments)
      )
    );

    // Go to the main key-moments player
    window.location.href = "/keymoments";
  };

  return (
    <div
      style={{
        padding: "30px",
        background: "#f7f8fc",
        minHeight: "100vh",
      }}
    >

      <h1>
        <FaStar /> AI Key Moments
      </h1>

      <p style={{ color: "#666" }}>
        Automatically detected important
        scenes from your videos.
      </p>

      {videos.length === 0 ? (

        <div
          style={{
            background: "white",
            padding: "60px",
            textAlign: "center",
            borderRadius: "15px",
            marginTop: "25px",
          }}
        >
          <h2>No Videos Available</h2>
          <p>
            Upload or process a video first.
          </p>
        </div>

      ) : (

        <div
          style={{
            display: "grid",
            gridTemplateColumns:
              "repeat(auto-fit,minmax(350px,1fr))",
            gap: "20px",
            marginTop: "25px",
          }}
        >

          {videos.map((video) => {

            const moments =
              parseMoments(
                video.key_moments
              );

            return (
              <div
                key={video.id}
                style={{
                  background: "white",
                  padding: "22px",
                  borderRadius: "15px",
                  boxShadow:
                    "0 3px 15px rgba(0,0,0,.08)",
                }}
              >

                <h2>{video.filename}</h2>

                <p style={{ color: "#666" }}>
                  {moments.length} Key Moments
                </p>

                {moments.length === 0 ? (

                  <p>
                    No key moments generated
                    for this video.
                  </p>

                ) : (

                  moments.map(
                    (moment, index) => {

                      const text =
                        moment.text ||
                        moment.description ||
                        moment.content ||
                        String(moment);

                      const timestamp =
                        moment.timestamp ||
                        moment.time ||
                        "0:00";

                      const saved =
                        favorites.includes(text);

                      return (
                        <div
                          key={index}
                          style={{
                            borderTop:
                              "1px solid #eee",
                            padding:
                              "15px 0",
                          }}
                        >

                          <div
                            style={{
                              display: "flex",
                              gap: "10px",
                              alignItems:
                                "center",
                            }}
                          >

                            <FaClock />

                            <strong>
                              {timestamp}
                            </strong>

                          </div>

                          <p>
                            {text}
                          </p>

                          <div
                            style={{
                              display: "flex",
                              gap: "8px",
                              flexWrap: "wrap",
                            }}
                          >

                            <button
                              onClick={() =>
                                jumpToMoment(
                                  video,
                                  timestamp
                                )
                              }
                              style={buttonStyle}
                            >
                              <FaPlay />
                              Jump
                            </button>

                            <button
                              onClick={() =>
                                copyMoment(text)
                              }
                              style={buttonStyle}
                            >
                              <FaCopy />
                              Copy
                            </button>

                            <button
                              onClick={() =>
                                toggleFavorite(
                                  moment
                                )
                              }
                              style={{
                                ...buttonStyle,
                                background:
                                  saved
                                    ? "#dc2626"
                                    : "#111827",
                              }}
                            >
                              <FaHeart />
                              {saved
                                ? "Saved"
                                : "Favorite"}
                            </button>

                          </div>

                        </div>
                      );
                    }
                  )

                )}

              </div>
            );
          })}

        </div>

      )}

    </div>
  );
};

const buttonStyle = {
  border: "none",
  background: "#4f46e5",
  color: "white",
  padding: "9px 14px",
  borderRadius: "7px",
  cursor: "pointer",
  display: "flex",
  alignItems: "center",
  gap: "6px",
};

export default LearnerKeyMoments;
