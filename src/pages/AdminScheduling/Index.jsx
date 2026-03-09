import { useEffect, useMemo, useState, useCallback } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { tutoringRequestService } from "../../services/tutoringRequestService";
import AppLayout from "../../layouts/AppLayout";
import { generatePDF } from "../../utils/pdfExport";
import { applyFilters, paginate } from "../../utils/filterUtils";
import DateRangeFilter from "../../components/DateRangeFilter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Textarea } from "@/components/ui/textarea";
import { CardGridSkeleton } from "../../utils/skeletonLoaders";
import { Search, AlertCircle, CheckCircle2, X, BookOpen, Plus } from "lucide-react";

const STATUS_CONFIG = {
    "Pending Teacher Interest": {
        color: "bg-orange-50 text-orange-700 ring-1 ring-orange-200",
        label: "Pending",
        gradient: "from-orange-500 via-amber-500 to-orange-400",
    },
    "Waiting for Admin Approval": {
        color: "bg-blue-50 text-blue-700 ring-1 ring-blue-200",
        label: "In Review",
        gradient: "from-blue-500 via-sky-500 to-blue-400",
    },
    "Teacher Assigned": {
        color: "bg-indigo-50 text-indigo-700 ring-1 ring-indigo-200",
        label: "Teacher Assigned",
        gradient: "from-indigo-500 via-purple-500 to-indigo-400",
    },
    "Waiting for Teacher Approval": {
        color: "bg-purple-50 text-purple-700 ring-1 ring-purple-200",
        label: "Awaiting Confirmation",
        gradient: "from-purple-500 via-fuchsia-500 to-purple-400",
    },
    "Confirmed": {
        color: "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200",
        label: "Confirmed",
        gradient: "from-emerald-500 via-green-500 to-emerald-400",
    },
    "Pending Student Interest": {
        color: "bg-cyan-50 text-cyan-700 ring-1 ring-cyan-200",
        label: "Awaiting Student",
        gradient: "from-cyan-500 via-teal-500 to-cyan-400",
    },
    "Cancelled by Student": {
        color: "bg-gray-50 text-gray-500 ring-1 ring-gray-200",
        label: "Cancelled",
        gradient: "from-gray-400 via-gray-300 to-gray-400",
    },
    "Cancelled by Admin": {
        color: "bg-red-50 text-red-600 ring-1 ring-red-200",
        label: "Cancelled",
        gradient: "from-red-500 via-rose-400 to-red-400",
    },
};

const PRIORITY_COLOR = {
    High: "text-red-600",
    Normal: "text-orange-600",
    Low: "text-gray-500",
};

const getStatusConfig = (s) =>
    STATUS_CONFIG[s] || { color: "bg-gray-50 text-gray-600 ring-1 ring-gray-200", label: s, gradient: "from-gray-400 via-gray-300 to-gray-400" };

