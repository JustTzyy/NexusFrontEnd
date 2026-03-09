import apiClient from './api';

export const marketingAnalyticsService = {
    getOverview: (params) => apiClient.get('/marketing/analytics/overview', { params }),
    getCampaignStats: () => apiClient.get('/marketing/analytics/campaigns'),
    getEmailPerformance: (params) => apiClient.get('/marketing/analytics/email-performance', { params }),
    getLeadPipeline: () => apiClient.get('/marketing/analytics/lead-pipeline'),
};
