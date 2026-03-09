import { useEffect, useState } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { campaignService } from '../../../services/campaignService';
import { segmentService } from '../../../services/segmentService';
import AppLayout from '../../../layouts/AppLayout';
import { FormSkeleton } from '../../../utils/skeletonLoaders';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Separator } from '@/components/ui/separator';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import {
    ArrowLeft, Send, CalendarClock, Users, Mail,
    X, AlertCircle, CheckCircle2, BarChart2, Info,
} from 'lucide-react';

const STATUS_COLORS = {
    Draft:     'text-gray-600',
    Scheduled: 'text-blue-700',
    Sending:   'text-purple-700',
    Sent:      'text-green-700',
    Paused:    'text-amber-700',
    Cancelled: 'text-red-700',
};

const STATUS_DOT = {
    Draft:     'bg-gray-400',
    Scheduled: 'bg-blue-500',
    Sending:   'bg-purple-500',
    Sent:      'bg-green-500',
    Paused:    'bg-amber-500',
    Cancelled: 'bg-red-500',
};

const TARGET_DOT = {
    Queued:     'bg-gray-400',
    Sent:       'bg-green-500',
    Failed:     'bg-red-500',
    Suppressed: 'bg-amber-500',
    Skipped:    'bg-gray-300',
};

const TARGET_TEXT = {
    Queued:     'text-gray-600',
    Sent:       'text-green-700',
    Failed:     'text-red-700',
    Suppressed: 'text-amber-700',
    Skipped:    'text-gray-500',
};

