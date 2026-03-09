import { useState, useEffect, useMemo } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { tutoringRequestService } from "../../services/tutoringRequestService";
import { CardGridSkeleton } from "../../utils/skeletonLoaders";
import AppLayout from "../../layouts/AppLayout";
import { applyFilters, paginate } from "../../utils/filterUtils";
import DateRangeFilter from "../../components/DateRangeFilter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
    Search, AlertCircle, CheckCircle2, X, Plus, BookOpen,
} from "lucide-react";

const STATUS_CONFIG = {
    "Pending Teacher Interest": {
        color: "bg-blue-50 text-blue-700 ring-1 ring-blue-200",
        label: "Pending",
    },
    "Waiting for Admin Approval": {
        color: "bg-amber-50 text-amber-700 ring-1 ring-amber-200",
        label: "Admin Confirmation",
    },
    "Teacher Assigned": {
        color: "bg-indigo-50 text-indigo-700 ring-1 ring-indigo-200",
        label: "Teacher Assigned",
    },
    "Waiting for Teacher Approval": {
        color: "bg-purple-50 text-purple-700 ring-1 ring-purple-200",
        label: "Awaiting Confirmation",
    },
    "Confirmed": {
        color: "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200",
        label: "Confirmed",
    },
    "Pending Student Interest": {
        color: "bg-cyan-50 text-cyan-700 ring-1 ring-cyan-200",
        label: "Awaiting Student",
    },
    "Cancelled by Student": {
        color: "bg-gray-50 text-gray-500 ring-1 ring-gray-200",
        label: "Cancelled",
    },
    "Cancelled by Admin": {
        color: "bg-red-50 text-red-600 ring-1 ring-red-200",
        label: "Cancelled",
    },
};

const PRIORITY_COLOR = {
    High: "text-red-600",
    Normal: "text-orange-600",
    Low: "text-gray-500",
};

const PRIORITY_ACCENT = {
    High: "from-red-500 via-rose-500 to-red-400",
    Normal: "from-amber-500 via-orange-500 to-amber-400",
    Low: "from-gray-400 via-gray-500 to-gray-400",
};

