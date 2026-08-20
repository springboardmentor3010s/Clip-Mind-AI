import api from './api';


const downloadBlob = async (url, filename, method = 'get', data = null, params = {}) => {
  const response = await api.request({
    url,
    method,
    params,
    data,
    responseType: 'blob',
  });
  const blob = new Blob([response.data]);
  const link = document.createElement('a');
  const downloadUrl = window.URL.createObjectURL(blob);
  link.href = downloadUrl;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(downloadUrl);
};

const adminService = {
  // Dashboard
  getDashboard: async () => (await api.get('/api/admin/dashboard')).data,

  // Users & roles (admin console)
  getAllUsers: async (skip = 0, limit = 100) =>
    (await api.get(`/api/admin/users?skip=${skip}&limit=${limit}`)).data,
  getUser: async (userId) =>
    (await api.get(`/api/admin/users/${userId}`)).data,
  createUser: async (userData) =>
    (await api.post('/api/admin/users', userData)).data,
  updateUser: async (userId, data) =>
    (await api.put(`/api/admin/users/${userId}`, data)).data,
  updateUserStatus: async (userId, is_active) =>
    (await api.patch(`/api/admin/users/${userId}/status`, { is_active })).data,
  updateUserRole: async (userId, role_name) =>
    (await api.patch(`/api/admin/users/${userId}/role`, { role_name })).data,
  resetUserPassword: async (userId) =>
    (await api.patch(`/api/admin/users/${userId}/reset-password`)).data,
  deleteUser: async (userId) =>
    (await api.delete(`/api/admin/users/${userId}`)).data,
  getAllRoles: async (skip = 0, limit = 100) =>
    (await api.get(`/api/admin/roles?skip=${skip}&limit=${limit}`)).data,
  updateRole: async (roleId, roleData) =>
    (await api.put(`/api/admin/roles?role_id=${roleId}`, roleData)).data,

  // Platform activity
  getActivity: async (params = {}) =>
    (await api.get('/api/admin/activity', { params })).data,
  getActivityStats: async () =>
    (await api.get('/api/admin/activity/stats')).data,

  // Audit logs
  getAuditLogs: async (params = {}) =>
    (await api.get('/api/admin/audit-logs', { params })).data,

  // Uploaded content
  getAllContent: async (params = {}) =>
    (await api.get('/api/admin/content', { params })).data,
  deleteContent: async (videoId) =>
    (await api.delete(`/api/admin/content/${videoId}`)).data,

  // AI processing jobs
  getJobs: async (params = {}) =>
    (await api.get('/api/admin/jobs', { params })).data,
  getJobStats: async () =>
    (await api.get('/api/admin/jobs/stats')).data,

  // Storage & resource utilization
  getStorage: async () => (await api.get('/api/admin/storage')).data,

  // System analytics
  getSystemAnalytics: async () =>
    (await api.get('/api/admin/analytics')).data,

  // Platform settings
  getPlatformSettings: async () =>
    (await api.get('/api/admin/settings')).data,
  updatePlatformSettings: async (settings) =>
    (await api.put('/api/admin/settings', { settings })).data,

  // Reports (CSV)
  downloadUsersReport: async () =>
    downloadBlob('/api/admin/reports/users', 'users_report.csv', 'post'),
  downloadContentReport: async () =>
    downloadBlob('/api/admin/reports/content', 'content_report.csv', 'post'),
  downloadActivityReport: async (limit = 1000) =>
    downloadBlob('/api/admin/reports/activity', 'activity_report.csv', 'post', null, { limit }),
};

export default adminService;
