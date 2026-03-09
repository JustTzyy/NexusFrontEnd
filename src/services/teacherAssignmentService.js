import apiClient from './api';

export const teacherAssignmentService = {
    getAll: (params) => {
        return apiClient.get('/teacher-assignment', { params });
    },

    getById: (id) => {
        return apiClient.get(`/teacher-assignment/${id}`);
    },

    getArchived: (params) => {
        return apiClient.get('/teacher-assignment/archive', { params });
    },

    create: (data) => {
        return apiClient.post('/teacher-assignment', data);
    },

    update: (id, data) => {
        return apiClient.put(`/teacher-assignment/${id}`, data);
    },

    delete: (id) => {
        return apiClient.delete(`/teacher-assignment/${id}`);
    },

    restore: (id) => {
        return apiClient.put(`/teacher-assignment/${id}/restore`);
    },

    permanentDelete: (id) => {
        return apiClient.delete(`/teacher-assignment/${id}/permanent`);
    },

    getMine: () => {
        return apiClient.get('/teacher-assignment/mine');
    },
};
