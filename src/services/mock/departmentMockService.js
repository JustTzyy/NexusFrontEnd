import { departments, getNextId } from "./mockData";

const delay = (ms = 400) => new Promise(r => setTimeout(r, ms));

export const departmentMockService = {
    getAll: async () => {
        await delay();
        return departments.filter(d => !d.deletedAt);
    },

    getById: async (id) => {
        await delay();
        return departments.find(d => d.id === Number(id) && !d.deletedAt) || null;
    },

    getArchived: async () => {
        await delay();
        return departments.filter(d => d.deletedAt);
    },

    create: async (data) => {
        await delay(600);
        const newDept = {
            id: getNextId(),
            ...data,
            isActive: data.isActive !== false,
            createdAt: new Date().toISOString().split("T")[0],
            updatedAt: new Date().toISOString().split("T")[0],
            deletedAt: null,
        };
        departments.push(newDept);
        return newDept;
    },

    update: async (id, data) => {
        await delay(600);
        const idx = departments.findIndex(d => d.id === Number(id));
        if (idx === -1) throw new Error("Department not found");
        departments[idx] = { ...departments[idx], ...data, updatedAt: new Date().toISOString().split("T")[0] };
        return departments[idx];
    },

    delete: async (id) => {
        await delay(400);
        const idx = departments.findIndex(d => d.id === Number(id));
        if (idx === -1) throw new Error("Department not found");
        departments[idx].deletedAt = new Date().toISOString().split("T")[0];
        return true;
    },

    restore: async (id) => {
        await delay(400);
        const idx = departments.findIndex(d => d.id === Number(id));
        if (idx === -1) throw new Error("Department not found");
        departments[idx].deletedAt = null;
        return true;
    },

    permanentDelete: async (id) => {
        await delay(400);
        const idx = departments.findIndex(d => d.id === Number(id));
        if (idx === -1) throw new Error("Department not found");
        departments.splice(idx, 1);
        return true;
    },
};
