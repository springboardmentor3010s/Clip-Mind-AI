import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import DashboardLayout from "../../components/DashboardLayout";
import api from "../../api/axios";

function Processing() {

  const navigate = useNavigate();

  const [status, setStatus] = useState("Processing");
  const [stage, setStage] = useState("");
  const [progress, setProgress] = useState(0);

  const video = JSON.parse(
    localStorage.getItem("processing_video")
  );

  const videoId = video?.id;

  useEffect(() => {

    if (!videoId) return;

    const interval = setInterval(async () => {

      try {

        const res = await api.get(
          `/creator/video-status/${videoId}`
        );

        setStatus(res.data.status);
        setStage(res.data.stage);
        setProgress(res.data.progress);

        if (res.data.status === "Completed") {

          clearInterval(interval);

          navigate(`/creator/transcript/${videoId}`);

        }

        if (res.data.status === "Failed") {

          clearInterval(interval);

          alert("Video Processing Failed");

        }

      }

      catch (err) {

        console.log(err);

      }

    }, 5000);

    return () => clearInterval(interval);

  }, [navigate, videoId]);

  return (

    <DashboardLayout role="creator">

      <div className="processing-container">

        <h1>AI Processing...</h1>

        <p>
          Please wait while ClipMind AI processes your lecture.
        </p>

        <h2>{status}</h2>

        <h3>{stage}</h3>

        <div className="progress-bar">

          <div
            className="progress-fill"
            style={{
              width: `${progress}%`
            }}
          ></div>

        </div>

        <p>{progress}%</p>

      </div>

    </DashboardLayout>

  );

}

export default Processing;