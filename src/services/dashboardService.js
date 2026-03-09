import apiClient from './api';

export const dashboardService = {
  getSummary: (params) => apiClient.get('/dashboardSuperAdmin/summary', { params }),
  getAdminSummary: (params) => apiClient.get('/dashboardAdmin/summary', { params }),
  getTeacherSummary: (params) => apiClient.get('/dashboardTeacher/summary', { params }),
  getBuildingManagerSummary: (params) => apiClient.get('/dashboardBuildingManager/summary', { params }),
  getStudentSummary: (params) => apiClient.get('/dashboardStudent/summary', { params }),
};
