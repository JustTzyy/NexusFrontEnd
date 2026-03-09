import apiClient from './api';

export const suppressionService = {
    getAll: (params) => apiClient.get('/suppression', { params }),
    getById: (id) => apiClient.get(`/suppression/${id}`),
    create: (data) => apiClient.post('/suppression', data),
    delete: (id) => apiClient.delete(`/suppression/${id}`),
    check: (email) => apiClient.post('/suppression/check', { email }),
};
