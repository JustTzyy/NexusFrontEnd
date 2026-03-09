import apiClient from './api';

export const availableDayService = {
    getAll: (params) => {
        return apiClient.get('/available-day', { params });
    },

    // Lookup all active days (no permission required - reference data)
    lookup: () => {
        return apiClient.get('/available-day/lookup');
    },

    getById: (id) => {
        return apiClient.get(`/available-day/${id}`);
    },

    getArchived: (params) => {
        return apiClient.get('/available-day/archive', { params });
    },

    create: (data) => {
        return apiClient.post('/available-day', data);
    },

    update: (id, data) => {
        return apiClient.put(`/available-day/${id}`, data);
    },

    delete: (id) => {
        return apiClient.delete(`/available-day/${id}`);
    },

    restore: (id) => {
        return apiClient.put(`/available-day/${id}/restore`);
    },

    permanentDelete: (id) => {
        return apiClient.delete(`/available-day/${id}/permanent`);
    },
};
