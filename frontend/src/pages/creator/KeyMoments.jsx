import { useEffect, useRef, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";

import Sidebar from "../../components/Sidebar";
import DashboardNavbar from "../../components/DashboardNavbar";
import api from "../../api/axios";

function KeyMoments() {
  const { videoId } = useParams();

  const navigate = useNavigate();

  const [moments, setMoments] = useState([]);
  const [video, setVideo] = useState(null);

  const videoRef = useRef(null);

  useEffect(() => {
    fetchKeyMoments();
    fetchVideo();
  }, []);

  const fetchKeyMoments = async () => {
    try {
      const res = await api.get(
        `/creator/keymoments/${videoId}`
      );

      setMoments(res.data);
    } catch (err) {
      console.log(err);
    }
  };

  const fetchVideo = async () => {
    try {
      const res = await api.get(
        `/creator/video/${videoId}`
      );

      setVideo(res.data);
    } catch (err) {
      console.log(err);
    }
  };

  const convertTimeToSeconds = (time) => {
    const parts = time.split(":");

    return Number(parts[0]) * 60 + Number(parts[1]);
  };

  const jumpToMoment = (time) => {
    if (videoRef.current) {
      videoRef.current.currentTime =
        convertTimeToSeconds(time);

      videoRef.current.play();
    }
  };

  return (
    <div className="dashboard">
      <Sidebar />

      <div className="dashboard-content">
        <DashboardNavbar />

        <div className="summary-container">
          <h1>Key Moments</h1>

          {video && (
            <video
    ref={videoRef}
    controls
    className="transcript-video"
>
              <source
                src={`http://127.0.0.1:8000/uploads/videos/${video.filename}`}
                type="video/mp4"
              />
            </video>
          )}

          {moments.length === 0 ? (
            <p>No key moments available.</p>
          ) : (
            moments.map((moment, index) => (
              <div
                className="moment-card"
                key={index}
                onClick={() =>
                  jumpToMoment(moment.time)
                }
                style={{
                  cursor: "pointer",
                }}
              >
                <h3>{moment.time}</h3>

                <p>{moment.title}</p>
              </div>
            ))
          )}

          <div className="summary-buttons">
            <button
              onClick={() =>
                navigate(`/creator/topics/${videoId}`)
              }
            >
              Next → Topics
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default KeyMoments;