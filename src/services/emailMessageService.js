import apiClient from './api';

export const emailMessageService = {
    getAll: (params) => apiClient.get('/email-message', { params }),
    getById: (id) => apiClient.get(`/email-message/${id}`),
    getEvents: (id) => apiClient.get(`/email-message/${id}/events`),
};
