import { tutoringRequests, teacherAssignments, mockRooms, availableDays, availableTimeSlots, getNextId } from "./mockData";

const delay = (ms = 400) => new Promise(r => setTimeout(r, ms));

export const tutoringRequestMockService = {
    getAll: async () => {
        await delay();
        return [...tutoringRequests];
    },

    getById: async (id) => {
        await delay();
        return tutoringRequests.find(r => r.id === Number(id)) || null;
    },

    getByStatus: async (status) => {
        await delay();
        return tutoringRequests.filter(r => r.status === status);
    },

    // Get requests visible to a specific teacher (matching their assignments)
    getForTeacher: async (teacherId) => {
        await delay();
        const assignments = teacherAssignments.filter(a => a.teacherId === Number(teacherId));
        return tutoringRequests.filter(r =>
            r.status === "Pending Teacher Interest" &&
            assignments.some(a => a.buildingId === r.buildingId && a.departmentId === r.departmentId)
        );
    },

    // Get requests where a teacher has expressed interest
    getTeacherInterestHistory: async (teacherId) => {
        await delay();
        return tutoringRequests.filter(r =>
            r.interestedTeachers.some(t => t.teacherId === Number(teacherId))
        );
    },

    create: async (data) => {
        await delay(600);
        const newRequest = {
            id: getNextId(),
            studentId: data.studentId || 999,
            studentName: data.studentName || "Current Student",
            buildingId: Number(data.buildingId),
            buildingName: data.buildingName,
            departmentId: Number(data.departmentId),
            departmentName: data.departmentName,
            subjectId: Number(data.subjectId),
            subjectName: data.subjectName,
            message: data.message || "",
            priority: data.priority || "Normal",
            status: "Pending Teacher Interest",
            interestedTeachers: [],
            assignedTeacherId: null, assignedTeacherName: null,
            roomId: null, roomName: null,
            availableDayId: null, dayName: null,
            availableTimeSlotId: null, timeSlotLabel: null,
            createdAt: new Date().toISOString().split("T")[0],
            scheduledAt: null, confirmedAt: null,
        };
        tutoringRequests.push(newRequest);
        return newRequest;
    },

    expressInterest: async (requestId, teacherId, teacherName) => {
        await delay(600);
        const req = tutoringRequests.find(r => r.id === Number(requestId));
        if (!req) throw new Error("Request not found");
        if (req.status !== "Pending Teacher Interest") throw new Error("Request is not accepting interest");

        const alreadyInterested = req.interestedTeachers.some(t => t.teacherId === Number(teacherId));
        if (alreadyInterested) throw new Error("You have already expressed interest");

        req.interestedTeachers.push({
            teacherId: Number(teacherId),
            teacherName,
            interestedAt: new Date().toISOString().split("T")[0],
            status: "interested",
        });
        req.status = "Waiting for Admin Approval";
        return req;
    },

    // Admin schedules the session
    scheduleSession: async (requestId, data) => {
        await delay(600);
        const req = tutoringRequests.find(r => r.id === Number(requestId));
        if (!req) throw new Error("Request not found");

        const room = mockRooms.find(r => r.id === Number(data.roomId));
        const day = availableDays.find(d => d.id === Number(data.availableDayId));
        const slot = availableTimeSlots.find(s => s.id === Number(data.availableTimeSlotId));
        const teacher = req.interestedTeachers.find(t => t.teacherId === Number(data.assignedTeacherId));

        // Mark selected teacher
        req.interestedTeachers.forEach(t => {
            t.status = t.teacherId === Number(data.assignedTeacherId) ? "selected" : "closed";
        });

        req.assignedTeacherId = Number(data.assignedTeacherId);
        req.assignedTeacherName = teacher?.teacherName || "Unknown";
        req.roomId = Number(data.roomId);
        req.roomName = room?.name || "Unknown";
        req.availableDayId = Number(data.availableDayId);
        req.dayName = day?.dayName || "Unknown";
        req.availableTimeSlotId = Number(data.availableTimeSlotId);
        req.timeSlotLabel = slot?.label || "Unknown";
        req.status = "Waiting for Teacher Confirmation";
        req.scheduledAt = new Date().toISOString().split("T")[0];

        return req;
    },

    // Teacher confirms/declines
    confirmSession: async (requestId, accepted) => {
        await delay(600);
        const req = tutoringRequests.find(r => r.id === Number(requestId));
        if (!req) throw new Error("Request not found");

        if (accepted) {
            req.status = "Confirmed";
            req.confirmedAt = new Date().toISOString().split("T")[0];
        } else {
            // Reset scheduling, go back to admin
            req.status = "Waiting for Admin Approval";
            req.assignedTeacherId = null;
            req.assignedTeacherName = null;
            req.roomId = null;
            req.roomName = null;
            req.availableDayId = null;
            req.dayName = null;
            req.availableTimeSlotId = null;
            req.timeSlotLabel = null;
            req.scheduledAt = null;
            // Re-open interested teachers except the one who declined
            req.interestedTeachers.forEach(t => {
                if (t.status === "selected") t.status = "declined";
                else if (t.status === "closed") t.status = "interested";
            });
        }
        return req;
    },

    // Check conflicts for a given teacher/room/day/timeSlot
    checkConflicts: async (data) => {
        await delay(200);
        const conflicts = [];

        const confirmedOrScheduled = tutoringRequests.filter(
            r => (r.status === "Confirmed" || r.status === "Waiting for Teacher Confirmation") && r.id !== Number(data.excludeRequestId)
        );

        // Teacher conflict
        const teacherConflict = confirmedOrScheduled.find(
            r => r.assignedTeacherId === Number(data.teacherId) &&
                r.availableDayId === Number(data.availableDayId) &&
                r.availableTimeSlotId === Number(data.availableTimeSlotId)
        );
        if (teacherConflict) {
            conflicts.push({
                type: "teacher",
                message: `Teacher "${teacherConflict.assignedTeacherName}" is already scheduled on ${teacherConflict.dayName} at ${teacherConflict.timeSlotLabel}`,
            });
        }

        // Room conflict
        const roomConflict = confirmedOrScheduled.find(
            r => r.roomId === Number(data.roomId) &&
                r.availableDayId === Number(data.availableDayId) &&
                r.availableTimeSlotId === Number(data.availableTimeSlotId)
        );
        if (roomConflict) {
            conflicts.push({
                type: "room",
                message: `Room "${roomConflict.roomName}" is already booked on ${roomConflict.dayName} at ${roomConflict.timeSlotLabel}`,
            });
        }

        return conflicts;
    },

    cancelRequest: async (requestId, cancelledBy) => {
        await delay(400);
        const req = tutoringRequests.find(r => r.id === Number(requestId));
        if (!req) throw new Error("Request not found");
        req.status = cancelledBy === "student" ? "Cancelled by Student" : "Cancelled by Admin";
        return req;
    },

    getRoomsForBuilding: async (buildingId) => {
        await delay(200);
        return mockRooms.filter(r => r.buildingId === Number(buildingId) && r.isActive);
    },

    getAvailableDays: async () => {
        await delay(200);
        return availableDays.filter(d => d.isActive && !d.deletedAt).sort((a, b) => a.sortOrder - b.sortOrder);
    },

    getAvailableTimeSlots: async () => {
        await delay(200);
        return availableTimeSlots.filter(t => t.isActive && !t.deletedAt).sort((a, b) => a.startTime.localeCompare(b.startTime));
    },
};
