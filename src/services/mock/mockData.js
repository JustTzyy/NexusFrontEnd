// Centralized mock data store - shared across all mock services
// Data is mutable so creates/updates persist during the session

let nextId = 1000;
export const getNextId = () => ++nextId;

export const departments = [
    { id: 1, name: "Information Technology", code: "IT", description: "Computer science and information technology programs", isActive: true, createdAt: "2026-01-15", updatedAt: "2026-01-15", deletedAt: null },
    { id: 2, name: "Science, Technology, Engineering, and Mathematics", code: "STEM", description: "Advanced science and math track", isActive: true, createdAt: "2026-01-15", updatedAt: "2026-01-15", deletedAt: null },
    { id: 3, name: "Accountancy, Business, and Management", code: "ABM", description: "Business and accounting programs", isActive: true, createdAt: "2026-01-16", updatedAt: "2026-01-16", deletedAt: null },
    { id: 4, name: "Humanities and Social Sciences", code: "HUMSS", description: "Liberal arts, social studies, and communication", isActive: true, createdAt: "2026-01-16", updatedAt: "2026-01-16", deletedAt: null },
    { id: 5, name: "General Academic Strand", code: "GAS", description: "General academic subjects and electives", isActive: false, createdAt: "2026-01-17", updatedAt: "2026-01-20", deletedAt: null },
];

export const availableDays = [
    { id: 1, dayName: "Monday", sortOrder: 1, isActive: true, createdAt: "2026-01-10", deletedAt: null },
    { id: 2, dayName: "Tuesday", sortOrder: 2, isActive: true, createdAt: "2026-01-10", deletedAt: null },
    { id: 3, dayName: "Wednesday", sortOrder: 3, isActive: true, createdAt: "2026-01-10", deletedAt: null },
    { id: 4, dayName: "Thursday", sortOrder: 4, isActive: true, createdAt: "2026-01-10", deletedAt: null },
    { id: 5, dayName: "Friday", sortOrder: 5, isActive: true, createdAt: "2026-01-10", deletedAt: null },
    { id: 6, dayName: "Saturday", sortOrder: 6, isActive: false, createdAt: "2026-01-10", deletedAt: null },
    { id: 7, dayName: "Sunday", sortOrder: 7, isActive: false, createdAt: "2026-01-10", deletedAt: null },
];

export const availableTimeSlots = [
    { id: 1, label: "8:00 AM - 9:00 AM", startTime: "08:00", endTime: "09:00", isActive: true, createdAt: "2026-01-10", deletedAt: null },
    { id: 2, label: "9:00 AM - 10:00 AM", startTime: "09:00", endTime: "10:00", isActive: true, createdAt: "2026-01-10", deletedAt: null },
    { id: 3, label: "10:00 AM - 11:00 AM", startTime: "10:00", endTime: "11:00", isActive: true, createdAt: "2026-01-10", deletedAt: null },
    { id: 4, label: "11:00 AM - 12:00 PM", startTime: "11:00", endTime: "12:00", isActive: true, createdAt: "2026-01-10", deletedAt: null },
    { id: 5, label: "1:00 PM - 2:00 PM", startTime: "13:00", endTime: "14:00", isActive: true, createdAt: "2026-01-10", deletedAt: null },
    { id: 6, label: "2:00 PM - 3:00 PM", startTime: "14:00", endTime: "15:00", isActive: true, createdAt: "2026-01-10", deletedAt: null },
    { id: 7, label: "3:00 PM - 4:00 PM", startTime: "15:00", endTime: "16:00", isActive: true, createdAt: "2026-01-10", deletedAt: null },
    { id: 8, label: "4:00 PM - 5:00 PM", startTime: "16:00", endTime: "17:00", isActive: false, createdAt: "2026-01-10", deletedAt: null },
];

