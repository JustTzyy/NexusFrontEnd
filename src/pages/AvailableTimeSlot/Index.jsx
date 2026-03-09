import { useEffect, useMemo, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { availableTimeSlotService } from "../../services/availableTimeSlotService";
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
import { Plus, Pencil, Trash2, Archive, Search, X, AlertCircle, CheckCircle2 } from "lucide-react";
import PermissionGate from '@/components/PermissionGate';

export default function AvailableTimeSlotsIndex() {
    const navigate = useNavigate();
    const location = useLocation();

    const [slots, setSlots] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [q, setQ] = useState("");
    const [fromDate, setFromDate] = useState(undefined);
    const [toDate, setToDate] = useState(undefined);
    const [status, setStatus] = useState("all");
    const [page, setPage] = useState(1);
    const pageSize = 10;

    const [deleteModal, setDeleteModal] = useState({ open: false, slot: null });
    const [viewModal, setViewModal] = useState({ open: false, slot: null });
    const [alert, setAlert] = useState({ show: false, type: "success", message: "" });

    const resetPage = () => setPage(1);

    const clearFilters = () => {
        setQ("");
        setFromDate(undefined);
        setToDate(undefined);
        setStatus("all");
        setPage(1);
    };

    const goCreate = () => navigate("/available-time-slots/create");
    const goEdit = (id) => navigate(`/available-time-slots/${id}/edit`);
    const goArchive = () => navigate("/available-time-slots/archive");

    const loadSlots = async () => {
        setLoading(true);
        setError("");
        try {
            const response = await availableTimeSlotService.getAll({ pageNumber: 1, pageSize: 100 });
            const data = response.data?.items || [];
            setSlots(data.map(s => ({
                id: s.id,
                label: s.label,
                startTime: s.startTime,
                endTime: s.endTime,
                isActive: s.isActive,
                createdAt: new Date(s.createdAt).toLocaleDateString()
            })));
        } catch (err) {
            setError(err.message || "Failed to load time slots");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { loadSlots(); }, []);

    useEffect(() => {
        if (location.state?.alert) {
            setAlert({ show: true, ...location.state.alert });
            window.history.replaceState({}, document.title);
        }
    }, [location]);

    useEffect(() => {
        if (alert.show) {
            const t = setTimeout(() => setAlert({ show: false, type: "success", message: "" }), 3000);
            return () => clearTimeout(t);
        }
    }, [alert.show]);

    const openDeleteModal = (s) => setDeleteModal({ open: true, slot: s });
    const openViewModal = (s) => setViewModal({ open: true, slot: s });

    const confirmDelete = async () => {
        const s = deleteModal.slot;
        setDeleteModal({ open: false, slot: null });
        if (!s) return;
        try {
            await availableTimeSlotService.delete(s.id);
            setSlots(prev => prev.filter(x => x.id !== s.id));
            setAlert({ show: true, type: "success", message: `"${s.label}" archived successfully!` });
        } catch (err) {
            setAlert({ show: true, type: "error", message: err.message || "Failed to archive time slot" });
        }
    };

    const confirmView = () => {
        if (viewModal.slot) navigate(`/available-time-slots/${viewModal.slot.id}`);
        setViewModal({ open: false, slot: null });
    };

    const filtered = useMemo(() => {
        let result = applyFilters(slots, {
            search: q,
            searchFields: ['label'],
            fromDate,
            toDate,
            dateField: 'createdAt',
        });
        if (status !== "all") result = result.filter(s => s.isActive === (status === "active"));
        return result;
    }, [slots, q, fromDate, toDate, status]);

    const paginationResult = useMemo(() => paginate(filtered, page, pageSize), [filtered, page, pageSize]);
    const { data: paged, total, totalPages, page: safePage } = paginationResult;

    useEffect(() => {
        if (page > totalPages && totalPages > 0) setPage(totalPages);
    }, [totalPages, page]);

    return (
        <AppLayout title="Time Slots">
            {loading ? (
                <TableIndexSkeleton columns={5} rows={8} headers={["Time Slot", "Status", "Start Time", "Created At", "Actions"]} />
            ) : (
                <div className="space-y-6">
                    {/* Header */}
                    <div className="flex items-start justify-between gap-4">
                        <div>
                            <h1 className="text-3xl font-bold text-gray-900">Available Time Slots</h1>
                            <p className="mt-1 text-sm text-gray-600">Manage time slots for tutoring sessions</p>
                        </div>
                        <div className="flex items-center gap-4">
                            {alert.show && (
                                <Alert className={`flex items-center gap-2 py-2 px-4 animate-in fade-in slide-in-from-right-4 duration-300 ${alert.type === "success" ? "border-green-500 bg-green-50 text-green-800" : "border-red-500 bg-red-50 text-red-800"}`}>
                                    {alert.type === "success" ? <CheckCircle2 className="h-4 w-4 text-green-600 flex-shrink-0" /> : <AlertCircle className="h-4 w-4 text-red-600 flex-shrink-0" />}
                                    <AlertDescription className={`text-sm whitespace-nowrap ${alert.type === "success" ? "text-green-800" : "text-red-800"}`}>{alert.message}</AlertDescription>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className={`h-5 w-5 ml-1 flex-shrink-0 ${alert.type === "success" ? "text-green-600 hover:text-green-700 hover:bg-green-100" : "text-red-600 hover:text-red-700 hover:bg-red-100"}`}
                                        onClick={() => setAlert({ show: false, type: "success", message: "" })}
                                    >
                                        <X className="h-3 w-3" />
                                    </Button>
                                </Alert>
                            )}
                            <PermissionGate permission="CreateAvailableTimeSlots"><Tooltip>
                                <TooltipTrigger asChild>
                                    <Button onClick={goCreate} disabled={loading}>
                                        <Plus className="h-4 w-4 mr-2" />New Time Slot
                                    </Button>
                                </TooltipTrigger>
                                <TooltipContent>Add a new time slot</TooltipContent>
                            </Tooltip></PermissionGate>
                        </div>
                    </div>

                    {error && <Alert variant="destructive"><AlertCircle className="h-4 w-4" /><AlertDescription>{error}</AlertDescription></Alert>}

                    {/* Filters */}
                    <div className="space-y-3">
                        <DateRangeFilter
                            fromDate={fromDate}
                            toDate={toDate}
                            onFromDateChange={(date) => { setFromDate(date); resetPage(); }}
                            onToDateChange={(date) => { setToDate(date); resetPage(); }}
                            onRangeChange={() => resetPage()}
                            leftElement={
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <div className="relative">
                                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                                            <Input placeholder="Search time slots..." value={q} onChange={(e) => { setQ(e.target.value); resetPage(); }} className="pl-10 w-[240px]" />
                                        </div>
                                    </TooltipTrigger>
                                    <TooltipContent>Search by label</TooltipContent>
                                </Tooltip>
                            }
                            rightElement={
                                <>
                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <div>
                                                <Select value={status} onValueChange={(v) => { setStatus(v); resetPage(); }}>
                                                    <SelectTrigger className="w-[180px]"><SelectValue placeholder="All Status" /></SelectTrigger>
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
                                                <Button variant="outline" size="sm" onClick={clearFilters}>Clear</Button>
                                            </TooltipTrigger>
                                            <TooltipContent>Clear all filters</TooltipContent>
                                        </Tooltip>
                                    )}

                                    <PermissionGate permission="ArchiveAvailableTimeSlots"><div className="ml-auto">
                                        <Tooltip>
                                            <TooltipTrigger asChild>
                                                <Button variant="outline" onClick={goArchive}>
                                                    <Archive className="h-4 w-4 mr-2" />Archive
                                                </Button>
                                            </TooltipTrigger>
                                            <TooltipContent>View archived time slots</TooltipContent>
                                        </Tooltip>
                                    </div></PermissionGate>
                                </>
                            }
                        />
                    </div>

                    {/* Table */}
                    <div className="border rounded-lg overflow-hidden bg-white">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Time Slot</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead>Start Time</TableHead>
                                    <TableHead className="text-center">Created At</TableHead>
                                    <TableHead className="text-center">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {paged.length === 0 ? (
                                    <TableRow><TableCell colSpan={5} className="h-32 text-center text-gray-500">No time slots found.</TableCell></TableRow>
                                ) : (
                                    paged.map(s => (
                                        <Tooltip key={s.id}>
                                            <TooltipTrigger asChild>
                                                <TableRow className="cursor-pointer" onClick={() => openViewModal(s)}>
                                                    <TableCell className="font-medium">{s.label}</TableCell>
                                                    <TableCell>
                                                        {s.isActive ? <span className="text-sm font-medium text-green-700">Active</span> : <span className="text-sm font-medium text-gray-500">Inactive</span>}
                                                    </TableCell>
                                                    <TableCell className="text-gray-600">{s.startTime}</TableCell>
                                                    <TableCell className="text-gray-600 text-center">{s.createdAt}</TableCell>
                                                    <TableCell className="text-center">
                                                        <div className="flex items-center justify-center gap-1">
                                                            <PermissionGate permission="UpdateAvailableTimeSlots"><Tooltip><TooltipTrigger asChild><Button variant="ghost" size="icon" onClick={(e) => { e.stopPropagation(); goEdit(s.id); }}><Pencil className="h-4 w-4" /></Button></TooltipTrigger><TooltipContent>Edit time slot</TooltipContent></Tooltip></PermissionGate>
                                                            <PermissionGate permission="DeleteAvailableTimeSlots"><Tooltip><TooltipTrigger asChild><Button variant="ghost" size="icon" onClick={(e) => { e.stopPropagation(); openDeleteModal(s); }} className="text-red-600 hover:text-red-700 hover:bg-red-50"><Trash2 className="h-4 w-4" /></Button></TooltipTrigger><TooltipContent>Archive time slot</TooltipContent></Tooltip></PermissionGate>
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
                                            <Button variant="outline" size="sm" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={safePage === 1}>Previous</Button>
                                        </TooltipTrigger>
                                        <TooltipContent>Go to previous page</TooltipContent>
                                    </Tooltip>
                                    <span className="text-sm text-gray-600">Page {safePage} of {totalPages}</span>
                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <Button variant="outline" size="sm" onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={safePage === totalPages}>Next</Button>
                                        </TooltipTrigger>
                                        <TooltipContent>Go to next page</TooltipContent>
                                    </Tooltip>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Delete Confirmation */}
            <AlertDialog open={deleteModal.open} onOpenChange={(open) => !open && setDeleteModal({ open: false, slot: null })}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Confirm Archive</AlertDialogTitle>
                        <AlertDialogDescription>
                            Are you sure you want to archive the time slot{" "}
                            <span className="font-semibold">{deleteModal.slot?.label}</span>?
                            It will be moved to the archive list.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={confirmDelete} className="bg-red-600 hover:bg-red-700">Archive</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            {/* View Confirmation */}
            <Dialog open={viewModal.open} onOpenChange={(open) => !open && setViewModal({ open: false, slot: null })}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>View Time Slot</DialogTitle>
                        <DialogDescription>
                            Would you like to view the details of{" "}
                            <span className="font-semibold">{viewModal.slot?.label}</span>?
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setViewModal({ open: false, slot: null })}>Cancel</Button>
                        <Button onClick={confirmView}>View Details</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </AppLayout>
    );
}
