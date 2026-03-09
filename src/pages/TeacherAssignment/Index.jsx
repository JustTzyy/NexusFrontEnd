import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { teacherAssignmentService } from "../../services/teacherAssignmentService";
import { userService } from "../../services/userService";
import AppLayout from "../../layouts/AppLayout";
import { applyFilters, paginate } from "../../utils/filterUtils";
import { generatePDF } from "../../utils/pdfExport";
import { TableIndexSkeleton } from "../../utils/skeletonLoaders";
import DateRangeFilter from "../../components/DateRangeFilter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Plus, Pencil, Trash2, Archive, Search, X, AlertCircle, CheckCircle2 } from "lucide-react";
import PermissionGate from '@/components/PermissionGate';

export default function TeacherAssignmentIndex() {
    const location = useLocation();
    const navigate = useNavigate();

    const [assignments, setAssignments] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [teachers, setTeachers] = useState([]);

    const [q, setQ] = useState("");
    const [fromDate, setFromDate] = useState(undefined);
    const [toDate, setToDate] = useState(undefined);
    const [teacherFilter, setTeacherFilter] = useState("all");

    const [page, setPage] = useState(1);
    const pageSize = 10;

    const [viewModal, setViewModal] = useState({ open: false, assignment: null });
    const [deleteModal, setDeleteModal] = useState({ open: false, assignment: null });
    const [alert, setAlert] = useState({ show: false, type: "success", message: "" });

    const resetPage = () => setPage(1);
    const goCreate = () => navigate("/teacher-assignments/create");
    const goEdit = (id) => navigate(`/teacher-assignments/${id}/edit`);
    const goArchive = () => navigate("/teacher-assignments/archive");

    const clearFilters = () => {
        setQ("");
        setFromDate(undefined);
        setToDate(undefined);
        setTeacherFilter("all");
        setPage(1);
    };

    const handlePrintPDF = () => {
        generatePDF({
            title: "Teacher Assignments Report",
            data: filtered,
            columns: [
                { header: "Teacher", key: "teacherName" },
                { header: "Building", key: "buildingName" },
                { header: "Department", key: "departmentName" },
                { header: "Created At", key: "createdAt" },
            ],
            filters: {
                Search: q || null,
                Teacher: teacherFilter !== "all" ? teachers.find(t => String(t.id) === teacherFilter)?.name : null,
                "From Date": fromDate || null,
                "To Date": toDate || null,
            },
            companyName: "Learning Flow Management System",
        });
    };

    const loadData = async () => {
        setLoading(true);
        setError("");
        try {
            const [response, teachersRes] = await Promise.all([
                teacherAssignmentService.getAll({ pageNumber: 1, pageSize: 100 }),
                userService.getByRole("Teacher"),
            ]);
            const data = response.data?.items || [];
            setAssignments(data.map(a => ({
                id: a.id,
                teacherId: a.teacherId,
                teacherName: a.teacherName,
                buildingId: a.buildingId,
                buildingName: a.buildingName,
                departmentId: a.departmentId,
                departmentName: a.departmentName,
                createdAt: new Date(a.createdAt).toLocaleDateString()
            })));
            const teachersData = teachersRes.data || [];
            setTeachers(teachersData.map(t => ({ id: t.id, name: t.fullName })));
        } catch (err) {
            setError(err.response?.data?.message || err.message || "Failed to load assignments");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { loadData(); }, []);

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

    const openViewModal = (a) => setViewModal({ open: true, assignment: a });

    const confirmView = () => {
        if (viewModal.assignment) navigate(`/teacher-assignments/${viewModal.assignment.id}`);
        setViewModal({ open: false, assignment: null });
    };

    const confirmDelete = async () => {
        const a = deleteModal.assignment;
        setDeleteModal({ open: false, assignment: null });
        if (!a) return;
        try {
            await teacherAssignmentService.delete(a.id);
            setAssignments((prev) => prev.filter((x) => x.id !== a.id));
            setAlert({ show: true, type: "success", message: `Assignment for "${a.teacherName}" archived successfully!` });
        } catch (err) {
            setAlert({ show: true, type: "error", message: err.response?.data?.message || "Failed to archive assignment" });
        }
    };

    const filtered = useMemo(() => {
        let result = applyFilters(assignments, {
            search: q,
            searchFields: ['teacherName', 'buildingName', 'departmentName'],
            fromDate,
            toDate,
            dateField: 'createdAt',
        });
        if (teacherFilter !== "all") result = result.filter(a => String(a.teacherId) === teacherFilter);
        return result;
    }, [assignments, q, fromDate, toDate, teacherFilter]);

    const paginationResult = useMemo(() => paginate(filtered, page, pageSize), [filtered, page, pageSize]);
    const { data: paged, total, totalPages, page: safePage } = paginationResult;

    useEffect(() => {
        if (page > totalPages && totalPages > 0) setPage(totalPages);
    }, [totalPages, page]);

    const hasActiveFilters = q || fromDate || toDate || teacherFilter !== "all";

    return (
        <AppLayout title="Teacher Assignments" onPrint={filtered.length > 0 ? handlePrintPDF : undefined}>
            {loading ? (
                <TableIndexSkeleton columns={5} rows={10} headers={["Teacher", "Building", "Department", "Created At", "Actions"]} />
            ) : (
                <div className="space-y-6">
                    {/* Header */}
                    <div className="flex items-start justify-between gap-4">
                        <div>
                            <h1 className="text-3xl font-bold text-gray-900">Teacher Assignments</h1>
                            <p className="mt-1 text-sm text-gray-600">Assign teachers to building and department combinations</p>
                        </div>
                        <div className="flex items-center gap-4">
                            {alert.show && (
                                <Alert className={`flex items-center gap-2 py-2 px-4 w-fit rounded-full animate-in fade-in slide-in-from-right-4 duration-300 ${alert.type === "success" ? "border-green-500 bg-green-50 text-green-800" : "border-red-500 bg-red-50 text-red-800"}`}>
                                    {alert.type === "success" ? <CheckCircle2 className="h-4 w-4 text-green-600 flex-shrink-0" /> : <AlertCircle className="h-4 w-4 text-red-600 flex-shrink-0" />}
                                    <AlertDescription className={`text-sm font-medium whitespace-nowrap ${alert.type === "success" ? "text-green-800" : "text-red-800"}`}>{alert.message}</AlertDescription>
                                    <Button variant="ghost" size="icon" className={`h-5 w-5 ml-1 rounded-full flex-shrink-0 ${alert.type === "success" ? "text-green-600 hover:text-green-700 hover:bg-green-100" : "text-red-600 hover:text-red-700 hover:bg-red-100"}`} onClick={() => setAlert({ show: false, type: "success", message: "" })}><X className="h-3 w-3" /></Button>
                                </Alert>
                            )}
                            <PermissionGate permission="CreateTeacherAssignments"><Tooltip><TooltipTrigger asChild><Button onClick={goCreate} disabled={loading}><Plus className="h-4 w-4 mr-2" />Assign Teacher</Button></TooltipTrigger><TooltipContent>Assign a teacher to a building & department</TooltipContent></Tooltip></PermissionGate>
                        </div>
                    </div>

                    {error && <Alert variant="destructive"><AlertCircle className="h-4 w-4" /><AlertDescription>{error}</AlertDescription></Alert>}

                    {/* Filters */}
                    <div className="space-y-3">
                        <DateRangeFilter
                            fromDate={fromDate} toDate={toDate}
                            onFromDateChange={(date) => { setFromDate(date); resetPage(); }}
                            onToDateChange={(date) => { setToDate(date); resetPage(); }}
                            onRangeChange={() => resetPage()}
                            leftElement={
                                <Tooltip><TooltipTrigger asChild><div className="relative"><Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" /><Input placeholder="Search assignments..." value={q} onChange={(e) => { setQ(e.target.value); resetPage(); }} className="pl-10 w-[240px]" /></div></TooltipTrigger><TooltipContent>Search by teacher, building or department</TooltipContent></Tooltip>
                            }
                            rightElement={
                                <>
                                    <Tooltip><TooltipTrigger asChild><div><Select value={teacherFilter} onValueChange={(v) => { setTeacherFilter(v); resetPage(); }}><SelectTrigger className="w-[180px]"><SelectValue placeholder="All Teachers" /></SelectTrigger><SelectContent><SelectItem value="all">All Teachers</SelectItem>{teachers.map((t) => <SelectItem key={t.id} value={String(t.id)}>{t.name}</SelectItem>)}</SelectContent></Select></div></TooltipTrigger><TooltipContent>Filter by teacher</TooltipContent></Tooltip>
                                    {hasActiveFilters && (<Tooltip><TooltipTrigger asChild><Button variant="outline" size="sm" onClick={clearFilters}>Clear</Button></TooltipTrigger><TooltipContent>Clear all filters</TooltipContent></Tooltip>)}
                                    <PermissionGate permission="ArchiveTeacherAssignments"><div className="ml-auto"><Tooltip><TooltipTrigger asChild><Button variant="outline" onClick={goArchive}><Archive className="h-4 w-4 mr-2" />Archive</Button></TooltipTrigger><TooltipContent>View archived assignments</TooltipContent></Tooltip></div></PermissionGate>
                                </>
                            }
                        />
                    </div>

                    {/* Table */}
                    <div className="border rounded-lg overflow-hidden bg-white">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Teacher</TableHead>
                                    <TableHead>Building</TableHead>
                                    <TableHead>Department</TableHead>
                                    <TableHead className="text-center">Created At</TableHead>
                                    <TableHead className="text-center">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {paged.length === 0 ? (
                                    <TableRow><TableCell colSpan={5} className="h-32 text-center text-gray-500">No assignments found.</TableCell></TableRow>
                                ) : (
                                    paged.map((a) => (
                                        <Tooltip key={a.id}>
                                            <TooltipTrigger asChild>
                                                <TableRow className="cursor-pointer" onClick={() => openViewModal(a)}>
                                                    <TableCell className="font-medium">{a.teacherName}</TableCell>
                                                    <TableCell className="max-w-md truncate">{a.buildingName}</TableCell>
                                                    <TableCell className="max-w-md truncate">{a.departmentName}</TableCell>
                                                    <TableCell className="text-gray-600 text-center">{a.createdAt}</TableCell>
                                                    <TableCell className="text-center">
                                                        <div className="flex items-center justify-center gap-1">
                                                            <PermissionGate permission="UpdateTeacherAssignments"><Tooltip><TooltipTrigger asChild><Button variant="ghost" size="icon" onClick={(e) => { e.stopPropagation(); goEdit(a.id); }}><Pencil className="h-4 w-4" /></Button></TooltipTrigger><TooltipContent>Edit assignment</TooltipContent></Tooltip></PermissionGate>
                                                            <PermissionGate permission="DeleteTeacherAssignments"><Tooltip><TooltipTrigger asChild><Button variant="ghost" size="icon" onClick={(e) => { e.stopPropagation(); setDeleteModal({ open: true, assignment: a }); }} className="text-red-600 hover:text-red-700 hover:bg-red-50"><Trash2 className="h-4 w-4" /></Button></TooltipTrigger><TooltipContent>Archive assignment</TooltipContent></Tooltip></PermissionGate>
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

            {/* View Confirmation Dialog */}
            <Dialog open={viewModal.open} onOpenChange={(open) => !open && setViewModal({ open: false, assignment: null })}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>View Assignment Details</DialogTitle>
                        <DialogDescription>Would you like to view the details of <span className="font-semibold text-gray-900">"{viewModal.assignment?.teacherName}"</span>?</DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setViewModal({ open: false, assignment: null })}>Cancel</Button>
                        <Button onClick={confirmView}>View Details</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Archive Confirmation */}
            <AlertDialog open={deleteModal.open} onOpenChange={(open) => !open && setDeleteModal({ open: false, assignment: null })}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Confirm Archive</AlertDialogTitle>
                        <AlertDialogDescription>Are you sure you want to archive the assignment for <span className="font-semibold">{deleteModal.assignment?.teacherName}</span>? It will be moved to the archive list.</AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={confirmDelete} className="bg-red-600 hover:bg-red-700">Archive</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </AppLayout>
    );
}
