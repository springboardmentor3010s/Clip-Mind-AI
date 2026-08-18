import React from 'react';
import { Sidebar } from '../components/Sidebar';

interface DashboardLayoutProps {
  currentTab: string;
  onNavigate: (tab: string, videoId?: string) => void;
  onOpenUploadModal?: () => void;
  children: React.ReactNode;
}

export const DashboardLayout: React.FC<DashboardLayoutProps> = ({
  currentTab,
  onNavigate,
  onOpenUploadModal,
  children
}) => {
  return (
    <div className="min-h-screen bg-[#070B16] flex text-slate-100 font-sans selection:bg-blue-500 selection:text-white antialiased">
      {/* Sidebar - top-0 h-screen sticky */}
      <Sidebar
        currentTab={currentTab}
        onNavigate={onNavigate}
        onOpenUploadModal={onOpenUploadModal}
      />

      {/* Dashboard Main Content Area */}
      <main className="flex-1 min-w-0 overflow-y-auto p-4 sm:p-6 lg:p-8">
        {children}
      </main>
    </div>
  );
};
