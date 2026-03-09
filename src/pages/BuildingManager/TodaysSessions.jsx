import { useEffect, useRef, useState } from "react";
import { buildingService } from "../../services/buildingService";
import { tutoringRequestService } from "../../services/tutoringRequestService";
import { sessionLogService } from "../../services/sessionLogService";
import AppLayout from "../../layouts/AppLayout";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import {
    AlertCircle, BookOpen, Building2, Calendar, CheckCircle2,
    Clock, Timer, User, ClipboardList, DoorOpen,
} from "lucide-react";

// ─── Helpers ────────────────────────────────────────────────────────────────

const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

function getTodayName() {
    return DAYS[new Date().getDay()];
}

function parseTime(timeStr) {
    if (!timeStr) return null;
    const [h, m] = timeStr.split(":").map(Number);
    const d = new Date();
    d.setHours(h, m, 0, 0);
    return d;
}

function formatDuration(ms) {
    if (ms <= 0) return "0s";
    const totalSec = Math.floor(ms / 1000);
    const h = Math.floor(totalSec / 3600);
    const m = Math.floor((totalSec % 3600) / 60);
    const s = totalSec % 60;
    if (h > 0) return `${h}h ${m}m`;
    if (m > 0) return `${m}m ${s}s`;
    return `${s}s`;
}

function getTimerState(startTime, endTime) {
    const now = new Date();
    const start = parseTime(startTime);
    const end = parseTime(endTime);
    if (!start || !end) return { state: "unknown", label: "No time info" };
    if (now < start) {
        return { state: "upcoming", label: `Starts in ${formatDuration(start - now)}` };
    } else if (now < end) {
        return { state: "running", label: `Running · ${formatDuration(end - now)} left` };
    }
    return { state: "ended", label: "Session ended" };
}

// ─── Sub-components ─────────────────────────────────────────────────────────

function TimerBadge({ startTime, endTime, tick }) {
    // tick is just used to trigger re-render
    void tick;
    const { state, label } = getTimerState(startTime, endTime);
    const cls = {
        upcoming: "bg-blue-50 text-blue-700 ring-1 ring-blue-200",
        running: "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200",
        ended: "bg-gray-100 text-gray-500 ring-1 ring-gray-200",
        unknown: "bg-gray-100 text-gray-500 ring-1 ring-gray-200",
    }[state];

    return (
        <Badge className={`${cls} font-medium text-xs gap-1`}>
            <Timer className="h-3 w-3" />
            {label}
        </Badge>
    );
}

function OutcomeBadge({ outcome }) {
    const map = {
        Completed: "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200",
        Late: "bg-amber-50 text-amber-700 ring-1 ring-amber-200",
        Absent: "bg-red-50 text-red-700 ring-1 ring-red-200",
    };
    return (
        <Badge className={`${map[outcome] ?? "bg-gray-100 text-gray-600 ring-1 ring-gray-200"} font-medium text-xs`}>
            {outcome}
        </Badge>
    );
}

function NoBuildingState() {
    return (
        <div className="flex flex-col items-center justify-center py-20 text-center">
            <Building2 className="h-12 w-12 text-gray-300 mb-4" />
            <h3 className="text-lg font-semibold text-gray-700">No Building Assigned</h3>
            <p className="text-sm text-gray-500 mt-1">You are not currently assigned to any building.</p>
        </div>
    );
}

// ─── Main Page ───────────────────────────────────────────────────────────────

