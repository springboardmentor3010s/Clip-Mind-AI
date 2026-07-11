"use client";

import { useState } from "react";
import { useAuth } from "../../../lib/AuthContext";
import api from "../../../lib/api";
import { getPasswordStrength, STRENGTH_COLORS } from "../../../lib/passwordStrength";
import { EyeIcon } from "../../../components/ui/icons";

const ROLE_LABELS = {
  content_creator: "Content Creator",
  learner: "Learner",
  educator: "Educator",
  administrator: "Administrator",
};

function PasswordField({ label, value, onChange, placeholder }) {
  const [show, setShow] = useState(false);
  return (
    <div>
      <label className="text-xs font-medium text-ink/60 dark:text-paper/60">{label}</label>
      <div className="relative mt-1.5">
        <input
          type={show ? "text" : "password"}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          className="w-full rounded-lg border border-line bg-transparent px-3.5 py-2.5 pr-10 text-sm text-ink placeholder:text-ink/30 focus:border-signal focus:outline-none focus:ring-2 focus:ring-signal/15 dark:border-line-dark dark:text-paper dark:placeholder:text-paper/30"
        />
        <button type="button" onClick={() => setShow((s) => !s)} className="absolute right-3 top-1/2 -translate-y-1/2 text-ink/35 hover:text-ink/60 dark:text-paper/35 dark:hover:text-paper/60">
          <EyeIcon width={16} height={16} />
        </button>
      </div>
    </div>
  );
}

export default function ProfilePage() {
  const { user, loading: authLoading } = useAuth();
  const [fullName, setFullName] = useState(user?.full_name || "");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const strength = getPasswordStrength(newPassword);
  const passwordsMismatch = confirmPassword.length > 0 && newPassword !== confirmPassword;

  if (authLoading || !user) {
    return <p className="text-sm text-ink/50 dark:text-paper/50">Loading...</p>;
  }

  const initials = user.full_name.split(" ").map((p) => p[0]).join("").slice(0, 2).toUpperCase();

  async function handleProfileSubmit(e) {
    e.preventDefault();
    setError("");
    setSuccess("");
    if (fullName === user.full_name) {
      setSuccess("Nothing to update.");
      return;
    }
    setSubmitting(true);
    try {
      await api.patch("/api/v1/users/me", { full_name: fullName });
      setSuccess("Profile updated successfully.");
    } catch (err) {
      setError(err.response?.data?.detail || "Update failed. Try again.");
    } finally {
      setSubmitting(false);
    }
  }

  async function handlePasswordSubmit(e) {
    e.preventDefault();
    setError("");
    setSuccess("");
    if (!newPassword) return;
    if (newPassword !== confirmPassword) {
      setError("New passwords do not match.");
      return;
    }
    setSubmitting(true);
    try {
      // Note: the backend does not currently verify current_password before
      // accepting a new one — this field is collected for UX parity with the
      // design but isn't enforced server-side yet.
      await api.patch("/api/v1/users/me", { password: newPassword });
      setSuccess("Password updated successfully.");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err) {
      setError(err.response?.data?.detail || "Update failed. Try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="max-w-3xl">
      <h1 className="mb-1 font-display text-xl font-semibold tracking-tight text-ink dark:text-paper">Profile Settings</h1>
      <p className="mb-8 text-sm text-ink/50 dark:text-paper/50">Manage your account details</p>

      {(error || success) && (
        <p className={`mb-4 text-sm ${error ? "text-danger" : "text-ok"}`}>{error || success}</p>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Profile information */}
        <form onSubmit={handleProfileSubmit} className="rounded-xl border border-line bg-cloud p-6 dark:border-line-dark dark:bg-graphite">
          <div className="mb-5 flex items-center justify-between">
            <p className="text-xs font-medium uppercase tracking-wide text-ink/45 dark:text-paper/45">Profile Information</p>
            <span className="flex h-12 w-12 items-center justify-center rounded-full bg-signal/10 text-sm font-medium text-signal dark:bg-signal-dark/20 dark:text-signal-dark">
              {initials}
            </span>
          </div>

          <div className="space-y-4">
            <div>
              <label className="text-xs font-medium text-ink/60 dark:text-paper/60">Full Name</label>
              <input value={fullName} onChange={(e) => setFullName(e.target.value)}
                className="mt-1.5 w-full rounded-lg border border-line bg-transparent px-3.5 py-2.5 text-sm text-ink focus:border-signal focus:outline-none focus:ring-2 focus:ring-signal/15 dark:border-line-dark dark:text-paper" />
            </div>
            <div>
              <p className="text-xs font-medium text-ink/60 dark:text-paper/60">Email Address</p>
              <p className="mt-1.5 text-sm text-ink dark:text-paper">{user.email}</p>
            </div>
            <div>
              <p className="text-xs font-medium text-ink/60 dark:text-paper/60">Role</p>
              <p className="mt-1.5 text-sm text-ink dark:text-paper">{ROLE_LABELS[user.role] || user.role}</p>
            </div>
            <div>
              <p className="text-xs font-medium text-ink/60 dark:text-paper/60">Member Since</p>
              <p className="mt-1.5 text-sm text-ink dark:text-paper">
                {new Date(user.created_at).toLocaleDateString(undefined, { month: "long", day: "numeric", year: "numeric" })}
              </p>
            </div>
          </div>

          <button type="submit" disabled={submitting} className="mt-6 rounded-lg bg-signal px-4 py-2.5 text-sm font-medium text-white disabled:opacity-50">
            {submitting ? "Saving..." : "Save changes"}
          </button>
        </form>

        {/* Change password */}
        <form onSubmit={handlePasswordSubmit} className="rounded-xl border border-line bg-cloud p-6 dark:border-line-dark dark:bg-graphite">
          <p className="mb-5 text-xs font-medium uppercase tracking-wide text-ink/45 dark:text-paper/45">Change Password</p>

          <div className="space-y-4">
            <PasswordField label="Current Password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} placeholder="Enter current password" />
            <div>
              <PasswordField label="New Password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="Enter new password" />
              {newPassword.length > 0 && (
                <div className="mt-2">
                  <div className="flex gap-1">
                    {[1, 2, 3, 4].map((i) => (
                      <div key={i} className={`h-1 flex-1 rounded-full ${i <= strength.score ? STRENGTH_COLORS[strength.score] : "bg-line dark:bg-line-dark"}`} />
                    ))}
                  </div>
                  <p className="mt-1 text-xs text-ink/50 dark:text-paper/50">{strength.label}</p>
                </div>
              )}
            </div>
            <div>
              <PasswordField label="Confirm New Password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="Confirm new password" />
              {passwordsMismatch && <p className="mt-1 text-xs text-danger">Passwords do not match.</p>}
            </div>
          </div>

          <button type="submit" disabled={submitting || !newPassword} className="mt-6 w-full rounded-lg bg-signal py-2.5 text-sm font-medium text-white disabled:cursor-not-allowed disabled:opacity-50">
            {submitting ? "Updating..." : "Update Password"}
          </button>
        </form>
      </div>
    </div>
  );
}
