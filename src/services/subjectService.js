import apiClient from './api';

export const subjectService = {
    getAll: (params) => {
        return apiClient.get('/subject', { params });
    },

    lookup: () => {
        return apiClient.get('/subject/lookup');
    },

    getById: (id) => {
        return apiClient.get(`/subject/${id}`);
    },

    getArchived: (params) => {
        return apiClient.get('/subject/archive', { params });
    },

    create: (subjectData) => {
        return apiClient.post('/subject', subjectData);
    },

    update: (id, subjectData) => {
        return apiClient.put(`/subject/${id}`, subjectData);
    },

    delete: (id) => {
        return apiClient.delete(`/subject/${id}`);
    },

    restore: (id) => {
        return apiClient.put(`/subject/${id}/restore`);
    },

    permanentDelete: (id) => {
        return apiClient.delete(`/subject/${id}/permanent`);
    },
};
