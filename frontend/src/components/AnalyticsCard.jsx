
import React from "react";

function AnalyticsCard({ analytics }) {
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit,minmax(250px,1fr))",
        gap: "20px",
        marginTop: "25px",
      }}
    >
      <div
        style={{
          background: "#fff",
          padding: "25px",
          borderRadius: "10px",
          boxShadow: "0 2px 10px rgba(0,0,0,.1)",
        }}
      >
        <h3>User ID</h3>
        <h2>{analytics.user_id}</h2>
      </div>

      <div
        style={{
          background: "#fff",
          padding: "25px",
          borderRadius: "10px",
          boxShadow: "0 2px 10px rgba(0,0,0,.1)",
        }}
      >
        <h3>Total Videos</h3>
        <h2>{analytics.total_videos}</h2>
      </div>

      <div
        style={{
          background: "#fff",
          padding: "25px",
          borderRadius: "10px",
          boxShadow: "0 2px 10px rgba(0,0,0,.1)",
        }}
      >
        <h3>Uploaded Videos</h3>

        <ul>
          {analytics.video_names.map((video, index) => (
            <li key={index}>{video}</li>
          ))}
        </ul>
      </div>
    </div>
  );
}

export default AnalyticsCard;