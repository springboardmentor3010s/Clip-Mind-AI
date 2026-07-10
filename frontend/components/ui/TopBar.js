"use client";

import { useAuth } from "../../lib/AuthContext";
import ThemeToggle from "./ThemeToggle";

export default function TopBar() {
  const { user, logout } = useAuth();
  if (!user) return null;

  return (
    <div className="flex items-center justify-end gap-3 border-b border-line bg-cloud px-8 py-3 dark:border-line-dark dark:bg-graphite">
      <ThemeToggle />
      <button
        onClick={logout}
        className="rounded-md border border-line px-3 py-1.5 font-mono text-[11px] uppercase tracking-wide text-ink hover:bg-line/30 dark:border-line-dark dark:text-paper dark:hover:bg-graphite-2"
      >
        Log out
      </button>
    </div>
  );
}