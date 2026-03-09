import { useEffect, useMemo, useState } from "react";
import { buildingService } from "../../services/buildingService";
import { useNavigate } from "react-router-dom";
import { TableIndexSkeleton } from "../../utils/skeletonLoaders";
import AppLayout from "../../layouts/AppLayout";
import { generatePDF, generatePersonalInfoPDF } from "../../utils/pdfExport";
import { applyFilters, paginate } from "../../utils/filterUtils";
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
import PermissionGate from '@/components/PermissionGate';

export default function BuildingsArchive() {
    const navigate = useNavigate();

    /* ------------------------------ api state ------------------------------ */
    const [buildings, setBuildings] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    /* ---------------------------- filter state ---------------------------- */
    const [q, setQ] = useState("");
    const [fromDate, setFromDate] = useState(undefined);
    const [toDate, setToDate] = useState(undefined);
    const [status, setStatus] = useState("all");

    /* -------------------------- pagination state -------------------------- */
    const [page, setPage] = useState(1);
    const pageSize = 10;

    /* -------------------------- modal state -------------------------- */
    const [viewModal, setViewModal] = useState({ open: false, building: null });
    const [restoreModal, setRestoreModal] = useState({ open: false, building: null });
    const [deleteModal, setDeleteModal] = useState({ open: false, building: null });

    /* -------------------------- alert state -------------------------- */
    const [alert, setAlert] = useState({ show: false, type: "success", message: "" });

    const resetPage = () => setPage(1);

    const clearFilters = () => {
        setQ("");
        setFromDate(undefined);
        setToDate(undefined);
        setStatus("all");
        setPage(1);
    };

    // PDF Export
    const handlePrintPDF = () => {
        generatePDF({
            title: "Archived Buildings Report",
            data: filtered.map(b => ({
                ...b,
                isActive: b.isActive ? "Active" : "Inactive"
            })),
            columns: [
                { header: "Name", key: "name" },
                { header: "Status", key: "isActive" },
                { header: "Managed By", key: "managedBy" },
                { header: "Deleted At", key: "deletedAt" },
            ],
            filters: {
                Search: q || null,
                "From Date": fromDate || null,
                "To Date": toDate || null,
                Status: status !== "all" ? status : null,
            },
            companyName: "Archived Buildings Management System",
        });
    };

    const handlePrintSinglePDF = (building) => {
        if (!building) return;

        generatePersonalInfoPDF({
            title: "Archived Building Details",
            data: building,
            fields: [
                { label: "Building Name", key: "name" },
                { label: "Status", key: "isActive", format: (v) => v ? "Active" : "Inactive" },
                { label: "Managed By", key: "managedBy" },
                { label: "Deleted At", key: "deletedAt" },
            ],
            companyName: "Learning Flow Management System",
            headerInfo: { name: building.name },
        });
    };

    /* ------------------------------ routes ------------------------------ */
    const goBack = () => navigate("/buildings");

    /* ------------------------------ api ------------------------------ */
    const loadArchivedBuildings = async () => {
        setLoading(true);
        setError("");

        try {
            const response = await buildingService.getArchived({ pageNumber: 1, pageSize: 100 });
            const data = response.data?.items || [];
            const mappedData = data.map(b => ({
                id: b.id,
                name: b.name,
                isActive: b.isActive,
                managedBy: b.managerName || "—",
                deletedAt: b.updatedAt ? new Date(b.updatedAt).toLocaleDateString() : "—"
            }));
            setBuildings(mappedData);
        } catch (err) {
            setError(err.message || "Failed to load archived buildings");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadArchivedBuildings();
    }, []);

    useEffect(() => {
        if (alert.show) {
            const timer = setTimeout(() => {
                setAlert({ show: false, type: "success", message: "" });
            }, 3000);
            return () => clearTimeout(timer);
        }
    }, [alert.show]);

    /* ------------------------------ actions ------------------------------ */
    const openViewModal = (b) => setViewModal({ open: true, building: b });
    const openRestoreModal = (b) => setRestoreModal({ open: true, building: b });
    const openDeleteModal = (b) => setDeleteModal({ open: true, building: b });

    const confirmView = () => {
        if (viewModal.building) {
            navigate(`/buildings/${viewModal.building.id}`, { state: { from: "archive" } });
        }
        setViewModal({ open: false, building: null });
    };

    const confirmRestore = async () => {
        const b = restoreModal.building;
        if (!b) return;
        try {
            await buildingService.restore(b.id);
            setBuildings((prev) => prev.filter((item) => item.id !== b.id));
            setRestoreModal({ open: false, building: null });
            setAlert({ show: true, type: "success", message: `Building "${b.name}" restored successfully!` });
        } catch (err) {
            setAlert({ show: true, type: "error", message: err.message || "Failed to restore building" });
            setRestoreModal({ open: false, building: null });
        }
    };

    const confirmDelete = async () => {
        const b = deleteModal.building;
        if (!b) return;
        try {
            await buildingService.permanentDelete(b.id);
            setBuildings((prev) => prev.filter((item) => item.id !== b.id));
            setDeleteModal({ open: false, building: null });
            setAlert({ show: true, type: "success", message: `Building "${b.name}" permanently deleted!` });
        } catch (err) {
            setAlert({ show: true, type: "error", message: err.message || "Failed to delete building" });
            setDeleteModal({ open: false, building: null });
        }
    };

    /* ------------------------- filtering ------------------------- */
    const filtered = useMemo(() => {
        let result = applyFilters(buildings, {
            search: q,
            searchFields: ['name', 'managedBy'],
            fromDate,
            toDate,
            dateField: 'deletedAt',
        });

        if (status !== "all") {
            const isActiveValue = status === "active";
            result = result.filter(b => b.isActive === isActiveValue);
        }

        return result;
    }, [buildings, q, fromDate, toDate, status]);

    const paginationResult = useMemo(() => {
        return paginate(filtered, page, pageSize);
    }, [filtered, page, pageSize]);

    const { data: paged, total, totalPages, page: safePage } = paginationResult;

    useEffect(() => {
        if (page > totalPages && totalPages > 0) setPage(totalPages);
    }, [totalPages, page]);

    return (
        <AppLayout title="Archived Buildings" onPrint={filtered.length > 0 ? handlePrintPDF : undefined}>
            {loading ? (
                <TableIndexSkeleton
                    columns={5}
                    rows={10}
                    headers={["Name", "IsActive", "Managed By", "Deleted At", "Actions"]}
                />
            ) : (
                <div className="space-y-6">
                    {/* Header */}
                    <div className="flex items-start justify-between gap-4">
                        <div>
                            <h1 className="text-3xl font-bold text-gray-900">Archived Buildings</h1>
                            <p className="mt-1 text-sm text-gray-600">
                                View and manage soft-deleted school buildings
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
                                        Back to Buildings
                                    </Button>
                                </TooltipTrigger>
                                <TooltipContent>Return to active buildings list</TooltipContent>
                            </Tooltip>
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
                                                placeholder="Search archived buildings..."
                                                value={q}
                                                onChange={(e) => {
                                                    setQ(e.target.value);
                                                    resetPage();
                                                }}
                                                className="pl-10 w-[240px]"
                                            />
                                        </div>
                                    </TooltipTrigger>
                                    <TooltipContent>Search by name or manager</TooltipContent>
                                </Tooltip>
                            }
                            rightElement={
                                <>
                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <div>
                                                <Select value={status} onValueChange={(v) => { setStatus(v); resetPage(); }}>
                                                    <SelectTrigger className="w-[180px]">
                                                        <SelectValue placeholder="All Status" />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="all">All Status</SelectItem>
                                                        <SelectItem value="active">Active</SelectItem>
                                                        <SelectItem value="inactive">Inactive</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                        </TooltipTrigger>
                                        <TooltipContent>Filter by status</TooltipContent>
                                    </Tooltip>

                                    {(q || fromDate || toDate || status !== "all") && (
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
                                    <TableHead>IsActive</TableHead>
                                    <TableHead>Managed By</TableHead>
                                    <TableHead>Deleted At</TableHead>
                                    <TableHead className="text-center">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {paged.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={5} className="h-32 text-center text-gray-500">
                                            No archived buildings found.
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    paged.map((b) => (
                                        <Tooltip key={b.id}>
                                            <TooltipTrigger asChild>
                                                <TableRow
                                                    className="cursor-pointer"
                                                    onClick={() => openViewModal(b)}
                                                >
                                                    <TableCell className="font-medium">{b.name}</TableCell>
                                                    <TableCell>
                                                        <div className="flex items-center gap-1.5">
                                                            {b.isActive ? (
                                                                <span className="text-sm font-medium text-green-700">Active</span>
                                                            ) : (
                                                                <span className="text-sm font-medium text-gray-500">Inactive</span>
                                                            )}
                                                        </div>
                                                    </TableCell>
                                                    <TableCell className="text-gray-700">{b.managedBy || "—"}</TableCell>
                                                    <TableCell className="text-gray-600">{b.deletedAt}</TableCell>
                                                    <TableCell className="text-center">
                                                        <div className="flex items-center justify-center gap-1">
                                                            <PermissionGate permission="RestoreBuildings">
                                                                <Tooltip>
                                                                    <TooltipTrigger asChild>
                                                                        <Button
                                                                            variant="ghost"
                                                                            size="icon"
                                                                            onClick={(e) => {
                                                                                e.stopPropagation();
                                                                                openRestoreModal(b);
                                                                            }}
                                                                            className="text-green-600 hover:text-green-700 hover:bg-green-50"
                                                                        >
                                                                            <RotateCcw className="h-4 w-4" />
                                                                        </Button>
                                                                    </TooltipTrigger>
                                                                    <TooltipContent>Restore building</TooltipContent>
                                                                </Tooltip>
                                                            </PermissionGate>
                                                            <PermissionGate permission="PermanentDeleteBuildings">
                                                                <Tooltip>
                                                                    <TooltipTrigger asChild>
                                                                        <Button
                                                                            variant="ghost"
                                                                            size="icon"
                                                                            onClick={(e) => {
                                                                                e.stopPropagation();
                                                                                openDeleteModal(b);
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
                                    Showing {(safePage - 1) * pageSize + 1} to {Math.min(safePage * pageSize, total)} of {total} results
                                </p>
                                <div className="flex items-center gap-2">
                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => setPage(p => Math.max(1, p - 1))}
                                                disabled={safePage === 1}
                                            >
                                                Previous
                                            </Button>
                                        </TooltipTrigger>
                                        <TooltipContent>Go to previous page</TooltipContent>
                                    </Tooltip>
                                    <span className="text-sm text-gray-600">
                                        Page {safePage} of {totalPages}
                                    </span>
                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                                                disabled={safePage === totalPages}
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
            <Dialog open={viewModal.open} onOpenChange={(open) => !open && setViewModal({ open: false, building: null })}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>View Building Details</DialogTitle>
                        <DialogDescription>
                            You are about to view the archived building{" "}
                            <span className="font-semibold text-gray-900">"{viewModal.building?.name}"</span>. Do you want to
                            continue?
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setViewModal({ open: false, building: null })}>
                            Cancel
                        </Button>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Button variant="outline" onClick={() => handlePrintSinglePDF(viewModal.building)}>
                                    <Printer className="h-4 w-4 mr-2" />
                                    Print
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent>Print building details as PDF</TooltipContent>
                        </Tooltip>
                        <Button onClick={confirmView}>View Details</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Restore Confirmation */}
            <AlertDialog open={restoreModal.open} onOpenChange={(open) => !open && setRestoreModal({ open: false, building: null })}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Confirm Restore</AlertDialogTitle>
                        <AlertDialogDescription>
                            Are you sure you want to restore the building{" "}
                            <span className="font-semibold text-gray-900">"{restoreModal.building?.name}"</span>?
                            This will move it back to the active buildings list.
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
            <AlertDialog open={deleteModal.open} onOpenChange={(open) => !open && setDeleteModal({ open: false, building: null })}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Confirm Permanent Delete</AlertDialogTitle>
                        <AlertDialogDescription>
                            Are you sure you want to <span className="font-semibold text-red-600">permanently delete</span> the building{" "}
                            <span className="font-semibold text-gray-900">"{deleteModal.building?.name}"</span>?
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
