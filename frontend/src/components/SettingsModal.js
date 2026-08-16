"use client";

import { useState } from "react";
import { X, User, Mail, Shield, LogOut, Lock, Check, Loader2, Edit3 } from "lucide-react";
import { useTheme } from "@/context/ThemeContext";

const roleLabels = {
  creator: "Content Creator",
  learner: "Learner",
  educator: "Educator",
  admin: "Administrator",
};

export default function SettingsModal({ username, email, role, onClose }) {
  const { isDark, toggleTheme } = useTheme();

  const [editingProfile, setEditingProfile] = useState(false);
  const [newUsername, setNewUsername] = useState(username);
  const [newEmail, setNewEmail] = useState(email);
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileError, setProfileError] = useState("");
  const [profileSaved, setProfileSaved] = useState(false);

  const [changingPassword, setChangingPassword] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [passwordSaving, setPasswordSaving] = useState(false);
  const [passwordError, setPasswordError] = useState("");
  const [passwordSaved, setPasswordSaved] = useState(false);

  function handleSignOut() {
    localStorage.removeItem("clipmind_token");
    localStorage.removeItem("clipmind_user");
    window.location.href = "/login";
  }

  async function saveProfile() {
    setProfileSaving(true);
    setProfileError("");
    const token = localStorage.getItem("clipmind_token");
    try {
      const res = await fetch("http://localhost:8000/api/v1/auth/me", {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ username: newUsername, email: newEmail }),
      });
      const data = await res.json();
      if (!res.ok) {
        setProfileError(data.detail || "Failed to update profile.");
        setProfileSaving(false);
        return;
      }
      const stored = JSON.parse(localStorage.getItem("clipmind_user") || "{}");
      localStorage.setItem(
        "clipmind_user",
        JSON.stringify({ ...stored, username: data.username, email: data.email })
      );
      setProfileSaved(true);
      setEditingProfile(false);
      setTimeout(() => window.location.reload(), 800);
    } catch (err) {
      setProfileError("Could not connect to server.");
    }
    setProfileSaving(false);
  }

  async function savePassword() {
    setPasswordSaving(true);
    setPasswordError("");
    const token = localStorage.getItem("clipmind_token");
    try {
      const res = await fetch("http://localhost:8000/api/v1/auth/me/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ current_password: currentPassword, new_password: newPassword }),
      });
      const data = await res.json();
      if (!res.ok) {
        setPasswordError(data.detail || "Failed to change password.");
        setPasswordSaving(false);
        return;
      }
      setPasswordSaved(true);
      setCurrentPassword("");
      setNewPassword("");
      setTimeout(() => {
        setChangingPassword(false);
        setPasswordSaved(false);
      }, 1500);
    } catch (err) {
      setPasswordError("Could not connect to server.");
    }
    setPasswordSaving(false);
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50" onClick={onClose}>
      <div
        onClick={(e) => e.stopPropagation()}
        className={`w-full max-w-md rounded-2xl shadow-2xl overflow-hidden max-h-[85vh] overflow-y-auto ${
          isDark ? "bg-[#181B23] text-gray-100" : "bg-white text-gray-900"
        }`}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200/10">
          <h3 className="text-lg font-bold">Settings</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X size={20} />
          </button>
        </div>

        <div className="p-6 flex flex-col gap-5">
          {/* Account info */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs font-semibold uppercase text-gray-400">Account</p>
              {!editingProfile && (
                <button
                  onClick={() => setEditingProfile(true)}
                  className="text-xs font-semibold text-blue flex items-center gap-1 hover:underline"
                >
                  <Edit3 size={12} />
                  Edit
                </button>
              )}
            </div>

            {!editingProfile ? (
              <div className="flex flex-col gap-3">
                <div className="flex items-center gap-3">
                  <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${isDark ? "bg-white/10" : "bg-gray-100"}`}>
                    <User size={16} className="text-blue" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-400">Username</p>
                    <p className="text-sm font-medium">{username}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${isDark ? "bg-white/10" : "bg-gray-100"}`}>
                    <Mail size={16} className="text-blue" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-400">Email</p>
                    <p className="text-sm font-medium">{email}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${isDark ? "bg-white/10" : "bg-gray-100"}`}>
                    <Shield size={16} className="text-blue" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-400">Role</p>
                    <p className="text-sm font-medium">{roleLabels[role] || "Learner"}</p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                <div>
                  <label className="text-xs text-gray-400 mb-1 block">Username</label>
                  <input
                    value={newUsername}
                    onChange={(e) => setNewUsername(e.target.value)}
                    className={`w-full text-sm rounded-lg border px-3 py-2 ${
                      isDark ? "bg-white/5 border-white/10 text-gray-200" : "bg-gray-50 border-gray-200 text-gray-800"
                    }`}
                  />
                </div>
                <div>
                  <label className="text-xs text-gray-400 mb-1 block">Email</label>
                  <input
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                    className={`w-full text-sm rounded-lg border px-3 py-2 ${
                      isDark ? "bg-white/5 border-white/10 text-gray-200" : "bg-gray-50 border-gray-200 text-gray-800"
                    }`}
                  />
                </div>
                {profileError && <p className="text-xs text-red-500">{profileError}</p>}
                <div className="flex items-center gap-2">
                  <button
                    onClick={saveProfile}
                    disabled={profileSaving}
                    className="flex items-center justify-center gap-1.5 bg-blue text-white text-xs font-semibold px-4 py-2 rounded-full hover:opacity-90 transition disabled:opacity-50"
                  >
                    {profileSaving ? <Loader2 size={13} className="animate-spin" /> : profileSaved ? <Check size={13} /> : null}
                    {profileSaving ? "Saving..." : "Save Changes"}
                  </button>
                  <button
                    onClick={() => {
                      setEditingProfile(false);
                      setNewUsername(username);
                      setNewEmail(email);
                      setProfileError("");
                    }}
                    className={`text-xs font-semibold px-4 py-2 rounded-full ${
                      isDark ? "text-gray-300 hover:bg-white/5" : "text-gray-600 hover:bg-gray-100"
                    }`}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>

          <div className="h-px bg-gray-200/10" />

          {/* Password */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs font-semibold uppercase text-gray-400">Password</p>
              {!changingPassword && (
                <button
                  onClick={() => setChangingPassword(true)}
                  className="text-xs font-semibold text-blue flex items-center gap-1 hover:underline"
                >
                  <Lock size={12} />
                  Change
                </button>
              )}
            </div>

            {changingPassword && (
              <div className="flex flex-col gap-3">
                <div>
                  <label className="text-xs text-gray-400 mb-1 block">Current Password</label>
                  <input
                    type="password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    className={`w-full text-sm rounded-lg border px-3 py-2 ${
                      isDark ? "bg-white/5 border-white/10 text-gray-200" : "bg-gray-50 border-gray-200 text-gray-800"
                    }`}
                  />
                </div>
                <div>
                  <label className="text-xs text-gray-400 mb-1 block">New Password</label>
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className={`w-full text-sm rounded-lg border px-3 py-2 ${
                      isDark ? "bg-white/5 border-white/10 text-gray-200" : "bg-gray-50 border-gray-200 text-gray-800"
                    }`}
                  />
                </div>
                {passwordError && <p className="text-xs text-red-500">{passwordError}</p>}
                {passwordSaved && <p className="text-xs text-teal">Password updated successfully.</p>}
                <div className="flex items-center gap-2">
                  <button
                    onClick={savePassword}
                    disabled={passwordSaving || !currentPassword || !newPassword}
                    className="flex items-center justify-center gap-1.5 bg-blue text-white text-xs font-semibold px-4 py-2 rounded-full hover:opacity-90 transition disabled:opacity-50"
                  >
                    {passwordSaving ? <Loader2 size={13} className="animate-spin" /> : null}
                    {passwordSaving ? "Updating..." : "Update Password"}
                  </button>
                  <button
                    onClick={() => {
                      setChangingPassword(false);
                      setCurrentPassword("");
                      setNewPassword("");
                      setPasswordError("");
                    }}
                    className={`text-xs font-semibold px-4 py-2 rounded-full ${
                      isDark ? "text-gray-300 hover:bg-white/5" : "text-gray-600 hover:bg-gray-100"
                    }`}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>

          <div className="h-px bg-gray-200/10" />

          {/* Preferences */}
          <div>
            <p className="text-xs font-semibold uppercase text-gray-400 mb-3">Preferences</p>
            <button
              onClick={toggleTheme}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg transition ${
                isDark ? "hover:bg-white/5" : "hover:bg-gray-50"
              }`}
            >
              <span className="text-sm">Dark mode</span>
              <span
                className={`w-9 h-5 rounded-full flex items-center px-0.5 transition-colors ${
                  isDark ? "bg-blue justify-end" : "bg-gray-300 justify-start"
                }`}
              >
                <span className="w-4 h-4 bg-white rounded-full shadow" />
              </span>
            </button>
          </div>

          <div className="h-px bg-gray-200/10" />

          {/* Sign out */}
          <button
            onClick={handleSignOut}
            className="w-full flex items-center gap-2 px-3 py-2.5 rounded-lg text-red-500 hover:bg-red-500/10 transition text-left text-sm font-medium"
          >
            <LogOut size={16} />
            Sign out
          </button>
        </div>
      </div>
    </div>
  );
}