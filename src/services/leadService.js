import apiClient from './api';

export const leadService = {
    getAll: (params) => apiClient.get('/lead', { params }),
    getArchived: (params) => apiClient.get('/lead/archive', { params }),
    getById: (id) => apiClient.get(`/lead/${id}`),
    create: (data) => apiClient.post('/lead', data),
    update: (id, data) => apiClient.put(`/lead/${id}`, data),
    delete: (id) => apiClient.delete(`/lead/${id}`),
    restore: (id) => apiClient.put(`/lead/${id}/restore`),
    permanentDelete: (id) => apiClient.delete(`/lead/${id}/permanent`),
};