export const mockBuildings = [
    { id: 1, name: "Main Academic Building", isActive: true },
    { id: 2, name: "Science & Technology Wing", isActive: true },
    { id: 3, name: "Arts & Humanities Center", isActive: true },
];

export const mockRooms = [
    { id: 1, name: "Room 101", buildingId: 1, buildingName: "Main Academic Building", isActive: true },
    { id: 2, name: "Room 102", buildingId: 1, buildingName: "Main Academic Building", isActive: true },
    { id: 3, name: "Physics Lab", buildingId: 2, buildingName: "Science & Technology Wing", isActive: true },
    { id: 4, name: "Chemistry Lab", buildingId: 2, buildingName: "Science & Technology Wing", isActive: true },
    { id: 5, name: "Art Studio", buildingId: 3, buildingName: "Arts & Humanities Center", isActive: true },
    { id: 6, name: "Conference Room", buildingId: 3, buildingName: "Arts & Humanities Center", isActive: true },
];

export const mockSubjects = [
    { id: 1, name: "Data Structures", departmentId: 1, departmentName: "Information Technology" },
    { id: 2, name: "Web Development", departmentId: 1, departmentName: "Information Technology" },
    { id: 3, name: "Calculus", departmentId: 2, departmentName: "Science, Technology, Engineering, and Mathematics" },
    { id: 4, name: "Physics", departmentId: 2, departmentName: "Science, Technology, Engineering, and Mathematics" },
    { id: 5, name: "Accounting", departmentId: 3, departmentName: "Accountancy, Business, and Management" },
    { id: 6, name: "Business Ethics", departmentId: 3, departmentName: "Accountancy, Business, and Management" },
    { id: 7, name: "Philippine Literature", departmentId: 4, departmentName: "Humanities and Social Sciences" },
    { id: 8, name: "Sociology", departmentId: 4, departmentName: "Humanities and Social Sciences" },
];

export const mockTeachers = [
    { id: 101, name: "Justin Digal" },
    { id: 102, name: "Jane Smith" },
    { id: 103, name: "Robert Wilson" },
    { id: 104, name: "Maria Santos" },
    { id: 105, name: "Jose Reyes" },
];

export const teacherAssignments = [
    { id: 1, teacherId: 101, teacherName: "Justin Digal", buildingId: 1, buildingName: "Main Academic Building", departmentId: 1, departmentName: "Information Technology", createdAt: "2026-01-20", updatedAt: "2026-01-20", createdBy: "Admin", updatedBy: "Admin", deletedAt: null },
    { id: 2, teacherId: 101, teacherName: "Justin Digal", buildingId: 2, buildingName: "Science & Technology Wing", departmentId: 2, departmentName: "Science, Technology, Engineering, and Mathematics", createdAt: "2026-01-20", updatedAt: "2026-01-20", createdBy: "Admin", updatedBy: "Admin", deletedAt: null },
    { id: 3, teacherId: 102, teacherName: "Jane Smith", buildingId: 1, buildingName: "Main Academic Building", departmentId: 2, departmentName: "Science, Technology, Engineering, and Mathematics", createdAt: "2026-01-21", updatedAt: "2026-01-21", createdBy: "Admin", updatedBy: "Admin", deletedAt: null },
    { id: 4, teacherId: 103, teacherName: "Robert Wilson", buildingId: 2, buildingName: "Science & Technology Wing", departmentId: 1, departmentName: "Information Technology", createdAt: "2026-01-21", updatedAt: "2026-01-21", createdBy: "Admin", updatedBy: "Admin", deletedAt: null },
    { id: 5, teacherId: 104, teacherName: "Maria Santos", buildingId: 3, buildingName: "Arts & Humanities Center", departmentId: 4, departmentName: "Humanities and Social Sciences", createdAt: "2026-01-22", updatedAt: "2026-01-22", createdBy: "Admin", updatedBy: "Admin", deletedAt: null },
    { id: 6, teacherId: 105, teacherName: "Jose Reyes", buildingId: 1, buildingName: "Main Academic Building", departmentId: 3, departmentName: "Accountancy, Business, and Management", createdAt: "2026-01-22", updatedAt: "2026-01-22", createdBy: "Admin", updatedBy: "Admin", deletedAt: null },
];

