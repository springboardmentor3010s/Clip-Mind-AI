import { api } from "./api";
import type { VideoRecord } from "../utils/mockEngine";

export interface HistoryFilters {
  query?: string;
  status?: "All" | VideoRecord["status"];
  range?: "all" | "24h" | "7d" | "30d";
  sort?: "newest" | "oldest" | "longest" | "title";
}

/**
 * History service.
 * FastAPI contract: GET /history?query=&status=&range=&sort=
 */
export const historyService = {
  list: (filters: HistoryFilters = {}) => api.get("/history", { params: filters }),
  remove: (videoId: string) => api.delete(`/history/${videoId}`),

  /** Local mock filtering, used until the FastAPI backend is connected. */
  filter: (records: VideoRecord[], f: HistoryFilters = {}): VideoRecord[] => {
    const now = Date.now();
    const windows: Record<string, number> = { "24h": 864e5, "7d": 6048e5, "30d": 2592e6 };
    let out = [...records];

    if (f.query?.trim()) {
      const q = f.query.trim().toLowerCase();
      out = out.filter(
        (r) =>
          r.title.toLowerCase().includes(q) ||
          r.fileName.toLowerCase().includes(q) ||
          r.summary?.topics.some((t) => t.toLowerCase().includes(q)) ||
          r.transcript.some((s) => s.text.toLowerCase().includes(q)),
      );
    }
    if (f.status && f.status !== "All") out = out.filter((r) => r.status === f.status);
    if (f.range && f.range !== "all") {
      const span = windows[f.range];
      out = out.filter((r) => now - new Date(r.createdAt).getTime() <= span);
    }

    switch (f.sort) {
      case "oldest":
        out.sort((a, b) => +new Date(a.createdAt) - +new Date(b.createdAt));
        break;
      case "longest":
        out.sort((a, b) => b.durationSeconds - a.durationSeconds);
        break;
      case "title":
        out.sort((a, b) => a.title.localeCompare(b.title));
        break;
      default:
        out.sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt));
    }
    return out;
  },
};
