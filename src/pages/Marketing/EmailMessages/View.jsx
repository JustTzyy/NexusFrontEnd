import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { emailMessageService } from '../../../services/emailMessageService';
import { FormSkeleton } from '../../../utils/skeletonLoaders';
import AppLayout from '../../../layouts/AppLayout';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { ArrowLeft, AlertCircle, Mail, Zap, LayoutTemplate } from 'lucide-react';

const STATUS_COLORS = {
    Queued:    { dot: 'bg-gray-400',   text: 'text-gray-600'   },
    Sending:   { dot: 'bg-purple-500', text: 'text-purple-700' },
    Sent:      { dot: 'bg-green-500',  text: 'text-green-700'  },
    Failed:    { dot: 'bg-red-500',    text: 'text-red-700'    },
    Cancelled: { dot: 'bg-gray-300',   text: 'text-gray-500'   },
    Retrying:  { dot: 'bg-amber-400',  text: 'text-amber-700'  },
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

export default function EmailMessageView() {
    const navigate = useNavigate();
    const { id } = useParams();

    const [message, setMessage] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => { loadMessage(); }, [id]);

    const loadMessage = async () => {
        setLoading(true);
        setError('');
        try {
            const res = await emailMessageService.getById(id);
            const data = res.data;
            if (!data) throw new Error('Message not found');
            setMessage(data);
        } catch (err) {
            setError(err.response?.data?.message || err.message || 'Failed to load message');
        } finally {
            setLoading(false);
        }
    };

    const statusStyle = message
        ? (STATUS_COLORS[message.status] ?? { dot: 'bg-gray-400', text: 'text-gray-600' })
        : null;

    return (
        <AppLayout title="Email Message">
            <div className="space-y-6">
                {error && (
                    <Alert variant="destructive">
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription>{error}</AlertDescription>
                    </Alert>
                )}

                {loading ? (
                    <FormSkeleton fields={6} showTabs={false} />
                ) : message ? (
                    <>
                        {/* Header */}
                        <div className="flex items-center gap-3">
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <Button variant="outline" size="icon" onClick={() => navigate('/marketing/email-messages')}>
                                        <ArrowLeft className="h-4 w-4" />
                                    </Button>
                                </TooltipTrigger>
                                <TooltipContent>Back to email logs</TooltipContent>
                            </Tooltip>
                            <div>
                                <h1 className="text-3xl font-bold text-gray-900 truncate max-w-2xl">
                                    {message.subject}
                                </h1>
                                <p className="mt-1 text-sm text-gray-600">Email message details and delivery information</p>
                            </div>
                        </div>

                        <Separator />

                        <div className="max-w-4xl mx-auto space-y-5 animate-in fade-in slide-in-from-bottom-4 duration-500">

                            {/* ── Card 1: Recipient ── */}
                            <div className="border rounded-lg bg-white overflow-hidden">
                                <div className="px-6 py-4 bg-gray-50 border-b flex items-center gap-2">
                                    <div className="h-7 w-7 rounded-full bg-blue-100 flex items-center justify-center">
                                        <Mail className="h-3.5 w-3.5 text-blue-600" />
                                    </div>
                                    <div>
                                        <h2 className="text-base font-semibold text-gray-900">Recipient</h2>
                                        <p className="text-xs text-gray-500">Who this email was sent to</p>
                                    </div>
                                </div>
                                <div className="divide-y">
                                    <InfoRow label="Name"  value={message.recipientName} missing="Not provided" />
                                    <InfoRow label="Email" value={message.recipientEmail} mono />
                                    <div className="grid grid-cols-3 px-6 py-4">
                                        <span className="text-sm font-medium text-gray-500">Subject</span>
                                        <span className="col-span-2 text-sm text-gray-900">{message.subject}</span>
                                    </div>
                                </div>
                            </div>

                            {/* ── Card 2: Delivery Status ── */}
                            <div className="border rounded-lg bg-white overflow-hidden">
                                <div className="px-6 py-4 bg-gray-50 border-b flex items-center gap-2">
                                    <div className="h-7 w-7 rounded-full bg-emerald-100 flex items-center justify-center">
                                        <span className="text-emerald-600 font-bold text-xs">2</span>
                                    </div>
                                    <div>
                                        <h2 className="text-base font-semibold text-gray-900">Delivery Status</h2>
                                        <p className="text-xs text-gray-500">Sending progress and timestamps</p>
                                    </div>
                                </div>
                                <div className="divide-y">
                                    <div className="grid grid-cols-3 px-6 py-4">
                                        <span className="text-sm font-medium text-gray-500">Status</span>
                                        <span className="col-span-2 text-sm">
                                            <span className="inline-flex items-center gap-1.5">
                                                <span className={`h-2 w-2 rounded-full shrink-0 ${statusStyle.dot}`} />
                                                <span className={`font-medium ${statusStyle.text}`}>{message.status}</span>
                                            </span>
                                        </span>
                                    </div>
                                    <InfoRow label="Queued At"  value={message.queuedAt  ? new Date(message.queuedAt).toLocaleString()  : null} missing="—" />
                                    <InfoRow label="Sent At"    value={message.sentAt    ? new Date(message.sentAt).toLocaleString()    : null} missing="—" />
                                    <InfoRow label="Failed At"  value={message.failedAt  ? new Date(message.failedAt).toLocaleString()  : null} missing="—" />
                                    {message.retryCount > 0 && (
                                        <InfoRow label="Retry Count" value={`${message.retryCount} attempt${message.retryCount !== 1 ? 's' : ''}`} />
                                    )}
                                    {message.errorMessage && (
                                        <div className="grid grid-cols-3 px-6 py-4">
                                            <span className="text-sm font-medium text-gray-500">Error</span>
                                            <span className="col-span-2 text-sm text-red-600 bg-red-50 rounded-md px-3 py-2 break-all">
                                                {message.errorMessage}
                                            </span>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* ── Card 3: Source ── */}
                            <div className="border rounded-lg bg-white overflow-hidden">
                                <div className="px-6 py-4 bg-gray-50 border-b flex items-center gap-2">
                                    <div className="h-7 w-7 rounded-full bg-purple-100 flex items-center justify-center">
                                        <Zap className="h-3.5 w-3.5 text-purple-600" />
                                    </div>
                                    <div>
                                        <h2 className="text-base font-semibold text-gray-900">Source</h2>
                                        <p className="text-xs text-gray-500">What triggered this email</p>
                                    </div>
                                </div>
                                <div className="divide-y">
                                    <div className="grid grid-cols-3 px-6 py-4">
                                        <span className="text-sm font-medium text-gray-500">Type</span>
                                        <span className="col-span-2 text-sm text-gray-900">
                                            {message.campaignName
                                                ? 'Campaign'
                                                : message.automationRuleName
                                                ? 'Automation'
                                                : 'Direct'}
                                        </span>
                                    </div>
                                    {message.campaignName && (
                                        <InfoRow label="Campaign" value={message.campaignName} />
                                    )}
                                    {message.automationRuleName && (
                                        <InfoRow label="Automation Rule" value={message.automationRuleName} />
                                    )}
                                    {message.emailTemplateName && (
                                        <InfoRow label="Template" value={message.emailTemplateName} />
                                    )}
                                </div>
                            </div>

                            {/* ── Card 4: Record Information ── */}
                            <div className="border rounded-lg bg-white overflow-hidden">
                                <div className="px-6 py-4 bg-gray-50 border-b">
                                    <h2 className="text-base font-semibold text-gray-900">Record Information</h2>
                                </div>
                                <div className="divide-y">
                                    <InfoRow label="Message ID" value={`#${message.id}`} />
                                    <InfoRow label="Created At" value={message.createdAt ? new Date(message.createdAt).toLocaleString() : null} missing="—" />
                                    <InfoRow label="Updated At" value={message.updatedAt ? new Date(message.updatedAt).toLocaleString() : null} missing="—" />
                                </div>
                            </div>

                        </div>
                    </>
                ) : null}
            </div>
        </AppLayout>
    );
}
