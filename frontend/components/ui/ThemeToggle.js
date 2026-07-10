"use client";

import { useTheme } from "../../lib/ThemeContext";

export default function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label="Toggle dark mode"
      className="rounded-md border border-line px-3 py-1.5 font-mono text-[11px] uppercase tracking-wide text-ink hover:bg-line/30 dark:border-line-dark dark:text-paper dark:hover:bg-graphite-2"
    >
      {theme === "dark" ? "Light" : "Dark"}
    </button>
  );
}