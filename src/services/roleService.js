import apiClient from './api';

export const roleService = {
  getAll: (params) => apiClient.get('/role', { params }),
  getById: (id) => apiClient.get(`/role/${id}`),
  getArchived: (params) => apiClient.get('/role/archive', { params }),
  getRolePermissions: (id) => apiClient.get(`/role/${id}/permissions`),
  create: (roleData) => apiClient.post('/role', roleData),
  update: (id, roleData) => apiClient.put(`/role/${id}`, roleData),
  delete: (id) => apiClient.delete(`/role/${id}`),
  restore: (id) => apiClient.put(`/role/${id}/restore`),
  permanentDelete: (id) => apiClient.delete(`/role/${id}/permanent`),
  assignPermissions: (id, permissionIds) =>
    apiClient.post(`/role/${id}/permissions`, { permissionIds }),
};
