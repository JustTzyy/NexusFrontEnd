import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { TableIndexSkeleton } from "../../utils/skeletonLoaders";
import AppLayout from "../../layouts/AppLayout";
import { generatePDF, generatePersonalInfoPDF } from "../../utils/pdfExport";
import { applyFilters, getUniqueValues } from "../../utils/filterUtils";
import DateRangeFilter from "../../components/DateRangeFilter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { RotateCcw, Trash2, Search, X, AlertCircle, CheckCircle2, ArrowLeft, Printer } from "lucide-react";
import { roleService } from "@/services/roleService";
import PermissionGate from '@/components/PermissionGate';

export default function RolesArchive() {
    const navigate = useNavigate();

    /* ------------------------------ api state ------------------------------ */
    const [roles, setRoles] = useState([]);
    const [loading, setLoading] = useState(false);
    const [initialLoading, setInitialLoading] = useState(true); // Only true on first load
    const [error, setError] = useState("");

    /* ---------------------------- filter state ---------------------------- */
    const [q, setQ] = useState("");
    const [debouncedQ, setDebouncedQ] = useState(""); // Debounced search term for API calls
    const [fromDate, setFromDate] = useState(undefined);
    const [toDate, setToDate] = useState(undefined);
    const [permission, setPermission] = useState("all");

    /* -------------------------- pagination state -------------------------- */
    const [page, setPage] = useState(1);
    const pageSize = 10;
    const [pagination, setPagination] = useState({
        totalCount: 0,
        totalPages: 0,
        currentPage: 1,
        hasNextPage: false,
        hasPreviousPage: false,
    });

    /* -------------------------- modal state -------------------------- */
    const [viewModal, setViewModal] = useState({ open: false, role: null });
    const [restoreModal, setRestoreModal] = useState({ open: false, role: null });
    const [deleteModal, setDeleteModal] = useState({ open: false, role: null });

    /* -------------------------- alert state -------------------------- */
    const [alert, setAlert] = useState({ show: false, type: "success", message: "" });

    const resetPage = () => setPage(1);

    const clearFilters = () => {
        setQ("");
        setFromDate(undefined);
        setToDate(undefined);
        setPermission("all");
        setPage(1);
    };

    // PDF Export function using reusable utility
    const handlePrintPDF = () => {
        generatePDF({
            title: "Archived Roles Report",
            data: filtered.map(r => ({
                ...r,
                permissions: r.permissions.map(p => p.name).join(", "),
            })),
            columns: [
                { header: "Name", key: "name" },
                { header: "Permissions", key: "permissions" },
                { header: "Description", key: "description" },
                { header: "Deleted At", key: "deletedAt" },
            ],
            filters: {
                Search: q || null,
                "From Date": fromDate || null,
                "To Date": toDate || null,
                Permission: permission !== "all" ? permission : null,
            },
            companyName: "Archived Roles Management System",
        });
    };

    // Print single role in personal info format
    const handlePrintSinglePDF = (role) => {
        if (!role) return;

        generatePersonalInfoPDF({
            title: "Archived Role Details",
            data: {
                ...role,
                permissions: role.permissions.map(p => p.name).join(", "),
            },
            fields: [
                { label: "Role Name", key: "name" },
                { label: "Permissions", key: "permissions" },
                { label: "Description", key: "description" },
                { label: "Deleted At", key: "deletedAt" },
            ],
            companyName: "Role Management System",
            headerInfo: { name: role.name },
        });
    };

    /* ------------------------------ routes ------------------------------ */
    const goBack = () => navigate("/roles");

    /* ------------------------------ api ------------------------------ */
    const loadArchivedRoles = async () => {
        setLoading(true);
        setError("");

        try {
            const response = await roleService.getArchived({
                pageNumber: page,
                pageSize: pageSize,
                searchTerm: debouncedQ || undefined,
            });

            // Transform backend response to match frontend format
            const transformedRoles = response.data.items.map(role => ({
                id: role.id,
                name: role.name,
                permissions: role.permissions || [],
                description: role.description || "",
                deletedAt: role.deletedAt ? new Date(role.deletedAt).toLocaleDateString('en-CA') : "—",
            }));

            setRoles(transformedRoles);

            // Capture pagination metadata from backend
            setPagination({
                totalCount: response.data.totalCount || 0,
                totalPages: response.data.totalPages || 0,
                currentPage: response.data.pageNumber || 1,
                hasNextPage: response.data.hasNextPage || false,
                hasPreviousPage: response.data.hasPreviousPage || false,
            });
        } catch (err) {
            setError(err.message || "Failed to load archived roles");
            console.error("Error loading archived roles:", err);
        } finally {
            setLoading(false);
            setInitialLoading(false); // After first load, no more skeleton
        }
    };

    // Debounce search input to avoid excessive API calls
    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedQ(q);
        }, 300); // Wait 300ms after user stops typing

        return () => clearTimeout(timer);
    }, [q]);

    useEffect(() => {
        loadArchivedRoles();
    }, [page, debouncedQ]); // Reload when page or debounced search changes

    useEffect(() => {
        if (alert.show) {
            const timer = setTimeout(() => {
                setAlert({ show: false, type: "success", message: "" });
            }, 5000);
            return () => clearTimeout(timer);
        }
    }, [alert.show]);

    /* ------------------------------ modals ------------------------------ */
    const openViewModal = (role) => {
        setViewModal({ open: true, role });
    };

    const openRestoreModal = (role) => {
        setRestoreModal({ open: true, role });
    };

    const openDeleteModal = (role) => {
        setDeleteModal({ open: true, role });
    };

    const confirmView = () => {
        if (viewModal.role) {
            navigate(`/roles/${viewModal.role.id}`, { state: { from: "archive" } });
        }
        setViewModal({ open: false, role: null });
    };

    const confirmRestore = async () => {
        const r = restoreModal.role;
        setRestoreModal({ open: false, role: null });

        if (!r) return;

        try {
            await roleService.restore(r.id);
            setAlert({ show: true, type: "success", message: `Role "${r.name}" restored successfully!` });
            loadArchivedRoles(); // Refresh the list
        } catch (err) {
            setAlert({ show: true, type: "error", message: err.message || "Failed to restore role" });
            console.error("Error restoring role:", err);
        }
    };

    const confirmDelete = async () => {
        const r = deleteModal.role;
        setDeleteModal({ open: false, role: null });

        if (!r) return;

        try {
            await roleService.permanentDelete(r.id);
            setAlert({ show: true, type: "success", message: `Role "${r.name}" permanently deleted!` });
            loadArchivedRoles(); // Refresh the list
        } catch (err) {
            setAlert({ show: true, type: "error", message: err.message || "Failed to permanently delete role" });
            console.error("Error deleting role:", err);
        }
    };

    /* ------------------------- filtering ------------------------- */
    // Get all unique permissions from all roles
    const allPermissions = useMemo(() => {
        const permSet = new Map();
        roles.forEach(role => {
            role.permissions.forEach(p => {
                if (!permSet.has(p.name.toLowerCase())) {
                    permSet.set(p.name.toLowerCase(), p.name);
                }
            });
        });
        return Array.from(permSet.values()).sort();
    }, [roles]);

    // Frontend filtering for permission (since backend doesn't support permission filter yet)
    // Search and date filters are handled by the backend
    const filtered = useMemo(() => {
        if (permission === "all") {
            return roles;
        }
        
        return roles.filter(role =>
            role.permissions.some(p => p.name.toLowerCase() === permission.toLowerCase())
        );
    }, [roles, permission]);

    // Use filtered data (filtered by permission on frontend)
    const paged = filtered;

    // Format permissions as text
    const formatPermissions = (permissions) => {
        return permissions.map(p => p.name).join(", ");
    };

    return (
        <AppLayout title="Archived Roles" onPrint={filtered.length > 0 ? handlePrintPDF : undefined}>
            {initialLoading ? (
                <TableIndexSkeleton
                    columns={5}
                    rows={10}
                    headers={["Name", "Permissions", "Description", "Deleted At", "Actions"]}
                />
            ) : (
                <div className="space-y-6">
                    {/* Header */}
                    <div className="flex items-start justify-between gap-4">
                        <div>
                            <h1 className="text-3xl font-bold text-gray-900">Archived Roles</h1>
                            <p className="mt-1 text-sm text-gray-600">
                                View and manage soft-deleted roles
                            </p>
                        </div>

                        <div className="flex items-center gap-4">
                            {/* Alert Notification */}
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
                                    <AlertDescription className={`text-sm font-medium whitespace-nowrap ${alert.type === "success" ? "text-green-800" : "text-red-800"
                                        }`}>
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
                                    <Button variant="outline" onClick={goBack}>
                                        <ArrowLeft className="h-4 w-4 mr-2" />
                                        Back to Roles
                                    </Button>
                                </TooltipTrigger>
                                <TooltipContent>Return to active roles</TooltipContent>
                            </Tooltip>
                        </div>
                    </div>

                    {/* Error */}
                    {error && (
                        <Alert variant="destructive">
                            <AlertCircle className="h-4 w-4" />
                            <AlertDescription>{error}</AlertDescription>
                        </Alert>
                    )}

                    {/* Filters */}
                    <div className="space-y-3">
                        {/* Date Range Filter Component with Search and Permission Filter */}
                        <DateRangeFilter
                            fromDate={fromDate}
                            toDate={toDate}
                            onFromDateChange={(date) => {
                                setFromDate(date);
                                resetPage();
                            }}
                            onToDateChange={(date) => {
                                setToDate(date);
                                resetPage();
                            }}
                            onRangeChange={() => resetPage()}
                            leftElement={
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <div className="relative">
                                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                                            <Input
                                                placeholder="Search archived roles..."
                                                value={q}
                                                onChange={(e) => {
                                                    setQ(e.target.value);
                                                    resetPage();
                                                }}
                                                className="pl-10 w-[240px]"
                                            />
                                        </div>
                                    </TooltipTrigger>
                                    <TooltipContent>Search by name or description</TooltipContent>
                                </Tooltip>
                            }
                            rightElement={
                                <>
                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <div>
                                                <Select value={permission} onValueChange={(v) => { setPermission(v); resetPage(); }}>
                                                    <SelectTrigger className="w-[180px]">
                                                        <SelectValue placeholder="All Permissions" />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="all">All Permissions</SelectItem>
                                                        {allPermissions.map((p) => (
                                                            <SelectItem key={p} value={p.toLowerCase()}>
                                                                {p}
                                                            </SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                        </TooltipTrigger>
                                        <TooltipContent>Filter by permission</TooltipContent>
                                    </Tooltip>

                                    {/* Clear button */}
                                    {(q || fromDate || toDate || permission !== "all") && (
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

                    {/* Table */}
                    <div className="border rounded-lg overflow-hidden bg-white">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Name</TableHead>
                                    <TableHead>Permissions</TableHead>
                                    <TableHead>Description</TableHead>
                                    <TableHead>Deleted At</TableHead>
                                    <TableHead className="text-center">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {initialLoading ? (
                                    Array.from({ length: 5 }).map((_, i) => (
                                        <TableRow key={i}>
                                            <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                                            <TableCell><Skeleton className="h-4 w-48" /></TableCell>
                                            <TableCell><Skeleton className="h-4 w-40" /></TableCell>
                                            <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                                            <TableCell><Skeleton className="h-4 w-16 ml-auto" /></TableCell>
                                        </TableRow>
                                    ))
                                ) : paged.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={5} className="h-32 text-center text-gray-500">
                                            No archived roles found.
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    paged.map((r) => (
                                        <Tooltip key={r.id}>
                                            <TooltipTrigger asChild>
                                                <TableRow
                                                    className="cursor-pointer"
                                                    onClick={() => openViewModal(r)}
                                                >
                                                    <TableCell className="font-medium">{r.name}</TableCell>
                                                    <TableCell className="text-gray-600 max-w-[250px] truncate">
                                                        {formatPermissions(r.permissions)}
                                                    </TableCell>
                                                    <TableCell className="max-w-md truncate">{r.description || "—"}</TableCell>
                                                    <TableCell className="text-gray-600">{r.deletedAt}</TableCell>
                                                    <TableCell className="text-center">
                                                        <div className="flex items-center justify-center gap-1">
                                                            <PermissionGate permission="RestoreRoles">
                                                                <Tooltip>
                                                                    <TooltipTrigger asChild>
                                                                        <Button
                                                                            variant="ghost"
                                                                            size="icon"
                                                                            onClick={(e) => {
                                                                                e.stopPropagation();
                                                                                openRestoreModal(r);
                                                                            }}
                                                                            className="text-green-600 hover:text-green-700 hover:bg-green-50"
                                                                        >
                                                                            <RotateCcw className="h-4 w-4" />
                                                                        </Button>
                                                                    </TooltipTrigger>
                                                                    <TooltipContent>Restore role</TooltipContent>
                                                                </Tooltip>
                                                            </PermissionGate>
                                                            <PermissionGate permission="PermanentDeleteRoles">
                                                                <Tooltip>
                                                                    <TooltipTrigger asChild>
                                                                        <Button
                                                                            variant="ghost"
                                                                            size="icon"
                                                                            onClick={(e) => {
                                                                                e.stopPropagation();
                                                                                openDeleteModal(r);
                                                                            }}
                                                                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                                                        >
                                                                            <Trash2 className="h-4 w-4" />
                                                                        </Button>
                                                                    </TooltipTrigger>
                                                                    <TooltipContent>Permanently delete</TooltipContent>
                                                                </Tooltip>
                                                            </PermissionGate>
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

                        {/* Pagination */}
                        {!loading && paged.length > 0 && (
                            <div className="flex items-center justify-between border-t px-6 py-4">
                                <p className="text-sm text-gray-600">
                                    {permission !== "all" ? (
                                        // When permission filter is active, show frontend-filtered count
                                        `Showing ${paged.length} filtered result${paged.length !== 1 ? 's' : ''}`
                                    ) : (
                                        // When no permission filter, show backend pagination count
                                        `Showing ${(page - 1) * pageSize + 1} to ${Math.min(page * pageSize, pagination.totalCount)} of ${pagination.totalCount} results`
                                    )}
                                </p>
                                <div className="flex items-center gap-2">
                                    {permission === "all" && ( // Only show pagination controls when not filtering by permission
                                        <>
                                            <Tooltip>
                                                <TooltipTrigger asChild>
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={() => setPage(p => Math.max(1, p - 1))}
                                                        disabled={!pagination.hasPreviousPage}
                                                    >
                                                        Previous
                                                    </Button>
                                                </TooltipTrigger>
                                                <TooltipContent>Go to previous page</TooltipContent>
                                            </Tooltip>
                                            <span className="text-sm text-gray-600">
                                                Page {page} of {pagination.totalPages}
                                            </span>
                                            <Tooltip>
                                                <TooltipTrigger asChild>
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={() => setPage(p => Math.min(pagination.totalPages, p + 1))}
                                                        disabled={!pagination.hasNextPage}
                                                    >
                                                        Next
                                                    </Button>
                                                </TooltipTrigger>
                                                <TooltipContent>Go to next page</TooltipContent>
                                            </Tooltip>
                                        </>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* View Confirmation */}
            <Dialog open={viewModal.open} onOpenChange={(open) => !open && setViewModal({ open: false, role: null })}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>View Role Details</DialogTitle>
                        <DialogDescription>
                            You are about to view the archived role{" "}
                            <span className="font-semibold">{viewModal.role?.name}</span>. Do you want to
                            continue?
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setViewModal({ open: false, role: null })}>
                            Cancel
                        </Button>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Button variant="outline" onClick={() => handlePrintSinglePDF(viewModal.role)}>
                                    <Printer className="h-4 w-4 mr-2" />
                                    Print
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent>Print role details as PDF</TooltipContent>
                        </Tooltip>
                        <Button onClick={confirmView}>View Details</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Restore Confirmation */}
            <AlertDialog open={restoreModal.open} onOpenChange={(open) => !open && setRestoreModal({ open: false, role: null })}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Confirm Restore</AlertDialogTitle>
                        <AlertDialogDescription>
                            Are you sure you want to restore the role{" "}
                            <span className="font-semibold">{restoreModal.role?.name}</span>?
                            This will move it back to the active roles list.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={confirmRestore} className="bg-green-600 hover:bg-green-700">
                            Restore
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            {/* Permanent Delete Confirmation */}
            <AlertDialog open={deleteModal.open} onOpenChange={(open) => !open && setDeleteModal({ open: false, role: null })}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Confirm Permanent Delete</AlertDialogTitle>
                        <AlertDialogDescription>
                            Are you sure you want to <span className="font-semibold text-red-600">permanently delete</span> the role{" "}
                            <span className="font-semibold">{deleteModal.role?.name}</span>?
                            This action cannot be undone.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={confirmDelete} className="bg-red-600 hover:bg-red-700">
                            Permanently Delete
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </AppLayout>
    );
}
