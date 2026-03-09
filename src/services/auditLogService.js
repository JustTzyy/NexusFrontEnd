import apiClient from './api';

export const auditLogService = {
  getAll: (params) => apiClient.get('/audit-log', { params }),
  getById: (id) => apiClient.get(`/audit-log/${id}`),
};
