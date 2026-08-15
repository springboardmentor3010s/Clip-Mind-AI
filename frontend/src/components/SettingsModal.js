import { X, Moon, Sun, User, Mail, Shield, LogOut } from "lucide-react";
import { useTheme } from "@/context/ThemeContext";

const roleLabels = {
  creator: "Content Creator",
  learner: "Learner",
  educator: "Educator",
  admin: "Administrator",
};

export default function SettingsModal({ username, email, role, onClose }) {
  const { isDark, toggleTheme } = useTheme();

  function handleSignOut() {
    localStorage.removeItem("clipmind_token");
    localStorage.removeItem("clipmind_user");
    window.location.href = "/login";
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50" onClick={onClose}>
      <div
        onClick={(e) => e.stopPropagation()}
        className={`w-full max-w-md rounded-2xl shadow-2xl overflow-hidden ${
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
            <p className="text-xs font-semibold uppercase text-gray-400 mb-3">Account</p>
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