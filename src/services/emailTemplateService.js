import apiClient from './api';

export const emailTemplateService = {
    getAll: (params) => apiClient.get('/email-template', { params }),
    getArchived: (params) => apiClient.get('/email-template/archive', { params }),
    getById: (id) => apiClient.get(`/email-template/${id}`),
    create: (data) => apiClient.post('/email-template', data),
    update: (id, data) => apiClient.put(`/email-template/${id}`, data),
    delete: (id) => apiClient.delete(`/email-template/${id}`),
    restore: (id) => apiClient.put(`/email-template/${id}/restore`),
    permanentDelete: (id) => apiClient.delete(`/email-template/${id}/permanent`),
};
