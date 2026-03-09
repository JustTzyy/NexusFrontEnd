import apiClient from './api';

export const studentAssignmentService = {
    getAll: (params) => apiClient.get('/student-assignment', { params }),
    getArchived: (params) => apiClient.get('/student-assignment/archive', { params }),
    getById: (id) => apiClient.get(`/student-assignment/${id}`),
    getMine: () => apiClient.get('/student-assignment/me'),
    updateMine: (data) => apiClient.put('/student-assignment/me', data),
    update: (id, data) => apiClient.put(`/student-assignment/${id}`, data),
    delete: (id) => apiClient.delete(`/student-assignment/${id}`),
    restore: (id) => apiClient.put(`/student-assignment/${id}/restore`),
    permanentDelete: (id) => apiClient.delete(`/student-assignment/${id}/permanent`),
};
