import apiClient from './api';

export const addressService = {
  // Create a new address
  create: (addressData) => apiClient.post('/address', addressData),

  // Get address by ID
  getById: (id) => apiClient.get(`/address/${id}`),

  // Get all addresses (paginated)
  getAll: (params) => apiClient.get('/address', { params }),

  // Update address
  update: (id, addressData) => apiClient.put(`/address/${id}`, addressData),

  // Delete address
  delete: (id) => apiClient.delete(`/address/${id}`),
};
