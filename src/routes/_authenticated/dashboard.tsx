import { createFileRoute, Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import {
  FiUploadCloud,
  FiCpu,
  FiFileText,
  FiLayers,
  FiBarChart2,
  FiArrowRight,
  FiBookOpen,
  FiClock,
  FiUsers,
  FiSettings,
} from "react-icons/fi";
import { useAuth } from "../../context/AuthContext";
import { useWorkspace } from "../../context/WorkspaceContext";
import { EmptyState } from "../../components/EmptyState";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({
    meta: [
      { title: "Workspace — ClipMind AI" },
      {
        name: "description",
        content:
          "Your ClipMind AI workspace for video processing, transcripts, summaries, key moments and analytics.",
      },
      { property: "og:title", content: "Workspace — ClipMind AI" },
      {
        property: "og:description",
        content:
          "Manage and review ClipMind AI content based on your role.",
      },
    ],
  }),
  component: Dashboard,
});

function Dashboard() {
  const { user } = useAuth();
  const { videos, active } = useWorkspace();

  const role = user?.role;

  const processed = videos.filter(
    (video) => video.status === "Processed"
  ).length;

  const totalMinutes = Math.round(
    videos.reduce(
      (total, video) => total + video.durationSeconds,
      0
    ) / 60
  );

  const totalMoments = videos.reduce(
    (total, video) => total + video.moments.length,
    0
  );

  /*
   * ---------------------------------------------------------
   * ROLE-SPECIFIC CONTENT
   * ---------------------------------------------------------
   *
   * Content Creator:
   * Create and manage summarized content for audiences.
   *
   * Learner:
   * Consume educational/informational content efficiently.
   *
   * Educator:
   * Transform long educational content into concise
   * learning resources.
   *
   * Administrator:
   * Maintain platform operations, security and performance.
   * ---------------------------------------------------------
   */

  const roleContent = {
    "Content Creator": {
      workspaceLabel: "Content Creator workspace",
      description:
        "Upload recordings to generate transcripts, AI summaries, key moments and content analytics. Manage your processed content from your workspace.",
      showUpload: true,
      uploadLabel: "Upload recording",
      emptyTitle: "No recordings in this workspace yet",
      emptyDescription:
        "Upload your first recording to generate a transcript, AI summary, key moments and analytics.",
    },

    Learner: {
      workspaceLabel: "Learner workspace",
      description:
        "Explore available educational and informational content, read generated summaries, review transcripts and jump to important moments.",
      showUpload: false,
      uploadLabel: "",
      emptyTitle: "No learning content available yet",
      emptyDescription:
        "Uploaded educational content, transcripts, summaries and key moments will appear here when available.",
    },

    Educator: {
      workspaceLabel: "Educator workspace",
      description:
        "Upload lecture videos to generate transcripts, educational summaries and key moments. Review content, create learning resources and monitor classroom insights.",
      showUpload: true,
      uploadLabel: "Upload lecture video",
      emptyTitle: "No lecture recordings in this workspace yet",
      emptyDescription:
        "Upload your first lecture video to generate a transcript, educational summary, key moments and classroom analytics.",
    },

    Administrator: {
      workspaceLabel: "Administrator workspace",
      description:
        "Monitor the ClipMind AI platform, review uploaded content and platform activity, and manage system operations and configuration.",
      showUpload: false,
      uploadLabel: "",
      emptyTitle: "No platform content available",
      emptyDescription:
        "Platform content, activity and processing information will appear here as the system is used.",
    },
  } as const;

  const currentRole =
    role && role in roleContent
      ? roleContent[role as keyof typeof roleContent]
      : roleContent["Content Creator"];

  /*
   * ---------------------------------------------------------
   * ROLE-SPECIFIC MODULES
   * ---------------------------------------------------------
   */

  const creatorModules = [
    {
      icon: FiFileText,
      label: "Transcript",
      to: "/transcript",
      desc: "Review and edit timestamped transcripts",
    },
    {
      icon: FiCpu,
      label: "AI Summary",
      to: "/summary",
      desc: "Generate concise content summaries",
    },
    {
      icon: FiLayers,
      label: "Key Moments",
      to: "/moments",
      desc: "Find important segments and highlights",
    },
    {
      icon: FiBarChart2,
      label: "Analytics",
      to: "/analytics",
      desc: "Review content insights and statistics",
    },
  ];

  const learnerModules = [
    {
      icon: FiBookOpen,
      label: "AI Summary",
      to: "/summary",
      desc: "Read generated content summaries",
    },
    {
      icon: FiFileText,
      label: "Transcript",
      to: "/transcript",
      desc: "Access and search transcripts",
    },
    {
      icon: FiLayers,
      label: "Key Moments",
      to: "/moments",
      desc: "View important moments and timestamps",
    },
    {
      icon: FiClock,
      label: "History",
      to: "/history",
      desc: "Review your learning history",
    },
  ];

  const educatorModules = [
    {
      icon: FiFileText,
      label: "Transcript",
      to: "/transcript",
      desc: "Review and edit lecture transcripts",
    },
    {
      icon: FiCpu,
      label: "AI Summary",
      to: "/summary",
      desc: "Generate educational summaries",
    },
    {
      icon: FiLayers,
      label: "Key Moments",
      to: "/moments",
      desc: "Identify important lecture segments",
    },
    {
      icon: FiBarChart2,
      label: "Analytics",
      to: "/analytics",
      desc: "Review classroom content insights",
    },
  ];

  const adminModules = [
    {
  icon: FiUsers,
  label: "User Management",
  to: "/users",
  desc: "Manage users and roles",
},
    {
      icon: FiBarChart2,
      label: "System Analytics",
      to: "/system-analytics",
      desc: "Review platform analytics",
    },
    {
      icon: FiClock,
      label: "Platform Activity",
      to: "/platform-activity",
      desc: "Monitor platform activity",
    },
    {
      icon: FiSettings,
      label: "Platform Settings",
      to: "/platform-settings",
      desc: "Configure platform settings",
    },
  ];

  let modules = creatorModules;

  if (role === "Learner") {
    modules = learnerModules;
  } else if (role === "Educator") {
    modules = educatorModules;
  } else if (role === "Administrator") {
    modules = adminModules;
  }

  return (
    <div className="space-y-6">
      {/* ---------------------------------------------------
          ROLE-SPECIFIC WELCOME
      --------------------------------------------------- */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-2xl border border-border bg-card p-7"
      >
        <div className="text-[11px] uppercase tracking-widest text-muted-foreground">
          {currentRole.workspaceLabel}
        </div>

        <h1 className="mt-2 font-display text-3xl md:text-4xl">
          {user?.name?.split(" ")[0] || "Welcome"}
        </h1>

        <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
          {currentRole.description}
        </p>

        <div className="mt-5 flex flex-wrap gap-2">
          {/* Upload is ONLY available to Content Creator and Educator */}
          {currentRole.showUpload && (
            <Link
              to="/upload"
              className="h-10 inline-flex items-center gap-2 rounded-xl bg-gradient-primary px-4 text-sm font-medium text-white"
            >
              <FiUploadCloud />
              {currentRole.uploadLabel}
            </Link>
          )}

          {/* History is useful for Creator, Learner and Educator.
              Admin already has Activity instead. */}
          {role !== "Administrator" && (
            <Link
              to="/history"
              className="h-10 inline-flex items-center gap-2 rounded-xl border border-border bg-card px-4 text-sm"
            >
              <FiClock />
              {role === "Learner"
                ? "Open learning history"
                : "Open archive"}
            </Link>
          )}
        </div>
      </motion.div>

      {/* ---------------------------------------------------
          WORKSPACE STATISTICS
          These are based on the current user's workspace data.
      --------------------------------------------------- */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {[
          {
            label:
              role === "Learner"
                ? "Content available"
                : role === "Administrator"
                ? "Recordings available"
                : "Recordings processed",
            value: processed,
          },
          {
            label:
              role === "Learner"
                ? "Minutes available"
                : "Minutes analysed",
            value: totalMinutes,
          },
          {
            label:
              role === "Learner"
                ? "Key moments available"
                : "Key moments extracted",
            value: totalMoments,
          },
          {
            label:
              role === "Learner"
                ? "Current content"
                : "Active recording",
            value: active ? active.title : "None",
          },
        ].map((stat) => (
          <div
            key={stat.label}
            className="rounded-2xl border border-border bg-card p-5"
          >
            <div className="text-[11px] uppercase tracking-widest text-muted-foreground">
              {stat.label}
            </div>

            <div className="mt-2 font-display text-xl truncate">
              {stat.value}
            </div>
          </div>
        ))}
      </div>

      {/* ---------------------------------------------------
          ROLE-SPECIFIC MODULES
      --------------------------------------------------- */}
      <section>
        <h2 className="font-display text-xl">
          {role === "Learner"
            ? "Learning modules"
            : role === "Educator"
            ? "Teaching modules"
            : role === "Administrator"
            ? "Administration modules"
            : "Content modules"}
        </h2>

        <div className="mt-4 grid gap-3 md:grid-cols-4">
          {modules.map((module) => {
            const Icon = module.icon;

            return (
              <Link
                key={module.label}
                to={module.to}
                className="group rounded-2xl border border-border bg-card p-5 hover:border-primary/50 transition-colors"
              >
                <div className="h-10 w-10 rounded-lg border border-border bg-muted flex items-center justify-center text-primary">
                  <Icon />
                </div>

                <div className="mt-4 flex items-center justify-between">
                  <span className="text-sm font-semibold">
                    {module.label}
                  </span>

                  <FiArrowRight className="text-muted-foreground group-hover:text-primary transition-colors" />
                </div>

                <p className="mt-1 text-xs text-muted-foreground">
                  {module.desc}
                </p>
              </Link>
            );
          })}
        </div>
      </section>

      {/* ---------------------------------------------------
          EMPTY STATE
      --------------------------------------------------- */}
      {videos.length === 0 && (
        <EmptyState
          title={currentRole.emptyTitle}
          description={currentRole.emptyDescription}
        />
      )}
    </div>
  );
}