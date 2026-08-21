import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import type { VideoRecord } from "../utils/mockEngine";
import { videoService } from "../services/video";
import { transcriptService } from "../services/transcript";
import { summaryService } from "../services/summary";
import { momentsService } from "../services/moments";
import { analyticsService } from "../services/analytics";
import { useAuth } from "./AuthContext";

const ACTIVE_ID_PREFIX = "clipmind_active_id";

export type Stage =
  | "idle"
  | "uploading"
  | "transcribing"
  | "summarising"
  | "moments"
  | "analytics"
  | "done";

export const STAGE_LABELS: Record<Stage, string> = {
  idle: "Idle",
  uploading: "Uploading media",
  transcribing: "Generating transcript",
  summarising: "Generating AI summary",
  moments: "Extracting key moments",
  analytics: "Computing analytics",
  done: "Complete",
};

interface WorkspaceValue {
  videos: VideoRecord[];
  activeId: string | null;
  active: VideoRecord | null;
  stage: Stage;
  progress: number;
  mediaUrl: string | null;
  setActive: (id: string) => void;
  processFile: (file: File) => Promise<VideoRecord>;
  removeVideo: (id: string) => void;
  clearAll: () => void;
}

const WorkspaceContext = createContext<WorkspaceValue | undefined>(
  undefined,
);

/** Best-effort extraction of a readable message from a FastAPI/axios error. */
function extractErrorMessage(err: unknown): string {
  if (err && typeof err === "object") {
    const anyErr = err as {
      response?: {
        data?: {
          detail?: string;
        };
      };
      message?: string;
    };

    if (anyErr.response?.data?.detail) {
      return anyErr.response.data.detail;
    }

    if (anyErr.message) {
      return anyErr.message;
    }
  }

  return "Something went wrong while processing this recording.";
}

function getActiveIdKey(userId: string | null): string {
  return userId
    ? `${ACTIVE_ID_PREFIX}:${userId}`
    : ACTIVE_ID_PREFIX;
}

