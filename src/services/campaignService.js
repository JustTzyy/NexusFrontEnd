import apiClient from './api';

export const campaignService = {
    getAll: (params) => apiClient.get('/campaign', { params }),
    getArchived: (params) => apiClient.get('/campaign/archive', { params }),
    getById: (id) => apiClient.get(`/campaign/${id}`),
    create: (data) => apiClient.post('/campaign', data),
    update: (id, data) => apiClient.put(`/campaign/${id}`, data),
    delete: (id) => apiClient.delete(`/campaign/${id}`),
    restore: (id) => apiClient.put(`/campaign/${id}/restore`),
    permanentDelete: (id) => apiClient.delete(`/campaign/${id}/permanent`),
    buildTargets: (id) => apiClient.post(`/campaign/${id}/build-targets`),
    send: (id) => apiClient.post(`/campaign/${id}/send`),
    schedule: (id, data) => apiClient.post(`/campaign/${id}/schedule`, data),
    cancel: (id) => apiClient.post(`/campaign/${id}/cancel`),
    getTargets: (id, params) => apiClient.get(`/campaign/${id}/targets`, { params }),
    getMessages: (id, params) => apiClient.get(`/campaign/${id}/messages`, { params }),
};
