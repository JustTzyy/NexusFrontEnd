import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { automationService } from '../../../services/automationService';
import { TableIndexSkeleton } from '../../../utils/skeletonLoaders';
import AppLayout from '../../../layouts/AppLayout';
import { applyFilters, paginate } from '../../../utils/filterUtils';
import DateRangeFilter from '../../../components/DateRangeFilter';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import { RotateCcw, Trash2, Search, X, AlertCircle, CheckCircle2, ArrowLeft } from 'lucide-react';
import PermissionGate from '@/components/PermissionGate';

const TRIGGER_LABELS = {
    LeadCreated: 'Lead Created',
    LeadConverted: 'Lead Converted',
    SessionBooked: 'Session Booked',
    SessionConfirmed: 'Session Confirmed',
    SessionReminder: 'Session Reminder',
    LeadStatusChanged: 'Lead Status Changed',
};

export default function AutomationRulesArchive() {
    const navigate = useNavigate();

    /* ------------------------------ api state ------------------------------ */
    const [rules, setRules] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    /* ---------------------------- filter state ---------------------------- */
    const [q, setQ] = useState('');
    const [fromDate, setFromDate] = useState(undefined);
    const [toDate, setToDate] = useState(undefined);
    const [statusFilter, setStatusFilter] = useState('all');

    /* -------------------------- pagination state -------------------------- */
    const [page, setPage] = useState(1);
    const pageSize = 10;

    /* -------------------------- modal state -------------------------- */
    const [viewModal, setViewModal] = useState({ open: false, rule: null });
    const [restoreModal, setRestoreModal] = useState({ open: false, rule: null });
    const [deleteModal, setDeleteModal] = useState({ open: false, rule: null });

    /* -------------------------- alert state -------------------------- */
    const [alert, setAlert] = useState({ show: false, type: 'success', message: '' });

    const resetPage = () => setPage(1);

    const clearFilters = () => {
        setQ('');
        setFromDate(undefined);
        setToDate(undefined);
        setStatusFilter('all');
        setPage(1);
    };

    const goBack = () => navigate('/marketing/automation-rules');

    /* ------------------------------ api ------------------------------ */
    const loadArchivedRules = async () => {
        setLoading(true);
        setError('');
        try {
            const response = await automationService.getArchived({ pageNumber: 1, pageSize: 100 });
            const data = response.data?.items || [];
            const mappedData = data.map((r) => ({
                id: r.id,
                name: r.name,
                triggerType: r.triggerType,
                isActive: r.isActive,
                deletedAt: new Date(r.updatedAt).toLocaleDateString(),
            }));
            setRules(mappedData);
        } catch (err) {
            setError(err.response?.data?.message || err.message || 'Failed to load archived rules');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadArchivedRules();
    }, []);

    useEffect(() => {
        if (alert.show) {
            const timer = setTimeout(() => setAlert({ show: false, type: 'success', message: '' }), 3000);
            return () => clearTimeout(timer);
        }
    }, [alert.show]);

    /* ------------------------------ actions ------------------------------ */
    const openViewModal = (r) => setViewModal({ open: true, rule: r });
    const openRestoreModal = (r) => setRestoreModal({ open: true, rule: r });
    const openDeleteModal = (r) => setDeleteModal({ open: true, rule: r });

    const confirmView = () => {
        if (viewModal.rule) {
            navigate(`/marketing/automation-rules/${viewModal.rule.id}`, { state: { from: 'archive' } });
        }
        setViewModal({ open: false, rule: null });
    };

    const confirmRestore = async () => {
        const r = restoreModal.rule;
        if (!r) return;
        setRestoreModal({ open: false, rule: null });
        try {
            await automationService.restore(r.id);
            setRules((prev) => prev.filter((item) => item.id !== r.id));
            setAlert({ show: true, type: 'success', message: `Rule "${r.name}" restored successfully!` });
        } catch (err) {
            setAlert({ show: true, type: 'error', message: err.response?.data?.message || 'Failed to restore rule' });
        }
    };

    const confirmDelete = async () => {
        const r = deleteModal.rule;
        if (!r) return;
        setDeleteModal({ open: false, rule: null });
        try {
            await automationService.permanentDelete(r.id);
            setRules((prev) => prev.filter((item) => item.id !== r.id));
            setAlert({ show: true, type: 'success', message: `Rule "${r.name}" permanently deleted!` });
        } catch (err) {
            setAlert({ show: true, type: 'error', message: err.response?.data?.message || 'Failed to delete rule' });
        }
    };

    /* ------------------------- filtering ------------------------- */
    const filtered = useMemo(() => {
        let result = applyFilters(rules, {
            search: q,
            searchFields: ['name', 'triggerType'],
            fromDate,
            toDate,
            dateField: 'deletedAt',
        });
        if (statusFilter !== 'all') {
            const isActiveValue = statusFilter === 'active';
            result = result.filter((r) => r.isActive === isActiveValue);
        }
        return result;
    }, [rules, q, fromDate, toDate, statusFilter]);

    const paginationResult = useMemo(() => paginate(filtered, page, pageSize), [filtered, page, pageSize]);
    const { data: paged, total, totalPages, page: safePage } = paginationResult;

    useEffect(() => {
        if (page > totalPages) setPage(totalPages);
    }, [totalPages, page]);

    return (
        <AppLayout title="Archived Automation Rules">
            {loading ? (
                <TableIndexSkeleton
                    columns={5}
                    rows={10}
                    headers={['Name', 'Status', 'Trigger', 'Deleted At', 'Actions']}
                />
            ) : (
                <div className="space-y-6">
                    {/* Header */}
                    <div className="flex items-start justify-between gap-4">
                        <div>
                            <h1 className="text-3xl font-bold text-gray-900">Archived Automation Rules</h1>
                            <p className="mt-1 text-sm text-gray-600">View and manage archived automation rules</p>
                        </div>
                        <div className="flex items-center gap-4">
                            {alert.show && (
                                <Alert
                                    className={`flex items-center gap-2 py-2 px-4 w-fit rounded-full animate-in fade-in slide-in-from-right-4 duration-300 ${alert.type === 'success'
                                        ? 'border-green-500 bg-green-50 text-green-800'
                                        : 'border-red-500 bg-red-50 text-red-800'
                                        }`}
                                >
                                    {alert.type === 'success' ? (
                                        <CheckCircle2 className="h-4 w-4 text-green-600 flex-shrink-0" />
                                    ) : (
                                        <AlertCircle className="h-4 w-4 text-red-600 flex-shrink-0" />
                                    )}
                                    <AlertDescription className={`text-sm font-medium whitespace-nowrap ${alert.type === 'success' ? 'text-green-800' : 'text-red-800'}`}>
                                        {alert.message}
                                    </AlertDescription>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className={`h-5 w-5 ml-1 rounded-full flex-shrink-0 ${alert.type === 'success'
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
                                    <Button variant="outline" onClick={goBack}>
                                        <ArrowLeft className="h-4 w-4 mr-2" />
                                        Back to Rules
                                    </Button>
                                </TooltipTrigger>
                                <TooltipContent>Return to active rules</TooltipContent>
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
                                                placeholder="Search archived rules..."
                                                value={q}
                                                onChange={(e) => { setQ(e.target.value); resetPage(); }}
                                                className="pl-10 w-[240px]"
                                            />
                                        </div>
                                    </TooltipTrigger>
                                    <TooltipContent>Search by name or trigger</TooltipContent>
                                </Tooltip>
                            }
                            rightElement={
                                <>
                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <div>
                                                <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); resetPage(); }}>
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

                                    {(q || fromDate || toDate || statusFilter !== 'all') && (
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
                                    <TableHead>Status</TableHead>
                                    <TableHead>Trigger</TableHead>
                                    <TableHead>Deleted At</TableHead>
                                    <TableHead className="text-center">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {loading ? (
                                    Array.from({ length: 5 }).map((_, i) => (
                                        <TableRow key={i}>
                                            <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                                            <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                                            <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                                            <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                                            <TableCell><Skeleton className="h-4 w-16 ml-auto" /></TableCell>
                                        </TableRow>
                                    ))
                                ) : paged.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={5} className="h-32 text-center text-gray-500">
                                            No archived rules found.
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    paged.map((rule) => (
                                        <Tooltip key={rule.id}>
                                            <TooltipTrigger asChild>
                                                <TableRow
                                                    className="cursor-pointer"
                                                    onClick={() => openViewModal(rule)}
                                                >
                                                    <TableCell className="font-medium">{rule.name}</TableCell>
                                                    <TableCell>
                                                        {rule.isActive ? (
                                                            <span className="text-sm font-medium text-green-700">Active</span>
                                                        ) : (
                                                            <span className="text-sm font-medium text-gray-500">Inactive</span>
                                                        )}
                                                    </TableCell>
                                                    <TableCell>
                                                        <span className="text-sm bg-blue-50 text-blue-700 px-2 py-0.5 rounded font-medium">
                                                            {TRIGGER_LABELS[rule.triggerType] || rule.triggerType}
                                                        </span>
                                                    </TableCell>
                                                    <TableCell className="text-gray-600">{rule.deletedAt}</TableCell>
                                                    <TableCell className="text-center">
                                                        <div className="flex items-center justify-center gap-1">
                                                            <PermissionGate permission="RestoreAutomationRules">
                                                            <Tooltip>
                                                                <TooltipTrigger asChild>
                                                                    <Button
                                                                        variant="ghost"
                                                                        size="icon"
                                                                        onClick={(e) => {
                                                                            e.stopPropagation();
                                                                            openRestoreModal(rule);
                                                                        }}
                                                                        className="text-green-600 hover:text-green-700 hover:bg-green-100"
                                                                    >
                                                                        <RotateCcw className="h-4 w-4" />
                                                                    </Button>
                                                                </TooltipTrigger>
                                                                <TooltipContent>Restore rule</TooltipContent>
                                                            </Tooltip>
                                                            </PermissionGate>
                                                            <PermissionGate permission="PermanentDeleteAutomationRules">
                                                            <Tooltip>
                                                                <TooltipTrigger asChild>
                                                                    <Button
                                                                        variant="ghost"
                                                                        size="icon"
                                                                        onClick={(e) => {
                                                                            e.stopPropagation();
                                                                            openDeleteModal(rule);
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
            <Dialog open={viewModal.open} onOpenChange={(open) => !open && setViewModal({ open: false, rule: null })}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>View Rule Details</DialogTitle>
                        <DialogDescription>
                            You are about to view the archived rule{' '}
                            <span className="font-semibold">{viewModal.rule?.name}</span>. Do you want to continue?
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setViewModal({ open: false, rule: null })}>
                            Cancel
                        </Button>
                        <Button onClick={confirmView}>View Details</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Restore Confirmation */}
            <AlertDialog open={restoreModal.open} onOpenChange={(open) => !open && setRestoreModal({ open: false, rule: null })}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Confirm Restore</AlertDialogTitle>
                        <AlertDialogDescription>
                            Are you sure you want to restore the rule{' '}
                            <span className="font-semibold">{restoreModal.rule?.name}</span>?
                            This will move it back to the active rules list.
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
            <AlertDialog open={deleteModal.open} onOpenChange={(open) => !open && setDeleteModal({ open: false, rule: null })}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Confirm Permanent Delete</AlertDialogTitle>
                        <AlertDialogDescription>
                            Are you sure you want to <span className="font-semibold text-red-600">permanently delete</span> the rule{' '}
                            <span className="font-semibold">{deleteModal.rule?.name}</span>?
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
