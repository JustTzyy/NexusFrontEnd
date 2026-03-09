import apiClient from './api';

export const locationService = {
  getRegions: () => apiClient.get('/location/regions'),
  getProvinces: (regionCode) => apiClient.get(`/location/provinces/${regionCode}`),
  getCities: (provinceCode) => apiClient.get(`/location/cities/${provinceCode}`),
};
