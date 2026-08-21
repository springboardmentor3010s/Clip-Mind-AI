import { createFileRoute } from "@tanstack/react-router";
import { FiBarChart2, FiClock, FiFileText, FiUsers } from "react-icons/fi";
import { useAuth } from "../../context/AuthContext";

export const Route = createFileRoute("/_authenticated/system-analytics")({
  component: SystemAnalytics,
});

function SystemAnalytics() {
  const { user } = useAuth();

  if (user?.role !== "Administrator") {
    return (
      <div className="rounded-2xl border border-border bg-card p-8">
        <h1 className="font-display text-2xl">Access denied</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          This page is available only to administrators.
        </p>
      </div>
    );
  }

  const stats = [
    {
      label: "Total users",
      value: "4",
      icon: FiUsers,
      description: "Registered platform users",
    },
    {
      label: "Recordings processed",
      value: "1",
      icon: FiFileText,
      description: "Successfully processed recordings",
    },
    {
      label: "Minutes analysed",
      value: "1",
      icon: FiClock,
      description: "Total processed video duration",
    },
    {
      label: "AI actions",
      value: "6",
      icon: FiBarChart2,
      description: "AI-generated insights and outputs",
    },
  ];

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-border bg-card p-7">
        <div className="text-[11px] uppercase tracking-widest text-muted-foreground">
          Administrator
        </div>

        <h1 className="mt-2 font-display text-3xl md:text-4xl">
          System Analytics
        </h1>

        <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
          Monitor platform usage, processing activity and system-level
          performance across ClipMind AI.
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => {
          const Icon = stat.icon;

          return (
            <div
              key={stat.label}
              className="rounded-2xl border border-border bg-card p-5"
            >
              <div className="h-10 w-10 rounded-lg border border-border bg-muted flex items-center justify-center text-primary">
                <Icon />
              </div>

              <div className="mt-4 text-[11px] uppercase tracking-widest text-muted-foreground">
                {stat.label}
              </div>

              <div className="mt-2 font-display text-2xl">
                {stat.value}
              </div>

              <p className="mt-1 text-xs text-muted-foreground">
                {stat.description}
              </p>
            </div>
          );
        })}
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-2xl border border-border bg-card p-6">
          <h2 className="font-display text-lg">Platform Overview</h2>

          <div className="mt-5 space-y-4">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Active users</span>
              <span className="font-medium">4</span>
            </div>

            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Content creators</span>
              <span className="font-medium">1</span>
            </div>

            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Educators</span>
              <span className="font-medium">1</span>
            </div>

            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Learners</span>
              <span className="font-medium">1</span>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-border bg-card p-6">
          <h2 className="font-display text-lg">Processing Status</h2>

          <div className="mt-5 rounded-xl border border-border bg-muted/40 p-4">
            <div className="flex items-center justify-between">
              <span className="text-sm">Processing pipeline</span>

              <span className="rounded-full bg-primary/10 px-2.5 py-1 text-xs text-primary">
                Operational
              </span>
            </div>

            <p className="mt-2 text-xs text-muted-foreground">
              Video processing, transcript generation and AI analysis services
              are available.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}