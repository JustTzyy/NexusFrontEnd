import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
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
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { RotateCcw, Trash2, Search, X, AlertCircle, CheckCircle2, ArrowLeft, Calendar, Clock } from "lucide-react";
import PermissionGate from '@/components/PermissionGate';

export default function TutoringSessionsArchive() {
    const navigate = useNavigate();

    /* ------------------------------ api state ------------------------------ */
    const [sessions, setSessions] = useState([]);
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
    const [restoreModal, setRestoreModal] = useState({ open: false, session: null });
    const [deleteModal, setDeleteModal] = useState({ open: false, session: null });

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

    const handlePrintPDF = () => {
        generatePDF({
            title: "Archived Tutoring Sessions Report",
            data: filtered.map(s => ({
                ...s,
                schedule: `${s.startDateTime} - ${s.endDateTime.split(' ')[1]}`
            })),
            columns: [
                { header: "Subject", key: "subjectName" },
                { header: "Teacher", key: "teacherName" },
                { header: "Room", key: "roomName" },
                { header: "Deleted At", key: "deletedAt" },
                { header: "Status", key: "status" },
            ],
            filters: { Search: q || null, "From Date": fromDate || null, "To Date": toDate || null },
            companyName: "Learning Flow Management System",
        });
    };

    const goBack = () => navigate("/tutoring-sessions");

    const loadArchivedSessions = async () => {
        setLoading(true);
        setError("");
        try {
            // TODO: replace with real API call, e.g. tutoringSessionService.getArchived()
            setSessions([]);
        } catch (err) {
            setError(err.message || "Failed to load archived sessions");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadArchivedSessions();
    }, []);

    useEffect(() => {
        if (alert.show) {
            const timer = setTimeout(() => setAlert({ show: false, type: "success", message: "" }), 3000);
            return () => clearTimeout(timer);
        }
    }, [alert.show]);

    const confirmRestore = () => {
        const s = restoreModal.session;
        setRestoreModal({ open: false, session: null });
        setSessions(prev => prev.filter(x => x.id !== s.id));
        setAlert({ show: true, type: "success", message: "Session restored successfully!" });
    };

    const confirmPermanentDelete = () => {
        const s = deleteModal.session;
        setDeleteModal({ open: false, session: null });
        setSessions(prev => prev.filter(x => x.id !== s.id));
        setAlert({ show: true, type: "success", message: "Session permanently deleted!" });
    };

    const filtered = useMemo(() => {
        let result = applyFilters(sessions, {
            search: q,
            searchFields: ['subjectName', 'teacherName', 'roomName'],
            fromDate,
            toDate,
            dateField: 'deletedAt',
        });
        if (status !== "all") {
            result = result.filter(s => s.status.toLowerCase() === status.toLowerCase());
        }
        return result;
    }, [sessions, q, fromDate, toDate, status]);

    const paginationResult = useMemo(() => paginate(filtered, page, pageSize), [filtered, page, pageSize]);
    const { data: paged, total, totalPages, page: safePage } = paginationResult;

    return (
        <AppLayout title="Archived Sessions" onPrint={filtered.length > 0 ? handlePrintPDF : undefined}>
            <div className="space-y-6">
                <div className="flex items-center gap-3">
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <Button variant="outline" size="icon" onClick={goBack}>
                                <ArrowLeft className="h-4 w-4" />
                            </Button>
                        </TooltipTrigger>
                        <TooltipContent>Back to sessions</TooltipContent>
                    </Tooltip>
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900">Archived Sessions</h1>
                        <p className="mt-1 text-sm text-gray-600">Restore or permanently delete historical sessions</p>
                    </div>
                </div>

                {alert.show && (
                    <Alert className={`animate-in fade-in slide-in-from-top-2 ${alert.type === "success" ? "border-green-500 bg-green-50 text-green-800" : "border-red-500 bg-red-50 text-red-800"}`}>
                        <CheckCircle2 className="h-4 w-4" />
                        <AlertDescription>{alert.message}</AlertDescription>
                    </Alert>
                )}

                <DateRangeFilter
                    fromDate={fromDate}
                    toDate={toDate}
                    onFromDateChange={(date) => { setFromDate(date); resetPage(); }}
                    onToDateChange={(date) => { setToDate(date); resetPage(); }}
                    leftElement={
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                            <Input placeholder="Search archive..." value={q} onChange={(e) => { setQ(e.target.value); resetPage(); }} className="pl-10 w-[240px]" />
                        </div>
                    }
                    rightElement={
                        <Button variant="outline" size="sm" onClick={clearFilters}>Clear</Button>
                    }
                />

                <div className="border rounded-lg overflow-hidden bg-white shadow-sm">
                    <Table>
                        <TableHeader>
                            <TableRow className="bg-gray-50/50">
                                <TableHead>Subject</TableHead>
                                <TableHead>Teacher</TableHead>
                                <TableHead>Room</TableHead>
                                <TableHead>Deleted At</TableHead>
                                <TableHead className="text-center">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {loading ? (
                                <TableRow><TableCell colSpan={5} className="h-32 text-center text-gray-400 font-medium">Loading Archive...</TableCell></TableRow>
                            ) : paged.length === 0 ? (
                                <TableRow><TableCell colSpan={5} className="h-32 text-center text-gray-500">No archived sessions found.</TableCell></TableRow>
                            ) : (
                                paged.map((s) => (
                                    <TableRow key={s.id}>
                                        <TableCell className="font-semibold text-gray-900">{s.subjectName}</TableCell>
                                        <TableCell className="text-gray-600">{s.teacherName}</TableCell>
                                        <TableCell className="text-gray-600 italic">{s.roomName}</TableCell>
                                        <TableCell className="text-gray-500 font-mono text-sm">{s.deletedAt}</TableCell>
                                        <TableCell className="text-center">
                                            <div className="flex items-center justify-center gap-1">
                                                <PermissionGate permission="RestoreTutoringRequests">
                                                <Tooltip>
                                                    <TooltipTrigger asChild>
                                                        <Button variant="ghost" size="icon" className="text-green-600 hover:bg-green-50" onClick={() => setRestoreModal({ open: true, session: s })}>
                                                            <RotateCcw className="h-4 w-4" />
                                                        </Button>
                                                    </TooltipTrigger>
                                                    <TooltipContent>Restore session</TooltipContent>
                                                </Tooltip>
                                                </PermissionGate>
                                                <PermissionGate permission="PermanentDeleteTutoringRequests">
                                                <Tooltip>
                                                    <TooltipTrigger asChild>
                                                        <Button variant="ghost" size="icon" className="text-red-600 hover:bg-red-50" onClick={() => setDeleteModal({ open: true, session: s })}>
                                                            <Trash2 className="h-4 w-4" />
                                                        </Button>
                                                    </TooltipTrigger>
                                                    <TooltipContent>Delete permanently</TooltipContent>
                                                </Tooltip>
                                                </PermissionGate>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </div>
            </div>

            {/* Modals */}
            <AlertDialog open={restoreModal.open} onOpenChange={(o) => !o && setRestoreModal({ open: false, session: null })}>
                <AlertDialogContent>
                    <AlertDialogHeader><AlertDialogTitle>Confirm Restore</AlertDialogTitle><AlertDialogDescription>Bring this tutoring session back to the active list?</AlertDialogDescription></AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={confirmRestore} className="bg-green-600 hover:bg-green-700 text-white">Restore</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            <AlertDialog open={deleteModal.open} onOpenChange={(o) => !o && setDeleteModal({ open: false, session: null })}>
                <AlertDialogContent>
                    <AlertDialogHeader><AlertDialogTitle>Delete Permanently</AlertDialogTitle><AlertDialogDescription>This action cannot be undone. All session data will be erased.</AlertDialogDescription></AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={confirmPermanentDelete} className="bg-red-600 hover:bg-red-700 text-white">Delete</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </AppLayout>
    );
}
