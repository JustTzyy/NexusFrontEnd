import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import AppLayout from "../../layouts/AppLayout";
import DateRangeFilter from "../../components/DateRangeFilter";
import { buildingService } from "../../services/buildingService";
import { tutoringRequestService } from "../../services/tutoringRequestService";
import { applyFilters, paginate } from "../../utils/filterUtils";
import { TableIndexSkeleton } from "../../utils/skeletonLoaders";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
    Building2, AlertCircle, CalendarDays, Clock, DoorOpen,
    BookOpen, Search, Pencil, Trash2
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

function NoBuildingState() {
    return (
        <div className="flex flex-col items-center justify-center py-24 text-center space-y-4">
            <div className="flex items-center justify-center w-16 h-16 rounded-2xl bg-gray-100">
                <Building2 className="h-8 w-8 text-gray-400" />
            </div>
            <div>
                <p className="text-base font-semibold text-gray-900">No Building Assigned</p>
                <p className="text-sm text-gray-500 mt-1">
                    You have not been assigned to manage any building yet.
                    <br />Contact an administrator to get started.
                </p>
            </div>
        </div>
    );
}

export default function BuildingSchedule() {
    const navigate = useNavigate();
    const [myBuilding, setMyBuilding] = useState(null);
    const [sessions, setSessions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [noBuilding, setNoBuilding] = useState(false);

    /* modal */
    const [viewModal, setViewModal] = useState({ open: false, session: null });

    const openViewModal = (s) => setViewModal({ open: true, session: s });
    const confirmView = () => {
        if (viewModal.session) navigate(`/my-building/schedule/${viewModal.session.id}`);
        setViewModal({ open: false, session: null });
    };

    /* filters */
    const [q, setQ] = useState("");
    const [fromDate, setFromDate] = useState(undefined);
    const [toDate, setToDate] = useState(undefined);
    const [dayFilter, setDayFilter] = useState("all");
    const [roomFilter, setRoomFilter] = useState("all");

    /* pagination */
    const [page, setPage] = useState(1);
    const pageSize = 15;

    const resetPage = () => setPage(1);

    const clearFilters = () => {
        setQ("");
        setFromDate(undefined);
        setToDate(undefined);
        setDayFilter("all");
        setRoomFilter("all");
        setPage(1);
    };

    const loadData = async () => {
        setLoading(true);
        setError("");
        try {
            const buildingRes = await buildingService.getMy();
            const building = buildingRes.data ?? null;
            if (!building) {
                setNoBuilding(true);
                setLoading(false);
                return;
            }
            setMyBuilding(building);

            const sessionsRes = await tutoringRequestService.getAll({ pageNumber: 1, pageSize: 500 });
            const all = sessionsRes.data?.items ?? [];
            const mySessions = all.filter(s => s.buildingName === building.name);
            setSessions(mySessions);
        } catch (err) {
            setError(err?.message || "Failed to load schedule data.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadData();
    }, []);

    /* unique room names for dropdown */
    const roomOptions = useMemo(() => {
        const names = [...new Set(sessions.map(s => s.roomName).filter(Boolean))].sort();
        return names;
    }, [sessions]);

    /* filtered + sorted sessions */
    const filtered = useMemo(() => {
        let result = applyFilters(sessions, {
            search: q,
            searchFields: ["subjectName", "assignedTeacherName", "studentName", "roomName"],
        });

        if (dayFilter !== "all") result = result.filter(s => s.dayName === dayFilter);
        if (roomFilter !== "all") result = result.filter(s => s.roomName === roomFilter);

        result.sort((a, b) => {
            const di = DAY_ORDER.indexOf(a.dayName) - DAY_ORDER.indexOf(b.dayName);
            if (di !== 0) return di;
            return (a.timeSlotLabel ?? "").localeCompare(b.timeSlotLabel ?? "");
        });

        return result;
    }, [sessions, q, dayFilter, roomFilter]);

    const paginationResult = useMemo(() => paginate(filtered, page, pageSize), [filtered, page, pageSize]);
    const { data: paged, total, totalPages, page: safePage } = paginationResult;

    useEffect(() => {
        if (page > totalPages) setPage(Math.max(1, totalPages));
    }, [totalPages, page]);

    if (noBuilding) {
        return (
            <AppLayout title="Building Schedule">
                <NoBuildingState />
            </AppLayout>
        );
    }

    return (
        <AppLayout title="Building Schedule">
            {loading ? (
                <TableIndexSkeleton
                    columns={5}
                    rows={10}
                    headers={["Day", "Time", "Room", "Subject", "Status"]}
                />
            ) : (
                <div className="space-y-6">
                    {/* Header */}
                    <div className="flex items-start justify-between gap-4">
                        <div>
                            <h1 className="text-3xl font-bold text-gray-900">Building Schedule</h1>
                            <p className="mt-1 text-sm text-gray-600">
                                All tutoring sessions in{" "}
                                <span className="font-medium">{myBuilding?.name}</span>
                            </p>
                        </div>
                    </div>

                    {error && (
                        <Alert variant="destructive">
                            <AlertCircle className="h-4 w-4" />
                            <AlertDescription>{error}</AlertDescription>
                        </Alert>
                    )}

                    {/* Filters */}
                    <div className="space-y-3">
                        <DateRangeFilter
                            fromDate={fromDate}
                            toDate={toDate}
                            onFromDateChange={(date) => { setFromDate(date); resetPage(); }}
                            onToDateChange={(date) => { setToDate(date); resetPage(); }}
                            onRangeChange={() => resetPage()}
                            showQuickFilters={false}
                            showBadge={false}
                            leftElement={
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <div className="relative">
                                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                                            <Input
                                                placeholder="Search sessions..."
                                                value={q}
                                                onChange={(e) => { setQ(e.target.value); resetPage(); }}
                                                className="pl-10 w-[240px]"
                                            />
                                        </div>
                                    </TooltipTrigger>
                                    <TooltipContent>Search by subject, teacher, student, or room</TooltipContent>
                                </Tooltip>
                            }
                            rightElement={
                                <>
                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <div>
                                                <Select value={dayFilter} onValueChange={(v) => { setDayFilter(v); resetPage(); }}>
                                                    <SelectTrigger className="w-[160px]">
                                                        <SelectValue placeholder="All Days" />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="all">All Days</SelectItem>
                                                        {DAY_ORDER.map(d => (
                                                            <SelectItem key={d} value={d}>{d}</SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                        </TooltipTrigger>
                                        <TooltipContent>Filter by day</TooltipContent>
                                    </Tooltip>

                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <div>
                                                <Select value={roomFilter} onValueChange={(v) => { setRoomFilter(v); resetPage(); }}>
                                                    <SelectTrigger className="w-[180px]">
                                                        <SelectValue placeholder="All Rooms" />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="all">All Rooms</SelectItem>
                                                        {roomOptions.map(r => (
                                                            <SelectItem key={r} value={r}>{r}</SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                        </TooltipTrigger>
                                        <TooltipContent>Filter by room</TooltipContent>
                                    </Tooltip>

                                    {(q || dayFilter !== "all" || roomFilter !== "all") && (
                                        <Tooltip>
                                            <TooltipTrigger asChild>
                                                <Button variant="outline" size="sm" onClick={clearFilters}>
                                                    Clear
                                                </Button>
                                            </TooltipTrigger>
                                            <TooltipContent>Clear all filters</TooltipContent>
                                        </Tooltip>
                                    )}
                                </>
                            }
                        />
                    </div>

                    {/* Sessions table */}
                    <div className="border rounded-lg overflow-hidden bg-white">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Day</TableHead>
                                    <TableHead>Time</TableHead>
                                    <TableHead>Room</TableHead>
                                    <TableHead>Subject</TableHead>
                                    <TableHead className="text-center">Status</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {loading ? (
                                    Array.from({ length: 8 }).map((_, i) => (
                                        <TableRow key={i}>
                                            <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                                            <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                                            <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                                            <TableCell><Skeleton className="h-4 w-28" /></TableCell>
                                            <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                                        </TableRow>
                                    ))
                                ) : paged.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={5} className="h-32 text-center text-gray-500">
                                            {sessions.length === 0
                                                ? "No sessions scheduled in this building yet."
                                                : "No sessions match the selected filters."}
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    paged.map(s => (
                                        <Tooltip key={s.id}>
                                            <TooltipTrigger asChild>
                                                <TableRow
                                                    className="cursor-pointer"
                                                    onClick={() => openViewModal(s)}
                                                >
                                                    <TableCell className="font-medium text-gray-900">
                                                        <span className="flex items-center gap-1.5">
                                                            <CalendarDays className="h-3.5 w-3.5 text-gray-400" />
                                                            {s.dayName ?? "—"}
                                                        </span>
                                                    </TableCell>
                                                    <TableCell className="text-gray-600">
                                                        <span className="flex items-center gap-1">
                                                            <Clock className="h-3 w-3 text-gray-400" />
                                                            {s.timeSlotLabel ?? "—"}
                                                        </span>
                                                    </TableCell>
                                                    <TableCell className="text-gray-600">
                                                        <span className="flex items-center gap-1">
                                                            <DoorOpen className="h-3 w-3 text-gray-400" />
                                                            {s.roomName ?? "—"}
                                                        </span>
                                                    </TableCell>
                                                    <TableCell className="text-gray-600">
                                                        <span className="flex items-center gap-1">
                                                            <BookOpen className="h-3 w-3 text-gray-400" />
                                                            {s.subjectName ?? "—"}
                                                        </span>
                                                    </TableCell>
                                                    <TableCell className="text-center min-w-[200px]">
                                                        <div className="relative flex items-center justify-center">
                                                            <span className={`absolute text-sm font-medium whitespace-nowrap ${STATUS_TEXT[s.status] ?? "text-gray-600"}`}>
                                                                {getStatusLabel(s.status)}
                                                            </span>
                                                            <div className="flex items-center justify-center gap-1 invisible select-none">
                                                                <Button variant="ghost" size="icon">
                                                                    <Pencil className="h-4 w-4" />
                                                                </Button>
                                                                <Button variant="ghost" size="icon">
                                                                    <Trash2 className="h-4 w-4" />
                                                                </Button>
                                                            </div>
                                                        </div>
                                                    </TableCell>
                                                </TableRow>
                                            </TooltipTrigger>
                                            <TooltipContent>Click to view session details</TooltipContent>
                                        </Tooltip>
                                    ))
                                )}
                            </TableBody>
                        </Table>

                        {!loading && paged.length > 0 && (
                            <div className="flex items-center justify-between border-t px-6 py-4">
                                <p className="text-sm text-gray-600">
                                    Showing {(safePage - 1) * pageSize + 1} to {Math.min(safePage * pageSize, total)} of {total} results
                                </p>
                                <div className="flex items-center gap-2">
                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <Button variant="outline" size="sm" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={safePage === 1}>
                                                Previous
                                            </Button>
                                        </TooltipTrigger>
                                        <TooltipContent>Previous page</TooltipContent>
                                    </Tooltip>
                                    <span className="text-sm text-gray-600">Page {safePage} of {totalPages}</span>
                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <Button variant="outline" size="sm" onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={safePage === totalPages}>
                                                Next
                                            </Button>
                                        </TooltipTrigger>
                                        <TooltipContent>Next page</TooltipContent>
                                    </Tooltip>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* View confirmation */}
            <Dialog open={viewModal.open} onOpenChange={(open) => !open && setViewModal({ open: false, session: null })}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>View Session</DialogTitle>
                        <DialogDescription>
                            Would you like to view details of{" "}
                            <span className="font-semibold">{viewModal.session?.subjectName ?? "this session"}</span>
                            {viewModal.session?.roomName ? <> in <span className="font-semibold">{viewModal.session.roomName}</span></> : ""}?
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setViewModal({ open: false, session: null })}>Cancel</Button>
                        <Button onClick={confirmView}>View Details</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </AppLayout>
    );
}
