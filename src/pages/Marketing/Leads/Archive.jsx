import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { leadService } from '../../../services/leadService';
import { TableIndexSkeleton } from '../../../utils/skeletonLoaders';
import AppLayout from '../../../layouts/AppLayout';
import { applyFilters, paginate } from '../../../utils/filterUtils';
import DateRangeFilter from '../../../components/DateRangeFilter';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import { RotateCcw, Trash2, Search, X, AlertCircle, CheckCircle2, ArrowLeft } from 'lucide-react';
import PermissionGate from '@/components/PermissionGate';

export default function LeadsArchive() {
    const navigate = useNavigate();

    /* ------------------------------ api state ------------------------------ */
    const [leads, setLeads] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    /* ---------------------------- filter state ---------------------------- */
    const [q, setQ] = useState('');
    const [fromDate, setFromDate] = useState(undefined);
    const [toDate, setToDate] = useState(undefined);
    /* -------------------------- pagination state -------------------------- */
    const [page, setPage] = useState(1);
    const pageSize = 10;

    /* -------------------------- modal state -------------------------- */
    const [viewModal, setViewModal] = useState({ open: false, lead: null });
    const [restoreModal, setRestoreModal] = useState({ open: false, lead: null });
    const [deleteModal, setDeleteModal] = useState({ open: false, lead: null });

    /* -------------------------- alert state -------------------------- */
    const [alert, setAlert] = useState({ show: false, type: 'success', message: '' });

    const resetPage = () => setPage(1);

    const clearFilters = () => {
        setQ('');
        setFromDate(undefined);
        setToDate(undefined);
        setPage(1);
    };

    /* ------------------------------ api ------------------------------ */
    const loadArchivedLeads = async () => {
        setLoading(true);
        setError('');
        try {
            const res = await leadService.getArchived({ pageNumber: 1, pageSize: 200 });
            setLeads(res.data?.items || []);
        } catch (err) {
            setError(err.response?.data?.message || err.message || 'Failed to load archived leads');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadArchivedLeads();
    }, []);

    useEffect(() => {
        if (alert.show) {
            const t = setTimeout(() => setAlert({ show: false, type: 'success', message: '' }), 3000);
            return () => clearTimeout(t);
        }
    }, [alert.show]);

    /* ------------------------------ actions ------------------------------ */
    const openViewModal = (lead) => setViewModal({ open: true, lead });
    const openRestoreModal = (lead) => setRestoreModal({ open: true, lead });
    const openDeleteModal = (lead) => setDeleteModal({ open: true, lead });

    const confirmView = () => {
        if (viewModal.lead) {
            navigate(`/marketing/leads/${viewModal.lead.id}`, { state: { from: 'archive' } });
        }
        setViewModal({ open: false, lead: null });
    };

    const confirmRestore = async () => {
        const lead = restoreModal.lead;
        if (!lead) return;
        setRestoreModal({ open: false, lead: null });
        try {
            await leadService.restore(lead.id);
            setLeads((prev) => prev.filter((x) => x.id !== lead.id));
            setAlert({ show: true, type: 'success', message: `Lead "${lead.firstName} ${lead.lastName}" restored successfully!` });
        } catch (err) {
            setAlert({ show: true, type: 'error', message: err.response?.data?.message || 'Failed to restore lead' });
        }
    };

    const confirmDelete = async () => {
        const lead = deleteModal.lead;
        if (!lead) return;
        setDeleteModal({ open: false, lead: null });
        try {
            await leadService.permanentDelete(lead.id);
            setLeads((prev) => prev.filter((x) => x.id !== lead.id));
            setAlert({ show: true, type: 'success', message: `Lead "${lead.firstName} ${lead.lastName}" permanently deleted!` });
        } catch (err) {
            setAlert({ show: true, type: 'error', message: err.response?.data?.message || 'Failed to delete lead' });
        }
    };

    /* ------------------------- filtering ------------------------- */
    const filtered = useMemo(() => {
        return applyFilters(leads, {
            search: q,
            searchFields: ['firstName', 'lastName', 'email'],
            fromDate,
            toDate,
            dateField: 'updatedAt',
        });
    }, [leads, q, fromDate, toDate]);

    const paginationResult = useMemo(() => paginate(filtered, page, pageSize), [filtered, page, pageSize]);
    const { data: paged, total, totalPages, page: safePage } = paginationResult;

    useEffect(() => {
        if (page > totalPages) setPage(totalPages);
    }, [totalPages, page]);

    return (
        <AppLayout title="Archived Leads">
            {loading ? (
                <TableIndexSkeleton
                    columns={4}
                    rows={10}
                    headers={['Name', 'Email', 'Source', 'Actions']}
                />
            ) : (
                <div className="space-y-6">
                    {/* Header */}
                    <div className="flex items-start justify-between gap-4">
                        <div>
                            <h1 className="text-3xl font-bold text-gray-900">Archived Leads</h1>
                            <p className="mt-1 text-sm text-gray-600">
                                View and manage soft-deleted leads
                            </p>
                        </div>

                        <div className="flex items-center gap-4">
                            {alert.show && (
                                <Alert
                                    className={`flex items-center gap-2 py-2 px-4 w-fit rounded-full animate-in fade-in slide-in-from-right-4 duration-300 ${
                                        alert.type === 'success'
                                            ? 'border-green-500 bg-green-50 text-green-800'
                                            : 'border-red-500 bg-red-50 text-red-800'
                                    }`}
                                >
                                    {alert.type === 'success' ? (
                                        <CheckCircle2 className="h-4 w-4 text-green-600 flex-shrink-0" />
                                    ) : (
                                        <AlertCircle className="h-4 w-4 text-red-600 flex-shrink-0" />
                                    )}
                                    <AlertDescription
                                        className={`text-sm font-medium whitespace-nowrap ${
                                            alert.type === 'success' ? 'text-green-800' : 'text-red-800'
                                        }`}
                                    >
                                        {alert.message}
                                    </AlertDescription>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className={`h-5 w-5 ml-1 rounded-full flex-shrink-0 ${
                                            alert.type === 'success'
                                                ? 'text-green-600 hover:text-green-700 hover:bg-green-100'
                                                : 'text-red-600 hover:text-red-700 hover:bg-red-100'
                                        }`}
                                        onClick={() => setAlert({ show: false, type: 'success', message: '' })}
                                    >
                                        <X className="h-3 w-3" />
                                    </Button>
                                </Alert>
                            )}

                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <Button variant="outline" onClick={() => navigate('/marketing/leads')}>
                                        <ArrowLeft className="h-4 w-4 mr-2" />
                                        Back to Leads
                                    </Button>
                                </TooltipTrigger>
                                <TooltipContent>Return to active leads</TooltipContent>
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
                            onFromDateChange={(date) => { setFromDate(date); resetPage(); }}
                            onToDateChange={(date) => { setToDate(date); resetPage(); }}
                            onRangeChange={() => resetPage()}
                            leftElement={
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <div className="relative">
                                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                                            <Input
                                                placeholder="Search archived leads..."
                                                value={q}
                                                onChange={(e) => { setQ(e.target.value); resetPage(); }}
                                                className="pl-10 w-[240px]"
                                            />
                                        </div>
                                    </TooltipTrigger>
                                    <TooltipContent>Search by name or email</TooltipContent>
                                </Tooltip>
                            }
                            rightElement={
                                <>
                                    {(q || fromDate || toDate) && (
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
                                    <TableHead>Email</TableHead>
                                    <TableHead>Source</TableHead>
                                    <TableHead>Archived At</TableHead>
                                    <TableHead className="text-center">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {loading ? (
                                    Array.from({ length: 5 }).map((_, i) => (
                                        <TableRow key={i}>
                                            <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                                            <TableCell><Skeleton className="h-4 w-40" /></TableCell>
                                            <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                                            <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                                            <TableCell><Skeleton className="h-4 w-16 ml-auto" /></TableCell>
                                        </TableRow>
                                    ))
                                ) : paged.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={5} className="h-32 text-center text-gray-500">
                                            No archived leads found.
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    paged.map((lead) => (
                                        <Tooltip key={lead.id}>
                                            <TooltipTrigger asChild>
                                                <TableRow
                                                    className="cursor-pointer"
                                                    onClick={() => openViewModal(lead)}
                                                >
                                                    <TableCell className="font-medium">
                                                        {lead.firstName} {lead.lastName}
                                                    </TableCell>
                                                    <TableCell className="text-gray-600">{lead.email}</TableCell>
                                                    <TableCell className="text-gray-600">{lead.source}</TableCell>
                                                    <TableCell className="text-gray-600">
                                                        {new Date(lead.updatedAt).toLocaleDateString()}
                                                    </TableCell>
                                                    <TableCell className="text-center">
                                                        <div className="flex items-center justify-center gap-1">
                                                            <PermissionGate permission="RestoreLeads">
                                                            <Tooltip>
                                                                <TooltipTrigger asChild>
                                                                    <Button
                                                                        variant="ghost"
                                                                        size="icon"
                                                                        onClick={(e) => {
                                                                            e.stopPropagation();
                                                                            openRestoreModal(lead);
                                                                        }}
                                                                        className="text-green-600 hover:text-green-700 hover:bg-green-100"
                                                                    >
                                                                        <RotateCcw className="h-4 w-4" />
                                                                    </Button>
                                                                </TooltipTrigger>
                                                                <TooltipContent>Restore lead</TooltipContent>
                                                            </Tooltip>
                                                            </PermissionGate>
                                                            <PermissionGate permission="PermanentDeleteLeads">
                                                            <Tooltip>
                                                                <TooltipTrigger asChild>
                                                                    <Button
                                                                        variant="ghost"
                                                                        size="icon"
                                                                        onClick={(e) => {
                                                                            e.stopPropagation();
                                                                            openDeleteModal(lead);
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
                                            <Button variant="outline" size="sm" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={safePage === 1}>
                                                Previous
                                            </Button>
                                        </TooltipTrigger>
                                        <TooltipContent>Go to previous page</TooltipContent>
                                    </Tooltip>
                                    <span className="text-sm text-gray-600">Page {safePage} of {totalPages}</span>
                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <Button variant="outline" size="sm" onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={safePage === totalPages}>
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
            <Dialog open={viewModal.open} onOpenChange={(open) => !open && setViewModal({ open: false, lead: null })}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>View Lead Details</DialogTitle>
                        <DialogDescription>
                            You are about to view the archived lead{' '}
                            <span className="font-semibold">
                                {viewModal.lead?.firstName} {viewModal.lead?.lastName}
                            </span>. Do you want to continue?
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setViewModal({ open: false, lead: null })}>
                            Cancel
                        </Button>
                        <Button onClick={confirmView}>View Details</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Restore Confirmation */}
            <AlertDialog open={restoreModal.open} onOpenChange={(open) => !open && setRestoreModal({ open: false, lead: null })}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Confirm Restore</AlertDialogTitle>
                        <AlertDialogDescription>
                            Are you sure you want to restore{' '}
                            <span className="font-semibold">
                                {restoreModal.lead?.firstName} {restoreModal.lead?.lastName}
                            </span>?
                            This will move the lead back to the active list.
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
            <AlertDialog open={deleteModal.open} onOpenChange={(open) => !open && setDeleteModal({ open: false, lead: null })}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Confirm Permanent Delete</AlertDialogTitle>
                        <AlertDialogDescription>
                            Are you sure you want to{' '}
                            <span className="font-semibold text-red-600">permanently delete</span>{' '}
                            <span className="font-semibold">
                                {deleteModal.lead?.firstName} {deleteModal.lead?.lastName}
                            </span>?
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
