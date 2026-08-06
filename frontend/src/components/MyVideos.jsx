import { Link } from "react-router-dom";
import { useContext, useEffect, useState } from "react";
import { VideoContext } from "../context/VideoContext";
import api from "../api/axios";

function MyVideos({ onShare }) {
  const { setSelectedVideo } = useContext(VideoContext);

  const [videos, setVideos] = useState([]);

  const userId = localStorage.getItem("user_id");

  const [countedViews,setCountedViews]=useState({});

  useEffect(() => {
    fetchVideos();
  }, []);
    
  const fetchVideos = async () => {
    try {
      const res = await api.get(
        `/creator/videos?user_id=${userId}`
      );

      setVideos(res.data);
    } catch (err) {
      console.log(err);
    }
  };

  const deleteVideo = async (videoId) => {
    const confirmDelete = window.confirm(
      "Are you sure you want to delete this video?"
    );

    if (!confirmDelete) return;

    try {
      await api.delete(`/creator/video/${videoId}`);

      alert("Video Deleted Successfully");

      fetchVideos();
    } catch (err) {
      console.log(err);

      alert("Delete Failed");
    }
  };

  return (
    <div className="my-videos">
      <h2>My Videos</h2>

      {videos.length === 0 ? (
        <p>No videos uploaded yet.</p>
      ) : (
        videos.map((video) => (
          <div
            className="video-card"
            key={video.id}
          >
            <h3>🎥 {video.title}</h3>

            <video
              width="320"
              controls
              onPlay={() => {

        if (countedViews[video.id]) return;

        api.post(`/creator/video/${video.id}/view`);

        setCountedViews(prev => ({
            ...prev,
            [video.id]: true
        }));

    }}
            >
              <source
                src={`http://127.0.0.1:8000/uploads/videos/${video.filename}`}
                type="video/mp4"
              />

              Your browser does not support the video tag.
            </video>

            <p>
              <strong>Status:</strong> {video.status}
            </p>

            <p>
              <strong>Category:</strong> {video.category}
            </p>

            <p>
              <strong>Description:</strong> {video.description}
            </p>

            {video.status === "Processing" && (
              <>
                <p>
                  <strong>Stage:</strong>{" "}
                  {video.processing_stage}
                </p>

                <p>
                  <strong>Progress:</strong>{" "}
                  {video.progress}%
                </p>
              </>
            )}

            <div className="video-buttons">
              {video.status === "Uploaded" ||
              video.status === "Completed" ? (
                <>
                  {/* Transcript */}
                  <Link
                    to={`/creator/transcript/${video.id}`}
                    onClick={() =>
                      setSelectedVideo(video)
                    }
                  >
                    <button className="video-btn">
                      Transcript
                    </button>
                  </Link>

                  {/* Summary */}
                  <Link
                    to={`/creator/summary/${video.id}`}
                    onClick={() =>
                      setSelectedVideo(video)
                    }
                  >
                    <button className="video-btn">
                      Summary
                    </button>
                  </Link>

                  {/* Key Moments */}
                  <Link
                    to={`/creator/keymoments/${video.id}`}
                    onClick={() =>
                      setSelectedVideo(video)
                    }
                  >
                    <button className="video-btn">
                      Key Moments
                    </button>
                  </Link>

                  {/* Topics */}
                  <Link
                    to={`/creator/topics/${video.id}`}
                    onClick={() =>
                      setSelectedVideo(video)
                    }
                  >
                    <button className="video-btn">
                       Topics
                    </button>
                  </Link>

                  {/* Quiz */}
                  <Link
                    to={`/creator/quiz/${video.id}`}
                    onClick={() =>
                      setSelectedVideo(video)
                    }
                  >
                    <button className="video-btn">
                       Quiz
                    </button>
                  </Link>

                  {/* Flashcards */}
                  <Link
                    to={`/creator/flashcards/${video.id}`}
                    onClick={() =>
                      setSelectedVideo(video)
                    }
                  >
                    <button className="video-btn">
                       Flashcards
                    </button>
                  </Link>

                  {/* Analytics */}
                  <Link
                    to={`/creator/analytics/${video.id}`}
                    onClick={() =>
                      setSelectedVideo(video)
                    }
                  >
                    <button className="video-btn">
                      Analytics
                    </button>
                  </Link>

                  {/* Delete */}
                  <button
                    className="video-btn"
                    onClick={() =>
                      deleteVideo(video.id)
                    }
                    style={{
                      backgroundColor: "#dc2626",
                      color: "white",
                    }}
                  >
                    Delete
                  </button>

                  <button
    className="video-btn"
    onClick={() => onShare && onShare(video.id)}
>
    Share
</button>
                </>
              ) : (
                <Link
                  to="/creator/processing"
                  onClick={() => {
                    localStorage.setItem(
                      "processing_video",
                      JSON.stringify(video)
                    );

                    setSelectedVideo(video);
                  }}
                >
                  <button className="video-btn">
                    View Progress
                  </button>
                </Link>
              )}
            </div>
          </div>
        ))
      )}
    </div>
  );
}

export default MyVideos;