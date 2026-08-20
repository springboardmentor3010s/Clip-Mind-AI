"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "../../lib/AuthContext";
import { useTheme } from "../../lib/ThemeContext";
import {
  HomeIcon,
  FilmIcon,
  UploadIcon,
  BarChartIcon,
  BookmarkIcon,
  UsersIcon,
  SettingsIcon,
  HelpIcon,
  PanelIcon,
  ChevronDownIcon,
  GraduationCapIcon,
  SunIcon,
  MoonIcon,
  LogOutIcon,
} from "./icons";

const NAV_BY_ROLE = {
  content_creator: [
    { href: "/dashboard/content-creator", label: "Dashboard", icon: HomeIcon },
    { href: "/dashboard/content-creator/videos", label: "My Videos", icon: FilmIcon },
    { href: "/dashboard/upload", label: "Upload Video", icon: UploadIcon },
    { href: "/dashboard/analytics", label: "Analytics", icon: BarChartIcon },
    { href: "/dashboard/shared", label: "Shared with Me", icon: UsersIcon },
    { href: "/dashboard/bookmarks", label: "Bookmarks", icon: BookmarkIcon },
  ],
  educator: [
    { href: "/dashboard/educator", label: "Dashboard", icon: HomeIcon },
    { href: "/dashboard/educator/videos", label: "My Videos", icon: FilmIcon },
    { href: "/dashboard/upload", label: "Upload Video", icon: UploadIcon },
    { href: "/dashboard/educator/classrooms", label: "Classrooms", icon: GraduationCapIcon },
    { href: "/dashboard/analytics", label: "Analytics", icon: BarChartIcon },
    { href: "/dashboard/shared", label: "Shared with Me", icon: UsersIcon },
    { href: "/dashboard/bookmarks", label: "Bookmarks", icon: BookmarkIcon },
  ],
  learner: [
    { href: "/dashboard/learner", label: "Dashboard", icon: HomeIcon },
    { href: "/dashboard/learner/classrooms", label: "My Classrooms", icon: GraduationCapIcon },
    { href: "/dashboard/shared", label: "Shared with Me", icon: UsersIcon },
    { href: "/dashboard/bookmarks", label: "Bookmarks", icon: BookmarkIcon },
  ],
  administrator: [
    { href: "/dashboard/admin", label: "Dashboard", icon: HomeIcon },
    { href: "/dashboard/shared", label: "Shared with Me", icon: UsersIcon },
  ],
};

const ROLE_LABELS = {
  content_creator: "Content Creator",
  learner: "Learner",
  educator: "Educator",
  administrator: "Administrator",
};

