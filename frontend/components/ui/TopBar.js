"use client";

import { useState, useRef, useEffect } from "react";
import { useAuth } from "../../lib/AuthContext";
import { useTheme } from "../../lib/ThemeContext";
import { BellIcon, SunIcon, MoonIcon, LogOutIcon, ChevronDownIcon } from "./icons";

export default function TopBar() {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    function onClickOutside(e) {
      if (menuRef.current && !menuRef.current.contains(e.target)) setMenuOpen(false);
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  if (!user) return null;

  const initials = user.full_name.split(" ").map((p) => p[0]).join("").slice(0, 2).toUpperCase();

  return (
    <div className="flex items-center justify-end gap-2 border-b border-line bg-cloud px-8 py-3 dark:border-line-dark dark:bg-graphite">
      <button
        title="Notifications"
        className="flex h-9 w-9 items-center justify-center rounded-full text-ink/50 hover:bg-paper dark:text-paper/50 dark:hover:bg-graphite-2"
      >
        <BellIcon width={19} height={19} />
      </button>

      <div className="relative" ref={menuRef}>
        <button
          onClick={() => setMenuOpen((o) => !o)}
          className="flex items-center gap-1.5 rounded-full py-1 pl-1 pr-2 hover:bg-paper dark:hover:bg-graphite-2"
        >
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-signal/10 font-mono text-[11px] font-medium text-signal dark:bg-signal-dark/20 dark:text-signal-dark">
            {initials}
          </span>
          <ChevronDownIcon width={14} height={14} className="text-ink/40 dark:text-paper/40" />
        </button>

        {menuOpen && (
          <div className="absolute right-0 top-11 z-30 w-52 overflow-hidden rounded-lg border border-line bg-cloud shadow-lg dark:border-line-dark dark:bg-graphite">
            <div className="border-b border-line px-4 py-3 dark:border-line-dark">
              <p className="truncate text-sm font-medium text-ink dark:text-paper">{user.full_name}</p>
              <p className="truncate text-xs text-ink/50 dark:text-paper/50">{user.email}</p>
            </div>
            <button
              onClick={toggleTheme}
              className="flex w-full items-center gap-2.5 px-4 py-2.5 text-left text-sm text-ink/70 hover:bg-paper dark:text-paper/70 dark:hover:bg-graphite-2"
            >
              {theme === "dark" ? <SunIcon width={16} height={16} /> : <MoonIcon width={16} height={16} />}
              {theme === "dark" ? "Light mode" : "Dark mode"}
            </button>
            <button
              onClick={logout}
              className="flex w-full items-center gap-2.5 px-4 py-2.5 text-left text-sm text-danger hover:bg-danger/5"
            >
              <LogOutIcon width={16} height={16} />
              Log out
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