export function WorkspaceProvider({
  children,
}: {
  children: ReactNode;
}) {
  const { user, loading: authLoading } = useAuth();

  const [videos, setVideos] = useState<VideoRecord[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [stage, setStage] = useState<Stage>("idle");
  const [progress, setProgress] = useState(0);
  const [mediaUrl, setMediaUrl] = useState<string | null>(null);

  const persistActiveId = useCallback(
    (id: string | null) => {
      try {
        const key = getActiveIdKey(user?.id ?? null);

        if (id) {
          localStorage.setItem(key, id);
        } else {
          localStorage.removeItem(key);
        }
      } catch {
        /* ignore */
      }
    },
    [user?.id],
  );

  // Reload the video library whenever the authenticated user changes.
  useEffect(() => {
    let cancelled = false;

    // Don't load anything until authentication has finished resolving.
    if (authLoading) {
      return;
    }

    // Logged out -> immediately clear the previous user's workspace.
    if (!user) {
      setVideos([]);
      setActiveId(null);
      setStage("idle");
      setProgress(0);

      if (mediaUrl) {
        URL.revokeObjectURL(mediaUrl);
        setMediaUrl(null);
      }

      return;
    }

    (async () => {
      try {
        // Clear the previous user's in-memory workspace first.
        setVideos([]);
        setActiveId(null);
        setStage("idle");
        setProgress(0);

        if (mediaUrl) {
          URL.revokeObjectURL(mediaUrl);
          setMediaUrl(null);
        }

        const res = await videoService.list();

        if (cancelled) {
          return;
        }

        const list: VideoRecord[] = res.data ?? [];
        setVideos(list);

        let storedActiveId: string | null = null;

        try {
          storedActiveId = localStorage.getItem(
            getActiveIdKey(user.id),
          );
        } catch {
          /* ignore */
        }

        const initialActive =
          list.find((v) => v.id === storedActiveId)?.id ??
          list[0]?.id ??
          null;

        setActiveId(initialActive);
      } catch (err) {
        if (cancelled) {
          return;
        }

        console.error(
          "Failed to load video library from the backend:",
          extractErrorMessage(err),
        );

        setVideos([]);
        setActiveId(null);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [user?.id, authLoading]);

  const processFile = useCallback(
    async (file: File): Promise<VideoRecord> => {
      if (mediaUrl) {
        URL.revokeObjectURL(mediaUrl);
      }

      const localMediaUrl =
        file.type.startsWith("video/") ||
        file.type.startsWith("audio/")
          ? URL.createObjectURL(file)
          : null;

      setMediaUrl(localMediaUrl);

      setStage("uploading");
      setProgress(0);

      let videoId: string | null = null;

      try {
        // 1. Upload the file.
        const uploadRes = await videoService.upload(
          file,
          (pct) => setProgress(pct),
        );

        const uploaded: VideoRecord = uploadRes.data;
        videoId = uploaded.id;

        setVideos((prev) => [
          uploaded,
          ...prev.filter((v) => v.id !== uploaded.id),
        ]);

        setActiveId(uploaded.id);
        persistActiveId(uploaded.id);

        // 2. Transcript.
        setStage("transcribing");
        await transcriptService.generate(uploaded.id);

        // 3. Summary.
        setStage("summarising");
        await summaryService.generate(uploaded.id);

        // 4. Key moments.
        setStage("moments");
        await momentsService.generate(uploaded.id);

        // 5. Analytics.
        setStage("analytics");
        await analyticsService.overview(uploaded.id);

        // Pull back canonical record.
        const finalRes = await videoService.get(uploaded.id);
        const finalRecord: VideoRecord = finalRes.data;

        setVideos((prev) => [
          finalRecord,
          ...prev.filter((v) => v.id !== finalRecord.id),
        ]);

        setActiveId(finalRecord.id);
        persistActiveId(finalRecord.id);

        setStage("done");

        return finalRecord;
      } catch (err) {
        if (videoId) {
          try {
            const res = await videoService.get(videoId);
            const failedRecord: VideoRecord = res.data;

            setVideos((prev) => [
              failedRecord,
              ...prev.filter((v) => v.id !== failedRecord.id),
            ]);
          } catch {
            /* nothing to reconcile */
          }
        }

        setStage("idle");
        setProgress(0);

        throw new Error(extractErrorMessage(err));
      }
    },
    [mediaUrl, persistActiveId],
  );

  const removeVideo = useCallback(
    (id: string) => {
      const prevVideos = videos;
      const prevActiveId = activeId;

      const next = videos.filter((v) => v.id !== id);

      const nextActive =
        activeId === id
          ? next[0]?.id ?? null
          : activeId;

      setVideos(next);
      setActiveId(nextActive);
      persistActiveId(nextActive);

      videoService.remove(id).catch((err) => {
        console.error(
          "Failed to delete recording:",
          extractErrorMessage(err),
        );

        setVideos(prevVideos);
        setActiveId(prevActiveId);
        persistActiveId(prevActiveId);
      });
    },
    [
      videos,
      activeId,
      persistActiveId,
    ],
  );

  const clearAll = useCallback(() => {
    const ids = videos.map((v) => v.id);

    setVideos([]);
    setActiveId(null);
    persistActiveId(null);
    setStage("idle");
    setProgress(0);

    if (mediaUrl) {
      URL.revokeObjectURL(mediaUrl);
      setMediaUrl(null);
    }

    Promise.all(
      ids.map((id) =>
        videoService.remove(id).catch(() => undefined),
      ),
    ).catch(() => undefined);
  }, [
    videos,
    persistActiveId,
    mediaUrl,
  ]);

  const setActive = useCallback(
    (id: string) => {
      setActiveId(id);
      persistActiveId(id);
    },
    [persistActiveId],
  );

  const active = useMemo(
    () =>
      videos.find((v) => v.id === activeId) ?? null,
    [videos, activeId],
  );

  return (
    <WorkspaceContext.Provider
      value={{
        videos,
        activeId,
        active,
        stage,
        progress,
        mediaUrl,
        setActive,
        processFile,
        removeVideo,
        clearAll,
      }}
    >
      {children}
    </WorkspaceContext.Provider>
  );
}

export function useWorkspace() {
  const ctx = useContext(WorkspaceContext);

  if (!ctx) {
    throw new Error(
      "useWorkspace must be used within WorkspaceProvider",
    );
  }

  return ctx;
}