import api from './api';


const videoService = {
  // Upload a video
  uploadVideo: async (title, description, file, onProgress) => {
    const formData = new FormData();
    formData.append('title', title);
    if (description) formData.append('description', description);
    formData.append('file', file);

    const response = await api.post('/api/videos/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      onUploadProgress: onProgress
        ? (progressEvent) => {
            const percent = Math.round(
              (progressEvent.loaded * 100) / progressEvent.total
            );
            onProgress(percent);
          }
        : undefined,
    });
    return response.data;
  },

  // Get all videos for current user
  getVideos: async (skip = 0, limit = 100) => {
    const response = await api.get('/api/videos', { params: { skip, limit } });
    return response.data;
  },

  // Get dashboard stat counters (aggregate server-side query)
  getDashboardStats: async () => {
    const response = await api.get('/api/videos/dashboard/stats');
    return response.data;
  },

  // Get the shared library of published videos (any user's uploads)
  getBrowseVideos: async () => {
    const response = await api.get('/api/videos/browse');
    return response.data;
  },

  // Get a specific video
  getVideo: async (videoId) => {
    const response = await api.get(`/api/videos/${videoId}`);
    return response.data;
  },

  // Update video metadata
  updateVideo: async (videoId, data) => {
    const response = await api.put(`/api/videos/${videoId}`, data);
    return response.data;
  },

  // Delete a video
  deleteVideo: async (videoId) => {
    const response = await api.delete(`/api/videos/${videoId}`);
    return response.data;
  },

  // === Transcript ===
  getTranscript: async (videoId) => {
    const response = await api.get(`/api/videos/${videoId}/transcript`);
    return response.data;
  },

  generateTranscript: async (videoId) => {
    const response = await api.post(`/api/videos/${videoId}/transcript/generate`);
    return response.data;
  },

  updateTranscript: async (videoId, data) => {
    const response = await api.put(`/api/videos/${videoId}/transcript`, data);
    return response.data;
  },

  // Validate transcript accuracy & quality (returns a quality report)
  validateTranscript: async (videoId) => {
    const response = await api.get(`/api/videos/${videoId}/transcript/validate`);
    return response.data;
  },

  // === Summary ===
  getSummary: async (videoId) => {
    const response = await api.get(`/api/videos/${videoId}/summary/`);
    return response.data;
  },

  getSummaryEvaluation: async (videoId) => {
    const response = await api.get(
      `/api/videos/${videoId}/summary/evaluation`
    );
    return response.data;
  },

  // Validate summary accuracy & quality (returns a quality report)
  validateSummary: async (videoId) => {
    const response = await api.get(`/api/videos/${videoId}/summary/validate`);
    return response.data;
  },

  generateSummary: async (videoId) => {
    const response = await api.post(`/api/videos/${videoId}/summary/generate`);
    return response.data;
  },

  generateBulletPoints: async (videoId) => {
    const response = await api.post(`/api/videos/${videoId}/summary/bullet-points`);
    return response.data;
  },

  updateSummary: async (videoId, data) => {
    const response = await api.put(`/api/videos/${videoId}/summary/`, data);
    return response.data;
  },

  // === Key Moments ===
  getKeyMoments: async (videoId) => {
    const response = await api.get(`/api/videos/${videoId}/key-moments/`);
    return response.data;
  },

  createKeyMoment: async (videoId, data) => {
    const response = await api.post(`/api/videos/${videoId}/key-moments`, data);
    return response.data;
  },

  updateKeyMoment: async (videoId, momentId, data) => {
    const response = await api.put(`/api/videos/${videoId}/key-moments/${momentId}`, data);
    return response.data;
  },

  deleteKeyMoment: async (videoId, momentId) => {
    const response = await api.delete(`/api/videos/${videoId}/key-moments/${momentId}`);
    return response.data;
  },

  detectKeyMoments: async (videoId) => {
    const response = await api.post(`/api/videos/${videoId}/key-moments/detect`);
    return response.data;
  },

  // === Analytics ===
  getVideoAnalytics: async (videoId) => {
    const response = await api.get(`/api/videos/${videoId}/analytics`);
    return response.data;
  },

  recordView: async (videoId, watchDuration = 0, isUnique = true) => {
    const response = await api.put(`/api/videos/${videoId}/analytics/view`, null, {
      params: { watch_duration: watchDuration, is_unique: isUnique },
    });
    return response.data;
  },

  updateCompletion: async (videoId, watchedDuration) => {
    const response = await api.put(`/api/videos/${videoId}/analytics/completion`, null, {
      params: { watched_duration: watchedDuration },
    });
    return response.data;
  },

  getAnalyticsSummary: async () => {
    const response = await api.get('/api/analytics/summary');
    return response.data;
  },

  // === Keywords ===
  getKeywords: async (videoId, transcript, topN = 20) => {
    const response = await api.post(`/api/videos/${videoId}/keywords/extract`, {
      transcript,
      top_n: topN,
    });
    return response.data;
  },

  // === Bookmarks ===
  // Backend router is mounted at /bookmarks/ (not /api/videos/:id/bookmarks)
  // These delegate to the dedicated bookmarkService for the correct endpoints.

  getBookmarks: async (videoId) => {
    // Return all bookmarks for the current user, optionally filtered by videoId
    const response = await api.get('/bookmarks/');
    const all = response.data;
    if (videoId !== undefined && videoId !== null) {
      return Array.isArray(all)
        ? all.filter((b) => b.video && b.video.id === Number(videoId))
        : [];
    }
    return all;
  },

  createBookmark: async (videoId) => {
    const response = await api.post('/bookmarks/', { video_id: videoId });
    return response.data;
  },

  deleteBookmark: async (videoId) => {
    const response = await api.delete(`/bookmarks/${videoId}`);
    return response.data;
  },

  checkBookmark: async (videoId) => {
    const response = await api.get(`/bookmarks/check/${videoId}`);
    return response.data.bookmarked;
  },

  getUserBookmarks: async () => {
    const response = await api.get('/bookmarks/');
    return response.data;
  },
};

export default videoService;