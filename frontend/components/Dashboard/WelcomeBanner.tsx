"use client";

import { useAuth } from "@/context/AuthContext";

export default function WelcomeBanner() {
  const { user } = useAuth();

  if (!user) return null;

  let title = "";
  let description = "";

  switch (user.role) {
    case "admin":
      title = `Welcome Back, ${user.username} 👋`;
      description =
        "Manage users, videos and monitor the ClipMind AI platform.";
      break;

    case "creator":
      title = `Welcome Back, ${user.username} 👋`;
      description =
        "Upload videos and generate AI summaries, transcripts and key moments.";
      break;

    case "educator":
      title = `Welcome Back, ${user.username} 👋`;
      description =
        "Create educational content and transform lectures into smart learning resources.";
      break;

    case "learner":
      title = `Welcome Back, ${user.username} 👋`;
      description =
        "Continue your learning journey with AI-powered summaries.";
      break;

    default:
      title = `Welcome Back, ${user.username} 👋`;
      description = "Welcome to ClipMind AI.";
  }

  return (
    <div
      style={{
        background: "linear-gradient(135deg, #2563EB, #0EA5E9)",
        color: "white",
        borderRadius: "20px",
        padding: "30px",
        marginBottom: "25px",
        boxShadow: "0 10px 25px rgba(0,0,0,0.15)",
      }}
    >
      <h1
        style={{
          margin: 0,
          fontSize: "30px",
          fontWeight: "bold",
        }}
      >
        {title}
      </h1>

      <p
        style={{
          marginTop: "12px",
          fontSize: "17px",
          color: "#E2E8F0",
          lineHeight: "28px",
        }}
      >
        {description}
      </p>
    </div>
  );
}