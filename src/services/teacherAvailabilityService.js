import apiClient from './api';

export const teacherAvailabilityService = {
    /**
     * Get current teacher's own availability (no permission required).
     */
    getMyAvailability: () =>
        apiClient.get('/teacher-availability/me'),

    /**
     * Update current teacher's own availability (no permission required).
     * @param {{ dayId: number, timeSlotId: number }[]} slots
     */
    setMyAvailability: (slots) =>
        apiClient.put('/teacher-availability/me', { slots }),

    /**
     * Get a teacher's availability (all day+timeslot pairs they have enabled).
     * @param {number} teacherId
     */
    getByTeacher: (teacherId) =>
        apiClient.get(`/teacher-availability/${teacherId}`),

    /**
     * Replace a teacher's entire availability with the provided slots.
     * @param {number} teacherId
     * @param {{ dayId: number, timeSlotId: number }[]} slots
     */
    setAvailability: (teacherId, slots) =>
        apiClient.put(`/teacher-availability/${teacherId}`, { slots }),
};
