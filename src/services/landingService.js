import apiClient from './api';

export const landingService = {
    getStats: () => apiClient.get('/LandingPage/stats'),
    getFeedbacks: () => apiClient.get('/LandingPage/feedbacks'),
};
