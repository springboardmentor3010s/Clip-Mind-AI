"use client";

import { useAuth } from "@/context/AuthContext";

export default function RecentActivity() {
  const { user } = useAuth();

  if (!user) return null;

  let activities = [];

  if (user.role === "admin") {
    activities = [
      "👤 New user registered",
      "🎥 5 videos uploaded today",
      "📊 Analytics updated",
      "⚙️ Platform running normally",
    ];
  } else {
    activities = [
      "📤 Video uploaded",
      "🤖 AI Summary generated",
      "📝 Transcript created",
      "⭐ Key moments detected",
    ];
  }

  return (
    <div
      style={{
        background: "#1E293B",
        borderRadius: "18px",
        padding: "25px",
        color: "white",
      }}
    >
      <h2>🕒 Recent Activity</h2>

      <div
        style={{
          marginTop: "20px",
        }}
      >
        {activities.map((activity, index) => (
          <div
            key={index}
            style={{
              padding: "12px 0",
              borderBottom:
                index !== activities.length - 1
                  ? "1px solid #334155"
                  : "none",
            }}
          >
            {activity}
          </div>
        ))}
      </div>
    </div>
  );
}