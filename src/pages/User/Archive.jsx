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
import { userService } from "@/services/userService";
import PermissionGate from '@/components/PermissionGate';

export default function UsersArchive() {
    const navigate = useNavigate();

    /* ------------------------------ api state ------------------------------ */
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(false);
    const [initialLoading, setInitialLoading] = useState(true); // Only true on first load
    const [error, setError] = useState("");

    /* ---------------------------- filter state ---------------------------- */
    const [q, setQ] = useState("");
    const [debouncedQ, setDebouncedQ] = useState(""); // Debounced search term for API calls
    const [fromDate, setFromDate] = useState(undefined);
    const [toDate, setToDate] = useState(undefined);
    const [role, setRole] = useState("all");

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
    const [viewModal, setViewModal] = useState({ open: false, user: null });
    const [restoreModal, setRestoreModal] = useState({ open: false, user: null });
    const [deleteModal, setDeleteModal] = useState({ open: false, user: null });

    /* -------------------------- alert state -------------------------- */
    const [alert, setAlert] = useState({ show: false, type: "success", message: "" });

    const resetPage = () => setPage(1);

    const clearFilters = () => {
        setQ("");
        setFromDate(undefined);
        setToDate(undefined);
        setRole("all");
        setPage(1);
    };

    // PDF Export function using reusable utility
    const handlePrintPDF = () => {
        generatePDF({
            title: "Archived Users Report",
            data: filtered,
            columns: [
                { header: "Name", key: "name" },
                { header: "Role", key: "role" },
                { header: "Email", key: "email" },
                { header: "Deleted At", key: "deletedAt" },
            ],
            filters: {
                Search: q || null,
                "From Date": fromDate || null,
                "To Date": toDate || null,
                Role: role !== "all" ? role : null,
            },
            companyName: "Archived Users Management System",
        });
    };

    // Print single user in personal info format
    const handlePrintSinglePDF = (user) => {
        if (!user) return;

        generatePersonalInfoPDF({
            title: "Archived User Details",
            data: user,
            fields: [
                { label: "User Name", key: "name" },
                { label: "Role", key: "role" },
                { label: "Email", key: "email" },
                { label: "Deleted At", key: "deletedAt" },
            ],
            companyName: "User Management System",
            headerInfo: { name: user.name },
        });
    };

    /* ------------------------------ routes ------------------------------ */
    const goBack = () => navigate("/users");

    /* ------------------------------ api ------------------------------ */
    const loadArchivedUsers = async () => {
        setLoading(true);
        setError("");

        try {
            const response = await userService.getArchived({
                pageNumber: page,
                pageSize: pageSize,
                searchTerm: debouncedQ || undefined,
            });

            // Transform backend response to match frontend format
            const transformedUsers = response.data.items.map(user => ({
                id: user.id,
                name: user.fullName,  // Use fullName from API
                role: user.roleName || 'No Role',  // Use roleName (single string)
                email: user.email,
                deletedAt: user.deletedAt ? new Date(user.deletedAt).toLocaleDateString('en-CA') : "—",
            }));

            setUsers(transformedUsers);

            // Capture pagination metadata from backend
            setPagination({
                totalCount: response.data.totalCount || 0,
                totalPages: response.data.totalPages || 0,
                currentPage: response.data.pageNumber || 1,
                hasNextPage: response.data.hasNextPage || false,
                hasPreviousPage: response.data.hasPreviousPage || false,
            });
        } catch (err) {
            setError(err.message || "Failed to load archived users");
            console.error("Error loading archived users:", err);
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
        loadArchivedUsers();
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
    const openViewModal = (user) => {
        setViewModal({ open: true, user });
    };

    const openRestoreModal = (user) => {
        setRestoreModal({ open: true, user });
    };

    const openDeleteModal = (user) => {
        setDeleteModal({ open: true, user });
    };

    const confirmView = () => {
        if (viewModal.user) {
            navigate(`/users/${viewModal.user.id}`, { state: { from: "archive" } });
        }
        setViewModal({ open: false, user: null });
    };

    const confirmRestore = async () => {
        const u = restoreModal.user;
        setRestoreModal({ open: false, user: null });

        if (!u) return;

        try {
            await userService.restore(u.id);
            setAlert({ show: true, type: "success", message: `User "${u.name}" restored successfully!` });
            loadArchivedUsers(); // Refresh the list
        } catch (err) {
            setAlert({ show: true, type: "error", message: err.message || "Failed to restore user" });
            console.error("Error restoring user:", err);
        }
    };

    const confirmDelete = async () => {
        const u = deleteModal.user;
        setDeleteModal({ open: false, user: null });

        if (!u) return;

        try {
            await userService.permanentDelete(u.id);
            setAlert({ show: true, type: "success", message: `User "${u.name}" permanently deleted!` });
            loadArchivedUsers(); // Refresh the list
        } catch (err) {
            setAlert({ show: true, type: "error", message: err.message || "Failed to permanently delete user" });
            console.error("Error deleting user:", err);
        }
    };

    /* ------------------------- filtering (using reusable utilities) ------------------------- */
    const filtered = useMemo(() => {
        return applyFilters(users, {
            search: q,
            searchFields: ['name', 'email', 'role'],
            fromDate,
            toDate,
            dateField: 'deletedAt',
            fields: {
                role: role,
            },
        });
    }, [users, q, fromDate, toDate, role]);

    // Use backend-paginated data directly (no frontend re-pagination)
    const paged = users; // Already paginated by backend

    const roles = useMemo(() => {
        // Filter out Lead and Customer roles from dropdown
        return getUniqueValues(users, 'role').filter(
            role => role !== 'Lead' && role !== 'Customer'
        );
    }, [users]);

    return (
        <AppLayout title="Archived Users" onPrint={filtered.length > 0 ? handlePrintPDF : undefined}>
            {initialLoading ? (
                <TableIndexSkeleton
                    columns={5}
                    rows={10}
                    headers={["Name", "Role", "Email", "Deleted At", "Actions"]}
                />
            ) : (
                <div className="space-y-6">
                    {/* Header */}
                    <div className="flex items-start justify-between gap-4">
                        <div>
                            <h1 className="text-3xl font-bold text-gray-900">Archived Users</h1>
                            <p className="mt-1 text-sm text-gray-600">
                                View and manage soft-deleted users
                            </p>
                        </div>

                        <div className="flex items-center gap-4">
                            {/* Alert Notification - in header for consistency */}
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
                                        Back to Users
                                    </Button>
                                </TooltipTrigger>
                                <TooltipContent>Return to active users</TooltipContent>
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
                        {/* Date Range Filter Component with Search and Role Filter */}
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
                                                placeholder="Search archived users..."
                                                value={q}
                                                onChange={(e) => {
                                                    setQ(e.target.value);
                                                    resetPage();
                                                }}
                                                className="pl-10 w-[240px]"
                                            />
                                        </div>
                                    </TooltipTrigger>
                                    <TooltipContent>Search by name, email, or role</TooltipContent>
                                </Tooltip>
                            }
                            rightElement={
                                <>
                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <div>
                                                <Select value={role} onValueChange={(v) => { setRole(v); resetPage(); }}>
                                                    <SelectTrigger className="w-[180px]">
                                                        <SelectValue placeholder="All Roles" />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="all">All Roles</SelectItem>
                                                        {roles.map((r) => (
                                                            <SelectItem key={r} value={r.toLowerCase()}>
                                                                {r}
                                                            </SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                        </TooltipTrigger>
                                        <TooltipContent>Filter by role</TooltipContent>
                                    </Tooltip>

                                    {/* Clear button */}
                                    {(q || fromDate || toDate || role !== "all") && (
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
                                    <TableHead>Role</TableHead>
                                    <TableHead>Email</TableHead>
                                    <TableHead>Deleted At</TableHead>
                                    <TableHead className="text-center">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {initialLoading ? (
                                    Array.from({ length: 5 }).map((_, i) => (
                                        <TableRow key={i}>
                                            <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                                            <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                                            <TableCell><Skeleton className="h-4 w-48" /></TableCell>
                                            <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                                            <TableCell><Skeleton className="h-4 w-16 ml-auto" /></TableCell>
                                        </TableRow>
                                    ))
                                ) : paged.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={5} className="h-32 text-center text-gray-500">
                                            No archived users found.
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    paged.map((u) => (
                                        <Tooltip key={u.id}>
                                            <TooltipTrigger asChild>
                                                <TableRow
                                                    className="cursor-pointer"
                                                    onClick={() => openViewModal(u)}
                                                >
                                                    <TableCell className="font-medium">{u.name}</TableCell>
                                                    <TableCell className="text-gray-600">{u.role}</TableCell>
                                                    <TableCell className="text-gray-600">{u.email}</TableCell>
                                                    <TableCell className="text-gray-600">{u.deletedAt}</TableCell>
                                                    <TableCell className="text-center">
                                                        <div className="flex items-center justify-center gap-1">
                                                            <PermissionGate permission="RestoreUsers">
                                                                <Tooltip>
                                                                    <TooltipTrigger asChild>
                                                                        <Button
                                                                            variant="ghost"
                                                                            size="icon"
                                                                            onClick={(e) => {
                                                                                e.stopPropagation();
                                                                                openRestoreModal(u);
                                                                            }}
                                                                            className="text-green-600 hover:text-green-700 hover:bg-green-50"
                                                                        >
                                                                            <RotateCcw className="h-4 w-4" />
                                                                        </Button>
                                                                    </TooltipTrigger>
                                                                    <TooltipContent>Restore user</TooltipContent>
                                                                </Tooltip>
                                                            </PermissionGate>
                                                            <PermissionGate permission="PermanentDeleteUsers">
                                                                <Tooltip>
                                                                    <TooltipTrigger asChild>
                                                                        <Button
                                                                            variant="ghost"
                                                                            size="icon"
                                                                            onClick={(e) => {
                                                                                e.stopPropagation();
                                                                                openDeleteModal(u);
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
                                    Showing {(page - 1) * pageSize + 1} to {Math.min(page * pageSize, pagination.totalCount)} of {pagination.totalCount} results
                                </p>
                                <div className="flex items-center gap-2">
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
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* View Confirmation */}
            <Dialog open={viewModal.open} onOpenChange={(open) => !open && setViewModal({ open: false, user: null })}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>View User Details</DialogTitle>
                        <DialogDescription>
                            You are about to view the archived user{" "}
                            <span className="font-semibold">{viewModal.user?.name}</span>. Do you want to
                            continue?
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setViewModal({ open: false, user: null })}>
                            Cancel
                        </Button>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Button variant="outline" onClick={() => handlePrintSinglePDF(viewModal.user)}>
                                    <Printer className="h-4 w-4 mr-2" />
                                    Print
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent>Print user details as PDF</TooltipContent>
                        </Tooltip>
                        <Button onClick={confirmView}>View Details</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Restore Confirmation */}
            <AlertDialog open={restoreModal.open} onOpenChange={(open) => !open && setRestoreModal({ open: false, user: null })}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Confirm Restore</AlertDialogTitle>
                        <AlertDialogDescription>
                            Are you sure you want to restore the user{" "}
                            <span className="font-semibold">{restoreModal.user?.name}</span>?
                            This will move it back to the active users list.
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
            <AlertDialog open={deleteModal.open} onOpenChange={(open) => !open && setDeleteModal({ open: false, user: null })}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Confirm Permanent Delete</AlertDialogTitle>
                        <AlertDialogDescription>
                            Are you sure you want to <span className="font-semibold text-red-600">permanently delete</span> the user{" "}
                            <span className="font-semibold">{deleteModal.user?.name}</span>?
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
