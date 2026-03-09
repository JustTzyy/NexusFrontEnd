import { useEffect, useState, useCallback, useMemo } from "react";
import AppLayout from "../../layouts/AppLayout";
import { generatePDF } from "../../utils/pdfExport";
import DateRangeFilter from "../../components/DateRangeFilter";
import { authLogService } from "../../services/authLogService";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    Search,
    X,
    AlertCircle,
    LogIn,
    LogOut,
    ChevronDown,
    Calendar,
    Wifi,
    Monitor,
    Globe,
    ShieldCheck,
    ShieldX,
} from "lucide-react";

export default function AuthLogIndex() {
    const { user: authUser } = useAuth();

    // ─── Login History State ───
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [q, setQ] = useState("");
    const [debouncedQ, setDebouncedQ] = useState("");
    const [fromDate, setFromDate] = useState(undefined);
    const [toDate, setToDate] = useState(undefined);
    const [action, setAction] = useState("all");
    const [status, setStatus] = useState("all");
    const [page, setPage] = useState(1);
    const [totalCount, setTotalCount] = useState(0);
    const [totalPages, setTotalPages] = useState(0);
    const [expandedId, setExpandedId] = useState(null);

    const pageSize = 10;

    // ─── User Info ───
    const userDisplayInfo = useMemo(() => {
        if (!authUser) return { name: "Loading...", initials: "?", email: "", roles: [] };
        const fullName = authUser.fullName || "User";
        const nameParts = fullName.split(" ").filter(Boolean);
        const initials = nameParts.length >= 2
            ? `${nameParts[0][0]}${nameParts[nameParts.length - 1][0]}`.toUpperCase()
            : fullName.substring(0, 2).toUpperCase();
        return { name: fullName, initials, email: authUser.email || "", roles: authUser.roles || [] };
    }, [authUser]);

    // ─── Debounce ───
    useEffect(() => {
        const timer = setTimeout(() => { setDebouncedQ(q); setPage(1); }, 400);
        return () => clearTimeout(timer);
    }, [q]);

    // ─── Load Logs ───
    const loadLogs = useCallback(async () => {
        setLoading(true);
        setError("");
        try {
            const params = {
                pageNumber: page,
                pageSize,
                searchTerm: debouncedQ || undefined,
                action: action !== "all" ? action : undefined,
                status: status !== "all" ? status : undefined,
                fromDate: fromDate || undefined,
                toDate: toDate || undefined,
            };
            const response = await authLogService.getAll(params);
            const data = response.data;
            setLogs(data.items || []);
            setTotalCount(data.totalCount || 0);
            setTotalPages(data.totalPages || 0);
        } catch (err) {
            console.error("Error loading auth logs:", err);
            setError(err.message || "Failed to load login history");
            setLogs([]);
        } finally {
            setLoading(false);
        }
    }, [page, debouncedQ, action, status, fromDate, toDate]);

    useEffect(() => { loadLogs(); }, [loadLogs]);

    // ─── Helpers ───
    const formatDateTime = (dateString) => {
        if (!dateString) return "—";
        const date = new Date(dateString);
        return date.toLocaleString("en-US", {
            timeZone: "Asia/Manila",
            year: "numeric", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit",
        });
    };

    const formatRelativeTime = (dateString) => {
        if (!dateString) return "";
        const date = new Date(dateString);
        const now = new Date();
        const diffMs = now - date;
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);
        if (diffMins < 1) return "Just now";
        if (diffMins < 60) return `${diffMins}m ago`;
        if (diffHours < 24) return `${diffHours}h ago`;
        if (diffDays < 7) return `${diffDays}d ago`;
        return formatDateTime(dateString);
    };

    const getActionStyle = (act) => {
        const a = act?.toLowerCase();
        if (a === "login") return { bg: "bg-green-50", text: "text-green-700", border: "border-green-200", dot: "bg-green-500" };
        if (a === "logout") return { bg: "bg-gray-50", text: "text-gray-600", border: "border-gray-200", dot: "bg-gray-400" };
        return { bg: "bg-gray-50", text: "text-gray-600", border: "border-gray-200", dot: "bg-gray-400" };
    };

    const getStatusStyle = (s) => {
        const st = s?.toLowerCase();
        if (st === "success") return { bg: "bg-emerald-50", text: "text-emerald-700", border: "border-emerald-200", icon: ShieldCheck };
        if (st === "failed") return { bg: "bg-red-50", text: "text-red-700", border: "border-red-200", icon: ShieldX };
        return { bg: "bg-gray-50", text: "text-gray-600", border: "border-gray-200", icon: ShieldCheck };
    };

    const clearFilters = () => {
        setQ(""); setDebouncedQ(""); setFromDate(undefined); setToDate(undefined); setAction("all"); setStatus("all"); setPage(1);
    };

    // ─── PDF ───
    const handlePrintPDF = () => {
        if (logs.length > 0) {
            generatePDF({
                title: "Login History Report",
                data: logs.map(l => ({ ...l, createdAt: formatDateTime(l.createdAt) })),
                columns: [
                    { header: "Action", key: "action" },
                    { header: "Status", key: "status" },
                    { header: "IP Address", key: "ipAddress" },
                    { header: "Device", key: "device" },
                    { header: "Date & Time", key: "createdAt" },
                ],
                filters: {
                    Search: debouncedQ || null,
                    Action: action !== "all" ? action : null,
                    Status: status !== "all" ? status : null,
                },
                companyName: "Login History System",
            });
        }
    };

    // ─── Pagination Component ───
    const Pagination = () => {
        if (totalPages <= 1) return null;
        return (
            <div className="flex items-center justify-between pt-4">
                <p className="text-xs text-gray-500">
                    Showing {(page - 1) * pageSize + 1} to {Math.min(page * pageSize, totalCount)} of {totalCount}
                </p>
                <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" onClick={() => setPage(Math.max(1, page - 1))} disabled={page === 1} className="h-8 text-xs">
                        Previous
                    </Button>
                    <span className="text-xs text-gray-500">Page {page} of {totalPages}</span>
                    <Button variant="outline" size="sm" onClick={() => setPage(Math.min(totalPages, page + 1))} disabled={page === totalPages} className="h-8 text-xs">
                        Next
                    </Button>
                </div>
            </div>
        );
    };

    // ─── Full Page Skeleton ───
    const PageSkeleton = () => (
        <div className="space-y-8">
            {/* Profile Header Skeleton */}
            <div className="flex items-center gap-5">
                <Skeleton className="h-16 w-16 rounded-full" />
                <div className="space-y-2">
                    <Skeleton className="h-7 w-48" />
                    <div className="flex items-center gap-2">
                        <Skeleton className="h-4 w-40" />
                        <Skeleton className="h-5 w-16 rounded-full" />
                    </div>
                </div>
            </div>

            <Separator />

            {/* Card Skeleton */}
            <div className="border rounded-xl bg-white shadow-sm overflow-hidden">
                {/* Card Header Skeleton */}
                <div className="px-6 py-4 bg-gradient-to-r from-gray-50 to-gray-50/50 border-b">
                    <div className="flex items-center gap-3">
                        <Skeleton className="h-5 w-5 rounded" />
                        <div className="space-y-1.5">
                            <Skeleton className="h-5 w-32" />
                            <Skeleton className="h-3 w-48" />
                        </div>
                    </div>
                </div>

                {/* Filters Skeleton */}
                <div className="px-6 py-4 border-b bg-white">
                    <div className="flex items-center gap-3 flex-wrap">
                        <Skeleton className="h-9 w-[200px]" />
                        <Skeleton className="h-9 w-[140px]" />
                        <Skeleton className="h-9 w-[140px]" />
                        <Skeleton className="h-9 w-[130px]" />
                        <Skeleton className="h-9 w-[130px]" />
                    </div>
                </div>

                {/* Content Skeleton */}
                <div className="p-6 space-y-3">
                    {[...Array(5)].map((_, i) => (
                        <div key={i} className="p-4 border rounded-lg">
                            <div className="flex items-center gap-3">
                                <Skeleton className="h-2.5 w-2.5 rounded-full" />
                                <Skeleton className="h-5 w-16 rounded-md" />
                                <Skeleton className="h-5 w-20 rounded-md" />
                                <Skeleton className="h-4 w-24 hidden sm:block" />
                                <Skeleton className="h-4 w-32 hidden md:block" />
                                <div className="ml-auto flex items-center gap-2">
                                    <Skeleton className="h-4 w-16" />
                                    <Skeleton className="h-3.5 w-3.5" />
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );

    return (
        <AppLayout title="Login History" onPrint={logs.length > 0 ? handlePrintPDF : undefined}>
            {loading && logs.length === 0 ? (
                <PageSkeleton />
            ) : (
                <div className="space-y-8">
                    {/* Profile Header */}
                    <div className="flex items-center gap-5 animate-in fade-in slide-in-from-bottom-2 duration-400">
                        <Avatar className="h-16 w-16 ring-2 ring-gray-100">
                            <AvatarFallback className="bg-gray-900 text-white text-lg font-semibold">
                                {userDisplayInfo.initials}
                            </AvatarFallback>
                        </Avatar>
                        <div className="space-y-1.5">
                            <h1 className="text-2xl font-bold text-gray-900 tracking-tight">{userDisplayInfo.name}</h1>
                            <div className="flex items-center gap-2">
                                <span className="text-sm text-gray-500">{userDisplayInfo.email}</span>
                                {userDisplayInfo.roles.map(role => (
                                    <Badge key={role} variant="secondary" className="text-[10px] px-2 py-0">
                                        {role}
                                    </Badge>
                                ))}
                            </div>
                        </div>
                    </div>

                    <Separator />

                    {/* Card */}
                    <div className="border rounded-xl bg-white shadow-sm overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500">
                        {/* Card Header */}
                        <div className="px-6 py-4 bg-gradient-to-r from-gray-50 to-gray-50/50 border-b">
                            <div className="flex items-center gap-3">
                                <LogIn className="h-5 w-5 text-gray-500" />
                                <div>
                                    <h2 className="text-base font-semibold text-gray-900">Login History</h2>
                                    <p className="text-xs text-gray-500 mt-0.5">Track your login and logout sessions</p>
                                </div>
                            </div>
                        </div>

                        {/* Filters */}
                        <div className="px-6 py-4 border-b bg-white">
                            <DateRangeFilter
                                fromDate={fromDate}
                                toDate={toDate}
                                onFromDateChange={(d) => { setFromDate(d); setPage(1); }}
                                onToDateChange={(d) => { setToDate(d); setPage(1); }}
                                onRangeChange={() => setPage(1)}
                                showQuickFilters={false}
                                leftElement={
                                    <div className="relative">
                                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                                        <Input
                                            placeholder="Search login history..."
                                            value={q}
                                            onChange={(e) => setQ(e.target.value)}
                                            className="pl-10 w-[200px] h-9"
                                        />
                                    </div>
                                }
                                rightElement={
                                    <>
                                        <Select value={action} onValueChange={(v) => { setAction(v); setPage(1); }}>
                                            <SelectTrigger className="w-[130px] h-9">
                                                <SelectValue placeholder="All Actions" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="all">All Actions</SelectItem>
                                                <SelectItem value="Login">Login</SelectItem>
                                                <SelectItem value="Logout">Logout</SelectItem>
                                                <SelectItem value="Failed Login">Failed Login</SelectItem>
                                            </SelectContent>
                                        </Select>
                                        <Select value={status} onValueChange={(v) => { setStatus(v); setPage(1); }}>
                                            <SelectTrigger className="w-[130px] h-9">
                                                <SelectValue placeholder="All Statuses" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="all">All Statuses</SelectItem>
                                                <SelectItem value="Success">Success</SelectItem>
                                                <SelectItem value="Failed">Failed</SelectItem>
                                            </SelectContent>
                                        </Select>
                                        {(q || fromDate || toDate || action !== "all" || status !== "all") && (
                                            <Button variant="ghost" size="sm" onClick={clearFilters} className="h-9 text-xs text-gray-500">
                                                <X className="h-3.5 w-3.5 mr-1" /> Clear
                                            </Button>
                                        )}
                                    </>
                                }
                            />
                        </div>

                        {/* Content */}
                        <div className="p-6">
                            {error && (
                                <Alert variant="destructive" className="mb-4">
                                    <AlertCircle className="h-4 w-4" />
                                    <AlertDescription>{error}</AlertDescription>
                                </Alert>
                            )}


                            {logs.length === 0 ? (
                                <div className="text-center py-12 text-gray-400">
                                    <LogIn className="h-10 w-10 mx-auto mb-3 opacity-30" />
                                    <p className="text-sm font-medium">No login history found</p>
                                    <p className="text-xs mt-1">Your login and logout sessions will appear here</p>
                                </div>
                            ) : (
                                <div className="space-y-2">
                                    {logs.map((log) => {
                                        const actionStyle = getActionStyle(log.action);
                                        const statusStyle = getStatusStyle(log.status);
                                        const StatusIcon = statusStyle.icon;
                                        const isExpanded = expandedId === log.id;
                                        return (
                                            <div
                                                key={log.id}
                                                className={`border rounded-lg transition-all duration-200 cursor-pointer hover:shadow-sm ${isExpanded ? "ring-1 ring-gray-200 shadow-sm" : ""}`}
                                                onClick={() => setExpandedId(isExpanded ? null : log.id)}
                                            >
                                                <div className="px-4 py-3 flex items-center gap-3">
                                                    <div className={`h-2.5 w-2.5 rounded-full shrink-0 ${actionStyle.dot}`} />
                                                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold ${actionStyle.bg} ${actionStyle.text} border ${actionStyle.border}`}>
                                                        {log.action === "Login" && <LogIn className="h-3 w-3 mr-1" />}
                                                        {log.action === "Logout" && <LogOut className="h-3 w-3 mr-1" />}
                                                        {log.action}
                                                    </span>
                                                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium ${statusStyle.bg} ${statusStyle.text} border ${statusStyle.border}`}>
                                                        <StatusIcon className="h-3 w-3" />
                                                        {log.status}
                                                    </span>
                                                    {log.ipAddress && (
                                                        <span className="hidden sm:inline-flex items-center gap-1 text-xs text-gray-500">
                                                            <Wifi className="h-3 w-3" />
                                                            {log.ipAddress}
                                                        </span>
                                                    )}
                                                    {log.device && (
                                                        <span className="hidden md:inline-flex items-center gap-1 text-xs text-gray-500 truncate max-w-[180px]">
                                                            <Monitor className="h-3 w-3 shrink-0" />
                                                            {log.device}
                                                        </span>
                                                    )}
                                                    <span className="ml-auto text-xs text-gray-400 shrink-0">
                                                        {formatRelativeTime(log.createdAt)}
                                                    </span>
                                                    <ChevronDown className={`h-3.5 w-3.5 text-gray-400 transition-transform duration-200 shrink-0 ${isExpanded ? "rotate-180" : ""}`} />
                                                </div>
                                                {isExpanded && (
                                                    <div className="px-4 pb-4 pl-9 border-t bg-gray-50/50 animate-in slide-in-from-top-1 duration-200">
                                                        <div className="pt-3 grid grid-cols-1 sm:grid-cols-3 gap-4">
                                                            <div className="space-y-1">
                                                                <div className="flex items-center gap-1.5 text-xs font-medium text-gray-400">
                                                                    <LogIn className="h-3 w-3" /> Action
                                                                </div>
                                                                <p className="text-sm text-gray-900 font-medium">{log.action}</p>
                                                            </div>
                                                            <div className="space-y-1">
                                                                <div className="flex items-center gap-1.5 text-xs font-medium text-gray-400">
                                                                    <StatusIcon className="h-3 w-3" /> Status
                                                                </div>
                                                                <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium ${statusStyle.bg} ${statusStyle.text} border ${statusStyle.border}`}>
                                                                    {log.status}
                                                                </span>
                                                            </div>
                                                            <div className="space-y-1">
                                                                <div className="flex items-center gap-1.5 text-xs font-medium text-gray-400">
                                                                    <Calendar className="h-3 w-3" /> Date & Time
                                                                </div>
                                                                <p className="text-sm text-gray-900">{formatDateTime(log.createdAt)}</p>
                                                            </div>
                                                            <div className="space-y-1">
                                                                <div className="flex items-center gap-1.5 text-xs font-medium text-gray-400">
                                                                    <Wifi className="h-3 w-3" /> IP Address
                                                                </div>
                                                                <p className="text-sm text-gray-900">{log.ipAddress || "—"}</p>
                                                            </div>
                                                            <div className="space-y-1">
                                                                <div className="flex items-center gap-1.5 text-xs font-medium text-gray-400">
                                                                    <Monitor className="h-3 w-3" /> Device / Browser
                                                                </div>
                                                                <p className="text-sm text-gray-900">{log.device || "—"}</p>
                                                            </div>
                                                            <div className="space-y-1">
                                                                <div className="flex items-center gap-1.5 text-xs font-medium text-gray-400">
                                                                    <Globe className="h-3 w-3" /> Location
                                                                </div>
                                                                <p className="text-sm text-gray-900">{log.location || "—"}</p>
                                                            </div>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            )}

                            <Pagination />
                        </div>
                    </div>
                </div>
            )}
        </AppLayout>
    );
}
