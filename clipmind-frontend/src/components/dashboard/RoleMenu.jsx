"use client";

export default function RoleMenu({ role }) {
  switch (role) {
    case "LEARNER":
      return [
        { name: "Dashboard", path: "/dashboard" },
        { name: "Videos", path: "/videos" },
        { name: "Transcripts", path: "/transcripts" },
        { name: "AI Summaries", path: "/summaries" },
        { name: "Bookmarks", path: "/bookmarks" },
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
        { name: "Classroom Analytics", path: "/analytics" },
        { name: "Activity History", path: "/history" },
      ];

    case "ADMIN":
      return [
        { name: "Dashboard", path: "/dashboard" },
        { name: "User Management", path: "/users" },
        { name: "Platform Analytics", path: "/analytics" },
        { name: "Manage Videos", path: "/videos" },
        { name: "Storage Monitoring", path: "/storage" },
        { name: "AI Processing Jobs", path: "/jobs" },
        { name: "Audit Logs", path: "/audit-logs" },
        { name: "Platform Settings", path: "/settings" },
      ];

    default:
      return [];
  }
}