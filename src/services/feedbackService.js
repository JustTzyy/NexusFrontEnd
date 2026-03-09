import apiClient from './api';

export const feedbackService = {
    getAll: (params) => apiClient.get('/feedback', { params }),
    getById: (id) => apiClient.get(`/feedback/${id}`),
    create: (data) => apiClient.post('/feedback', data),
    update: (id, data) => apiClient.put(`/feedback/${id}`, data),
    delete: (id) => apiClient.delete(`/feedback/${id}`),
    canSubmit: (sessionLogId) => apiClient.get(`/feedback/can-submit/${sessionLogId}`),
};
