import { useEffect, useMemo, useState, useCallback } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { tutoringRequestService } from "../../services/tutoringRequestService";
import { CardGridSkeleton } from "../../utils/skeletonLoaders";
import { applyFilters, paginate } from "../../utils/filterUtils";
import DateRangeFilter from "../../components/DateRangeFilter";
import AppLayout from "../../layouts/AppLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
    Search, AlertCircle, CheckCircle2, X, Clock,
    LogOut, BookOpen, RotateCcw, Building2, Calendar, User, Flag
} from "lucide-react";
import { useTeacherAssignment } from "@/hooks/useTeacherAssignment";
import SetupRequiredState from "@/components/SetupRequiredState";

const STATUS_CONFIG = {
    "Pending Teacher Interest": {
        color: "bg-amber-50 text-amber-700 ring-1 ring-amber-200",
        label: "Open",
        cardAccent: "from-amber-500 via-orange-500 to-amber-400",
    },
    "Waiting for Admin Approval": {
        color: "bg-blue-50 text-blue-700 ring-1 ring-blue-200",
        label: "In Review",
        cardAccent: "from-blue-500 via-indigo-500 to-blue-400",
    },
    "Teacher Assigned": {
        color: "bg-indigo-50 text-indigo-700 ring-1 ring-indigo-200",
        label: "Assigned",
        cardAccent: "from-indigo-500 via-purple-500 to-indigo-400",
    },
    "Waiting for Teacher Approval": {
        color: "bg-purple-50 text-purple-700 ring-1 ring-purple-200",
        label: "Needs Your Approval",
        cardAccent: "from-purple-500 via-fuchsia-500 to-purple-400",
    },
    "Confirmed": {
        color: "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200",
        label: "Confirmed",
        cardAccent: "from-emerald-500 via-green-500 to-emerald-400",
    },
    "Cancelled by Student": {
        color: "bg-gray-50 text-gray-500 ring-1 ring-gray-200",
        label: "Cancelled",
        cardAccent: "from-gray-400 via-gray-500 to-gray-400",
    },
    "Cancelled by Admin": {
        color: "bg-red-50 text-red-600 ring-1 ring-red-200",
        label: "Cancelled",
        cardAccent: "from-red-400 via-red-500 to-red-400",
    },
    "Withdrawn": {
        color: "bg-rose-50 text-rose-600 ring-1 ring-rose-200",
        label: "Withdrawn",
        cardAccent: "from-rose-400 via-red-400 to-rose-400",
    },
};

