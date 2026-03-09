import apiClient from './api';

export const roomService = {
    // Get all active rooms (paginated)
    getAll: (params) => {
        return apiClient.get('/room', { params });
    },

    // Get room by ID
    getById: (id) => {
        return apiClient.get(`/room/${id}`);
    },

    // Get archived rooms
    getArchived: (params) => {
        return apiClient.get('/room/archive', { params });
    },

    // Create room
    create: (roomData) => {
        return apiClient.post('/room', roomData);
    },

    // Update room
    update: (id, roomData) => {
        return apiClient.put(`/room/${id}`, roomData);
    },

    // Soft delete (move to archive)
    delete: (id) => {
        return apiClient.delete(`/room/${id}`);
    },

    // Restore from archive
    restore: (id) => {
        return apiClient.put(`/room/${id}/restore`);
    },

    // Permanent delete (hard delete)
    permanentDelete: (id) => {
        return apiClient.delete(`/room/${id}/permanent`);
    },
};
