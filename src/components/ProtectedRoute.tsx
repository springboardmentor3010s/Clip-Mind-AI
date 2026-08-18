import React from 'react';
import { useAuth } from '../context/AuthContext';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
}) => {

  const {
    user,
    isAuthenticated,
    isLoading,
  } = useAuth();

  /*
   * Authentication is still being restored.
   */
  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#070B16] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">

          <div className="w-10 h-10 border-4 border-blue-500/20 border-t-blue-500 rounded-full animate-spin" />

          <p className="text-sm font-semibold text-slate-400">
            Verifying session...
          </p>

        </div>
      </div>
    );
  }

  /*
   * Not authenticated.
   *
   * IMPORTANT:
   * Do not call navigation during render.
   *
   * App.tsx handles the redirect.
   */
  if (!isAuthenticated || !user) {
    return (
      <div className="min-h-screen bg-[#070B16] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">

          <div className="w-8 h-8 border-4 border-blue-500/20 border-t-blue-500 rounded-full animate-spin" />

          <p className="text-sm text-slate-400">
            Redirecting to sign in...
          </p>

        </div>
      </div>
    );
  }

  return <>{children}</>;
};