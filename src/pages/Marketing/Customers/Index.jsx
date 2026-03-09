import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { customerService } from '../../../services/customerService';
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
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Search, AlertCircle, UserCheck, Pencil, Trash2 } from 'lucide-react';

export default function CustomersIndex() {
    const navigate = useNavigate();
    const location = useLocation();

    const [customers, setCustomers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const [q, setQ] = useState('');
    const [fromDate, setFromDate] = useState(undefined);
    const [toDate, setToDate] = useState(undefined);
    const [conversionFilter, setConversionFilter] = useState('all');
    const [page, setPage] = useState(1);
    const pageSize = 10;

    const [viewModal, setViewModal] = useState({ open: false, customer: null });

    const resetPage = () => setPage(1);

    const loadCustomers = async () => {
        setLoading(true);
        setError('');
        try {
            const res = await customerService.getAll({ pageNumber: 1, pageSize: 100 });
            setCustomers(res.data?.items || []);
        } catch (err) {
            setError(err.message || 'Failed to load customers');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadCustomers();
    }, []);

    const filtered = useMemo(() => {
        let result = applyFilters(customers, {
            search: q,
            searchFields: ['userFullName', 'userEmail'],
            fromDate,
            toDate,
            dateField: 'createdAt',
        });
        if (conversionFilter === 'lead') {
            result = result.filter((c) => c.leadId != null);
        } else if (conversionFilter === 'direct') {
            result = result.filter((c) => c.leadId == null);
        }
        return result;
    }, [customers, q, fromDate, toDate, conversionFilter]);

    const paginationResult = useMemo(() => paginate(filtered, page, pageSize), [filtered, page, pageSize]);
    const { data: paged, total, totalPages, page: safePage } = paginationResult;

    useEffect(() => {
        if (page > totalPages) setPage(totalPages);
    }, [totalPages, page]);

    return (
        <AppLayout title="Customers">
            {loading ? (
                <TableIndexSkeleton
                    columns={5}
                    rows={10}
                    headers={['Name', 'Email', 'Converted From', 'Created At', 'First Session']}
                    showAddButton={false}
                />
            ) : (
                <div className="space-y-6">
                    {/* Header */}
                    <div className="flex items-start justify-between gap-4">
                        <div>
                            <h1 className="text-3xl font-bold text-gray-900">Customers</h1>
                            <p className="mt-1 text-sm text-gray-600">
                                Converted leads who have enrolled in tutoring
                            </p>
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
                                                placeholder="Search customers..."
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
                                                <Select value={conversionFilter} onValueChange={(v) => { setConversionFilter(v); resetPage(); }}>
                                                    <SelectTrigger className="w-[180px]">
                                                        <SelectValue placeholder="All Conversions" />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="all">All Conversions</SelectItem>
                                                        <SelectItem value="lead">From Lead</SelectItem>
                                                        <SelectItem value="direct">Direct</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                        </TooltipTrigger>
                                        <TooltipContent>Filter by conversion type</TooltipContent>
                                    </Tooltip>

                                    {(q || fromDate || toDate || conversionFilter !== 'all') && (
                                        <Tooltip>
                                            <TooltipTrigger asChild>
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => { setQ(''); setFromDate(undefined); setToDate(undefined); setConversionFilter('all'); resetPage(); }}
                                                >
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
                                    <TableHead>Converted From</TableHead>
                                    <TableHead className="text-center">Created At</TableHead>
                                    <TableHead className="text-center">First Session</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {paged.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={5} className="h-32 text-center text-gray-500">
                                            No customers yet.
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    paged.map((c) => (
                                        <Tooltip key={c.id}>
                                            <TooltipTrigger asChild>
                                                <TableRow
                                                    className="cursor-pointer hover:bg-gray-50"
                                                    onClick={() => setViewModal({ open: true, customer: c })}
                                                >
                                                    <TableCell className="font-medium">
                                                        <div className="flex items-center gap-2">
                                                            <UserCheck className="h-4 w-4 text-green-600 flex-shrink-0" />
                                                            {c.userFullName || 'N/A'}
                                                        </div>
                                                    </TableCell>
                                                    <TableCell className="text-gray-600 font-mono text-sm">
                                                        {c.userEmail || '—'}
                                                    </TableCell>
                                                    <TableCell className="text-gray-500 text-sm">
                                                        {c.leadId ? `Lead #${c.leadId}` : '—'}
                                                    </TableCell>
                                                    <TableCell className="text-gray-500 text-center text-sm">
                                                        {new Date(c.createdAt).toLocaleDateString()}
                                                    </TableCell>
                                                    <TableCell className="text-center text-gray-500 text-sm">
                                                        <div className="inline-grid place-items-center">
                                                            <span className="col-start-1 row-start-1 whitespace-nowrap">
                                                                {c.firstTutoringRequestId
                                                                    ? `Session #${c.firstTutoringRequestId}`
                                                                    : '—'}
                                                            </span>
                                                            <div className="col-start-1 row-start-1 flex items-center justify-center gap-1 invisible select-none">
                                                                <Button variant="ghost" size="icon"><Pencil className="h-4 w-4" /></Button>
                                                                <Button variant="ghost" size="icon"><Trash2 className="h-4 w-4" /></Button>
                                                            </div>
                                                        </div>
                                                    </TableCell>
                                                </TableRow>
                                            </TooltipTrigger>
                                            <TooltipContent>Click to view customer details</TooltipContent>
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
            {/* View Confirmation */}
            <Dialog
                open={viewModal.open}
                onOpenChange={(open) => !open && setViewModal({ open: false, customer: null })}
            >
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>View Customer</DialogTitle>
                        <DialogDescription>
                            Would you like to view the details of{' '}
                            <span className="font-semibold">
                                {viewModal.customer?.userFullName || 'N/A'}
                            </span>
                            ?
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setViewModal({ open: false, customer: null })}>
                            Cancel
                        </Button>
                        <Button onClick={() => {
                            if (viewModal.customer) navigate(`/marketing/customers/${viewModal.customer.id}`);
                            setViewModal({ open: false, customer: null });
                        }}>
                            View Details
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </AppLayout>
    );
}
