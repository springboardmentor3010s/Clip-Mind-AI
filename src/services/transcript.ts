import { api } from "./api";

export const transcriptService = {
  generate: (videoId: string) =>
    api.post("/generate-transcript", { videoId }),

  get: (id: string) =>
    api.get(`/transcript/${id}`),

  update: (videoId: string, transcript: any[]) =>
    api.put(`/transcript/${videoId}`, { transcript }),
};