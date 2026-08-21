"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import DashboardCard from "./DashboardCard";
import { getLearnerStats } from "@/services/user";

interface Stats {
  available_videos: number;
  ai_summaries: number;
  transcripts: number;
  
}

export default function StatsGrid() {
  const { user } = useAuth();

  const [stats, setStats] = useState<Stats | null>(
    null
  );

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    // Stats are only dynamic for learners
    if (user.role !== "learner") {
      setLoading(false);
      return;
    }

    const fetchStats = async () => {
      try {
        const data = await getLearnerStats();

        setStats(data);
      } catch (error) {
        console.error(
          "Failed to load learner stats:",
          error
        );
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [user]);

  if (!user) return null;

  let cards;

  /*
   * =========================
   * ADMIN
   * =========================
   */

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
  }

  /*
   * =========================
   * LEARNER
   * =========================
   */

  else if (user.role === "learner") {
    cards = [
      {
        title: "Available Videos",
        value: loading
          ? "..."
          : String(
              stats?.available_videos ?? 0
            ),
        icon: "📤",
      },
      {
        title: "AI Summaries",
        value: loading
          ? "..."
          : String(
              stats?.ai_summaries ?? 0
            ),
        icon: "🤖",
      },
      {
        title: "Transcripts",
        value: loading
          ? "..."
          : String(
              stats?.transcripts ?? 0
            ),
        icon: "📝",
      },
    ];
  }

  /*
   * =========================
   *  EDUCATOR
   * =========================
   */
  else if (user.role === "educator") {
  cards = [
    {
      title: "Uploaded Lectures",
      value: "0",
      icon: "📤",
    },
    {
      title: "AI Summaries",
      value: "0",
      icon: "🤖",
    },
    {
      title: "Shared Resources",
      value: "0",
      icon: "📢",
    },
    {
      title: "Student Engagement",
      value: "0",
      icon: "👥",
    },
  ];
}
  else {
    cards = [
      {
        title: "Uploaded Videos",
        value: "0",
        icon: "📤",
      },
      {
        title: "AI Summaries",
        value: "0",
        icon: "🤖",
      },
      {
        title: "Transcripts",
        value: "0",
        icon: "📝",
      },
      {
        title: "Key Moments",
        value: "0",
        icon: "⭐",
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