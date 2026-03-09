import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { roomService } from "../../services/roomService";
import { tutoringRequestService } from "../../services/tutoringRequestService";
import AppLayout from "../../layouts/AppLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { DetailViewSkeleton } from "../../utils/skeletonLoaders";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Skeleton } from "@/components/ui/skeleton";
import {
    ArrowLeft, Building2, Users, Tag, Calendar, Clock,
    FileText, AlertCircle, Wrench, CheckCircle2, DoorOpen,
    BookOpen, User, CalendarDays,
} from "lucide-react";

const DAY_ORDER = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

function SessionStatusBadge({ status }) {
    const map = {
        "Confirmed": "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200",
        "Waiting for Teacher Approval": "bg-purple-50 text-purple-700 ring-1 ring-purple-200",
        "WaitingForTeacherApproval": "bg-purple-50 text-purple-700 ring-1 ring-purple-200",
        "Pending": "bg-amber-50 text-amber-700 ring-1 ring-amber-200",
        "Scheduled": "bg-blue-50 text-blue-700 ring-1 ring-blue-200",
        "Cancelled": "bg-red-50 text-red-700 ring-1 ring-red-200",
    };
    const cls = map[status] || "bg-gray-100 text-gray-600 ring-1 ring-gray-200";
    const label = status === "WaitingForTeacherApproval" ? "Awaiting Approval" : status;
    return <Badge className={`${cls} font-medium text-xs`}>{label}</Badge>;
}

const formatDateTime = (dateString) => {
    if (!dateString) return "—";
    return new Date(dateString).toLocaleString("en-US", {
        year: "numeric", month: "short", day: "numeric",
        hour: "2-digit", minute: "2-digit",
    });
};

