import { useEffect, useState } from "react";
import axios from "axios";
import {
  FaVideo,
  FaPlay,
  FaMagic,
  FaTrash,
  FaSearch,
  FaUserCircle,
} from "react-icons/fa";
import { useNavigate } from "react-router-dom";

import "../styles/MyVideos.css";

const API = "${API}";

function MyVideos() {
  const [videos, setVideos] = useState([]);
  const [search, setSearch] = useState("");

  const navigate = useNavigate();

  useEffect(() => {
    fetchVideos();
  }, []);

  const fetchVideos = async () => {
    try {
      const token = localStorage.getItem("access_token");

      if (!token) {
        navigate("/login");
        return;
      }

      const res = await axios.get(`${API}/videos`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      setVideos(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error("Fetch videos error:", err);

      if (err.response?.status === 401) {
        localStorage.removeItem("access_token");
        navigate("/login");
      }
    }
  };

  // =========================
  // VIEW VIDEO
  // =========================
  const viewVideo = (video) => {
    localStorage.setItem("selectedVideo", video.filename);

    const videoURL = `${API}/uploads/${encodeURIComponent(
      video.filename
    )}`;

    localStorage.setItem("selectedVideoURL", videoURL);

    // Save key moments if backend already has them
    if (video.key_moments) {
      try {
        const parsed =
          typeof video.key_moments === "string"
            ? JSON.parse(video.key_moments.replace(/'/g, '"'))
            : video.key_moments;

        localStorage.setItem(
          "keyMoments",
          JSON.stringify(
            Array.isArray(parsed) ? parsed : []
          )
        );
      } catch {
        localStorage.setItem("keyMoments", "[]");
      }
    }

    navigate("/keymoments");
  };

  // =========================
  // AI PROCESS
  // =========================
  const processVideo = async (video) => {
    try {
      const token = localStorage.getItem("access_token");

      localStorage.setItem(
        "selectedVideo",
        video.filename
      );

      const res = await axios.post(
        `${API}/process-video`,
        null,
        {
          params: {
            filename: video.filename,
          },
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      localStorage.setItem(
        "summary",
        res.data.summary || ""
      );

      localStorage.setItem(
        "transcript",
        res.data.transcript || ""
      );

      localStorage.setItem(
        "keyMoments",
        JSON.stringify(
          res.data.key_moments || []
        )
      );

      navigate("/processing");
    } catch (err) {
      console.error("Processing error:", err);
      alert("Processing Failed");
    }
  };

  // =========================
  // DELETE VIDEO
  // =========================
  const deleteVideo = async (video) => {
    const confirmed = window.confirm(
      `Are you sure you want to delete "${video.filename}"?`
    );

    if (!confirmed) return;

    try {
      const token = localStorage.getItem("access_token");

      /*
       * Try the common DELETE endpoint.
       */
      await axios.delete(
        `${API}/videos/${video.id}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      // Immediately remove from UI
      setVideos((current) =>
        current.filter(
          (item) => item.id !== video.id
        )
      );

      alert("Video deleted successfully.");
    } catch (err) {
      console.error("Delete video error:", err);

      if (err.response?.status === 404) {
        alert(
          "Delete API endpoint is not available in the backend."
        );
      } else if (err.response?.status === 401) {
        localStorage.removeItem("access_token");
        navigate("/login");
      } else {
        alert("Unable to delete video.");
      }
    }
  };

  const filteredVideos = videos.filter((video) =>
    String(video.filename || "")
      .toLowerCase()
      .includes(search.toLowerCase())
  );

  return (
    <div className="videos-page">

      <div className="videos-header">

        <div>
          <h1>🎥 My Videos</h1>

          <p>
            Manage all uploaded videos from one place.
          </p>
        </div>

        <div className="video-count">
          {videos.length} Videos
        </div>

      </div>

      <div className="search-box">

        <FaSearch />

        <input
          type="text"
          placeholder="Search videos..."
          value={search}
          onChange={(e) =>
            setSearch(e.target.value)
          }
        />

      </div>

      <div className="videos-grid">

        {filteredVideos.length === 0 ? (

          <div className="empty-card">
            No videos found.
          </div>

        ) : (

          filteredVideos.map((video) => (

            <div
              className="video-card"
              key={video.id}
            >

              <div className="thumbnail">
                <FaVideo />
              </div>

              <h3>{video.filename}</h3>

              <div className="owner">
                <FaUserCircle />

                <span>
                  {video.uploaded_by}
                </span>
              </div>

              <div className="button-group">

                {/* VIEW */}
                <button
                  className="view-btn"
                  onClick={() =>
                    viewVideo(video)
                  }
                >
                  <FaPlay />
                  View
                </button>

                {/* AI PROCESS */}
                {localStorage.getItem("role") !==
                  "learner" && (

                  <button
                    className="process-btn"
                    onClick={() =>
                      processVideo(video)
                    }
                  >
                    <FaMagic />
                    AI Process
                  </button>

                )}

                {/* DELETE */}
                <button
                  className="delete-btn"
                  onClick={() =>
                    deleteVideo(video)
                  }
                  title="Delete video"
                >
                  <FaTrash />
                </button>

              </div>

            </div>

          ))

        )}

      </div>

    </div>
  );
}

export default MyVideos;
