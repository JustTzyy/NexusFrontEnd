import { useEffect, useState, useCallback } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { userService } from "../../services/userService";
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
import { Search, AlertCircle, Pencil, Trash2 } from "lucide-react";

const getRoleColor = (roles = "") => {
    if (roles.includes("Customer")) return "text-emerald-600";
    if (roles.includes("Lead")) return "text-amber-600";
    return "text-gray-600";
};

const formatDateTime = (dateString) => {
    if (!dateString) return "—";
    return new Date(dateString).toLocaleString("en-US", {
        year: "numeric", month: "short", day: "numeric",
        hour: "2-digit", minute: "2-digit",
    });
};

export default function ClientLogIndex() {
    const navigate = useNavigate();
    const location = useLocation();

    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const [q, setQ] = useState("");
    const [debouncedQ, setDebouncedQ] = useState("");
    const [fromDate, setFromDate] = useState(undefined);
    const [toDate, setToDate] = useState(undefined);
    const [roleFilter, setRoleFilter] = useState("all");

    const [page, setPage] = useState(1);
    const [totalCount, setTotalCount] = useState(0);
    const [totalPages, setTotalPages] = useState(0);
    const pageSize = 10;

    const [viewModal, setViewModal] = useState({ open: false, item: null });
    const [alert, setAlert] = useState({ show: false, type: "success", message: "" });

    /* debounce */
    useEffect(() => {
        const t = setTimeout(() => { setDebouncedQ(q); setPage(1); }, 400);
        return () => clearTimeout(t);
    }, [q]);

    const clearFilters = () => {
        setQ(""); setDebouncedQ(""); setFromDate(undefined);
        setToDate(undefined); setRoleFilter("all"); setPage(1);
    };

    const handlePrintPDF = () => {
        generatePDF({
            title: "Client Log Report",
            data: items.map(i => ({
                ...i,
                createdAt: formatDateTime(i.createdAt),
                buildingName: i.buildingName || "—",
            })),
            columns: [
                { header: "Name", key: "fullName" },
                { header: "Building", key: "buildingName" },
                { header: "Email", key: "email" },
                { header: "Created At", key: "createdAt" },
                { header: "Role", key: "roles" },
            ],
            filters: {
                Search: debouncedQ || null,
                "From Date": fromDate || null,
                "To Date": toDate || null,
                Role: roleFilter !== "all" ? roleFilter : null,
            },
            companyName: "Learning Flow Management System",
        });
    };

    const loadItems = useCallback(async () => {
        setLoading(true);
        setError("");
        try {
            const params = {
                pageNumber: page,
                pageSize,
                searchTerm: debouncedQ || undefined,
                fromDate: fromDate || undefined,
                toDate: toDate || undefined,
            };
            const res = await userService.getClients(params);
            let data = res.data?.data || res.data || {};
            let list = data.items || [];

            // Client-side role filter (only Lead / Customer already returned — sub-filter)
            if (roleFilter !== "all") {
                list = list.filter(i => i.roles?.includes(roleFilter));
            }

            setTotalCount(data.totalCount || list.length);
            setTotalPages(data.totalPages || Math.max(1, Math.ceil((data.totalCount || list.length) / pageSize)));
            setItems(list);
        } catch (err) {
            console.error(err);
            setError(err.message || "Failed to load client log");
            setItems([]);
        } finally {
            setLoading(false);
        }
    }, [page, pageSize, debouncedQ, roleFilter, fromDate, toDate]);

    useEffect(() => { loadItems(); }, [loadItems]);

    /* alert from navigation state */
    useEffect(() => {
        if (location.state?.alert) {
            setAlert({ show: true, type: location.state.alert.type, message: location.state.alert.message });
            window.history.replaceState({}, document.title);
        }
    }, [location]);

    useEffect(() => {
        if (alert.show) {
            const t = setTimeout(() => setAlert({ show: false, type: "success", message: "" }), 3000);
            return () => clearTimeout(t);
        }
    }, [alert.show]);

    const openViewModal = (item) => setViewModal({ open: true, item });
    const confirmView = () => {
        if (viewModal.item) navigate(`/client-log/${viewModal.item.id}`);
        setViewModal({ open: false, item: null });
    };

    return (
        <AppLayout title="Client Log" onPrint={items.length > 0 ? handlePrintPDF : undefined}>
            {loading && items.length === 0 ? (
                <TableIndexSkeleton
                    columns={5} rows={10} showAddButton={false} showExtraFilter={false}
                    headers={["Name", "Building", "Email", "Created At", "Role"]}
                />
            ) : (
                <div className="space-y-6">
                    <div className="flex items-start justify-between gap-4">
                        <div>
                            <h1 className="text-3xl font-bold text-gray-900">Client Log</h1>
                            <p className="mt-1 text-sm text-gray-600">
                                View all registered Leads and Customers with their activity history
                            </p>
                        </div>
                    </div>

                    {/* Filters */}
                    <div className="space-y-3">
                        <DateRangeFilter
                            fromDate={fromDate} toDate={toDate}
                            onFromDateChange={(d) => { setFromDate(d); setPage(1); }}
                            onToDateChange={(d) => { setToDate(d); setPage(1); }}
                            onRangeChange={() => setPage(1)}
                            leftElement={
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <div className="relative">
                                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                                            <Input
                                                placeholder="Search by name or email..."
                                                value={q}
                                                onChange={(e) => setQ(e.target.value)}
                                                className="pl-10 w-[240px]"
                                            />
                                        </div>
                                    </TooltipTrigger>
                                    <TooltipContent>Search by name or email</TooltipContent>
                                </Tooltip>
                            }
                            rightElement={
                                <>
                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <div>
                                                <Select value={roleFilter} onValueChange={(v) => { setRoleFilter(v); setPage(1); }}>
                                                    <SelectTrigger className="w-[160px]">
                                                        <SelectValue placeholder="All Roles" />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="all">All Roles</SelectItem>
                                                        <SelectItem value="Lead">Lead</SelectItem>
                                                        <SelectItem value="Customer">Customer</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                        </TooltipTrigger>
                                        <TooltipContent>Filter by role</TooltipContent>
                                    </Tooltip>

                                    {(q || fromDate || toDate || roleFilter !== "all") && (
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
                                    <TableHead>Name</TableHead>
                                    <TableHead>Building</TableHead>
                                    <TableHead>Email</TableHead>
                                    <TableHead>Created At</TableHead>
                                    <TableHead className="text-center">Role</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {items.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={5} className="h-32 text-center text-gray-500">
                                            No client records found.
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    items.map((item) => (
                                        <Tooltip key={item.id}>
                                            <TooltipTrigger asChild>
                                                <TableRow className="cursor-pointer" onClick={() => openViewModal(item)}>
                                                    <TableCell className="font-medium">{item.fullName}</TableCell>
                                                    <TableCell className="text-gray-600">{item.buildingName || "—"}</TableCell>
                                                    <TableCell className="text-gray-600">{item.email}</TableCell>
                                                    <TableCell className="text-gray-600">{formatDateTime(item.createdAt)}</TableCell>
                                                    <TableCell className="text-center">
                                                        <div className="inline-grid place-items-center">
                                                            <span className={`col-start-1 row-start-1 font-semibold whitespace-nowrap ${getRoleColor(item.roles)}`}>
                                                                {item.roles || "—"}
                                                            </span>
                                                            <div className="col-start-1 row-start-1 flex items-center justify-center gap-1 invisible select-none">
                                                                <Button variant="ghost" size="icon"><Pencil className="h-4 w-4" /></Button>
                                                                <Button variant="ghost" size="icon"><Trash2 className="h-4 w-4" /></Button>
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

                        {!loading && items.length > 0 && (
                            <div className="flex items-center justify-between border-t px-6 py-4">
                                <p className="text-sm text-gray-600">
                                    Showing {(page - 1) * pageSize + 1} to {Math.min(page * pageSize, totalCount)} of {totalCount} results
                                </p>
                                <div className="flex items-center gap-2">
                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <Button variant="outline" size="sm" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}>Previous</Button>
                                        </TooltipTrigger>
                                        <TooltipContent>Go to previous page</TooltipContent>
                                    </Tooltip>
                                    <span className="text-sm text-gray-600">Page {page} of {totalPages}</span>
                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <Button variant="outline" size="sm" onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}>Next</Button>
                                        </TooltipTrigger>
                                        <TooltipContent>Go to next page</TooltipContent>
                                    </Tooltip>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* View confirm dialog */}
            <Dialog open={viewModal.open} onOpenChange={(open) => !open && setViewModal({ open: false, item: null })}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>View Client Details</DialogTitle>
                        <DialogDescription>
                            Would you like to view the full activity history for{" "}
                            <span className="font-semibold">{viewModal.item?.fullName}</span>?
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
