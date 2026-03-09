import apiClient from './api';

export const availableTimeSlotService = {
    getAll: (params) => {
        return apiClient.get('/available-time-slot', { params });
    },

    // Lookup all active time slots (no permission required - reference data)
    lookup: () => {
        return apiClient.get('/available-time-slot/lookup');
    },

    getById: (id) => {
        return apiClient.get(`/available-time-slot/${id}`);
    },

    getArchived: (params) => {
        return apiClient.get('/available-time-slot/archive', { params });
    },

    create: (data) => {
        return apiClient.post('/available-time-slot', data);
    },

    update: (id, data) => {
        return apiClient.put(`/available-time-slot/${id}`, data);
    },

    delete: (id) => {
        return apiClient.delete(`/available-time-slot/${id}`);
    },

    restore: (id) => {
        return apiClient.put(`/available-time-slot/${id}/restore`);
    },

    permanentDelete: (id) => {
        return apiClient.delete(`/available-time-slot/${id}/permanent`);
    },
};
