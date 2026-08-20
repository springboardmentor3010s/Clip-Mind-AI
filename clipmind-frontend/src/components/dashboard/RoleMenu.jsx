"use client";

export default function RoleMenu({ role }) {
  switch (role) {
    // =========================================================
    // LEARNER REQUIREMENTS
    // =========================================================
    case "LEARNER":
  return [
    {
      name: "Dashboard",
      path: "/dashboard"
    },
    {
      name: "My Classrooms",
      path: "/my-classrooms"
    },
    {
      name: "Browse Videos",
      path: "/videos"
    },
    {
      name: "Learning History",
      path: "/history"
    },
    {
      name: "Bookmarks",
      path: "/bookmarks"
    }
  ];


    // =========================================================
    // CONTENT CREATOR
    // Already completed - keeping existing implementation
    // =========================================================
    case "CONTENT_CREATOR":
      return [
        {
          name: "Dashboard",
          path: "/dashboard"
        },
        {
          name: "Upload Videos",
          path: "/upload"
        },
        {
          name: "My Uploads",
          path: "/videos"
        },
        {
          name: "Transcripts",
          path: "/transcripts"
        },
        {
          name: "AI Summaries",
          path: "/summaries"
        },
        {
          name: "Key Moments",
          path: "/key-moments"
        },
        {
          name: "Analytics",
          path: "/analytics"
        },
        {
          name: "Activity History",
          path: "/history"
        }
      ];


    // =========================================================
    // EDUCATOR REQUIREMENTS
    // =========================================================
    case "EDUCATOR":
      return [
        {
          name: "Dashboard",
          path: "/dashboard"
        },

        {
          name: "Classrooms",
          path: "/classrooms"
        },

        {
          name: "Upload Lecture",
          path: "/upload"
        },
        {
          name: "Educational Summaries",
          path: "/summaries"
        },
        {
          name: "Edit Transcript",
          path: "/transcripts"
        },
        {
          name: "Share Summaries",
          path: "/share-summaries"
        },
        {
          name: "Learning Materials",
          path: "/learning-materials"
        },
        {
          name: "Classroom Analytics",
          path: "/analytics"
        },
        {
          name: "Student Engagement",
          path: "/student-engagement"
        }
      ];


    // =========================================================
    // ADMIN REQUIREMENTS
    // =========================================================
    case "ADMIN":
      return [
        {
          name: "Dashboard",
          path: "/dashboard"
        },
        {
          name: "Manage Users & Roles",
          path: "/admin/users"
        },
        {
          name: "Platform Activity",
          path: "/admin/activity"
        },
        {
          name: "Manage Content",
          path: "/admin/content"
        },
        {
          name: "System Analytics",
          path: "/admin/analytics"
        },
        {
          name: "Platform Settings",
          path: "/admin/settings"
        },
        {
          name: "AI Processing Jobs",
          path: "/admin/ai-jobs"
        },
        {
          name: "Storage & Resources",
          path: "/admin/storage"
        },
        {
          name: "Audit Logs & Reports",
          path: "/admin/audit-logs"
        }
      ];


    default:
      return [];
  }
}