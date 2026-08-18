import React from 'react';
import {
  ShieldCheck,
  LayoutDashboard,
  Users,
  Video,
  BarChart3,
  Activity,
  Settings,
  LogOut,
  Sparkles,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface AdminLayoutProps {
  children: React.ReactNode;
  currentTab: string;
  onNavigate: (tab: string) => void;
}

export const AdminLayout: React.FC<AdminLayoutProps> = ({
  children,
  currentTab,
  onNavigate,
}) => {
  const { user, logout } = useAuth();

  const navigation = [
    {
      id: 'admin',
      label: 'Admin Overview',
      icon: LayoutDashboard,
    },
    {
      id: 'admin-users',
      label: 'User Management',
      icon: Users,
    },
    {
      id: 'admin-videos',
      label: 'Video Management',
      icon: Video,
    },
    {
      id: 'admin-analytics',
      label: 'Platform Analytics',
      icon: BarChart3,
    },
    {
      id: 'admin-activity',
      label: 'Activity Logs',
      icon: Activity,
    },
    {
      id: 'admin-settings',
      label: 'Settings',
      icon: Settings,
    },
  ];

  const handleLogout = () => {
    logout();
    onNavigate('landing');
  };

  return (
    <div className="min-h-screen bg-[#070B16] text-slate-100 flex">

      {/* =====================================================
          SIDEBAR
      ===================================================== */}
      <aside className="fixed left-0 top-0 bottom-0 w-[270px] bg-[#0A1020] border-r border-slate-800/80 flex flex-col z-40">

        {/* Logo */}
        <div className="px-6 py-6 border-b border-slate-800/80">

          <div className="flex items-center gap-3">

            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-red-600 via-orange-600 to-purple-600 p-[1px]">

              <div className="w-full h-full rounded-[11px] bg-slate-950 flex items-center justify-center">
                <ShieldCheck className="w-5 h-5 text-red-400" />
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

              <p className="text-[9px] uppercase tracking-widest text-red-400 font-bold">
                Administration
              </p>
            </div>

          </div>

        </div>

        {/* Administrator profile */}
        <div className="px-4 pt-5">

          <div className="rounded-2xl border border-red-500/20 bg-red-500/[0.04] p-4">

            <div className="flex items-center gap-3">

              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-red-500 to-purple-600 flex items-center justify-center text-white font-black">
                {user?.name?.charAt(0).toUpperCase() || 'A'}
              </div>

              <div className="min-w-0">

                <p className="text-sm font-bold text-white truncate">
                  {user?.name || 'Administrator'}
                </p>

                <p className="text-[10px] text-slate-500 truncate">
                  {user?.email || ''}
                </p>

              </div>

            </div>

            <div className="mt-3 inline-flex items-center gap-1.5 rounded-full border border-red-500/20 bg-red-500/10 px-2.5 py-1">

              <ShieldCheck className="w-3 h-3 text-red-400" />

              <span className="text-[9px] font-black uppercase tracking-wider text-red-300">
                Administrator
              </span>

            </div>

          </div>

        </div>

        {/* Navigation */}
        <div className="px-4 pt-7 flex-1 overflow-y-auto">

          <p className="px-3 mb-3 text-[10px] uppercase tracking-widest font-bold text-slate-600">
            Administration
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
                      ? 'bg-gradient-to-r from-red-600/20 to-purple-600/20 border border-red-500/20 text-white'
                      : 'text-slate-400 hover:text-white hover:bg-slate-900/70'
                  }`}
                >

                  <Icon
                    className={`w-4 h-4 ${
                      active ? 'text-red-400' : 'text-slate-500'
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
              ClipMind AI Control Center
            </span>

          </div>

          <button
            type="button"
            onClick={handleLogout}
            className="w-full flex items-center justify-between px-4 py-3 rounded-xl border border-red-500/20 bg-red-500/[0.05] text-red-400 hover:bg-red-500/10 transition-all"
          >

            <div className="flex items-center gap-2">

              <LogOut className="w-4 h-4" />

              <span className="text-xs font-bold">
                Sign out
              </span>

            </div>

            <span className="text-[9px] text-red-500/70">
              Logout
            </span>

          </button>

        </div>

      </aside>

      {/* =====================================================
          MAIN
      ===================================================== */}
      <main className="ml-[270px] min-h-screen flex-1">

        <header className="h-16 border-b border-slate-800/80 bg-[#080D19]/90 backdrop-blur-xl flex items-center justify-between px-8 sticky top-0 z-30">

          <div>

            <p className="text-[10px] uppercase tracking-widest text-red-400 font-bold">
              Administrator Control Center
            </p>

            <p className="text-sm font-semibold text-slate-300">
              Platform management and monitoring
            </p>

          </div>

          <div className="flex items-center gap-3">

            <div className="w-2 h-2 rounded-full bg-emerald-400 shadow-lg shadow-emerald-500/40" />

            <span className="text-xs text-slate-400">
              System Online
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
