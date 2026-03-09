import { useEffect, useMemo, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
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
import { CardGridSkeleton } from "../../utils/skeletonLoaders";
import {
    Search, AlertCircle, History, BookOpen, CheckCircle2, XCircle
} from "lucide-react";

const STATUS_CONFIG = {
    "Confirmed": {
        color: "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200",
        label: "Confirmed",
        gradient: "from-emerald-500 via-green-500 to-emerald-400",
    },
    "Cancelled by Student": {
        color: "bg-gray-50 text-gray-500 ring-1 ring-gray-200",
        label: "Cancelled by Student",
        gradient: "from-gray-400 via-gray-300 to-gray-400",
    },
    "Cancelled by Admin": {
        color: "bg-red-50 text-red-600 ring-1 ring-red-200",
        label: "Cancelled by Admin",
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

export default function AdminRequestTracking() {
    const navigate = useNavigate();

    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const [q, setQ] = useState("");
    const [fromDate, setFromDate] = useState(undefined);
    const [toDate, setToDate] = useState(undefined);
    const [statusFilter, setStatusFilter] = useState("all");

    const [page, setPage] = useState(1);
    const pageSize = 9;

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
            const res = await tutoringRequestService.getAll({ pageSize: 200 });
            const data = res.data?.data || res.data;
            const items = data?.items || [];

            const tracked = items
                .filter(r => r.isAdminCreated && (r.status === "Confirmed" || r.status.startsWith("Cancelled")))
                .map(r => ({
                    ...r,
                    createdAtDisplay: r.createdAt ? new Date(r.createdAt).toLocaleDateString() : "",
                }));

            setRequests(tracked);
        } catch (err) {
            console.error(err);
            setError("Failed to load admin request tracking data");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { loadData(); }, [loadData]);

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

    const confirmedCount = requests.filter(r => r.status === "Confirmed").length;
    const cancelledCount = requests.filter(r => r.status.startsWith("Cancelled")).length;

    const handlePrintPDF = () => {
        generatePDF({
            title: "Admin Request Tracking Report",
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

    return (
        <AppLayout title="Admin Request Tracking" onPrint={filtered.length > 0 ? handlePrintPDF : undefined}>
            {loading ? (
                <CardGridSkeleton cards={6} detailRows={4} showActions={false} />
            ) : (
                <div className="space-y-6">
                    {/* Header */}
                    <div className="flex items-start justify-between gap-4">
                        <div>
                            <h1 className="text-3xl font-bold text-gray-900">Admin Request Tracking</h1>
                            <p className="mt-1 text-sm text-gray-600">
                                History of confirmed and cancelled admin-created schedules
                            </p>
                        </div>
                        <div className="flex items-center gap-3">
                            {confirmedCount > 0 && (
                                <Badge className="bg-emerald-100 text-emerald-700 px-3 py-1 flex items-center gap-1.5">
                                    <CheckCircle2 className="h-3.5 w-3.5" />
                                    {confirmedCount} Confirmed
                                </Badge>
                            )}
                            {cancelledCount > 0 && (
                                <Badge className="bg-red-100 text-red-700 px-3 py-1 flex items-center gap-1.5">
                                    <XCircle className="h-3.5 w-3.5" />
                                    {cancelledCount} Cancelled
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
                                                    <SelectTrigger className="w-[220px]">
                                                        <SelectValue placeholder="All Status" />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="all">All Status</SelectItem>
                                                        <SelectItem value="Confirmed">Confirmed</SelectItem>
                                                        <SelectItem value="Cancelled by Student">Cancelled by Student</SelectItem>
                                                        <SelectItem value="Cancelled by Admin">Cancelled by Admin</SelectItem>
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
                            <History className="h-10 w-10 text-gray-300 mx-auto mb-3" />
                            <p className="font-medium text-gray-600">
                                {q || fromDate || toDate || statusFilter !== "all"
                                    ? "No records match your filters"
                                    : "No completed or cancelled admin schedules found"}
                            </p>
                            <p className="text-sm text-gray-400 mt-1">
                                {q || fromDate || toDate || statusFilter !== "all"
                                    ? "Try adjusting your filters"
                                    : "Confirmed and cancelled admin-created requests will appear here"}
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
                                            <CardContent className="p-4 flex items-start gap-4">
                                                {/* Left gradient icon */}
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
                                                        {request.studentName ? `${request.studentName} · ` : ""}{request.departmentName}
                                                        {request.assignedTeacherName ? ` · ${request.assignedTeacherName}` : ""}
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
                                        Showing {paged.length} of {total} records
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
