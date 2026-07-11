"use client";

import { useAuth } from "../../../lib/AuthContext";
import { useTheme } from "../../../lib/ThemeContext";
import { SunIcon, MoonIcon } from "../../../components/ui/icons";

export default function SettingsPage() {
  const { user } = useAuth();
  const { theme, toggleTheme } = useTheme();

  return (
    <div className="max-w-xl">
      <h1 className="mb-1 font-display text-xl font-semibold tracking-tight text-ink dark:text-paper">Settings</h1>
      <p className="mb-8 text-sm text-ink/50 dark:text-paper/50">Manage app preferences</p>

      <div className="rounded-xl border border-line bg-cloud p-6 dark:border-line-dark dark:bg-graphite">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-ink dark:text-paper">Appearance</p>
            <p className="text-xs text-ink/45 dark:text-paper/45">Switch between light and dark mode</p>
          </div>
          <button
            onClick={toggleTheme}
            className="flex items-center gap-2 rounded-lg border border-line px-3.5 py-2 text-sm text-ink dark:border-line-dark dark:text-paper"
          >
            {theme === "dark" ? <SunIcon width={16} height={16} /> : <MoonIcon width={16} height={16} />}
            {theme === "dark" ? "Light" : "Dark"}
          </button>
        </div>
      </div>

      <p className="mt-4 text-sm text-ink/45 dark:text-paper/45">
        For profile details and password, visit your{" "}
        <a href="/dashboard/profile" className="font-medium text-signal">Profile Settings</a>.
      </p>
    </div>
  );
}
