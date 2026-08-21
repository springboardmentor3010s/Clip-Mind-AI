import { api } from "./api";
import { buildMoments, type KeyMoment, type TranscriptSegment } from "../utils/mockEngine";

/**
 * Key Moments service.
 * FastAPI contract: POST /generate-key-moments  { videoId } -> { moments: KeyMoment[] }
 */
export const momentsService = {
  generate: (videoId: string) => api.post("/generate-key-moments", { videoId }),
  get: (videoId: string) => api.get(`/key-moments/${videoId}`),

  /** Local mock used until the FastAPI backend is connected. */
  generateMock: async (videoId: string, transcript: TranscriptSegment[]): Promise<KeyMoment[]> => {
    await new Promise((r) => setTimeout(r, 500));
    return buildMoments(videoId, transcript);
  },
};
