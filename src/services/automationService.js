import apiClient from './api';

export const automationService = {
    getAll: (params) => apiClient.get('/automation-rule', { params }),
    getArchived: (params) => apiClient.get('/automation-rule/archive', { params }),
    getById: (id) => apiClient.get(`/automation-rule/${id}`),
    create: (data) => apiClient.post('/automation-rule', data),
    update: (id, data) => apiClient.put(`/automation-rule/${id}`, data),
    delete: (id) => apiClient.delete(`/automation-rule/${id}`),
    restore: (id) => apiClient.put(`/automation-rule/${id}/restore`),
    permanentDelete: (id) => apiClient.delete(`/automation-rule/${id}/permanent`),
    activate: (id) => apiClient.put(`/automation-rule/${id}/activate`),
    deactivate: (id) => apiClient.put(`/automation-rule/${id}/deactivate`),
    addAction: (id, data) => apiClient.post(`/automation-rule/${id}/actions`, data),
    updateAction: (id, actionId, data) => apiClient.put(`/automation-rule/${id}/actions/${actionId}`, data),
    deleteAction: (id, actionId) => apiClient.delete(`/automation-rule/${id}/actions/${actionId}`),
};
