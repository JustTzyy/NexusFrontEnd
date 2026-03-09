import { useEffect, useMemo, useState, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { tutoringRequestService } from "../../services/tutoringRequestService";
import AppLayout from "../../layouts/AppLayout";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import {
    CalendarDays, Clock, CheckCircle2, AlertCircle,
    BookOpen, User, DoorOpen, ChevronRight, Calendar, CalendarCheck, CalendarPlus
} from "lucide-react";
import { useTeacherAssignment } from "@/hooks/useTeacherAssignment";
import SetupRequiredState from "@/components/SetupRequiredState";
import { useGoogleLogin } from "@react-oauth/google";
import { toast } from "sonner";
import { createGoogleCalendarEvent } from "../../services/googleCalendarService";

const DAY_ORDER = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
const DAY_SHORT  = { Monday: "Mon", Tuesday: "Tue", Wednesday: "Wed", Thursday: "Thu", Friday: "Fri", Saturday: "Sat", Sunday: "Sun" };

const getTodayName = () => {
    const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
    return days[new Date().getDay()];
};

const STATUS_STYLE = {
    "Confirmed": {
        dot:        "bg-emerald-400",
        leftBorder: "border-l-emerald-400",
        timeCls:    "text-emerald-600",
        badgeCls:   "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200",
        label:      "Confirmed",
    },
    "Waiting for Teacher Approval": {
        dot:        "bg-purple-400",
        leftBorder: "border-l-purple-400",
        timeCls:    "text-purple-600",
        badgeCls:   "bg-purple-50 text-purple-700 ring-1 ring-purple-200",
        label:      "Needs Approval",
    },
};

const FALLBACK_STYLE = STATUS_STYLE["Confirmed"];

const formatFirstClassDate = (dateStr) => {
    if (!dateStr) return null;
    const d = new Date(dateStr);
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
};

export default function TeacherSchedule() {
    const navigate  = useNavigate();
    const todayName = useMemo(() => getTodayName(), []);
    const { hasAssignment, loading: assignmentLoading } = useTeacherAssignment();

    const [sessions, setSessions] = useState([]);
    const [loading,  setLoading]  = useState(true);

    const pendingSessionRef = useRef(null);
    const [calendarLoadingId, setCalendarLoadingId] = useState(null);

    const googleCalendarLogin = useGoogleLogin({
        scope: "https://www.googleapis.com/auth/calendar.events",
        onSuccess: async (tokenResponse) => {
            const session = pendingSessionRef.current;
            if (!session) return;
            try {
                await createGoogleCalendarEvent(tokenResponse.access_token, session);
                toast.success(`"${session.subjectName}" added to Google Calendar`);
            } catch (err) {
                toast.error(err.message || "Failed to add to Google Calendar");
            } finally {
                setCalendarLoadingId(null);
                pendingSessionRef.current = null;
            }
        },
        onError: () => {
            toast.error("Google Calendar authorization failed");
            setCalendarLoadingId(null);
            pendingSessionRef.current = null;
        },
    });

    const handleAddToCalendar = useCallback((session) => {
        pendingSessionRef.current = session;
        setCalendarLoadingId(session.id);
        googleCalendarLogin();
    }, [googleCalendarLogin]);

    const loadSchedule = useCallback(async () => {
        setLoading(true);
        try {
            const res  = await tutoringRequestService.getMyInterests({ pageSize: 500 });
            const data = res.data?.data || res.data;
            const all  = data?.items || [];

            const scheduled = all.filter(s =>
                (s.status === "Confirmed" || s.status === "Waiting for Teacher Approval") &&
                s.dayName &&
                s.timeSlotLabel
            );
            setSessions(scheduled);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        if (!assignmentLoading && hasAssignment !== false) loadSchedule();
    }, [loadSchedule, assignmentLoading, hasAssignment]);

    // Group by day, sorted by time within each day
    const byDay = useMemo(() => {
        const map = {};
        DAY_ORDER.forEach(d => { map[d] = []; });
        sessions.forEach(s => {
            if (s.dayName && map[s.dayName]) map[s.dayName].push(s);
        });
        DAY_ORDER.forEach(d =>
            map[d].sort((a, b) => (a.timeSlotLabel || "").localeCompare(b.timeSlotLabel || ""))
        );
        return map;
    }, [sessions]);

    const stats = useMemo(() => ({
        total:        sessions.length,
        confirmed:    sessions.filter(s => s.status === "Confirmed").length,
        needsApproval:sessions.filter(s => s.status === "Waiting for Teacher Approval").length,
        activeDays:   DAY_ORDER.filter(d => byDay[d]?.length > 0).length,
    }), [sessions, byDay]);

    return (
        <AppLayout title="My Schedule">
            {assignmentLoading ? (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {[...Array(4)].map((_, i) => (
                        <div key={i} className="h-20 rounded-xl border border-gray-200 bg-gray-50 animate-pulse" />
                    ))}
                </div>
            ) : hasAssignment === false ? (
                <SetupRequiredState />
            ) : (
            <div className="space-y-6">

                {/* ── Page header ── */}
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">My Weekly Schedule</h1>
                    <p className="mt-1 text-sm text-gray-600">
                        Your confirmed and pending sessions organised by day
                    </p>
                </div>

                {/* ── Stats row ── */}
                {loading ? (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        {[...Array(4)].map((_, i) => (
                            <div key={i} className="h-20 rounded-xl border border-gray-200 bg-gray-50 animate-pulse" />
                        ))}
                    </div>
                ) : (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        <StatCard
                            icon={<CalendarDays className="h-5 w-5 text-indigo-500" />}
                            label="Total Sessions"
                            value={stats.total}
                            bg="bg-indigo-50"
                        />
                        <StatCard
                            icon={<Calendar className="h-5 w-5 text-sky-500" />}
                            label="Active Days"
                            value={stats.activeDays}
                            bg="bg-sky-50"
                        />
                        <StatCard
                            icon={<CheckCircle2 className="h-5 w-5 text-emerald-500" />}
                            label="Confirmed"
                            value={stats.confirmed}
                            bg="bg-emerald-50"
                        />
                        <StatCard
                            icon={<AlertCircle className="h-5 w-5 text-purple-500" />}
                            label="Needs Approval"
                            value={stats.needsApproval}
                            bg="bg-purple-50"
                        />
                    </div>
                )}

                {/* ── Legend ── */}
                <div className="flex items-center gap-5 text-xs text-gray-500">
                    <div className="flex items-center gap-1.5">
                        <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 inline-block" />
                        Confirmed
                    </div>
                    <div className="flex items-center gap-1.5">
                        <span className="w-2.5 h-2.5 rounded-full bg-purple-400 inline-block" />
                        Needs Approval
                    </div>
                    <div className="flex items-center gap-1.5">
                        <span className="w-3 h-3 rounded-sm bg-indigo-600 inline-block" />
                        Today
                    </div>
                </div>

                {/* ── Weekly rows ── */}
                {loading ? (
                    <div className="border rounded-xl overflow-hidden bg-white divide-y divide-gray-100">
                        {DAY_ORDER.map(d => (
                            <div key={d} className="flex items-center gap-4 px-4 py-3">
                                <div className="w-28 h-8 bg-gray-100 rounded animate-pulse flex-shrink-0" />
                                <div className="flex-1 h-8 bg-gray-50 rounded animate-pulse" />
                            </div>
                        ))}
                    </div>
                ) : sessions.length === 0 ? (
                    <div className="border rounded-xl py-24 text-center bg-white">
                        <BookOpen className="h-12 w-12 text-gray-200 mx-auto mb-3" />
                        <p className="font-semibold text-gray-500">No scheduled sessions yet</p>
                        <p className="text-sm text-gray-400 mt-1">
                            Confirmed and pending-approval sessions will appear here
                        </p>
                        <Button
                            variant="outline"
                            size="sm"
                            className="mt-4"
                            onClick={() => navigate("/my-interests")}
                        >
                            View My Interests
                        </Button>
                    </div>
                ) : (
                    <div className="border rounded-xl overflow-hidden bg-white divide-y divide-gray-100">
                        {DAY_ORDER.map(day => {
                            const daySessions = byDay[day];
                            const isToday     = day === todayName;
                            const hasItems    = daySessions.length > 0;

                            return (
                                <div
                                    key={day}
                                    className={`flex items-stretch min-h-[64px] ${
                                        isToday ? "bg-indigo-50/60" : "bg-white"
                                    }`}
                                >
                                    {/* ── Day label cell ── */}
                                    <div className={`w-32 flex-shrink-0 flex flex-col items-center justify-center gap-0.5 border-r px-3 py-3 ${
                                        isToday ? "bg-indigo-600 border-indigo-500" : hasItems ? "bg-gray-800 border-gray-700" : "bg-gray-50 border-gray-100"
                                    }`}>
                                        <p className={`text-[10px] font-bold uppercase tracking-widest leading-none ${
                                            isToday ? "text-indigo-200" : hasItems ? "text-gray-400" : "text-gray-400"
                                        }`}>
                                            {DAY_SHORT[day]}
                                        </p>
                                        <p className={`text-sm font-bold leading-tight ${
                                            isToday ? "text-white" : hasItems ? "text-white" : "text-gray-400"
                                        }`}>
                                            {day}
                                        </p>
                                        {hasItems && (
                                            <span className={`mt-1 text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                                                isToday ? "bg-white/20 text-white" : "bg-white/10 text-gray-300"
                                            }`}>
                                                {daySessions.length} {daySessions.length === 1 ? "session" : "sessions"}
                                            </span>
                                        )}
                                    </div>

                                    {/* ── Sessions row ── */}
                                    <div className="flex-1 flex flex-wrap items-center gap-2 px-4 py-3">
                                        {!hasItems ? (
                                            <p className="text-xs text-gray-300 font-medium select-none italic">Free</p>
                                        ) : (
                                            daySessions.map(session => {
                                                const st = STATUS_STYLE[session.status] || FALLBACK_STYLE;
                                                return (
                                                    <div key={session.id} className="flex items-start gap-1">
                                                    <Tooltip>
                                                        <TooltipTrigger asChild>
                                                            <button
                                                                className={`group text-left border-l-2 ${st.leftBorder} pl-2.5 pr-3 py-2 rounded-r-xl bg-gray-50 hover:bg-gray-100 active:bg-gray-200 transition-colors shadow-sm min-w-[160px] max-w-[220px]`}
                                                                onClick={() => navigate(`/teacher-interest/${session.id}`, {
                                                                    state: { from: session.isAdminCreated ? "my-admin-schedules" : "my-interests" }
                                                                })}
                                                            >
                                                                {/* Subject + dot */}
                                                                <div className="flex items-start justify-between gap-1">
                                                                    <p className="text-xs font-bold text-gray-800 leading-tight line-clamp-1 flex-1">
                                                                        {session.subjectName}
                                                                    </p>
                                                                    <span className={`flex-shrink-0 w-1.5 h-1.5 rounded-full mt-0.5 ${st.dot}`} />
                                                                </div>

                                                                {/* Time */}
                                                                <div className={`flex items-center gap-0.5 mt-0.5 ${st.timeCls}`}>
                                                                    <Clock className="h-2.5 w-2.5 flex-shrink-0" />
                                                                    <p className="text-[10px] font-semibold leading-none">{session.timeSlotLabel}</p>
                                                                </div>

                                                                {/* First class date (confirmed only) */}
                                                                {session.status === "Confirmed" && session.firstClassDate && (
                                                                    <div className="flex items-center gap-0.5 mt-0.5 text-emerald-700">
                                                                        <CalendarCheck className="h-2.5 w-2.5 flex-shrink-0" />
                                                                        <p className="text-[10px] font-semibold leading-none">
                                                                            Starts {formatFirstClassDate(session.firstClassDate)}
                                                                        </p>
                                                                    </div>
                                                                )}

                                                                {/* Student + Room inline */}
                                                                <div className="flex items-center gap-2 mt-1">
                                                                    {session.studentName ? (
                                                                        <div className="flex items-center gap-0.5 text-gray-400 min-w-0">
                                                                            <User className="h-2.5 w-2.5 flex-shrink-0" />
                                                                            <p className="text-[10px] truncate leading-none">{session.studentName}</p>
                                                                        </div>
                                                                    ) : (
                                                                        <p className="text-[10px] text-gray-300 leading-none italic">No student</p>
                                                                    )}
                                                                    {session.roomName && (
                                                                        <div className="flex items-center gap-0.5 text-gray-400 flex-shrink-0">
                                                                            <DoorOpen className="h-2.5 w-2.5" />
                                                                            <p className="text-[10px] leading-none truncate max-w-[60px]">{session.roomName}</p>
                                                                        </div>
                                                                    )}
                                                                </div>

                                                                {/* Source + arrow */}
                                                                <div className="mt-1.5 flex items-center justify-between">
                                                                    <span className={`text-[9px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded-full ${
                                                                        session.isAdminCreated ? "bg-indigo-50 text-indigo-500" : "bg-sky-50 text-sky-500"
                                                                    }`}>
                                                                        {session.isAdminCreated ? "Admin" : "Student"}
                                                                    </span>
                                                                    <ChevronRight className="h-3 w-3 text-gray-300 group-hover:text-gray-500 transition-colors" />
                                                                </div>
                                                            </button>
                                                        </TooltipTrigger>
                                                        <TooltipContent side="top" className="max-w-[220px]">
                                                            <div className="space-y-1 text-xs">
                                                                <p className="font-semibold text-sm">{session.subjectName}</p>
                                                                <p className="flex items-center gap-1 text-gray-400">
                                                                    <Clock className="h-3 w-3" /> {session.timeSlotLabel}
                                                                </p>
                                                                {session.studentName && (
                                                                    <p className="flex items-center gap-1 text-gray-400">
                                                                        <User className="h-3 w-3" /> {session.studentName}
                                                                    </p>
                                                                )}
                                                                {session.roomName && (
                                                                    <p className="flex items-center gap-1 text-gray-400">
                                                                        <DoorOpen className="h-3 w-3" /> {session.roomName}
                                                                    </p>
                                                                )}
                                                                {session.buildingName && (
                                                                    <p className="flex items-center gap-1 text-gray-400">
                                                                        <BookOpen className="h-3 w-3" /> {session.buildingName}
                                                                    </p>
                                                                )}
                                                                {session.status === "Confirmed" && session.firstClassDate && (
                                                                    <p className="flex items-center gap-1 text-emerald-600 font-medium">
                                                                        <CalendarCheck className="h-3 w-3" /> First class: {formatFirstClassDate(session.firstClassDate)}
                                                                    </p>
                                                                )}
                                                                <span className={`inline-block px-1.5 py-0.5 rounded-full text-[10px] font-semibold ${st.badgeCls}`}>
                                                                    {st.label}
                                                                </span>
                                                            </div>
                                                        </TooltipContent>
                                                    </Tooltip>
                                                    {session.status === "Confirmed" && (
                                                        <Tooltip>
                                                            <TooltipTrigger asChild>
                                                                <button
                                                                    className="flex-shrink-0 self-center p-1.5 rounded-lg text-gray-400 hover:text-[#1a73e8] hover:bg-blue-50 transition-colors disabled:opacity-50"
                                                                    onClick={() => handleAddToCalendar(session)}
                                                                    disabled={calendarLoadingId === session.id}
                                                                    title="Add to Google Calendar"
                                                                >
                                                                    {calendarLoadingId === session.id ? (
                                                                        <span className="block h-3.5 w-3.5 rounded-full border-2 border-[#1a73e8] border-t-transparent animate-spin" />
                                                                    ) : (
                                                                        <CalendarPlus className="h-3.5 w-3.5" />
                                                                    )}
                                                                </button>
                                                            </TooltipTrigger>
                                                            <TooltipContent side="top"><p className="text-xs">Add to Google Calendar</p></TooltipContent>
                                                        </Tooltip>
                                                    )}
                                                    </div>
                                                );
                                            })
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
            )}
        </AppLayout>
    );
}

function StatCard({ icon, label, value, bg }) {
    return (
        <div className="rounded-xl border border-gray-200 bg-white p-4 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
                <div className={`${bg} rounded-lg p-2 flex-shrink-0`}>
                    {icon}
                </div>
                <p className="text-xs text-gray-500">{label}</p>
            </div>
            <p className="text-2xl font-bold text-gray-900 leading-none">{value}</p>
        </div>
    );
}
