"use client";

export default function RoleMenu({ role }) {
  switch (role) {
    case "LEARNER":
      return [
        { name: "Dashboard", path: "/dashboard" },
        { name: "Activity History", path: "/history" },
      ];

    case "CONTENT_CREATOR":
      return [
        { name: "Dashboard", path: "/dashboard" },
        { name: "Upload Videos", path: "/upload" },
        { name: "My Uploads", path: "/videos" },
        { name: "Transcripts", path: "/transcripts" },
        { name: "AI Summaries", path: "/summaries" },
        { name: "Key Moments", path: "/key-moments" },
        { name: "Analytics", path: "/analytics" },
        { name: "Activity History", path: "/history" },
      ];

    case "EDUCATOR":
      return [
        { name: "Dashboard", path: "/dashboard" },
        { name: "Upload Videos", path: "/upload" },
        { name: "My Uploads", path: "/videos" },
        { name: "Transcripts", path: "/transcripts" },
        { name: "AI Summaries", path: "/summaries" },
        { name: "Key Moments", path: "/key-moments" },
        { name: "Classroom Analytics", path: "/analytics" },
        { name: "Activity History", path: "/history" },
      ];

    case "ADMIN":
      return [
        { name: "Dashboard", path: "/dashboard" },
        { name: "Upload Videos", path: "/upload" },
        { name: "Manage Videos", path: "/videos" },
        { name: "Transcripts", path: "/transcripts" },
        { name: "AI Summaries", path: "/summaries" },
        { name: "Key Moments", path: "/key-moments" },
        { name: "Platform Analytics", path: "/analytics" },
        { name: "Activity History", path: "/history" },
      ];

    default:
      return [];
  }
}