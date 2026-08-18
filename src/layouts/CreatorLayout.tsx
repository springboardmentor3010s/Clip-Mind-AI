import React from 'react';
import {
  Sparkles,
  LayoutDashboard,
  Video,
  UploadCloud,
  LoaderCircle,
  FileText,
  Zap,
  Bookmark,
  BarChart3,
  UserCircle,
  LogOut,

} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface CreatorLayoutProps {
  children: React.ReactNode;
  currentTab: string;
  onNavigate: (tab: string) => void;
}

export const CreatorLayout: React.FC<CreatorLayoutProps> = ({
  children,
  currentTab,
  onNavigate,
}) => {
  const { user, logout } = useAuth();

  const navigation = [
    {
      id: 'creator',
      label: 'Dashboard',
      icon: LayoutDashboard,
    },
    {
      id: 'creator-bookmarks',
      label: 'Bookmarks',
      icon: Bookmark,
    },
    {
      id: 'creator-videos',
      label: 'My Videos',
      icon: Video,
    },
    {
      id: 'creator-upload',
      label: 'Upload',
      icon: UploadCloud,
    },
    {
      id: 'creator-processing',
      label: 'Processing',
      icon: LoaderCircle,
    },
    {
      id: 'creator-transcripts',
      label: 'Transcripts',
      icon: FileText,
    },
    {
      id: 'creator-summaries',
      label: 'Summaries',
      icon: Sparkles,
    },
    {
      id: 'creator-key-moments',
      label: 'Key Moments',
      icon: Zap,
    },
    {
      id: 'creator-analytics',
      label: 'Analytics',
      icon: BarChart3,
    },
  ];

  const handleLogout = () => {
    logout();
    onNavigate('landing');
  };

  return (
    <div className="min-h-screen bg-[#070B16] text-slate-100 flex">

      <aside className="fixed left-0 top-0 bottom-0 w-[270px] bg-[#0A1020] border-r border-slate-800/80 flex flex-col z-40">

        {/* Logo */}
        <div className="px-6 py-6 border-b border-slate-800/80">
          <div className="flex items-center gap-3">

            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-purple-600 p-[1px]">
              <div className="w-full h-full rounded-[11px] bg-slate-950 flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-blue-400" />
              </div>
            </div>

            <div>
              <div className="flex items-center gap-1">
                <span className="font-black text-white text-base">
                  ClipMind
                </span>

                <span className="font-black text-blue-400 text-base">
                  AI
                </span>
              </div>

              <p className="text-[9px] uppercase tracking-widest text-blue-400 font-bold">
                Content Creator
              </p>
            </div>

          </div>
        </div>

        {/* Profile */}
        <div className="px-4 pt-5">
          <div className="rounded-2xl border border-blue-500/20 bg-blue-500/[0.04] p-4">

            <div className="flex items-center gap-3">

              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-purple-600 flex items-center justify-center text-white font-black">
                {user?.name?.charAt(0).toUpperCase() || 'C'}
              </div>

              <div className="min-w-0">
                <p className="text-sm font-bold text-white truncate">
                  {user?.name || 'Content Creator'}
                </p>

                <p className="text-[10px] text-slate-500 truncate">
                  {user?.email || ''}
                </p>
              </div>

            </div>

            <div className="mt-3 inline-flex items-center gap-1.5 rounded-full border border-blue-500/20 bg-blue-500/10 px-2.5 py-1">

              <Sparkles className="w-3 h-3 text-blue-400" />

              <span className="text-[9px] font-black uppercase tracking-wider text-blue-300">
                Content Creator
              </span>

            </div>

          </div>
        </div>

        {/* Navigation */}
        <div className="px-4 pt-7 flex-1 overflow-y-auto">

          <p className="px-3 mb-3 text-[10px] uppercase tracking-widest font-bold text-slate-600">
            Creator Workspace
          </p>

          <nav className="space-y-1">

            {navigation.map((item) => {
              const Icon = item.icon;
              const active = currentTab === item.id;

              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => onNavigate(item.id)}
                  className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-semibold transition-all ${
                    active
                      ? 'bg-gradient-to-r from-blue-600/20 to-purple-600/20 border border-blue-500/20 text-white'
                      : 'text-slate-400 hover:text-white hover:bg-slate-900/70'
                  }`}
                >
                  <Icon
                    className={`w-4 h-4 ${
                      active
                        ? 'text-blue-400'
                        : 'text-slate-500'
                    }`}
                  />

                  <span>{item.label}</span>
                </button>
              );
            })}

          </nav>

        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800/80">

          <button
            type="button"
            onClick={() => onNavigate('creator-profile')}
            className="w-full flex items-center gap-2 px-4 py-3 mb-2 rounded-xl border border-slate-800 bg-slate-900/60 text-slate-400 hover:text-white hover:bg-slate-800 transition-all"
          >
            <UserCircle className="w-4 h-4" />

            <span className="text-xs font-bold">
              Profile
            </span>
          </button>

          <button
            type="button"
            onClick={handleLogout}
            className="w-full flex items-center gap-2 px-4 py-3 rounded-xl border border-red-500/20 bg-red-500/[0.05] text-red-400 hover:bg-red-500/10 transition-all"
          >
            <LogOut className="w-4 h-4" />

            <span className="text-xs font-bold">
              Sign out
            </span>
          </button>

        </div>

      </aside>

      <main className="ml-[270px] min-h-screen flex-1">

        <header className="h-16 border-b border-slate-800/80 bg-[#080D19]/90 backdrop-blur-xl flex items-center justify-between px-8 sticky top-0 z-30">

          <div>
            <p className="text-[10px] uppercase tracking-widest text-blue-400 font-bold">
              Content Creator Workspace
            </p>

            <p className="text-sm font-semibold text-slate-300">
              Create, process and manage your learning content
            </p>
          </div>

          <div className="flex items-center gap-3">

            <div className="w-2 h-2 rounded-full bg-emerald-400 shadow-lg shadow-emerald-500/40" />

            <span className="text-xs text-slate-400">
              Creator Workspace
            </span>

          </div>

        </header>

        <div className="p-8">
          {children}
        </div>

      </main>

    </div>
  );
};
