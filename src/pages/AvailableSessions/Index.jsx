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
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
    Search, AlertCircle, CheckCircle2, BookOpen, GraduationCap,
} from "lucide-react";

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

export default function AvailableSessionsIndex() {
    const navigate = useNavigate();
    const location = useLocation();

    const [loading, setLoading] = useState(true);
    const [sessions, setSessions] = useState([]);
    const [error, setError] = useState("");

    const [q, setQ] = useState("");
    const [fromDate, setFromDate] = useState(undefined);
    const [toDate, setToDate] = useState(undefined);

    const [page, setPage] = useState(1);
    const pageSize = 9;

    const [alert, setAlert] = useState({ show: false, type: "success", message: "" });

    const clearFilters = () => {
        setQ("");
        setFromDate(undefined);
        setToDate(undefined);
        setPage(1);
    };

    const loadSessions = async () => {
        try {
            const res = await tutoringRequestService.getAvailableSessions({ pageSize: 100 });
            const items = res.data?.items || [];
            setSessions(items.map(r => ({
                ...r,
                createdAtDisplay: r.createdAt ? new Date(r.createdAt).toLocaleDateString() : "",
            })));
        } catch {
            setError("Failed to load available sessions");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadSessions();
    }, []);

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

    return (
        <AppLayout title="Available Sessions">
            {loading ? (
                <CardGridSkeleton count={6} />
            ) : (
                <div className="space-y-6">
                    {/* Header */}
                    <div className="flex items-start justify-between gap-4">
                        <div>
                            <h1 className="text-3xl font-bold text-gray-900">Available Sessions</h1>
                            <p className="mt-1 text-sm text-gray-600">
                                Browse and enroll in tutoring sessions created by admins
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
                            onFromDateChange={(d) => { setFromDate(d); setPage(1); }}
                            onToDateChange={(d) => { setToDate(d); setPage(1); }}
                            leftElement={
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <div className="relative">
                                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                                            <Input
                                                placeholder="Search by subject, building, department, teacher..."
                                                value={q}
                                                onChange={(e) => { setQ(e.target.value); setPage(1); }}
                                                className="pl-10 w-[260px]"
                                            />
                                        </div>
                                    </TooltipTrigger>
                                    <TooltipContent>Search by subject, building, department, or teacher</TooltipContent>
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

                    {/* Session Cards */}
                    {paged.length === 0 ? (
                        <div className="border rounded-lg py-20 text-center bg-white">
                            <BookOpen className="h-10 w-10 text-gray-300 mx-auto mb-3" />
                            <p className="font-medium text-gray-600">
                                {q || fromDate || toDate
                                    ? "No sessions match your filters"
                                    : "No available sessions right now. Check back later!"}
                            </p>
                            <p className="text-sm text-gray-400 mt-1">
                                {q || fromDate || toDate
                                    ? "Try adjusting your filters"
                                    : "Sessions will appear here once available"}
                            </p>
                        </div>
                    ) : (
                        <>
                            {/* Card Grid */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {paged.map((session) => {
                                    const accent = PRIORITY_ACCENT[session.priority] || "from-amber-500 via-orange-500 to-amber-400";
                                    return (
                                        <Card
                                            key={session.id}
                                            className="group cursor-pointer border rounded-xl bg-white hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 overflow-hidden border-gray-200"
                                            onClick={() => navigate(`/available-sessions/${session.id}`, { state: { session } })}
                                        >
                                            <CardContent className="p-4 flex items-start gap-4">
                                                <div className={`flex-shrink-0 w-14 h-14 rounded-xl bg-gradient-to-br ${accent} flex items-center justify-center`}>
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
                                                        <span className="text-[10px] font-semibold tracking-wide px-2 py-0.5 rounded-full flex-shrink-0 whitespace-nowrap bg-cyan-50 text-cyan-700 ring-1 ring-cyan-200">
                                                            Open
                                                        </span>
                                                    </div>
                                                    <p className="text-xs text-gray-500 mt-1.5 truncate">
                                                        {session.assignedTeacherName ? `${session.assignedTeacherName} · ` : ""}{session.departmentName}
                                                    </p>
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

                            {/* Pagination */}
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
