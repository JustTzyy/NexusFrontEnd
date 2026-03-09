import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { suppressionService } from '../../../services/suppressionService';
import { FormSkeleton } from '../../../utils/skeletonLoaders';
import AppLayout from '../../../layouts/AppLayout';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { ArrowLeft, AlertCircle, Mail, ShieldOff, Trash2 } from 'lucide-react';

const REASON_COLORS = {
    Unsubscribed: { dot: 'bg-amber-400',  text: 'text-amber-700'  },
    Bounced:      { dot: 'bg-red-500',    text: 'text-red-700'    },
    SpamReport:   { dot: 'bg-orange-500', text: 'text-orange-700' },
    Manual:       { dot: 'bg-gray-400',   text: 'text-gray-600'   },
};

function InfoRow({ label, value, mono, missing }) {
    return (
        <div className="grid grid-cols-3 px-6 py-4">
            <span className="text-sm font-medium text-gray-500">{label}</span>
            <span className={`col-span-2 text-sm ${mono ? 'font-mono' : ''} ${!value ? 'text-gray-400 italic' : 'text-gray-900'}`}>
                {value || missing || 'Not available'}
            </span>
        </div>
    );
}

export default function SuppressionView() {
    const navigate = useNavigate();
    const { id } = useParams();

    const [suppression, setSuppression] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [deleteOpen, setDeleteOpen] = useState(false);
    const [deleting, setDeleting] = useState(false);

    useEffect(() => { loadSuppression(); }, [id]);

    const loadSuppression = async () => {
        setLoading(true);
        setError('');
        try {
            const res = await suppressionService.getById(id);
            const data = res.data;
            if (!data) throw new Error('Suppression not found');
            setSuppression(data);
        } catch (err) {
            setError(err.response?.data?.message || err.message || 'Failed to load suppression');
        } finally {
            setLoading(false);
        }
    };

    const confirmDelete = async () => {
        setDeleting(true);
        try {
            await suppressionService.delete(suppression.id);
            navigate('/marketing/suppressions', {
                state: { alert: { type: 'success', message: `Suppression for "${suppression.email}" removed.` } },
            });
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to remove suppression');
            setDeleteOpen(false);
        } finally {
            setDeleting(false);
        }
    };

    const reasonStyle = suppression
        ? (REASON_COLORS[suppression.reason] ?? { dot: 'bg-gray-400', text: 'text-gray-600' })
        : null;

    return (
        <AppLayout title="Suppression">
            <div className="space-y-6">
                {error && (
                    <Alert variant="destructive">
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription>{error}</AlertDescription>
                    </Alert>
                )}

                {loading ? (
                    <FormSkeleton fields={5} showTabs={false} />
                ) : suppression ? (
                    <>
                        {/* Header */}
                        <div className="flex items-center justify-between gap-3">
                            <div className="flex items-center gap-3">
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <Button variant="outline" size="icon" onClick={() => navigate('/marketing/suppressions')}>
                                            <ArrowLeft className="h-4 w-4" />
                                        </Button>
                                    </TooltipTrigger>
                                    <TooltipContent>Back to suppressions</TooltipContent>
                                </Tooltip>
                                <div>
                                    <h1 className="text-3xl font-bold text-gray-900 font-mono truncate max-w-2xl">
                                        {suppression.email}
                                    </h1>
                                    <p className="mt-1 text-sm text-gray-600">Suppression details and reason</p>
                                </div>
                            </div>
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        className="text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200"
                                        onClick={() => setDeleteOpen(true)}
                                    >
                                        <Trash2 className="h-4 w-4 mr-2" />
                                        Remove Suppression
                                    </Button>
                                </TooltipTrigger>
                                <TooltipContent>Allow this email to receive messages again</TooltipContent>
                            </Tooltip>
                        </div>

                        <Separator />

                        <div className="max-w-4xl mx-auto space-y-5 animate-in fade-in slide-in-from-bottom-4 duration-500">

                            {/* ── Card 1: Email ── */}
                            <div className="border rounded-lg bg-white overflow-hidden">
                                <div className="px-6 py-4 bg-gray-50 border-b flex items-center gap-2">
                                    <div className="h-7 w-7 rounded-full bg-blue-100 flex items-center justify-center">
                                        <Mail className="h-3.5 w-3.5 text-blue-600" />
                                    </div>
                                    <div>
                                        <h2 className="text-base font-semibold text-gray-900">Email Address</h2>
                                        <p className="text-xs text-gray-500">The suppressed email address</p>
                                    </div>
                                </div>
                                <div className="divide-y">
                                    <InfoRow label="Email" value={suppression.email} mono />
                                    <InfoRow label="Added By" value={suppression.createdByName} missing="System" />
                                </div>
                            </div>

                            {/* ── Card 2: Suppression Details ── */}
                            <div className="border rounded-lg bg-white overflow-hidden">
                                <div className="px-6 py-4 bg-gray-50 border-b flex items-center gap-2">
                                    <div className="h-7 w-7 rounded-full bg-red-100 flex items-center justify-center">
                                        <ShieldOff className="h-3.5 w-3.5 text-red-600" />
                                    </div>
                                    <div>
                                        <h2 className="text-base font-semibold text-gray-900">Suppression Details</h2>
                                        <p className="text-xs text-gray-500">Reason and source of this suppression</p>
                                    </div>
                                </div>
                                <div className="divide-y">
                                    <div className="grid grid-cols-3 px-6 py-4">
                                        <span className="text-sm font-medium text-gray-500">Reason</span>
                                        <span className="col-span-2 text-sm">
                                            <span className="inline-flex items-center gap-1.5">
                                                <span className={`h-2 w-2 rounded-full shrink-0 ${reasonStyle.dot}`} />
                                                <span className={`font-medium ${reasonStyle.text}`}>{suppression.reason}</span>
                                            </span>
                                        </span>
                                    </div>
                                    <InfoRow label="Source" value={suppression.source} />
                                    <div className="grid grid-cols-3 px-6 py-4">
                                        <span className="text-sm font-medium text-gray-500">Notes</span>
                                        <span className={`col-span-2 text-sm ${suppression.notes ? 'text-gray-900' : 'text-gray-400 italic'}`}>
                                            {suppression.notes || 'No notes'}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* ── Card 3: Record Information ── */}
                            <div className="border rounded-lg bg-white overflow-hidden">
                                <div className="px-6 py-4 bg-gray-50 border-b">
                                    <h2 className="text-base font-semibold text-gray-900">Record Information</h2>
                                </div>
                                <div className="divide-y">
                                    <InfoRow label="Suppression ID" value={`#${suppression.id}`} />
                                    <InfoRow label="Suppressed On" value={suppression.createdAt ? new Date(suppression.createdAt).toLocaleString() : null} missing="—" />
                                </div>
                            </div>

                        </div>
                    </>
                ) : null}
            </div>

            {/* Remove Confirmation */}
            <AlertDialog open={deleteOpen} onOpenChange={(open) => !open && setDeleteOpen(false)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Remove Suppression</AlertDialogTitle>
                        <AlertDialogDescription>
                            Remove suppression for{' '}
                            <span className="font-semibold">"{suppression?.email}"</span>?
                            This email will be eligible to receive messages again.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={confirmDelete}
                            disabled={deleting}
                            className="bg-red-600 hover:bg-red-700"
                        >
                            {deleting ? 'Removing...' : 'Remove'}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </AppLayout>
    );
}
