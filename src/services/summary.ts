import { api } from "./api";
export const summaryService = {
  generate: (videoId: string) => api.post("/generate-summary", { videoId }),
  get: (id: string) => api.get(`/summary/${id}`),
};
