import { graphConfig } from "../authConfig";

/**
 * Helper function to call MS Graph API endpoint 
 * using the authorization bearer token scheme
 */
export async function callMsGraph(accessToken, endpoint = graphConfig.graphMeEndpoint) {
    const headers = new Headers();
    const bearer = `Bearer ${accessToken}`;

    headers.append("Authorization", bearer);

    const options = {
        method: "GET",
        headers: headers
    };

    return fetch(endpoint, options)
        .then(response => response.json())
        .catch(error => console.log(error));
}

export async function createCalendarEvent(accessToken, event) {
    const headers = new Headers();
    const bearer = `Bearer ${accessToken}`;

    headers.append("Authorization", bearer);
    headers.append("Content-Type", "application/json");

    const options = {
        method: "POST",
        headers: headers,
        body: JSON.stringify(event)
    };

    const response = await fetch(graphConfig.graphCalendarEndpoint, options);

    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || "Failed to create event");
    }

    return response.json();
}

/**
 * Format a session into a Microsoft Graph Event object
 */
export function formatSessionToGraphEvent(session) {
    // Example session structure from the app:
    // { subject: "Advanced Calculus", date: "Monday, Feb 10, 2026", time: "09:00 AM - 11:00 AM", ... }

    // Simple date parsing (this might need to be more robust based on real date strings)
    // For now, we assume ISO-like or standard date strings. 
    // In a real app, you'd use a library like date-fns or dayjs.

    // Mock parsing for demonstration:
    const baseDate = new Date(session.date);
    const [startPart, endPart] = session.time.split(" - ");

    return {
        subject: `Tutoring: ${session.subject}`,
        body: {
            contentType: "HTML",
            content: `Tutoring session with ${session.teacher} at ${session.building}, ${session.room}.`
        },
        start: {
            dateTime: new Date(baseDate.setHours(9, 0, 0)).toISOString(), // Placeholder
            timeZone: "Pacific Standard Time"
        },
        end: {
            dateTime: new Date(baseDate.setHours(11, 0, 0)).toISOString(), // Placeholder
            timeZone: "Pacific Standard Time"
        },
        location: {
            displayName: `${session.building}, ${session.room}`
        }
    };
}
