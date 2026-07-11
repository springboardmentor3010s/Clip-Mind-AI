"use client";

import { useAuth } from "../../../lib/AuthContext";
import { FilmIcon } from "../../../components/ui/icons";

export default function LearnerDashboard() {
  const { user } = useAuth();

  return (
    <div>
      <h1 className="font-display text-2xl font-semibold tracking-tight text-ink dark:text-paper">Dashboard</h1>
      <p className="mt-1 mb-8 text-sm text-ink/50 dark:text-paper/50">Welcome back, {user?.full_name}!</p>

      <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-line bg-cloud p-14 text-center dark:border-line-dark dark:bg-graphite">
        <span className="flex h-12 w-12 items-center justify-center rounded-full bg-signal/10 text-signal dark:bg-signal-dark/15 dark:text-signal-dark">
          <FilmIcon width={22} height={22} />
        </span>
        <p className="mt-3 text-sm font-medium text-ink dark:text-paper">Content library coming soon</p>
        <p className="mt-1 max-w-sm text-sm text-ink/45 dark:text-paper/45">
          Browsing shared videos, transcripts, and summaries will be available once content sharing is built.
        </p>
      </div>
    </div>
  );
}
