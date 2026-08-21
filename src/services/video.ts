import { api } from "./api";

export const videoService = {
  upload: (file: File, onProgress?: (pct: number) => void) => {
    const form = new FormData();
    form.append("file", file);

    return api.post("/upload", form, {
      headers: { "Content-Type": "multipart/form-data" },
      onUploadProgress: (e) => {
        if (e.total && onProgress) {
          onProgress(Math.round((e.loaded / e.total) * 100));
        }
      },
    });
  },

  list: () => api.get("/videos"),

  get: (id: string) => api.get(`/videos/${id}`),

  getMedia: (id: string) =>
    api.get(`/videos/${id}/media`, {
      responseType: "blob",
    }),

  remove: (id: string) => api.delete(`/videos/${id}`),
};