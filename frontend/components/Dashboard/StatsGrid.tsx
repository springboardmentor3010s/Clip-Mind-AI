"use client";

import { useAuth } from "@/context/AuthContext";
import DashboardCard from "./DashboardCard";

export default function StatsGrid() {
  const { user } = useAuth();

  if (!user) return null;

  let cards = [];

  if (user.role === "admin") {
    cards = [
      {
        title: "Total Users",
        value: "128",
        icon: "👥",
      },
      {
        title: "Total Videos",
        value: "560",
        icon: "🎥",
      },
      {
        title: "System Analytics",
        value: "98%",
        icon: "📊",
      },
      {
        title: "Platform Status",
        value: "Active",
        icon: "🟢",
      },
    ];
  } else {
    cards = [
      {
        title: "Uploaded Videos",
        value: "18",
        icon: "📤",
      },
      {
        title: "AI Summaries",
        value: "18",
        icon: "🤖",
      },
      {
        title: "Transcripts",
        value: "18",
        icon: "📝",
      },
      {
        title: "Quizzes",
        value: "18",
        icon: "❓",
      },
    ];
  }

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns:
          "repeat(auto-fit,minmax(220px,1fr))",
        gap: "20px",
        marginBottom: "30px",
      }}
    >
      {cards.map((card, index) => (
        <DashboardCard
          key={index}
          title={card.title}
          value={card.value}
          icon={card.icon}
        />
      ))}
    </div>
  );
}