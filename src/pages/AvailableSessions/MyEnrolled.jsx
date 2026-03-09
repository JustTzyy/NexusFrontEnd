import { useState, useEffect, useMemo, useCallback } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { tutoringRequestService } from "../../services/tutoringRequestService";
import { CardGridSkeleton } from "../../utils/skeletonLoaders";
import AppLayout from "../../layouts/AppLayout";
import { generatePDF } from "../../utils/pdfExport";
import { applyFilters, paginate } from "../../utils/filterUtils";
import DateRangeFilter from "../../components/DateRangeFilter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
    Search, AlertCircle, CheckCircle2, X, BookOpen,
} from "lucide-react";

const STATUS_CONFIG = {
    "Confirmed": {
        color: "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200",
        label: "Confirmed",
        gradient: "from-emerald-500 via-green-500 to-emerald-400",
    },
    "Waiting for Teacher Approval": {
        color: "bg-purple-50 text-purple-700 ring-1 ring-purple-200",
        label: "Awaiting Confirmation",
        gradient: "from-purple-500 via-fuchsia-500 to-purple-400",
    },
    "Cancelled by Admin": {
        color: "bg-red-50 text-red-600 ring-1 ring-red-200",
        label: "Cancelled",
        gradient: "from-red-500 via-rose-400 to-red-400",
    },
};

const SOURCE_BADGE = {
    request: { label: "My Request", color: "bg-indigo-50 text-indigo-600 ring-1 ring-indigo-200" },
    enrolled: { label: "Enrolled", color: "bg-teal-50 text-teal-600 ring-1 ring-teal-200" },
};

const PRIORITY_COLOR = {
    High: "text-red-600",
    Normal: "text-orange-600",
    Low: "text-gray-500",
};

const getStatusConfig = (s) =>
    STATUS_CONFIG[s] || { color: "bg-gray-50 text-gray-600 ring-1 ring-gray-200", label: s, gradient: "from-gray-400 via-gray-300 to-gray-400" };

