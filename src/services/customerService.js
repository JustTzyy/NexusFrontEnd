import apiClient from './api';

export const customerService = {
    getAll: (params) => apiClient.get('/customer', { params }),
    getById: (id) => apiClient.get(`/customer/${id}`),
};
