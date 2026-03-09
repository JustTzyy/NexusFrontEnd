import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { emailTemplateService } from '../../../services/emailTemplateService';
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

export default function EmailTemplatesArchive() {
    const navigate = useNavigate();

    /* ------------------------------ api state ------------------------------ */
    const [templates, setTemplates] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    /* ---------------------------- filter state ---------------------------- */
    const [q, setQ] = useState('');
    const [fromDate, setFromDate] = useState(undefined);
    const [toDate, setToDate] = useState(undefined);
    const [status, setStatus] = useState('all');

    /* -------------------------- pagination state -------------------------- */
    const [page, setPage] = useState(1);
    const pageSize = 10;

    /* -------------------------- modal state -------------------------- */
    const [viewModal, setViewModal] = useState({ open: false, template: null });
    const [restoreModal, setRestoreModal] = useState({ open: false, template: null });
    const [deleteModal, setDeleteModal] = useState({ open: false, template: null });

    /* -------------------------- alert state -------------------------- */
    const [alert, setAlert] = useState({ show: false, type: 'success', message: '' });

    const resetPage = () => setPage(1);

    const clearFilters = () => {
        setQ('');
        setFromDate(undefined);
        setToDate(undefined);
        setStatus('all');
        setPage(1);
    };

    /* ------------------------------ routes ------------------------------ */
    const goBack = () => navigate('/marketing/email-templates');

    /* ------------------------------ api ------------------------------ */
    const loadArchivedTemplates = async () => {
        setLoading(true);
        setError('');
        try {
            const response = await emailTemplateService.getArchived({ pageNumber: 1, pageSize: 100 });
            const data = response.data?.items || [];
            const mappedData = data.map((t) => ({
                id: t.id,
                name: t.name,
                isActive: t.isActive,
                category: t.category || '—',
                deletedAt: new Date(t.updatedAt).toLocaleDateString(),
            }));
            setTemplates(mappedData);
        } catch (err) {
            setError(err.response?.data?.message || err.message || 'Failed to load archived templates');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadArchivedTemplates();
    }, []);

    useEffect(() => {
        if (alert.show) {
            const timer = setTimeout(() => {
                setAlert({ show: false, type: 'success', message: '' });
            }, 3000);
            return () => clearTimeout(timer);
        }
    }, [alert.show]);

    /* ------------------------------ actions ------------------------------ */
    const openViewModal = (t) => setViewModal({ open: true, template: t });
    const openRestoreModal = (t) => setRestoreModal({ open: true, template: t });
    const openDeleteModal = (t) => setDeleteModal({ open: true, template: t });

    const confirmView = () => {
        if (viewModal.template) {
            navigate(`/marketing/email-templates/${viewModal.template.id}`, { state: { from: 'archive' } });
        }
        setViewModal({ open: false, template: null });
    };

    const confirmRestore = async () => {
        const t = restoreModal.template;
        if (!t) return;
        setRestoreModal({ open: false, template: null });

        try {
            await emailTemplateService.restore(t.id);
            setTemplates((prev) => prev.filter((item) => item.id !== t.id));
            setAlert({ show: true, type: 'success', message: `Template "${t.name}" restored successfully!` });
        } catch (err) {
            setAlert({ show: true, type: 'error', message: err.response?.data?.message || 'Failed to restore template' });
        }
    };

    const confirmDelete = async () => {
        const t = deleteModal.template;
        if (!t) return;
        setDeleteModal({ open: false, template: null });

        try {
            await emailTemplateService.permanentDelete(t.id);
            setTemplates((prev) => prev.filter((item) => item.id !== t.id));
            setAlert({ show: true, type: 'success', message: `Template "${t.name}" permanently deleted!` });
        } catch (err) {
            setAlert({ show: true, type: 'error', message: err.response?.data?.message || 'Failed to delete template' });
        }
    };

    /* ------------------------- filtering ------------------------- */
    const filtered = useMemo(() => {
        let result = applyFilters(templates, {
            search: q,
            searchFields: ['name', 'category'],
            fromDate,
            toDate,
            dateField: 'deletedAt',
        });

        if (status !== 'all') {
            const isActiveValue = status === 'active';
            result = result.filter((t) => t.isActive === isActiveValue);
        }

        return result;
    }, [templates, q, fromDate, toDate, status]);

    const paginationResult = useMemo(() => {
        return paginate(filtered, page, pageSize);
    }, [filtered, page, pageSize]);

    const { data: paged, total, totalPages, page: safePage } = paginationResult;

    useEffect(() => {
        if (page > totalPages) setPage(totalPages);
    }, [totalPages, page]);

    return (
        <AppLayout title="Archived Email Templates">
            {loading ? (
                <TableIndexSkeleton
                    columns={5}
                    rows={10}
                    headers={['Name', 'Status', 'Category', 'Deleted At', 'Actions']}
                />
            ) : (
                <div className="space-y-6">
                    {/* Header */}
                    <div className="flex items-start justify-between gap-4">
                        <div>
                            <h1 className="text-3xl font-bold text-gray-900">Archived Email Templates</h1>
                            <p className="mt-1 text-sm text-gray-600">
                                View and manage soft-deleted email templates
                            </p>
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
                                        Back to Templates
                                    </Button>
                                </TooltipTrigger>
                                <TooltipContent>Return to active templates</TooltipContent>
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
                                                placeholder="Search archived templates..."
                                                value={q}
                                                onChange={(e) => {
                                                    setQ(e.target.value);
                                                    resetPage();
                                                }}
                                                className="pl-10 w-[240px]"
                                            />
                                        </div>
                                    </TooltipTrigger>
                                    <TooltipContent>Search by name or category</TooltipContent>
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

                                    {(q || fromDate || toDate || status !== 'all') && (
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
                                    <TableHead>Category</TableHead>
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
                                            No archived templates found.
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    paged.map((t) => (
                                        <Tooltip key={t.id}>
                                            <TooltipTrigger asChild>
                                                <TableRow
                                                    className="cursor-pointer"
                                                    onClick={() => openViewModal(t)}
                                                >
                                                    <TableCell className="font-medium">{t.name}</TableCell>
                                                    <TableCell>
                                                        <div className="flex items-center gap-1.5">
                                                            {t.isActive ? (
                                                                <span className="text-sm font-medium text-green-700">Active</span>
                                                            ) : (
                                                                <span className="text-sm font-medium text-gray-500">Inactive</span>
                                                            )}
                                                        </div>
                                                    </TableCell>
                                                    <TableCell className="text-gray-600">{t.category}</TableCell>
                                                    <TableCell className="text-gray-600">{t.deletedAt}</TableCell>
                                                    <TableCell className="text-center">
                                                        <div className="flex items-center justify-center gap-1">
                                                            <PermissionGate permission="RestoreEmailTemplates">
                                                            <Tooltip>
                                                                <TooltipTrigger asChild>
                                                                    <Button
                                                                        variant="ghost"
                                                                        size="icon"
                                                                        onClick={(e) => {
                                                                            e.stopPropagation();
                                                                            openRestoreModal(t);
                                                                        }}
                                                                        className="text-green-600 hover:text-green-700 hover:bg-green-100"
                                                                    >
                                                                        <RotateCcw className="h-4 w-4" />
                                                                    </Button>
                                                                </TooltipTrigger>
                                                                <TooltipContent>Restore template</TooltipContent>
                                                            </Tooltip>
                                                            </PermissionGate>
                                                            <PermissionGate permission="PermanentDeleteEmailTemplates">
                                                            <Tooltip>
                                                                <TooltipTrigger asChild>
                                                                    <Button
                                                                        variant="ghost"
                                                                        size="icon"
                                                                        onClick={(e) => {
                                                                            e.stopPropagation();
                                                                            openDeleteModal(t);
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

            {/* View Confirmation */}
            <Dialog open={viewModal.open} onOpenChange={(open) => !open && setViewModal({ open: false, template: null })}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>View Template Details</DialogTitle>
                        <DialogDescription>
                            You are about to view the archived template{' '}
                            <span className="font-semibold">{viewModal.template?.name}</span>. Do you want to
                            continue?
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setViewModal({ open: false, template: null })}>
                            Cancel
                        </Button>
                        <Button onClick={confirmView}>View Details</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Restore Confirmation */}
            <AlertDialog open={restoreModal.open} onOpenChange={(open) => !open && setRestoreModal({ open: false, template: null })}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Confirm Restore</AlertDialogTitle>
                        <AlertDialogDescription>
                            Are you sure you want to restore the template{' '}
                            <span className="font-semibold">{restoreModal.template?.name}</span>?
                            This will move it back to the active templates list.
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
            <AlertDialog open={deleteModal.open} onOpenChange={(open) => !open && setDeleteModal({ open: false, template: null })}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Confirm Permanent Delete</AlertDialogTitle>
                        <AlertDialogDescription>
                            Are you sure you want to <span className="font-semibold text-red-600">permanently delete</span> the template{' '}
                            <span className="font-semibold">{deleteModal.template?.name}</span>?
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