export default function CampaignView() {
    const navigate = useNavigate();
    const { id } = useParams();
    const location = useLocation();
    const fromArchive = location.state?.from === 'archive';

    const [campaign, setCampaign] = useState(null);
    const [targets, setTargets] = useState([]);
    const [loading, setLoading] = useState(true);
    const [building, setBuilding] = useState(false);
    const [sending, setSending] = useState(false);
    const [cancelling, setCancelling] = useState(false);
    const [scheduleOpen, setScheduleOpen] = useState(false);
    const [scheduledAt, setScheduledAt] = useState('');
    const [scheduling, setScheduling] = useState(false);
    const [segmentPreview, setSegmentPreview] = useState(null);
    const [previewLoading, setPreviewLoading] = useState(false);
    const [actionAlert, setActionAlert] = useState({ show: false, type: 'success', message: '' });
    const [error, setError] = useState('');

    /* ── Auto-dismiss action alert ── */
    useEffect(() => {
        if (actionAlert.show) {
            const t = setTimeout(() => setActionAlert({ show: false, type: 'success', message: '' }), 4000);
            return () => clearTimeout(t);
        }
    }, [actionAlert.show]);

    /* ── Load campaign + targets ── */
    const load = async () => {
        setLoading(true);
        setError('');
        try {
            const [cRes, tRes] = await Promise.all([
                campaignService.getById(id),
                campaignService.getTargets(id, { pageSize: 100 }),
            ]);
            setCampaign(cRes.data);
            setTargets(tRes.data?.items || []);

            if (cRes.data?.segmentId) {
                setPreviewLoading(true);
                try {
                    const prevRes = await segmentService.preview(cRes.data.segmentId);
                    setSegmentPreview(prevRes.data);
                } catch { /* optional */ }
                setPreviewLoading(false);
            }

            // Auto-build if segment exists but no targets yet
            if (cRes.data?.segmentId && (cRes.data?.totalTargets ?? 0) === 0 && cRes.data?.status === 'Draft') {
                autoBuildTargets();
            }
        } catch (err) {
            setError(err.message || 'Failed to load campaign');
        } finally {
            setLoading(false);
        }
    };

    const autoBuildTargets = async () => {
        setBuilding(true);
        try {
            await campaignService.buildTargets(id);
            const [cRes, tRes] = await Promise.all([
                campaignService.getById(id),
                campaignService.getTargets(id, { pageSize: 100 }),
            ]);
            setCampaign(cRes.data);
            setTargets(tRes.data?.items || []);
        } catch { /* silent */ }
        setBuilding(false);
    };

    useEffect(() => { load(); }, [id]);

    /* ── Action handlers ── */
    const handleBuildTargets = async () => {
        setBuilding(true);
        try {
            const res = await campaignService.buildTargets(id);
            const d = res.data;
            setActionAlert({ show: true, type: 'success', message: `Built ${d?.queuedCount ?? 0} targets (${d?.suppressedCount ?? 0} suppressed).` });
            load();
        } catch (err) {
            setActionAlert({ show: true, type: 'error', message: err.response?.data?.message || 'Failed to build targets' });
        } finally { setBuilding(false); }
    };

    const handleSend = async () => {
        setSending(true);
        try {
            await campaignService.send(id);
            setActionAlert({ show: true, type: 'success', message: 'Campaign queued for sending.' });
            load();
        } catch (err) {
            setActionAlert({ show: true, type: 'error', message: err.response?.data?.message || 'Failed to send campaign' });
        } finally { setSending(false); }
    };

    const handleSchedule = async () => {
        if (!scheduledAt) return;
        setScheduling(true);
        try {
            await campaignService.schedule(id, { scheduledAt });
            setScheduleOpen(false);
            setScheduledAt('');
            setActionAlert({ show: true, type: 'success', message: 'Campaign scheduled successfully.' });
            load();
        } catch (err) {
            setActionAlert({ show: true, type: 'error', message: err.response?.data?.message || 'Failed to schedule campaign' });
        } finally { setScheduling(false); }
    };

    const handleCancel = async () => {
        setCancelling(true);
        try {
            await campaignService.cancel(id);
            setActionAlert({ show: true, type: 'success', message: 'Campaign cancelled.' });
            load();
        } catch (err) {
            setActionAlert({ show: true, type: 'error', message: err.response?.data?.message || 'Failed to cancel campaign' });
        } finally { setCancelling(false); }
    };

    const goBack = () => fromArchive
        ? navigate('/marketing/campaigns/archive')
        : navigate('/marketing/campaigns');

    return (
        <AppLayout title="Campaign Details">
            <div className="space-y-6">
                {/* ── Load error (always visible) ── */}
                {error && (
                    <Alert variant="destructive">
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription>{error}</AlertDescription>
                    </Alert>
                )}

                {loading ? (
                    <FormSkeleton fields={6} showTabs={false} />
                ) : campaign ? (
                    <>
                        {/* ── Header ── */}
                        <div className="flex items-start justify-between gap-4 flex-wrap">
                            <div className="flex items-center gap-3">
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <Button variant="outline" size="icon" onClick={goBack}>
                                            <ArrowLeft className="h-4 w-4" />
                                        </Button>
                                    </TooltipTrigger>
                                    <TooltipContent>{fromArchive ? 'Back to archive' : 'Back to campaigns'}</TooltipContent>
                                </Tooltip>
                                <div>
                                    <h1 className="text-3xl font-bold text-gray-900">{campaign.name}</h1>
                                    <p className="mt-1 text-sm text-gray-600">Campaign details and recipient targets</p>
                                </div>
                            </div>

                            {/* Action buttons (Draft state) */}
                            <div className="flex items-center gap-2 flex-wrap">
                                {campaign.status === 'Draft' && (
                                    <>
                                        <Tooltip>
                                            <TooltipTrigger asChild>
                                                <Button variant="outline" size="sm" disabled={building} onClick={handleBuildTargets}>
                                                    <Users className="h-4 w-4 mr-1" />
                                                    {building ? 'Building...' : 'Build Targets'}
                                                </Button>
                                            </TooltipTrigger>
                                            <TooltipContent>Build the recipient target list from the selected segment</TooltipContent>
                                        </Tooltip>
                                        <Tooltip>
                                            <TooltipTrigger asChild>
                                                <Button variant="outline" size="sm" onClick={() => setScheduleOpen(true)}>
                                                    <CalendarClock className="h-4 w-4 mr-1" />
                                                    Schedule
                                                </Button>
                                            </TooltipTrigger>
                                            <TooltipContent>Schedule for a future date and time</TooltipContent>
                                        </Tooltip>
                                        <Tooltip>
                                            <TooltipTrigger asChild>
                                                <Button size="sm" disabled={sending} onClick={handleSend}>
                                                    <Send className="h-4 w-4 mr-1" />
                                                    {sending ? 'Sending...' : 'Send Now'}
                                                </Button>
                                            </TooltipTrigger>
                                            <TooltipContent>Send this campaign immediately</TooltipContent>
                                        </Tooltip>
                                    </>
                                )}
                                {(campaign.status === 'Scheduled' || campaign.status === 'Sending') && (
                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <Button variant="outline" size="sm" disabled={cancelling} onClick={handleCancel}>
                                                <X className="h-4 w-4 mr-1" />
                                                {cancelling ? 'Cancelling...' : 'Cancel Campaign'}
                                            </Button>
                                        </TooltipTrigger>
                                        <TooltipContent>Cancel this campaign</TooltipContent>
                                    </Tooltip>
                                )}
                            </div>
                        </div>

                        <Separator />

                        <div className="max-w-4xl mx-auto space-y-5 animate-in fade-in slide-in-from-bottom-4 duration-500">
                            {/* ── Action feedback banner ── */}
                            {actionAlert.show && (
                                <Alert className={`flex items-center gap-2 py-2 px-4 ${actionAlert.type === 'success'
                                    ? 'border-green-300 bg-green-50'
                                    : 'border-red-300 bg-red-50'}`}
                                >
                                    {actionAlert.type === 'success'
                                        ? <CheckCircle2 className="h-4 w-4 text-green-600 shrink-0" />
                                        : <AlertCircle className="h-4 w-4 text-red-600 shrink-0" />}
                                    <AlertDescription className={`text-sm flex-1 ${actionAlert.type === 'success' ? 'text-green-800' : 'text-red-800'}`}>
                                        {actionAlert.message}
                                    </AlertDescription>
                                    <Button
                                        variant="ghost" size="icon"
                                        className={`h-5 w-5 shrink-0 ${actionAlert.type === 'success'
                                            ? 'text-green-600 hover:bg-green-100'
                                            : 'text-red-600 hover:bg-red-100'}`}
                                        onClick={() => setActionAlert({ show: false, type: 'success', message: '' })}
                                    >
                                        <X className="h-3 w-3" />
                                    </Button>
                                </Alert>
                            )}

                            {/* ── Stat Cards ── */}
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                {[
                                    { label: 'Total Targets', value: campaign.totalTargets ?? 0 },
                                    { label: 'Sent',          value: campaign.sentCount ?? 0 },
                                    { label: 'Failed',        value: campaign.failedCount ?? 0 },
                                    { label: 'Suppressed',    value: campaign.suppressedCount ?? 0 },
                                ].map((s) => (
                                    <div key={s.label} className="border rounded-lg bg-white overflow-hidden">
                                        <div className="px-5 py-5 text-center">
                                            <p className="text-2xl font-bold text-gray-900">{s.value}</p>
                                            <p className="text-xs text-gray-500 mt-1">{s.label}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* ── Campaign Information ── */}
                            <div className="border rounded-lg bg-white overflow-hidden">
                                <div className="px-6 py-4 bg-gray-50 border-b flex items-center gap-2">
                                    <Info className="h-4 w-4 text-blue-600" />
                                    <h2 className="text-lg font-semibold text-gray-900">Campaign Information</h2>
                                </div>
                                <div className="divide-y">
                                    <div className="grid grid-cols-3 px-6 py-4">
                                        <span className="text-sm font-medium text-gray-500">Name</span>
                                        <span className="col-span-2 text-sm text-gray-900">{campaign.name}</span>
                                    </div>
                                    <div className="grid grid-cols-3 px-6 py-4">
                                        <span className="text-sm font-medium text-gray-500">Status</span>
                                        <span className="col-span-2 text-sm">
                                            <span className="inline-flex items-center gap-1.5">
                                                <span className={`h-2 w-2 rounded-full ${STATUS_DOT[campaign.status] ?? 'bg-gray-400'}`} />
                                                <span className={`font-medium ${STATUS_COLORS[campaign.status] ?? 'text-gray-600'}`}>
                                                    {campaign.status}
                                                </span>
                                            </span>
                                        </span>
                                    </div>
                                    <div className="grid grid-cols-3 px-6 py-4">
                                        <span className="text-sm font-medium text-gray-500">Subject</span>
                                        <span className="col-span-2 text-sm text-gray-900">{campaign.subject || '—'}</span>
                                    </div>
                                    <div className="grid grid-cols-3 px-6 py-4">
                                        <span className="text-sm font-medium text-gray-500">Template</span>
                                        <span className="col-span-2 text-sm text-gray-900">{campaign.emailTemplateName || '—'}</span>
                                    </div>
                                    <div className="grid grid-cols-3 px-6 py-4">
                                        <span className="text-sm font-medium text-gray-500">Segment</span>
                                        <span className="col-span-2 text-sm text-gray-900">
                                            {campaign.segmentName ?? 'All leads & customers'}
                                        </span>
                                    </div>
                                    <div className="grid grid-cols-3 px-6 py-4">
                                        <span className="text-sm font-medium text-gray-500">Scheduled At</span>
                                        <span className="col-span-2 text-sm text-gray-900">
                                            {campaign.scheduledAt
                                                ? new Date(campaign.scheduledAt).toLocaleString()
                                                : '—'}
                                        </span>
                                    </div>
                                    {campaign.sentAt && (
                                        <div className="grid grid-cols-3 px-6 py-4">
                                            <span className="text-sm font-medium text-gray-500">Sent At</span>
                                            <span className="col-span-2 text-sm text-gray-900">
                                                {new Date(campaign.sentAt).toLocaleString()}
                                            </span>
                                        </div>
                                    )}
                                    <div className="grid grid-cols-3 px-6 py-4">
                                        <span className="text-sm font-medium text-gray-500">Created At</span>
                                        <span className="col-span-2 text-sm text-gray-900">
                                            {new Date(campaign.createdAt).toLocaleString()}
                                        </span>
                                    </div>
                                    <div className="grid grid-cols-3 px-6 py-4">
                                        <span className="text-sm font-medium text-gray-500">Updated At</span>
                                        <span className="col-span-2 text-sm text-gray-900">
                                            {new Date(campaign.updatedAt).toLocaleString()}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* ── Segment Matched Users ── */}
                            {campaign.segmentId && (
                                <div className="border rounded-lg bg-white overflow-hidden">
                                    <div className="px-6 py-4 bg-gray-50 border-b flex items-center gap-2">
                                        <Users className="h-4 w-4 text-indigo-600" />
                                        <h2 className="text-lg font-semibold text-gray-900">
                                            Segment Matched Users
                                            {segmentPreview && (
                                                <span className="ml-2 text-sm font-normal text-gray-500">
                                                    ({segmentPreview.count} {segmentPreview.count === 1 ? 'user' : 'users'})
                                                </span>
                                            )}
                                        </h2>
                                    </div>
                                    <div className="p-6">
                                        {previewLoading ? (
                                            <div className="flex items-center gap-3 text-sm text-gray-500">
                                                <span className="h-4 w-4 animate-spin rounded-full border-2 border-indigo-500 border-t-transparent" />
                                                Evaluating segment rules...
                                            </div>
                                        ) : segmentPreview ? (
                                            <div className="space-y-4">
                                                <div className="flex items-center gap-4 p-4 bg-indigo-50 rounded-lg border border-indigo-100">
                                                    <div className="h-12 w-12 rounded-full bg-indigo-100 flex items-center justify-center shrink-0">
                                                        <Users className="h-6 w-6 text-indigo-600" />
                                                    </div>
                                                    <div>
                                                        <p className="text-2xl font-bold text-indigo-700">{segmentPreview.count}</p>
                                                        <p className="text-sm text-indigo-600">
                                                            {segmentPreview.count === 1 ? 'user matches' : 'users match'} segment <strong>{campaign.segmentName}</strong>
                                                        </p>
                                                    </div>
                                                </div>
                                                {segmentPreview.sampleEmails?.length > 0 && (
                                                    <div className="space-y-2">
                                                        <p className="text-sm font-medium text-gray-700 flex items-center gap-1.5">
                                                            <Mail className="h-3.5 w-3.5 text-gray-400" />
                                                            Sample recipients
                                                        </p>
                                                        <div className="space-y-1.5">
                                                            {segmentPreview.sampleEmails.map((email, i) => (
                                                                <div key={i} className="flex items-center gap-2 px-3 py-2 bg-gray-50 rounded-md border border-gray-100">
                                                                    <span className="h-2 w-2 rounded-full bg-green-400 shrink-0" />
                                                                    <span className="text-sm text-gray-700 font-mono">{email}</span>
                                                                </div>
                                                            ))}
                                                            {segmentPreview.count > segmentPreview.sampleEmails.length && (
                                                                <p className="text-xs text-gray-500 italic pl-1">
                                                                    ...and {segmentPreview.count - segmentPreview.sampleEmails.length} more
                                                                </p>
                                                            )}
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        ) : (
                                            <div className="text-center py-4">
                                                <Users className="h-7 w-7 text-gray-300 mx-auto mb-2" />
                                                <p className="text-sm text-gray-500">No preview available</p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* ── Targets Table ── */}
                            <div className="border rounded-lg bg-white overflow-hidden">
                                <div className="px-6 py-4 bg-gray-50 border-b flex items-center gap-2">
                                    <BarChart2 className="h-4 w-4 text-purple-600" />
                                    <h2 className="text-lg font-semibold text-gray-900">
                                        Targets
                                        <span className="ml-2 text-sm font-normal text-gray-500">
                                            ({targets.length})
                                        </span>
                                    </h2>
                                </div>
                                <div className="overflow-auto">
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead className="pl-6">Email</TableHead>
                                                <TableHead>Name</TableHead>
                                                <TableHead className="text-center pr-6">Status</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {targets.length === 0 ? (
                                                <TableRow>
                                                    <TableCell colSpan={3} className="text-center text-gray-400 py-10">
                                                        <Users className="h-7 w-7 text-gray-300 mx-auto mb-2" />
                                                        No targets yet — click <strong>Build Targets</strong> to populate
                                                    </TableCell>
                                                </TableRow>
                                            ) : (
                                                targets.map((t) => (
                                                    <TableRow key={t.id}>
                                                        <TableCell className="pl-6 font-mono text-sm">{t.email}</TableCell>
                                                        <TableCell className="text-sm">
                                                            {[t.firstName, t.lastName].filter(Boolean).join(' ') || '—'}
                                                        </TableCell>
                                                        <TableCell className="text-center pr-6">
                                                            <span className="inline-flex items-center gap-1.5">
                                                                <span className={`h-2 w-2 rounded-full ${TARGET_DOT[t.status] ?? 'bg-gray-300'}`} />
                                                                <span className={`text-xs font-medium ${TARGET_TEXT[t.status] ?? 'text-gray-600'}`}>
                                                                    {t.status}
                                                                </span>
                                                            </span>
                                                        </TableCell>
                                                    </TableRow>
                                                ))
                                            )}
                                        </TableBody>
                                    </Table>
                                </div>
                            </div>
                        </div>
                    </>
                ) : (
                    !error && <p className="text-gray-400 text-center py-12">Campaign not found.</p>
                )}
            </div>

            {/* ── Schedule Dialog ── */}
            <Dialog
                open={scheduleOpen}
                onOpenChange={(open) => { if (!open) { setScheduleOpen(false); setScheduledAt(''); } }}
            >
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Schedule Campaign</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-3 py-2">
                        <div className="space-y-2">
                            <Label htmlFor="scheduledAt">Send At</Label>
                            <Input
                                id="scheduledAt"
                                type="datetime-local"
                                value={scheduledAt}
                                onChange={(e) => setScheduledAt(e.target.value)}
                                disabled={scheduling}
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => { setScheduleOpen(false); setScheduledAt(''); }} disabled={scheduling}>
                            Cancel
                        </Button>
                        <Button onClick={handleSchedule} disabled={!scheduledAt || scheduling}>
                            {scheduling ? (
                                <>
                                    <span className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                                    Scheduling...
                                </>
                            ) : 'Confirm Schedule'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </AppLayout>
    );
}
