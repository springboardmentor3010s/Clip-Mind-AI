import api from './api';


const authService = {
  // Register a new user
  register: async (userData) => {
    const response = await api.post('/api/auth/register', userData);
    const { access_token, token_type } = response.data;

    // Store token and user data (same as login)
    localStorage.setItem('access_token', access_token);
    localStorage.setItem('token_type', token_type);

    return response.data;
  },

  // Login
  login: async (email, password, role_name) => {
    const response = await api.post('/api/auth/login', { email, password, role_name: role_name || undefined });
    const { access_token, token_type } = response.data;

    // Store token and user data
    localStorage.setItem('access_token', access_token);
    localStorage.setItem('token_type', token_type);

    return response.data;
  },

  // Logout
  logout: async () => {
    try {
      await api.post('/api/auth/logout');
    } catch (e) {
      // Ignore errors on logout
    }
    localStorage.removeItem('access_token');
    localStorage.removeItem('token_type');
    localStorage.removeItem('user');
    window.dispatchEvent(new Event('auth-change'));
  },

  // Get current user profile
  getProfile: async () => {
    const response = await api.get('/api/users/me');
    return response.data;
  },

  // Update profile
  updateProfile: async (profileData) => {
    const response = await api.put('/api/users/profile', profileData);
    return response.data;
  },

  // Delete account
  deleteAccount: async () => {
    const response = await api.delete('/api/users/delete');
    return response.data;
  },

  // Get all users (admin)
  getAllUsers: async (skip = 0, limit = 100) => {
    const response = await api.get(`/api/admin/users?skip=${skip}&limit=${limit}`);
    return response.data;
  },

  getAdminDashboard: async () => {
    const response = await api.get('/api/admin/dashboard');
    return response.data;
  },

  getAdminUser: async (userId) => {
    const response = await api.get(`/api/admin/users/${userId}`);
    return response.data;
  },

  updateUserStatus: async (userId, is_active) => {
    const response = await api.patch(`/api/admin/users/${userId}/status`, { is_active });
    return response.data;
  },

  updateUserRole: async (userId, role_name) => {
    const response = await api.patch(`/api/admin/users/${userId}/role`, { role_name });
    return response.data;
  },

  resetUserPassword: async (userId) => {
    const response = await api.patch(`/api/admin/users/${userId}/reset-password`);
    return response.data;
  },

  createAdminUser: async (userData) => {
    const response = await api.post('/api/admin/users', userData);
    return response.data;
  },

  // Update role (admin)
  updateRole: async (roleId, roleData) => {
    const response = await api.put(`/api/admin/roles?role_id=${roleId}`, roleData);
    return response.data;
  },

  // Delete user (admin)
  deleteUser: async (userId) => {
    const response = await api.delete(`/api/admin/users/${userId}`);
    return response.data;
  },

  // Check if user is authenticated
  isAuthenticated: () => {
    const token = localStorage.getItem('access_token');
    return !!token;
  },

  // Get stored user
  getStoredUser: () => {
    const user = localStorage.getItem('user');
    return user ? JSON.parse(user) : null;
  },

  // Store user
  storeUser: (user) => {
    localStorage.setItem('user', JSON.stringify(user));
  },
};

export default authService;
