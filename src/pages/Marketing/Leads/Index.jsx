import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { leadService } from '../../../services/leadService';
import { applyFilters, paginate } from '../../../utils/filterUtils';
import { TableIndexSkeleton } from '../../../utils/skeletonLoaders';
import AppLayout from '../../../layouts/AppLayout';
import DateRangeFilter from '../../../components/DateRangeFilter';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Plus, Pencil, Trash2, Archive, Search, X, AlertCircle, CheckCircle2 } from 'lucide-react';
import PermissionGate from '@/components/PermissionGate';

export default function LeadsIndex() {
    const navigate = useNavigate();
    const location = useLocation();

    const [leads, setLeads] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const [q, setQ] = useState('');
    const [fromDate, setFromDate] = useState(undefined);
    const [toDate, setToDate] = useState(undefined);
    const [sourceFilter, setSourceFilter] = useState('all');
    const [page, setPage] = useState(1);
    const pageSize = 10;

    const [deleteModal, setDeleteModal] = useState({ open: false, lead: null });
    const [viewModal, setViewModal] = useState({ open: false, lead: null });
    const [alert, setAlert] = useState({ show: false, type: 'success', message: '' });

    const resetPage = () => setPage(1);

    const loadLeads = async () => {
        setLoading(true);
        setError('');
        try {
            const res = await leadService.getAll({ pageNumber: 1, pageSize: 100 });
            setLeads(res.data?.items || []);
        } catch (err) {
            setError(err.message || 'Failed to load leads');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadLeads();
    }, []);

    useEffect(() => {
        if (location.state?.alert) {
            setAlert({
                show: true,
                type: location.state.alert.type,
                message: location.state.alert.message,
            });
            window.history.replaceState({}, document.title);
        }
    }, [location]);

    useEffect(() => {
        if (alert.show) {
            const t = setTimeout(() => setAlert({ show: false, type: 'success', message: '' }), 3000);
            return () => clearTimeout(t);
        }
    }, [alert.show]);

    const openDeleteModal = (lead) => setDeleteModal({ open: true, lead });
    const openViewModal = (lead) => setViewModal({ open: true, lead });

    const confirmDelete = async () => {
        const lead = deleteModal.lead;
        setDeleteModal({ open: false, lead: null });
        if (!lead) return;
        try {
            await leadService.delete(lead.id);
            setLeads((prev) => prev.filter((x) => x.id !== lead.id));
            setAlert({ show: true, type: 'success', message: `Lead "${lead.firstName} ${lead.lastName}" archived successfully!` });
        } catch (err) {
            setAlert({ show: true, type: 'error', message: err.response?.data?.message || 'Failed to archive lead' });
        }
    };

    const confirmView = () => {
        if (viewModal.lead) {
            navigate(`/marketing/leads/${viewModal.lead.id}`);
        }
        setViewModal({ open: false, lead: null });
    };

    const filtered = useMemo(() => {
        let result = applyFilters(leads, {
            search: q,
            searchFields: ['firstName', 'lastName', 'email'],
            fromDate,
            toDate,
            dateField: 'createdAt',
        });
        if (sourceFilter !== 'all') {
            result = result.filter((l) => l.source === sourceFilter);
        }
        return result;
    }, [leads, q, fromDate, toDate, sourceFilter]);

    const paginationResult = useMemo(() => paginate(filtered, page, pageSize), [filtered, page, pageSize]);
    const { data: paged, total, totalPages, page: safePage } = paginationResult;

    useEffect(() => {
        if (page > totalPages) setPage(totalPages);
    }, [totalPages, page]);

    return (
        <AppLayout title="Leads">
            {loading ? (
                <TableIndexSkeleton
                    columns={5}
                    rows={10}
                    headers={['Name', 'Email', 'Source', 'Created At', 'Actions']}
                />
            ) : (
                <div className="space-y-6">
                    {/* Header */}
                    <div className="flex items-start justify-between gap-4">
                        <div>
                            <h1 className="text-3xl font-bold text-gray-900">Leads</h1>
                            <p className="mt-1 text-sm text-gray-600">Manage and track marketing leads</p>
                        </div>
                        <div className="flex items-center gap-4">
                            {alert.show && (
                                <Alert
                                    className={`flex items-center gap-2 py-2 px-4 animate-in fade-in slide-in-from-right-4 duration-300 ${
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
                                        className={`text-sm whitespace-nowrap ${
                                            alert.type === 'success' ? 'text-green-800' : 'text-red-800'
                                        }`}
                                    >
                                        {alert.message}
                                    </AlertDescription>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className={`h-5 w-5 ml-1 flex-shrink-0 ${
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
                            <PermissionGate permission="CreateLeads">
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <Button onClick={() => navigate('/marketing/leads/create')}>
                                        <Plus className="h-4 w-4 mr-2" />
                                        New Lead
                                    </Button>
                                </TooltipTrigger>
                                <TooltipContent>Create a new lead</TooltipContent>
                            </Tooltip>
                            </PermissionGate>
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
                                                placeholder="Search leads..."
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
                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <div>
                                                <Select value={sourceFilter} onValueChange={(v) => { setSourceFilter(v); resetPage(); }}>
                                                    <SelectTrigger className="w-[180px]">
                                                        <SelectValue placeholder="All Sources" />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="all">All Sources</SelectItem>
                                                        <SelectItem value="Manual">Manual</SelectItem>
                                                        <SelectItem value="Registration">Registration</SelectItem>
                                                        <SelectItem value="Import">Import</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                        </TooltipTrigger>
                                        <TooltipContent>Filter by source</TooltipContent>
                                    </Tooltip>

                                    {(q || fromDate || toDate || sourceFilter !== 'all') && (
                                        <Tooltip>
                                            <TooltipTrigger asChild>
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => { setQ(''); setFromDate(undefined); setToDate(undefined); setSourceFilter('all'); resetPage(); }}
                                                >
                                                    Clear
                                                </Button>
                                            </TooltipTrigger>
                                            <TooltipContent>Clear all filters</TooltipContent>
                                        </Tooltip>
                                    )}

                                    <PermissionGate permission="ArchiveLeads">
                                    <div className="ml-auto">
                                        <Tooltip>
                                            <TooltipTrigger asChild>
                                                <Button variant="outline" onClick={() => navigate('/marketing/leads/archive')}>
                                                    <Archive className="h-4 w-4 mr-2" />
                                                    Archive
                                                </Button>
                                            </TooltipTrigger>
                                            <TooltipContent>View archived leads</TooltipContent>
                                        </Tooltip>
                                    </div>
                                    </PermissionGate>
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
                                    <TableHead className="text-center">Created At</TableHead>
                                    <TableHead className="text-center">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {paged.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={5} className="h-32 text-center text-gray-500">
                                            No leads found.
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
                                                    <TableCell className="text-gray-600 text-center">
                                                        {new Date(lead.createdAt).toLocaleDateString()}
                                                    </TableCell>
                                                    <TableCell className="text-center">
                                                        <div className="flex items-center justify-center gap-1">
                                                            <PermissionGate permission="UpdateLeads">
                                                            <Tooltip>
                                                                <TooltipTrigger asChild>
                                                                    <Button
                                                                        variant="ghost"
                                                                        size="icon"
                                                                        onClick={(e) => {
                                                                            e.stopPropagation();
                                                                            navigate(`/marketing/leads/${lead.id}/edit`);
                                                                        }}
                                                                    >
                                                                        <Pencil className="h-4 w-4" />
                                                                    </Button>
                                                                </TooltipTrigger>
                                                                <TooltipContent>Edit lead</TooltipContent>
                                                            </Tooltip>
                                                            </PermissionGate>
                                                            <PermissionGate permission="DeleteLeads">
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
                                                                <TooltipContent>Archive lead</TooltipContent>
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

                        {paged.length > 0 && (
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
                                                onClick={() => setPage((p) => Math.max(1, p - 1))}
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
                                                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
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

            {/* Delete Confirmation */}
            <AlertDialog
                open={deleteModal.open}
                onOpenChange={(open) => !open && setDeleteModal({ open: false, lead: null })}
            >
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Confirm Archive</AlertDialogTitle>
                        <AlertDialogDescription>
                            Archive lead{' '}
                            <span className="font-semibold">
                                '{deleteModal.lead?.firstName} {deleteModal.lead?.lastName}'
                            </span>
                            ? It will be moved to the archive list.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={confirmDelete} className="bg-red-600 hover:bg-red-700">
                            Archive
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            {/* View Confirmation */}
            <Dialog
                open={viewModal.open}
                onOpenChange={(open) => !open && setViewModal({ open: false, lead: null })}
            >
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>View Lead</DialogTitle>
                        <DialogDescription>
                            Would you like to view the details of{' '}
                            <span className="font-semibold">
                                {viewModal.lead?.firstName} {viewModal.lead?.lastName}
                            </span>
                            ?
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
        </AppLayout>
    );
}