export default function MyEnrolledSessionsIndex() {
    const navigate = useNavigate();
    const location = useLocation();

    const [sessions, setSessions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const [q, setQ] = useState("");
    const [fromDate, setFromDate] = useState(undefined);
    const [toDate, setToDate] = useState(undefined);

    const [page, setPage] = useState(1);
    const pageSize = 9;

    const [alert, setAlert] = useState({ show: false, type: "success", message: "" });

    const resetPage = () => setPage(1);

    const clearFilters = () => {
        setQ("");
        setFromDate(undefined);
        setToDate(undefined);
        setPage(1);
    };

    useEffect(() => {
        if (location.state?.alert) {
            setAlert({ show: true, ...location.state.alert });
            window.history.replaceState({}, document.title);
        }
    }, [location.state]);

    const loadData = useCallback(async () => {
        setLoading(true);
        try {
            const [enrolledRes, requestsRes] = await Promise.all([
                tutoringRequestService.getMyEnrolledSessions({ pageSize: 200 }),
                tutoringRequestService.getMyRequests({ pageSize: 200 }),
            ]);

            const enrolledData = enrolledRes.data?.data || enrolledRes.data;
            const enrolledItems = (enrolledData?.items || []).map(r => ({
                ...r,
                _source: "enrolled",
                createdAtDisplay: r.createdAt ? new Date(r.createdAt).toLocaleDateString() : "",
            }));

            const requestsData = requestsRes.data?.data || requestsRes.data;
            const confirmedItems = (requestsData?.items || [])
                .filter(r => r.status === "Confirmed")
                .map(r => ({
                    ...r,
                    _source: "request",
                    createdAtDisplay: r.createdAt ? new Date(r.createdAt).toLocaleDateString() : "",
                }));

            setSessions([...enrolledItems, ...confirmedItems]);
        } catch {
            setError("Failed to load enrolled sessions");
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

    const filtered = useMemo(() => {
        return applyFilters(sessions, {
            search: q,
            searchFields: ["subjectName", "buildingName", "departmentName", "assignedTeacherName"],
            fromDate,
            toDate,
            dateField: "createdAt",
        });
    }, [sessions, q, fromDate, toDate]);

    const paginationResult = useMemo(() => paginate(filtered, page, pageSize), [filtered, page, pageSize]);
    const { data: paged, total, totalPages, page: safePage } = paginationResult;

    useEffect(() => {
        if (page > totalPages && totalPages > 0) setPage(totalPages);
    }, [totalPages, page]);

    const handlePrintPDF = () => {
        generatePDF({
            title: "My Enrolled Sessions Report",
            data: filtered,
            columns: [
                { header: "Subject", key: "subjectName" },
                { header: "Building", key: "buildingName" },
                { header: "Department", key: "departmentName" },
                { header: "Teacher", key: "assignedTeacherName" },
                { header: "Room", key: "roomName" },
                { header: "Day", key: "dayName" },
                { header: "Time", key: "timeSlotLabel" },
                { header: "Status", key: "status" },
            ],
            companyName: "Learning Flow Management System",
        });
    };

    return (
        <AppLayout title="My Enrolled Sessions" onPrint={filtered.length > 0 ? handlePrintPDF : undefined}>
            {loading ? (
                <CardGridSkeleton cards={6} detailRows={4} showActions={false} />
            ) : (
                <div className="space-y-6">
                    {/* Header */}
                    <div className="flex items-start justify-between gap-4">
                        <div>
                            <h1 className="text-3xl font-bold text-gray-900">My Enrolled Sessions</h1>
                            <p className="mt-1 text-sm text-gray-600">
                                Your confirmed sessions from requests and admin-provided schedules
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
                            {sessions.length > 0 && (
                                <Badge className="bg-emerald-100 text-emerald-700 px-3 py-1">
                                    {sessions.length} enrolled
                                </Badge>
                            )}
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
                                                placeholder="Search by subject, building, teacher..."
                                                value={q}
                                                onChange={(e) => { setQ(e.target.value); resetPage(); }}
                                                className="pl-10 w-[280px]"
                                            />
                                        </div>
                                    </TooltipTrigger>
                                    <TooltipContent>Search by subject, building, department, or teacher</TooltipContent>
                                </Tooltip>
                            }
                            rightElement={
                                (q || fromDate || toDate) ? (
                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <Button variant="outline" size="sm" onClick={clearFilters}>
                                                Clear
                                            </Button>
                                        </TooltipTrigger>
                                        <TooltipContent>Clear all filters</TooltipContent>
                                    </Tooltip>
                                ) : null
                            }
                        />
                    </div>

                    {/* Cards */}
                    {paged.length === 0 ? (
                        <div className="border rounded-lg py-20 text-center bg-white">
                            <BookOpen className="h-10 w-10 text-gray-300 mx-auto mb-3" />
                            <p className="font-medium text-gray-600">
                                {q || fromDate || toDate
                                    ? "No sessions match your filters"
                                    : "No enrolled sessions yet"}
                            </p>
                            <p className="text-sm text-gray-400 mt-1">
                                {q || fromDate || toDate
                                    ? "Try adjusting your filters"
                                    : "Confirmed requests and enrolled sessions will appear here"}
                            </p>
                        </div>
                    ) : (
                        <>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {paged.map((session) => {
                                    const cfg = getStatusConfig(session.status);
                                    return (
                                        <Card
                                            key={`${session._source}-${session.id}`}
                                            className="group cursor-pointer border rounded-xl bg-white hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 overflow-hidden border-gray-200"
                                            onClick={() =>
                                                session._source === "request"
                                                    ? navigate(`/book-request/${session.id}`)
                                                    : navigate(`/available-sessions/${session.id}`, { state: { session, from: "enrolled" } })
                                            }
                                        >
                                            <CardContent className="p-4 flex items-start gap-4">
                                                <div className={`flex-shrink-0 w-14 h-14 rounded-xl bg-gradient-to-br ${cfg.gradient} flex items-center justify-center`}>
                                                    <BookOpen className="h-6 w-6 text-white" />
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-start justify-between gap-2">
                                                        <div className="min-w-0">
                                                            <h3 className="font-bold text-gray-900 truncate leading-snug group-hover:text-indigo-600 transition-colors duration-200">
                                                                {session.subjectName}
                                                            </h3>
                                                            <p className="text-xs text-gray-400 mt-0.5">
                                                                #{session.id} · {session.buildingName}
                                                            </p>
                                                        </div>
                                                        <div className="flex items-center gap-1.5 flex-shrink-0">
                                                            <span className={`text-[10px] font-semibold tracking-wide px-2 py-0.5 rounded-full whitespace-nowrap ${SOURCE_BADGE[session._source].color}`}>
                                                                {SOURCE_BADGE[session._source].label}
                                                            </span>
                                                            {session._source === "request" && (
                                                                <span className={`text-[10px] font-semibold tracking-wide px-2 py-0.5 rounded-full whitespace-nowrap ${cfg.color}`}>
                                                                    {cfg.label}
                                                                </span>
                                                            )}
                                                        </div>
                                                    </div>
                                                    <p className="text-xs text-gray-500 mt-1.5 truncate">
                                                        {session.assignedTeacherName ? `${session.assignedTeacherName} · ` : ""}{session.departmentName}
                                                    </p>
                                                    {(session.dayName || session.timeSlotLabel) && (
                                                        <p className="text-xs text-gray-400 mt-0.5 truncate">
                                                            {[session.dayName, session.timeSlotLabel].filter(Boolean).join(" · ")}
                                                        </p>
                                                    )}
                                                    <div className="mt-2 flex items-center justify-between">
                                                        <span className="text-xs font-semibold text-indigo-600 flex items-center gap-1 group-hover:gap-1.5 transition-all duration-200">
                                                            View Details
                                                            <span className="group-hover:translate-x-0.5 transition-transform duration-200">&rarr;</span>
                                                        </span>
                                                        <span className={`text-xs font-medium ${PRIORITY_COLOR[session.priority] || "text-gray-500"}`}>
                                                            {session.priority}
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
                                        Showing {paged.length} of {total} sessions
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
