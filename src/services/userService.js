import apiClient from './api';

export const userService = {
  // Get current user's own profile (no permission required)
  getMe: () => {
    return apiClient.get('/user/me');
  },

  // Update current user's own profile (no permission required)
  updateMe: (userData) => {
    return apiClient.put('/user/me', userData);
  },

  // Get all active users (paginated)
  getAll: (params) => {
    return apiClient.get('/user', { params });
  },

  // Get user by ID
  getById: (id) => {
    return apiClient.get(`/user/${id}`);
  },

  // Get archived users
  getArchived: (params) => {
    return apiClient.get('/user/archive', { params });
  },

  // Get user's roles
  getUserRoles: (id) => {
    return apiClient.get(`/user/${id}/roles`);
  },

  // Create user
  create: (userData) => {
    return apiClient.post('/user', userData);
  },

  // Update user
  update: (id, userData) => {
    return apiClient.put(`/user/${id}`, userData);
  },

  // Soft delete (move to archive)
  delete: (id) => {
    return apiClient.delete(`/user/${id}`);
  },

  // Restore from archive
  restore: (id) => {
    return apiClient.put(`/user/${id}/restore`);
  },

  // Permanent delete (hard delete)
  permanentDelete: (id) => {
    return apiClient.delete(`/user/${id}/permanent`);
  },

  // Get users by role name
  getByRole: (roleName) => {
    return apiClient.get(`/user/by-role/${encodeURIComponent(roleName)}`);
  },

  // Assign roles to user
  assignRoles: (id, roleIds) => {
    return apiClient.post(`/user/${id}/roles`, roleIds);
  },

  // Client Log: paginated list of Lead + Customer users
  getClients: (params) => {
    return apiClient.get('/user/clients', { params });
  },

  // Client Log: full detail for a specific Lead/Customer user
  getClientDetail: (id) => {
    return apiClient.get(`/user/clients/${id}`);
  },

  // Notify the backend that the current user has completed their profile setup.
  // Triggers the ProfileCompleted automation email.
  completeProfile: () => {
    return apiClient.post('/user/complete-profile');
  },
};
