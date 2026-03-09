import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { emailMessageService } from '../../../services/emailMessageService';
import { applyFilters, paginate } from '../../../utils/filterUtils';
import { TableIndexSkeleton } from '../../../utils/skeletonLoaders';
import DateRangeFilter from '../../../components/DateRangeFilter';
import AppLayout from '../../../layouts/AppLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Search, AlertCircle, CheckCircle2, X, Pencil, Trash2 } from 'lucide-react';

const STATUS_COLORS = {
    Queued:    { text: 'text-gray-600'   },
    Sending:   { text: 'text-purple-700' },
    Sent:      { text: 'text-green-700'  },
    Failed:    { text: 'text-red-700'    },
    Cancelled: { text: 'text-gray-500'   },
    Retrying:  { text: 'text-amber-700'  },
};

const statusCfg = (s) => STATUS_COLORS[s] ?? { text: 'text-gray-600' };

export default function EmailMessagesIndex() {
    const navigate = useNavigate();
    const location = useLocation();

    const [messages, setMessages] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const [q, setQ] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [fromDate, setFromDate] = useState(undefined);
    const [toDate, setToDate] = useState(undefined);
    const [page, setPage] = useState(1);
    const pageSize = 10;

    const [alert, setAlert] = useState({ show: false, type: 'success', message: '' });
    const [viewModal, setViewModal] = useState({ open: false, msg: null });

    const resetPage = () => setPage(1);

    const loadMessages = async () => {
        setLoading(true);
        setError('');
        try {
            const res = await emailMessageService.getAll({ pageNumber: 1, pageSize: 100 });
            setMessages(res.data?.items || []);
        } catch (err) {
            setError(err.message || 'Failed to load email messages');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { loadMessages(); }, []);

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

    const filtered = useMemo(() => {
        let result = applyFilters(messages, {
            search: q,
            searchFields: ['recipientEmail', 'subject', 'campaignName', 'automationRuleName'],
            fromDate,
            toDate,
            dateField: 'sentAt',
        });
        if (statusFilter !== 'all') {
            result = result.filter((m) => m.status === statusFilter);
        }
        return result;
    }, [messages, q, statusFilter, fromDate, toDate]);

    const paginationResult = useMemo(() => paginate(filtered, page, pageSize), [filtered, page, pageSize]);
    const { data: paged, total, totalPages, page: safePage } = paginationResult;

    useEffect(() => {
        if (page > totalPages) setPage(totalPages);
    }, [totalPages, page]);

    const confirmView = () => {
        if (viewModal.msg) navigate(`/marketing/email-messages/${viewModal.msg.id}`);
        setViewModal({ open: false, msg: null });
    };

    return (
        <AppLayout title="Email Logs">
            {loading ? (
                <TableIndexSkeleton
                    columns={5}
                    rows={10}
                    headers={['Recipient', 'Subject', 'Source', 'Sent At', 'Status']}
                    showAddButton={false}
                />
            ) : (
                <div className="space-y-6">
                    {/* Header */}
                    <div className="flex items-start justify-between gap-4">
                        <div>
                            <h1 className="text-3xl font-bold text-gray-900">Email Logs</h1>
                            <p className="mt-1 text-sm text-gray-600">View all outgoing email activity</p>
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
                    <DateRangeFilter
                        fromDate={fromDate}
                        toDate={toDate}
                        onFromDateChange={(d) => { setFromDate(d); resetPage(); }}
                        onToDateChange={(d) => { setToDate(d); resetPage(); }}
                        leftElement={
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <div className="relative">
                                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                                        <Input
                                            placeholder="Search email or subject..."
                                            value={q}
                                            onChange={(e) => { setQ(e.target.value); resetPage(); }}
                                            className="pl-10 w-[240px]"
                                        />
                                    </div>
                                </TooltipTrigger>
                                <TooltipContent>Search by recipient, subject, or source</TooltipContent>
                            </Tooltip>
                        }
                        rightElement={
                            <div className="flex items-center gap-3">
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <div>
                                            <Select
                                                value={statusFilter}
                                                onValueChange={(v) => { setStatusFilter(v); resetPage(); }}
                                            >
                                                <SelectTrigger className="w-[160px]">
                                                    <SelectValue placeholder="All Status" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="all">All Status</SelectItem>
                                                    <SelectItem value="Queued">Queued</SelectItem>
                                                    <SelectItem value="Sending">Sending</SelectItem>
                                                    <SelectItem value="Sent">Sent</SelectItem>
                                                    <SelectItem value="Failed">Failed</SelectItem>
                                                    <SelectItem value="Cancelled">Cancelled</SelectItem>
                                                    <SelectItem value="Retrying">Retrying</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    </TooltipTrigger>
                                    <TooltipContent>Filter by status</TooltipContent>
                                </Tooltip>

                                {(q || statusFilter !== 'all' || fromDate || toDate) && (
                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => {
                                                    setQ('');
                                                    setStatusFilter('all');
                                                    setFromDate(undefined);
                                                    setToDate(undefined);
                                                    resetPage();
                                                }}
                                            >
                                                Clear
                                            </Button>
                                        </TooltipTrigger>
                                        <TooltipContent>Clear all filters</TooltipContent>
                                    </Tooltip>
                                )}
                            </div>
                        }
                    />

                    {/* Table */}
                    <div className="border rounded-lg overflow-hidden bg-white">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Recipient</TableHead>
                                    <TableHead>Subject</TableHead>
                                    <TableHead>Source</TableHead>
                                    <TableHead className="text-center">Sent At</TableHead>
                                    <TableHead className="text-center">Status</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {paged.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={5} className="h-32 text-center text-gray-500">
                                            No messages found.
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    paged.map((msg) => {
                                        const cfg = statusCfg(msg.status);
                                        return (
                                            <TableRow
                                                key={msg.id}
                                                className="cursor-pointer hover:bg-gray-50"
                                                onClick={() => setViewModal({ open: true, msg })}
                                            >
                                                <TableCell className="font-medium font-mono text-sm">
                                                    {msg.recipientEmail}
                                                </TableCell>
                                                <TableCell className="text-gray-600 max-w-[220px] truncate">
                                                    {msg.subject}
                                                </TableCell>
                                                <TableCell className="text-gray-500 text-sm">
                                                    {msg.campaignName
                                                        ? `Campaign: ${msg.campaignName}`
                                                        : msg.automationRuleName
                                                        ? `Auto: ${msg.automationRuleName}`
                                                        : '—'}
                                                </TableCell>
                                                <TableCell className="text-center text-gray-500 text-sm">
                                                    {msg.sentAt
                                                        ? new Date(msg.sentAt).toLocaleString()
                                                        : '—'}
                                                </TableCell>
                                                <TableCell className="text-center">
                                                    <div className="inline-grid place-items-center">
                                                        <span className={`col-start-1 row-start-1 text-sm font-medium whitespace-nowrap ${cfg.text}`}>
                                                            {msg.status}
                                                        </span>
                                                        <div className="col-start-1 row-start-1 flex items-center justify-center gap-1 invisible select-none">
                                                            <Button variant="ghost" size="icon"><Pencil className="h-4 w-4" /></Button>
                                                            <Button variant="ghost" size="icon"><Trash2 className="h-4 w-4" /></Button>
                                                        </div>
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        );
                                    })
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
            <Dialog open={viewModal.open} onOpenChange={(open) => !open && setViewModal({ open: false, msg: null })}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>View Email Log</DialogTitle>
                        <DialogDescription>
                            Would you like to view the details of{' '}
                            <span className="font-semibold">{viewModal.msg?.recipientEmail}</span>?
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setViewModal({ open: false, msg: null })}>
                            Cancel
                        </Button>
                        <Button onClick={confirmView}>View Details</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </AppLayout>
    );
}
