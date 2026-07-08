"use client";

import React from "react";
import { AuthProvider, useAuth } from "./context/AuthContext";
import "@/app/globals.css"; // Ensure standard Tailwind styles are loaded

function MainLayoutContent({ children }: { children: React.ReactNode }) {
  const { loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center text-slate-200">
        <p className="text-sm tracking-wider animate-pulse">Loading ClipMind AI...</p>
      </div>
    );
  }

  // Simply render the child page cleanly without injecting the old sidebar
  return (
    <div className="bg-slate-950 text-slate-100 min-h-screen selection:bg-emerald-500/30">
      {children}
    </div>
  );
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="antialiased">
        <AuthProvider>
          <MainLayoutContent>{children}</MainLayoutContent>
        </AuthProvider>
      </body>
    </html>
  );
}