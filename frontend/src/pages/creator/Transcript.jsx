import { useEffect, useRef, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";

import DashboardLayout from "../../components/DashboardLayout";
import api from "../../api/axios";

function Transcript() {
  const { videoId } = useParams();
  const navigate = useNavigate();

  const [transcript, setTranscript] = useState([]);
  const [video, setVideo] = useState(null);

  const videoRef = useRef(null);

  useEffect(() => {
    fetchTranscript();
    fetchVideo();
  }, []);

  const fetchTranscript = async () => {
    try {
      const res = await api.get(`/transcript/${videoId}`);
      setTranscript(res.data.segments);
    } catch (err) {
      console.log(err);
    }
  };

  const fetchVideo = async () => {
    try {
      const res = await api.get(`/creator/video/${videoId}`);
      setVideo(res.data);
    } catch (err) {
      console.log(err);
    }
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);

    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const jumpToTime = (seconds) => {
    if (videoRef.current) {
      videoRef.current.currentTime = seconds;
      videoRef.current.play();
    }
  };

  return (
    <DashboardLayout role="creator">
      <h1>Transcript</h1>

      <p>AI generated transcript with timestamps.</p>

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

      <div className="transcript-container">
        {transcript.map((segment, index) => (
          <div
            key={index}
            className="transcript-card"
            onClick={() => jumpToTime(segment.start)}
            style={{
              cursor: "pointer",
            }}
          >
            <span className="timestamp">
              {formatTime(segment.start)}
            </span>

            <p>{segment.text}</p>
          </div>
        ))}
      </div>

      <div className="summary-buttons">
        <button
          onClick={() =>
            navigate(`/creator/summary/${videoId}`)
          }
        >
          Next → Summary
        </button>
      </div>
    </DashboardLayout>
  );
}

export default Transcript;