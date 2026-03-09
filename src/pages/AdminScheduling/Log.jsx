import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { tutoringRequestService } from "../../services/tutoringRequestService";
import AppLayout from "../../layouts/AppLayout";
import { generatePDF } from "../../utils/pdfExport";
import DateRangeFilter from "../../components/DateRangeFilter";
import { TableIndexSkeleton } from "../../utils/skeletonLoaders";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Search, AlertCircle } from "lucide-react";

const STATUS_CONFIG = {
    "Waiting for Admin Approval":   { color: "bg-amber-50 text-amber-700 ring-1 ring-amber-200",   label: "Waiting for Admin Approval" },
    "Pending Student Interest":     { color: "bg-cyan-50 text-cyan-700 ring-1 ring-cyan-200",       label: "Pending Student Interest" },
    "Teacher Assigned":             { color: "bg-purple-50 text-purple-700 ring-1 ring-purple-200", label: "Teacher Assigned" },
    "Waiting for Teacher Approval": { color: "bg-orange-50 text-orange-700 ring-1 ring-orange-200", label: "Waiting for Teacher Approval" },
    "Confirmed":                    { color: "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200", label: "Confirmed" },
    "Cancelled by Student":         { color: "bg-gray-50 text-gray-500 ring-1 ring-gray-200",       label: "Cancelled by Student" },
    "Cancelled by Admin":           { color: "bg-red-50 text-red-600 ring-1 ring-red-200",         label: "Cancelled by Admin" },
};

const getStatusConfig = (s) =>
    STATUS_CONFIG[s] || { color: "bg-gray-50 text-gray-600 ring-1 ring-gray-200", label: s || "—" };

const formatDateTime = (dateString) => {
    if (!dateString) return "—";
    return new Date(dateString).toLocaleString("en-US", {
        year: "numeric", month: "short", day: "numeric",
        hour: "2-digit", minute: "2-digit",
    });
};

