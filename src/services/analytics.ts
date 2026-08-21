import { api } from "./api";
import { buildAnalytics, type KeyMoment, type TranscriptSegment } from "../utils/mockEngine";

export const analyticsService = {
  overview: (videoId?: string) => api.get("/analytics", { params: { videoId } }),

  computeMock: (videoId: string, transcript: TranscriptSegment[], moments: KeyMoment[]) =>
    buildAnalytics(videoId, transcript, moments),
};
