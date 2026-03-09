import { mockSubjects, departments, getNextId } from "./mockData";

const delay = (ms = 300) => new Promise((r) => setTimeout(r, ms));

// Full subjects store with all fields (the mockSubjects in mockData.js is simplified for references)
// We'll enrich them here
const subjects = [
    { id: 1, name: "Data Structures", departmentId: 1, departmentName: "Information Technology", description: "Study of data organization and algorithms", isActive: true, createdAt: "2026-01-15", updatedAt: "2026-01-15", deletedAt: null },
    { id: 2, name: "Web Development", departmentId: 1, departmentName: "Information Technology", description: "Frontend and backend web technologies", isActive: true, createdAt: "2026-01-15", updatedAt: "2026-01-15", deletedAt: null },
    { id: 3, name: "Calculus", departmentId: 2, departmentName: "Science, Technology, Engineering, and Mathematics", description: "Differential and integral calculus", isActive: true, createdAt: "2026-01-16", updatedAt: "2026-01-16", deletedAt: null },
    { id: 4, name: "Physics", departmentId: 2, departmentName: "Science, Technology, Engineering, and Mathematics", description: "Mechanics, thermodynamics, and electromagnetism", isActive: true, createdAt: "2026-01-16", updatedAt: "2026-01-16", deletedAt: null },
    { id: 5, name: "Accounting", departmentId: 3, departmentName: "Accountancy, Business, and Management", description: "Financial accounting principles and practices", isActive: true, createdAt: "2026-01-17", updatedAt: "2026-01-17", deletedAt: null },
    { id: 6, name: "Business Ethics", departmentId: 3, departmentName: "Accountancy, Business, and Management", description: "Ethical principles in business operations", isActive: false, createdAt: "2026-01-17", updatedAt: "2026-01-20", deletedAt: null },
    { id: 7, name: "Philippine Literature", departmentId: 4, departmentName: "Humanities and Social Sciences", description: "Study of Filipino literary works and traditions", isActive: true, createdAt: "2026-01-18", updatedAt: "2026-01-18", deletedAt: null },
    { id: 8, name: "Sociology", departmentId: 4, departmentName: "Humanities and Social Sciences", description: "Study of society, social institutions, and relationships", isActive: true, createdAt: "2026-01-18", updatedAt: "2026-01-18", deletedAt: null },
    { id: 9, name: "Mathematics", departmentId: 2, departmentName: "Science, Technology, Engineering, and Mathematics", description: "Fundamental math concepts covering algebra and geometry", isActive: true, createdAt: "2026-01-20", updatedAt: "2026-01-20", deletedAt: null },
    { id: 10, name: "English", departmentId: 4, departmentName: "Humanities and Social Sciences", description: "Language and literature studies", isActive: true, createdAt: "2026-01-22", updatedAt: "2026-01-22", deletedAt: null },
];

export const subjectMockService = {
    async getAll() {
        await delay();
        return subjects.filter((s) => !s.deletedAt);
    },

    async getById(id) {
        await delay();
        return subjects.find((s) => s.id === Number(id) && !s.deletedAt) || null;
    },

    async getArchived() {
        await delay();
        return subjects.filter((s) => s.deletedAt);
    },

    async getByDepartmentId(departmentId) {
        await delay();
        return subjects.filter((s) => s.departmentId === Number(departmentId) && !s.deletedAt);
    },

    async create(data) {
        await delay(500);
        const dept = departments.find((d) => d.id === Number(data.departmentId));
        const newSubject = {
            id: getNextId(),
            name: data.name,
            departmentId: Number(data.departmentId),
            departmentName: dept?.name || "",
            description: data.description || "",
            isActive: data.isActive,
            createdAt: new Date().toISOString().split("T")[0],
            updatedAt: new Date().toISOString().split("T")[0],
            deletedAt: null,
        };
        subjects.push(newSubject);
        return newSubject;
    },

    async update(id, data) {
        await delay(500);
        const idx = subjects.findIndex((s) => s.id === Number(id));
        if (idx === -1) throw new Error("Subject not found");
        const dept = departments.find((d) => d.id === Number(data.departmentId));
        subjects[idx] = {
            ...subjects[idx],
            ...data,
            departmentId: Number(data.departmentId),
            departmentName: dept?.name || subjects[idx].departmentName,
            updatedAt: new Date().toISOString().split("T")[0],
        };
        return subjects[idx];
    },

    async delete(id) {
        await delay();
        const idx = subjects.findIndex((s) => s.id === Number(id));
        if (idx === -1) throw new Error("Subject not found");
        subjects[idx].deletedAt = new Date().toISOString().split("T")[0];
        return subjects[idx];
    },

    async restore(id) {
        await delay();
        const idx = subjects.findIndex((s) => s.id === Number(id));
        if (idx === -1) throw new Error("Subject not found");
        subjects[idx].deletedAt = null;
        return subjects[idx];
    },

    async permanentDelete(id) {
        await delay();
        const idx = subjects.findIndex((s) => s.id === Number(id));
        if (idx === -1) throw new Error("Subject not found");
        subjects.splice(idx, 1);
    },

    getDepartments() {
        return departments.filter((d) => !d.deletedAt && d.isActive);
    },
};
