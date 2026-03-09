import { availableTimeSlots, getNextId } from "./mockData";

const delay = (ms = 400) => new Promise(r => setTimeout(r, ms));

const formatTime = (time24) => {
    const [h, m] = time24.split(":");
    const hour = parseInt(h);
    const ampm = hour >= 12 ? "PM" : "AM";
    const hour12 = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
    return `${hour12}:${m} ${ampm}`;
};

export const timeSlotMockService = {
    getAll: async () => {
        await delay();
        return availableTimeSlots.filter(t => !t.deletedAt).sort((a, b) => a.startTime.localeCompare(b.startTime));
    },

    getById: async (id) => {
        await delay();
        return availableTimeSlots.find(t => t.id === Number(id) && !t.deletedAt) || null;
    },

    getArchived: async () => {
        await delay();
        return availableTimeSlots.filter(t => t.deletedAt);
    },

    create: async (data) => {
        await delay(600);
        const label = data.label || `${formatTime(data.startTime)} - ${formatTime(data.endTime)}`;
        const newSlot = {
            id: getNextId(),
            ...data,
            label,
            isActive: data.isActive !== false,
            createdAt: new Date().toISOString().split("T")[0],
            deletedAt: null,
        };
        availableTimeSlots.push(newSlot);
        return newSlot;
    },

    update: async (id, data) => {
        await delay(600);
        const idx = availableTimeSlots.findIndex(t => t.id === Number(id));
        if (idx === -1) throw new Error("Time slot not found");
        if (data.startTime && data.endTime) {
            data.label = data.label || `${formatTime(data.startTime)} - ${formatTime(data.endTime)}`;
        }
        availableTimeSlots[idx] = { ...availableTimeSlots[idx], ...data };
        return availableTimeSlots[idx];
    },

    delete: async (id) => {
        await delay(400);
        const idx = availableTimeSlots.findIndex(t => t.id === Number(id));
        if (idx === -1) throw new Error("Time slot not found");
        availableTimeSlots[idx].deletedAt = new Date().toISOString().split("T")[0];
        return true;
    },

    restore: async (id) => {
        await delay(400);
        const idx = availableTimeSlots.findIndex(t => t.id === Number(id));
        if (idx === -1) throw new Error("Time slot not found");
        availableTimeSlots[idx].deletedAt = null;
        return true;
    },

    permanentDelete: async (id) => {
        await delay(400);
        const idx = availableTimeSlots.findIndex(t => t.id === Number(id));
        if (idx === -1) throw new Error("Time slot not found");
        availableTimeSlots.splice(idx, 1);
        return true;
    },
};
