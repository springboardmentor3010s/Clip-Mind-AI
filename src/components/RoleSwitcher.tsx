import React from 'react';
import { useAuth } from '../context/AuthContext';
import { UserRole } from '../types';
import { Video, BookOpen, GraduationCap, ShieldCheck } from 'lucide-react';

export const RoleSwitcher: React.FC = () => {
  const { user, switchRole } = useAuth();

  if (!user) return null;

  const roles: {
    role: UserRole;
    label: string;
    icon: React.ReactNode;
    color: string;
  }[] = [
    {
      role: 'CONTENT_CREATOR',
      label: 'Creator',
      icon: <Video className="w-3.5 h-3.5" />,
      color: 'from-indigo-500 to-blue-500',
    },
    {
      role: 'LEARNER',
      label: 'Learner',
      icon: <BookOpen className="w-3.5 h-3.5" />,
      color: 'from-emerald-500 to-teal-500',
    },
    {
      role: 'EDUCATOR',
      label: 'Educator',
      icon: <GraduationCap className="w-3.5 h-3.5" />,
      color: 'from-purple-500 to-pink-500',
    },
  ];

  return (
    <div id="role-switcher-container" className="flex items-center gap-1.5 p-1 bg-slate-950/80 rounded-xl border border-slate-800/80 backdrop-blur-md">
      <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 px-2 hidden sm:inline">
        View Role:
      </span>
      {roles.map((r) => {
        const isActive = user.role === r.role;
        return (
          <button
            key={r.role}
            id={`role-btn-${r.role.toLowerCase()}`}
            onClick={() => switchRole(r.role)}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium transition-all duration-200 ${
              isActive
                ? `bg-gradient-to-r ${r.color} text-white shadow-md shadow-indigo-500/20 font-semibold`
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/80'
            }`}
            title={`Switch view to ${r.label}`}
          >
            {r.icon}
            <span>{r.label}</span>
          </button>
        );
      })}
    </div>
  );
};
