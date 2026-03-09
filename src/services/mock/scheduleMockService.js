import { mockRooms, availableDays, availableTimeSlots, mockSubjects, mockTeachers, departments, getNextId } from "./mockData";

const delay = (ms = 400) => new Promise(r => setTimeout(r, ms));

// Interested teachers per schedule (for "Waiting for Approval" schedules)
const interestedTeachersMap = {
    2: [
        {
            teacherId: 105, teacherName: "Jose Reyes",
            description: "I have 5 years of experience teaching web development with React and Node.js. I can cover both frontend and backend topics.",
            recommendation: "Highly recommended — has industry experience and strong student feedback ratings.",
            submittedAt: "2026-02-05",
        },
        {
            teacherId: 101, teacherName: "Justin Digal",
            description: "Full-stack developer with expertise in modern JavaScript frameworks. I'd love to help students build real-world projects.",
            recommendation: "Good fit — currently teaching Data Structures and has relevant CS background.",
            submittedAt: "2026-02-06",
        },
    ],
    5: [
        {
            teacherId: 104, teacherName: "Maria Santos",
            description: "I specialize in Filipino literary analysis and have published several papers on contemporary Philippine literature.",
            recommendation: "Best match — already teaching in the Humanities department with strong domain expertise.",
            submittedAt: "2026-02-07",
        },
    ],
};

// In-memory schedule store
const schedules = [
    {
        id: 1,
        buildingId: 1,
        departmentId: 1, departmentName: "Computer Science",
        subjectId: 1, subjectName: "Data Structures",
        priority: "Normal",
        description: "Cover linked lists, stacks, queues, and binary trees.",
        teacherId: 101, teacherName: "Justin Digal",
        roomId: 1, roomName: "Room 101",
        availableDayId: 1, dayName: "Monday",
        availableTimeSlotId: 1, timeSlotLabel: "8:00 AM - 9:00 AM",
        status: "Approved",
        createdAt: "2026-02-01",
        deletedAt: null,
    },
    {
        id: 2,
        buildingId: 1,
        departmentId: 1, departmentName: "Computer Science",
        subjectId: 2, subjectName: "Web Development",
        priority: "High",
        description: "Frontend and backend web development using modern frameworks.",
        teacherId: 105, teacherName: "Jose Reyes",
        roomId: 2, roomName: "Room 102",
        availableDayId: 3, dayName: "Wednesday",
        availableTimeSlotId: 5, timeSlotLabel: "1:00 PM - 2:00 PM",
        status: "Waiting for Approval",
        createdAt: "2026-02-02",
        deletedAt: null,
    },
    {
        id: 3,
        buildingId: 2,
        departmentId: 2, departmentName: "Natural Sciences",
        subjectId: 4, subjectName: "Physics",
        priority: "Normal",
        description: "Mechanics and thermodynamics laboratory exercises.",
        teacherId: 101, teacherName: "Justin Digal",
        roomId: 3, roomName: "Physics Lab",
        availableDayId: 2, dayName: "Tuesday",
        availableTimeSlotId: 2, timeSlotLabel: "9:00 AM - 10:00 AM",
        status: "Pending Teacher Interest",
        createdAt: "2026-02-03",
        deletedAt: null,
    },
    {
        id: 4,
        buildingId: 2,
        departmentId: 2, departmentName: "Natural Sciences",
        subjectId: 3, subjectName: "Calculus",
        priority: "Low",
        description: "Differential and integral calculus review sessions.",
        teacherId: 102, teacherName: "Jane Smith",
        roomId: 4, roomName: "Chemistry Lab",
        availableDayId: 4, dayName: "Thursday",
        availableTimeSlotId: 3, timeSlotLabel: "10:00 AM - 11:00 AM",
        status: "Approved",
        createdAt: "2026-02-04",
        deletedAt: null,
    },
    {
        id: 5,
        buildingId: 3,
        departmentId: 3, departmentName: "Humanities",
        subjectId: 7, subjectName: "Philippine Literature",
        priority: "High",
        description: "Analysis of classic and contemporary Filipino literary works.",
        teacherId: 104, teacherName: "Maria Santos",
        roomId: 5, roomName: "Art Studio",
        availableDayId: 5, dayName: "Friday",
        availableTimeSlotId: 6, timeSlotLabel: "2:00 PM - 3:00 PM",
        status: "Waiting for Approval",
        createdAt: "2026-02-05",
        deletedAt: null,
    },
    {
        id: 6,
        buildingId: 3,
        departmentId: 4, departmentName: "Social Sciences",
        subjectId: 8, subjectName: "Sociology",
        priority: "Normal",
        description: "Introduction to social structures and cultural dynamics.",
        teacherId: 104, teacherName: "Maria Santos",
        roomId: 6, roomName: "Conference Room",
        availableDayId: 1, dayName: "Monday",
        availableTimeSlotId: 7, timeSlotLabel: "3:00 PM - 4:00 PM",
        status: "Pending Teacher Interest",
        createdAt: "2026-02-06",
        deletedAt: null,
    },
];

