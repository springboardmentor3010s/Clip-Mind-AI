import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { RoleSwitcher } from './RoleSwitcher';
import {
  Sparkles,
  User as UserIcon,
  LogOut,
  LogIn,
  UserPlus,
  LayoutDashboard,
  Search,
} from 'lucide-react';

interface NavbarProps {
  currentTab: string;
  onNavigate: (tab: string) => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentTab,
  onNavigate,
}) => {
  const { user, logout } = useAuth();

  const [showProfileMenu, setShowProfileMenu] =
    useState(false);

  const isLanding = currentTab === 'landing';

  return (
    <header className="sticky top-0 z-50 w-full border-b border-slate-800/50 bg-[#070B16]/90 backdrop-blur-xl">

      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">

        {/* ================= LOGO ================= */}
        <button
          type="button"
          onClick={() => onNavigate('landing')}
          className="flex items-center gap-3 cursor-pointer group text-left shrink-0"
        >
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-purple-600 p-0.5 shadow-lg shadow-blue-500/20 group-hover:scale-105 transition-transform">

            <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-blue-400" />
            </div>

          </div>

          <div>

            <div className="flex items-center gap-1.5">

              <span className="font-extrabold text-lg bg-gradient-to-r from-white via-slate-100 to-blue-200 bg-clip-text text-transparent">
                ClipMind
              </span>

              <span className="text-xs font-black px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-400 border border-blue-500/30">
                AI
              </span>

            </div>

            <p className="text-[10px] text-slate-400 tracking-tight hidden sm:block">
              Video Summarization & Key Moments
            </p>

          </div>
        </button>

        {/* ================= LANDING NAVIGATION ================= */}

        {isLanding ? (

          <nav className="hidden md:flex items-center justify-center gap-8 text-xs font-semibold text-slate-300">

            <a
              href="#roles"
              className="hover:text-blue-400 transition-colors"
            >
              Roles
            </a>

            <a
              href="#studio"
              className="hover:text-blue-400 transition-colors"
            >
              Studio
            </a>

          </nav>

        ) : (

          /* ================= DASHBOARD SEARCH ================= */

          <div className="hidden md:flex items-center gap-3 bg-slate-950/80 border border-slate-800/80 rounded-xl px-3 py-1.5 w-64 lg:w-96">

            <Search className="w-4 h-4 text-slate-500" />

            <input
              type="text"
              placeholder="Search transcripts, topics, keywords..."
              className="bg-transparent text-xs text-white placeholder-slate-500 focus:outline-none w-full"
            />

          </div>

        )}

        {/* ================= RIGHT CONTROLS ================= */}

        <div className="flex items-center gap-3 shrink-0">

          {!isLanding && <RoleSwitcher />}

          {/* ================= USER AUTH ================= */}

          {user ? (

            <div className="flex items-center gap-3">

              {isLanding && (

                <button
                  type="button"
                  onClick={() => onNavigate('dashboard')}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 shadow-md shadow-blue-500/20 transition-all flex items-center gap-1.5"
                >
                  <LayoutDashboard className="w-3.5 h-3.5" />
                  Go to Dashboard
                </button>

              )}

              {/* PROFILE */}

              <div className="relative">

                <button
                  type="button"
                  id="user-profile-menu-button"
                  onClick={() =>
                    setShowProfileMenu(!showProfileMenu)
                  }
                  className="flex items-center gap-2 p-1.5 rounded-xl bg-slate-900/80 border border-slate-800 hover:border-slate-700 transition-all"
                >

                  <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-blue-600 to-purple-600 flex items-center justify-center text-white text-xs font-bold">
                    {user.name
                      ? user.name.charAt(0).toUpperCase()
                      : 'U'}
                  </div>

                  <span className="text-xs font-semibold text-slate-200 hidden lg:inline max-w-[120px] truncate">
                    {user.name}
                  </span>

                </button>

                {/* PROFILE MENU */}

                {showProfileMenu && (

                  <div className="absolute right-0 mt-2 w-56 rounded-xl bg-[#0A0F1E] border border-slate-800 shadow-2xl p-2 z-50 backdrop-blur-2xl">

                    <div className="px-3 py-2 border-b border-slate-800/80 mb-1">

                      <p className="text-xs font-bold text-white">
                        {user.name}
                      </p>

                      <p className="text-[11px] text-slate-400 truncate">
                        {user.email}
                      </p>

                      <span className="inline-block mt-1 text-[10px] font-extrabold px-2 py-0.5 rounded bg-blue-500/20 text-blue-300 border border-blue-500/30">
                        {user.role}
                      </span>

                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        onNavigate('settings');
                        setShowProfileMenu(false);
                      }}
                      className="w-full flex items-center gap-2 px-3 py-2 text-xs text-slate-300 hover:bg-slate-800/80 rounded-lg text-left transition-colors"
                    >
                      <UserIcon className="w-3.5 h-3.5 text-blue-400" />
                      Profile & Settings
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        logout();
                        setShowProfileMenu(false);
                        onNavigate('landing');
                      }}
                      className="w-full flex items-center gap-2 px-3 py-2 text-xs text-red-400 hover:bg-red-500/10 rounded-lg text-left transition-colors mt-1"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      Sign Out
                    </button>

                  </div>

                )}

              </div>

            </div>

          ) : (

            /* ================= LOGGED OUT ================= */

            <div className="flex items-center gap-2">

              <button
                type="button"
                onClick={() => onNavigate('login')}
                className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-slate-300 hover:text-white transition-colors"
              >
                <LogIn className="w-3.5 h-3.5 text-blue-400" />
                Sign In
              </button>

              <button
                type="button"
                onClick={() => onNavigate('register')}
                className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 rounded-xl shadow-lg shadow-blue-500/25 transition-all"
              >
                <UserPlus className="w-3.5 h-3.5" />
                Get Started
              </button>

            </div>

          )}

        </div>

      </div>

    </header>
  );
};