"use client";
import { useEffect, useState } from "react";
import { Sun, Moon } from "lucide-react";

/**
 * Toggles [data-theme] on <html> between "light" and "dark", persisted
 * to localStorage. Dashboard (Phase 2) pages hardcode dark surfaces
 * today, so the pre-hydration script in app/layout.tsx defaults new
 * visitors to dark until Phase 2 finishes the light-theme pass there.
 */
export default function ThemeToggle({ className = "" }) {
  const [theme, setTheme] = useState("dark");

  useEffect(() => {
    setTheme(document.documentElement.dataset.theme || "dark");
  }, []);

  const toggle = () => {
    const next = theme === "dark" ? "light" : "dark";
    document.documentElement.dataset.theme = next;
    localStorage.setItem("theme", next);
    setTheme(next);
  };

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={theme === "dark" ? "Switch to light theme" : "Switch to dark theme"}
      className={`inline-flex h-9 w-9 items-center justify-center rounded-full text-md-on-surface-variant hover:bg-md-on-surface/10 transition-colors ${className}`}
    >
      {theme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
    </button>
  );
}
