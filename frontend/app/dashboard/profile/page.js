"use client";

import { useState } from "react";
import { useAuth } from "../../../lib/AuthContext";
import api from "../../../lib/api";
import { getPasswordStrength, STRENGTH_COLORS } from "../../../lib/passwordStrength";

const ROLE_LABELS = {
  content_creator: "Content Creator",
  learner: "Learner",
  educator: "Educator",
  administrator: "Administrator",
};

export default function ProfilePage() {
  const { user, loading: authLoading } = useAuth();
  const [fullName, setFullName] = useState(user?.full_name || "");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const strength = getPasswordStrength(newPassword);
  const passwordsMismatch = confirmPassword.length > 0 && newPassword !== confirmPassword;

  if (authLoading || !user) {
    return <p className="font-mono text-xs text-ink/50 dark:text-paper/50">Loading...</p>;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setSuccess("");
    if (newPassword && newPassword !== confirmPassword) {
      setError("New passwords do not match.");
      return;
    }
    const payload = {};
    if (fullName !== user.full_name) payload.full_name = fullName;
    if (newPassword) payload.password = newPassword;
    if (Object.keys(payload).length === 0) {
      setSuccess("Nothing to update.");
      return;
    }
    setSubmitting(true);
    try {
      await api.patch("/api/v1/users/me", payload);
      setSuccess("Profile updated successfully.");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err) {
      setError(err.response?.data?.detail || "Update failed. Try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="max-w-lg">
      <h1 className="mb-8 font-display text-xl font-semibold tracking-tight text-ink dark:text-paper">Profile</h1>

      <div className="mb-6 rounded-lg border border-line bg-cloud p-6 dark:border-line-dark dark:bg-graphite">
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="font-mono text-[10px] uppercase tracking-widest text-ink/50 dark:text-paper/50">Email</p>
            <p className="mt-1 text-ink dark:text-paper">{user.email}</p>
          </div>
          <div>
            <p className="font-mono text-[10px] uppercase tracking-widest text-ink/50 dark:text-paper/50">Role</p>
            <p className="mt-1 text-ink dark:text-paper">{ROLE_LABELS[user.role] || user.role}</p>
          </div>
          <div>
            <p className="font-mono text-[10px] uppercase tracking-widest text-ink/50 dark:text-paper/50">Member since</p>
            <p className="mt-1 text-ink dark:text-paper">
              {new Date(user.created_at).toLocaleDateString(undefined, { month: "long", day: "numeric", year: "numeric" })}
            </p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4 rounded-lg border border-line bg-cloud p-6 dark:border-line-dark dark:bg-graphite">
        <div>
          <label className="font-mono text-[10px] uppercase tracking-widest text-ink/50 dark:text-paper/50">Full name</label>
          <input value={fullName} onChange={(e) => setFullName(e.target.value)}
            className="mt-1 w-full rounded-md border border-line bg-transparent px-3 py-2 text-sm text-ink focus:border-signal focus:outline-none dark:border-line-dark dark:text-paper" />
        </div>

        <div className="border-t border-line pt-4 dark:border-line-dark">
          <p className="mb-3 font-mono text-[10px] uppercase tracking-widest text-ink/50 dark:text-paper/50">Change password (optional)</p>
          <label className="font-mono text-[10px] uppercase tracking-widest text-ink/50 dark:text-paper/50">New password</label>
          <input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="Leave blank to keep current password"
            className="mt-1 w-full rounded-md border border-line bg-transparent px-3 py-2 text-sm text-ink focus:border-signal focus:outline-none dark:border-line-dark dark:text-paper" />
          {newPassword.length > 0 && (
            <div className="mt-2">
              <div className="flex gap-1">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className={`h-1 flex-1 rounded-full ${i <= strength.score ? STRENGTH_COLORS[strength.score] : "bg-line dark:bg-line-dark"}`} />
                ))}
              </div>
              <p className="mt-1 font-mono text-[10px] uppercase tracking-wide text-ink/50 dark:text-paper/50">{strength.label}</p>
            </div>
          )}
          {newPassword && (
            <div className="mt-3">
              <label className="font-mono text-[10px] uppercase tracking-widest text-ink/50 dark:text-paper/50">Confirm new password</label>
              <input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)}
                className={`mt-1 w-full rounded-md border bg-transparent px-3 py-2 text-sm text-ink focus:outline-none dark:text-paper ${passwordsMismatch ? "border-danger" : "border-line focus:border-signal dark:border-line-dark"}`} />
              {passwordsMismatch && <p className="mt-1 text-xs text-danger">Passwords do not match.</p>}
            </div>
          )}
        </div>

        {error && <p className="text-sm text-danger">{error}</p>}
        {success && <p className="text-sm text-ok">{success}</p>}

        <button type="submit" disabled={submitting} className="rounded-md bg-signal px-4 py-2 font-mono text-[11px] uppercase tracking-wide text-white disabled:opacity-50">
          {submitting ? "Saving..." : "Save changes"}
        </button>
      </form>
    </div>
  );
}