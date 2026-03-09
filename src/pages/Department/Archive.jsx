import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { departmentService } from "../../services/departmentService";
import { TableIndexSkeleton } from "../../utils/skeletonLoaders";
import AppLayout from "../../layouts/AppLayout";
import { generatePDF, generatePersonalInfoPDF } from "../../utils/pdfExport";
import { applyFilters, paginate } from "../../utils/filterUtils";
import DateRangeFilter from "../../components/DateRangeFilter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { RotateCcw, Trash2, Search, X, AlertCircle, CheckCircle2, ArrowLeft, Printer } from "lucide-react";
import PermissionGate from '@/components/PermissionGate';

export default function DepartmentsArchive() {
    const navigate = useNavigate();

    /* ------------------------------ api state ------------------------------ */
    const [departments, setDepartments] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    /* ---------------------------- filter state ---------------------------- */
    const [q, setQ] = useState("");
    const [fromDate, setFromDate] = useState(undefined);
    const [toDate, setToDate] = useState(undefined);

    /* -------------------------- pagination state -------------------------- */
    const [page, setPage] = useState(1);
    const pageSize = 10;

    /* -------------------------- modal state -------------------------- */
    const [viewModal, setViewModal] = useState({ open: false, department: null });
    const [restoreModal, setRestoreModal] = useState({ open: false, department: null });
    const [deleteModal, setDeleteModal] = useState({ open: false, department: null });

    /* -------------------------- alert state -------------------------- */
    const [alert, setAlert] = useState({ show: false, type: "success", message: "" });

    const resetPage = () => setPage(1);
    const clearFilters = () => { setQ(""); setFromDate(undefined); setToDate(undefined); setPage(1); };
    const goBack = () => navigate("/departments");

    /* ------------------------------ PDF Export ------------------------------ */
    const handlePrintPDF = () => {
        generatePDF({
            title: "Archived Departments Report",
            data: filtered,
            columns: [
                { header: "Name", key: "name" },
                { header: "Status", key: "isActive", format: (v) => v ? "Active" : "Inactive" },
                { header: "Code", key: "code" },
                { header: "Deleted At", key: "deletedAt" },
            ],
            filters: {
                Search: q || null,
                "From Date": fromDate || null,
                "To Date": toDate || null,
            },
            companyName: "Archived Departments Management System",
        });
    };

    const handlePrintSinglePDF = (department) => {
        if (!department) return;

        generatePersonalInfoPDF({
            title: "Archived Department Details",
            data: department,
            fields: [
                { label: "Department Name", key: "name" },
                { label: "Code", key: "code" },
                { label: "Description", key: "description" },
                { label: "Deleted At", key: "deletedAt" },
            ],
            companyName: "Department Management System",
            headerInfo: { name: department.name },
        });
    };

    /* ------------------------------ api ------------------------------ */
    const loadArchived = async () => {
        setLoading(true);
        setError("");
        try {
            const response = await departmentService.getArchived({ pageNumber: 1, pageSize: 100 });
            const data = response.data?.items || [];
            const mappedData = data.map(d => ({
                id: d.id,
                name: d.name,
                code: d.code,
                description: d.description,
                isActive: d.isActive,
                deletedAt: new Date(d.createdAt).toLocaleDateString(),
                createdAt: new Date(d.createdAt).toLocaleDateString()
            }));
            setDepartments(mappedData);
        } catch (err) {
            setError(err.response?.data?.message || err.message || "Failed to load archived departments");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { loadArchived(); }, []);

    useEffect(() => {
        if (alert.show) {
            const timer = setTimeout(() => setAlert({ show: false, type: "success", message: "" }), 3000);
            return () => clearTimeout(timer);
        }
    }, [alert.show]);

    /* ------------------------------ actions ------------------------------ */
    const confirmView = () => {
        if (viewModal.department) {
            navigate(`/departments/${viewModal.department.id}`, { state: { from: "archive" } });
        }
        setViewModal({ open: false, department: null });
    };

    const confirmRestore = async () => {
        const d = restoreModal.department;
        if (!d) return;
        setRestoreModal({ open: false, department: null });
        try {
            await departmentService.restore(d.id);
            setDepartments((prev) => prev.filter((item) => item.id !== d.id));
            setAlert({ show: true, type: "success", message: `Department "${d.name}" restored successfully!` });
        } catch (err) {
            setAlert({ show: true, type: "error", message: err.response?.data?.message || "Failed to restore department" });
        }
    };

    const confirmDelete = async () => {
        const d = deleteModal.department;
        if (!d) return;
        setDeleteModal({ open: false, department: null });
        try {
            await departmentService.permanentDelete(d.id);
            setDepartments((prev) => prev.filter((item) => item.id !== d.id));
            setAlert({ show: true, type: "success", message: `Department "${d.name}" permanently deleted!` });
        } catch (err) {
            setAlert({ show: true, type: "error", message: err.response?.data?.message || "Failed to delete department" });
        }
    };

    /* ------------------------- filtering ------------------------- */
    const filtered = useMemo(() => {
        return applyFilters(departments, { search: q, searchFields: ['name', 'code'], fromDate, toDate, dateField: 'deletedAt' });
    }, [departments, q, fromDate, toDate]);

    const paginationResult = useMemo(() => paginate(filtered, page, pageSize), [filtered, page, pageSize]);
    const { data: paged, total, totalPages, page: safePage } = paginationResult;

    useEffect(() => {
        if (page > totalPages && totalPages > 0) setPage(totalPages);
    }, [totalPages, page]);

    return (
        <AppLayout title="Archived Departments" onPrint={filtered.length > 0 ? handlePrintPDF : undefined}>
            {loading ? (
                <TableIndexSkeleton columns={5} rows={10} headers={["Name", "Status", "Code", "Deleted At", "Actions"]} />
            ) : (
                <div className="space-y-6">
                    {/* Header */}
                    <div className="flex items-start justify-between gap-4">
                        <div>
                            <h1 className="text-3xl font-bold text-gray-900">Archived Departments</h1>
                            <p className="mt-1 text-sm text-gray-600">View and manage soft-deleted departments</p>
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
                                        Back to Departments
                                    </Button>
                                </TooltipTrigger>
                                <TooltipContent>Return to active departments</TooltipContent>
                            </Tooltip>
                        </div>
                    </div>

                    {/* Error */}
                    {error && <Alert variant="destructive"><AlertCircle className="h-4 w-4" /><AlertDescription>{error}</AlertDescription></Alert>}

                    {/* Filters */}
                    <div className="space-y-3">
                        <DateRangeFilter fromDate={fromDate} toDate={toDate} onFromDateChange={(date) => { setFromDate(date); resetPage(); }} onToDateChange={(date) => { setToDate(date); resetPage(); }} onRangeChange={() => resetPage()}
                            leftElement={
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <div className="relative">
                                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                                            <Input placeholder="Search archived departments..." value={q} onChange={(e) => { setQ(e.target.value); resetPage(); }} className="pl-10 w-[240px]" />
                                        </div>
                                    </TooltipTrigger>
                                    <TooltipContent>Search by name or code</TooltipContent>
                                </Tooltip>
                            }
                            rightElement={
                                <>
                                    {(q || fromDate || toDate) && (
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

                    {/* Table */}
                    <div className="border rounded-lg overflow-hidden bg-white">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Name</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead>Code</TableHead>
                                    <TableHead className="text-center">Deleted At</TableHead>
                                    <TableHead className="text-center">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {paged.length === 0 ? (
                                    <TableRow><TableCell colSpan={5} className="h-32 text-center text-gray-500">No archived departments found.</TableCell></TableRow>
                                ) : (
                                    paged.map((d) => (
                                        <Tooltip key={d.id}>
                                            <TooltipTrigger asChild>
                                                <TableRow className="cursor-pointer" onClick={() => setViewModal({ open: true, department: d })}>
                                                    <TableCell className="font-medium">{d.name}</TableCell>
                                                    <TableCell>
                                                        {d.isActive ? <span className="text-sm font-medium text-green-700">Active</span> : <span className="text-sm font-medium text-gray-500">Inactive</span>}
                                                    </TableCell>
                                                    <TableCell className="text-gray-600">{d.code}</TableCell>
                                                    <TableCell className="text-gray-600 text-center">{d.deletedAt}</TableCell>
                                                    <TableCell className="text-center">
                                                        <div className="flex items-center justify-center gap-1">
                                                            <PermissionGate permission="RestoreDepartments"><Tooltip><TooltipTrigger asChild><Button variant="ghost" size="icon" onClick={(e) => { e.stopPropagation(); setRestoreModal({ open: true, department: d }); }} className="text-green-600 hover:text-green-700 hover:bg-green-50"><RotateCcw className="h-4 w-4" /></Button></TooltipTrigger><TooltipContent>Restore department</TooltipContent></Tooltip></PermissionGate>
                                                            <PermissionGate permission="PermanentDeleteDepartments"><Tooltip><TooltipTrigger asChild><Button variant="ghost" size="icon" onClick={(e) => { e.stopPropagation(); setDeleteModal({ open: true, department: d }); }} className="text-red-600 hover:text-red-700 hover:bg-red-50"><Trash2 className="h-4 w-4" /></Button></TooltipTrigger><TooltipContent>Permanently delete</TooltipContent></Tooltip></PermissionGate>
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
                                <p className="text-sm text-gray-600">Showing {(safePage - 1) * pageSize + 1} to {Math.min(safePage * pageSize, total)} of {total} results</p>
                                <div className="flex items-center gap-2">
                                    <Tooltip><TooltipTrigger asChild><Button variant="outline" size="sm" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={safePage === 1}>Previous</Button></TooltipTrigger><TooltipContent>Go to previous page</TooltipContent></Tooltip>
                                    <span className="text-sm text-gray-600">Page {safePage} of {totalPages}</span>
                                    <Tooltip><TooltipTrigger asChild><Button variant="outline" size="sm" onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={safePage === totalPages}>Next</Button></TooltipTrigger><TooltipContent>Go to next page</TooltipContent></Tooltip>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* View Confirmation */}
            <Dialog open={viewModal.open} onOpenChange={(open) => !open && setViewModal({ open: false, department: null })}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>View Department Details</DialogTitle>
                        <DialogDescription>
                            You are about to view the archived department{" "}
                            <span className="font-semibold text-gray-900">"{viewModal.department?.name}"</span>. Do you want to continue?
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setViewModal({ open: false, department: null })}>Cancel</Button>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Button variant="outline" onClick={() => handlePrintSinglePDF(viewModal.department)}>
                                    <Printer className="h-4 w-4 mr-2" />
                                    Print
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent>Print department details as PDF</TooltipContent>
                        </Tooltip>
                        <Button onClick={confirmView}>View Details</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Restore Confirmation */}
            <AlertDialog open={restoreModal.open} onOpenChange={(open) => !open && setRestoreModal({ open: false, department: null })}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Confirm Restore</AlertDialogTitle>
                        <AlertDialogDescription>
                            Are you sure you want to restore{" "}
                            <span className="font-semibold text-gray-900">"{restoreModal.department?.name}"</span>? This will move it back to active departments.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={confirmRestore} className="bg-green-600 hover:bg-green-700">Restore</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            {/* Permanent Delete Confirmation */}
            <AlertDialog open={deleteModal.open} onOpenChange={(open) => !open && setDeleteModal({ open: false, department: null })}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Confirm Permanent Delete</AlertDialogTitle>
                        <AlertDialogDescription>
                            Are you sure you want to <span className="font-semibold text-red-600">permanently delete</span>{" "}
                            <span className="font-semibold text-gray-900">"{deleteModal.department?.name}"</span>? This action cannot be undone.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={confirmDelete} className="bg-red-600 hover:bg-red-700">Permanently Delete</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </AppLayout>
    );
}
