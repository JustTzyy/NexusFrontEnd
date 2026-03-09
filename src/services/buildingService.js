import apiClient from './api';

export const buildingService = {
    // Get all active buildings (paginated)
    getAll: (params) => {
        return apiClient.get('/building', { params });
    },

    // Get all active buildings as lookup (no permission required)
    lookup: () => {
        return apiClient.get('/building/lookup');
    },

    // Get the building managed by the current authenticated user
    getMy: () => {
        return apiClient.get('/building/my');
    },

    // Get recommended building based on user location
    getRecommended: (params) => {
        return apiClient.get('/building/recommended', { params });
    },

    // Get building by ID
    getById: (id) => {
        return apiClient.get(`/building/${id}`);
    },

    // Get archived buildings
    getArchived: (params) => {
        return apiClient.get('/building/archive', { params });
    },

    // Get available building managers (not already assigned)
    getAvailableManagers: (excludeBuildingId) => {
        const params = excludeBuildingId ? { excludeBuildingId } : {};
        return apiClient.get('/building/available-managers', { params });
    },

    // Create building
    create: (buildingData) => {
        return apiClient.post('/building', buildingData);
    },

    // Update building
    update: (id, buildingData) => {
        return apiClient.put(`/building/${id}`, buildingData);
    },

    // Soft delete (move to archive)
    delete: (id) => {
        return apiClient.delete(`/building/${id}`);
    },

    // Restore from archive
    restore: (id) => {
        return apiClient.put(`/building/${id}/restore`);
    },

    // Permanent delete (hard delete)
    permanentDelete: (id) => {
        return apiClient.delete(`/building/${id}/permanent`);
    },
};
