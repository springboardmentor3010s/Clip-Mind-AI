"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { LogIn, Mail, Lock, Video, Eye, EyeOff, FileText, Sparkles, Clock } from "lucide-react";

const perks = [
  { icon: FileText, label: "Full transcripts, instantly searchable" },
  { icon: Sparkles, label: "AI summaries, short and detailed" },
  { icon: Clock, label: "Key moments with exact timestamps" },
];

export default function LoginPage() {
  const [form, setForm] = useState({ email: "", password: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  function handleChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  async function handleGoogleLogin() {
    try {
      const res = await fetch("http://localhost:8000/api/v1/auth/google/login");
      const data = await res.json();
      window.location.href = data.auth_url;
    } catch (err) {
      setError("Could not start Google login.");
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const body = new URLSearchParams();
      body.append("username", form.email); // backend expects "username" field = email
      body.append("password", form.password);

      const res = await fetch("http://localhost:8000/api/v1/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body,
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.detail || "Login failed.");
        setLoading(false);
        return;
      }

      localStorage.setItem("clipmind_token", data.access_token);
      localStorage.setItem("clipmind_user", JSON.stringify(data.user));
      window.location.href = "/dashboard";
    } catch (err) {
      setError("Could not connect to server. Please make sure the backend is running.");
    }
    setLoading(false);
  }

  return (
    <div className="min-h-screen flex">
      {/* Left panel */}
      <div className="hidden lg:flex lg:w-1/2 bg-[#0B0F1E] text-white flex-col justify-between p-12 relative overflow-hidden">
        <div
          className="pointer-events-none absolute inset-0 opacity-40"
          style={{
            background:
              "radial-gradient(600px circle at 20% 15%, rgba(79,70,229,0.35), transparent 60%), radial-gradient(500px circle at 80% 85%, rgba(20,184,166,0.25), transparent 60%)",
          }}
        />

        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="flex items-center gap-2 relative z-10"
        >
          <Video size={24} className="text-blue" />
          <span className="text-lg font-bold tracking-tight">ClipMind AI</span>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.15 }}
          className="relative z-10"
        >
          <span className="inline-block text-[11px] font-mono tracking-widest text-teal uppercase mb-4">
            Welcome back
          </span>
          <h1 className="text-3xl font-bold leading-tight tracking-tight mb-4">
            Pick up right where
            <br />
            you left off.
          </h1>
          <p className="text-gray-400 text-sm max-w-sm mb-8">
            Log in to access your transcripts, summaries, and key moments dashboard.
          </p>

          <div className="flex flex-col gap-3">
            {perks.map((perk, i) => (
              <motion.div
                key={perk.label}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.4, delay: 0.3 + i * 0.1 }}
                className="flex items-center gap-3"
              >
                <div className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center shrink-0">
                  <perk.icon size={14} className="text-teal" />
                </div>
                <span className="text-sm text-gray-300">{perk.label}</span>
              </motion.div>
            ))}
          </div>
        </motion.div>

        <p className="text-xs text-gray-500 relative z-10">© 2026 ClipMind AI. All rights reserved.</p>
      </div>

      {/* Right form panel */}
      <div className="flex-1 flex items-center justify-center p-8 bg-[#F7F7FB]">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="w-full max-w-md"
        >
          <div className="lg:hidden flex items-center gap-2 mb-8">
            <Video size={22} className="text-blue" />
            <span className="text-lg font-bold text-gray-900">ClipMind AI</span>
          </div>

          <h2 className="text-2xl font-bold text-gray-900 mb-1 tracking-tight">Log in to your account</h2>
          <p className="text-gray-500 text-sm mb-8">
            Don&apos;t have an account?{" "}
            <a href="/register" className="text-blue font-semibold hover:underline">
              Sign up
            </a>
          </p>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div>
              <label className="text-sm font-medium text-gray-700">Email</label>
              <div className="relative mt-1">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                <input
                  type="email"
                  name="email"
                  required
                  value={form.email}
                  onChange={handleChange}
                  placeholder="you@example.com"
                  className="w-full border border-gray-300 rounded-lg pl-10 pr-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue focus:border-transparent transition"
                />
              </div>
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700">Password</label>
              <div className="relative mt-1">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                <input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  required
                  value={form.password}
                  onChange={handleChange}
                  placeholder="••••••••"
                  className="w-full border border-gray-300 rounded-lg pl-10 pr-10 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue focus:border-transparent transition"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {error && <p className="text-sm text-red-600 font-medium">{error}</p>}

            <button
              type="submit"
              disabled={loading}
              className="mt-2 bg-blue text-white py-2.5 rounded-full text-sm font-semibold hover:opacity-90 transition disabled:opacity-50 flex items-center justify-center gap-2"
            >
              <LogIn size={16} />
              {loading ? "Logging in..." : "Log In"}
            </button>

            <div className="flex items-center gap-3 my-1">
              <div className="flex-1 h-px bg-gray-200" />
              <span className="text-xs text-gray-400">OR</span>
              <div className="flex-1 h-px bg-gray-200" />
            </div>

            <button
              type="button"
              onClick={handleGoogleLogin}
              className="flex items-center justify-center gap-2 border border-gray-300 rounded-full py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition"
            >
              <svg width="16" height="16" viewBox="0 0 48 48">
                <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.9 29.3 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34.5 6.1 29.5 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.7-.4-3.5z"/>
                <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.5 16 18.9 13 24 13c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34.5 6.1 29.5 4 24 4c-7.7 0-14.3 4.3-17.7 10.7z"/>
                <path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.4 26.7 36 24 36c-5.3 0-9.6-3.1-11.3-7.6l-6.5 5C9.6 39.6 16.3 44 24 44z"/>
                <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.3-2.3 4.3-4.1 5.6l6.2 5.2C39.9 36.8 44 31 44 24c0-1.3-.1-2.7-.4-3.5z"/>
              </svg>
              Continue with Google
            </button>
          </form>
        </motion.div>
      </div>
    </div>
  );
}