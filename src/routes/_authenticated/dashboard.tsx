import { createFileRoute, Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { FiUploadCloud, FiCpu, FiFileText, FiLayers, FiBarChart2, FiArrowRight } from "react-icons/fi";
import { useAuth } from "../../context/AuthContext";
import { useWorkspace } from "../../context/WorkspaceContext";
import { EmptyState } from "../../components/EmptyState";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({
    meta: [
      { title: "Workspace — ClipMind AI" },
      { name: "description", content: "Your ClipMind AI research workspace: process recordings and review generated transcripts, summaries, moments and analytics." },
      { property: "og:title", content: "Workspace — ClipMind AI" },
      { property: "og:description", content: "Process recordings and review generated research outputs." },
    ],
  }),
  component: Dashboard,
});

const modules = [
  { icon: FiFileText, label: "Transcript", to: "/transcript", desc: "Timestamp-aligned segments" },
  { icon: FiCpu, label: "AI Summary", to: "/summary", desc: "Abstract, findings, topics" },
  { icon: FiLayers, label: "Key Moments", to: "/moments", desc: "Ranked jump-to markers" },
  { icon: FiBarChart2, label: "Analytics", to: "/analytics", desc: "Speakers, keywords, curve" },
];

function Dashboard() {
  const { user } = useAuth();
  const { videos, active } = useWorkspace();
  const processed = videos.filter((v) => v.status === "Processed").length;
  const totalMinutes = Math.round(videos.reduce((n, v) => n + v.durationSeconds, 0) / 60);
  const totalMoments = videos.reduce((n, v) => n + v.moments.length, 0);

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
        className="rounded-2xl border border-border bg-card p-7"
      >
        <div className="text-[11px] uppercase tracking-widest text-muted-foreground">{user?.role} workspace</div>
        <h1 className="mt-2 font-display text-3xl md:text-4xl">{user?.name?.split(" ")[0] || "Welcome"}</h1>
        <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
          Upload a recording to run the processing pipeline. All transcripts, summaries, key moments and
          analytics on this platform are generated from your own uploads.
        </p>
        <div className="mt-5 flex flex-wrap gap-2">
  {user?.role === "Content Creator" && (
    <Link
      to="/upload"
      className="h-10 inline-flex items-center gap-2 rounded-xl bg-gradient-primary px-4 text-sm font-medium text-white"
    >
      <FiUploadCloud /> Upload recording
    </Link>
  )}

  <Link
    to="/history"
    className="h-10 inline-flex items-center gap-2 rounded-xl border border-border bg-card px-4 text-sm"
  >
    Open archive
  </Link>
</div>
      </motion.div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: "Recordings processed", value: processed },
          { label: "Minutes analysed", value: totalMinutes },
          { label: "Key moments extracted", value: totalMoments },
          { label: "Active recording", value: active ? active.title : "None" },
        ].map((s) => (
          <div key={s.label} className="rounded-2xl border border-border bg-card p-5">
            <div className="text-[11px] uppercase tracking-widest text-muted-foreground">{s.label}</div>
            <div className="mt-2 font-display text-xl truncate">{s.value}</div>
          </div>
        ))}
      </div>

      <section>
        <h2 className="font-display text-xl">Pipeline modules</h2>
        <div className="mt-4 grid gap-3 md:grid-cols-4">
          {modules.map((m) => (
            <Link key={m.label} to={m.to} className="group rounded-2xl border border-border bg-card p-5 hover:border-primary/50 transition-colors">
              <div className="h-10 w-10 rounded-lg border border-border bg-muted flex items-center justify-center text-primary">
                <m.icon />
              </div>
              <div className="mt-4 flex items-center justify-between">
                <span className="text-sm font-semibold">{m.label}</span>
                <FiArrowRight className="text-muted-foreground group-hover:text-primary transition-colors" />
              </div>
              <p className="mt-1 text-xs text-muted-foreground">{m.desc}</p>
            </Link>
          ))}
        </div>
      </section>

      {videos.length === 0 && (
        <EmptyState
          title="No recordings in this workspace yet"
          description="Run your first upload to populate the transcript, summary, key moments and analytics modules."
        />
      )}
    </div>
  );
}
