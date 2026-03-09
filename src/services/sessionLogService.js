import apiClient from './api';

export const sessionLogService = {
    getByRequest: (tutoringRequestId) =>
        apiClient.get(`/session-log/by-request/${tutoringRequestId}`),

    getById: (id) =>
        apiClient.get(`/session-log/${id}`),

    getAll: (params) =>
        apiClient.get('/session-log', { params }),

    create: (data) =>
        apiClient.post('/session-log', data),

    update: (id, data) =>
        apiClient.put(`/session-log/${id}`, data),

    delete: (id) =>
        apiClient.delete(`/session-log/${id}`),
};
