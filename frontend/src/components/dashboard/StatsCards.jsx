import {
  FaVideo,
  FaFileAlt,
  FaStar,
  FaClock,
} from "react-icons/fa";

import "./StatsCards.css";

function StatsCards() {
  const transcriptWords =
    localStorage.getItem("transcriptWords") || 0;

  const summaryWords =
    localStorage.getItem("summaryWords") || 0;

  const processingTime =
    localStorage.getItem("processingTime") || "0 sec";

  const keyMoments = JSON.parse(
    localStorage.getItem("keyMoments") || "[]"
  );

  const stats = [
    {
      title: "Transcript Words",
      value: transcriptWords,
      icon: <FaVideo />,
    },

    {
      title: "Summary Words",
      value: summaryWords,
      icon: <FaFileAlt />,
    },

    {
      title: "Key Moments",
      value: keyMoments.length,
      icon: <FaStar />,
    },

    {
      title: "Processing Time",
      value: processingTime,
      icon: <FaClock />,
    },
  ];

  return (
    <div className="stats-grid">
      {stats.map((item, index) => (
        <div
          className="stat-card"
          key={index}
        >
          <div className="stat-top">
            <div className="stat-icon">
              {item.icon}
            </div>
          </div>

          <h4>{item.title}</h4>

          <h2>{item.value}</h2>
        </div>
      ))}
    </div>
  );
}

export default StatsCards;
