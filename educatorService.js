import api from './api';


// Educator features: learning materials, summary shares, classroom analytics,
// and student-engagement metrics.
const educatorService = {
  // === Learning materials ===
  getLearningMaterials: async (videoId) => {
    const response = await api.get(`/api/videos/${videoId}/learning-materials`);
    return response.data;
  },

  generateLearningMaterial: async (videoId, title = 'Study Notes') => {
    const response = await api.post(
      `/api/videos/${videoId}/learning-materials/generate`,
      null,
      { params: { title } }
    );
    return response.data;
  },

  createLearningMaterial: async (videoId, data) => {
    const response = await api.post(`/api/videos/${videoId}/learning-materials`, data);
    return response.data;
  },

  updateLearningMaterial: async (videoId, materialId, data) => {
    const response = await api.put(
      `/api/videos/${videoId}/learning-materials/${materialId}`,
      data
    );
    return response.data;
  },

  deleteLearningMaterial: async (videoId, materialId) => {
    const response = await api.delete(
      `/api/videos/${videoId}/learning-materials/${materialId}`
    );
    return response.data;
  },

  // === Summary sharing ===
  getShares: async (videoId) => {
    const response = await api.get(`/api/videos/${videoId}/shares`);
    return response.data;
  },

  createShare: async (videoId) => {
    const response = await api.post(`/api/videos/${videoId}/shares`);
    return response.data;
  },

  revokeShare: async (videoId, shareId) => {
    const response = await api.delete(`/api/videos/${videoId}/shares/${shareId}`);
    return response.data;
  },

  getSharedSummary: async (token) => {
    const response = await api.get(`/api/shares/${token}`);
    return response.data;
  },

  // === Learning material sharing ===
  getLearningMaterialShares: async (videoId, materialId) => {
    const response = await api.get(
      `/api/videos/${videoId}/learning-materials/${materialId}/shares`
    );
    return response.data;
  },

  createLearningMaterialShare: async (videoId, materialId) => {
    const response = await api.post(
      `/api/videos/${videoId}/learning-materials/${materialId}/shares`
    );
    return response.data;
  },

  revokeLearningMaterialShare: async (videoId, materialId, shareId) => {
    const response = await api.delete(
      `/api/videos/${videoId}/learning-materials/${materialId}/shares/${shareId}`
    );
    return response.data;
  },

  getSharedLearningMaterial: async (token) => {
    const response = await api.get(`/api/learning-material-shares/${token}`);
    return response.data;
  },

  // === Classroom analytics & engagement ===
  getEducatorAnalytics: async () => {
    const response = await api.get('/api/educator/analytics');
    return response.data;
  },

  getStudentEngagement: async () => {
    const response = await api.get('/api/educator/analytics/engagement');
    return response.data;
  },

  exportEngagementCSV: async () => {
    const response = await api.get('/api/educator/analytics/engagement/export', {
      responseType: 'blob',
    });
    const blob = new Blob([response.data], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'student_engagement.csv';
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  },
};

export default educatorService;