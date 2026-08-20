import api from './api';


// Learning / watch history service.
const historyService = {
  // Record or update a watch-history entry for a video.
  record: async (videoId, { watch_duration = 0, completion_rate = 0 } = {}) => {
    const response = await api.put(`/api/watch-history/videos/${videoId}`, {
      watch_duration,
      completion_rate,
    });
    return response.data;
  },

  // Get the current user's watch history (most recently watched first).
  getHistory: async () => {
    const response = await api.get('/api/watch-history/');
    return response.data;
  },

  // Get the content creator's watch history showing viewer engagement
  // on their uploaded videos.
  getCreatorHistory: async () => {
    const response = await api.get('/api/watch-history/creator/');
    return response.data;
  },

  // Remove a single history entry.
  remove: async (videoId) => {
    const response = await api.delete(`/api/watch-history/videos/${videoId}`);
    return response.data;
  },

  // Clear the entire watch history.
  clear: async () => {
    const response = await api.delete('/api/watch-history/');
    return response.data;
  },
};

export default historyService;