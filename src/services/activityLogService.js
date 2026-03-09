import apiClient from './api';

export const activityLogService = {
    getAll: (params) => apiClient.get('/activity-log', { params }),
    getById: (id) => apiClient.get(`/activity-log/${id}`),
};
