import { useState } from "react";
import { NavLink } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { useVideo } from "../../context/VideoContext";
import { useAuth } from "../../context/AuthContext";
import { useToast } from "../ui/Toast";
import { navItemsForRole, ROLE_LABELS } from "../../lib/roles";

function truncate(text, max = 25) {
  const value = text || "Untitled Video";
  return value.length > max ? value.slice(0, max) + "…" : value;
}

function Sidebar() {
  const { videos, activeVideoId, changeActiveVideo, deleteVideo } = useVideo();
  const { user, logout } = useAuth();
  const { toast, Toaster } = useToast();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const selected = videos.find((v) => v.id === activeVideoId);
  const navItems = navItemsForRole(user?.role);
  // Only the owner of the selected video may delete it.
  const canDeleteSelected = Boolean(selected?.is_owner);

  const handleDelete = async () => {
    if (!activeVideoId) return;
    setDeleting(true);
    try {
      await deleteVideo(activeVideoId);
      toast("Video deleted.", "success");
      setConfirmOpen(false);
    } catch (err) {
      toast(err.message || "Failed to delete video.", "error");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="w-72 min-h-screen bg-slate-900 text-white p-6 border-r border-slate-800 flex flex-col">
      <Toaster />
      <div>
        <h1 className="text-3xl font-bold text-blue-500 mb-8">ClipMind AI</h1>

        {/* Selected Video Dropdown + delete */}
        <div className="mb-8">
          <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
            Selected Video
          </label>
          <select
            value={activeVideoId}
            onChange={(e) => changeActiveVideo(e.target.value)}
            className="w-full bg-slate-800 text-white rounded-lg border border-slate-700 px-3 py-2.5 outline-none focus:border-blue-500 transition text-sm cursor-pointer"
          >
            <option value="">-- Select a Video --</option>
            {videos.map((vid) => (
              <option key={vid.id} value={vid.id}>{truncate(vid.title)}</option>
            ))}
          </select>

          {activeVideoId && canDeleteSelected && (
            <button
              onClick={() => setConfirmOpen(true)}
              className="mt-2 w-full flex items-center justify-center gap-2 bg-red-950/40 hover:bg-red-900/60 text-red-400 border border-red-900/50 px-3 py-2 rounded-lg text-sm font-semibold transition"
            >
              🗑 Delete Video
            </button>
          )}
        </div>
      </div>

      <nav className="space-y-2 flex-1 overflow-y-auto">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-lg transition ${
                isActive
                  ? "bg-blue-600/15 text-blue-400 font-semibold"
                  : "text-gray-300 hover:bg-slate-800 hover:text-white"
              }`
            }
          >
            <span>{item.icon}</span> {item.label}
          </NavLink>
        ))}
      </nav>

      {/* Signed-in identity + role badge */}
      {user && (
        <div className="mt-4 pt-4 border-t border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-blue-600 flex items-center justify-center font-bold uppercase shrink-0">
              {(user.first_name || user.email || "?").charAt(0)}
            </div>
            <div className="min-w-0 flex-1">
              <p className="font-semibold text-sm truncate">
                {user.full_name || user.first_name || "User"}
              </p>
              <p className="text-xs text-gray-500 truncate">{user.email}</p>
              <p className="text-xs text-blue-400 font-medium mt-0.5">
                {ROLE_LABELS[user.role] || user.role}
              </p>
            </div>
          </div>
          <button
            onClick={logout}
            className="mt-3 w-full bg-slate-800 hover:bg-slate-700 text-gray-300 px-3 py-2 rounded-lg text-sm font-semibold transition"
          >
            Sign out
          </button>
        </div>
      )}

      {/* Confirmation modal */}
      <AnimatePresence>
        {confirmOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
            onClick={() => !deleting && setConfirmOpen(false)}
          >
            <motion.div
              initial={{ scale: 0.95, y: 10 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 10 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-slate-900 border border-slate-800 rounded-2xl p-6 max-w-sm w-full shadow-2xl"
            >
              <h3 className="text-xl font-bold text-white">Delete this video?</h3>
              <p className="text-gray-400 mt-2 text-sm">
                This permanently removes <span className="text-gray-200 font-semibold">{truncate(selected?.title, 40)}</span> and all
                of its transcript, AI summary, key moments, thumbnails and stored files. This cannot be undone.
              </p>
              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => setConfirmOpen(false)}
                  disabled={deleting}
                  className="flex-1 bg-slate-800 hover:bg-slate-700 disabled:opacity-50 px-4 py-2.5 rounded-lg font-semibold transition"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDelete}
                  disabled={deleting}
                  className="flex-1 bg-red-600 hover:bg-red-700 disabled:opacity-60 px-4 py-2.5 rounded-lg font-semibold transition flex items-center justify-center gap-2"
                >
                  {deleting ? (
                    <><span className="w-4 h-4 border-2 border-t-transparent border-white rounded-full animate-spin" /> Deleting…</>
                  ) : "Delete"}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default Sidebar;
