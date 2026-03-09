/**
 * Service to interact with Google Calendar API
 */

const DAY_ABBR = {
    Monday: "MO", Tuesday: "TU", Wednesday: "WE",
    Thursday: "TH", Friday: "FR", Saturday: "SA", Sunday: "SU",
};

const DAY_INDEX = {
    Sunday: 0, Monday: 1, Tuesday: 2, Wednesday: 3,
    Thursday: 4, Friday: 5, Saturday: 6,
};

/** Parse "9:00 AM - 11:00 AM" → { start: {hour, minute}, end: {hour, minute} } */
function parseTimeSlot(label) {
    const m = label?.match(/(\d{1,2}):(\d{2})\s*(AM|PM)\s*[-–]\s*(\d{1,2}):(\d{2})\s*(AM|PM)/i);
    if (!m) return null;
    const to24 = (h, min, ampm) => {
        let hour = parseInt(h, 10);
        if (ampm.toUpperCase() === "PM" && hour !== 12) hour += 12;
        if (ampm.toUpperCase() === "AM" && hour === 12) hour = 0;
        return { hour, minute: parseInt(min, 10) };
    };
    return { start: to24(m[1], m[2], m[3]), end: to24(m[4], m[5], m[6]) };
}

/** Get the base date for the event from firstClassDate or the next occurrence of dayName */
function getBaseDate(session) {
    if (session.firstClassDate) {
        const d = new Date(session.firstClassDate);
        if (!isNaN(d)) return d;
    }
    const today = new Date();
    const target = DAY_INDEX[session.dayName] ?? 1;
    const diff = (target - today.getDay() + 7) % 7 || 7;
    const d = new Date(today);
    d.setDate(today.getDate() + diff);
    return d;
}

/**
 * Create a recurring weekly Google Calendar event for a tutoring session.
 *
 * @param {string} accessToken - Google OAuth access token (calendar.events scope)
 * @param {object} session     - Session object from TeacherSchedule or StudentSchedule
 */
export async function createGoogleCalendarEvent(accessToken, session) {
    const times = parseTimeSlot(session.timeSlotLabel);
    const base = getBaseDate(session);

    const start = new Date(base);
    const end = new Date(base);
    if (times) {
        start.setHours(times.start.hour, times.start.minute, 0, 0);
        end.setHours(times.end.hour, times.end.minute, 0, 0);
    } else {
        start.setHours(9, 0, 0, 0);
        end.setHours(10, 0, 0, 0);
    }

    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
    const rruleDayAbbr = DAY_ABBR[session.dayName];
    const recurrence = rruleDayAbbr ? [`RRULE:FREQ=WEEKLY;BYDAY=${rruleDayAbbr}`] : undefined;

    const who = session.assignedTeacherName
        ? `Teacher: ${session.assignedTeacherName}`
        : session.studentName
        ? `Student: ${session.studentName}`
        : "";
    const location = [session.buildingName, session.roomName].filter(Boolean).join(", ");

    const event = {
        summary: `Tutoring: ${session.subjectName || "Session"}`,
        ...(location ? { location } : {}),
        description: [who, "Created via NexUs Portal"].filter(Boolean).join("\n"),
        start: { dateTime: start.toISOString(), timeZone: tz },
        end: { dateTime: end.toISOString(), timeZone: tz },
        ...(recurrence ? { recurrence } : {}),
    };

    const response = await fetch(
        "https://www.googleapis.com/calendar/v3/calendars/primary/events",
        {
            method: "POST",
            headers: {
                Authorization: `Bearer ${accessToken}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify(event),
        }
    );

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error?.message || "Failed to create Google Calendar event");
    }

    return response.json();
}
