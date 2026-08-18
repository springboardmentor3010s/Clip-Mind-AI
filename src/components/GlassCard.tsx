import React from 'react';

interface GlassCardProps {
  children: React.ReactNode;
  className?: string;
  glow?: boolean;
}

export const GlassCard: React.FC<GlassCardProps> = ({ children, className = '', glow = false }) => {
  return (
    <div
      className={`relative rounded-2xl bg-slate-900/40 backdrop-blur-xl border border-slate-800/50 p-6 shadow-xl transition-all duration-300 hover:border-slate-700/80 ${
        glow ? 'shadow-blue-500/10 border-blue-500/30 hover:border-blue-500/50' : ''
      } ${className}`}
    >
      {glow && (
        <div className="absolute -inset-0.5 rounded-2xl bg-gradient-to-r from-blue-600/10 via-purple-600/10 to-blue-500/10 blur-xl opacity-50 pointer-events-none" />
      )}
      <div className="relative z-10">{children}</div>
    </div>
  );
};
