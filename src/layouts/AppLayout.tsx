import type { ReactNode } from "react";
import { Sidebar } from "../components/Sidebar";
import { Navbar } from "../components/Navbar";

export function AppLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-background bg-mesh">
      <div className="flex">
        <Sidebar />
        <div className="flex-1 min-w-0">
          <Navbar />
          <main className="px-4 md:px-6 pb-10">{children}</main>
        </div>
      </div>
    </div>
  );
}
