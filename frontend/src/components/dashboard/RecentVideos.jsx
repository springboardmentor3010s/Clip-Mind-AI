import { useNavigate } from "react-router-dom";
import "./RecentVideos.css";

function RecentVideos() {
  const navigate = useNavigate();

  const videoName =
    localStorage.getItem("selectedVideo") || "No Video Uploaded";

  const processingTime =
    localStorage.getItem("processingTime") || "-";

  const transcript =
    localStorage.getItem("transcript") || "";

  const status =
    transcript.length > 0 ? "Completed" : "Not Processed";

  const videos = [
    {
      title: videoName,
      duration: processingTime,
      status: status,
    },
  ];

  return (
    <div className="recent-card">

      <div className="recent-header">
        <h2>Recent Videos</h2>
      </div>

      <table>
        <thead>
          <tr>
            <th>Title</th>
            <th>Processing Time</th>
            <th>Status</th>
            <th>Action</th>
          </tr>
        </thead>

        <tbody>

          {videos.map((video, index) => (

            <tr key={index}>

              <td>▶ {video.title}</td>

              <td>{video.duration}</td>

              <td>
                <span
                  className={
                    video.status === "Completed"
                      ? "completed"
                      : "processing"
                  }
                >
                  {video.status}
                </span>
              </td>

              <td>
                <button
                  className="view-btn"
                  onClick={() => navigate("/summary")}
                >
                  View
                </button>
              </td>

            </tr>

          ))}

        </tbody>

      </table>

    </div>
  );
}

export default RecentVideos;
