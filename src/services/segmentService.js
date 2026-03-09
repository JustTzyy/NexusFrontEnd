import apiClient from './api';

export const segmentService = {
    getAll: (params) => apiClient.get('/segment', { params }),
    getArchived: (params) => apiClient.get('/segment/archive', { params }),
    getById: (id) => apiClient.get(`/segment/${id}`),
    preview: (id) => apiClient.get(`/segment/${id}/preview`),
    getFieldValues: (field) => apiClient.get('/segment/field-values', { params: { field } }),
    create: (data) => apiClient.post('/segment', data),
    update: (id, data) => apiClient.put(`/segment/${id}`, data),
    delete: (id) => apiClient.delete(`/segment/${id}`),
    restore: (id) => apiClient.put(`/segment/${id}/restore`),
    permanentDelete: (id) => apiClient.delete(`/segment/${id}/permanent`),
};