export default function AdminSchedulingIndex() {
    const navigate = useNavigate();
    const location = useLocation();

    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const [q, setQ] = useState("");
    const [fromDate, setFromDate] = useState(undefined);
    const [toDate, setToDate] = useState(undefined);
    const [statusFilter, setStatusFilter] = useState("all");

    const [page, setPage] = useState(1);
    const pageSize = 10;

    const [alert, setAlert] = useState({ show: false, type: "success", message: "" });
    const [cancelDialog, setCancelDialog] = useState({ open: false, request: null });
    const [cancellationReason, setCancellationReason] = useState("");
    const [cancelling, setCancelling] = useState(false);

    const resetPage = () => setPage(1);

    const clearFilters = () => {
        setQ("");
        setFromDate(undefined);
        setToDate(undefined);
        setStatusFilter("all");
        setPage(1);
    };

    // Pick up navigation state alerts (e.g. from Schedule page)
    useEffect(() => {
        if (location.state?.alert) {
            setAlert({ show: true, ...location.state.alert });
            window.history.replaceState({}, document.title);
        }
    }, [location.state]);

    const loadData = useCallback(async () => {
        setLoading(true);
        try {
            const res = await tutoringRequestService.getAll({ pageSize: 200 });
            const data = res.data?.data || res.data;
            const items = data?.items || [];
            setRequests(items.filter(r => r.isAdminCreated && r.status !== "Confirmed" && !r.status.startsWith("Cancelled")).map(r => ({
                ...r,
                createdAtDisplay: r.createdAt ? new Date(r.createdAt).toLocaleDateString() : "",
            })));
        } catch (err) {
            console.error(err);
            setError("Failed to load requests");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { loadData(); }, [loadData]);

    useEffect(() => {
        if (alert.show) {
            const timer = setTimeout(() => setAlert({ show: false, type: "success", message: "" }), 3000);
            return () => clearTimeout(timer);
        }
    }, [alert.show]);

    const handleCancelRequest = async (request) => {
        if (!cancellationReason.trim()) {
            setAlert({ show: true, type: "error", message: "Please provide a reason for cancellation" });
            return;
        }
        setCancelling(true);
        try {
            await tutoringRequestService.adminCancel(request.id, cancellationReason);
            setCancelDialog({ open: false, request: null });
            setCancellationReason("");
            setAlert({ show: true, type: "success", message: `Request for "${request.subjectName}" cancelled.` });
            await loadData();
        } catch (err) {
            const msg = err.response?.data?.message || err.message;
            setAlert({ show: true, type: "error", message: msg });
            setCancelDialog({ open: false, request: null });
        } finally {
            setCancelling(false);
        }
    };

    const filtered = useMemo(() => {
        let result = applyFilters(requests, {
            search: q,
            searchFields: ["subjectName", "buildingName", "departmentName", "studentName", "assignedTeacherName"],
            fromDate,
            toDate,
            dateField: "createdAt",
        });

        if (statusFilter !== "all") {
            result = result.filter(r => r.status === statusFilter);
        }

        return result;
    }, [requests, q, fromDate, toDate, statusFilter]);

    const paginationResult = useMemo(() => paginate(filtered, page, pageSize), [filtered, page, pageSize]);
    const { data: paged, total, totalPages, page: safePage } = paginationResult;

    useEffect(() => {
        if (page > totalPages && totalPages > 0) setPage(totalPages);
    }, [totalPages, page]);

    const handlePrintPDF = () => {
        generatePDF({
            title: "Tutoring Requests Report",
            data: filtered,
            columns: [
                { header: "Student", key: "studentName" },
                { header: "Subject", key: "subjectName" },
                { header: "Building", key: "buildingName" },
                { header: "Department", key: "departmentName" },
                { header: "Status", key: "status" },
                { header: "Teacher", key: "assignedTeacherName" },
            ],
            companyName: "Learning Flow Management System",
        });
    };

    const statuses = [
        "Pending Teacher Interest",
        "Waiting for Admin Approval",
        "Teacher Assigned",
        "Waiting for Teacher Approval",
        "Confirmed",
        "Cancelled by Student",
        "Cancelled by Admin",
    ];

    const pendingCount = requests.filter(r => r.status === "Waiting for Admin Approval").length;

    return (
        <AppLayout title="Admin Scheduling" onPrint={filtered.length > 0 ? handlePrintPDF : undefined}>
            {loading ? (
                <CardGridSkeleton cards={6} detailRows={4} showActions={false} />
            ) : (
                <div className="space-y-6">
                    {/* Header */}
                    <div className="flex items-start justify-between gap-4">
                        <div>
                            <h1 className="text-3xl font-bold text-gray-900">Admin Scheduling</h1>
                            <p className="mt-1 text-sm text-gray-600">
                                Review requests, assign teachers, rooms, and time slots
                            </p>
                        </div>
                        <div className="flex items-center gap-4">
                            {alert.show && (
                                <Alert
                                    className={`flex items-center gap-2 py-2 px-4 w-fit rounded-full animate-in fade-in slide-in-from-right-4 duration-300 ${alert.type === "success"
                                        ? "border-green-500 bg-green-50 text-green-800"
                                        : "border-red-500 bg-red-50 text-red-800"
                                        }`}
                                >
                                    {alert.type === "success" ? (
                                        <CheckCircle2 className="h-4 w-4 text-green-600 flex-shrink-0" />
                                    ) : (
                                        <AlertCircle className="h-4 w-4 text-red-600 flex-shrink-0" />
                                    )}
                                    <AlertDescription className={`text-sm font-medium whitespace-nowrap ${alert.type === "success" ? "text-green-800" : "text-red-800"}`}>
                                        {alert.message}
                                    </AlertDescription>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className={`h-5 w-5 ml-1 rounded-full flex-shrink-0 ${alert.type === "success"
                                            ? "text-green-600 hover:text-green-700 hover:bg-green-100"
                                            : "text-red-600 hover:text-red-700 hover:bg-red-100"
                                            }`}
                                        onClick={() => setAlert({ show: false, type: "success", message: "" })}
                                    >
                                        <X className="h-3 w-3" />
                                    </Button>
                                </Alert>
                            )}
                            {pendingCount > 0 && (
                                <Badge className="bg-blue-100 text-blue-700 px-3 py-1">
                                    {pendingCount} awaiting approval
                                </Badge>
                            )}
                            <Button onClick={() => navigate("/admin-scheduling/create")} className="gap-2">
                                <Plus className="h-4 w-4" />
                                Create Request
                            </Button>
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
                            leftElement={
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <div className="relative">
                                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                                            <Input
                                                placeholder="Search by student, subject, building..."
                                                value={q}
                                                onChange={(e) => { setQ(e.target.value); resetPage(); }}
                                                className="pl-10 w-[280px]"
                                            />
                                        </div>
                                    </TooltipTrigger>
                                    <TooltipContent>Search by student, subject, building, or department</TooltipContent>
                                </Tooltip>
                            }
                            rightElement={
                                <>
                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <div>
                                                <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); resetPage(); }}>
                                                    <SelectTrigger className="w-[240px]">
                                                        <SelectValue placeholder="All Status" />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="all">All Status</SelectItem>
                                                        {statuses.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                        </TooltipTrigger>
                                        <TooltipContent>Filter by status</TooltipContent>
                                    </Tooltip>

                                    {(q || fromDate || toDate || statusFilter !== "all") && (
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

                    {/* Request Cards */}
                    {paged.length === 0 ? (
                        <div className="border rounded-lg py-20 text-center bg-white">
                            <BookOpen className="h-10 w-10 text-gray-300 mx-auto mb-3" />
                            <p className="font-medium text-gray-600">
                                {q || fromDate || toDate || statusFilter !== "all"
                                    ? "No requests match your filters"
                                    : "No requests found"}
                            </p>
                            <p className="text-sm text-gray-400 mt-1">
                                {q || fromDate || toDate || statusFilter !== "all"
                                    ? "Try adjusting your filters"
                                    : "Requests from students will appear here"}
                            </p>
                        </div>
                    ) : (
                        <>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {paged.map((request) => {
                                    const cfg = getStatusConfig(request.status);

                                    return (
                                        <Card
                                            key={request.id}
                                            className="group cursor-pointer border border-gray-200 rounded-xl bg-white hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 overflow-hidden"
                                            onClick={() => navigate(`/admin-scheduling/${request.id}`)}
                                        >
                                            <CardContent className="p-4 flex items-center gap-4">
                                                {/* Left icon */}
                                                <div className={`flex-shrink-0 w-14 h-14 rounded-xl bg-gradient-to-br ${cfg.gradient} flex items-center justify-center`}>
                                                    <BookOpen className="h-6 w-6 text-white" />
                                                </div>

                                                {/* Right content */}
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-start justify-between gap-2">
                                                        <div className="min-w-0">
                                                            <h3 className="font-bold text-gray-900 truncate leading-snug group-hover:text-indigo-600 transition-colors duration-200">
                                                                {request.subjectName}
                                                            </h3>
                                                            <p className="text-xs text-gray-400 mt-0.5">
                                                                #{request.id} · {request.buildingName}
                                                            </p>
                                                        </div>
                                                        <span className={`text-[10px] font-semibold tracking-wide px-2 py-0.5 rounded-full flex-shrink-0 whitespace-nowrap ${cfg.color}`}>
                                                            {cfg.label}
                                                        </span>
                                                    </div>

                                                    <p className="text-xs text-gray-500 mt-1.5 truncate">
                                                        {request.studentName
                                                            ? `${request.studentName} · `
                                                            : ""}{request.departmentName}
                                                        {request.assignedTeacherName
                                                            ? ` · ${request.assignedTeacherName}`
                                                            : ""}
                                                    </p>

                                                    <div className="mt-2 flex items-center justify-between">
                                                        <span className={`text-xs font-medium ${PRIORITY_COLOR[request.priority] || "text-gray-500"}`}>
                                                            {request.priority} priority
                                                        </span>
                                                        <span className="text-xs font-semibold text-indigo-600 flex items-center gap-1 group-hover:gap-1.5 transition-all duration-200">
                                                            View Details
                                                            <span className="group-hover:translate-x-0.5 transition-transform duration-200">&rarr;</span>
                                                        </span>
                                                    </div>
                                                </div>
                                            </CardContent>
                                        </Card>
                                    );
                                })}
                            </div>

                            {totalPages > 1 && (
                                <div className="flex items-center justify-between pt-4">
                                    <p className="text-sm text-gray-500">
                                        Showing {paged.length} of {total} requests
                                    </p>
                                    <div className="flex items-center gap-2">
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => setPage(p => Math.max(1, p - 1))}
                                            disabled={safePage === 1}
                                        >
                                            Previous
                                        </Button>
                                        <span className="text-sm text-gray-600">
                                            Page {safePage} of {totalPages}
                                        </span>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                                            disabled={safePage === totalPages}
                                        >
                                            Next
                                        </Button>
                                    </div>
                                </div>
                            )}
                        </>
                    )}
                </div>
            )}

            {/* Admin Cancel Confirmation Dialog */}
            <AlertDialog open={cancelDialog.open} onOpenChange={(open) => !open && setCancelDialog({ open: false, request: null })}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Cancel Request</AlertDialogTitle>
                        <AlertDialogDescription>
                            Are you sure you want to cancel the request for{" "}
                            <span className="font-semibold text-gray-900">"{cancelDialog.request?.subjectName}"</span> by{" "}
                            <span className="font-semibold text-gray-900">{cancelDialog.request?.studentName}</span>?
                            {cancelDialog.request?.status !== "Pending Teacher Interest" && (
                                <span className="block mt-1 text-red-600">
                                    This request is already in progress. Cancelling will clear all assignments and notify the student.
                                </span>
                            )}
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <div className="py-4">
                        <label className="text-sm font-medium text-gray-700 mb-2 block">
                            Cancellation Reason <span className="text-red-500">*</span>
                        </label>
                        <Textarea
                            placeholder="Please provide a reason for cancelling this schedule..."
                            value={cancellationReason}
                            onChange={(e) => setCancellationReason(e.target.value)}
                            className="min-h-[100px]"
                        />
                    </div>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={cancelling} onClick={() => setCancellationReason("")}>Keep Request</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={(e) => {
                                e.preventDefault();
                                handleCancelRequest(cancelDialog.request);
                            }}
                            disabled={cancelling || !cancellationReason.trim()}
                            className="bg-red-600 hover:bg-red-700"
                        >
                            {cancelling ? "Cancelling..." : "Cancel Request"}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </AppLayout>
    );
}
