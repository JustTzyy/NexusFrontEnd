import { useEffect, useState, useCallback, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import AppLayout from "../../layouts/AppLayout";
import { generatePDF } from "../../utils/pdfExport";
import DateRangeFilter from "../../components/DateRangeFilter";
import { activityLogService } from "../../services/activityLogService";
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
    History,
    LogIn,
    ChevronRight,
    ChevronDown,
    Box,
    Calendar,
    FileText,
    Wifi,
    Monitor,
    Globe,
    ShieldCheck,
    ShieldX,
    LogOut,
} from "lucide-react";

const MODULES = ["Users", "Roles", "Permissions"];

export default function MyLogsIndex() {
    const [searchParams, setSearchParams] = useSearchParams();
    const { user: authUser } = useAuth();

    const initialTab = searchParams.get("tab") === "login-history" ? "login-history" : "activity";
    const [activeTab, setActiveTab] = useState(initialTab);

    // ─── Activity Log State ───
    const [activityLogs, setActivityLogs] = useState([]);
    const [activityLoading, setActivityLoading] = useState(false);
    const [activityError, setActivityError] = useState("");
    const [activityQ, setActivityQ] = useState("");
    const [activityDebouncedQ, setActivityDebouncedQ] = useState("");
    const [activityFromDate, setActivityFromDate] = useState(undefined);
    const [activityToDate, setActivityToDate] = useState(undefined);
    const [activityModule, setActivityModule] = useState("all");
    const [activityPage, setActivityPage] = useState(1);
    const [activityTotalCount, setActivityTotalCount] = useState(0);
    const [activityTotalPages, setActivityTotalPages] = useState(0);
    const [expandedActivityId, setExpandedActivityId] = useState(null);

    // ─── Login History State ───
    const [authLogs, setAuthLogs] = useState([]);
    const [authLoading, setAuthLoading] = useState(false);
    const [authError, setAuthError] = useState("");
    const [authQ, setAuthQ] = useState("");
    const [authDebouncedQ, setAuthDebouncedQ] = useState("");
    const [authFromDate, setAuthFromDate] = useState(undefined);
    const [authToDate, setAuthToDate] = useState(undefined);
    const [authAction, setAuthAction] = useState("all");
    const [authStatus, setAuthStatus] = useState("all");
    const [authPage, setAuthPage] = useState(1);
    const [authTotalCount, setAuthTotalCount] = useState(0);
    const [authTotalPages, setAuthTotalPages] = useState(0);
    const [expandedAuthId, setExpandedAuthId] = useState(null);

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

    // ─── Tab Config ───
    const tabs = [
        { id: "activity", label: "Activity Log", description: "Your system actions", icon: History },
        { id: "login-history", label: "Login History", description: "Login & logout sessions", icon: LogIn },
    ];

    const handleTabChange = (tabId) => {
        setActiveTab(tabId);
        setSearchParams(tabId === "activity" ? {} : { tab: tabId });
    };

    // ─── Debounce: Activity ───
    useEffect(() => {
        const timer = setTimeout(() => { setActivityDebouncedQ(activityQ); setActivityPage(1); }, 400);
        return () => clearTimeout(timer);
    }, [activityQ]);

    // ─── Debounce: Auth ───
    useEffect(() => {
        const timer = setTimeout(() => { setAuthDebouncedQ(authQ); setAuthPage(1); }, 400);
        return () => clearTimeout(timer);
    }, [authQ]);

    // ─── Load Activity Logs ───
    const loadActivityLogs = useCallback(async () => {
        setActivityLoading(true);
        setActivityError("");
        try {
            const params = {
                pageNumber: activityPage,
                pageSize,
                searchTerm: activityDebouncedQ || undefined,
                module: activityModule !== "all" ? activityModule : undefined,
                fromDate: activityFromDate || undefined,
                toDate: activityToDate || undefined,
            };
            const response = await activityLogService.getAll(params);
            const data = response.data;
            setActivityLogs(data.items || []);
            setActivityTotalCount(data.totalCount || 0);
            setActivityTotalPages(data.totalPages || 0);
        } catch (err) {
            console.error("Error loading activity logs:", err);
            setActivityError(err.message || "Failed to load activity logs");
            setActivityLogs([]);
        } finally {
            setActivityLoading(false);
        }
    }, [activityPage, activityDebouncedQ, activityModule, activityFromDate, activityToDate]);

    // ─── Load Auth Logs ───
    const loadAuthLogs = useCallback(async () => {
        setAuthLoading(true);
        setAuthError("");
        try {
            const params = {
                pageNumber: authPage,
                pageSize,
                searchTerm: authDebouncedQ || undefined,
                action: authAction !== "all" ? authAction : undefined,
                status: authStatus !== "all" ? authStatus : undefined,
                fromDate: authFromDate || undefined,
                toDate: authToDate || undefined,
            };
            const response = await authLogService.getAll(params);
            const data = response.data;
            setAuthLogs(data.items || []);
            setAuthTotalCount(data.totalCount || 0);
            setAuthTotalPages(data.totalPages || 0);
        } catch (err) {
            console.error("Error loading auth logs:", err);
            setAuthError(err.message || "Failed to load login history");
            setAuthLogs([]);
        } finally {
            setAuthLoading(false);
        }
    }, [authPage, authDebouncedQ, authAction, authStatus, authFromDate, authToDate]);

    useEffect(() => { if (activeTab === "activity") loadActivityLogs(); }, [loadActivityLogs, activeTab]);
    useEffect(() => { if (activeTab === "login-history") loadAuthLogs(); }, [loadAuthLogs, activeTab]);

    // ─── Helpers ───
    const formatDateTime = (dateString) => {
        if (!dateString) return "\u2014";
        const date = new Date(dateString);
        return date.toLocaleString("en-US", {
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

    const getActionStyle = (action) => {
        const act = action?.toLowerCase();
        switch (act) {
            case "create": return { bg: "bg-green-50", text: "text-green-700", border: "border-green-200", dot: "bg-green-500" };
            case "update": return { bg: "bg-amber-50", text: "text-amber-700", border: "border-amber-200", dot: "bg-amber-500" };
            case "delete": return { bg: "bg-red-50", text: "text-red-700", border: "border-red-200", dot: "bg-red-500" };
            case "archive": return { bg: "bg-purple-50", text: "text-purple-700", border: "border-purple-200", dot: "bg-purple-500" };
            case "restore": return { bg: "bg-purple-50", text: "text-purple-700", border: "border-purple-200", dot: "bg-purple-500" };
            case "permanentdelete": return { bg: "bg-red-50", text: "text-red-800", border: "border-red-300", dot: "bg-red-700" };
            case "assignpermissions":
            case "assignroles": return { bg: "bg-indigo-50", text: "text-indigo-700", border: "border-indigo-200", dot: "bg-indigo-500" };
            case "login": return { bg: "bg-green-50", text: "text-green-700", border: "border-green-200", dot: "bg-green-500" };
            case "logout": return { bg: "bg-gray-50", text: "text-gray-600", border: "border-gray-200", dot: "bg-gray-400" };
            default: return { bg: "bg-gray-50", text: "text-gray-600", border: "border-gray-200", dot: "bg-gray-400" };
        }
    };

    const getStatusStyle = (status) => {
        const s = status?.toLowerCase();
        if (s === "success") return { bg: "bg-emerald-50", text: "text-emerald-700", border: "border-emerald-200", icon: ShieldCheck };
        if (s === "failed") return { bg: "bg-red-50", text: "text-red-700", border: "border-red-200", icon: ShieldX };
        return { bg: "bg-gray-50", text: "text-gray-600", border: "border-gray-200", icon: ShieldCheck };
    };

    const clearActivityFilters = () => {
        setActivityQ(""); setActivityDebouncedQ(""); setActivityFromDate(undefined); setActivityToDate(undefined); setActivityModule("all"); setActivityPage(1);
    };

    const clearAuthFilters = () => {
        setAuthQ(""); setAuthDebouncedQ(""); setAuthFromDate(undefined); setAuthToDate(undefined); setAuthAction("all"); setAuthStatus("all"); setAuthPage(1);
    };

    // ─── PDF ───
    const handlePrintPDF = () => {
        if (activeTab === "activity" && activityLogs.length > 0) {
            generatePDF({
                title: "My Activity Log Report",
                data: activityLogs.map(l => ({ ...l, createdAt: formatDateTime(l.createdAt) })),
                columns: [
                    { header: "Module", key: "module" },
                    { header: "Details", key: "details" },
                    { header: "Created At", key: "createdAt" },
                    { header: "Action", key: "action" },
                ],
                filters: { Search: activityDebouncedQ || null, Module: activityModule !== "all" ? activityModule : null },
                companyName: "Activity Log System",
            });
        } else if (activeTab === "login-history" && authLogs.length > 0) {
            generatePDF({
                title: "Login History Report",
                data: authLogs.map(l => ({ ...l, createdAt: formatDateTime(l.createdAt) })),
                columns: [
                    { header: "Action", key: "action" },
                    { header: "Status", key: "status" },
                    { header: "IP Address", key: "ipAddress" },
                    { header: "Device", key: "device" },
                    { header: "Date & Time", key: "createdAt" },
                ],
                filters: {
                    Search: authDebouncedQ || null,
                    Action: authAction !== "all" ? authAction : null,
                    Status: authStatus !== "all" ? authStatus : null,
                },
                companyName: "Login History System",
            });
        }
    };

    const canPrint = (activeTab === "activity" && activityLogs.length > 0) || (activeTab === "login-history" && authLogs.length > 0);

    // ─── Pagination Component ───
    const Pagination = ({ page, totalPages, totalCount, onPageChange }) => {
        if (totalPages <= 1) return null;
        return (
            <div className="flex items-center justify-between pt-4">
                <p className="text-xs text-gray-500">
                    Showing {(page - 1) * pageSize + 1} to {Math.min(page * pageSize, totalCount)} of {totalCount}
                </p>
                <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" onClick={() => onPageChange(Math.max(1, page - 1))} disabled={page === 1} className="h-8 text-xs">
                        Previous
                    </Button>
                    <span className="text-xs text-gray-500">Page {page} of {totalPages}</span>
                    <Button variant="outline" size="sm" onClick={() => onPageChange(Math.min(totalPages, page + 1))} disabled={page === totalPages} className="h-8 text-xs">
                        Next
                    </Button>
                </div>
            </div>
        );
    };

    // ─── Loading Skeleton ───
    const LogsSkeleton = () => (
        <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
                <div key={i} className="p-4 border rounded-lg">
                    <div className="flex items-center gap-3">
                        <Skeleton className="h-2.5 w-2.5 rounded-full" />
                        <Skeleton className="h-5 w-16 rounded-md" />
                        <Skeleton className="h-5 w-20 rounded-md" />
                        <div className="ml-auto"><Skeleton className="h-4 w-24" /></div>
                    </div>
                    <div className="mt-2 ml-5"><Skeleton className="h-4 w-3/4" /></div>
                </div>
            ))}
        </div>
    );

    return (
        <AppLayout title="My Logs" onPrint={canPrint ? handlePrintPDF : undefined}>
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

                <div className="grid grid-cols-1 lg:grid-cols-[240px_1fr] gap-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                    {/* Sidebar Tabs */}
                    <aside className="space-y-1">
                        {tabs.map(({ id, label, description, icon: Icon }) => (
                            <button
                                key={id}
                                type="button"
                                onClick={() => handleTabChange(id)}
                                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-left transition-all duration-200 group ${
                                    activeTab === id
                                        ? "bg-gray-900 text-white shadow-sm"
                                        : "text-gray-600 hover:bg-gray-50"
                                }`}
                            >
                                <div className={`p-1.5 rounded-md ${
                                    activeTab === id ? "bg-white/15" : "bg-gray-100 group-hover:bg-gray-200"
                                }`}>
                                    <Icon className="h-3.5 w-3.5" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="text-sm font-medium truncate">{label}</div>
                                    <div className={`text-[11px] truncate ${
                                        activeTab === id ? "text-white/60" : "text-gray-400"
                                    }`}>{description}</div>
                                </div>
                                {activeTab === id && <ChevronRight className="h-3.5 w-3.5 opacity-40 shrink-0" />}
                            </button>
                        ))}
                    </aside>

                    {/* Content Area */}
                    <div className="min-w-0">
                        {/* ═══════════════════ ACTIVITY LOG TAB ═══════════════════ */}
                        {activeTab === "activity" && (
                            <div className="space-y-5 animate-in slide-in-from-right-2 duration-300">
                                {/* Card */}
                                <div className="border rounded-xl bg-white shadow-sm overflow-hidden">
                                    {/* Card Header */}
                                    <div className="px-6 py-4 bg-gradient-to-r from-gray-50 to-gray-50/50 border-b">
                                        <div className="flex items-center gap-3">
                                            <History className="h-5 w-5 text-gray-500" />
                                            <div>
                                                <h2 className="text-base font-semibold text-gray-900">Activity Log</h2>
                                                <p className="text-xs text-gray-500 mt-0.5">Track your personal system activities and actions</p>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Filters */}
                                    <div className="px-6 py-4 border-b bg-white">
                                        <DateRangeFilter
                                            fromDate={activityFromDate}
                                            toDate={activityToDate}
                                            onFromDateChange={(d) => { setActivityFromDate(d); setActivityPage(1); }}
                                            onToDateChange={(d) => { setActivityToDate(d); setActivityPage(1); }}
                                            onRangeChange={() => setActivityPage(1)}
                                            showQuickFilters={false}
                                            leftElement={
                                                <div className="relative">
                                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                                                    <Input
                                                        placeholder="Search activities..."
                                                        value={activityQ}
                                                        onChange={(e) => setActivityQ(e.target.value)}
                                                        className="pl-10 w-[200px] h-9"
                                                    />
                                                </div>
                                            }
                                            rightElement={
                                                <>
                                                    <Select value={activityModule} onValueChange={(v) => { setActivityModule(v); setActivityPage(1); }}>
                                                        <SelectTrigger className="w-[150px] h-9">
                                                            <SelectValue placeholder="All Modules" />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            <SelectItem value="all">All Modules</SelectItem>
                                                            {MODULES.map((m) => (
                                                                <SelectItem key={m} value={m}>{m}</SelectItem>
                                                            ))}
                                                        </SelectContent>
                                                    </Select>
                                                    {(activityQ || activityFromDate || activityToDate || activityModule !== "all") && (
                                                        <Button variant="ghost" size="sm" onClick={clearActivityFilters} className="h-9 text-xs text-gray-500">
                                                            <X className="h-3.5 w-3.5 mr-1" /> Clear
                                                        </Button>
                                                    )}
                                                </>
                                            }
                                        />
                                    </div>

                                    {/* Content */}
                                    <div className="p-6">
                                        {activityError && (
                                            <Alert variant="destructive" className="mb-4">
                                                <AlertCircle className="h-4 w-4" />
                                                <AlertDescription>{activityError}</AlertDescription>
                                            </Alert>
                                        )}

                                        {activityLoading && activityLogs.length === 0 ? (
                                            <LogsSkeleton />
                                        ) : activityLogs.length === 0 ? (
                                            <div className="text-center py-12 text-gray-400">
                                                <History className="h-10 w-10 mx-auto mb-3 opacity-30" />
                                                <p className="text-sm font-medium">No activities found</p>
                                                <p className="text-xs mt-1">Your system actions will appear here</p>
                                            </div>
                                        ) : (
                                            <div className="space-y-2">
                                                {activityLogs.map((log) => {
                                                    const style = getActionStyle(log.action);
                                                    const isExpanded = expandedActivityId === log.id;
                                                    return (
                                                        <div
                                                            key={log.id}
                                                            className={`border rounded-lg transition-all duration-200 cursor-pointer hover:shadow-sm ${isExpanded ? "ring-1 ring-gray-200 shadow-sm" : ""}`}
                                                            onClick={() => setExpandedActivityId(isExpanded ? null : log.id)}
                                                        >
                                                            <div className="px-4 py-3 flex items-center gap-3">
                                                                {/* Dot */}
                                                                <div className={`h-2.5 w-2.5 rounded-full shrink-0 ${style.dot}`} />
                                                                {/* Action Badge */}
                                                                <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold ${style.bg} ${style.text} border ${style.border}`}>
                                                                    {log.action}
                                                                </span>
                                                                {/* Module Badge */}
                                                                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-600 border border-gray-200">
                                                                    {log.module}
                                                                </span>
                                                                {/* Timestamp */}
                                                                <span className="ml-auto text-xs text-gray-400 shrink-0">
                                                                    {formatRelativeTime(log.createdAt)}
                                                                </span>
                                                                {/* Expand arrow */}
                                                                <ChevronDown className={`h-3.5 w-3.5 text-gray-400 transition-transform duration-200 shrink-0 ${isExpanded ? "rotate-180" : ""}`} />
                                                            </div>
                                                            {/* Details row */}
                                                            <div className="px-4 pb-3 pl-9">
                                                                <p className="text-sm text-gray-600 truncate">{log.details || "\u2014"}</p>
                                                            </div>
                                                            {/* Expanded detail */}
                                                            {isExpanded && (
                                                                <div className="px-4 pb-4 pl-9 border-t bg-gray-50/50 animate-in slide-in-from-top-1 duration-200">
                                                                    <div className="pt-3 grid grid-cols-1 sm:grid-cols-3 gap-4">
                                                                        <div className="space-y-1">
                                                                            <div className="flex items-center gap-1.5 text-xs font-medium text-gray-400">
                                                                                <Box className="h-3 w-3" /> Module
                                                                            </div>
                                                                            <p className="text-sm text-gray-900 font-medium">{log.module}</p>
                                                                        </div>
                                                                        <div className="space-y-1">
                                                                            <div className="flex items-center gap-1.5 text-xs font-medium text-gray-400">
                                                                                <Calendar className="h-3 w-3" /> Date & Time
                                                                            </div>
                                                                            <p className="text-sm text-gray-900">{formatDateTime(log.createdAt)}</p>
                                                                        </div>
                                                                        <div className="space-y-1 sm:col-span-3">
                                                                            <div className="flex items-center gap-1.5 text-xs font-medium text-gray-400">
                                                                                <FileText className="h-3 w-3" /> Full Description
                                                                            </div>
                                                                            <p className="text-sm text-gray-900">{log.details || "\u2014"}</p>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            )}
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        )}

                                        <Pagination
                                            page={activityPage}
                                            totalPages={activityTotalPages}
                                            totalCount={activityTotalCount}
                                            onPageChange={setActivityPage}
                                        />
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* ═══════════════════ LOGIN HISTORY TAB ═══════════════════ */}
                        {activeTab === "login-history" && (
                            <div className="space-y-5 animate-in slide-in-from-right-2 duration-300">
                                {/* Card */}
                                <div className="border rounded-xl bg-white shadow-sm overflow-hidden">
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
                                            fromDate={authFromDate}
                                            toDate={authToDate}
                                            onFromDateChange={(d) => { setAuthFromDate(d); setAuthPage(1); }}
                                            onToDateChange={(d) => { setAuthToDate(d); setAuthPage(1); }}
                                            onRangeChange={() => setAuthPage(1)}
                                            showQuickFilters={false}
                                            leftElement={
                                                <div className="relative">
                                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                                                    <Input
                                                        placeholder="Search login history..."
                                                        value={authQ}
                                                        onChange={(e) => setAuthQ(e.target.value)}
                                                        className="pl-10 w-[200px] h-9"
                                                    />
                                                </div>
                                            }
                                            rightElement={
                                                <>
                                                    <Select value={authAction} onValueChange={(v) => { setAuthAction(v); setAuthPage(1); }}>
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
                                                    <Select value={authStatus} onValueChange={(v) => { setAuthStatus(v); setAuthPage(1); }}>
                                                        <SelectTrigger className="w-[130px] h-9">
                                                            <SelectValue placeholder="All Statuses" />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            <SelectItem value="all">All Statuses</SelectItem>
                                                            <SelectItem value="Success">Success</SelectItem>
                                                            <SelectItem value="Failed">Failed</SelectItem>
                                                        </SelectContent>
                                                    </Select>
                                                    {(authQ || authFromDate || authToDate || authAction !== "all" || authStatus !== "all") && (
                                                        <Button variant="ghost" size="sm" onClick={clearAuthFilters} className="h-9 text-xs text-gray-500">
                                                            <X className="h-3.5 w-3.5 mr-1" /> Clear
                                                        </Button>
                                                    )}
                                                </>
                                            }
                                        />
                                    </div>

                                    {/* Content */}
                                    <div className="p-6">
                                        {authError && (
                                            <Alert variant="destructive" className="mb-4">
                                                <AlertCircle className="h-4 w-4" />
                                                <AlertDescription>{authError}</AlertDescription>
                                            </Alert>
                                        )}

                                        {authLoading && authLogs.length === 0 ? (
                                            <LogsSkeleton />
                                        ) : authLogs.length === 0 ? (
                                            <div className="text-center py-12 text-gray-400">
                                                <LogIn className="h-10 w-10 mx-auto mb-3 opacity-30" />
                                                <p className="text-sm font-medium">No login history found</p>
                                                <p className="text-xs mt-1">Your login and logout sessions will appear here</p>
                                            </div>
                                        ) : (
                                            <div className="space-y-2">
                                                {authLogs.map((log) => {
                                                    const actionStyle = getActionStyle(log.action);
                                                    const statusStyle = getStatusStyle(log.status);
                                                    const StatusIcon = statusStyle.icon;
                                                    const isExpanded = expandedAuthId === log.id;
                                                    return (
                                                        <div
                                                            key={log.id}
                                                            className={`border rounded-lg transition-all duration-200 cursor-pointer hover:shadow-sm ${isExpanded ? "ring-1 ring-gray-200 shadow-sm" : ""}`}
                                                            onClick={() => setExpandedAuthId(isExpanded ? null : log.id)}
                                                        >
                                                            <div className="px-4 py-3 flex items-center gap-3">
                                                                {/* Dot */}
                                                                <div className={`h-2.5 w-2.5 rounded-full shrink-0 ${actionStyle.dot}`} />
                                                                {/* Action Badge */}
                                                                <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold ${actionStyle.bg} ${actionStyle.text} border ${actionStyle.border}`}>
                                                                    {log.action === "Login" && <LogIn className="h-3 w-3 mr-1" />}
                                                                    {log.action === "Logout" && <LogOut className="h-3 w-3 mr-1" />}
                                                                    {log.action}
                                                                </span>
                                                                {/* Status Badge */}
                                                                <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium ${statusStyle.bg} ${statusStyle.text} border ${statusStyle.border}`}>
                                                                    <StatusIcon className="h-3 w-3" />
                                                                    {log.status}
                                                                </span>
                                                                {/* IP Address */}
                                                                {log.ipAddress && (
                                                                    <span className="hidden sm:inline-flex items-center gap-1 text-xs text-gray-500">
                                                                        <Wifi className="h-3 w-3" />
                                                                        {log.ipAddress}
                                                                    </span>
                                                                )}
                                                                {/* Device */}
                                                                {log.device && (
                                                                    <span className="hidden md:inline-flex items-center gap-1 text-xs text-gray-500 truncate max-w-[180px]">
                                                                        <Monitor className="h-3 w-3 shrink-0" />
                                                                        {log.device}
                                                                    </span>
                                                                )}
                                                                {/* Timestamp */}
                                                                <span className="ml-auto text-xs text-gray-400 shrink-0">
                                                                    {formatRelativeTime(log.createdAt)}
                                                                </span>
                                                                {/* Expand arrow */}
                                                                <ChevronDown className={`h-3.5 w-3.5 text-gray-400 transition-transform duration-200 shrink-0 ${isExpanded ? "rotate-180" : ""}`} />
                                                            </div>
                                                            {/* Expanded detail */}
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
                                                                            <p className="text-sm text-gray-900">{log.ipAddress || "\u2014"}</p>
                                                                        </div>
                                                                        <div className="space-y-1">
                                                                            <div className="flex items-center gap-1.5 text-xs font-medium text-gray-400">
                                                                                <Monitor className="h-3 w-3" /> Device / Browser
                                                                            </div>
                                                                            <p className="text-sm text-gray-900">{log.device || "\u2014"}</p>
                                                                        </div>
                                                                        <div className="space-y-1">
                                                                            <div className="flex items-center gap-1.5 text-xs font-medium text-gray-400">
                                                                                <Globe className="h-3 w-3" /> Location
                                                                            </div>
                                                                            <p className="text-sm text-gray-900">{log.location || "\u2014"}</p>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            )}
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        )}

                                        <Pagination
                                            page={authPage}
                                            totalPages={authTotalPages}
                                            totalCount={authTotalCount}
                                            onPageChange={setAuthPage}
                                        />
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
