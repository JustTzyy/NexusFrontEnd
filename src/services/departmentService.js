import apiClient from './api';

export const departmentService = {
    getAll: (params) => {
        return apiClient.get('/department', { params });
    },

    lookup: () => {
        return apiClient.get('/department/lookup');
    },

    getById: (id) => {
        return apiClient.get(`/department/${id}`);
    },

    getArchived: (params) => {
        return apiClient.get('/department/archive', { params });
    },

    create: (departmentData) => {
        return apiClient.post('/department', departmentData);
    },

    update: (id, departmentData) => {
        return apiClient.put(`/department/${id}`, departmentData);
    },

    delete: (id) => {
        return apiClient.delete(`/department/${id}`);
    },

    restore: (id) => {
        return apiClient.put(`/department/${id}/restore`);
    },

    permanentDelete: (id) => {
        return apiClient.delete(`/department/${id}/permanent`);
    },
};
