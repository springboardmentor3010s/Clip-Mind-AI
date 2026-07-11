"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "../../lib/AuthContext";
import {
  HomeIcon,
  FilmIcon,
  UploadIcon,
  BarChartIcon,
  BookmarkIcon,
  SettingsIcon,
  HelpIcon,
  PanelIcon,
} from "./icons";

const NAV_BY_ROLE = {
  content_creator: [
    { href: "/dashboard/content-creator", label: "Dashboard", icon: HomeIcon },
    { href: "/dashboard/content-creator/videos", label: "My Videos", icon: FilmIcon },
    { href: "/dashboard/upload", label: "Upload Video", icon: UploadIcon },
    { href: "/dashboard/analytics", label: "Analytics", icon: BarChartIcon },
    { href: "/dashboard/bookmarks", label: "Bookmarks", icon: BookmarkIcon },
  ],
  educator: [
    { href: "/dashboard/educator", label: "Dashboard", icon: HomeIcon },
    { href: "/dashboard/educator/videos", label: "My Videos", icon: FilmIcon },
    { href: "/dashboard/upload", label: "Upload Video", icon: UploadIcon },
    { href: "/dashboard/analytics", label: "Analytics", icon: BarChartIcon },
    { href: "/dashboard/bookmarks", label: "Bookmarks", icon: BookmarkIcon },
  ],
  learner: [
    { href: "/dashboard/learner", label: "Dashboard", icon: HomeIcon },
    { href: "/dashboard/bookmarks", label: "Bookmarks", icon: BookmarkIcon },
  ],
  administrator: [
    { href: "/dashboard/admin", label: "Dashboard", icon: HomeIcon },
    { href: "/dashboard/analytics", label: "Analytics", icon: BarChartIcon },
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
  const pathname = usePathname();
  const [open, setOpen] = useState(true);

  if (!user) return null;

  const items = [
    ...(NAV_BY_ROLE[user.role] || []),
    { href: "/dashboard/settings", label: "Settings", icon: SettingsIcon },
    { href: "/dashboard/help", label: "Help & Support", icon: HelpIcon },
  ];
  const initials = user.full_name.split(" ").map((p) => p[0]).join("").slice(0, 2).toUpperCase();

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        title="Open sidebar"
        className="fixed left-3 top-4 z-20 flex h-9 w-9 items-center justify-center rounded-lg border border-line bg-cloud text-ink/50 shadow-sm hover:bg-paper dark:border-line-dark dark:bg-graphite dark:text-paper/60 dark:hover:bg-graphite-2"
      >
        <PanelIcon />
      </button>
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

      <div className="border-t border-line p-3 dark:border-line-dark">
        <div className="flex items-center gap-3 rounded-lg p-2">
          <Link href="/dashboard/profile" className="flex min-w-0 flex-1 items-center gap-3 rounded-lg hover:bg-paper dark:hover:bg-graphite-2">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-signal/10 font-mono text-xs font-medium text-signal dark:bg-signal-dark/20 dark:text-signal-dark">
              {initials}
            </span>
            <span className="min-w-0">
              <span className="block truncate text-sm font-medium text-ink dark:text-paper">{user.full_name}</span>
              <span className="block truncate font-mono text-[10px] uppercase tracking-wide text-ink/45 dark:text-paper/45">
                {ROLE_LABELS[user.role] || user.role}
              </span>
            </span>
          </Link>
        </div>
      </div>
    </aside>
  );
}