export default function MyInterests({ isAdminCreated = false }) {
    const navigate = useNavigate();
    const location = useLocation();
    const { hasAssignment, loading: assignmentLoading } = useTeacherAssignment();

    const pageTitle = isAdminCreated ? "Admin Schedule Tracking" : "Student Schedule Tracking";
    const pageDesc = isAdminCreated
        ? "Track your interests and schedules for admin-initiated requests"
        : "Track your interests and schedules for student requests";

    const [interests, setInterests] = useState([]);
    const [loading, setLoading] = useState(true);

    // Filters
    const [q, setQ] = useState("");
    const [fromDate, setFromDate] = useState(undefined);
    const [toDate, setToDate] = useState(undefined);
    const [statusFilter, setStatusFilter] = useState("all");
    const [page, setPage] = useState(1);
    const pageSize = 9;

    // Modals
    const [confirmModal, setConfirmModal] = useState({ open: false, request: null, action: null });
    const [withdrawModal, setWithdrawModal] = useState({ open: false, request: null });
    const [reExpressModal, setReExpressModal] = useState({ open: false, request: null });
    const [reExpressDescription, setReExpressDescription] = useState("");

    // Alert
    const [alert, setAlert] = useState({ show: false, type: "success", message: "" });
    const [actionLoading, setActionLoading] = useState(false);

    const resetPage = () => setPage(1);

    const clearFilters = () => {
        setQ("");
        setFromDate(undefined);
        setToDate(undefined);
        setStatusFilter("all");
        setPage(1);
    };

    const loadData = useCallback(async () => {
        setLoading(true);
        try {
            const res = await tutoringRequestService.getMyInterests({ pageSize: 100 });
            const data = res.data?.data || res.data;
            const all = data?.items || [];
            const filtered = all.filter(r =>
                isAdminCreated ? r.isAdminCreated : !r.isAdminCreated
            );
            setInterests(filtered.map(r => ({
                ...r,
                createdAtDisplay: r.createdAt ? new Date(r.createdAt).toLocaleDateString() : "",
            })));
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    }, [isAdminCreated]);

    useEffect(() => {
        if (!assignmentLoading && hasAssignment !== false) loadData();
    }, [loadData, assignmentLoading, hasAssignment]);

    // Alert from navigation state
    useEffect(() => {
        if (location.state?.alert) {
            setAlert({ show: true, ...location.state.alert });
            window.history.replaceState({}, "");
        }
    }, [location.state]);

    useEffect(() => {
        if (alert.show) {
            const timer = setTimeout(() => setAlert({ show: false, type: "success", message: "" }), 3000);
            return () => clearTimeout(timer);
        }
    }, [alert.show]);

    // Confirm/Decline session
    const handleConfirmAction = async () => {
        const { request, action } = confirmModal;
        setConfirmModal({ open: false, request: null, action: null });
        if (!request) return;
        setActionLoading(true);
        try {
            await tutoringRequestService.confirmSession(request.id, action === "accept");
            setAlert({
                show: true,
                type: "success",
                message: action === "accept"
                    ? `Session for "${request.subjectName}" confirmed!`
                    : `Session for "${request.subjectName}" declined. Admin will be notified.`,
            });
            await loadData();
        } catch (err) {
            const msg = err.response?.data?.message || err.message;
            setAlert({ show: true, type: "error", message: msg });
        } finally {
            setActionLoading(false);
        }
    };

    // Withdraw from confirmed session
    const handleWithdraw = async () => {
        const { request } = withdrawModal;
        setWithdrawModal({ open: false, request: null });
        if (!request) return;
        setActionLoading(true);
        try {
            await tutoringRequestService.withdraw(request.id);
            setAlert({
                show: true,
                type: "success",
                message: `You've withdrawn from "${request.subjectName}". Admin will reassign a teacher.`,
            });
            await loadData();
        } catch (err) {
            const msg = err.response?.data?.message || err.message;
            setAlert({ show: true, type: "error", message: msg });
        } finally {
            setActionLoading(false);
        }
    };

    // Re-express interest (for withdrawn teachers)
    const handleReExpressInterest = async () => {
        const { request } = reExpressModal;
        const description = reExpressDescription.trim();
        setReExpressModal({ open: false, request: null });
        setReExpressDescription("");
        if (!request) return;
        setActionLoading(true);
        try {
            await tutoringRequestService.expressInterest(request.id, {
                description: description || "I am re-expressing interest in this request.",
            });
            setAlert({
                show: true,
                type: "success",
                message: `You've re-expressed interest in "${request.subjectName}"!`,
            });
            await loadData();
        } catch (err) {
            const msg = err.response?.data?.message || err.message;
            setAlert({ show: true, type: "error", message: msg });
        } finally {
            setActionLoading(false);
        }
    };

    // Filtering
    const filtered = useMemo(() => {
        let result = applyFilters(interests, {
            search: q,
            searchFields: ["subjectName", "buildingName", "departmentName", "studentName"],
            fromDate,
            toDate,
            dateField: "createdAt",
        });

        // Schedule tracking (admin-created) only shows the 3 relevant states
        if (isAdminCreated) {
            result = result.filter(r =>
                r.status === "Confirmed" ||
                r.myInterestStatus === "Withdrawn" ||
                r.status === "Waiting for Teacher Approval"
            );
        }

        if (statusFilter === "active") {
            result = result.filter(r =>
                !r.status.startsWith("Cancelled") && r.status !== "Confirmed" && r.myInterestStatus !== "Withdrawn"
            );
        } else if (statusFilter === "confirmed") {
            result = result.filter(r => r.status === "Confirmed");
        } else if (statusFilter === "pending-approval") {
            result = result.filter(r => r.status === "Waiting for Teacher Approval");
        } else if (statusFilter === "withdrawn") {
            result = result.filter(r => r.myInterestStatus === "Withdrawn");
        }

        return result;
    }, [interests, q, fromDate, toDate, statusFilter, isAdminCreated]);

    const paginationResult = useMemo(() => paginate(filtered, page, pageSize), [filtered, page, pageSize]);
    const { data: paged, total, totalPages, page: safePage } = paginationResult;

    useEffect(() => {
        if (page > totalPages && totalPages > 0) setPage(totalPages);
    }, [totalPages, page]);

    const getStatusConfig = (s) => STATUS_CONFIG[s] || { color: "bg-gray-50 text-gray-600 ring-1 ring-gray-200", label: s, cardAccent: "from-gray-400 via-gray-500 to-gray-400" };

    const needsConfirmation = (r) => r.status === "Waiting for Teacher Approval";
    const isConfirmed = (r) => r.status === "Confirmed";

    return (
        <AppLayout title={pageTitle}>
            {assignmentLoading ? (
                <CardGridSkeleton cards={6} detailRows={3} showActions={false} />
            ) : hasAssignment === false ? (
                <SetupRequiredState />
            ) : loading && interests.length === 0 ? (
                <CardGridSkeleton cards={6} detailRows={3} showActions={false} />
            ) : (
                <div className="space-y-6">
                    {/* Header */}
                    <div className="flex items-start justify-between gap-4">
                        <div>
                            <h1 className="text-3xl font-bold text-gray-900">{pageTitle}</h1>
                            <p className="mt-1 text-sm text-gray-600">
                                {pageDesc}
                            </p>
                        </div>

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
                                    className="h-5 w-5 ml-1 rounded-full flex-shrink-0"
                                    onClick={() => setAlert({ show: false, type: "success", message: "" })}
                                >
                                    <X className="h-3 w-3" />
                                </Button>
                            </Alert>
                        )}
                    </div>

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
                                                placeholder="Search by subject, student, building..."
                                                value={q}
                                                onChange={(e) => { setQ(e.target.value); resetPage(); }}
                                                className="pl-10 w-[280px]"
                                            />
                                        </div>
                                    </TooltipTrigger>
                                    <TooltipContent>Search by subject, student, building, or department</TooltipContent>
                                </Tooltip>
                            }
                            rightElement={
                                <>
                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <div>
                                                <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); resetPage(); }}>
                                                    <SelectTrigger className="w-[200px]">
                                                        <SelectValue placeholder="All Status" />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="all">All Status</SelectItem>
                                                        <SelectItem value="active">Active (In Progress)</SelectItem>
                                                        <SelectItem value="pending-approval">Needs My Approval</SelectItem>
                                                        <SelectItem value="confirmed">Confirmed</SelectItem>
                                                        <SelectItem value="withdrawn">Withdrawn</SelectItem>
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

                    {/* Cards */}
                    {paged.length === 0 ? (
                        <div className="border rounded-lg py-20 text-center bg-white">
                            <Clock className="h-10 w-10 text-gray-300 mx-auto mb-3" />
                            <p className="font-medium text-gray-600">
                                {q || fromDate || toDate || statusFilter !== "all"
                                    ? "No requests match your filters"
                                    : "No interest history yet"}
                            </p>
                            <p className="text-sm text-gray-400 mt-1">
                                {q || fromDate || toDate || statusFilter !== "all"
                                    ? "Try adjusting your filters"
                                    : "Express interest in available requests to see them here"}
                            </p>
                        </div>
                    ) : (
                        <>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {paged.map((request) => {
                                    // For withdrawn entries, show the withdrawal status rather than the request status
                                    const statusKey = request.myInterestStatus === "Withdrawn" ? "Withdrawn" : request.status;
                                    const cfg = getStatusConfig(statusKey);
                                    const isPendingConfirmation = needsConfirmation(request);
                                    const isConfirmedStatus = isConfirmed(request);
                                    const isWithdrawn = request.myInterestStatus === "Withdrawn";
                                    return (
                                        <Card
                                            key={request.id}
                                            className={`group cursor-pointer border rounded-xl bg-white hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 overflow-hidden ${isPendingConfirmation ? "border-purple-300 ring-1 ring-purple-100" : "border-gray-200"}`}
                                            onClick={() => navigate(`/teacher-interest/${request.id}`, { state: { from: isAdminCreated ? "my-admin-schedules" : "my-interests" } })}
                                        >
                                            <CardContent className="p-4 flex items-start gap-4">
                                                {/* Left gradient icon */}
                                                <div className={`flex-shrink-0 w-14 h-14 rounded-xl bg-gradient-to-br ${cfg.cardAccent} flex items-center justify-center`}>
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
                                                        {request.studentName ? `${request.studentName} · ` : ""}{request.departmentName}
                                                        {request.assignedTeacherName ? ` · ${request.assignedTeacherName}` : ""}
                                                    </p>

                                                    <div className="mt-2 flex items-center justify-between">
                                                        <span className="text-xs font-semibold text-indigo-600 flex items-center gap-1 group-hover:gap-1.5 transition-all duration-200">
                                                            View Details
                                                            <span className="group-hover:translate-x-0.5 transition-transform duration-200">&rarr;</span>
                                                        </span>
                                                        <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                                                            {isConfirmedStatus && !isWithdrawn && (
                                                                <Button
                                                                    size="sm"
                                                                    variant="outline"
                                                                    className="h-7 text-xs text-red-600 hover:bg-red-50 px-2"
                                                                    onClick={() => setWithdrawModal({ open: true, request })}
                                                                    disabled={actionLoading}
                                                                >
                                                                    <LogOut className="h-3 w-3 mr-1" />
                                                                    Withdraw
                                                                </Button>
                                                            )}
                                                            {isWithdrawn &&
                                                                (request.status === "Pending Teacher Interest" || request.status === "Waiting for Admin Approval") && (
                                                                    <Button
                                                                        size="sm"
                                                                        variant="outline"
                                                                        className="h-7 text-xs text-indigo-600 hover:bg-indigo-50 px-2"
                                                                        onClick={() => { setReExpressModal({ open: true, request }); setReExpressDescription(""); }}
                                                                        disabled={actionLoading}
                                                                    >
                                                                        <RotateCcw className="h-3 w-3 mr-1" />
                                                                        Re-express
                                                                    </Button>
                                                                )}
                                                        </div>
                                                    </div>
                                                </div>
                                            </CardContent>
                                        </Card>
                                    );
                                })}
                            </div>
                        </>
                    )}

                    {/* Pagination */}
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
                </div>
            )}

            {/* Confirm/Decline Session */}
            <AlertDialog open={confirmModal.open} onOpenChange={(open) => !open && setConfirmModal({ open: false, request: null, action: null })}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>
                            {confirmModal.action === "accept" ? "Accept Session" : "Decline Session"}
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                            {confirmModal.action === "accept"
                                ? <>Are you sure you want to accept the tutoring session for <span className="font-semibold">{confirmModal.request?.subjectName}</span>?</>
                                : <>Are you sure you want to decline this session? The admin will be notified and may assign another teacher.</>
                            }
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleConfirmAction}
                            className={confirmModal.action === "decline" ? "bg-red-600 hover:bg-red-700" : "bg-green-600 hover:bg-green-700"}
                        >
                            {confirmModal.action === "accept" ? "Accept" : "Decline"}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            {/* Withdraw from Confirmed Session */}
            <AlertDialog open={withdrawModal.open} onOpenChange={(open) => !open && setWithdrawModal({ open: false, request: null })}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Withdraw from Session</AlertDialogTitle>
                        <AlertDialogDescription>
                            Are you sure you want to withdraw from the confirmed session for{" "}
                            <span className="font-semibold">{withdrawModal.request?.subjectName}</span>?
                            The admin will be notified and will need to reassign another teacher.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Keep Session</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleWithdraw}
                            className="bg-red-600 hover:bg-red-700"
                        >
                            Withdraw
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            {/* Re-express Interest Dialog */}
            <AlertDialog open={reExpressModal.open} onOpenChange={(open) => { if (!open) { setReExpressModal({ open: false, request: null }); setReExpressDescription(""); } }}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Re-express Interest</AlertDialogTitle>
                        <AlertDialogDescription asChild>
                            <div className="space-y-3">
                                <p>
                                    You previously withdrew from{" "}
                                    <span className="font-semibold">{reExpressModal.request?.subjectName}</span>.
                                    Re-expressing interest will notify the admin that you are available again.
                                </p>
                                <div>
                                    <label className="text-sm font-medium text-gray-700 block mb-1">
                                        Add a note <span className="text-gray-400 font-normal">(optional)</span>
                                    </label>
                                    <Textarea
                                        placeholder="Why are you re-expressing interest?"
                                        value={reExpressDescription}
                                        onChange={(e) => setReExpressDescription(e.target.value)}
                                        rows={3}
                                        className="text-gray-900"
                                    />
                                </div>
                            </div>
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={handleReExpressInterest} disabled={actionLoading}>
                            Re-express Interest
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </AppLayout>
    );
}
