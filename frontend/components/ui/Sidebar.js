"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "../../lib/AuthContext";

const NAV_BY_ROLE = {
  content_creator: [
    { href: "/dashboard/content-creator", label: "Dashboard", icon: "🏠" },
    { href: "/dashboard/content-creator/videos", label: "My Videos", icon: "🎬" },
    { href: "/dashboard/upload", label: "Upload Video", icon: "⬆️" },
  ],
  educator: [
    { href: "/dashboard/educator", label: "Dashboard", icon: "🏠" },
    { href: "/dashboard/educator/videos", label: "My Videos", icon: "🎬" },
    { href: "/dashboard/upload", label: "Upload Video", icon: "⬆️" },
  ],
  learner: [{ href: "/dashboard/learner", label: "Dashboard", icon: "🏠" }],
  administrator: [{ href: "/dashboard/admin", label: "Dashboard", icon: "🏠" }],
};

const ROLE_LABELS = {
  content_creator: "Content Creator",
  learner: "Learner",
  educator: "Educator",
  administrator: "Administrator",
};

function PanelIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="1" y="2" width="14" height="12" rx="2" stroke="currentColor" strokeWidth="1.3" />
      <line x1="6" y1="2" x2="6" y2="14" stroke="currentColor" strokeWidth="1.3" />
    </svg>
  );
}

export default function Sidebar() {
  const { user, logout } = useAuth();
  const pathname = usePathname();
  const [open, setOpen] = useState(true);

  if (!user) return null;

  const items = NAV_BY_ROLE[user.role] || [];
  const initials = user.full_name.split(" ").map((p) => p[0]).join("").slice(0, 2).toUpperCase();

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        title="Open sidebar"
        className="fixed left-3 top-4 z-20 flex h-8 w-8 items-center justify-center rounded-md border border-line bg-cloud text-ink/60 hover:bg-line/30 dark:border-line-dark dark:bg-graphite dark:text-paper/60 dark:hover:bg-graphite-2"
      >
        <PanelIcon />
      </button>
    );
  }

  return (
    <aside className="flex h-full w-60 shrink-0 flex-col border-r border-line bg-cloud dark:border-line-dark dark:bg-graphite">
      <div className="flex items-center justify-between px-4 py-5">
        <div className="flex items-center gap-2 pl-2">
          <span className="h-2 w-2 rounded-full bg-signal" />
          <span className="font-display text-sm font-semibold tracking-tight text-ink dark:text-paper">ClipMind AI</span>
        </div>
        <button
          onClick={() => setOpen(false)}
          title="Close sidebar"
          className="flex h-7 w-7 items-center justify-center rounded-md text-ink/50 hover:bg-line/30 dark:text-paper/50 dark:hover:bg-graphite-2"
        >
          <PanelIcon />
        </button>
      </div>

      <nav className="flex-1 space-y-1 px-3">
        {items.map((item) => {
          const active = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-2.5 rounded-md px-3 py-2 text-sm ${
                active
                  ? "bg-signal/10 font-medium text-signal dark:bg-signal-dark/15 dark:text-signal-dark"
                  : "text-ink/60 hover:bg-line/30 dark:text-paper/60 dark:hover:bg-graphite-2"
              }`}
            >
              <span className="text-base leading-none">{item.icon}</span>
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-line p-3 dark:border-line-dark">
        <Link
          href="/dashboard/profile"
          className="flex items-center gap-3 rounded-md p-2 hover:bg-line/30 dark:hover:bg-graphite-2"
        >
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-signal/10 font-mono text-xs font-medium text-signal dark:bg-signal-dark/20 dark:text-signal-dark">
            {initials}
          </span>
          <span className="min-w-0">
            <span className="block truncate text-sm font-medium text-ink dark:text-paper">{user.full_name}</span>
            <span className="block truncate font-mono text-[10px] uppercase tracking-wide text-ink/50 dark:text-paper/50">
              {ROLE_LABELS[user.role] || user.role}
            </span>
          </span>
        </Link>
      </div>
    </aside>
  );
}