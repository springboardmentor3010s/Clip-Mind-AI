import React from 'react';
import { useAuth } from '../context/AuthContext';
import { Sparkles, LogIn, UserPlus, LayoutDashboard } from 'lucide-react';

interface LandingNavbarProps {
  onNavigate: (tab: string) => void;
}

export const LandingNavbar: React.FC<LandingNavbarProps> = ({ onNavigate }) => {
  const { user, isAuthenticated } = useAuth();

  return (
    <header className="sticky top-0 z-50 w-full border-b border-slate-800/50 bg-[#070B16]/80 backdrop-blur-xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        
        {/* Logo */}
        <div 
          className="flex items-center gap-3 cursor-pointer group" 
          onClick={() => onNavigate('landing')}
        >
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-purple-600 p-0.5 shadow-lg shadow-blue-500/20 group-hover:scale-105 transition-transform">
            <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-blue-400 animate-pulse" />
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
            <p className="text-[10px] text-slate-400 tracking-tight hidden sm:block">Video Summarization & Key Moments</p>
          </div>
        </div>

        {/* Center Navigation - Landing Links */}
        <nav className="hidden md:flex items-center justify-center gap-8 text-xs font-semibold text-slate-300">

  <a
    href="#hero"
    className="hover:text-blue-400 transition-colors"
  >
    Home
  </a>

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

  <a
    href="#features"
    className="hover:text-blue-400 transition-colors"
  >
    Features
  </a>

</nav>

        {/* Right Controls - Auth Buttons */}
        <div className="flex items-center gap-3">
          {isAuthenticated ? (
            <button
              onClick={() => onNavigate('dashboard')}
              className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 shadow-md shadow-blue-500/20 transition-all flex items-center gap-1.5"
            >
              <LayoutDashboard className="w-3.5 h-3.5" />
              <span>Go to Dashboard</span>
            </button>
          ) : (
            <div className="flex items-center gap-2">
              <button
                onClick={() => onNavigate('login')}
                className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-slate-300 hover:text-white transition-colors"
              >
                <LogIn className="w-3.5 h-3.5 text-blue-400" />
                <span>Sign In</span>
              </button>
              <button
                onClick={() => onNavigate('register')}
                className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 rounded-xl shadow-lg shadow-blue-500/25 transition-all"
              >
                <UserPlus className="w-3.5 h-3.5" />
                <span>Get Started</span>
              </button>
            </div>
          )}
        </div>

      </div>
    </header>
  );
};