export default function AdminRequestLog() {
    const navigate = useNavigate();

    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const [q, setQ] = useState("");
    const [debouncedQ, setDebouncedQ] = useState("");
    const [fromDate, setFromDate] = useState(undefined);
    const [toDate, setToDate] = useState(undefined);
    const [statusFilter, setStatusFilter] = useState("all");

    const [page, setPage] = useState(1);
    const [totalCount, setTotalCount] = useState(0);
    const [totalPages, setTotalPages] = useState(0);
    const pageSize = 10;

    const [viewModal, setViewModal] = useState({ open: false, item: null });

    /* debounce search */
    useEffect(() => {
        const t = setTimeout(() => { setDebouncedQ(q); setPage(1); }, 400);
        return () => clearTimeout(t);
    }, [q]);

    const clearFilters = () => {
        setQ(""); setDebouncedQ(""); setFromDate(undefined);
        setToDate(undefined); setStatusFilter("all"); setPage(1);
    };

    const handlePrintPDF = () => {
        generatePDF({
            title: "Admin Request Log Report",
            data: logs.map(l => ({ ...l, changedAt: formatDateTime(l.changedAt) })),
            columns: [
                { header: "User",       key: "changedByName" },
                { header: "Building",   key: "buildingName" },
                { header: "Subject",    key: "subjectName" },
                { header: "Created At", key: "changedAt" },
                { header: "Status",     key: "toStatus" },
            ],
            companyName: "Learning Flow Management System",
        });
    };

    const loadLogs = useCallback(async () => {
        setLoading(true);
        setError("");
        try {
            const res = await tutoringRequestService.getStatusHistory();
            let items = res.data?.data || res.data || [];

            // filter to admin requests only
            items = items.filter(h => h.isAdminCreated);

            // search filter
            if (debouncedQ) {
                const sq = debouncedQ.toLowerCase();
                items = items.filter(h =>
                    h.changedByName?.toLowerCase().includes(sq) ||
                    h.buildingName?.toLowerCase().includes(sq) ||
                    h.subjectName?.toLowerCase().includes(sq)
                );
            }

            // date filter
            if (fromDate) items = items.filter(h => new Date(h.changedAt) >= new Date(fromDate));
            if (toDate)   items = items.filter(h => new Date(h.changedAt) <= new Date(toDate + "T23:59:59"));

            // status filter
            if (statusFilter !== "all") items = items.filter(h => h.toStatus === statusFilter);

            // sort newest first
            items = items.slice().sort((a, b) => new Date(b.changedAt) - new Date(a.changedAt));

            setTotalCount(items.length);
            setTotalPages(Math.max(1, Math.ceil(items.length / pageSize)));
            setLogs(items.slice((page - 1) * pageSize, page * pageSize));
        } catch (err) {
            console.error(err);
            setError(err.message || "Failed to load admin request log");
            setLogs([]);
        } finally {
            setLoading(false);
        }
    }, [page, pageSize, debouncedQ, statusFilter, fromDate, toDate]);

    useEffect(() => { loadLogs(); }, [loadLogs]);

    const openViewModal = (item) => setViewModal({ open: true, item });

    const confirmView = () => {
        if (viewModal.item) navigate(`/admin-scheduling/log/${viewModal.item.id}`, { state: { item: viewModal.item } });
        setViewModal({ open: false, item: null });
    };

    return (
        <AppLayout title="Admin Request Log" onPrint={logs.length > 0 ? handlePrintPDF : undefined}>
            {loading && logs.length === 0 ? (
                <TableIndexSkeleton
                    columns={5} rows={10} showAddButton={false} showExtraFilter={false}
                    headers={["User", "Building", "Subject", "Created At", "Status"]}
                />
            ) : (
                <div className="space-y-6">
                    <div className="flex items-start justify-between gap-4">
                        <div>
                            <h1 className="text-3xl font-bold text-gray-900">Admin Request Log</h1>
                            <p className="mt-1 text-sm text-gray-600">
                                Track all status changes for admin-created tutoring schedules
                            </p>
                        </div>
                    </div>

                    {/* Filters */}
                    <div className="space-y-3">
                        <DateRangeFilter
                            fromDate={fromDate} toDate={toDate}
                            onFromDateChange={(date) => { setFromDate(date); setPage(1); }}
                            onToDateChange={(date) => { setToDate(date); setPage(1); }}
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
                                    <TooltipContent>Search by user, subject, or building</TooltipContent>
                                </Tooltip>
                            }
                            rightElement={
                                <>
                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <div>
                                                <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setPage(1); }}>
                                                    <SelectTrigger className="w-[280px]">
                                                        <SelectValue placeholder="All Statuses" />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="all">All Statuses</SelectItem>
                                                        <SelectItem value="Waiting for Admin Approval">Waiting for Admin Approval</SelectItem>
                                                        <SelectItem value="Pending Student Interest">Pending Student Interest</SelectItem>
                                                        <SelectItem value="Teacher Assigned">Teacher Assigned</SelectItem>
                                                        <SelectItem value="Waiting for Teacher Approval">Waiting for Teacher Approval</SelectItem>
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
                                                <Button variant="outline" size="sm" onClick={clearFilters}>Clear</Button>
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
                                    <TableHead>Building</TableHead>
                                    <TableHead>Subject</TableHead>
                                    <TableHead>Created At</TableHead>
                                    <TableHead className="text-center">Status</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {logs.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={5} className="h-32 text-center text-gray-500">
                                            No admin request logs found.
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    logs.map((item) => {
                                        const cfg = getStatusConfig(item.toStatus);
                                        return (
                                            <Tooltip key={item.id}>
                                                <TooltipTrigger asChild>
                                                    <TableRow className="cursor-pointer" onClick={() => openViewModal(item)}>
                                                        <TableCell className="font-medium">{item.changedByName || "—"}</TableCell>
                                                        <TableCell className="text-gray-600">{item.buildingName}</TableCell>
                                                        <TableCell className="text-gray-600">{item.subjectName}</TableCell>
                                                        <TableCell className="text-gray-600">{formatDateTime(item.changedAt)}</TableCell>
                                                        <TableCell className="text-center">
                                                            <div className="relative flex items-center justify-center">
                                                                <span className={`text-[11px] font-semibold tracking-wide px-2.5 py-1 rounded-full whitespace-nowrap ${cfg.color}`}>
                                                                    {cfg.label}
                                                                </span>
                                                            </div>
                                                        </TableCell>
                                                    </TableRow>
                                                </TooltipTrigger>
                                                <TooltipContent>Click to view details</TooltipContent>
                                            </Tooltip>
                                        );
                                    })
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
                                            <Button variant="outline" size="sm" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}>
                                                Previous
                                            </Button>
                                        </TooltipTrigger>
                                        <TooltipContent>Go to previous page</TooltipContent>
                                    </Tooltip>
                                    <span className="text-sm text-gray-600">Page {page} of {totalPages}</span>
                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <Button variant="outline" size="sm" onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}>
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

            <Dialog open={viewModal.open} onOpenChange={(open) => !open && setViewModal({ open: false, item: null })}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>View Status Change Detail</DialogTitle>
                        <DialogDescription>
                            Would you like to view the detailed information of this status change performed by{" "}
                            <span className="font-semibold">{viewModal.item?.changedByName || "System"}</span>?
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setViewModal({ open: false, item: null })}>Cancel</Button>
                        <Button onClick={confirmView}>View Details</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </AppLayout>
    );
}
