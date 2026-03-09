import { availableDays, getNextId } from "./mockData";

const delay = (ms = 400) => new Promise(r => setTimeout(r, ms));

export const availableDayMockService = {
    getAll: async () => {
        await delay();
        return availableDays.filter(d => !d.deletedAt).sort((a, b) => a.sortOrder - b.sortOrder);
    },

    getById: async (id) => {
        await delay();
        return availableDays.find(d => d.id === Number(id) && !d.deletedAt) || null;
    },

    getArchived: async () => {
        await delay();
        return availableDays.filter(d => d.deletedAt);
    },

    create: async (data) => {
        await delay(600);
        const newDay = {
            id: getNextId(),
            ...data,
            isActive: data.isActive !== false,
            createdAt: new Date().toISOString().split("T")[0],
            deletedAt: null,
        };
        availableDays.push(newDay);
        return newDay;
    },

    update: async (id, data) => {
        await delay(600);
        const idx = availableDays.findIndex(d => d.id === Number(id));
        if (idx === -1) throw new Error("Day not found");
        availableDays[idx] = { ...availableDays[idx], ...data };
        return availableDays[idx];
    },

    delete: async (id) => {
        await delay(400);
        const idx = availableDays.findIndex(d => d.id === Number(id));
        if (idx === -1) throw new Error("Day not found");
        availableDays[idx].deletedAt = new Date().toISOString().split("T")[0];
        return true;
    },

    restore: async (id) => {
        await delay(400);
        const idx = availableDays.findIndex(d => d.id === Number(id));
        if (idx === -1) throw new Error("Day not found");
        availableDays[idx].deletedAt = null;
        return true;
    },

    permanentDelete: async (id) => {
        await delay(400);
        const idx = availableDays.findIndex(d => d.id === Number(id));
        if (idx === -1) throw new Error("Day not found");
        availableDays.splice(idx, 1);
        return true;
    },
};
