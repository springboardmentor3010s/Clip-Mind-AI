// frontend/components/Sidebar.tsx
"use client";

import React from 'react';
import Link from 'next/link';
import { useAuth } from '../context/AuthContext';
import { Video, LayoutDashboard, Settings, LogOut, Users } from 'lucide-react';

export default function Sidebar() {
  const { user, logout } = useAuth();

  return (
    <aside className="w-64 bg-slate-900 text-slate-100 h-screen flex flex-col justify-between p-4 border-r border-slate-800">
      <div>
        {/* Platform Title */}
        <div className="mb-8 px-2">
          <h1 className="text-xl font-bold text-emerald-400 tracking-wide">ClipMind AI</h1>
          <p className="text-xs text-slate-400 mt-1">Logged in as: <span className="font-semibold">{user?.role || "Guest"}</span></p>
        </div>

        {/* Global Navigation Links */}
        <nav className="space-y-1">
          <Link href="/dashboard" className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium hover:bg-slate-800 transition-colors">
            <LayoutDashboard size={18} className="text-slate-400" />
            Dashboard
          </Link>
          
          {/* Conditional Access: Content Creators & Educators can upload videos [     : 120, 145] */}
          {(user?.role === 'Content Creator' || user?.role === 'Educator') && (
            <Link href="/upload" className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium hover:bg-slate-800 text-emerald-400 transition-colors">
              <Video size={18} />
              Upload Video
            </Link>
          )}

          {/* Conditional Access: Administrators exclusive management options [     : 156] */}
          {user?.role === 'Administrator' && (
            <Link href="/admin/users" className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium hover:bg-slate-800 text-amber-400 transition-colors">
              <Users size={18} />
              Manage Users
            </Link>
          )}
        </nav>
      </div>

      {/* Footer Profile actions */}
      <div className="border-t border-slate-800 pt-4">
        <button 
          onClick={logout}
          className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sm font-medium text-rose-400 hover:bg-rose-950/30 transition-colors"
        >
          <LogOut size={18} />
          Sign Out
        </button>
      </div>
    </aside>
  );
}