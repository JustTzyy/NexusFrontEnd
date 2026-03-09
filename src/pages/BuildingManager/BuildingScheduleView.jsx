import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import AppLayout from "../../layouts/AppLayout";
import { tutoringRequestService } from "../../services/tutoringRequestService";
import { DetailViewSkeleton } from "../../utils/skeletonLoaders";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
    ArrowLeft, AlertCircle, Calendar, Clock, DoorOpen,
    BookOpen, User, Users, CalendarDays, FileText, Tag,
} from "lucide-react";

const DAY_ORDER = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

const STATUS_TEXT = {
    "Confirmed": "text-green-700",
    "Waiting for Teacher Approval": "text-purple-700",
    "WaitingForTeacherApproval": "text-purple-700",
    "Pending": "text-amber-700",
    "Scheduled": "text-blue-700",
    "Cancelled": "text-red-700",
};

function getStatusLabel(status) {
    if (status === "WaitingForTeacherApproval") return "Awaiting Approval";
    return status ?? "—";
}

const formatDateTime = (dateString) => {
    if (!dateString) return "—";
    return new Date(dateString).toLocaleString("en-US", {
        year: "numeric", month: "short", day: "numeric",
        hour: "2-digit", minute: "2-digit",
    });
};

export default function BuildingScheduleView() {
    const navigate = useNavigate();
    const { id } = useParams();

    const [session, setSession] = useState(null);
    const [relatedSessions, setRelatedSessions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [relatedLoading, setRelatedLoading] = useState(false);
    const [error, setError] = useState("");

    const goBack = () => navigate("/my-building/schedule");

    const loadSession = async () => {
        setLoading(true);
        setError("");
        try {
            const res = await tutoringRequestService.getById(id);
            const data = res.data;
            if (!data) throw new Error("Session not found");
            setSession(data);
        } catch (err) {
            setError(err?.message || "Failed to load session details.");
        } finally {
            setLoading(false);
        }
    };

    const loadRelated = async (roomName, currentId) => {
        setRelatedLoading(true);
        try {
            const res = await tutoringRequestService.getAll({ pageNumber: 1, pageSize: 500 });
            const all = res.data?.items ?? [];
            const related = all
                .filter(s => s.roomName === roomName && s.id !== Number(currentId))
                .sort((a, b) => DAY_ORDER.indexOf(a.dayName) - DAY_ORDER.indexOf(b.dayName));
            setRelatedSessions(related);
        } catch {
            // supplementary — silently fail
        } finally {
            setRelatedLoading(false);
        }
    };

    useEffect(() => {
        loadSession();
    }, [id]);

    useEffect(() => {
        if (session?.roomName) loadRelated(session.roomName, id);
    }, [session?.roomName]);

    return (
        <AppLayout title="Session Details">
            <div className="space-y-6">
                {error && (
                    <Alert variant="destructive">
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription>{error}</AlertDescription>
                    </Alert>
                )}

                {loading ? (
                    <DetailViewSkeleton fields={6} />
                ) : session ? (
                    <div className="space-y-6">
                        {/* Page header */}
                        <div className="flex items-start gap-3">
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <Button variant="outline" size="icon" onClick={goBack}>
                                        <ArrowLeft className="h-4 w-4" />
                                    </Button>
                                </TooltipTrigger>
                                <TooltipContent>Back to Building Schedule</TooltipContent>
                            </Tooltip>
                            <div>
                                <h1 className="text-3xl font-bold text-gray-900">Session Details</h1>
                                <p className="mt-1 text-sm text-gray-600">View full details for this tutoring session</p>
                            </div>
                        </div>

                        {/* Detail card */}
                        <div className="border rounded-lg bg-white overflow-hidden">
                            {/* Gradient header */}
                            <div className="bg-gradient-to-r from-gray-50 to-gray-100 p-6 border-b">
                                <div className="flex items-start justify-between gap-4">
                                    <div className="space-y-2">
                                        <div className="flex items-center gap-3 flex-wrap">
                                            <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-gray-200">
                                                <CalendarDays className="h-5 w-5 text-gray-600" />
                                            </div>
                                            <h2 className="text-2xl font-bold text-gray-900">
                                                {session.subjectName ?? "Session"}
                                            </h2>
                                            <span className={`text-sm font-semibold ${STATUS_TEXT[session.status] ?? "text-gray-600"}`}>
                                                {getStatusLabel(session.status)}
                                            </span>
                                        </div>
                                        <p className="text-gray-600 flex items-center gap-2 text-sm">
                                            <DoorOpen className="h-4 w-4 text-gray-400" />
                                            Room <span className="font-semibold">{session.roomName ?? "—"}</span>
                                            {session.buildingName && (
                                                <> &mdash; <span className="font-semibold">{session.buildingName}</span></>
                                            )}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Details grid */}
                            <div className="p-6">
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-x-6 gap-y-5">
                                    <div className="space-y-1.5">
                                        <div className="flex items-center gap-2 text-sm font-medium text-gray-500">
                                            <BookOpen className="h-4 w-4" /><span>Subject</span>
                                        </div>
                                        <p className="text-sm text-gray-900 font-medium">{session.subjectName ?? "—"}</p>
                                    </div>

                                    <div className="space-y-1.5">
                                        <div className="flex items-center gap-2 text-sm font-medium text-gray-500">
                                            <User className="h-4 w-4" /><span>Teacher</span>
                                        </div>
                                        <p className="text-sm text-gray-900 font-medium">
                                            {session.assignedTeacherName ?? <span className="italic text-gray-400">Unassigned</span>}
                                        </p>
                                    </div>

                                    <div className="space-y-1.5">
                                        <div className="flex items-center gap-2 text-sm font-medium text-gray-500">
                                            <Users className="h-4 w-4" /><span>Student</span>
                                        </div>
                                        <p className="text-sm text-gray-900 font-medium">{session.studentName ?? "—"}</p>
                                    </div>

                                    <div className="space-y-1.5">
                                        <div className="flex items-center gap-2 text-sm font-medium text-gray-500">
                                            <CalendarDays className="h-4 w-4" /><span>Day</span>
                                        </div>
                                        <p className="text-sm text-gray-900 font-medium">{session.dayName ?? "—"}</p>
                                    </div>

                                    <div className="space-y-1.5">
                                        <div className="flex items-center gap-2 text-sm font-medium text-gray-500">
                                            <Clock className="h-4 w-4" /><span>Time</span>
                                        </div>
                                        <p className="text-sm text-gray-900 font-medium">{session.timeSlotLabel ?? "—"}</p>
                                    </div>

                                    <div className="space-y-1.5">
                                        <div className="flex items-center gap-2 text-sm font-medium text-gray-500">
                                            <DoorOpen className="h-4 w-4" /><span>Room</span>
                                        </div>
                                        <p className="text-sm text-gray-900 font-medium">{session.roomName ?? "—"}</p>
                                    </div>

                                    <div className="space-y-1.5">
                                        <div className="flex items-center gap-2 text-sm font-medium text-gray-500">
                                            <FileText className="h-4 w-4" /><span>Status</span>
                                        </div>
                                        <p className={`text-sm font-medium ${STATUS_TEXT[session.status] ?? "text-gray-900"}`}>
                                            {getStatusLabel(session.status)}
                                        </p>
                                    </div>

                                    <div className="space-y-1.5">
                                        <div className="flex items-center gap-2 text-sm font-medium text-gray-500">
                                            <Tag className="h-4 w-4" /><span>Subject Code</span>
                                        </div>
                                        <p className="text-sm text-gray-900 font-medium">{session.subjectCode ?? "—"}</p>
                                    </div>

                                    <div className="space-y-1.5">
                                        <div className="flex items-center gap-2 text-sm font-medium text-gray-500">
                                            <Calendar className="h-4 w-4" /><span>Created At</span>
                                        </div>
                                        <p className="text-sm text-gray-900">{formatDateTime(session.createdAt)}</p>
                                        {session.createdByName && (
                                            <p className="text-xs text-gray-500">by {session.createdByName}</p>
                                        )}
                                    </div>

                                    <div className="space-y-1.5 md:col-span-2">
                                        <div className="flex items-center gap-2 text-sm font-medium text-gray-700">
                                            <Clock className="h-4 w-4" /><span>Last Updated</span>
                                        </div>
                                        <div className="bg-gray-50 border border-gray-200 rounded-lg p-2.5">
                                            <p className="text-sm text-gray-900 font-semibold">{formatDateTime(session.updatedAt)}</p>
                                            {session.updatedByName && (
                                                <p className="text-xs text-gray-600">by {session.updatedByName}</p>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Other sessions in the same room */}
                        <div className="border rounded-lg bg-white overflow-hidden">
                            <div className="px-6 py-4 border-b bg-gray-50 flex items-center gap-2">
                                <DoorOpen className="h-4 w-4 text-gray-500" />
                                <h3 className="text-sm font-semibold text-gray-700">
                                    Other Sessions in Room {session.roomName ?? ""}
                                </h3>
                                {!relatedLoading && (
                                    <span className="ml-auto text-xs text-gray-500">
                                        {relatedSessions.length} session{relatedSessions.length !== 1 ? "s" : ""}
                                    </span>
                                )}
                            </div>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Day</TableHead>
                                        <TableHead>Time</TableHead>
                                        <TableHead>Subject</TableHead>
                                        <TableHead>Teacher</TableHead>
                                        <TableHead>Status</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {relatedLoading ? (
                                        Array.from({ length: 3 }).map((_, i) => (
                                            <TableRow key={i}>
                                                {Array.from({ length: 5 }).map((__, j) => (
                                                    <TableCell key={j}><Skeleton className="h-4 w-24" /></TableCell>
                                                ))}
                                            </TableRow>
                                        ))
                                    ) : relatedSessions.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={5} className="h-24 text-center text-gray-500 text-sm">
                                                No other sessions in this room.
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        relatedSessions.map(s => (
                                            <TableRow
                                                key={s.id}
                                                className="cursor-pointer hover:bg-gray-50/50"
                                                onClick={() => navigate(`/my-building/schedule/${s.id}`)}
                                            >
                                                <TableCell className="font-medium text-gray-900">{s.dayName ?? "—"}</TableCell>
                                                <TableCell className="text-gray-600">
                                                    <span className="flex items-center gap-1">
                                                        <Clock className="h-3 w-3 text-gray-400" />
                                                        {s.timeSlotLabel ?? "—"}
                                                    </span>
                                                </TableCell>
                                                <TableCell className="text-gray-600">
                                                    <span className="flex items-center gap-1">
                                                        <BookOpen className="h-3 w-3 text-gray-400" />
                                                        {s.subjectName ?? "—"}
                                                    </span>
                                                </TableCell>
                                                <TableCell className="text-gray-600">
                                                    {s.assignedTeacherName ?? <span className="italic text-gray-400">Unassigned</span>}
                                                </TableCell>
                                                <TableCell>
                                                    <span className={`text-sm font-medium ${STATUS_TEXT[s.status] ?? "text-gray-600"}`}>
                                                        {getStatusLabel(s.status)}
                                                    </span>
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    )}
                                </TableBody>
                            </Table>
                        </div>
                    </div>
                ) : (
                    !error && (
                        <Alert>
                            <AlertCircle className="h-4 w-4" />
                            <AlertDescription>Session not found.</AlertDescription>
                        </Alert>
                    )
                )}
            </div>
        </AppLayout>
    );
}
