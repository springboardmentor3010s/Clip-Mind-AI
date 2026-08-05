"use client";

import { useState } from "react";
import Link from "next/link";
import api from "../../lib/api";
import { PlayIcon } from "../../components/ui/icons";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      await api.post("/api/v1/auth/forgot-password", { email });
      setSubmitted(true);
    } catch (err) {
      setError(err.response?.data?.detail || "Something went wrong. Try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-paper p-6 dark:bg-ink">
      <div className="w-full max-w-md overflow-hidden rounded-2xl border border-line bg-cloud p-8 shadow-sm dark:border-line-dark dark:bg-graphite sm:p-10">
        <div className="mb-6 flex items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-signal text-white">
            <PlayIcon width={15} height={15} />
          </span>
          <span className="font-display text-lg font-semibold tracking-tight text-ink dark:text-paper">ClipMind AI</span>
        </div>

        {submitted ? (
          <div>
            <h1 className="font-display text-xl font-semibold tracking-tight text-ink dark:text-paper">Check your email</h1>
            <p className="mt-2 text-sm leading-relaxed text-ink/60 dark:text-paper/60">
              If an account exists for <span className="font-medium text-ink dark:text-paper">{email}</span>, we've sent a
              link to reset your password. It expires in 30 minutes.
            </p>
            <Link href="/login" className="mt-6 inline-block text-sm font-medium text-signal">&larr; Back to login</Link>
          </div>
        ) : (
          <>
            <h1 className="font-display text-xl font-semibold tracking-tight text-ink dark:text-paper">Forgot password?</h1>
            <p className="mt-1 text-sm text-ink/50 dark:text-paper/50">
              Enter your email and we'll send you a link to reset it.
            </p>

            <form onSubmit={handleSubmit} className="mt-7 space-y-4">
              <div>
                <label className="text-xs font-medium text-ink/60 dark:text-paper/60">Email address</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="mt-1.5 w-full rounded-lg border border-line bg-transparent px-3.5 py-2.5 text-sm text-ink placeholder:text-ink/30 focus:border-signal focus:outline-none focus:ring-2 focus:ring-signal/15 dark:border-line-dark dark:text-paper dark:placeholder:text-paper/30"
                />
              </div>

              {error && <p className="text-sm text-danger">{error}</p>}

              <button
                type="submit"
                disabled={submitting}
                className="w-full rounded-lg bg-signal py-2.5 text-sm font-medium text-white shadow-sm hover:bg-signal/90 disabled:opacity-50"
              >
                {submitting ? "Sending..." : "Send reset link"}
              </button>
            </form>

            <p className="mt-6 text-center text-sm text-ink/50 dark:text-paper/50">
              <Link href="/login" className="font-medium text-signal">&larr; Back to login</Link>
            </p>
          </>
        )}
      </div>
    </main>
  );
}