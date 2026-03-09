import apiClient from './api';

export const authLogService = {
    getAll: (params) => apiClient.get('/auth-log', { params }),
    getById: (id) => apiClient.get(`/auth-log/${id}`),
};