export default function Sidebar() {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const pathname = usePathname();
  const [open, setOpen] = useState(true);
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

  const items = [
    ...(NAV_BY_ROLE[user.role] || []),
    { href: "/dashboard/settings", label: "Settings", icon: SettingsIcon },
    { href: "/dashboard/help", label: "Help & Support", icon: HelpIcon },
  ];
  const initials = user.full_name.split(" ").map((p) => p[0]).join("").slice(0, 2).toUpperCase();

  if (!open) {
    return (
      <aside className="flex h-full w-14 shrink-0 flex-col items-center border-r border-line bg-cloud py-4 dark:border-line-dark dark:bg-graphite">
        <button
          onClick={() => setOpen(true)}
          title="Open sidebar"
          className="mb-4 flex h-9 w-9 items-center justify-center rounded-lg text-ink/50 hover:bg-paper dark:text-paper/60 dark:hover:bg-graphite-2"
        >
          <PanelIcon />
        </button>

        <nav className="flex flex-1 flex-col items-center gap-1 overflow-y-auto">
          {items.map((item) => {
            const active = pathname === item.href;
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                title={item.label}
                className={`flex h-9 w-9 items-center justify-center rounded-lg transition-colors ${
                  active
                    ? "bg-signal/10 text-signal dark:bg-signal-dark/15 dark:text-signal-dark"
                    : "text-ink/55 hover:bg-paper dark:text-paper/60 dark:hover:bg-graphite-2"
                }`}
              >
                <Icon width={18} height={18} />
              </Link>
            );
          })}
        </nav>

        <div className="relative mt-2" ref={menuRef}>
          {menuOpen && (
            <div className="absolute bottom-0 left-full z-30 ml-2 w-52 overflow-hidden rounded-lg border border-line bg-cloud shadow-lg dark:border-line-dark dark:bg-graphite">
              <div className="border-b border-line px-4 py-3 dark:border-line-dark">
                <p className="truncate text-sm font-medium text-ink dark:text-paper">{user.full_name}</p>
                <p className="truncate text-xs text-ink/50 dark:text-paper/50">{user.email}</p>
              </div>
              <Link
                href="/dashboard/profile"
                onClick={() => setMenuOpen(false)}
                className="flex w-full items-center gap-2.5 px-4 py-2.5 text-left text-sm text-ink/70 hover:bg-paper dark:text-paper/70 dark:hover:bg-graphite-2"
              >
                View profile
              </Link>
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

          <button
            onClick={() => setMenuOpen((o) => !o)}
            title={user.full_name}
            className="flex h-9 w-9 items-center justify-center rounded-full bg-signal/10 font-mono text-xs font-medium text-signal hover:bg-signal/20 dark:bg-signal-dark/20 dark:text-signal-dark dark:hover:bg-signal-dark/30"
          >
            {initials}
          </button>
        </div>
      </aside>
    );
  }

  return (
    <aside className="flex h-full w-64 shrink-0 flex-col border-r border-line bg-cloud dark:border-line-dark dark:bg-graphite">
      <div className="flex items-center justify-between px-5 py-5">
        <div className="flex items-center gap-2">
          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-signal text-white">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5.5v13l11-6.5-11-6.5Z" /></svg>
          </span>
          <span className="font-display text-base font-semibold tracking-tight text-ink dark:text-paper">ClipMind AI</span>
        </div>
        <button
          onClick={() => setOpen(false)}
          title="Close sidebar"
          className="flex h-7 w-7 items-center justify-center rounded-md text-ink/40 hover:bg-paper dark:text-paper/40 dark:hover:bg-graphite-2"
        >
          <PanelIcon />
        </button>
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto px-3">
        {items.map((item) => {
          const active = pathname === item.href;
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors ${
                active
                  ? "bg-signal/10 font-medium text-signal dark:bg-signal-dark/15 dark:text-signal-dark"
                  : "text-ink/55 hover:bg-paper dark:text-paper/60 dark:hover:bg-graphite-2"
              }`}
            >
              <Icon width={17} height={17} className="shrink-0" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="relative border-t border-line p-3 dark:border-line-dark" ref={menuRef}>
        {menuOpen && (
          <div className="absolute bottom-[calc(100%-4px)] left-3 right-3 z-30 overflow-hidden rounded-lg border border-line bg-cloud shadow-lg dark:border-line-dark dark:bg-graphite">
            <div className="border-b border-line px-4 py-3 dark:border-line-dark">
              <p className="truncate text-sm font-medium text-ink dark:text-paper">{user.full_name}</p>
              <p className="truncate text-xs text-ink/50 dark:text-paper/50">{user.email}</p>
            </div>
            <Link
              href="/dashboard/profile"
              onClick={() => setMenuOpen(false)}
              className="flex w-full items-center gap-2.5 px-4 py-2.5 text-left text-sm text-ink/70 hover:bg-paper dark:text-paper/70 dark:hover:bg-graphite-2"
            >
              View profile
            </Link>
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

        <button
          onClick={() => setMenuOpen((o) => !o)}
          className="flex w-full items-center gap-3 rounded-lg p-2 hover:bg-paper dark:hover:bg-graphite-2"
        >
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-signal/10 font-mono text-xs font-medium text-signal dark:bg-signal-dark/20 dark:text-signal-dark">
            {initials}
          </span>
          <span className="min-w-0 flex-1 text-left">
            <span className="block truncate text-sm font-medium text-ink dark:text-paper">{user.full_name}</span>
            <span className="block truncate font-mono text-[10px] uppercase tracking-wide text-ink/45 dark:text-paper/45">
              {ROLE_LABELS[user.role] || user.role}
            </span>
          </span>
          <ChevronDownIcon width={14} height={14} className="shrink-0 text-ink/40 dark:text-paper/40" />
        </button>
      </div>
    </aside>
  );
}