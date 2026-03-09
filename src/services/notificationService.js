import apiClient from './api';

export const notificationService = {
    getAll: (params) => apiClient.get('/notification', { params }),
    getById: (id) => apiClient.get(`/notification/${id}`),
    getUnreadCount: () => apiClient.get('/notification/unread-count'),
    create: (data) => apiClient.post('/notification', data),
    markAsRead: (id) => apiClient.put(`/notification/${id}/read`),
    markAllAsRead: () => apiClient.put('/notification/read-all'),
    delete: (id) => apiClient.delete(`/notification/${id}`),
};
