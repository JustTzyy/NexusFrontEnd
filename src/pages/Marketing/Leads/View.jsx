import { useEffect, useState } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { leadService } from '../../../services/leadService';
import { suppressionService } from '../../../services/suppressionService';
import AppLayout from '../../../layouts/AppLayout';
import { FormSkeleton } from '../../../utils/skeletonLoaders';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, Pencil, AlertCircle, User, UserCheck, ShieldOff, ShieldCheck } from 'lucide-react';

const STATUS_COLORS = {
    New: { dot: 'bg-blue-500', text: 'text-blue-700' },
    Contacted: { dot: 'bg-yellow-500', text: 'text-yellow-700' },
    Interested: { dot: 'bg-purple-500', text: 'text-purple-700' },
    Converted: { dot: 'bg-green-500', text: 'text-green-700' },
    Closed: { dot: 'bg-gray-400', text: 'text-gray-500' },
};

export default function LeadView() {
    const navigate = useNavigate();
    const { id } = useParams();
    const location = useLocation();

    const [lead, setLead] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const [suppressed, setSuppressed] = useState(false);
    const [suppressLoading, setSuppressLoading] = useState(false);
    const [suppressError, setSuppressError] = useState('');
    const [suppressDialog, setSuppressDialog] = useState({ open: false, reason: 'Manual', notes: '' });

    const fromArchive = location.state?.from === 'archive';

    useEffect(() => {
        loadLead();
    }, [id]);

    const loadLead = async () => {
        setLoading(true);
        setError('');
        try {
            const res = await leadService.getById(id);
            const data = res.data;
            if (!data) throw new Error('Lead not found');
            setLead(data);
            const checkRes = await suppressionService.check(data.email);
            setSuppressed(checkRes.data?.suppressed ?? false);
        } catch (err) {
            setError(err.response?.data?.message || err.message || 'Failed to load lead');
        } finally {
            setLoading(false);
        }
    };

    const handleSuppress = async () => {
        setSuppressLoading(true);
        setSuppressError('');
        try {
            await suppressionService.create({
                email: lead.email,
                reason: suppressDialog.reason,
                source: 'Manual',
                notes: suppressDialog.notes.trim() || null,
            });
            setSuppressed(true);
            setSuppressDialog({ open: false, reason: 'Manual', notes: '' });
        } catch (err) {
            setSuppressError(err.response?.data?.message || 'Failed to suppress email');
        } finally {
            setSuppressLoading(false);
        }
    };

    const handleUnsuppress = async () => {
        setSuppressLoading(true);
        setSuppressError('');
        try {
            const res = await suppressionService.getAll({ searchTerm: lead.email, pageNumber: 1, pageSize: 1 });
            const record = res.data?.items?.[0];
            if (record) await suppressionService.delete(record.id);
            setSuppressed(false);
        } catch (err) {
            setSuppressError(err.response?.data?.message || 'Failed to remove suppression');
        } finally {
            setSuppressLoading(false);
        }
    };

    const goBack = () => {
        if (fromArchive) {
            navigate('/marketing/leads/archive');
        } else {
            navigate('/marketing/leads');
        }
    };

    const statusStyle = lead ? (STATUS_COLORS[lead.status] ?? { dot: 'bg-gray-400', text: 'text-gray-600' }) : null;

    return (
        <AppLayout title="Lead Details">
            <div className="space-y-6">
                {error && (
                    <Alert variant="destructive">
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription>{error}</AlertDescription>
                    </Alert>
                )}

                {loading ? (
                    <FormSkeleton fields={6} showTabs={false} />
                ) : lead ? (
                    <>
                        {/* Header */}
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <Button variant="outline" size="icon" onClick={goBack}>
                                            <ArrowLeft className="h-4 w-4" />
                                        </Button>
                                    </TooltipTrigger>
                                    <TooltipContent>{fromArchive ? 'Back to archive' : 'Back to leads'}</TooltipContent>
                                </Tooltip>
                                <div>
                                    <h1 className="text-3xl font-bold text-gray-900">
                                        {lead.firstName} {lead.lastName}
                                    </h1>
                                    <p className="mt-1 text-sm text-gray-600">Lead details and pipeline information</p>
                                </div>
                            </div>
                            {!fromArchive && (
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <Button onClick={() => navigate(`/marketing/leads/${id}/edit`)}>
                                            <Pencil className="h-4 w-4 mr-2" />
                                            Edit Lead
                                        </Button>
                                    </TooltipTrigger>
                                    <TooltipContent>Edit this lead</TooltipContent>
                                </Tooltip>
                            )}
                        </div>

                        <Separator />

                        <div className="max-w-4xl mx-auto space-y-5 animate-in fade-in slide-in-from-bottom-4 duration-500">

                            {/* ── Card 1: Contact Information ── */}
                            <div className="border rounded-lg bg-white overflow-hidden">
                                <div className="px-6 py-4 bg-gray-50 border-b flex items-center gap-2">
                                    <div className="h-7 w-7 rounded-full bg-blue-100 flex items-center justify-center">
                                        <span className="text-blue-600 font-bold text-xs">1</span>
                                    </div>
                                    <div>
                                        <h2 className="text-base font-semibold text-gray-900">Contact Information</h2>
                                        <p className="text-xs text-gray-500">Basic contact details</p>
                                    </div>
                                </div>
                                <div className="divide-y">
                                    <div className="grid grid-cols-3 px-6 py-4">
                                        <span className="text-sm font-medium text-gray-500">Full Name</span>
                                        <span className="col-span-2 text-sm text-gray-900 font-medium">
                                            {lead.firstName} {lead.lastName}
                                        </span>
                                    </div>
                                    <div className="grid grid-cols-3 px-6 py-4">
                                        <span className="text-sm font-medium text-gray-500">Email</span>
                                        <span className="col-span-2 text-sm text-gray-900">{lead.email}</span>
                                    </div>
                                    <div className="grid grid-cols-3 px-6 py-4">
                                        <span className="text-sm font-medium text-gray-500">Phone</span>
                                        <span className="col-span-2 text-sm text-gray-900">
                                            {lead.phone || <span className="text-gray-400 italic">Not provided</span>}
                                        </span>
                                    </div>
                                    {lead.userId && (
                                        <div className="grid grid-cols-3 px-6 py-4">
                                            <span className="text-sm font-medium text-gray-500">Linked Account</span>
                                            <span className="col-span-2 text-sm">
                                                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-700 text-xs font-medium border border-indigo-200">
                                                    <User className="h-3 w-3" />
                                                    Registered user (ID: {lead.userId})
                                                </span>
                                            </span>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* ── Card 2: Email Marketing ── */}
                            <div className="border rounded-lg bg-white overflow-hidden">
                                <div className="px-6 py-4 bg-gray-50 border-b flex items-center gap-2">
                                    <div className="h-7 w-7 rounded-full bg-amber-100 flex items-center justify-center">
                                        {suppressed
                                            ? <ShieldOff className="h-3.5 w-3.5 text-amber-600" />
                                            : <ShieldCheck className="h-3.5 w-3.5 text-amber-600" />}
                                    </div>
                                    <div>
                                        <h2 className="text-base font-semibold text-gray-900">Email Marketing</h2>
                                        <p className="text-xs text-gray-500">Suppression status for marketing emails</p>
                                    </div>
                                </div>
                                <div className="divide-y">
                                    <div className="grid grid-cols-3 px-6 py-4 items-center">
                                        <span className="text-sm font-medium text-gray-500">Status</span>
                                        <span className="col-span-2 text-sm">
                                            {suppressed ? (
                                                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-red-50 text-red-700 text-xs font-medium border border-red-200">
                                                    <span className="h-1.5 w-1.5 rounded-full bg-red-500" />
                                                    Suppressed — not receiving marketing emails
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-green-50 text-green-700 text-xs font-medium border border-green-200">
                                                    <span className="h-1.5 w-1.5 rounded-full bg-green-500" />
                                                    Subscribed — eligible for marketing emails
                                                </span>
                                            )}
                                        </span>
                                    </div>
                                    {suppressError && (
                                        <div className="px-6 py-3">
                                            <p className="text-sm text-red-600">{suppressError}</p>
                                        </div>
                                    )}
                                    {!fromArchive && (
                                        <div className="px-6 py-4 flex items-center gap-3">
                                            {suppressed ? (
                                                <Tooltip>
                                                    <TooltipTrigger asChild>
                                                        <Button
                                                            variant="outline"
                                                            size="sm"
                                                            className="text-green-600 hover:text-green-700 hover:bg-green-50 border-green-200"
                                                            onClick={handleUnsuppress}
                                                            disabled={suppressLoading}
                                                        >
                                                            <ShieldCheck className="h-4 w-4 mr-2" />
                                                            {suppressLoading ? 'Removing...' : 'Remove Suppression'}
                                                        </Button>
                                                    </TooltipTrigger>
                                                    <TooltipContent>Allow this lead to receive marketing emails again</TooltipContent>
                                                </Tooltip>
                                            ) : (
                                                <Tooltip>
                                                    <TooltipTrigger asChild>
                                                        <Button
                                                            variant="outline"
                                                            size="sm"
                                                            className="text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200"
                                                            onClick={() => setSuppressDialog({ open: true, reason: 'Manual', notes: '' })}
                                                            disabled={suppressLoading}
                                                        >
                                                            <ShieldOff className="h-4 w-4 mr-2" />
                                                            Suppress Email
                                                        </Button>
                                                    </TooltipTrigger>
                                                    <TooltipContent>Stop sending marketing emails to this lead</TooltipContent>
                                                </Tooltip>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* ── Card 3: Pipeline Details ── */}
                            <div className="border rounded-lg bg-white overflow-hidden">
                                <div className="px-6 py-4 bg-gray-50 border-b flex items-center gap-2">
                                    <div className="h-7 w-7 rounded-full bg-purple-100 flex items-center justify-center">
                                        <UserCheck className="h-3.5 w-3.5 text-purple-600" />
                                    </div>
                                    <div>
                                        <h2 className="text-base font-semibold text-gray-900">Pipeline Details</h2>
                                        <p className="text-xs text-gray-500">Source, status, and notes</p>
                                    </div>
                                </div>
                                <div className="divide-y">
                                    <div className="grid grid-cols-3 px-6 py-4">
                                        <span className="text-sm font-medium text-gray-500">Source</span>
                                        <span className="col-span-2 text-sm text-gray-900">{lead.source}</span>
                                    </div>
                                    <div className="grid grid-cols-3 px-6 py-4">
                                        <span className="text-sm font-medium text-gray-500">Status</span>
                                        <span className="col-span-2 text-sm">
                                            <span className="inline-flex items-center gap-1.5">
                                                <span className={`h-2 w-2 rounded-full shrink-0 ${statusStyle.dot}`} />
                                                <span className={`font-medium ${statusStyle.text}`}>{lead.status}</span>
                                            </span>
                                        </span>
                                    </div>
                                    {lead.convertedAt && (
                                        <div className="grid grid-cols-3 px-6 py-4">
                                            <span className="text-sm font-medium text-gray-500">Converted At</span>
                                            <span className="col-span-2 text-sm text-gray-900">
                                                {new Date(lead.convertedAt).toLocaleString()}
                                            </span>
                                        </div>
                                    )}
                                    <div className="grid grid-cols-3 px-6 py-4">
                                        <span className="text-sm font-medium text-gray-500">Notes</span>
                                        <span className="col-span-2 text-sm text-gray-900">
                                            {lead.notes || <span className="text-gray-400 italic">No notes</span>}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* ── Card 4: Record Metadata ── */}
                            <div className="border rounded-lg bg-white overflow-hidden">
                                <div className="px-6 py-4 bg-gray-50 border-b">
                                    <h2 className="text-base font-semibold text-gray-900">Record Information</h2>
                                </div>
                                <div className="divide-y">
                                    <div className="grid grid-cols-3 px-6 py-4">
                                        <span className="text-sm font-medium text-gray-500">Created At</span>
                                        <span className="col-span-2 text-sm text-gray-900">
                                            {new Date(lead.createdAt).toLocaleString()}
                                        </span>
                                    </div>
                                    <div className="grid grid-cols-3 px-6 py-4">
                                        <span className="text-sm font-medium text-gray-500">Updated At</span>
                                        <span className="col-span-2 text-sm text-gray-900">
                                            {new Date(lead.updatedAt).toLocaleString()}
                                        </span>
                                    </div>
                                    {lead.createdByName && (
                                        <div className="grid grid-cols-3 px-6 py-4">
                                            <span className="text-sm font-medium text-gray-500">Created By</span>
                                            <span className="col-span-2 text-sm text-gray-900">{lead.createdByName}</span>
                                        </div>
                                    )}
                                    {lead.updatedByName && (
                                        <div className="grid grid-cols-3 px-6 py-4">
                                            <span className="text-sm font-medium text-gray-500">Updated By</span>
                                            <span className="col-span-2 text-sm text-gray-900">{lead.updatedByName}</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </>
                ) : null}
            </div>

            {/* Suppress Email Dialog */}
            <Dialog
                open={suppressDialog.open}
                onOpenChange={(open) => !open && setSuppressDialog({ open: false, reason: 'Manual', notes: '' })}
            >
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>Suppress Email</DialogTitle>
                        <DialogDescription>
                            Stop marketing emails to <span className="font-mono font-medium">{lead?.email}</span>.
                            Please provide a reason before confirming.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-2">
                        <div className="space-y-1.5">
                            <Label>Reason</Label>
                            <Select
                                value={suppressDialog.reason}
                                onValueChange={(v) => setSuppressDialog((d) => ({ ...d, reason: v }))}
                            >
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="Manual">Manual — staff request</SelectItem>
                                    <SelectItem value="Unsubscribed">Unsubscribed — requested opt-out</SelectItem>
                                    <SelectItem value="Bounced">Bounced — invalid address</SelectItem>
                                    <SelectItem value="SpamReport">Spam Report — reported as spam</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-1.5">
                            <Label>Notes <span className="text-gray-400 font-normal">(optional)</span></Label>
                            <Textarea
                                placeholder="Add any additional context or notes..."
                                value={suppressDialog.notes}
                                onChange={(e) => setSuppressDialog((d) => ({ ...d, notes: e.target.value }))}
                                rows={3}
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => setSuppressDialog({ open: false, reason: 'Manual', notes: '' })}
                            disabled={suppressLoading}
                        >
                            Cancel
                        </Button>
                        <Button
                            className="bg-red-600 hover:bg-red-700 text-white"
                            onClick={handleSuppress}
                            disabled={suppressLoading}
                        >
                            <ShieldOff className="h-4 w-4 mr-2" />
                            {suppressLoading ? 'Suppressing...' : 'Confirm Suppress'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </AppLayout>
    );
}
