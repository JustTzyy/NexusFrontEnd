import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { customerService } from '../../../services/customerService';
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
import { ArrowLeft, AlertCircle, UserCheck, BookOpen, ShieldOff, ShieldCheck } from 'lucide-react';

export default function CustomerView() {
    const navigate = useNavigate();
    const { id } = useParams();

    const [customer, setCustomer] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const [suppressed, setSuppressed] = useState(false);
    const [suppressLoading, setSuppressLoading] = useState(false);
    const [suppressError, setSuppressError] = useState('');
    const [suppressDialog, setSuppressDialog] = useState({ open: false, reason: 'Manual', notes: '' });

    useEffect(() => {
        loadCustomer();
    }, [id]);

    const loadCustomer = async () => {
        setLoading(true);
        setError('');
        try {
            const res = await customerService.getById(id);
            const data = res.data;
            if (!data) throw new Error('Customer not found');
            setCustomer(data);
            if (data.userEmail) {
                const checkRes = await suppressionService.check(data.userEmail);
                setSuppressed(checkRes.data?.suppressed ?? false);
            }
        } catch (err) {
            setError(err.response?.data?.message || err.message || 'Failed to load customer');
        } finally {
            setLoading(false);
        }
    };

    const handleSuppress = async () => {
        setSuppressLoading(true);
        setSuppressError('');
        try {
            await suppressionService.create({
                email: customer.userEmail,
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
            const res = await suppressionService.getAll({ searchTerm: customer.userEmail, pageNumber: 1, pageSize: 1 });
            const record = res.data?.items?.[0];
            if (record) await suppressionService.delete(record.id);
            setSuppressed(false);
        } catch (err) {
            setSuppressError(err.response?.data?.message || 'Failed to remove suppression');
        } finally {
            setSuppressLoading(false);
        }
    };

    return (
        <AppLayout title="Customer Details">
            <div className="space-y-6">
                {error && (
                    <Alert variant="destructive">
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription>{error}</AlertDescription>
                    </Alert>
                )}

                {loading ? (
                    <FormSkeleton fields={6} showTabs={false} />
                ) : customer ? (
                    <>
                        {/* Header */}
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <Button variant="outline" size="icon" onClick={() => navigate('/marketing/customers')}>
                                            <ArrowLeft className="h-4 w-4" />
                                        </Button>
                                    </TooltipTrigger>
                                    <TooltipContent>Back to customers</TooltipContent>
                                </Tooltip>
                                <div>
                                    <h1 className="text-3xl font-bold text-gray-900">
                                        {customer.userFullName || `User #${customer.userId}`}
                                    </h1>
                                    <p className="mt-1 text-sm text-gray-600">Customer details and conversion information</p>
                                </div>
                            </div>
                        </div>

                        <Separator />

                        <div className="max-w-4xl mx-auto space-y-5 animate-in fade-in slide-in-from-bottom-4 duration-500">

                            {/* ── Card 1: Customer Information ── */}
                            <div className="border rounded-lg bg-white overflow-hidden">
                                <div className="px-6 py-4 bg-gray-50 border-b flex items-center gap-2">
                                    <div className="h-7 w-7 rounded-full bg-green-100 flex items-center justify-center">
                                        <UserCheck className="h-3.5 w-3.5 text-green-600" />
                                    </div>
                                    <div>
                                        <h2 className="text-base font-semibold text-gray-900">Customer Information</h2>
                                        <p className="text-xs text-gray-500">Basic details and contact</p>
                                    </div>
                                </div>
                                <div className="divide-y">
                                    <div className="grid grid-cols-3 px-6 py-4">
                                        <span className="text-sm font-medium text-gray-500">Name</span>
                                        <span className="col-span-2 text-sm text-gray-900 font-medium">
                                            {customer.userFullName || <span className="text-gray-400 italic">Not available</span>}
                                        </span>
                                    </div>
                                    <div className="grid grid-cols-3 px-6 py-4">
                                        <span className="text-sm font-medium text-gray-500">Email</span>
                                        <span className="col-span-2 text-sm text-gray-900">
                                            {customer.userEmail || <span className="text-gray-400 italic">Not available</span>}
                                        </span>
                                    </div>
                                    <div className="grid grid-cols-3 px-6 py-4">
                                        <span className="text-sm font-medium text-gray-500">User ID</span>
                                        <span className="col-span-2 text-sm text-gray-900">{customer.userId}</span>
                                    </div>
                                </div>
                            </div>

                            {/* ── Card 2: Email Marketing ── */}
                            {customer.userEmail && (
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
                                        <div className="px-6 py-4">
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
                                                    <TooltipContent>Allow this customer to receive marketing emails again</TooltipContent>
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
                                                    <TooltipContent>Stop sending marketing emails to this customer</TooltipContent>
                                                </Tooltip>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* ── Card 3: Conversion Details ── */}
                            <div className="border rounded-lg bg-white overflow-hidden">
                                <div className="px-6 py-4 bg-gray-50 border-b flex items-center gap-2">
                                    <div className="h-7 w-7 rounded-full bg-purple-100 flex items-center justify-center">
                                        <BookOpen className="h-3.5 w-3.5 text-purple-600" />
                                    </div>
                                    <div>
                                        <h2 className="text-base font-semibold text-gray-900">Conversion Details</h2>
                                        <p className="text-xs text-gray-500">Lead origin and first session</p>
                                    </div>
                                </div>
                                <div className="divide-y">
                                    <div className="grid grid-cols-3 px-6 py-4">
                                        <span className="text-sm font-medium text-gray-500">Converted From</span>
                                        <span className="col-span-2 text-sm text-gray-900">
                                            {customer.leadId
                                                ? `Lead #${customer.leadId}`
                                                : <span className="text-gray-400 italic">Direct (no lead)</span>}
                                        </span>
                                    </div>
                                    <div className="grid grid-cols-3 px-6 py-4">
                                        <span className="text-sm font-medium text-gray-500">First Session</span>
                                        <span className="col-span-2 text-sm text-gray-900">
                                            {customer.firstTutoringRequestId
                                                ? `Session #${customer.firstTutoringRequestId}`
                                                : <span className="text-gray-400 italic">No session yet</span>}
                                        </span>
                                    </div>
                                    <div className="grid grid-cols-3 px-6 py-4">
                                        <span className="text-sm font-medium text-gray-500">Notes</span>
                                        <span className="col-span-2 text-sm text-gray-900">
                                            {customer.notes || <span className="text-gray-400 italic">No notes</span>}
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
                                            {new Date(customer.createdAt).toLocaleString()}
                                        </span>
                                    </div>
                                    <div className="grid grid-cols-3 px-6 py-4">
                                        <span className="text-sm font-medium text-gray-500">Updated At</span>
                                        <span className="col-span-2 text-sm text-gray-900">
                                            {new Date(customer.updatedAt).toLocaleString()}
                                        </span>
                                    </div>
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
                            Stop marketing emails to <span className="font-mono font-medium">{customer?.userEmail}</span>.
                            Please provide a reason before confirming.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-2">
                        <div className="space-y-1.5">
                            <Label>Reason</Label>
                            <Select value={suppressDialog.reason} onValueChange={(v) => setSuppressDialog((d) => ({ ...d, reason: v }))}>
                                <SelectTrigger><SelectValue /></SelectTrigger>
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
