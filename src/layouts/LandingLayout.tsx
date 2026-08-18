import React from 'react';
import { LandingNavbar } from '../components/LandingNavbar';

interface LandingLayoutProps {
  onNavigate: (tab: string) => void;
  children: React.ReactNode;
}

export const LandingLayout: React.FC<LandingLayoutProps> = ({ onNavigate, children }) => {
  return (
    <div className="min-h-screen bg-[#070B16] text-slate-100 font-sans selection:bg-blue-500 selection:text-white flex flex-col antialiased scroll-smooth">
      <LandingNavbar onNavigate={onNavigate} />
      <main className="flex-1 w-full">
        {children}
      </main>
    </div>
  );
};
