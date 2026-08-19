"use client";

import React, { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import {
  getProfile,
  updateProfile,
  changePassword,
  getActivity,
  listUsers,
  updateUserRole,
} from "@/services/userService";
import { Shield, User as UserIcon, Lock, Activity as ActivityIcon, Users } from "lucide-react";

const ROLE_DESCRIPTIONS: Record<string, string> = {
  Creator: "Create and manage summarized content.",
  Learner: "Consume educational content.",
  Educator: "Manage educational resources.",
  Administrator: "Manage the platform.",
};

const ROLE_OPTIONS = ["Creator", "Learner", "Educator", "Administrator"];

interface Profile {
  id: string;
  username: string;
  email: string;
  role: string;
  created_at: string;
}

interface ActivityEvent {
  id: number;
  event_type: string;
  video_id: number | null;
  video_title: string | null;
  metadata_val: string | null;
  created_at: string;
}

export default function SettingsPage() {
  const { token, login: setAuthUser } = useAuth();

  const [profile, setProfile] = useState<Profile | null>(null);
  const [profileForm, setProfileForm] = useState({ username: "", email: "" });
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileMessage, setProfileMessage] = useState<string | null>(null);

  const [passwordForm, setPasswordForm] = useState({ current_password: "", new_password: "", confirm_password: "" });
  const [passwordSaving, setPasswordSaving] = useState(false);
  const [passwordMessage, setPasswordMessage] = useState<string | null>(null);

  const [activity, setActivity] = useState<ActivityEvent[]>([]);
  const [isLoadingActivity, setIsLoadingActivity] = useState(true);

  const [users, setUsers] = useState<Profile[]>([]);
  const [isLoadingUsers, setIsLoadingUsers] = useState(false);

  useEffect(() => {
    if (!token) return;

    const load = async () => {
      try {
        const data = await getProfile(token);
        setProfile(data);
        setProfileForm({ username: data.username, email: data.email });
      } catch (e) {
        console.error("Failed to load profile:", e);
      }
    };
    load();

    const loadActivity = async () => {
      try {
        const data = await getActivity(token);
        setActivity(data);
      } catch (e) {
        console.error("Failed to load activity:", e);
      } finally {
        setIsLoadingActivity(false);
      }
    };
    loadActivity();
  }, [token]);

  useEffect(() => {
    if (!token || profile?.role !== "Administrator") return;

    const loadUsers = async () => {
      setIsLoadingUsers(true);
      try {
        const data = await listUsers(token);
        setUsers(data);
      } catch (e) {
        console.error("Failed to load users:", e);
      } finally {
        setIsLoadingUsers(false);
      }
    };
    loadUsers();
  }, [token, profile?.role]);

  const handleProfileSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;
    setProfileSaving(true);
    setProfileMessage(null);
    try {
      const updated = await updateProfile(token, profileForm);
      setProfile(updated);
      setAuthUser(token, updated);
      setProfileMessage("Profile updated successfully.");
    } catch (err: any) {
      setProfileMessage(err.response?.data?.detail || "Failed to update profile.");
    } finally {
      setProfileSaving(false);
    }
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;
    if (passwordForm.new_password !== passwordForm.confirm_password) {
      setPasswordMessage("New passwords do not match.");
      return;
    }
    setPasswordSaving(true);
    setPasswordMessage(null);
    try {
      await changePassword(token, {
        current_password: passwordForm.current_password,
        new_password: passwordForm.new_password,
      });
      setPasswordForm({ current_password: "", new_password: "", confirm_password: "" });
      setPasswordMessage("Password updated successfully.");
    } catch (err: any) {
      setPasswordMessage(err.response?.data?.detail || "Failed to update password.");
    } finally {
      setPasswordSaving(false);
    }
  };

  const handleRoleChange = async (userId: string, role: string) => {
    if (!token) return;
    try {
      const updated = await updateUserRole(token, userId, role);
      setUsers((prev) => prev.map((u) => (u.id === userId ? updated : u)));
    } catch (e) {
      console.error("Failed to update role:", e);
    }
  };

  const inputClass = "w-full px-4 py-2.5 bg-md-surface-container-highest border-b-2 border-md-outline rounded-t-md text-md-on-surface placeholder:text-md-on-surface-variant focus:outline-none focus:border-md-primary transition-all text-body-small";

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 max-w-3xl">
      <header>
        <h1 className="text-headline-medium font-bold text-md-on-surface tracking-tight">Settings</h1>
        <p className="text-md-on-surface-variant mt-2">Manage your profile, security, and account preferences.</p>
      </header>

      {/* Profile */}
      <section className="bg-md-surface-container p-6 rounded-xl">
        <div className="flex items-center gap-2 mb-4">
          <UserIcon size={18} className="text-md-primary" />
          <h2 className="text-title-large font-semibold text-md-on-surface">Profile</h2>
        </div>
        <form onSubmit={handleProfileSave} className="space-y-4">
          <div>
            <label className="block text-label-small font-medium text-md-on-surface-variant mb-1.5">Username</label>
            <input
              type="text"
              className={inputClass}
              value={profileForm.username}
              onChange={(e) => setProfileForm({ ...profileForm, username: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-label-small font-medium text-md-on-surface-variant mb-1.5">Email</label>
            <input
              type="email"
              className={inputClass}
              value={profileForm.email}
              onChange={(e) => setProfileForm({ ...profileForm, email: e.target.value })}
            />
          </div>
          {profileMessage && (
            <p className="text-body-small text-md-tertiary">{profileMessage}</p>
          )}
          <button
            type="submit"
            disabled={profileSaving}
            className="px-4 py-2 bg-md-primary hover:opacity-90 text-md-on-primary text-label-large font-semibold rounded-full transition-all disabled:opacity-38"
          >
            {profileSaving ? "Saving..." : "Save Changes"}
          </button>
        </form>
      </section>

      {/* Security */}
      <section className="bg-md-surface-container p-6 rounded-xl">
        <div className="flex items-center gap-2 mb-4">
          <Lock size={18} className="text-md-primary" />
          <h2 className="text-title-large font-semibold text-md-on-surface">Security</h2>
        </div>
        <form onSubmit={handlePasswordChange} className="space-y-4">
          <div>
            <label className="block text-label-small font-medium text-md-on-surface-variant mb-1.5">Current Password</label>
            <input
              type="password"
              required
              className={inputClass}
              value={passwordForm.current_password}
              onChange={(e) => setPasswordForm({ ...passwordForm, current_password: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-label-small font-medium text-md-on-surface-variant mb-1.5">New Password</label>
            <input
              type="password"
              required
              className={inputClass}
              value={passwordForm.new_password}
              onChange={(e) => setPasswordForm({ ...passwordForm, new_password: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-label-small font-medium text-md-on-surface-variant mb-1.5">Confirm New Password</label>
            <input
              type="password"
              required
              className={inputClass}
              value={passwordForm.confirm_password}
              onChange={(e) => setPasswordForm({ ...passwordForm, confirm_password: e.target.value })}
            />
          </div>
          {passwordMessage && (
            <p className="text-body-small text-md-tertiary">{passwordMessage}</p>
          )}
          <button
            type="submit"
            disabled={passwordSaving}
            className="px-4 py-2 bg-md-primary hover:opacity-90 text-md-on-primary text-label-large font-semibold rounded-full transition-all disabled:opacity-38"
          >
            {passwordSaving ? "Updating..." : "Update Password"}
          </button>
        </form>
      </section>

      {/* Role & Access */}
      <section className="bg-md-surface-container p-6 rounded-xl">
        <div className="flex items-center gap-2 mb-4">
          <Shield size={18} className="text-md-primary" />
          <h2 className="text-title-large font-semibold text-md-on-surface">Role &amp; Access</h2>
        </div>
        {profile ? (
          <div className="flex items-center justify-between p-4 bg-md-surface-container-highest rounded-xl">
            <div>
              <p className="text-md-on-surface font-medium">{profile.role}</p>
              <p className="text-md-on-surface-variant text-body-small mt-0.5">{ROLE_DESCRIPTIONS[profile.role] || "Platform role."}</p>
            </div>
            <span className="px-3 py-1 bg-md-primary-container text-md-on-primary-container text-label-small font-medium rounded-full">
              {profile.role}
            </span>
          </div>
        ) : (
          <p className="text-md-on-surface-variant text-body-small">Loading...</p>
        )}
      </section>

      {/* Activity History */}
      <section className="bg-md-surface-container p-6 rounded-xl">
        <div className="flex items-center gap-2 mb-4">
          <ActivityIcon size={18} className="text-md-primary" />
          <h2 className="text-title-large font-semibold text-md-on-surface">Activity History</h2>
        </div>
        {isLoadingActivity ? (
          <p className="text-md-on-surface-variant text-body-small">Loading activity...</p>
        ) : activity.length === 0 ? (
          <p className="text-md-on-surface-variant text-body-small">No activity recorded yet.</p>
        ) : (
          <div className="space-y-2">
            {activity.map((event) => (
              <div key={event.id} className="flex items-center justify-between p-3 bg-md-surface-container-highest rounded-xl text-body-small">
                <div>
                  <span className="text-md-on-surface font-medium">{event.event_type}</span>
                  {event.video_title && (
                    <span className="text-md-on-surface-variant"> — {event.video_title}</span>
                  )}
                </div>
                <span className="text-md-on-surface-variant text-label-small">
                  {new Date(event.created_at).toLocaleString()}
                </span>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Admin: Platform Settings */}
      {profile?.role === "Administrator" && (
        <section className="bg-md-surface-container p-6 rounded-xl">
          <div className="flex items-center gap-2 mb-4">
            <Users size={18} className="text-md-primary" />
            <h2 className="text-title-large font-semibold text-md-on-surface">Platform Settings — Manage Users</h2>
          </div>
          {isLoadingUsers ? (
            <p className="text-md-on-surface-variant text-body-small">Loading users...</p>
          ) : (
            <div className="space-y-2">
              {users.map((u) => (
                <div key={u.id} className="flex items-center justify-between p-3 bg-md-surface-container-highest rounded-xl text-body-small">
                  <div>
                    <p className="text-md-on-surface font-medium">{u.username}</p>
                    <p className="text-md-on-surface-variant text-label-small">{u.email}</p>
                  </div>
                  <select
                    value={u.role}
                    onChange={(e) => handleRoleChange(u.id, e.target.value)}
                    className="px-3 py-1.5 bg-md-surface-container border border-md-outline-variant rounded-full text-md-on-surface text-label-small focus:outline-none focus:ring-2 focus:ring-md-primary/50"
                  >
                    {ROLE_OPTIONS.map((r) => (
                      <option key={r} value={r} className="bg-md-surface-container-highest">
                        {r}
                      </option>
                    ))}
                  </select>
                </div>
              ))}
            </div>
          )}
        </section>
      )}
    </div>
  );
}
