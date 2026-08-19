"use client";
import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Film, BarChart3, Settings, LogOut, Sparkles, Search, Bookmark, History, ShieldCheck, Users2 } from 'lucide-react';
import { cn } from '@/utils/cn';
import { useAuth } from '@/context/AuthContext';
import ThemeToggle from '@/components/theme/ThemeToggle';

const MENU_BY_ROLE = {
  Creator: [
    { icon: LayoutDashboard, label: 'Dashboard', href: '/dashboard' },
    { icon: Film, label: 'My Videos', href: '/dashboard/videos' },
    { icon: Search, label: 'Search', href: '/dashboard/search' },
    { icon: BarChart3, label: 'Analytics', href: '/dashboard/analytics' },
  ],
  Educator: [
    { icon: LayoutDashboard, label: 'Dashboard', href: '/dashboard' },
    { icon: Film, label: 'My Videos', href: '/dashboard/videos' },
    { icon: Search, label: 'Search', href: '/dashboard/search' },
    { icon: Users2, label: 'Classrooms', href: '/dashboard/classrooms' },
    { icon: BarChart3, label: 'Analytics', href: '/dashboard/analytics' },
  ],
  Learner: [
    { icon: LayoutDashboard, label: 'Library', href: '/dashboard' },
    { icon: Film, label: 'All Videos', href: '/dashboard/videos' },
    { icon: Search, label: 'Search', href: '/dashboard/search' },
    { icon: Users2, label: 'Classrooms', href: '/dashboard/classrooms' },
    { icon: Bookmark, label: 'Bookmarks', href: '/dashboard/bookmarks' },
    { icon: History, label: 'History', href: '/dashboard/history' },
  ],
  Administrator: [
    { icon: ShieldCheck, label: 'Admin Panel', href: '/dashboard/admin' },
  ],
};

const DEFAULT_MENU = MENU_BY_ROLE.Creator;

export default function Sidebar() {
  const pathname = usePathname();
  const { logout, user } = useAuth();

  const isAdmin = user?.role === 'Administrator';
  const menuItems = isAdmin
    ? MENU_BY_ROLE.Administrator
    : [
        ...(MENU_BY_ROLE[user?.role] || DEFAULT_MENU),
        { icon: Settings, label: 'Settings', href: '/dashboard/settings' },
      ];

  return (
    <aside className="fixed left-0 top-0 bottom-0 w-64 border-r border-md-outline-variant flex flex-col z-40 bg-md-surface-container-low">
      <Link href="/dashboard" className="flex items-center gap-2 px-6 py-5 border-b border-md-outline-variant">
        <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-md-primary">
          <Sparkles size={16} className="text-md-on-primary" />
        </div>
        <span className="text-title-medium font-bold tracking-tight text-md-on-surface">ClipMind AI</span>
      </Link>
      {user?.role && (
        <div className="px-6 pt-4">
          <span className="inline-block px-2.5 py-1 rounded-full bg-md-tertiary-container text-md-on-tertiary-container text-label-small font-semibold">
            {user.role}
          </span>
        </div>
      )}
      <div className="flex-1 py-6 px-4 space-y-1">
        {menuItems.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;
          return (
            <Link
              key={item.label}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-4 py-3 rounded-full transition-all duration-300 text-label-large font-medium",
                isActive
                  ? "bg-md-primary-container text-md-on-primary-container"
                  : "text-md-on-surface-variant hover:bg-md-on-surface/8 hover:text-md-on-surface"
              )}
            >
              <Icon size={20} />
              {item.label}
            </Link>
          );
        })}
      </div>

      <div className="flex items-center justify-between gap-2 p-4 border-t border-md-outline-variant">
        <button
          onClick={logout}
          className="flex items-center gap-3 px-4 py-3 rounded-full transition-all duration-300 text-label-large font-medium text-md-error hover:bg-md-error/10 flex-1 cursor-pointer"
        >
          <LogOut size={20} />
          Sign Out
        </button>
        <ThemeToggle />
      </div>
    </aside>
  );
}
