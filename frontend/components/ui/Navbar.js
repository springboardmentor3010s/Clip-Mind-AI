"use client";

import Link from "next/link";
import { useAuth } from "../../lib/AuthContext";
import ThemeToggle from "./ThemeToggle";

const ROLE_LABELS = {
  content_creator: "Content Creator",
  learner: "Learner",
  educator: "Educator",
  administrator: "Administrator",
};

export default function Navbar() {
  const { user, logout } = useAuth();

  if (!user) return null;

  const initials = user.full_name
    .split(" ")
    .map((p) => p[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <nav className="flex items-center justify-between border-b border-line bg-cloud px-6 py-3 dark:border-line-dark dark:bg-graphite">
      <Link href="/dashboard" className="flex items-center gap-2 font-display text-sm font-semibold tracking-tight">
        <span className="h-2 w-2 rounded-full bg-signal" />
        ClipMind AI
      </Link>

      <div className="flex items-center gap-4">
        <span className="hidden font-mono text-[11px] uppercase tracking-wide text-ink/60 sm:inline dark:text-paper/60">
          {ROLE_LABELS[user.role] || user.role}
        </span>
        <ThemeToggle />
        <Link
          href="/dashboard/profile"
          title="View profile"
          className="flex h-8 w-8 items-center justify-center rounded-full bg-signal/10 font-mono text-xs font-medium text-signal hover:bg-signal/20 dark:bg-signal-dark/20 dark:text-signal-dark dark:hover:bg-signal-dark/30"
        >
          {initials}
        </Link>
        <button
          onClick={logout}
          className="font-mono text-[11px] uppercase tracking-wide text-ink/50 hover:text-ink dark:text-paper/50 dark:hover:text-paper"
        >
          Log out
        </button>
      </div>
    </nav>
  );
}