export default function BookRequestIndex() {
    const navigate = useNavigate();
    const location = useLocation();

    const [loading, setLoading] = useState(true);
    const [requests, setRequests] = useState([]);
    const [error, setError] = useState("");

    const [q, setQ] = useState("");
    const [fromDate, setFromDate] = useState(undefined);
    const [toDate, setToDate] = useState(undefined);
    const [status, setStatus] = useState("all");

    const [page, setPage] = useState(1);
    const pageSize = 9;

    const [alert, setAlert] = useState({ show: false, type: "success", message: "" });

    const resetPage = () => setPage(1);

    const clearFilters = () => {
        setQ("");
        setFromDate(undefined);
        setToDate(undefined);
        setStatus("all");
        setPage(1);
    };

    useEffect(() => {
        const load = async () => {
            try {
                const res = await tutoringRequestService.getMyRequests({ pageSize: 100 });
                const items = res.data?.data?.items || res.data?.items || [];
                setRequests(items.map(r => ({
                    ...r,
                    createdAtDisplay: r.createdAt ? new Date(r.createdAt).toLocaleDateString() : "",
                })));
            } catch {
                setError("Failed to load your requests");
            } finally {
                setLoading(false);
            }
        };
        load();
    }, []);

    // Alert from navigation state (e.g., after creating/editing)
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

    const filtered = useMemo(() => {
        let result = applyFilters(requests, {
            search: q,
            searchFields: ["subjectName", "buildingName", "departmentName"],
            fromDate,
            toDate,
            dateField: "createdAt",
        });

        if (status === "active" || status === "all") {
            // Exclude confirmed and cancelled schedules by default
            result = result.filter(r =>
                !r.status.startsWith("Cancelled") && r.status !== "Confirmed"
            );
        } else if (status === "cancelled") {
            result = result.filter(r => r.status.startsWith("Cancelled"));
        }
        return result;
    }, [requests, q, fromDate, toDate, status]);

    const paginationResult = useMemo(() => paginate(filtered, page, pageSize), [filtered, page, pageSize]);
    const { data: paged, total, totalPages, page: safePage } = paginationResult;

    useEffect(() => {
        if (page > totalPages && totalPages > 0) setPage(totalPages);
    }, [totalPages, page]);

    const getStatusConfig = (s) => STATUS_CONFIG[s] || { color: "bg-gray-50 text-gray-600 ring-1 ring-gray-200", label: s };

    return (
        <AppLayout title="My Requests">
            {loading ? (
                <CardGridSkeleton cards={6} detailRows={3} showActions={false} />
            ) : (
                <div className="space-y-6">
                    {/* Header */}
                    <div className="flex items-start justify-between gap-4">
                        <div>
                            <h1 className="text-3xl font-bold text-gray-900">My Requests</h1>
                            <p className="mt-1 text-sm text-gray-600">
                                Track and manage your tutoring requests
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

                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <Button onClick={() => navigate("/book-request/new")}>
                                        <Plus className="h-4 w-4 mr-2" />
                                        New Request
                                    </Button>
                                </TooltipTrigger>
                                <TooltipContent>Request a tutoring session</TooltipContent>
                            </Tooltip>
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
                                                placeholder="Search by subject, building..."
                                                value={q}
                                                onChange={(e) => { setQ(e.target.value); resetPage(); }}
                                                className="pl-10 w-[260px]"
                                            />
                                        </div>
                                    </TooltipTrigger>
                                    <TooltipContent>Search by subject, building, or department</TooltipContent>
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
                                                        <SelectItem value="active">Active</SelectItem>
                                                        <SelectItem value="cancelled">Cancelled</SelectItem>
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
                                </>
                            }
                        />
                    </div>

                    {/* Request Cards */}
                    {paged.length === 0 ? (
                        <div className="border rounded-lg py-20 text-center bg-white">
                            <BookOpen className="h-10 w-10 text-gray-300 mx-auto mb-3" />
                            <p className="font-medium text-gray-600">
                                {q || fromDate || toDate || status !== "all"
                                    ? "No requests match your filters"
                                    : "No requests yet"}
                            </p>
                            <p className="text-sm text-gray-400 mt-1">
                                {q || fromDate || toDate || status !== "all"
                                    ? "Try adjusting your filters"
                                    : "Click \"New Request\" to request a tutoring session"}
                            </p>
                        </div>
                    ) : (
                        <>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {paged.map((request) => {
                                    const cfg = getStatusConfig(request.status);
                                    const accent = PRIORITY_ACCENT[request.priority] || "from-amber-500 via-orange-500 to-amber-400";
                                    return (
                                        <Card
                                            key={request.id}
                                            className="group cursor-pointer border rounded-xl bg-white hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 overflow-hidden border-gray-200"
                                            onClick={() => navigate(`/book-request/${request.id}`)}
                                        >
                                            <CardContent className="p-4 flex items-start gap-4">
                                                <div className={`flex-shrink-0 w-14 h-14 rounded-xl bg-gradient-to-br ${accent} flex items-center justify-center`}>
                                                    <BookOpen className="h-6 w-6 text-white" />
                                                </div>
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
                                                        {request.assignedTeacherName ? `${request.assignedTeacherName} · ` : ""}{request.departmentName}
                                                    </p>
                                                    <div className="mt-2 flex items-center justify-between">
                                                        <span className="text-xs font-semibold text-indigo-600 flex items-center gap-1 group-hover:gap-1.5 transition-all duration-200">
                                                            View Details
                                                            <span className="group-hover:translate-x-0.5 transition-transform duration-200">&rarr;</span>
                                                        </span>
                                                        <span className={`text-xs font-medium ${PRIORITY_COLOR[request.priority] || "text-gray-500"}`}>
                                                            {request.priority}
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
        </AppLayout>
    );
}
