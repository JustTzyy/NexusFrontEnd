import { teacherAssignments, mockTeachers, mockBuildings, departments, getNextId } from "./mockData";

const delay = (ms = 400) => new Promise(r => setTimeout(r, ms));

export const teacherAssignmentMockService = {
    getAll: async () => {
        await delay();
        return teacherAssignments.filter(a => !a.deletedAt);
    },

    getById: async (id) => {
        await delay();
        return teacherAssignments.find(a => a.id === Number(id) && !a.deletedAt) || null;
    },

    getArchived: async () => {
        await delay();
        return teacherAssignments.filter(a => a.deletedAt);
    },

    getTeachers: async () => {
        await delay(200);
        return [...mockTeachers];
    },

    getBuildings: async () => {
        await delay(200);
        return mockBuildings.filter(b => b.isActive);
    },

    getDepartments: async () => {
        await delay(200);
        return departments.filter(d => d.isActive && !d.deletedAt);
    },

    getByTeacherId: async (teacherId) => {
        await delay();
        return teacherAssignments.filter(a => a.teacherId === Number(teacherId) && !a.deletedAt);
    },

    getTeachersByBuildingAndDepartment: async (buildingId, departmentId) => {
        await delay();
        const assignments = teacherAssignments.filter(
            a => a.buildingId === Number(buildingId) && a.departmentId === Number(departmentId) && !a.deletedAt
        );
        return assignments.map(a => ({ id: a.teacherId, name: a.teacherName }));
    },

    create: async (data) => {
        await delay(600);
        const exists = teacherAssignments.some(
            a => a.teacherId === Number(data.teacherId) &&
                a.buildingId === Number(data.buildingId) &&
                a.departmentId === Number(data.departmentId) &&
                !a.deletedAt
        );
        if (exists) throw new Error("This teacher is already assigned to this building and department.");

        const teacher = mockTeachers.find(t => t.id === Number(data.teacherId));
        const building = mockBuildings.find(b => b.id === Number(data.buildingId));
        const dept = departments.find(d => d.id === Number(data.departmentId));
        const now = new Date().toISOString().split("T")[0];

        const newAssignment = {
            id: getNextId(),
            teacherId: Number(data.teacherId),
            teacherName: teacher?.name || "Unknown",
            buildingId: Number(data.buildingId),
            buildingName: building?.name || "Unknown",
            departmentId: Number(data.departmentId),
            departmentName: dept?.name || "Unknown",
            createdAt: now,
            updatedAt: now,
            createdBy: "Admin",
            updatedBy: "Admin",
            deletedAt: null,
        };
        teacherAssignments.push(newAssignment);
        return newAssignment;
    },

    update: async (id, data) => {
        await delay(600);
        const idx = teacherAssignments.findIndex(a => a.id === Number(id) && !a.deletedAt);
        if (idx === -1) throw new Error("Assignment not found");

        const exists = teacherAssignments.some(
            a => a.id !== Number(id) &&
                a.teacherId === Number(data.teacherId) &&
                a.buildingId === Number(data.buildingId) &&
                a.departmentId === Number(data.departmentId) &&
                !a.deletedAt
        );
        if (exists) throw new Error("This teacher is already assigned to this building and department.");

        const teacher = mockTeachers.find(t => t.id === Number(data.teacherId));
        const building = mockBuildings.find(b => b.id === Number(data.buildingId));
        const dept = departments.find(d => d.id === Number(data.departmentId));

        teacherAssignments[idx] = {
            ...teacherAssignments[idx],
            teacherId: Number(data.teacherId),
            teacherName: teacher?.name || "Unknown",
            buildingId: Number(data.buildingId),
            buildingName: building?.name || "Unknown",
            departmentId: Number(data.departmentId),
            departmentName: dept?.name || "Unknown",
            updatedAt: new Date().toISOString().split("T")[0],
            updatedBy: "Admin",
        };
        return teacherAssignments[idx];
    },

    delete: async (id) => {
        await delay(400);
        const idx = teacherAssignments.findIndex(a => a.id === Number(id));
        if (idx === -1) throw new Error("Assignment not found");
        teacherAssignments[idx].deletedAt = new Date().toISOString().split("T")[0];
        return true;
    },

    restore: async (id) => {
        await delay(400);
        const idx = teacherAssignments.findIndex(a => a.id === Number(id));
        if (idx === -1) throw new Error("Assignment not found");
        teacherAssignments[idx].deletedAt = null;
        return true;
    },

    permanentDelete: async (id) => {
        await delay(400);
        const idx = teacherAssignments.findIndex(a => a.id === Number(id));
        if (idx === -1) throw new Error("Assignment not found");
        teacherAssignments.splice(idx, 1);
        return true;
    },
};
