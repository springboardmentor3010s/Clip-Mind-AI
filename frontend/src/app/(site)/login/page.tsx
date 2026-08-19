"use client";
import AuthCard from "@/components/auth/AuthCard";

export default function LoginPage() {
  return (
    <div className="min-h-[calc(100vh-72px)] flex items-center justify-center p-6 relative overflow-hidden">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-brand-purple/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="relative z-10 w-full flex justify-center">
        <AuthCard />
      </div>
    </div>
  );
}
