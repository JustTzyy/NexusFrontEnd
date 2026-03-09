import apiClient from './api';

export const operationLogService = {
  getAll: (params) => apiClient.get('/operation-log', { params }),
  getById: (id) => apiClient.get(`/operation-log/${id}`),
};
