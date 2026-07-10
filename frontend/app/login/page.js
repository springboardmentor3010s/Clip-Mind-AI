"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "../../lib/AuthContext";
import ThemeToggle from "../../components/ui/ThemeToggle";
import Waveform from "../../components/ui/Waveform";

const ROLE_DASHBOARD = {
  content_creator: "/dashboard/content-creator",
  learner: "/dashboard/learner",
  educator: "/dashboard/educator",
  administrator: "/dashboard/admin",
};

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const { login } = useAuth();
  const router = useRouter();

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      const user = await login(email, password);
      router.push(ROLE_DASHBOARD[user.role] || "/dashboard");
    } catch (err) {
      setError(err.response?.data?.detail || "Login failed. Check your credentials.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="relative flex min-h-screen bg-paper dark:bg-ink">
      <div className="absolute right-6 top-6 z-10"><ThemeToggle /></div>

      <div className="relative hidden w-1/2 flex-col justify-between overflow-hidden bg-ink p-12 text-paper lg:flex">
        <div className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-signal-dark" />
          <span className="font-display text-lg font-semibold tracking-tight">ClipMind AI</span>
        </div>
        <div>
          <h2 className="max-w-sm font-display text-3xl font-semibold leading-tight tracking-tight">
            Summarize videos, extract key moments, and gain insights instantly.
          </h2>
          <Waveform className="mt-8 h-8 w-48 text-signal-dark/50" />
        </div>
        <p className="font-mono text-[11px] uppercase tracking-widest text-paper/30">AI-powered video intelligence</p>
      </div>

      <div className="flex w-full items-center justify-center p-6 lg:w-1/2">
        <div className="w-full max-w-sm">
          <h1 className="font-display text-xl font-semibold tracking-tight text-ink dark:text-paper">Welcome back</h1>
          <p className="mt-1 text-sm text-ink/50 dark:text-paper/50">Log in to your account</p>

          <form onSubmit={handleSubmit} className="mt-8 space-y-4">
            <div>
              <label className="font-mono text-[10px] uppercase tracking-widest text-ink/50 dark:text-paper/50">Email address</label>
              <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com"
                className="mt-1 w-full rounded-md border border-line bg-transparent px-3 py-2 text-sm text-ink focus:border-signal focus:outline-none dark:border-line-dark dark:text-paper" />
            </div>
            <div>
              <label className="font-mono text-[10px] uppercase tracking-widest text-ink/50 dark:text-paper/50">Password</label>
              <input type="password" required value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Enter your password"
                className="mt-1 w-full rounded-md border border-line bg-transparent px-3 py-2 text-sm text-ink focus:border-signal focus:outline-none dark:border-line-dark dark:text-paper" />
            </div>

            {error && <p className="text-sm text-danger">{error}</p>}

            <button type="submit" disabled={submitting} className="w-full rounded-md bg-signal py-2.5 text-sm font-medium text-white hover:bg-signal/90 disabled:opacity-50">
              {submitting ? "Logging in..." : "Log in"}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-ink/50 dark:text-paper/50">
            Don't have an account? <Link href="/register" className="font-medium text-signal">Register</Link>
          </p>
        </div>
      </div>
    </main>
  );
}