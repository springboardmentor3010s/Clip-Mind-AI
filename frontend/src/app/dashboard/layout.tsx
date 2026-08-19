"use client";

import { usePathname } from 'next/navigation';
import Sidebar from '@/components/dashboard/Sidebar';
import ProtectedLayout from '@/components/auth/ProtectedLayout';
import { cn } from '@/utils/cn';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const isAdminPage = pathname === '/dashboard/admin';

  return (
    <ProtectedLayout>
      <div className="flex relative h-full">
        {!isAdminPage && <Sidebar />}
        <div className={cn(
          "flex-1 p-8 min-h-screen bg-md-background text-md-on-background relative",
          !isAdminPage && "ml-64"
        )}>
          {/* Subtle background glow for the dashboard area */}
          <div className="absolute top-0 left-0 w-full h-96 bg-md-primary/5 blur-[120px] pointer-events-none rounded-full transform -translate-y-1/2"></div>
          <div className="relative z-10">
            {children}
          </div>
        </div>
      </div>
    </ProtectedLayout>
  );
}

