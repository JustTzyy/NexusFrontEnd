import apiClient from './api';

export const tutoringRequestService = {
    // ==================== Student Endpoints ====================

    // Get current student's requests (paginated)
    getMyRequests: (params) => {
        return apiClient.get('/tutoring-request/my-requests', { params });
    },

    // Get student-safe detail view of a request
    getStudentView: (id) => {
        return apiClient.get(`/tutoring-request/${id}/student-view`);
    },

    // Create a new tutoring request
    create: (data) => {
        return apiClient.post('/tutoring-request', data);
    },

    // Update a request (only when Pending)
    update: (id, data) => {
        return apiClient.put(`/tutoring-request/${id}`, data);
    },

    // Cancel a request (any non-final status)
    cancel: (id) => {
        return apiClient.put(`/tutoring-request/${id}/cancel`);
    },

    // ==================== Student Enrollment (admin-created sessions) ====================

    // Get available admin-created sessions for student enrollment
    getAvailableSessions: (params) => {
        return apiClient.get('/tutoring-request/available-sessions', { params });
    },

    // Get student's enrolled admin-created sessions
    getMyEnrolledSessions: (params) => {
        return apiClient.get('/tutoring-request/my-enrolled-sessions', { params });
    },

    // Enroll in an admin-created session
    enroll: (requestId) => {
        return apiClient.post(`/tutoring-request/${requestId}/enroll`);
    },

    // ==================== Teacher Endpoints ====================

    // Get requests available for teacher to express interest
    getAvailable: (params) => {
        return apiClient.get('/tutoring-request/available', { params });
    },

    // Express interest in a request
    expressInterest: (requestId, data) => {
        return apiClient.post(`/tutoring-request/${requestId}/express-interest`, data);
    },

    // Get teacher's interest history
    getMyInterests: (params) => {
        return apiClient.get('/tutoring-request/my-interests', { params });
    },

    // Confirm or decline a scheduled session
    confirmSession: (requestId, accepted) => {
        return apiClient.put(`/tutoring-request/${requestId}/confirm`, { accepted });
    },

    // Withdraw from a confirmed session (teacher)
    withdraw: (requestId) => {
        return apiClient.put(`/tutoring-request/${requestId}/withdraw`);
    },

    // Withdraw from a confirmed session (student/customer/lead)
    studentWithdraw: (requestId) => {
        return apiClient.put(`/tutoring-request/${requestId}/student-withdraw`);
    },

    // ==================== Admin Endpoints ====================

    // Get all requests (paginated)
    getAll: (params) => {
        return apiClient.get('/tutoring-request', { params });
    },

    // Get full detail with interested teachers (admin view)
    getById: (id) => {
        return apiClient.get(`/tutoring-request/${id}`);
    },

    // Assign a teacher to a request
    assignTeacher: (requestId, teacherId) => {
        return apiClient.put(`/tutoring-request/${requestId}/assign-teacher`, { teacherId });
    },

    // Schedule a session (set room, day, time)
    scheduleSession: (requestId, data) => {
        return apiClient.put(`/tutoring-request/${requestId}/schedule`, data);
    },

    // Admin cancel a request
    adminCancel: (id, cancellationReason) => {
        return apiClient.put(`/tutoring-request/${id}/admin-cancel`, { cancellationReason });
    },

    // Admin restore a cancelled-by-admin request
    adminRestore: (id) => {
        return apiClient.put(`/tutoring-request/${id}/admin-restore`);
    },

    // Admin create a tutoring request
    adminCreate: (data) => {
        return apiClient.post('/tutoring-request/admin-create', data);
    },

    // Soft delete a request
    delete: (id) => {
        return apiClient.delete(`/tutoring-request/${id}`);
    },

    // Restore a deleted request
    restore: (id) => {
        return apiClient.put(`/tutoring-request/${id}/restore`);
    },

    // Get full status change history (admin)
    getStatusHistory: (params) => {
        return apiClient.get('/tutoring-request/status-history', { params });
    },

    // Get conflict data for scheduling — returns teacher's busy day+timeslot combos
    // and all room busy day+timeslot combos, used to filter dropdowns in the schedule form
    getConflictData: (teacherId, excludeRequestId) =>
        apiClient.get('/tutoring-request/conflict-check', { params: { teacherId, excludeRequestId } }),
};
