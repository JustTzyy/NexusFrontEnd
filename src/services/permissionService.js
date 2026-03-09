import apiClient from './api';

export const permissionService = {
  getAll: (params) => apiClient.get('/permission', { params }),
  getById: (id) => apiClient.get(`/permission/${id}`),
  getByModule: (module) => apiClient.get(`/permission/module/${module}`),
  getArchived: (params) => apiClient.get('/permission/archive', { params }),
  create: (permissionData) => apiClient.post('/permission', permissionData),
  update: (id, permissionData) => apiClient.put(`/permission/${id}`, permissionData),
  delete: (id) => apiClient.delete(`/permission/${id}`),
  restore: (id) => apiClient.put(`/permission/${id}/restore`),
  permanentDelete: (id) => apiClient.delete(`/permission/${id}/permanent`),
};
