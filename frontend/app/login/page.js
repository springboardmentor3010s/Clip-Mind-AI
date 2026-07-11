"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "../../lib/AuthContext";
import { PlayIcon } from "../../components/ui/icons";

const ROLE_DASHBOARD = {
  content_creator: "/dashboard/content-creator",
  learner: "/dashboard/learner",
  educator: "/dashboard/educator",
  administrator: "/dashboard/admin",
};

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(false);
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
    <main className="flex min-h-screen items-center justify-center bg-paper p-6 dark:bg-ink">
      <div className="grid w-full max-w-4xl overflow-hidden rounded-2xl border border-line bg-cloud shadow-sm dark:border-line-dark dark:bg-graphite md:grid-cols-2">
        {/* Brand panel */}
        <div className="hidden flex-col justify-between border-r border-line p-10 dark:border-line-dark md:flex">
          <div className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-signal text-white">
              <PlayIcon width={15} height={15} />
            </span>
            <span className="font-display text-lg font-semibold tracking-tight text-ink dark:text-paper">ClipMind AI</span>
          </div>

          <div className="my-10">
            <h1 className="font-display text-2xl font-semibold leading-snug tracking-tight text-ink dark:text-paper">
              Summarize videos, extract key moments, and gain insights instantly.
            </h1>
          </div>

          <div className="flex aspect-[4/3] flex-col items-center justify-center rounded-xl bg-paper dark:bg-graphite-2">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-signal/10 text-signal dark:bg-signal-dark/15 dark:text-signal-dark">
              <PlayIcon width={26} height={26} />
            </div>
            <div className="mt-4 h-2 w-32 rounded-full bg-line dark:bg-line-dark" />
            <div className="mt-2 h-2 w-20 rounded-full bg-line dark:bg-line-dark" />
          </div>
        </div>

        {/* Form panel */}
        <div className="flex flex-col justify-center p-8 sm:p-12">
          <h2 className="font-display text-xl font-semibold tracking-tight text-ink dark:text-paper">Welcome Back 👋</h2>
          <p className="mt-1 text-sm text-ink/50 dark:text-paper/50">Login to your account</p>

          <form onSubmit={handleSubmit} className="mt-8 space-y-4">
            <div>
              <label className="text-xs font-medium text-ink/60 dark:text-paper/60">Email address</label>
              <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com"
                className="mt-1.5 w-full rounded-lg border border-line bg-transparent px-3.5 py-2.5 text-sm text-ink placeholder:text-ink/30 focus:border-signal focus:outline-none focus:ring-2 focus:ring-signal/15 dark:border-line-dark dark:text-paper dark:placeholder:text-paper/30" />
            </div>
            <div>
              <label className="text-xs font-medium text-ink/60 dark:text-paper/60">Password</label>
              <input type="password" required value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Enter your password"
                className="mt-1.5 w-full rounded-lg border border-line bg-transparent px-3.5 py-2.5 text-sm text-ink placeholder:text-ink/30 focus:border-signal focus:outline-none focus:ring-2 focus:ring-signal/15 dark:border-line-dark dark:text-paper dark:placeholder:text-paper/30" />
            </div>

            <div className="flex items-center justify-between text-sm">
              <label className="flex items-center gap-2 text-ink/60 dark:text-paper/60">
                <input type="checkbox" checked={remember} onChange={(e) => setRemember(e.target.checked)}
                  className="h-4 w-4 rounded border-line text-signal focus:ring-signal/30 dark:border-line-dark" />
                Remember me
              </label>
              <Link href="#" className="font-medium text-signal">Forgot password?</Link>
            </div>

            {error && <p className="text-sm text-danger">{error}</p>}

            <button type="submit" disabled={submitting} className="w-full rounded-lg bg-signal py-2.5 text-sm font-medium text-white shadow-sm hover:bg-signal/90 disabled:opacity-50">
              {submitting ? "Logging in..." : "Login"}
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
