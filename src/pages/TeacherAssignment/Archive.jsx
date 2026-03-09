import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { teacherAssignmentService } from "../../services/teacherAssignmentService";
import { userService } from "../../services/userService";
import { TableIndexSkeleton } from "../../utils/skeletonLoaders";
import AppLayout from "../../layouts/AppLayout";
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
import { RotateCcw, Trash2, Search, AlertCircle, CheckCircle2, ArrowLeft } from "lucide-react";
import PermissionGate from '@/components/PermissionGate';

export default function TeacherAssignmentArchive() {
    const navigate = useNavigate();

    const [assignments, setAssignments] = useState([]);
    const [teachers, setTeachers] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [q, setQ] = useState("");
    const [teacherFilter, setTeacherFilter] = useState("all");
    const [fromDate, setFromDate] = useState(undefined);
    const [toDate, setToDate] = useState(undefined);
    const [page, setPage] = useState(1);
    const pageSize = 10;

    const [viewModal, setViewModal] = useState({ open: false, assignment: null });
    const [restoreModal, setRestoreModal] = useState({ open: false, assignment: null });
    const [deleteModal, setDeleteModal] = useState({ open: false, assignment: null });
    const [alert, setAlert] = useState({ show: false, type: "success", message: "" });

    const resetPage = () => setPage(1);
    const clearFilters = () => { setQ(""); setFromDate(undefined); setToDate(undefined); setTeacherFilter("all"); setPage(1); };
    const goBack = () => navigate("/teacher-assignments");

    const loadArchived = async () => {
        setLoading(true);
        setError("");
        try {
            const [response, teachersRes] = await Promise.all([
                teacherAssignmentService.getArchived({ pageNumber: 1, pageSize: 100 }),
                userService.getByRole("Teacher"),
            ]);
            const data = response.data?.items || [];
            setAssignments(data.map(a => ({
                ...a,
                deletedAt: a.deletedAt ? new Date(a.deletedAt).toLocaleDateString() : "—"
            })));
            const teachersData = teachersRes.data || [];
            setTeachers(teachersData.map(t => ({ id: t.id, name: t.fullName })));
        } catch (err) {
            setError(err.message || "Failed to load archived assignments");
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

    const confirmRestore = async () => {
        const a = restoreModal.assignment;
        if (!a) return;
        try {
            await teacherAssignmentService.restore(a.id);
            setAssignments((prev) => prev.filter((item) => item.id !== a.id));
            setRestoreModal({ open: false, assignment: null });
            setAlert({ show: true, type: "success", message: `Assignment for "${a.teacherName}" restored successfully!` });
        } catch (err) {
            setAlert({ show: true, type: "error", message: err.message || "Failed to restore assignment" });
            setRestoreModal({ open: false, assignment: null });
        }
    };

    const confirmDelete = async () => {
        const a = deleteModal.assignment;
        if (!a) return;
        try {
            await teacherAssignmentService.permanentDelete(a.id);
            setAssignments((prev) => prev.filter((item) => item.id !== a.id));
            setDeleteModal({ open: false, assignment: null });
            setAlert({ show: true, type: "success", message: `Assignment for "${a.teacherName}" permanently deleted!` });
        } catch (err) {
            setAlert({ show: true, type: "error", message: err.message || "Failed to delete assignment" });
            setDeleteModal({ open: false, assignment: null });
        }
    };

    const confirmView = () => {
        if (viewModal.assignment) navigate(`/teacher-assignments/${viewModal.assignment.id}`, { state: { from: "archive" } });
        setViewModal({ open: false, assignment: null });
    };

    const filtered = useMemo(() => {
        let result = applyFilters(assignments, { search: q, searchFields: ['teacherName', 'buildingName', 'departmentName'], fromDate, toDate, dateField: 'deletedAt' });
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
        <AppLayout title="Archived Assignments">
            {loading ? (
                <TableIndexSkeleton columns={5} rows={10} headers={["Teacher", "Building", "Department", "Deleted At", "Actions"]} />
            ) : (
                <div className="space-y-6">
                    <div className="flex items-start justify-between gap-4">
                        <div>
                            <h1 className="text-3xl font-bold text-gray-900">Archived Assignments</h1>
                            <p className="mt-1 text-sm text-gray-600">View and manage archived teacher assignments</p>
                        </div>
                        <Tooltip><TooltipTrigger asChild><Button variant="outline" onClick={goBack}><ArrowLeft className="h-4 w-4 mr-2" />Back to Assignments</Button></TooltipTrigger><TooltipContent>Return to active assignments</TooltipContent></Tooltip>
                    </div>

                    {alert.show && (
                        <Alert className={`flex items-center gap-2 py-2 px-4 animate-in fade-in slide-in-from-right-4 duration-300 ${alert.type === "success" ? "border-green-500 bg-green-50 text-green-800" : "border-red-500 bg-red-50 text-red-800"}`}>
                            {alert.type === "success" ? <CheckCircle2 className="h-4 w-4 text-green-600 flex-shrink-0" /> : <AlertCircle className="h-4 w-4 text-red-600 flex-shrink-0" />}
                            <AlertDescription className={`text-sm whitespace-nowrap ${alert.type === "success" ? "text-green-800" : "text-red-800"}`}>{alert.message}</AlertDescription>
                        </Alert>
                    )}

                    {error && <Alert variant="destructive"><AlertCircle className="h-4 w-4" /><AlertDescription>{error}</AlertDescription></Alert>}

                    <div className="space-y-3">
                        <DateRangeFilter fromDate={fromDate} toDate={toDate} onFromDateChange={(date) => { setFromDate(date); resetPage(); }} onToDateChange={(date) => { setToDate(date); resetPage(); }} onRangeChange={() => resetPage()}
                            leftElement={<Tooltip><TooltipTrigger asChild><div className="relative"><Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" /><Input placeholder="Search archived..." value={q} onChange={(e) => { setQ(e.target.value); resetPage(); }} className="pl-10 w-[240px]" /></div></TooltipTrigger><TooltipContent>Search by teacher, building, or department</TooltipContent></Tooltip>}
                            rightElement={<>
                                <Tooltip><TooltipTrigger asChild><div><Select value={teacherFilter} onValueChange={(v) => { setTeacherFilter(v); resetPage(); }}><SelectTrigger className="w-[180px]"><SelectValue placeholder="All Teachers" /></SelectTrigger><SelectContent><SelectItem value="all">All Teachers</SelectItem>{teachers.map((t) => <SelectItem key={t.id} value={String(t.id)}>{t.name}</SelectItem>)}</SelectContent></Select></div></TooltipTrigger><TooltipContent>Filter by teacher</TooltipContent></Tooltip>
                                {hasActiveFilters && (<Tooltip><TooltipTrigger asChild><Button variant="outline" size="sm" onClick={clearFilters}>Clear</Button></TooltipTrigger><TooltipContent>Clear all filters</TooltipContent></Tooltip>)}
                            </>}
                        />
                    </div>

                    <div className="border rounded-lg overflow-hidden bg-white">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Teacher</TableHead>
                                    <TableHead>Building</TableHead>
                                    <TableHead>Department</TableHead>
                                    <TableHead className="text-center">Deleted At</TableHead>
                                    <TableHead className="text-center">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {paged.length === 0 ? (
                                    <TableRow><TableCell colSpan={5} className="h-32 text-center text-gray-500">No archived assignments found.</TableCell></TableRow>
                                ) : (
                                    paged.map((a) => (
                                        <Tooltip key={a.id}>
                                            <TooltipTrigger asChild>
                                                <TableRow className="cursor-pointer" onClick={() => setViewModal({ open: true, assignment: a })}>
                                                    <TableCell className="font-medium">{a.teacherName}</TableCell>
                                                    <TableCell>{a.buildingName}</TableCell>
                                                    <TableCell>{a.departmentName}</TableCell>
                                                    <TableCell className="text-center text-gray-600">{a.deletedAt}</TableCell>
                                                    <TableCell className="text-center">
                                                        <div className="flex items-center justify-center gap-1">
                                                            <PermissionGate permission="RestoreTeacherAssignments"><Tooltip><TooltipTrigger asChild><Button variant="ghost" size="icon" onClick={(e) => { e.stopPropagation(); setRestoreModal({ open: true, assignment: a }); }} className="text-green-600 hover:text-green-700 hover:bg-green-50"><RotateCcw className="h-4 w-4" /></Button></TooltipTrigger><TooltipContent>Restore assignment</TooltipContent></Tooltip></PermissionGate>
                                                            <PermissionGate permission="PermanentDeleteTeacherAssignments"><Tooltip><TooltipTrigger asChild><Button variant="ghost" size="icon" onClick={(e) => { e.stopPropagation(); setDeleteModal({ open: true, assignment: a }); }} className="text-red-600 hover:text-red-700 hover:bg-red-50"><Trash2 className="h-4 w-4" /></Button></TooltipTrigger><TooltipContent>Permanently delete</TooltipContent></Tooltip></PermissionGate>
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

            <Dialog open={viewModal.open} onOpenChange={(open) => !open && setViewModal({ open: false, assignment: null })}>
                <DialogContent>
                    <DialogHeader><DialogTitle>View Assignment Details</DialogTitle><DialogDescription>You are about to view the archived assignment for <span className="font-semibold text-gray-900">"{viewModal.assignment?.teacherName}"</span>.</DialogDescription></DialogHeader>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setViewModal({ open: false, assignment: null })}>Cancel</Button>
                        <Button onClick={confirmView}>View Details</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <AlertDialog open={restoreModal.open} onOpenChange={(open) => !open && setRestoreModal({ open: false, assignment: null })}>
                <AlertDialogContent>
                    <AlertDialogHeader><AlertDialogTitle>Confirm Restore</AlertDialogTitle><AlertDialogDescription>Are you sure you want to restore the assignment for <span className="font-semibold text-gray-900">"{restoreModal.assignment?.teacherName}"</span>? This will move it back to active assignments.</AlertDialogDescription></AlertDialogHeader>
                    <AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel><AlertDialogAction onClick={confirmRestore} className="bg-green-600 hover:bg-green-700">Restore</AlertDialogAction></AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            <AlertDialog open={deleteModal.open} onOpenChange={(open) => !open && setDeleteModal({ open: false, assignment: null })}>
                <AlertDialogContent>
                    <AlertDialogHeader><AlertDialogTitle>Confirm Permanent Delete</AlertDialogTitle><AlertDialogDescription>Are you sure you want to <span className="font-semibold text-red-600">permanently delete</span> the assignment for <span className="font-semibold text-gray-900">"{deleteModal.assignment?.teacherName}"</span>? This action cannot be undone.</AlertDialogDescription></AlertDialogHeader>
                    <AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel><AlertDialogAction onClick={confirmDelete} className="bg-red-600 hover:bg-red-700">Permanently Delete</AlertDialogAction></AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </AppLayout>
    );
}