export const tutoringRequests = [
    {
        id: 1, studentId: 201, studentName: "Ana Cruz",
        buildingId: 1, buildingName: "Main Academic Building",
        departmentId: 1, departmentName: "Information Technology",
        subjectId: 1, subjectName: "Data Structures",
        message: "I need help understanding linked lists and tree traversal algorithms.",
        priority: "Normal",
        status: "Pending Teacher Interest",
        interestedTeachers: [],
        assignedTeacherId: null, assignedTeacherName: null,
        roomId: null, roomName: null,
        availableDayId: null, dayName: null,
        availableTimeSlotId: null, timeSlotLabel: null,
        createdAt: "2026-02-01", scheduledAt: null, confirmedAt: null,
    },
    {
        id: 2, studentId: 202, studentName: "Mark Rivera",
        buildingId: 2, buildingName: "Science & Technology Wing",
        departmentId: 2, departmentName: "Science, Technology, Engineering, and Mathematics",
        subjectId: 4, subjectName: "Physics",
        message: "Need help with thermodynamics and heat transfer problems for my upcoming exam.",
        priority: "High",
        status: "Waiting for Admin Approval",
        interestedTeachers: [
            { teacherId: 101, teacherName: "Justin Digal", interestedAt: "2026-02-02", status: "interested" },
            { teacherId: 102, teacherName: "Jane Smith", interestedAt: "2026-02-02", status: "interested" },
        ],
        assignedTeacherId: null, assignedTeacherName: null,
        roomId: null, roomName: null,
        availableDayId: null, dayName: null,
        availableTimeSlotId: null, timeSlotLabel: null,
        createdAt: "2026-02-01", scheduledAt: null, confirmedAt: null,
    },
    {
        id: 3, studentId: 203, studentName: "Lisa Tan",
        buildingId: 1, buildingName: "Main Academic Building",
        departmentId: 3, departmentName: "Accountancy, Business, and Management",
        subjectId: 5, subjectName: "Accounting",
        message: "I'm struggling with journal entries and financial statements.",
        priority: "Normal",
        status: "Waiting for Teacher Confirmation",
        interestedTeachers: [
            { teacherId: 105, teacherName: "Jose Reyes", interestedAt: "2026-02-03", status: "selected" },
        ],
        assignedTeacherId: 105, assignedTeacherName: "Jose Reyes",
        roomId: 1, roomName: "Room 101",
        availableDayId: 1, dayName: "Monday",
        availableTimeSlotId: 5, timeSlotLabel: "1:00 PM - 2:00 PM",
        createdAt: "2026-02-02", scheduledAt: "2026-02-05", confirmedAt: null,
    },
    {
        id: 4, studentId: 204, studentName: "Carlos Garcia",
        buildingId: 3, buildingName: "Arts & Humanities Center",
        departmentId: 4, departmentName: "Humanities and Social Sciences",
        subjectId: 7, subjectName: "Philippine Literature",
        message: "Need guidance on my essay about Jose Rizal's Noli Me Tangere.",
        priority: "Low",
        status: "Confirmed",
        interestedTeachers: [
            { teacherId: 104, teacherName: "Maria Santos", interestedAt: "2026-02-04", status: "selected" },
        ],
        assignedTeacherId: 104, assignedTeacherName: "Maria Santos",
        roomId: 5, roomName: "Art Studio",
        availableDayId: 3, dayName: "Wednesday",
        availableTimeSlotId: 2, timeSlotLabel: "9:00 AM - 10:00 AM",
        createdAt: "2026-02-03", scheduledAt: "2026-02-05", confirmedAt: "2026-02-06",
    },
];
