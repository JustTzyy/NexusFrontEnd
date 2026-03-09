import { useEffect, useMemo, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { TableIndexSkeleton } from "../../utils/skeletonLoaders";
import AppLayout from "../../layouts/AppLayout";
import { generatePDF } from "../../utils/pdfExport";
import { applyFilters, paginate } from "../../utils/filterUtils";
import DateRangeFilter from "../../components/DateRangeFilter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { Plus, Pencil, Trash2, Archive, Search, X, AlertCircle, CheckCircle2, Calendar, Clock } from "lucide-react";
import PermissionGate from '@/components/PermissionGate';

export default function TutoringSessionsIndex() {
    const navigate = useNavigate();
    const location = useLocation();

    /* ------------------------------ api state ------------------------------ */
    const [sessions, setSessions] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    /* ---------------------------- filter state ---------------------------- */
    const [q, setQ] = useState("");
    const [fromDate, setFromDate] = useState(undefined);
    const [toDate, setToDate] = useState(undefined);
    const [status, setStatus] = useState("all");

    /* -------------------------- pagination state -------------------------- */
    const [page, setPage] = useState(1);
    const pageSize = 10;

    /* -------------------------- modal state -------------------------- */
    const [deleteModal, setDeleteModal] = useState({ open: false, session: null });
    const [viewModal, setViewModal] = useState({ open: false, session: null });

    /* -------------------------- alert state -------------------------- */
    const [alert, setAlert] = useState({ show: false, type: "success", message: "" });

    const resetPage = () => setPage(1);

    const clearFilters = () => {
        setQ("");
        setFromDate(undefined);
        setToDate(undefined);
        setStatus("all");
        setPage(1);
    };

    // PDF Export function
    const handlePrintPDF = () => {
        generatePDF({
            title: "Tutoring Sessions Report",
            data: filtered.map(s => ({
                ...s,
                schedule: `${s.startDateTime} - ${s.endDateTime.split(' ')[1]}`
            })),
            columns: [
                { header: "Subject", key: "subjectName" },
                { header: "Teacher", key: "teacherName" },
                { header: "Room", key: "roomName" },
                { header: "Schedule", key: "schedule" },
                { header: "Status", key: "status" },
            ],
            filters: {
                Search: q || null,
                "From Date": fromDate || null,
                "To Date": toDate || null,
                Status: status !== "all" ? status : null,
            },
            companyName: "Learning Flow Management System",
        });
    };

    /* ------------------------------ routes ------------------------------ */
    const goCreate = () => navigate("/tutoring-sessions/create");
    const goEdit = (id) => navigate(`/tutoring-sessions/${id}/edit`);
    const goArchive = () => navigate("/tutoring-sessions/archive");

    /* ------------------------------ api ------------------------------ */
    const loadSessions = async () => {
        setLoading(true);
        setError("");
        try {
            // TODO: replace with real API call, e.g. tutoringSessionService.getAll()
            setSessions([]);
        } catch (err) {
            setError(err.message || "Failed to load sessions");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadSessions();
    }, []);

    useEffect(() => {
        if (location.state?.alert) {
            setAlert({
                show: true,
                type: location.state.alert.type,
                message: location.state.alert.message,
            });
            window.history.replaceState({}, document.title);
        }
    }, [location]);

    useEffect(() => {
        if (alert.show) {
            const timer = setTimeout(() => {
                setAlert({ show: false, type: "success", message: "" });
            }, 3000);
            return () => clearTimeout(timer);
        }
    }, [alert.show]);

    /* ------------------------------ actions ------------------------------ */
    const openDeleteModal = (s) => setDeleteModal({ open: true, session: s });
    const openViewModal = (s) => setViewModal({ open: true, session: s });

    const confirmDelete = async () => {
        const s = deleteModal.session;
        setDeleteModal({ open: false, session: null });
        if (!s) return;
        setSessions((prev) => prev.filter((x) => x.id !== s.id));
        setAlert({ show: true, type: "success", message: `Session archived successfully!` });
    };

    const confirmView = () => {
        if (viewModal.session) {
            navigate(`/tutoring-sessions/${viewModal.session.id}`);
        }
        setViewModal({ open: false, session: null });
    };

    /* ------------------------- filtering ------------------------- */
    const filtered = useMemo(() => {
        let result = applyFilters(sessions, {
            search: q,
            searchFields: ['subjectName', 'teacherName', 'roomName'],
            fromDate,
            toDate,
            dateField: 'createdAt',
        });

        if (status !== "all") {
            result = result.filter(s => s.status.toLowerCase() === status.toLowerCase());
        }

        return result;
    }, [sessions, q, fromDate, toDate, status]);

    const paginationResult = useMemo(() => {
        return paginate(filtered, page, pageSize);
    }, [filtered, page, pageSize]);

    const { data: paged, total, totalPages, page: safePage } = paginationResult;

    useEffect(() => {
        if (page > totalPages) setPage(totalPages);
    }, [totalPages, page]);

    const getStatusStyles = (status) => {
        switch (status.toLowerCase()) {
            case "scheduled": return "text-blue-600";
            case "completed": return "text-green-600";
            case "cancelled": return "text-red-600";
            case "draft": return "text-gray-500";
            case "noshow": return "text-orange-600";
            default: return "text-gray-600";
        }
    };

    return (
        <AppLayout title="Tutoring Sessions" onPrint={filtered.length > 0 ? handlePrintPDF : undefined}>
            {loading ? (
                <TableIndexSkeleton
                    columns={6}
                    rows={10}
                    headers={["Subject", "Teacher", "Room", "Schedule", "Status", "Actions"]}
                />
            ) : (
                <div className="space-y-6">
                    {/* Header */}
                    <div className="flex items-start justify-between gap-4">
                        <div>
                            <h1 className="text-3xl font-bold text-gray-900">Tutoring Sessions</h1>
                            <p className="mt-1 text-sm text-gray-600">
                                Manage and schedule tutoring sessions
                            </p>
                        </div>

                        <div className="flex items-center gap-4">
                            {alert.show && (
                                <Alert
                                    className={`flex items-center gap-2 py-2 px-4 animate-in fade-in slide-in-from-right-4 duration-300 ${alert.type === "success"
                                        ? "border-green-500 bg-green-50 text-green-800"
                                        : "border-red-500 bg-red-50 text-red-800"
                                        }`}
                                >
                                    {alert.type === "success" ? (
                                        <CheckCircle2 className="h-4 w-4 text-green-600 flex-shrink-0" />
                                    ) : (
                                        <AlertCircle className="h-4 w-4 text-red-600 flex-shrink-0" />
                                    )}
                                    <AlertDescription className={`text-sm whitespace-nowrap ${alert.type === "success" ? "text-green-800" : "text-red-800"}`}>
                                        {alert.message}
                                    </AlertDescription>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className={`h-5 w-5 ml-1 flex-shrink-0 ${alert.type === "success"
                                            ? "text-green-600 hover:text-green-700 hover:bg-green-100"
                                            : "text-red-600 hover:text-red-700 hover:bg-red-100"
                                            }`}
                                        onClick={() => setAlert({ show: false, type: "success", message: "" })}
                                    >
                                        <X className="h-3 w-3" />
                                    </Button>
                                </Alert>
                            )}

                            <PermissionGate permission="CreateTutoringRequests">
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <Button onClick={goCreate} disabled={loading}>
                                        <Plus className="h-4 w-4 mr-2" />
                                        New Session
                                    </Button>
                                </TooltipTrigger>
                                <TooltipContent>Schedule a new session</TooltipContent>
                            </Tooltip>
                            </PermissionGate>
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
                            onFromDateChange={(date) => {
                                setFromDate(date);
                                resetPage();
                            }}
                            onToDateChange={(date) => {
                                setToDate(date);
                                resetPage();
                            }}
                            onRangeChange={() => resetPage()}
                            leftElement={
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <div className="relative">
                                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                                            <Input
                                                placeholder="Search sessions..."
                                                value={q}
                                                onChange={(e) => {
                                                    setQ(e.target.value);
                                                    resetPage();
                                                }}
                                                className="pl-10 w-[240px]"
                                            />
                                        </div>
                                    </TooltipTrigger>
                                    <TooltipContent>Search by subject, teacher or room</TooltipContent>
                                </Tooltip>
                            }
                            rightElement={
                                <>
                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <div>
                                                <Select value={status} onValueChange={(v) => { setStatus(v); resetPage(); }}>
                                                    <SelectTrigger className="w-[180px]">
                                                        <SelectValue placeholder="All Status" />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="all">All Status</SelectItem>
                                                        <SelectItem value="scheduled">Scheduled</SelectItem>
                                                        <SelectItem value="completed">Completed</SelectItem>
                                                        <SelectItem value="cancelled">Cancelled</SelectItem>
                                                        <SelectItem value="draft">Draft</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                        </TooltipTrigger>
                                        <TooltipContent>Filter by status</TooltipContent>
                                    </Tooltip>

                                    {(q || fromDate || toDate || status !== "all") && (
                                        <Tooltip>
                                            <TooltipTrigger asChild>
                                                <Button variant="outline" size="sm" onClick={clearFilters}>
                                                    Clear
                                                </Button>
                                            </TooltipTrigger>
                                            <TooltipContent>Clear all filters</TooltipContent>
                                        </Tooltip>
                                    )}

                                    <PermissionGate permission="ArchiveTutoringRequests">
                                    <div className="ml-auto">
                                        <Tooltip>
                                            <TooltipTrigger asChild>
                                                <Button variant="outline" onClick={goArchive}>
                                                    <Archive className="h-4 w-4 mr-2" />
                                                    Archive
                                                </Button>
                                            </TooltipTrigger>
                                            <TooltipContent>View archived sessions</TooltipContent>
                                        </Tooltip>
                                    </div>
                                    </PermissionGate>
                                </>
                            }
                        />
                    </div>

                    {/* Table */}
                    <div className="border rounded-lg overflow-hidden bg-white">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Subject</TableHead>
                                    <TableHead>Teacher</TableHead>
                                    <TableHead>Room</TableHead>
                                    <TableHead>Schedule</TableHead>
                                    <TableHead className="text-center">Status</TableHead>
                                    <TableHead className="text-center">Actions</TableHead>
                                </TableRow>
                            </TableHeader>

                            <TableBody>
                                {loading ? (
                                    Array.from({ length: 5 }).map((_, i) => (
                                        <TableRow key={i}>
                                            <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                                            <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                                            <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                                            <TableCell><Skeleton className="h-4 w-40" /></TableCell>
                                            <TableCell><Skeleton className="h-4 w-20 mx-auto" /></TableCell>
                                            <TableCell><Skeleton className="h-4 w-16 ml-auto" /></TableCell>
                                        </TableRow>
                                    ))
                                ) : paged.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={6} className="h-32 text-center text-gray-500">
                                            No tutoring sessions found.
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    paged.map((s) => (
                                        <Tooltip key={s.id}>
                                            <TooltipTrigger asChild>
                                                <TableRow
                                                    className="cursor-pointer"
                                                    onClick={() => openViewModal(s)}
                                                >
                                                    <TableCell className="font-medium">{s.subjectName}</TableCell>
                                                    <TableCell className="text-gray-900">{s.teacherName}</TableCell>
                                                    <TableCell className="text-gray-600 italic">
                                                        <div className="flex items-center gap-1">
                                                            <span>{s.roomName}</span>
                                                        </div>
                                                    </TableCell>
                                                    <TableCell>
                                                        <div className="flex flex-col gap-0.5">
                                                            <div className="flex items-center gap-1.5 text-sm font-medium text-gray-900">
                                                                <Calendar className="h-3.5 w-3.5 text-gray-400" />
                                                                <span>{s.startDateTime.split(' ')[0]}</span>
                                                            </div>
                                                            <div className="flex items-center gap-1.5 text-xs text-gray-500">
                                                                <Clock className="h-3 w-3 text-gray-400" />
                                                                <span>{s.startDateTime.split(' ')[1]} - {s.endDateTime.split(' ')[1]}</span>
                                                            </div>
                                                        </div>
                                                    </TableCell>
                                                    <TableCell className="text-center">
                                                        <span className={`text-xs font-bold uppercase tracking-wider ${getStatusStyles(s.status)}`}>
                                                            {s.status}
                                                        </span>
                                                    </TableCell>
                                                    <TableCell className="text-center">
                                                        <div className="flex items-center justify-center gap-1">
                                                            <PermissionGate permission="UpdateTutoringRequests">
                                                            <Tooltip>
                                                                <TooltipTrigger asChild>
                                                                    <Button
                                                                        variant="ghost"
                                                                        size="icon"
                                                                        onClick={(e) => {
                                                                            e.stopPropagation();
                                                                            goEdit(s.id);
                                                                        }}
                                                                    >
                                                                        <Pencil className="h-4 w-4" />
                                                                    </Button>
                                                                </TooltipTrigger>
                                                                <TooltipContent>Edit session</TooltipContent>
                                                            </Tooltip>
                                                            </PermissionGate>
                                                            <PermissionGate permission="DeleteTutoringRequests">
                                                            <Tooltip>
                                                                <TooltipTrigger asChild>
                                                                    <Button
                                                                        variant="ghost"
                                                                        size="icon"
                                                                        onClick={(e) => {
                                                                            e.stopPropagation();
                                                                            openDeleteModal(s);
                                                                        }}
                                                                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                                                    >
                                                                        <Trash2 className="h-4 w-4" />
                                                                    </Button>
                                                                </TooltipTrigger>
                                                                <TooltipContent>Archive session</TooltipContent>
                                                            </Tooltip>
                                                            </PermissionGate>
                                                        </div>
                                                    </TableCell>
                                                </TableRow>
                                            </TooltipTrigger>
                                            <TooltipContent>Click to view details</TooltipContent>
                                        </Tooltip>
                                    ))
                                )}
                            </TableBody>
                        </Table>

                        {/* Pagination */}
                        {!loading && paged.length > 0 && (
                            <div className="flex items-center justify-between border-t px-6 py-4">
                                <p className="text-sm text-gray-600">
                                    Showing {(safePage - 1) * pageSize + 1} to {Math.min(safePage * pageSize, total)} of {total} results
                                </p>
                                <div className="flex items-center gap-2">
                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => setPage(p => Math.max(1, p - 1))}
                                                disabled={safePage === 1}
                                            >
                                                Previous
                                            </Button>
                                        </TooltipTrigger>
                                        <TooltipContent>Go to previous page</TooltipContent>
                                    </Tooltip>
                                    <span className="text-sm text-gray-600">
                                        Page {safePage} of {totalPages}
                                    </span>
                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                                                disabled={safePage === totalPages}
                                            >
                                                Next
                                            </Button>
                                        </TooltipTrigger>
                                        <TooltipContent>Go to next page</TooltipContent>
                                    </Tooltip>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )
            }

            {/* Delete Confirmation */}
            <AlertDialog open={deleteModal.open} onOpenChange={(open) => !open && setDeleteModal({ open: false, session: null })}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Confirm Archive</AlertDialogTitle>
                        <AlertDialogDescription>
                            Are you sure you want to archive this tutoring session?
                            It will be moved to the archive list.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={confirmDelete} className="bg-red-600 hover:bg-red-700">
                            Archive
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            {/* View Confirmation */}
            <Dialog open={viewModal.open} onOpenChange={(open) => !open && setViewModal({ open: false, session: null })}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>View Session</DialogTitle>
                        <DialogDescription>
                            Would you like to view the details of this session?
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setViewModal({ open: false, session: null })}>
                            Cancel
                        </Button>
                        <Button onClick={confirmView}>
                            View Details
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </AppLayout >
    );
}
