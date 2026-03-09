import { useEffect, useMemo, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { subjectService } from "../../services/subjectService";
import { departmentService } from "../../services/departmentService";
import { TableIndexSkeleton } from "../../utils/skeletonLoaders";
import AppLayout from "../../layouts/AppLayout";
import { generatePDF } from "../../utils/pdfExport";
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
import { Plus, Pencil, Trash2, Archive, Search, X, AlertCircle, CheckCircle2 } from "lucide-react";
import PermissionGate from '@/components/PermissionGate';

export default function SubjectsIndex() {
    const navigate = useNavigate();
    const location = useLocation();

    const [subjects, setSubjects] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [departments, setDepartments] = useState([]);

    const [q, setQ] = useState("");
    const [fromDate, setFromDate] = useState(undefined);
    const [toDate, setToDate] = useState(undefined);
    const [status, setStatus] = useState("all");
    const [deptFilter, setDeptFilter] = useState("all");

    const [page, setPage] = useState(1);
    const pageSize = 10;

    const [deleteModal, setDeleteModal] = useState({ open: false, subject: null });
    const [viewModal, setViewModal] = useState({ open: false, subject: null });
    const [alert, setAlert] = useState({ show: false, type: "success", message: "" });

    const resetPage = () => setPage(1);

    const clearFilters = () => {
        setQ("");
        setFromDate(undefined);
        setToDate(undefined);
        setStatus("all");
        setDeptFilter("all");
        setPage(1);
    };

    const handlePrintPDF = () => {
        generatePDF({
            title: "Subjects Report",
            data: filtered.map(s => ({
                ...s,
                isActive: s.isActive ? "Active" : "Inactive"
            })),
            columns: [
                { header: "Name", key: "name" },
                { header: "Status", key: "isActive" },
                { header: "Department", key: "departmentName" },
                { header: "Created At", key: "createdAt" },
            ],
            filters: {
                Search: q || null,
                "From Date": fromDate || null,
                "To Date": toDate || null,
                Status: status !== "all" ? status : null,
                Department: deptFilter !== "all" ? departments.find(d => String(d.id) === deptFilter)?.name : null,
            },
            companyName: "Learning Flow Management System",
        });
    };

    const goCreate = () => navigate("/subjects/create");
    const goEdit = (id) => navigate(`/subjects/${id}/edit`);
    const goArchive = () => navigate("/subjects/archive");

    const loadSubjects = async () => {
        setLoading(true);
        setError("");
        try {
            const response = await subjectService.getAll({ pageNumber: 1, pageSize: 100 });
            const data = response.data?.items || [];
            const mappedData = data.map(s => ({
                id: s.id,
                name: s.name,
                description: s.description,
                isActive: s.isActive,
                departmentId: s.departmentId,
                departmentName: s.departmentName || "—",
                createdAt: new Date(s.createdAt).toLocaleDateString()
            }));
            setSubjects(mappedData);
        } catch (err) {
            setError(err.response?.data?.message || err.message || "Failed to load subjects");
        } finally {
            setLoading(false);
        }
    };

    const loadDepartments = async () => {
        try {
            const response = await departmentService.getAll({ pageNumber: 1, pageSize: 100 });
            const data = response.data?.items || [];
            setDepartments(data.map(d => ({ id: d.id, name: d.name })));
        } catch (err) {
            console.error("Failed to load departments:", err);
        }
    };

    useEffect(() => {
        loadSubjects();
        loadDepartments();
    }, []);

    useEffect(() => {
        if (location.state?.alert) {
            setAlert({ show: true, type: location.state.alert.type, message: location.state.alert.message });
            window.history.replaceState({}, document.title);
        }
    }, [location]);

    useEffect(() => {
        if (alert.show) {
            const timer = setTimeout(() => setAlert({ show: false, type: "success", message: "" }), 3000);
            return () => clearTimeout(timer);
        }
    }, [alert.show]);

    const openDeleteModal = (s) => setDeleteModal({ open: true, subject: s });
    const openViewModal = (s) => setViewModal({ open: true, subject: s });

    const confirmDelete = async () => {
        const s = deleteModal.subject;
        setDeleteModal({ open: false, subject: null });
        if (!s) return;
        try {
            await subjectService.delete(s.id);
            setSubjects((prev) => prev.filter((x) => x.id !== s.id));
            setAlert({ show: true, type: "success", message: `Subject "${s.name}" archived successfully!` });
        } catch (err) {
            setAlert({ show: true, type: "error", message: err.response?.data?.message || "Failed to archive subject" });
        }
    };

    const confirmView = () => {
        if (viewModal.subject) navigate(`/subjects/${viewModal.subject.id}`);
        setViewModal({ open: false, subject: null });
    };

    const filtered = useMemo(() => {
        let result = applyFilters(subjects, {
            search: q,
            searchFields: ['name', 'description', 'departmentName'],
            fromDate,
            toDate,
            dateField: 'createdAt',
        });

        if (status !== "all") {
            result = result.filter(s => s.isActive === (status === "active"));
        }

        if (deptFilter !== "all") {
            result = result.filter(s => String(s.departmentId) === deptFilter);
        }

        return result;
    }, [subjects, q, fromDate, toDate, status, deptFilter]);

    const paginationResult = useMemo(() => paginate(filtered, page, pageSize), [filtered, page, pageSize]);
    const { data: paged, total, totalPages, page: safePage } = paginationResult;

    useEffect(() => {
        if (page > totalPages) setPage(totalPages);
    }, [totalPages, page]);

    return (
        <AppLayout title="Subjects" onPrint={filtered.length > 0 ? handlePrintPDF : undefined}>
            {loading ? (
                <TableIndexSkeleton columns={5} rows={10} headers={["Name", "Status", "Department", "Created At", "Actions"]} />
            ) : (
                <div className="space-y-6">
                    <div className="flex items-start justify-between gap-4">
                        <div>
                            <h1 className="text-3xl font-bold text-gray-900">Subjects</h1>
                            <p className="mt-1 text-sm text-gray-600">Manage academic subjects and curriculum</p>
                        </div>
                        <div className="flex items-center gap-4">
                            {alert.show && (
                                <Alert className={`flex items-center gap-2 py-2 px-4 animate-in fade-in slide-in-from-right-4 duration-300 ${alert.type === "success" ? "border-green-500 bg-green-50 text-green-800" : "border-red-500 bg-red-50 text-red-800"}`}>
                                    {alert.type === "success" ? <CheckCircle2 className="h-4 w-4 text-green-600 flex-shrink-0" /> : <AlertCircle className="h-4 w-4 text-red-600 flex-shrink-0" />}
                                    <AlertDescription className={`text-sm whitespace-nowrap ${alert.type === "success" ? "text-green-800" : "text-red-800"}`}>{alert.message}</AlertDescription>
                                    <Button variant="ghost" size="icon" className={`h-5 w-5 ml-1 flex-shrink-0 ${alert.type === "success" ? "text-green-600 hover:text-green-700 hover:bg-green-100" : "text-red-600 hover:text-red-700 hover:bg-red-100"}`} onClick={() => setAlert({ show: false, type: "success", message: "" })}><X className="h-3 w-3" /></Button>
                                </Alert>
                            )}
                            <PermissionGate permission="CreateSubjects"><Tooltip><TooltipTrigger asChild><Button onClick={goCreate} disabled={loading}><Plus className="h-4 w-4 mr-2" />New Subject</Button></TooltipTrigger><TooltipContent>Create a new subject</TooltipContent></Tooltip></PermissionGate>
                        </div>
                    </div>

                    {error && <Alert variant="destructive"><AlertCircle className="h-4 w-4" /><AlertDescription>{error}</AlertDescription></Alert>}

                    <div className="space-y-3">
                        <DateRangeFilter
                            fromDate={fromDate}
                            toDate={toDate}
                            onFromDateChange={(date) => { setFromDate(date); resetPage(); }}
                            onToDateChange={(date) => { setToDate(date); resetPage(); }}
                            onRangeChange={() => resetPage()}
                            leftElement={
                                <Tooltip><TooltipTrigger asChild>
                                    <div className="relative">
                                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                                        <Input placeholder="Search subjects..." value={q} onChange={(e) => { setQ(e.target.value); resetPage(); }} className="pl-10 w-[240px]" />
                                    </div>
                                </TooltipTrigger><TooltipContent>Search by name, description, or department</TooltipContent></Tooltip>
                            }
                            rightElement={
                                <>
                                    <Select value={deptFilter} onValueChange={(v) => { setDeptFilter(v); resetPage(); }}>
                                        <SelectTrigger className="w-[200px]"><SelectValue placeholder="All Departments" /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="all">All Departments</SelectItem>
                                            {departments.map((d) => (
                                                <SelectItem key={d.id} value={String(d.id)}>{d.name}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>

                                    <Select value={status} onValueChange={(v) => { setStatus(v); resetPage(); }}>
                                        <SelectTrigger className="w-[180px]"><SelectValue placeholder="All Status" /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="all">All Status</SelectItem>
                                            <SelectItem value="active">Active</SelectItem>
                                            <SelectItem value="inactive">Inactive</SelectItem>
                                        </SelectContent>
                                    </Select>

                                    {(q || fromDate || toDate || status !== "all" || deptFilter !== "all") && (
                                        <Button variant="outline" size="sm" onClick={clearFilters}>Clear</Button>
                                    )}

                                    <PermissionGate permission="ArchiveSubjects">
                                        <div className="ml-auto">
                                            <Tooltip><TooltipTrigger asChild><Button variant="outline" onClick={goArchive}><Archive className="h-4 w-4 mr-2" />Archive</Button></TooltipTrigger><TooltipContent>View archived subjects</TooltipContent></Tooltip>
                                        </div>
                                    </PermissionGate>
                                </>
                            }
                        />
                    </div>

                    <div className="border rounded-lg overflow-hidden bg-white">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Name</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead>Department</TableHead>
                                    <TableHead className="text-center">Created At</TableHead>
                                    <TableHead className="text-center">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {paged.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={5} className="h-32 text-center text-gray-500">No subjects found.</TableCell>
                                    </TableRow>
                                ) : (
                                    paged.map((s) => (
                                        <Tooltip key={s.id}>
                                            <TooltipTrigger asChild>
                                                <TableRow className="cursor-pointer" onClick={() => openViewModal(s)}>
                                                    <TableCell className="font-medium">{s.name}</TableCell>
                                                    <TableCell>
                                                        {s.isActive ? (
                                                            <span className="text-sm font-medium text-green-700">Active</span>
                                                        ) : (
                                                            <span className="text-sm font-medium text-gray-500">Inactive</span>
                                                        )}
                                                    </TableCell>
                                                    <TableCell className="max-w-md truncate">{s.departmentName || "—"}</TableCell>
                                                    <TableCell className="text-gray-600 text-center">{s.createdAt}</TableCell>
                                                    <TableCell className="text-center">
                                                        <div className="flex items-center justify-center gap-1">
                                                            <PermissionGate permission="UpdateSubjects"><Tooltip><TooltipTrigger asChild><Button variant="ghost" size="icon" onClick={(e) => { e.stopPropagation(); goEdit(s.id); }}><Pencil className="h-4 w-4" /></Button></TooltipTrigger><TooltipContent>Edit subject</TooltipContent></Tooltip></PermissionGate>
                                                            <PermissionGate permission="DeleteSubjects"><Tooltip><TooltipTrigger asChild><Button variant="ghost" size="icon" onClick={(e) => { e.stopPropagation(); openDeleteModal(s); }} className="text-red-600 hover:text-red-700 hover:bg-red-50"><Trash2 className="h-4 w-4" /></Button></TooltipTrigger><TooltipContent>Archive subject</TooltipContent></Tooltip></PermissionGate>
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

                        {paged.length > 0 && (
                            <div className="flex items-center justify-between border-t px-6 py-4">
                                <p className="text-sm text-gray-600">
                                    Showing {(safePage - 1) * pageSize + 1} to {Math.min(safePage * pageSize, total)} of {total} results
                                </p>
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

            <AlertDialog open={deleteModal.open} onOpenChange={(open) => !open && setDeleteModal({ open: false, subject: null })}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Confirm Archive</AlertDialogTitle>
                        <AlertDialogDescription>
                            Are you sure you want to archive the subject{" "}
                            <span className="font-semibold">{deleteModal.subject?.name}</span>?
                            It will be moved to the archive list.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={confirmDelete} className="bg-red-600 hover:bg-red-700">Archive</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            <Dialog open={viewModal.open} onOpenChange={(open) => !open && setViewModal({ open: false, subject: null })}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>View Subject</DialogTitle>
                        <DialogDescription>
                            Would you like to view the details of{" "}
                            <span className="font-semibold">{viewModal.subject?.name}</span>?
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setViewModal({ open: false, subject: null })}>Cancel</Button>
                        <Button onClick={confirmView}>View Details</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </AppLayout>
    );
}