export const scheduleMockService = {
    getByBuilding: async (buildingId) => {
        await delay();
        return schedules.filter(s => s.buildingId === Number(buildingId) && !s.deletedAt);
    },

    getArchivedByBuilding: async (buildingId) => {
        await delay();
        return schedules.filter(s => s.buildingId === Number(buildingId) && s.deletedAt);
    },

    getById: async (id) => {
        await delay();
        return schedules.find(s => s.id === Number(id)) || null;
    },

    create: async (data) => {
        await delay(600);
        const dept = departments.find(d => d.id === Number(data.departmentId));
        const subject = mockSubjects.find(s => s.id === Number(data.subjectId));

        const newSchedule = {
            id: getNextId(),
            buildingId: Number(data.buildingId),
            departmentId: Number(data.departmentId),
            departmentName: dept?.name || "Unknown",
            subjectId: Number(data.subjectId),
            subjectName: subject?.name || "Unknown",
            priority: data.priority || "Normal",
            description: data.description || "",
            // These will be assigned later by admin scheduling
            teacherId: null, teacherName: "",
            roomId: null, roomName: "",
            availableDayId: null, dayName: "",
            availableTimeSlotId: null, timeSlotLabel: "",
            status: "Pending Teacher Interest",
            createdAt: new Date().toISOString().split("T")[0],
            deletedAt: null,
        };
        schedules.push(newSchedule);
        return newSchedule;
    },

    update: async (id, data) => {
        await delay(600);
        const idx = schedules.findIndex(s => s.id === Number(id));
        if (idx === -1) throw new Error("Schedule not found");

        const dept = departments.find(d => d.id === Number(data.departmentId));
        const subject = mockSubjects.find(s => s.id === Number(data.subjectId));

        schedules[idx] = {
            ...schedules[idx],
            departmentId: Number(data.departmentId),
            departmentName: dept?.name || schedules[idx].departmentName,
            subjectId: Number(data.subjectId),
            subjectName: subject?.name || schedules[idx].subjectName,
            priority: data.priority || schedules[idx].priority,
            description: data.description !== undefined ? data.description : schedules[idx].description,
        };
        return schedules[idx];
    },

    archive: async (id) => {
        await delay(600);
        const schedule = schedules.find(s => s.id === Number(id));
        if (!schedule) throw new Error("Schedule not found");
        schedule.deletedAt = new Date().toISOString().split("T")[0];
        schedule.status = "Archived";
        return schedule;
    },

    restore: async (id) => {
        await delay(600);
        const schedule = schedules.find(s => s.id === Number(id));
        if (!schedule) throw new Error("Schedule not found");
        schedule.deletedAt = null;
        schedule.status = "Active";
        return schedule;
    },

    // Reference data
    getDepartments: async () => {
        await delay(200);
        return departments.filter(d => d.isActive && !d.deletedAt);
    },

    getSubjectsByDepartment: async (departmentId) => {
        await delay(200);
        return mockSubjects.filter(s => s.departmentId === Number(departmentId));
    },

    getSubjects: async () => {
        await delay(200);
        return [...mockSubjects];
    },

    getRoomsForBuilding: async (buildingId) => {
        await delay(200);
        return mockRooms.filter(r => r.buildingId === Number(buildingId) && r.isActive);
    },

    getAvailableDays: async () => {
        await delay(200);
        return availableDays.filter(d => d.isActive);
    },

    getAvailableTimeSlots: async () => {
        await delay(200);
        return availableTimeSlots.filter(s => s.isActive);
    },

    getTeachers: async () => {
        await delay(200);
        return [...mockTeachers];
    },

    getInterestedTeachers: async (scheduleId) => {
        await delay(300);
        return interestedTeachersMap[Number(scheduleId)] || [];
    },
};
