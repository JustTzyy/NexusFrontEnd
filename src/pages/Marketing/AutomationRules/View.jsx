import { useEffect, useState } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { automationService } from '../../../services/automationService';
import { FormSkeleton } from '../../../utils/skeletonLoaders';
import AppLayout from '../../../layouts/AppLayout';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { ArrowLeft, Pencil, AlertCircle, Zap, Settings2 } from 'lucide-react';

const TRIGGER_LABELS = {
    LeadCreated:              'Lead Created',
    LeadConverted:            'Lead Converted',
    LeadStatusChanged:        'Lead Status Changed',
    CampaignSent:             'Campaign Sent',
    OtpRequested:             'OTP Requested',
    PasswordResetRequested:   'Password Reset Requested',
    SessionAssigned:          'Session Assigned',
    SessionConfirmed:         'Session Confirmed',
    SessionReminder:          'Session Reminder',
    SessionCancelled:         'Session Cancelled',
    UserCreated:              'User Created',
    UserRegistered:           'User Registered',
    ProfileCompleted:         'Profile Completed',
};

export default function AutomationRuleView() {
    const navigate = useNavigate();
    const { id } = useParams();
    const location = useLocation();
    const fromArchive = location.state?.from === 'archive';

    const [rule, setRule] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        const loadRule = async () => {
            setLoading(true);
            setError('');
            try {
                const res = await automationService.getById(id);
                if (!res.data) throw new Error('Automation rule not found');
                setRule(res.data);
            } catch (err) {
                setError(err.response?.data?.message || err.message || 'Failed to load rule');
            } finally {
                setLoading(false);
            }
        };
        loadRule();
    }, [id]);

    const goBack = () => {
        if (fromArchive) {
            navigate('/marketing/automation-rules/archive');
        } else {
            navigate('/marketing/automation-rules');
        }
    };

    return (
        <AppLayout title="Automation Rule Details">
            <div className="space-y-6">
                {error && (
                    <Alert variant="destructive">
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription>{error}</AlertDescription>
                    </Alert>
                )}

                {loading ? (
                    <FormSkeleton fields={6} showTabs={false} />
                ) : rule ? (
                    <>
                        {/* ── Header ── */}
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <Button variant="outline" size="icon" onClick={goBack}>
                                            <ArrowLeft className="h-4 w-4" />
                                        </Button>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                        {fromArchive ? 'Back to archive' : 'Back to automation rules'}
                                    </TooltipContent>
                                </Tooltip>
                                <div>
                                    <h1 className="text-3xl font-bold text-gray-900">{rule.name}</h1>
                                    <p className="mt-1 text-sm text-gray-600">Automation rule details and actions</p>
                                </div>
                            </div>
                            {!fromArchive && (
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <Button onClick={() => navigate(`/marketing/automation-rules/${id}/edit`)}>
                                            <Pencil className="h-4 w-4 mr-2" />
                                            Edit Rule
                                        </Button>
                                    </TooltipTrigger>
                                    <TooltipContent>Edit this automation rule</TooltipContent>
                                </Tooltip>
                            )}
                        </div>

                        <Separator />

                        <div className="max-w-4xl mx-auto space-y-5 animate-in fade-in slide-in-from-bottom-4 duration-500">
                            {/* ── Rule Information Card ── */}
                            <div className="border rounded-lg bg-white overflow-hidden">
                                <div className="px-6 py-4 bg-gray-50 border-b flex items-center gap-2">
                                    <Zap className="h-4 w-4 text-amber-500" />
                                    <h2 className="text-lg font-semibold text-gray-900">Rule Information</h2>
                                </div>
                                <div className="divide-y">
                                    <div className="grid grid-cols-3 px-6 py-4">
                                        <span className="text-sm font-medium text-gray-500">Name</span>
                                        <span className="col-span-2 text-sm text-gray-900">{rule.name}</span>
                                    </div>

                                    <div className="grid grid-cols-3 px-6 py-4">
                                        <span className="text-sm font-medium text-gray-500">Trigger Type</span>
                                        <span className="col-span-2 text-sm">
                                            <span className="inline-flex items-center gap-1.5 bg-amber-50 text-amber-700 px-2.5 py-1 rounded text-sm font-medium">
                                                <Zap className="h-3 w-3" />
                                                {TRIGGER_LABELS[rule.triggerType] || rule.triggerType}
                                            </span>
                                        </span>
                                    </div>

                                    <div className="grid grid-cols-3 px-6 py-4">
                                        <span className="text-sm font-medium text-gray-500">Status</span>
                                        <span className="col-span-2 text-sm">
                                            <span className="inline-flex items-center gap-1.5">
                                                <span className={`h-2 w-2 rounded-full ${rule.isActive ? 'bg-green-500' : 'bg-gray-400'}`} />
                                                {rule.isActive ? (
                                                    <span className="font-medium text-green-700">Active</span>
                                                ) : (
                                                    <span className="font-medium text-gray-500">Inactive</span>
                                                )}
                                            </span>
                                        </span>
                                    </div>

                                    {rule.conditionsJson && (
                                        <div className="grid grid-cols-3 px-6 py-4">
                                            <span className="text-sm font-medium text-gray-500">Conditions</span>
                                            <span className="col-span-2">
                                                <pre className="bg-gray-50 rounded-lg p-3 text-xs font-mono overflow-auto whitespace-pre-wrap max-h-48 border border-gray-100">
                                                    {(() => {
                                                        try {
                                                            return JSON.stringify(JSON.parse(rule.conditionsJson), null, 2);
                                                        } catch {
                                                            return rule.conditionsJson;
                                                        }
                                                    })()}
                                                </pre>
                                            </span>
                                        </div>
                                    )}

                                    <div className="grid grid-cols-3 px-6 py-4">
                                        <span className="text-sm font-medium text-gray-500">Created At</span>
                                        <span className="col-span-2 text-sm text-gray-900">
                                            {new Date(rule.createdAt).toLocaleString()}
                                        </span>
                                    </div>
                                    <div className="grid grid-cols-3 px-6 py-4">
                                        <span className="text-sm font-medium text-gray-500">Updated At</span>
                                        <span className="col-span-2 text-sm text-gray-900">
                                            {new Date(rule.updatedAt).toLocaleString()}
                                        </span>
                                    </div>
                                    {rule.createdByName && (
                                        <div className="grid grid-cols-3 px-6 py-4">
                                            <span className="text-sm font-medium text-gray-500">Created By</span>
                                            <span className="col-span-2 text-sm text-gray-900">{rule.createdByName}</span>
                                        </div>
                                    )}
                                    {rule.updatedByName && (
                                        <div className="grid grid-cols-3 px-6 py-4">
                                            <span className="text-sm font-medium text-gray-500">Updated By</span>
                                            <span className="col-span-2 text-sm text-gray-900">{rule.updatedByName}</span>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* ── Actions Card ── */}
                            {rule.actions && rule.actions.length > 0 ? (
                                <div className="border rounded-lg bg-white overflow-hidden">
                                    <div className="px-6 py-4 bg-gray-50 border-b flex items-center gap-2">
                                        <Settings2 className="h-4 w-4 text-indigo-600" />
                                        <h2 className="text-lg font-semibold text-gray-900">
                                            Actions
                                            <span className="ml-2 text-sm font-normal text-gray-500">
                                                ({rule.actions.length} {rule.actions.length === 1 ? 'action' : 'actions'})
                                            </span>
                                        </h2>
                                    </div>
                                    <div className="divide-y">
                                        {rule.actions.map((action, index) => (
                                            <div key={action.id || index} className="px-6 py-4">
                                                <div className="flex items-center justify-between mb-3">
                                                    <span className="text-sm font-semibold text-gray-700">
                                                        Action #{index + 1}
                                                    </span>
                                                    <span className="inline-flex items-center gap-1.5">
                                                        <span className={`h-2 w-2 rounded-full ${action.isActive ? 'bg-green-500' : 'bg-gray-400'}`} />
                                                        <span className={`text-xs font-medium ${action.isActive ? 'text-green-700' : 'text-gray-500'}`}>
                                                            {action.isActive ? 'Active' : 'Inactive'}
                                                        </span>
                                                    </span>
                                                </div>
                                                <div className="grid grid-cols-2 gap-x-8 gap-y-2">
                                                    <div className="grid grid-cols-2">
                                                        <span className="text-sm text-gray-500">Type</span>
                                                        <span className="text-sm font-medium text-gray-900">
                                                            {action.actionType}
                                                        </span>
                                                    </div>
                                                    <div className="grid grid-cols-2">
                                                        <span className="text-sm text-gray-500">Template</span>
                                                        <span className="text-sm font-medium text-gray-900">
                                                            {action.emailTemplateName || '—'}
                                                        </span>
                                                    </div>
                                                    <div className="grid grid-cols-2">
                                                        <span className="text-sm text-gray-500">Delay</span>
                                                        <span className="text-sm font-medium text-gray-900">
                                                            {action.delayMinutes === 0
                                                                ? 'Immediately'
                                                                : `${action.delayMinutes} min`}
                                                        </span>
                                                    </div>
                                                    <div className="grid grid-cols-2">
                                                        <span className="text-sm text-gray-500">Sort Order</span>
                                                        <span className="text-sm font-medium text-gray-900">
                                                            {action.sortOrder}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ) : (
                                <div className="border-2 border-dashed rounded-lg p-6 text-center">
                                    <Settings2 className="h-7 w-7 text-gray-300 mx-auto mb-2" />
                                    <p className="text-sm text-gray-500">No actions configured for this rule</p>
                                </div>
                            )}
                        </div>
                    </>
                ) : null}
            </div>
        </AppLayout>
    );
}
