import { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { suppressionService } from '../../../services/suppressionService';
import { applyFilters, paginate } from '../../../utils/filterUtils';
import { TableIndexSkeleton } from '../../../utils/skeletonLoaders';
import AppLayout from '../../../layouts/AppLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Search, X, AlertCircle, CheckCircle2, Trash2 } from 'lucide-react';

export default function SuppressionsIndex() {
    const location = useLocation();
    const navigate = useNavigate();

    const [suppressions, setSuppressions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const [q, setQ] = useState('');
    const [page, setPage] = useState(1);
    const pageSize = 10;

    const [alert, setAlert] = useState({ show: false, type: 'success', message: '' });
    const [viewModal, setViewModal] = useState({ open: false, suppression: null });

    const resetPage = () => setPage(1);

    const loadSuppressions = async () => {
        setLoading(true);
        setError('');
        try {
            const res = await suppressionService.getAll({ pageNumber: 1, pageSize: 100 });
            setSuppressions(res.data?.items || []);
        } catch (err) {
            setError(err.message || 'Failed to load suppressions');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadSuppressions();
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


    const filtered = useMemo(() =>
        applyFilters(suppressions, {
            search: q,
            searchFields: ['email', 'reason', 'source'],
        }),
        [suppressions, q]
    );

    const paginationResult = useMemo(() => paginate(filtered, page, pageSize), [filtered, page, pageSize]);
    const { data: paged, total, totalPages, page: safePage } = paginationResult;

    useEffect(() => {
        if (page > totalPages) setPage(totalPages);
    }, [totalPages, page]);

    const confirmView = () => {
        if (viewModal.suppression) navigate(`/marketing/suppressions/${viewModal.suppression.id}`);
        setViewModal({ open: false, suppression: null });
    };

    return (
        <AppLayout title="Suppressions">
            {loading ? (
                <TableIndexSkeleton
                    columns={5}
                    rows={10}
                    headers={['Email', 'Reason', 'Notes', 'Date', 'Source', 'Actions']}
                />
            ) : (
                <div className="space-y-6">
                    {/* Header */}
                    <div className="flex items-start justify-between gap-4">
                        <div>
                            <h1 className="text-3xl font-bold text-gray-900">Suppressions</h1>
                            <p className="mt-1 text-sm text-gray-600">
                                Emails automatically excluded from marketing messages. Suppressions are added by the system when emails bounce, users unsubscribe, or spam is reported.
                            </p>
                        </div>
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
                    </div>

                    {error && (
                        <Alert variant="destructive">
                            <AlertCircle className="h-4 w-4" />
                            <AlertDescription>{error}</AlertDescription>
                        </Alert>
                    )}

                    {/* Filters */}
                    <div className="flex items-center gap-3 flex-wrap">
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <div className="relative">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                                    <Input
                                        placeholder="Search email..."
                                        value={q}
                                        onChange={(e) => { setQ(e.target.value); resetPage(); }}
                                        className="pl-10 w-[240px]"
                                    />
                                </div>
                            </TooltipTrigger>
                            <TooltipContent>Search by email, reason, or source</TooltipContent>
                        </Tooltip>

                        {q && (
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => { setQ(''); resetPage(); }}
                                    >
                                        Clear
                                    </Button>
                                </TooltipTrigger>
                                <TooltipContent>Clear search</TooltipContent>
                            </Tooltip>
                        )}
                    </div>

                    {/* Table */}
                    <div className="border rounded-lg overflow-hidden bg-white">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Email</TableHead>
                                    <TableHead>Reason</TableHead>
                                    <TableHead>Notes</TableHead>
                                    <TableHead className="text-center">Date</TableHead>
                                    <TableHead>Source</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {paged.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={5} className="h-32 text-center text-gray-500">
                                            No suppressions found.
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    paged.map((s) => (
                                        <TableRow
                                            key={s.id}
                                            className="cursor-pointer hover:bg-gray-50"
                                            onClick={() => setViewModal({ open: true, suppression: s })}
                                        >
                                            <TableCell className="font-medium font-mono text-sm">{s.email}</TableCell>
                                            <TableCell className="text-gray-600">{s.reason}</TableCell>
                                            <TableCell className="text-gray-500 text-sm max-w-xs truncate">
                                                {s.notes || '—'}
                                            </TableCell>
                                            <TableCell className="text-center text-gray-600 text-sm">
                                                {new Date(s.createdAt).toLocaleDateString()}
                                            </TableCell>
                                            <TableCell className="text-gray-600">
                                                <div className="inline-grid place-items-center">
                                                    <span className="col-start-1 row-start-1 text-sm whitespace-nowrap">
                                                        {s.source}
                                                    </span>
                                                    <div className="col-start-1 row-start-1 flex items-center justify-center gap-1 invisible select-none">
                                                        <Button variant="ghost" size="icon"><Trash2 className="h-4 w-4" /></Button>
                                                    </div>
                                                </div>
                                            </TableCell>
                                        </TableRow>
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

            {/* View Confirmation */}
            <Dialog open={viewModal.open} onOpenChange={(open) => !open && setViewModal({ open: false, suppression: null })}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>View Suppression</DialogTitle>
                        <DialogDescription>
                            Would you like to view the details of{' '}
                            <span className="font-semibold">{viewModal.suppression?.email}</span>?
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setViewModal({ open: false, suppression: null })}>
                            Cancel
                        </Button>
                        <Button onClick={confirmView}>View Details</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </AppLayout>
    );
}
