import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import {
  FiSearch,
  FiBell,
  FiChevronDown,
  FiLogOut,
  FiUser,
  FiSettings,
  FiMenu,
  FiZap,
  FiFileText,
  FiLayers,
  FiVideo,
} from "react-icons/fi";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "../context/AuthContext";
import { useWorkspace } from "../context/WorkspaceContext";
import { ThemeToggle } from "./ThemeToggle";

export function Navbar({ onOpenMobile }: { onOpenMobile?: () => void }) {
  const { user, logout } = useAuth();
  const { videos } = useWorkspace();

  const [profileOpen, setProfileOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);

  const navigate = useNavigate();

  const initials =
    user?.name
      ?.split(" ")
      .map((n) => n[0])
      .slice(0, 2)
      .join("")
      .toUpperCase() || "U";

  /*
   * ------------------------------------------------------------
   * SEARCH
   * ------------------------------------------------------------
   * Search works across the current user's workspace only.
   *
   * Searches:
   * - Recording/video titles
   * - Transcript text
   * - Key moment titles/text
   *
   * It does NOT change anything about the user's role.
   */

  const searchResults = useMemo(() => {
    const query = search.trim().toLowerCase();

    if (!query) return [];

    const results: {
      id: string;
      title: string;
      type: "Recording" | "Transcript" | "Key Moment";
      description: string;
      route: "/history" | "/transcript" | "/moments";
    }[] = [];

    videos.forEach((video: any) => {
      const videoTitle = String(video.title || "");
      const videoId = String(video.id || video.videoId || videoTitle);

      // Recording title
      if (videoTitle.toLowerCase().includes(query)) {
        results.push({
          id: `video-${videoId}`,
          title: videoTitle || "Untitled recording",
          type: "Recording",
          description: "Uploaded recording",
          route: "/history",
        });
      }

      // Transcript
      if (Array.isArray(video.transcript)) {
        const matchingSegment = video.transcript.find((segment: any) =>
          String(segment?.text || "")
            .toLowerCase()
            .includes(query)
        );

        if (matchingSegment) {
          results.push({
            id: `transcript-${videoId}`,
            title: videoTitle || "Transcript",
            type: "Transcript",
            description: String(matchingSegment.text || "").slice(0, 90),
            route: "/transcript",
          });
        }
      }

      // Key moments
      if (Array.isArray(video.moments)) {
        const matchingMoment = video.moments.find((moment: any) => {
          const text = [
            moment?.title,
            moment?.text,
            moment?.description,
            moment?.category,
          ]
            .filter(Boolean)
            .join(" ");

          return text.toLowerCase().includes(query);
        });

        if (matchingMoment) {
          const momentText =
            matchingMoment?.title ||
            matchingMoment?.text ||
            matchingMoment?.description ||
            matchingMoment?.category ||
            "Key moment";

          results.push({
            id: `moment-${videoId}-${String(momentText)}`,
            title: videoTitle || "Key Moments",
            type: "Key Moment",
            description: String(momentText).slice(0, 90),
            route: "/moments",
          });
        }
      }
    });

    // Remove duplicate IDs and show a maximum of 8 results.
    return Array.from(
      new Map(results.map((result) => [result.id, result])).values()
    ).slice(0, 8);
  }, [search, videos]);

  /*
   * Keyboard shortcut:
   * Ctrl + K / Cmd + K focuses the search box.
   */
  useEffect(() => {
    const handleShortcut = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();

        const input = document.getElementById(
          "clipmind-global-search"
        ) as HTMLInputElement | null;

        input?.focus();
        setSearchOpen(true);
      }

      if (event.key === "Escape") {
        setSearchOpen(false);
      }
    };

    window.addEventListener("keydown", handleShortcut);

    return () => {
      window.removeEventListener("keydown", handleShortcut);
    };
  }, []);

  const openSearchResult = (route: "/history" | "/transcript" | "/moments") => {
    setSearchOpen(false);
    setSearch("");

    navigate({
      to: route,
    });
  };

  const handleSearchKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter" && searchResults.length > 0) {
      openSearchResult(searchResults[0].route);
    }

    if (event.key === "Escape") {
      setSearchOpen(false);
      setSearch("");
    }
  };

  return (
    <header className="sticky top-3 z-30 mx-3 mb-4 glass-strong rounded-3xl px-4 py-2.5 flex items-center gap-3">
      {/* Mobile menu */}
      <button
        className="lg:hidden p-2 rounded-xl hover:bg-muted"
        onClick={onOpenMobile}
      >
        <FiMenu />
      </button>

      {/* Mobile logo */}
      <Link to="/dashboard" className="lg:hidden flex items-center gap-2">
        <div className="h-8 w-8 rounded-xl bg-gradient-primary flex items-center justify-center">
          <FiZap className="text-white text-sm" />
        </div>
      </Link>

      {/* ======================================================
          GLOBAL SEARCH
          ====================================================== */}
      <div className="flex-1 max-w-xl relative">
        <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground text-sm z-10" />

        <input
          id="clipmind-global-search"
          value={search}
          onChange={(event) => {
            setSearch(event.target.value);
            setSearchOpen(true);
          }}
          onFocus={() => setSearchOpen(true)}
          onKeyDown={handleSearchKeyDown}
          className="w-full h-10 bg-muted/60 rounded-2xl pl-10 pr-14 text-sm placeholder:text-muted-foreground focus:bg-card focus:ring-focus outline-none transition"
          placeholder="Search recordings, transcripts and moments…"
          autoComplete="off"
        />

        <kbd className="hidden md:inline absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-muted-foreground px-1.5 py-0.5 rounded border border-border pointer-events-none">
          ⌘K
        </kbd>

        {/* Search results */}
        <AnimatePresence>
          {searchOpen && search.trim() && (
            <motion.div
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              className="absolute left-0 right-0 top-12 glass-strong rounded-2xl p-2 shadow-glow z-50"
            >
              {searchResults.length > 0 ? (
                <>
                  <div className="px-3 py-2 text-[10px] uppercase tracking-widest text-muted-foreground">
                    Search results
                  </div>

                  <div className="space-y-1">
                    {searchResults.map((result) => (
                      <button
                        key={result.id}
                        type="button"
                        onClick={() => openSearchResult(result.route)}
                        className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-muted text-left transition-colors"
                      >
                        <div className="h-9 w-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                          {result.type === "Recording" && <FiVideo />}
                          {result.type === "Transcript" && <FiFileText />}
                          {result.type === "Key Moment" && <FiLayers />}
                        </div>

                        <div className="min-w-0 flex-1">
                          <div className="text-sm font-medium truncate">
                            {result.title}
                          </div>

                          <div className="text-xs text-muted-foreground truncate">
                            {result.type} · {result.description}
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                </>
              ) : (
                <div className="px-4 py-5 text-center">
                  <FiSearch className="mx-auto text-muted-foreground mb-2" />

                  <div className="text-sm font-medium">
                    No results found
                  </div>

                  <div className="text-xs text-muted-foreground mt-1">
                    Try a recording title, transcript phrase or key moment.
                  </div>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Theme */}
      <ThemeToggle />

      {/* ======================================================
          NOTIFICATIONS
          ====================================================== */}
      <div className="relative">
        <button
          className="relative h-10 w-10 rounded-2xl hover:bg-muted flex items-center justify-center"
          onClick={() => {
            setNotifOpen((v) => !v);
            setProfileOpen(false);
            setSearchOpen(false);
          }}
        >
          <FiBell />

          <span className="absolute top-2 right-2 h-2 w-2 rounded-full bg-primary animate-pulse-glow" />
        </button>

        <AnimatePresence>
          {notifOpen && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className="absolute right-0 mt-2 w-80 glass-strong rounded-2xl p-3 shadow-glow"
            >
              <div className="text-sm font-semibold px-2 pb-2">
                Notifications
              </div>

              {["Processing pipeline idle", "No new notifications"].map(
                (n) => (
                  <div
                    key={n}
                    className="p-2.5 rounded-xl hover:bg-muted/60 text-sm text-foreground"
                  >
                    {n}
                  </div>
                )
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ======================================================
          PROFILE MENU
          ====================================================== */}
      <div className="relative">
        <button
          className="flex items-center gap-2 pl-1.5 pr-3 py-1.5 rounded-2xl hover:bg-muted"
          onClick={() => {
            setProfileOpen((v) => !v);
            setNotifOpen(false);
            setSearchOpen(false);
          }}
        >
          <div className="h-8 w-8 rounded-full bg-gradient-primary text-white flex items-center justify-center text-xs font-semibold shadow-glow">
            {initials}
          </div>

          <div className="hidden md:block text-left leading-tight">
            <div className="text-sm font-medium">{user?.name}</div>
            <div className="text-[11px] text-muted-foreground">
              {user?.role}
            </div>
          </div>

          <FiChevronDown className="text-muted-foreground text-sm" />
        </button>

        <AnimatePresence>
          {profileOpen && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className="absolute right-0 mt-2 w-56 glass-strong rounded-2xl p-2 shadow-glow"
            >
              <div className="px-3 py-2 border-b border-border/60">
                <div className="text-sm font-medium">{user?.name}</div>

                <div className="text-xs text-muted-foreground">
                  {user?.email}
                </div>
              </div>

              <Link
                to="/profile"
                onClick={() => setProfileOpen(false)}
                className="flex items-center gap-2 px-3 py-2 rounded-xl hover:bg-muted text-sm"
              >
                <FiUser /> Profile
              </Link>

              <Link
                to="/settings"
                onClick={() => setProfileOpen(false)}
                className="flex items-center gap-2 px-3 py-2 rounded-xl hover:bg-muted text-sm"
              >
                <FiSettings /> Settings
              </Link>

              <button
                onClick={() => {
                  logout();
                  navigate({ to: "/login" });
                }}
                className="w-full flex items-center gap-2 px-3 py-2 rounded-xl hover:bg-muted text-sm text-destructive"
              >
                <FiLogOut /> Sign out
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </header>
  );
}