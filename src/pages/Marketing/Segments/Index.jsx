import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { segmentService } from '../../../services/segmentService';
import { applyFilters, paginate } from '../../../utils/filterUtils';
import { TableIndexSkeleton } from '../../../utils/skeletonLoaders';
import AppLayout from '../../../layouts/AppLayout';
import DateRangeFilter from '../../../components/DateRangeFilter';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import { Plus, Pencil, Trash2, Archive, Search, X, AlertCircle, CheckCircle2 } from 'lucide-react';
import PermissionGate from '@/components/PermissionGate';

export default function SegmentsIndex() {
    const navigate = useNavigate();
    const location = useLocation();

    /* ------------------------------ api state ------------------------------ */
    const [segments, setSegments] = useState([]);
    const [loading, setLoading] = useState(true);
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
    const [deleteModal, setDeleteModal] = useState({ open: false, segment: null });
    const [viewModal, setViewModal] = useState({ open: false, segment: null });

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

    /* ------------------------------ api ------------------------------ */
    const loadSegments = async () => {
        setLoading(true);
        setError('');
        try {
            const res = await segmentService.getAll({ pageNumber: 1, pageSize: 100 });
            setSegments(res.data?.items || []);
        } catch (err) {
            setError(err.message || 'Failed to load segments');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadSegments();
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

    /* ------------------------------ actions ------------------------------ */
    const openDeleteModal = (segment) => setDeleteModal({ open: true, segment });
    const openViewModal = (segment) => setViewModal({ open: true, segment });

    const confirmDelete = async () => {
        const segment = deleteModal.segment;
        setDeleteModal({ open: false, segment: null });
        if (!segment) return;
        try {
            await segmentService.delete(segment.id);
            setSegments((prev) => prev.filter((x) => x.id !== segment.id));
            setAlert({ show: true, type: 'success', message: `Segment "${segment.name}" archived successfully!` });
        } catch (err) {
            setAlert({ show: true, type: 'error', message: err.response?.data?.message || 'Failed to archive segment' });
        }
    };

    const confirmView = () => {
        if (viewModal.segment) {
            navigate(`/marketing/segments/${viewModal.segment.id}`);
        }
        setViewModal({ open: false, segment: null });
    };

    /* ------------------------- filtering ------------------------- */
    const filtered = useMemo(() => {
        let result = applyFilters(segments, {
            search: q,
            searchFields: ['name', 'type', 'description'],
            fromDate,
            toDate,
            dateField: 'createdAt',
        });

        if (status !== 'all') {
            const isActiveValue = status === 'active';
            result = result.filter((s) => s.isActive === isActiveValue);
        }

        return result;
    }, [segments, q, fromDate, toDate, status]);

    const paginationResult = useMemo(() => paginate(filtered, page, pageSize), [filtered, page, pageSize]);
    const { data: paged, total, totalPages, page: safePage } = paginationResult;

    useEffect(() => {
        if (page > totalPages) setPage(totalPages);
    }, [totalPages, page]);

    return (
        <AppLayout title="Segments">
            {loading ? (
                <TableIndexSkeleton
                    columns={5}
                    rows={10}
                    headers={['Name', 'Status', 'Type', 'Created At', 'Actions']}
                />
            ) : (
                <div className="space-y-6">
                    {/* Header */}
                    <div className="flex items-start justify-between gap-4">
                        <div>
                            <h1 className="text-3xl font-bold text-gray-900">Segments</h1>
                            <p className="mt-1 text-sm text-gray-600">Manage audience segments for campaigns</p>
                        </div>
                        <div className="flex items-center gap-4">
                            {alert.show && (
                                <Alert
                                    className={`flex items-center gap-2 py-2 px-4 animate-in fade-in slide-in-from-right-4 duration-300 ${alert.type === 'success'
                                        ? 'border-green-500 bg-green-50 text-green-800'
                                        : 'border-red-500 bg-red-50 text-red-800'
                                        }`}
                                >
                                    {alert.type === 'success' ? (
                                        <CheckCircle2 className="h-4 w-4 text-green-600 flex-shrink-0" />
                                    ) : (
                                        <AlertCircle className="h-4 w-4 text-red-600 flex-shrink-0" />
                                    )}
                                    <AlertDescription className={`text-sm whitespace-nowrap ${alert.type === 'success' ? 'text-green-800' : 'text-red-800'}`}>
                                        {alert.message}
                                    </AlertDescription>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className={`h-5 w-5 ml-1 flex-shrink-0 ${alert.type === 'success'
                                            ? 'text-green-600 hover:text-green-700 hover:bg-green-100'
                                            : 'text-red-600 hover:text-red-700 hover:bg-red-100'
                                            }`}
                                        onClick={() => setAlert({ show: false, type: 'success', message: '' })}
                                    >
                                        <X className="h-3 w-3" />
                                    </Button>
                                </Alert>
                            )}

                            <PermissionGate permission="CreateSegments">
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <Button onClick={() => navigate('/marketing/segments/create')} disabled={loading}>
                                        <Plus className="h-4 w-4 mr-2" />
                                        New Segment
                                    </Button>
                                </TooltipTrigger>
                                <TooltipContent>Create a new segment</TooltipContent>
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
                                                placeholder="Search segments..."
                                                value={q}
                                                onChange={(e) => { setQ(e.target.value); resetPage(); }}
                                                className="pl-10 w-[240px]"
                                            />
                                        </div>
                                    </TooltipTrigger>
                                    <TooltipContent>Search by name, type, or description</TooltipContent>
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

                                    <PermissionGate permission="ArchiveSegments">
                                    <div className="ml-auto">
                                        <Tooltip>
                                            <TooltipTrigger asChild>
                                                <Button variant="outline" onClick={() => navigate('/marketing/segments/archive')}>
                                                    <Archive className="h-4 w-4 mr-2" />
                                                    Archive
                                                </Button>
                                            </TooltipTrigger>
                                            <TooltipContent>View archived segments</TooltipContent>
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
                                    <TableHead>Status</TableHead>
                                    <TableHead>Type</TableHead>
                                    <TableHead>Created At</TableHead>
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
                                            No segments found.
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    paged.map((seg) => (
                                        <Tooltip key={seg.id}>
                                            <TooltipTrigger asChild>
                                                <TableRow
                                                    className="cursor-pointer"
                                                    onClick={() => openViewModal(seg)}
                                                >
                                                    <TableCell className="font-medium">{seg.name}</TableCell>
                                                    <TableCell>
                                                        <div className="flex items-center gap-1.5">
                                                            {seg.isActive ? (
                                                                <span className="text-sm font-medium text-green-700">Active</span>
                                                            ) : (
                                                                <span className="text-sm font-medium text-gray-500">Inactive</span>
                                                            )}
                                                        </div>
                                                    </TableCell>
                                                    <TableCell className="text-gray-600">{seg.type}</TableCell>
                                                    <TableCell className="text-gray-600">
                                                        {new Date(seg.createdAt).toLocaleDateString()}
                                                    </TableCell>
                                                    <TableCell className="text-center">
                                                        <div className="flex items-center justify-center gap-1">
                                                            <PermissionGate permission="UpdateSegments">
                                                            <Tooltip>
                                                                <TooltipTrigger asChild>
                                                                    <Button
                                                                        variant="ghost"
                                                                        size="icon"
                                                                        onClick={(e) => {
                                                                            e.stopPropagation();
                                                                            navigate(`/marketing/segments/${seg.id}/edit`);
                                                                        }}
                                                                    >
                                                                        <Pencil className="h-4 w-4" />
                                                                    </Button>
                                                                </TooltipTrigger>
                                                                <TooltipContent>Edit segment</TooltipContent>
                                                            </Tooltip>
                                                            </PermissionGate>
                                                            <PermissionGate permission="DeleteSegments">
                                                            <Tooltip>
                                                                <TooltipTrigger asChild>
                                                                    <Button
                                                                        variant="ghost"
                                                                        size="icon"
                                                                        onClick={(e) => {
                                                                            e.stopPropagation();
                                                                            openDeleteModal(seg);
                                                                        }}
                                                                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                                                    >
                                                                        <Trash2 className="h-4 w-4" />
                                                                    </Button>
                                                                </TooltipTrigger>
                                                                <TooltipContent>Archive segment</TooltipContent>
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

            {/* Delete Confirmation */}
            <AlertDialog open={deleteModal.open} onOpenChange={(open) => !open && setDeleteModal({ open: false, segment: null })}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Confirm Archive</AlertDialogTitle>
                        <AlertDialogDescription>
                            Are you sure you want to archive the segment{' '}
                            <span className="font-semibold">"{deleteModal.segment?.name}"</span>?
                            It will be moved to the archive list.
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
            <Dialog open={viewModal.open} onOpenChange={(open) => !open && setViewModal({ open: false, segment: null })}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>View Segment</DialogTitle>
                        <DialogDescription>
                            Would you like to view the details of{' '}
                            <span className="font-semibold">{viewModal.segment?.name}</span>?
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setViewModal({ open: false, segment: null })}>
                            Cancel
                        </Button>
                        <Button onClick={confirmView}>View Details</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </AppLayout>
    );
}
