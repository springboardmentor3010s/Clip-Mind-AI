import React from 'react';
import {
  GraduationCap,
  LayoutDashboard,
  School,
  Users,
  ClipboardList,
  Video,
  BarChart3,
  UserCircle,
  LogOut,
  Sparkles,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface EducatorLayoutProps {
  children: React.ReactNode;
  currentTab: string;
  onNavigate: (tab: string) => void;
}

export const EducatorLayout: React.FC<EducatorLayoutProps> = ({
  children,
  currentTab,
  onNavigate,
}) => {
  const { user, logout } = useAuth();

  const navigation = [
    {
      id: 'educator',
      label: 'Dashboard',
      icon: LayoutDashboard,
    },
    {
      id: 'educator-classroom',
      label: 'My Classroom',
      icon: School,
    },
    {
      id: 'educator-content',
      label: 'Content',
      icon: Video,
    },
    {
      id: 'educator-students',
      label: 'Students',
      icon: Users,
    },
    {
      id: 'educator-assignments',
      label: 'Assignments',
      icon: ClipboardList,
    },
    {
      id: 'educator-analytics',
      label: 'Class Analytics',
      icon: BarChart3,
    },
  ];

  const handleLogout = () => {
    logout();
    onNavigate('landing');
  };

  return (
    <div className="min-h-screen bg-[#070B16] text-slate-100 flex">

      {/* Sidebar */}
      <aside className="fixed left-0 top-0 bottom-0 w-[270px] bg-[#0A1020] border-r border-slate-800/80 flex flex-col z-40">

        {/* Logo */}
        <div className="px-6 py-6 border-b border-slate-800/80">
          <div className="flex items-center gap-3">

            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-500 via-teal-500 to-blue-600 p-[1px]">
              <div className="w-full h-full rounded-[11px] bg-slate-950 flex items-center justify-center">
                <GraduationCap className="w-5 h-5 text-emerald-400" />
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

              <p className="text-[9px] uppercase tracking-widest text-emerald-400 font-bold">
                Educator
              </p>
            </div>

          </div>
        </div>

        {/* Educator profile */}
        <div className="px-4 pt-5">
          <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/[0.04] p-4">

            <div className="flex items-center gap-3">

              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-500 to-blue-600 flex items-center justify-center text-white font-black">
                {user?.name?.charAt(0).toUpperCase() || 'E'}
              </div>

              <div className="min-w-0">
                <p className="text-sm font-bold text-white truncate">
                  {user?.name || 'Educator'}
                </p>

                <p className="text-[10px] text-slate-500 truncate">
                  {user?.email || ''}
                </p>
              </div>

            </div>

            <div className="mt-3 inline-flex items-center gap-1.5 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-2.5 py-1">

              <GraduationCap className="w-3 h-3 text-emerald-400" />

              <span className="text-[9px] font-black uppercase tracking-wider text-emerald-300">
                Educator
              </span>

            </div>

          </div>
        </div>

        {/* Navigation */}
        <div className="px-4 pt-7 flex-1 overflow-y-auto">

          <p className="px-3 mb-3 text-[10px] uppercase tracking-widest font-bold text-slate-600">
            Teaching
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
                      ? 'bg-gradient-to-r from-emerald-600/20 to-blue-600/20 border border-emerald-500/20 text-white'
                      : 'text-slate-400 hover:text-white hover:bg-slate-900/70'
                  }`}
                >
                  <Icon
                    className={`w-4 h-4 ${
                      active
                        ? 'text-emerald-400'
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

          <div className="mb-3 flex items-center gap-2 px-2">
            <Sparkles className="w-3.5 h-3.5 text-blue-400" />

            <span className="text-[10px] text-slate-500">
              ClipMind AI Classroom
            </span>
          </div>

          <button
            type="button"
            onClick={() => onNavigate('educator-profile')}
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
            className="w-full flex items-center justify-between px-4 py-3 rounded-xl border border-emerald-500/20 bg-emerald-500/[0.05] text-emerald-400 hover:bg-emerald-500/10 transition-all"
          >
            <div className="flex items-center gap-2">
              <LogOut className="w-4 h-4" />

              <span className="text-xs font-bold">
                Sign out
              </span>
            </div>
          </button>

        </div>
      </aside>

      {/* Main */}
      <main className="ml-[270px] min-h-screen flex-1">

        <header className="h-16 border-b border-slate-800/80 bg-[#080D19]/90 backdrop-blur-xl flex items-center justify-between px-8 sticky top-0 z-30">

          <div>
            <p className="text-[10px] uppercase tracking-widest text-emerald-400 font-bold">
              Educator Workspace
            </p>

            <p className="text-sm font-semibold text-slate-300">
              Manage classrooms, content and student learning
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="w-2 h-2 rounded-full bg-emerald-400 shadow-lg shadow-emerald-500/40" />

            <span className="text-xs text-slate-400">
              Teaching Workspace
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