export default function MyRoomView() {
    const navigate = useNavigate();
    const { id } = useParams();

    const [room, setRoom] = useState(null);
    const [sessions, setSessions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [sessionsLoading, setSessionsLoading] = useState(false);
    const [error, setError] = useState("");
    const [toggleModal, setToggleModal] = useState(false);
    const [toggling, setToggling] = useState(false);
    const [toggleError, setToggleError] = useState("");

    const goBack = () => navigate("/my-rooms");

    const loadRoom = async () => {
        setLoading(true);
        setError("");
        try {
            const response = await roomService.getById(id);
            const data = response.data;
            if (!data) throw new Error("Room not found");
            setRoom({
                id: data.id,
                name: data.name,
                buildingId: data.buildingId,
                buildingName: data.buildingName || "—",
                capacity: data.capacity,
                isActive: data.isActive,
                createdAt: data.createdAt,
                updatedAt: data.updatedAt,
                createdBy: data.createdByName || "System",
                updatedBy: data.updatedByName || "System",
            });
        } catch (err) {
            setError(err?.message || "Failed to load room");
        } finally {
            setLoading(false);
        }
    };

    const loadSessions = async (roomName) => {
        setSessionsLoading(true);
        try {
            const res = await tutoringRequestService.getAll({ pageNumber: 1, pageSize: 500 });
            const all = res.data?.items ?? [];
            const roomSessions = all
                .filter(s => s.roomName === roomName && s.status === "Confirmed")
                .sort((a, b) => DAY_ORDER.indexOf(a.dayName) - DAY_ORDER.indexOf(b.dayName));
            setSessions(roomSessions);
        } catch {
            // sessions are supplementary — silently fail
        } finally {
            setSessionsLoading(false);
        }
    };

    useEffect(() => {
        loadRoom();
    }, [id]);

    useEffect(() => {
        if (room?.name) loadSessions(room.name);
    }, [room?.name]);

    const confirmToggle = async () => {
        setToggleModal(false);
        setToggling(true);
        setToggleError("");
        try {
            await roomService.update(room.id, {
                name: room.name,
                capacity: room.capacity,
                buildingId: room.buildingId,
                isActive: !room.isActive,
            });
            setRoom(prev => ({ ...prev, isActive: !prev.isActive }));
        } catch (err) {
            setToggleError(err?.message || "Failed to update room status.");
        } finally {
            setToggling(false);
        }
    };

    return (
        <AppLayout title="Room Details">
            <div className="space-y-6">
                {error && (
                    <Alert variant="destructive">
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription>{error}</AlertDescription>
                    </Alert>
                )}
                {toggleError && (
                    <Alert variant="destructive">
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription>{toggleError}</AlertDescription>
                    </Alert>
                )}

                {loading ? (
                    <DetailViewSkeleton fields={6} />
                ) : room ? (
                    <div className="space-y-6">
                        {/* Page header */}
                        <div className="flex items-start gap-3">
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <Button variant="outline" size="icon" onClick={goBack}>
                                        <ArrowLeft className="h-4 w-4" />
                                    </Button>
                                </TooltipTrigger>
                                <TooltipContent>Back to My Rooms</TooltipContent>
                            </Tooltip>
                            <div>
                                <h1 className="text-3xl font-bold text-gray-900">Room Details</h1>
                                <p className="mt-1 text-sm text-gray-600">View details and session schedule for this room</p>
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
                                                <DoorOpen className="h-5 w-5 text-gray-600" />
                                            </div>
                                            <h2 className="text-2xl font-bold text-gray-900">{room.name}</h2>
                                            {room.isActive ? (
                                                <Badge className="bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200 font-medium">
                                                    <CheckCircle2 className="h-3 w-3 mr-1" /> Active
                                                </Badge>
                                            ) : (
                                                <Badge className="bg-gray-100 text-gray-600 ring-1 ring-gray-200 font-medium">
                                                    <Wrench className="h-3 w-3 mr-1" /> Maintenance
                                                </Badge>
                                            )}
                                        </div>
                                        <p className="text-gray-600 flex items-center gap-2 text-sm">
                                            <Building2 className="h-4 w-4 text-gray-400" />
                                            Located in <span className="font-semibold">{room.buildingName}</span>
                                        </p>
                                    </div>

                                    {/* Maintenance toggle */}
                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <Button
                                                variant="outline"
                                                disabled={toggling}
                                                onClick={() => setToggleModal(true)}
                                                className={room.isActive
                                                    ? "text-amber-600 border-amber-200 hover:bg-amber-50"
                                                    : "text-emerald-600 border-emerald-200 hover:bg-emerald-50"
                                                }
                                            >
                                                {room.isActive
                                                    ? <><Wrench className="h-4 w-4 mr-2" /> Set Maintenance</>
                                                    : <><CheckCircle2 className="h-4 w-4 mr-2" /> Set Active</>
                                                }
                                            </Button>
                                        </TooltipTrigger>
                                        <TooltipContent>
                                            {room.isActive ? "Mark room as under maintenance" : "Mark room as active"}
                                        </TooltipContent>
                                    </Tooltip>
                                </div>
                            </div>

                            {/* Details grid */}
                            <div className="p-6">
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-x-6 gap-y-5">
                                    <div className="space-y-1.5">
                                        <div className="flex items-center gap-2 text-sm font-medium text-gray-500">
                                            <Tag className="h-4 w-4" /><span>Room Name</span>
                                        </div>
                                        <p className="text-sm text-gray-900 font-medium">{room.name}</p>
                                    </div>
                                    <div className="space-y-1.5">
                                        <div className="flex items-center gap-2 text-sm font-medium text-gray-500">
                                            <Building2 className="h-4 w-4" /><span>Building</span>
                                        </div>
                                        <p className="text-sm text-gray-900 font-medium">{room.buildingName}</p>
                                    </div>
                                    <div className="space-y-1.5">
                                        <div className="flex items-center gap-2 text-sm font-medium text-gray-500">
                                            <Users className="h-4 w-4" /><span>Seating Capacity</span>
                                        </div>
                                        <p className="text-sm text-gray-900 font-medium">{room.capacity} persons</p>
                                    </div>
                                    <div className="space-y-1.5">
                                        <div className="flex items-center gap-2 text-sm font-medium text-gray-500">
                                            <FileText className="h-4 w-4" /><span>Status</span>
                                        </div>
                                        <p className="text-sm text-gray-900 font-medium">{room.isActive ? "Active" : "Under Maintenance"}</p>
                                    </div>
                                    <div className="space-y-1.5">
                                        <div className="flex items-center gap-2 text-sm font-medium text-gray-500">
                                            <Calendar className="h-4 w-4" /><span>Created At</span>
                                        </div>
                                        <p className="text-sm text-gray-900">{formatDateTime(room.createdAt)}</p>
                                        <p className="text-xs text-gray-500">by {room.createdBy}</p>
                                    </div>
                                    <div className="space-y-1.5 md:col-span-1">
                                        <div className="flex items-center gap-2 text-sm font-medium text-gray-700">
                                            <Clock className="h-4 w-4" /><span>Last Updated</span>
                                        </div>
                                        <div className="bg-gray-50 border border-gray-200 rounded-lg p-2.5">
                                            <p className="text-sm text-gray-900 font-semibold">{formatDateTime(room.updatedAt)}</p>
                                            <p className="text-xs text-gray-600">by {room.updatedBy}</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Sessions in this room */}
                        <div className="border rounded-lg bg-white overflow-hidden">
                            <div className="px-6 py-4 border-b bg-gray-50 flex items-center gap-2">
                                <CalendarDays className="h-4 w-4 text-gray-500" />
                                <h3 className="text-sm font-semibold text-gray-700">Confirmed Sessions in This Room</h3>
                                {!sessionsLoading && (
                                    <Badge className="ml-auto bg-gray-100 text-gray-600 ring-1 ring-gray-200 text-xs font-medium">
                                        {sessions.length} session{sessions.length !== 1 ? "s" : ""}
                                    </Badge>
                                )}
                            </div>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Day</TableHead>
                                        <TableHead>Time</TableHead>
                                        <TableHead>Subject</TableHead>
                                        <TableHead>Teacher</TableHead>
                                        <TableHead>Student</TableHead>
                                        <TableHead>Status</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {sessionsLoading ? (
                                        Array.from({ length: 3 }).map((_, i) => (
                                            <TableRow key={i}>
                                                {Array.from({ length: 6 }).map((__, j) => (
                                                    <TableCell key={j}><Skeleton className="h-4 w-24" /></TableCell>
                                                ))}
                                            </TableRow>
                                        ))
                                    ) : sessions.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={6} className="h-24 text-center text-gray-500 text-sm">
                                                No confirmed sessions in this room.
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        sessions.map(s => (
                                            <TableRow key={s.id}>
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
                                                    <span className="flex items-center gap-1">
                                                        <User className="h-3 w-3 text-gray-400" />
                                                        {s.assignedTeacherName ?? <span className="italic text-gray-400">Unassigned</span>}
                                                    </span>
                                                </TableCell>
                                                <TableCell className="text-gray-600">{s.studentName ?? "—"}</TableCell>
                                                <TableCell><SessionStatusBadge status={s.status} /></TableCell>
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
                            <AlertDescription>Room not found.</AlertDescription>
                        </Alert>
                    )
                )}
            </div>

            {/* Toggle maintenance confirmation */}
            <Dialog open={toggleModal} onOpenChange={setToggleModal}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>
                            {room?.isActive ? "Set Room to Maintenance" : "Set Room to Active"}
                        </DialogTitle>
                        <DialogDescription>
                            {room?.isActive
                                ? <>Mark <span className="font-semibold">{room?.name}</span> as under maintenance? It will be unavailable for session scheduling.</>
                                : <>Mark <span className="font-semibold">{room?.name}</span> as active? It will become available for session scheduling.</>
                            }
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setToggleModal(false)}>Cancel</Button>
                        <Button
                            onClick={confirmToggle}
                            className={room?.isActive ? "bg-amber-600 hover:bg-amber-700" : "bg-emerald-600 hover:bg-emerald-700"}
                        >
                            {room?.isActive ? "Set Maintenance" : "Set Active"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </AppLayout>
    );
}