export default function TodaysSessions() {
    const [building, setBuilding] = useState(null);
    const [sessions, setSessions] = useState([]);
    const [logs, setLogs] = useState({}); // keyed by tutoringRequestId
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [tick, setTick] = useState(0);

    // Log dialog state
    const [logDialog, setLogDialog] = useState(null); // { session }
    const [outcome, setOutcome] = useState("Completed");
    const [absentParty, setAbsentParty] = useState("Teacher");
    const [notes, setNotes] = useState("");
    const [submitting, setSubmitting] = useState(false);
    const [submitError, setSubmitError] = useState("");

    // Live timer tick every second
    useEffect(() => {
        const interval = setInterval(() => setTick(t => t + 1), 1000);
        return () => clearInterval(interval);
    }, []);

    // Load data
    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setLoading(true);
        setError("");
        try {
            const buildingRes = await buildingService.getMy();
            const myBuilding = buildingRes.data ?? null;
            if (!myBuilding) {
                setBuilding(null);
                return;
            }
            setBuilding(myBuilding);

            const today = getTodayName();
            const reqRes = await tutoringRequestService.getAll({ pageNumber: 1, pageSize: 500 });
            const all = reqRes.data?.items ?? [];
            const todaySessions = all.filter(
                s => s.buildingName === myBuilding.name &&
                    s.status === "Confirmed" &&
                    s.dayName === today
            );
            setSessions(todaySessions);

            // Load logs for each session
            const logsMap = {};
            await Promise.all(
                todaySessions.map(async (s) => {
                    try {
                        const res = await sessionLogService.getByRequest(s.id);
                        const todayLogs = (res.data ?? []).filter(log => {
                            const logDate = new Date(log.sessionDate);
                            const now = new Date();
                            return (
                                logDate.getFullYear() === now.getFullYear() &&
                                logDate.getMonth() === now.getMonth() &&
                                logDate.getDate() === now.getDate()
                            );
                        });
                        logsMap[s.id] = todayLogs[0] ?? null;
                    } catch {
                        logsMap[s.id] = null;
                    }
                })
            );
            setLogs(logsMap);
        } catch (err) {
            setError(err?.message || "Failed to load today's sessions");
        } finally {
            setLoading(false);
        }
    };

    const openLogDialog = (session) => {
        setLogDialog({ session });
        setOutcome("Completed");
        setAbsentParty("Teacher");
        setNotes("");
        setSubmitError("");
    };

    const handleSubmitLog = async () => {
        setSubmitting(true);
        setSubmitError("");
        try {
            const today = new Date();
            today.setHours(12, 0, 0, 0); // noon local to avoid timezone date shifts
            const res = await sessionLogService.create({
                tutoringRequestId: logDialog.session.id,
                sessionDate: today.toISOString(),
                outcome,
                absentParty: outcome === "Completed" ? null : absentParty,
                notes: notes.trim() || null,
            });
            setLogs(prev => ({ ...prev, [logDialog.session.id]: res.data }));
            setLogDialog(null);
        } catch (err) {
            setSubmitError(err?.message || "Failed to save session log");
        } finally {
            setSubmitting(false);
        }
    };

    const canLog = (session) => {
        const { state } = getTimerState(session.startTime, session.endTime);
        return state === "running" || state === "ended";
    };

    return (
        <AppLayout title="Today's Sessions">
            <div className="space-y-6">
                {/* Page header */}
                <div className="flex items-start justify-between gap-4">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900">Today's Sessions</h1>
                        <p className="mt-1 text-sm text-gray-600">
                            {new Date().toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
                            {building && <> &mdash; {building.name}</>}
                        </p>
                    </div>
                    {!loading && sessions.length > 0 && (
                        <Badge className="bg-gray-100 text-gray-600 ring-1 ring-gray-200 font-medium">
                            {sessions.length} session{sessions.length !== 1 ? "s" : ""}
                        </Badge>
                    )}
                </div>

                {error && (
                    <Alert variant="destructive">
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription>{error}</AlertDescription>
                    </Alert>
                )}

                {loading ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {Array.from({ length: 4 }).map((_, i) => (
                            <div key={i} className="border rounded-lg p-5 bg-white space-y-3">
                                <Skeleton className="h-5 w-40" />
                                <Skeleton className="h-4 w-56" />
                                <Skeleton className="h-4 w-48" />
                                <Skeleton className="h-4 w-32" />
                                <div className="flex gap-2 pt-1">
                                    <Skeleton className="h-6 w-28" />
                                    <Skeleton className="h-6 w-24" />
                                </div>
                            </div>
                        ))}
                    </div>
                ) : !building ? (
                    <NoBuildingState />
                ) : sessions.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 text-center border rounded-lg bg-white">
                        <Calendar className="h-12 w-12 text-gray-300 mb-4" />
                        <h3 className="text-lg font-semibold text-gray-700">No Sessions Today</h3>
                        <p className="text-sm text-gray-500 mt-1">
                            There are no confirmed sessions scheduled for {getTodayName()}.
                        </p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {sessions.map(session => {
                            const todayLog = logs[session.id];
                            const logged = !!todayLog;
                            const { state } = getTimerState(session.startTime, session.endTime);

                            return (
                                <div key={session.id} className="border rounded-lg bg-white overflow-hidden hover:shadow-sm transition-shadow">
                                    {/* Card top bar — color by timer state */}
                                    <div className={`h-1 ${state === "running" ? "bg-emerald-400" : state === "upcoming" ? "bg-blue-400" : "bg-gray-200"}`} />

                                    <div className="p-5 space-y-3">
                                        {/* Subject */}
                                        <div className="flex items-start justify-between gap-2">
                                            <div className="flex items-center gap-2">
                                                <BookOpen className="h-4 w-4 text-gray-400 shrink-0" />
                                                <span className="font-semibold text-gray-900">{session.subjectName ?? "—"}</span>
                                            </div>
                                            {logged && <OutcomeBadge outcome={todayLog.outcome} />}
                                        </div>

                                        {/* Room · Time */}
                                        <div className="flex flex-wrap gap-3 text-sm text-gray-600">
                                            {session.roomName && (
                                                <span className="flex items-center gap-1">
                                                    <DoorOpen className="h-3.5 w-3.5 text-gray-400" />
                                                    {session.roomName}
                                                </span>
                                            )}
                                            <span className="flex items-center gap-1">
                                                <Clock className="h-3.5 w-3.5 text-gray-400" />
                                                {session.timeSlotLabel ?? "—"}
                                            </span>
                                        </div>

                                        {/* Teacher · Student */}
                                        <div className="flex flex-wrap gap-3 text-sm text-gray-600">
                                            <span className="flex items-center gap-1">
                                                <User className="h-3.5 w-3.5 text-gray-400" />
                                                {session.assignedTeacherName ?? <span className="italic text-gray-400">Unassigned</span>}
                                            </span>
                                            <span className="flex items-center gap-1">
                                                <User className="h-3.5 w-3.5 text-gray-400" />
                                                {session.studentName ?? <span className="italic text-gray-400">Open seat</span>}
                                            </span>
                                        </div>

                                        {/* Timer + Log action */}
                                        <div className="flex items-center justify-between gap-2 pt-1">
                                            <TimerBadge startTime={session.startTime} endTime={session.endTime} tick={tick} />
                                            {!logged ? (
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    disabled={!canLog(session)}
                                                    onClick={() => openLogDialog(session)}
                                                    className="text-xs gap-1"
                                                >
                                                    <ClipboardList className="h-3.5 w-3.5" />
                                                    Log Session
                                                </Button>
                                            ) : (
                                                <div className="flex items-center gap-1 text-xs text-gray-500">
                                                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                                                    Logged
                                                </div>
                                            )}
                                        </div>

                                        {/* Absent party note */}
                                        {logged && todayLog.absentParty && (
                                            <p className="text-xs text-gray-500 border-t pt-2">
                                                Absent: <span className="font-medium text-gray-700">{todayLog.absentParty}</span>
                                                {todayLog.notes && <> &mdash; {todayLog.notes}</>}
                                            </p>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* Log Session Dialog */}
            <Dialog open={!!logDialog} onOpenChange={(open) => !open && setLogDialog(null)}>
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle>Log Session</DialogTitle>
                        <DialogDescription>
                            Record what happened for <span className="font-semibold">{logDialog?.session?.subjectName}</span> today.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-5 py-2">
                        {submitError && (
                            <Alert variant="destructive">
                                <AlertCircle className="h-4 w-4" />
                                <AlertDescription>{submitError}</AlertDescription>
                            </Alert>
                        )}

                        {/* Outcome */}
                        <div className="space-y-2">
                            <Label className="text-sm font-medium">Outcome</Label>
                            <RadioGroup value={outcome} onValueChange={setOutcome} className="flex gap-4">
                                {["Completed", "Late", "Absent"].map(o => (
                                    <div key={o} className="flex items-center gap-2">
                                        <RadioGroupItem value={o} id={`outcome-${o}`} />
                                        <Label htmlFor={`outcome-${o}`} className="font-normal cursor-pointer">{o}</Label>
                                    </div>
                                ))}
                            </RadioGroup>
                        </div>

                        {/* Absent party — only when not completed */}
                        {outcome !== "Completed" && (
                            <div className="space-y-2">
                                <Label className="text-sm font-medium">Who was absent?</Label>
                                <RadioGroup value={absentParty} onValueChange={setAbsentParty} className="flex gap-4">
                                    {["Teacher", "Student", "Both"].map(p => (
                                        <div key={p} className="flex items-center gap-2">
                                            <RadioGroupItem value={p} id={`party-${p}`} />
                                            <Label htmlFor={`party-${p}`} className="font-normal cursor-pointer">{p}</Label>
                                        </div>
                                    ))}
                                </RadioGroup>
                            </div>
                        )}

                        {/* Notes */}
                        <div className="space-y-2">
                            <Label htmlFor="log-notes" className="text-sm font-medium">Notes <span className="text-gray-400 font-normal">(optional)</span></Label>
                            <Textarea
                                id="log-notes"
                                placeholder="Any additional notes..."
                                value={notes}
                                onChange={e => setNotes(e.target.value)}
                                rows={3}
                                maxLength={1000}
                            />
                        </div>
                    </div>

                    <DialogFooter>
                        <Button variant="outline" onClick={() => setLogDialog(null)} disabled={submitting}>Cancel</Button>
                        <Button onClick={handleSubmitLog} disabled={submitting}>
                            {submitting ? "Saving..." : "Save Log"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </AppLayout>
    );
}
