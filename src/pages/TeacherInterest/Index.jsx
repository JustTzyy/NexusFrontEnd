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
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
    Search, AlertCircle, CheckCircle2, X, BookOpen
} from "lucide-react";
import { useTeacherAssignment } from "@/hooks/useTeacherAssignment";
import SetupRequiredState from "@/components/SetupRequiredState";

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

export default function TeacherInterestIndex({ isAdminCreated = false }) {
    const navigate = useNavigate();
    const location = useLocation();
    const { hasAssignment, loading: assignmentLoading } = useTeacherAssignment();

    const pageTitle = isAdminCreated ? "Admin Requests" : "Student Requests";
    const pageDesc = isAdminCreated
        ? "Browse admin-initiated tutoring requests matching your assignments"
        : "Browse student tutoring requests matching your assignments";

    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(true);

    // Filters
    const [q, setQ] = useState("");
    const [fromDate, setFromDate] = useState(undefined);
    const [toDate, setToDate] = useState(undefined);
    const [page, setPage] = useState(1);
    const pageSize = 9;

    // Alert
    const [alert, setAlert] = useState({ show: false, type: "success", message: "" });

    const resetPage = () => setPage(1);

    const clearFilters = () => {
        setQ("");
        setFromDate(undefined);
        setToDate(undefined);
        setPage(1);
    };

    const loadData = useCallback(async () => {
        setLoading(true);
        try {
            const res = await tutoringRequestService.getAvailable({ pageSize: 100 });
            const data = res.data?.data || res.data;
            const all = data?.items || [];
            const filtered = all.filter(r => isAdminCreated ? r.isAdminCreated : !r.isAdminCreated);
            setRequests(filtered.map(r => ({
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

    // Filtering
    const filtered = useMemo(() => {
        return applyFilters(requests, {
            search: q,
            searchFields: ["subjectName", "buildingName", "departmentName", "studentName"],
            fromDate,
            toDate,
            dateField: "createdAt",
        });
    }, [requests, q, fromDate, toDate]);

    const paginationResult = useMemo(() => paginate(filtered, page, pageSize), [filtered, page, pageSize]);
    const { data: paged, total, totalPages, page: safePage } = paginationResult;

    useEffect(() => {
        if (page > totalPages && totalPages > 0) setPage(totalPages);
    }, [totalPages, page]);

    return (
        <AppLayout title={pageTitle}>
            {assignmentLoading ? (
                <CardGridSkeleton cards={6} detailRows={3} showActions={false} />
            ) : hasAssignment === false ? (
                <SetupRequiredState />
            ) : loading && requests.length === 0 ? (
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
                                (q || fromDate || toDate) && (
                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <Button variant="outline" size="sm" onClick={clearFilters}>
                                                Clear
                                            </Button>
                                        </TooltipTrigger>
                                        <TooltipContent>Clear all filters</TooltipContent>
                                    </Tooltip>
                                )
                            }
                        />
                    </div>

                    {/* Cards */}
                    {paged.length === 0 ? (
                        <div className="border rounded-lg py-20 text-center bg-white">
                            <BookOpen className="h-10 w-10 text-gray-300 mx-auto mb-3" />
                            <p className="font-medium text-gray-600">
                                {q || fromDate || toDate
                                    ? "No requests match your filters"
                                    : "No available requests right now"}
                            </p>
                            <p className="text-sm text-gray-400 mt-1">
                                {q || fromDate || toDate
                                    ? "Try adjusting your filters"
                                    : "New requests matching your assignments will appear here"}
                            </p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {paged.map((request) => {
                                    const accent = PRIORITY_ACCENT[request.priority] || "from-amber-500 via-orange-500 to-amber-400";
                                    const isInReview = request.status === "Waiting for Admin Approval";
                                    return (
                                        <Card
                                            key={request.id}
                                            className={`group cursor-pointer border rounded-xl bg-white hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 overflow-hidden ${isInReview ? "border-blue-200" : "border-gray-200"}`}
                                            onClick={() => navigate(`/teacher-interest/${request.id}`, { state: { from: isAdminCreated ? "admin-requests" : "student-requests" } })}
                                        >
                                            <CardContent className="p-4 flex items-start gap-4">
                                                {/* Left gradient icon */}
                                                <div className={`flex-shrink-0 w-14 h-14 rounded-xl bg-gradient-to-br ${isInReview ? "from-blue-500 via-indigo-500 to-blue-400" : accent} flex items-center justify-center`}>
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
                                                        <span className={`text-[10px] font-semibold tracking-wide px-2 py-0.5 rounded-full flex-shrink-0 whitespace-nowrap ${
                                                            request.status === "Waiting for Admin Approval"
                                                                ? "bg-blue-50 text-blue-700 ring-1 ring-blue-200"
                                                                : "bg-amber-50 text-amber-700 ring-1 ring-amber-200"
                                                        }`}>
                                                            {request.status === "Waiting for Admin Approval" ? "In Review" : "Open"}
                                                        </span>
                                                    </div>

                                                    <p className="text-xs text-gray-500 mt-1.5 truncate">
                                                        {request.studentName ? `${request.studentName} · ` : ""}{request.departmentName}
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

        </AppLayout>
    );
}
