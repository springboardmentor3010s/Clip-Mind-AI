/* eslint-disable react-hooks/set-state-in-effect, react-hooks/exhaustive-deps, react-refresh/only-export-components */
import { createContext, useContext, useState, useEffect, useCallback, useMemo, useRef } from "react";
import api from "../lib/api";
import { useAuth } from "./AuthContext";

const VideoContext = createContext(null);

export function VideoProvider({ children }) {
  const { user } = useAuth();

  const [videos, setVideos] = useState([]);
  const [activeVideoId, setActiveVideoId] = useState(() => localStorage.getItem("active_video_id") || "");
  const [activeVideo, setActiveVideo] = useState(null);
  const [loading, setLoading] = useState(false);

  // ── Display language / translation state ──────────────────────────
  const [displayLanguage, setDisplayLanguageState] = useState(() => localStorage.getItem("display_language") || "Original");
  const [translation, setTranslation] = useState(null);
  const [translating, setTranslating] = useState(false);
  const [translationError, setTranslationError] = useState("");
  const translationsRef = useRef({}); // { `${videoId}:${lang}`: payload }

  const setDisplayLanguage = useCallback((lang) => {
    setDisplayLanguageState(lang);
    if (lang && lang !== "Original") localStorage.setItem("display_language", lang);
    else localStorage.removeItem("display_language");
  }, []);

  // ── Fetch user's videos ───────────────────────────────────────────
  const fetchVideos = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get("/videos/");
      if (res.data.success) setVideos(res.data.data);
    } catch (err) {
      console.error("Failed to fetch videos:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchVideoDetails = useCallback(async (id) => {
    if (!id) return null;
    try {
      const res = await api.get(`/videos/${id}`);
      if (res.data.success) return res.data.data;
    } catch (err) {
      console.error(`Failed to fetch video details for ${id}:`, err);
    }
    return null;
  }, []);

  // ── (FIX #5) Load videos when the authenticated user is known ──────
  // The provider mounts before login, so fetching must react to `user`
  // rather than run once on mount (which would 401 and stay empty).
  useEffect(() => {
    if (user) {
      fetchVideos();
    } else {
      setVideos([]);
      setActiveVideo(null);
    }
  }, [user, fetchVideos]);

  // ── Sync + poll active video details ──────────────────────────────
  // While a video is processing we poll the tiny /progress endpoint rather
  // than refetching the whole video (transcript + summary + key moments) every
  // 3 seconds. The full record is fetched once, when processing finishes.
  useEffect(() => {
    if (!activeVideoId || !user) {
      setActiveVideo(null);
      return;
    }
    let isMounted = true;

    const load = async () => {
      const details = await fetchVideoDetails(activeVideoId);
      if (isMounted && details) setActiveVideo(details);
    };
    load();

    const interval = setInterval(async () => {
      if (!activeVideo || !["pending", "processing"].includes(activeVideo.status)) return;
      try {
        const res = await api.get(`/videos/${activeVideoId}/progress`);
        if (!isMounted || !res.data.success) return;
        const progress = res.data.data;

        if (progress.status === "completed" || progress.status === "failed") {
          // Terminal state — pull the full record once, then stop polling.
          const details = await fetchVideoDetails(activeVideoId);
          if (isMounted && details) setActiveVideo(details);
          fetchVideos();
        } else {
          setActiveVideo((prev) => (prev ? { ...prev, ...progress } : prev));
        }
      } catch (err) {
        console.error("Progress poll failed:", err);
      }
    }, 3000);

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [activeVideoId, user, fetchVideoDetails, fetchVideos, activeVideo?.status]);

  // ── Fetch translation when a non-original language is selected ─────
  useEffect(() => {
    setTranslationError("");
    if (displayLanguage === "Original" || !activeVideo || activeVideo.status !== "completed") {
      setTranslation(null);
      return;
    }
    const cacheKey = `${activeVideoId}:${displayLanguage}`;
    if (translationsRef.current[cacheKey]) {
      setTranslation(translationsRef.current[cacheKey]);
      return;
    }
    let cancelled = false;
    setTranslating(true);
    setTranslation(null);
    api
      .post(`/videos/${activeVideoId}/translate`, { language: displayLanguage })
      .then((res) => {
        if (cancelled) return;
        if (res.data.success) {
          translationsRef.current[cacheKey] = res.data.data;
          setTranslation(res.data.data);
        }
      })
      .catch((err) => {
        if (!cancelled) setTranslationError(err.response?.data?.message || "Translation failed. Please try again.");
      })
      .finally(() => {
        if (!cancelled) setTranslating(false);
      });
    return () => { cancelled = true; };
  }, [activeVideoId, displayLanguage, activeVideo?.status]);

  // ── Derived display data (original or translated) ─────────────────
  const display = useMemo(() => {
    if (!activeVideo) return { transcript: null, summary: null, key_moments: [] };
    if (displayLanguage !== "Original" && translation) {
      return {
        transcript: { ...(activeVideo.transcript || {}), segments: translation.transcript?.segments || [] },
        summary: { ...(activeVideo.summary || {}), content: translation.summary },
        key_moments: translation.key_moments || [],
      };
    }
    return {
      transcript: activeVideo.transcript,
      summary: activeVideo.summary,
      key_moments: activeVideo.key_moments || [],
    };
  }, [activeVideo, displayLanguage, translation]);

  const changeActiveVideo = useCallback((id) => {
    setActiveVideoId(id);
    if (id) localStorage.setItem("active_video_id", id);
    else {
      localStorage.removeItem("active_video_id");
      setActiveVideo(null);
    }
  }, []);

  const uploadVideoFile = useCallback(async (file, language = "") => {
    const formData = new FormData();
    formData.append("file", file);
    if (language) formData.append("language", language);
    const res = await api.post("/videos/upload", formData, { headers: { "Content-Type": "multipart/form-data" } });
    if (res.data.success) {
      const newVideo = res.data.data;
      setVideos((prev) => [newVideo, ...prev]);
      changeActiveVideo(newVideo.id);
      return newVideo;
    }
    throw new Error(res.data.message || "Upload failed.");
  }, [changeActiveVideo]);

  const submitYoutubeUrl = useCallback(async (url, language = "") => {
    const res = await api.post("/videos/youtube", { url, language });
    if (res.data.success) {
      const newVideo = res.data.data;
      setVideos((prev) => [newVideo, ...prev]);
      changeActiveVideo(newVideo.id);
      return newVideo;
    }
    throw new Error(res.data.message || "Submission failed.");
  }, [changeActiveVideo]);

  // ── Sharing ───────────────────────────────────────────────────────
  const shareVideo = useCallback(async (id, { isPublic = true, note = "", emails } = {}) => {
    const body = { is_public: isPublic, note };
    if (emails?.length) body.emails = emails;
    const res = await api.post(`/videos/${id}/share`, body);
    if (res.data.success) {
      setActiveVideo((prev) =>
        prev && prev.id === id ? { ...prev, share: res.data.data } : prev
      );
      return res.data.data;
    }
    throw new Error(res.data.message || "Sharing failed.");
  }, []);

  const unshareVideo = useCallback(async (id) => {
    const res = await api.delete(`/videos/${id}/share`);
    if (res.data.success) {
      setActiveVideo((prev) => (prev && prev.id === id ? { ...prev, share: null } : prev));
      return true;
    }
    throw new Error(res.data.message || "Failed to revoke the share.");
  }, []);

  // ── Bookmarks ─────────────────────────────────────────────────────
  const addBookmark = useCallback(async (videoId, { note = "", timestamp } = {}) => {
    const body = { video_id: videoId, note };
    if (timestamp != null) body.timestamp_seconds = timestamp;
    const res = await api.post("/videos/bookmarks", body);
    if (res.data.success) {
      setActiveVideo((prev) =>
        prev && prev.id === videoId ? { ...prev, is_bookmarked: true } : prev
      );
      return res.data.data;
    }
    throw new Error(res.data.message || "Failed to bookmark.");
  }, []);

  // ── Engagement tracking ───────────────────────────────────────────
  // Fire-and-forget: a failed analytics ping must never disrupt playback.
  const recordView = useCallback(async (videoId, positionSeconds = 0) => {
    try {
      await api.post(`/videos/${videoId}/view`, { position_seconds: positionSeconds });
    } catch (err) {
      console.debug("View tracking failed (non-critical):", err?.message);
    }
  }, []);

  // ── Transcript editing ────────────────────────────────────────────
  const updateTranscript = useCallback(async (videoId, { content, segments }) => {
    const body = {};
    if (content !== undefined) body.content = content;
    if (segments !== undefined) body.segments = segments;
    const res = await api.patch(`/videos/${videoId}/transcript`, body);
    if (res.data.success) {
      setActiveVideo((prev) =>
        prev && prev.id === videoId ? { ...prev, transcript: res.data.data } : prev
      );
      return res.data.data;
    }
    throw new Error(res.data.message || "Failed to update the transcript.");
  }, []);

  const deleteVideo = useCallback(async (id) => {
    const res = await api.delete(`/videos/${id}`);
    if (res.data.success) {
      setVideos((prev) => prev.filter((v) => v.id !== id));
      // drop any cached translations for this video
      Object.keys(translationsRef.current).forEach((k) => { if (k.startsWith(`${id}:`)) delete translationsRef.current[k]; });
      if (activeVideoId === id) changeActiveVideo("");
      return true;
    }
    throw new Error(res.data.message || "Deletion failed.");
  }, [activeVideoId, changeActiveVideo]);

  return (
    <VideoContext.Provider
      value={{
        videos,
        activeVideoId,
        activeVideo,
        loading,
        fetchVideos,
        changeActiveVideo,
        uploadVideoFile,
        submitYoutubeUrl,
        deleteVideo,
        // sharing / engagement / editing
        shareVideo,
        unshareVideo,
        addBookmark,
        recordView,
        updateTranscript,
        // language / translation
        displayLanguage,
        setDisplayLanguage,
        translating,
        translationError,
        display,
      }}
    >
      {children}
    </VideoContext.Provider>
  );
}

export function useVideo() {
  const context = useContext(VideoContext);
  if (!context) throw new Error("useVideo must be used inside a <VideoProvider>.");
  return context;
}
