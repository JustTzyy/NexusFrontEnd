import { useEffect, useState, useCallback } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { TableIndexSkeleton } from "../../utils/skeletonLoaders";
import AppLayout from "../../layouts/AppLayout";
import { generatePDF } from "../../utils/pdfExport";
import DateRangeFilter from "../../components/DateRangeFilter";
import { operationLogService } from "../../services/operationLogService";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tooltip, TooltipContent, TooltipTrigger, } from "@/components/ui/tooltip";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue, } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, } from "@/components/ui/dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Search, X, AlertCircle, CheckCircle2, Pencil, Trash2 } from "lucide-react";

const ACTIONS = [
    { value: "login", label: "Login" },
    { value: "logout", label: "Logout" },
    { value: "failed_login", label: "Failed Login" },
];

const STATUSES = [
    { value: "success", label: "Success" },
    { value: "failed", label: "Failed" },
];

export default function OperationLogIndex() {
    const navigate = useNavigate();
    const location = useLocation();

    /* ------------------------------ api state ------------------------------ */
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    /* ---------------------------- filter state ---------------------------- */
    const [q, setQ] = useState("");
    const [debouncedQ, setDebouncedQ] = useState("");
    const [fromDate, setFromDate] = useState(undefined);
    const [toDate, setToDate] = useState(undefined);
    const [action, setAction] = useState("all");
    const [status, setStatus] = useState("all");

    /* -------------------------- pagination state -------------------------- */
    const [page, setPage] = useState(1);
    const [totalCount, setTotalCount] = useState(0);
    const [totalPages, setTotalPages] = useState(0);
    const pageSize = 10;

    /* -------------------------- modal state -------------------------- */
    const [viewModal, setViewModal] = useState({ open: false, log: null });

    /* -------------------------- alert state -------------------------- */
    const [alert, setAlert] = useState({ show: false, type: "success", message: "" });

    /* -------------------------- debounce search -------------------------- */
    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedQ(q);
            setPage(1);
        }, 400);
        return () => clearTimeout(timer);
    }, [q]);

    const clearFilters = () => {
        setQ("");
        setDebouncedQ("");
        setFromDate(undefined);
        setToDate(undefined);
        setAction("all");
        setStatus("all");
        setPage(1);
    };

    const handlePrintPDF = () => {
        generatePDF({
            title: "Operation Log Report",
            data: logs.map(l => ({
                ...l,
                createdAt: formatDateTime(l.createdAt),
            })),
            columns: [
                { header: "User", key: "user" },
                { header: "Action", key: "action" },
                { header: "Status", key: "status" },
                { header: "Device", key: "device" },
                { header: "Created At", key: "createdAt" },
            ],
            filters: {
                Search: debouncedQ || null,
                "From Date": fromDate || null,
                "To Date": toDate || null,
                Action: action !== "all" ? action : null,
                Status: status !== "all" ? status : null,
            },
            companyName: "Operation Log System",
        });
    };

    /* ------------------------------ api ------------------------------ */
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

            const response = await operationLogService.getAll(params);
            const data = response.data;

            setLogs(data.items || []);
            setTotalCount(data.totalCount || 0);
            setTotalPages(data.totalPages || 0);
        } catch (err) {
            console.error("Error loading operation logs:", err);
            setError(err.message || "Failed to load operation logs");
            setLogs([]);
        } finally {
            setLoading(false);
        }
    }, [page, pageSize, debouncedQ, action, status, fromDate, toDate]);

    useEffect(() => {
        loadLogs();
    }, [loadLogs]);

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

    const openViewModal = (log) => setViewModal({ open: true, log });

    const confirmView = () => {
        if (viewModal.log) {
            navigate(`/operation-logs/${viewModal.log.id}`);
        }
        setViewModal({ open: false, log: null });
    };

    const formatDateTime = (dateString) => {
        if (!dateString) return "—";
        const date = new Date(dateString);
        return date.toLocaleString("en-US", {
            timeZone: "Asia/Manila",
            year: "numeric",
            month: "short",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit",
        });
    };

    const getActionColor = (act) => {
        switch (act?.toLowerCase()) {
            case "login": return "text-blue-600";
            case "logout": return "text-gray-500";
            case "failed_login": return "text-red-600";
            default: return "text-gray-600";
        }
    };

    const getActionLabel = (act) => {
        switch (act?.toLowerCase()) {
            case "login": return "Login";
            case "logout": return "Logout";
            case "failed_login": return "Failed Login";
            default: return act;
        }
    };

    const getStatusColor = (st) => {
        if (st?.toLowerCase() === "success") {
            return "text-green-600";
        }
        return "text-red-600";
    };

    const getStatusLabel = (st) => {
        if (st?.toLowerCase() === "success") return "Success";
        if (st?.toLowerCase() === "failed") return "Failed";
        return st || "—";
    };

    const truncateDevice = (device) => {
        if (!device) return "—";
        if (device.length > 50) return device.substring(0, 50) + "...";
        return device;
    };

    return (
        <AppLayout title="Operation Log" onPrint={logs.length > 0 ? handlePrintPDF : undefined}>
            {loading && logs.length === 0 ? (
                <TableIndexSkeleton
                    columns={5}
                    rows={10}
                    showAddButton={false}
                    showExtraFilter={false}
                    headers={["User", "Status", "Device", "Created At", "Action"]}
                />
            ) : (
                <div className="space-y-6">
                    <div className="flex items-start justify-between gap-4">
                        <div>
                            <h1 className="text-3xl font-bold text-gray-900">Operation Log</h1>
                            <p className="mt-1 text-sm text-gray-600">
                                Track user login and logout activities
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
                                    <AlertDescription className={`text-sm whitespace-nowrap ${alert.type === "success" ? "text-green-800" : "text-red-800"
                                        }`}>
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
                        </div>
                    </div>

                    {/* Filters */}
                    <div className="space-y-3">
                        <DateRangeFilter
                            fromDate={fromDate}
                            toDate={toDate}
                            onFromDateChange={(date) => {
                                setFromDate(date);
                                setPage(1);
                            }}
                            onToDateChange={(date) => {
                                setToDate(date);
                                setPage(1);
                            }}
                            onRangeChange={() => setPage(1)}
                            leftElement={
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <div className="relative">
                                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                                            <Input
                                                placeholder="Search logs..."
                                                value={q}
                                                onChange={(e) => setQ(e.target.value)}
                                                className="pl-10 w-[240px]"
                                            />
                                        </div>
                                    </TooltipTrigger>
                                    <TooltipContent>Search by user, action, status, or device</TooltipContent>
                                </Tooltip>
                            }
                            rightElement={
                                <>
                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <div>
                                                <Select value={action} onValueChange={(v) => { setAction(v); setPage(1); }}>
                                                    <SelectTrigger className="w-[160px]">
                                                        <SelectValue placeholder="All Actions" />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="all">All Actions</SelectItem>
                                                        {ACTIONS.map((a) => (
                                                            <SelectItem key={a.value} value={a.value}>
                                                                {a.label}
                                                            </SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                        </TooltipTrigger>
                                        <TooltipContent>Filter by action</TooltipContent>
                                    </Tooltip>

                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <div>
                                                <Select value={status} onValueChange={(v) => { setStatus(v); setPage(1); }}>
                                                    <SelectTrigger className="w-[140px]">
                                                        <SelectValue placeholder="All Status" />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="all">All Status</SelectItem>
                                                        {STATUSES.map((s) => (
                                                            <SelectItem key={s.value} value={s.value}>
                                                                {s.label}
                                                            </SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                        </TooltipTrigger>
                                        <TooltipContent>Filter by status</TooltipContent>
                                    </Tooltip>

                                    {/* Clear button */}
                                    {(q || fromDate || toDate || action !== "all" || status !== "all") && (
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

                    {error && (
                        <Alert variant="destructive">
                            <AlertCircle className="h-4 w-4" />
                            <AlertDescription>{error}</AlertDescription>
                        </Alert>
                    )}

                    <div className="border rounded-lg overflow-hidden bg-white">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>User</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead>Device</TableHead>
                                    <TableHead>Created At</TableHead>
                                    <TableHead className="text-center">Action</TableHead>
                                </TableRow>
                            </TableHeader>

                            <TableBody>
                                {logs.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={5} className="h-32 text-center text-gray-500">
                                            No operation logs found.
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    logs.map((log) => (
                                        <Tooltip key={log.id}>
                                            <TooltipTrigger asChild>
                                                <TableRow
                                                    className="cursor-pointer"
                                                    onClick={() => openViewModal(log)}
                                                >
                                                    <TableCell className="font-medium">{log.user || "Unknown"}</TableCell>
                                                    <TableCell>
                                                        <span className={`font-medium ${getStatusColor(log.status)}`}>
                                                            {getStatusLabel(log.status)}
                                                        </span>
                                                    </TableCell>
                                                    <TableCell className="text-gray-600 max-w-xs truncate">{truncateDevice(log.device)}</TableCell>
                                                    <TableCell className="text-gray-600">{formatDateTime(log.createdAt)}</TableCell>
                                                    {/* ACTION COLUMN WITH COLOR & INVISIBLE SIZE TRICK */}
                                                    <TableCell className="text-center">
                                                        <div className="relative flex items-center justify-center">
                                                            <span className={`absolute font-semibold ${getActionColor(log.action)}`}>
                                                                {getActionLabel(log.action)}
                                                            </span>
                                                            <div className="flex items-center justify-center gap-1 invisible select-none">
                                                                <Button variant="ghost" size="icon">
                                                                    <Pencil className="h-4 w-4" />
                                                                </Button>
                                                                <Button variant="ghost" size="icon">
                                                                    <Trash2 className="h-4 w-4" />
                                                                </Button>
                                                            </div>
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

                        {!loading && logs.length > 0 && (
                            <div className="flex items-center justify-between border-t px-6 py-4">
                                <p className="text-sm text-gray-600">
                                    Showing {(page - 1) * pageSize + 1} to {Math.min(page * pageSize, totalCount)} of {totalCount} results
                                </p>
                                <div className="flex items-center gap-2">
                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => setPage(p => Math.max(1, p - 1))}
                                                disabled={page === 1}
                                            >
                                                Previous
                                            </Button>
                                        </TooltipTrigger>
                                        <TooltipContent>Go to previous page</TooltipContent>
                                    </Tooltip>
                                    <span className="text-sm text-gray-600">
                                        Page {page} of {totalPages}
                                    </span>
                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                                                disabled={page === totalPages}
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
            )}

            <Dialog open={viewModal.open} onOpenChange={(open) => !open && setViewModal({ open: false, log: null })}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>View Operation Detail</DialogTitle>
                        <DialogDescription>
                            Would you like to view the detailed information of this {viewModal.log?.action} activity by <span className="font-semibold">{viewModal.log?.user || "Unknown"}</span>?
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setViewModal({ open: false, log: null })}>
                            Cancel
                        </Button>
                        <Button onClick={confirmView}>
                            View Details
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </AppLayout>
    );
}
