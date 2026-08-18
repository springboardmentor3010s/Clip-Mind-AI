import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  Sparkles,
  AlertCircle,
  Mail,
  Lock,
  ShieldCheck,
  ArrowLeft,
  LogIn,
} from 'lucide-react';
import { motion } from 'motion/react';

interface AdminLoginPageProps {
  onNavigate: (route: string) => void;
}

export const AdminLoginPage: React.FC<AdminLoginPageProps> = ({
  onNavigate,
}) => {
    const { login, logout } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    setError(null);

    if (!email.trim() || !password) {
      setError('Please enter your administrator email and password.');
      return;
    }

    setIsLoading(true);

    try {
        const loggedInUser = await login(
            email.trim(),
            password
          );
          
          if (loggedInUser.role !== 'ADMINISTRATOR') {
            logout();
          
            throw new Error(
              'This account is not authorized for Administrator access.'
            );
          }
          
          onNavigate('admin');
    } catch (err: any) {
      setError(
        err?.message ||
          'Invalid administrator credentials.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-6rem)] flex items-center justify-center p-4">

      <div className="relative w-full max-w-md overflow-hidden rounded-3xl border border-red-500/20 bg-[#0D1220] p-8 sm:p-10 shadow-2xl">

        {/* Ambient glow */}
        <div className="pointer-events-none absolute top-0 left-1/2 -translate-x-1/2 w-72 h-72 bg-red-600/10 blur-[100px]" />

        {/* Back */}
        <button
          type="button"
          onClick={() => onNavigate('landing')}
          className="relative z-10 mb-7 flex items-center gap-2 text-xs font-semibold text-slate-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to ClipMind
        </button>

        {/* Header */}
        <div className="relative z-10 flex flex-col items-center text-center">

          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-red-600 via-orange-600 to-purple-600 p-0.5 shadow-lg shadow-red-500/20">

            <div className="w-full h-full rounded-[14px] bg-slate-950 flex items-center justify-center">
              <ShieldCheck className="w-7 h-7 text-red-400" />
            </div>

          </div>

          <div className="flex items-center gap-2 mt-5">
            <Sparkles className="w-4 h-4 text-blue-400" />

            <span className="text-lg font-black text-white">
              ClipMind
              <span className="text-blue-400"> AI</span>
            </span>
          </div>

          <div className="mt-4">

            <div className="inline-flex items-center gap-2 rounded-full border border-red-500/30 bg-red-500/10 px-3 py-1.5 text-[10px] font-black uppercase tracking-wider text-red-300">
              <ShieldCheck className="w-3.5 h-3.5" />
              Administrator Access
            </div>

            <h1 className="mt-5 text-2xl font-black text-white">
              Administrator Login
            </h1>

            <p className="mt-2 text-xs leading-5 text-slate-400">
              Restricted access to the ClipMind administration console.
            </p>

          </div>

        </div>

        {/* Error */}
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="relative z-10 mt-6 flex items-start gap-2.5 rounded-xl border border-red-500/30 bg-red-500/10 p-3.5 text-xs text-red-300"
          >
            <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0 text-red-400" />
            <span>{error}</span>
          </motion.div>
        )}

        {/* Form */}
        <form
          onSubmit={handleSubmit}
          noValidate
          className="relative z-10 mt-6 space-y-4"
        >

          {/* Email */}
          <div>

            <label className="mb-1.5 block text-xs font-semibold text-slate-300">
              Administrator Email
            </label>

            <div className="relative">

              <Mail className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />

              <input
                type="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);

                  if (error) {
                    setError(null);
                  }
                }}
                placeholder="admin@clipmind.ai"
                className="w-full rounded-xl border border-slate-800 bg-slate-950/80 py-2.5 pl-10 pr-4 text-xs text-white placeholder-slate-600 outline-none transition-colors focus:border-red-500"
                autoComplete="username"
                required
              />

            </div>

          </div>

          {/* Password */}
          <div>

            <label className="mb-1.5 block text-xs font-semibold text-slate-300">
              Administrator Password
            </label>

            <div className="relative">

              <Lock className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />

              <input
                type="password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);

                  if (error) {
                    setError(null);
                  }
                }}
                placeholder="••••••••"
                className="w-full rounded-xl border border-slate-800 bg-slate-950/80 py-2.5 pl-10 pr-4 text-xs text-white placeholder-slate-600 outline-none transition-colors focus:border-red-500"
                autoComplete="current-password"
                required
              />

            </div>

          </div>

          {/* Login */}
          <button
            type="submit"
            disabled={isLoading}
            className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-red-600 via-orange-600 to-purple-600 py-3 text-xs font-bold text-white shadow-lg shadow-red-600/20 transition-all hover:from-red-500 hover:to-purple-500 disabled:cursor-not-allowed disabled:opacity-50"
          >

            {isLoading ? (
              <>
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/20 border-t-white" />
                Verifying administrator...
              </>
            ) : (
              <>
                <LogIn className="h-4 w-4" />
                Sign in as Administrator
              </>
            )}

          </button>

        </form>

        {/* Footer */}
        <div className="relative z-10 mt-6 border-t border-slate-800/80 pt-5 text-center">

          <p className="text-[10px] leading-5 text-slate-500">
            Administrator accounts cannot be created through public registration.
          </p>

          <button
            type="button"
            onClick={() => onNavigate('login')}
            className="mt-3 text-xs font-semibold text-blue-400 hover:text-blue-300 hover:underline"
          >
            ← Regular user login
          </button>

        </div>

      </div>
    </div>
  );
};