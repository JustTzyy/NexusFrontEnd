import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { automationService } from '../../../services/automationService';
import { emailTemplateService } from '../../../services/emailTemplateService';
import { FormSkeleton } from '../../../utils/skeletonLoaders';
import AppLayout from '../../../layouts/AppLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ArrowLeft, Save, AlertCircle, Plus, Trash2, RotateCcw, Settings2, Zap } from 'lucide-react';

const TRIGGER_TYPES = [
    { value: 'LeadCreated',            label: 'Lead Created' },
    { value: 'LeadConverted',          label: 'Lead Converted' },
    { value: 'LeadStatusChanged',      label: 'Lead Status Changed' },
    { value: 'CampaignSent',           label: 'Campaign Sent' },
    { value: 'OtpRequested',           label: 'OTP Requested' },
    { value: 'PasswordResetRequested', label: 'Password Reset Requested' },
    { value: 'SessionAssigned',        label: 'Session Assigned' },
    { value: 'SessionConfirmed',       label: 'Session Confirmed' },
    { value: 'SessionReminder',        label: 'Session Reminder' },
    { value: 'SessionCancelled',       label: 'Session Cancelled' },
    { value: 'UserCreated',            label: 'User Created' },
    { value: 'UserRegistered',         label: 'User Registered' },
    { value: 'ProfileCompleted',       label: 'Profile Completed' },
];

const initialForm = {
    name: '',
    triggerType: '',
    conditionsJson: '',
    isActive: true,
};

export default function AutomationRuleForm() {
    const navigate = useNavigate();
    const { id } = useParams();
    const isEdit = Boolean(id);

    const [form, setForm] = useState(initialForm);
    const [actions, setActions] = useState([]);
    const [templates, setTemplates] = useState([]);
    const [errors, setErrors] = useState({});
    const [loading, setLoading] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState('');
    const [confirmModal, setConfirmModal] = useState(false);

    /* ── Load email templates for action dropdowns ── */
    useEffect(() => {
        emailTemplateService.getAll({ pageNumber: 1, pageSize: 100 })
            .then((res) => setTemplates(res.data?.items || []))
            .catch(() => {});
    }, []);

    /* ── Load existing rule in edit mode ── */
    useEffect(() => {
        if (!isEdit) return;
        const loadRule = async () => {
            setLoading(true);
            setError('');
            try {
                const res = await automationService.getById(id);
                const rule = res.data;
                if (!rule) throw new Error('Automation rule not found');
                setForm({
                    name: rule.name || '',
                    triggerType: rule.triggerType || '',
                    conditionsJson: rule.conditionsJson || '',
                    isActive: rule.isActive ?? true,
                });
                setActions(
                    (rule.actions || []).map((a) => ({
                        id: a.id,
                        actionType: a.actionType || 'SendEmail',
                        emailTemplateId: a.emailTemplateId ?? '',
                        delayMinutes: a.delayMinutes ?? 0,
                        sortOrder: a.sortOrder ?? 0,
                        isActive: a.isActive ?? true,
                    }))
                );
            } catch (err) {
                setError(err.response?.data?.message || err.message || 'Failed to load rule');
            } finally {
                setLoading(false);
            }
        };
        loadRule();
    }, [id, isEdit]);

    /* ── Handlers ── */
    const goBack = () => navigate('/marketing/automation-rules');

    const handleChange = (field, value) => {
        setForm((prev) => ({ ...prev, [field]: value }));
        if (errors[field]) setErrors((prev) => ({ ...prev, [field]: '' }));
    };

    const handleClear = () => {
        setForm(initialForm);
        setActions([]);
        setErrors({});
    };

    /* ── Actions ── */
    const addAction = () => {
        setActions((prev) => [
            ...prev,
            { actionType: 'SendEmail', emailTemplateId: '', delayMinutes: 0, sortOrder: prev.length, isActive: true },
        ]);
    };

    const updateAction = (index, field, value) => {
        setActions((prev) => prev.map((a, i) => (i === index ? { ...a, [field]: value } : a)));
    };

    const removeAction = (index) => {
        setActions((prev) => prev.filter((_, i) => i !== index).map((a, i) => ({ ...a, sortOrder: i })));
    };

    /* ── Validation ── */
    const validate = () => {
        const newErrors = {};
        if (!form.name.trim()) newErrors.name = 'Name is required';
        if (!form.triggerType) newErrors.triggerType = 'Trigger type is required';
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!validate()) return;
        setConfirmModal(true);
    };

    const confirmSave = async () => {
        setConfirmModal(false);
        setSubmitting(true);
        setError('');
        try {
            const payload = {
                name: form.name.trim(),
                triggerType: form.triggerType,
                conditionsJson: form.conditionsJson.trim() || null,
                isActive: form.isActive,
                actions: actions.map((a) => ({
                    actionType: a.actionType,
                    emailTemplateId: a.emailTemplateId || null,
                    delayMinutes: parseInt(a.delayMinutes) || 0,
                    sortOrder: a.sortOrder,
                    isActive: a.isActive,
                })),
            };

            if (isEdit) {
                await automationService.update(id, {
                    name: payload.name,
                    triggerType: payload.triggerType,
                    conditionsJson: payload.conditionsJson,
                    isActive: payload.isActive,
                });
            } else {
                await automationService.create(payload);
            }

            navigate('/marketing/automation-rules', {
                state: {
                    alert: {
                        type: 'success',
                        message: `Rule "${form.name}" ${isEdit ? 'updated' : 'created'} successfully!`,
                    },
                },
            });
        } catch (err) {
            setError(err.response?.data?.message || err.message || `Failed to ${isEdit ? 'update' : 'create'} rule`);
        } finally {
            setSubmitting(false);
        }
    };

    /* ── Render ── */
    return (
        <AppLayout title={isEdit ? 'Edit Automation Rule' : 'Create Automation Rule'}>
            <div className="space-y-6">
                {error && (
                    <Alert variant="destructive">
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription>{error}</AlertDescription>
                    </Alert>
                )}

                {loading ? (
                    <FormSkeleton fields={4} showTabs={false} />
                ) : (
                    <>
                        {/* ── Header ── */}
                        <div className="flex items-center gap-3">
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <Button variant="outline" size="icon" onClick={goBack}>
                                        <ArrowLeft className="h-4 w-4" />
                                    </Button>
                                </TooltipTrigger>
                                <TooltipContent>Back to automation rules</TooltipContent>
                            </Tooltip>
                            <div>
                                <h1 className="text-3xl font-bold text-gray-900">
                                    {isEdit ? 'Edit Automation Rule' : 'Create Automation Rule'}
                                </h1>
                                <p className="mt-1 text-sm text-gray-600">
                                    {isEdit
                                        ? 'Update the automation rule details below'
                                        : 'Define a new trigger-based automation rule'}
                                </p>
                            </div>
                        </div>

                        <Separator />

                        {/* ── Form ── */}
                        <div className="max-w-4xl mx-auto">
                            <form
                                onSubmit={handleSubmit}
                                className="space-y-6 pt-2 animate-in fade-in slide-in-from-bottom-4 duration-500"
                            >
                                {/* ── Card 1: Rule Information ── */}
                                <div className="border rounded-lg bg-white p-6 space-y-5">
                                    <div className="flex items-center gap-2 mb-1">
                                        <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center">
                                            <span className="text-blue-600 font-bold text-sm">1</span>
                                        </div>
                                        <div>
                                            <h2 className="text-base font-semibold text-gray-900">Rule Information</h2>
                                            <p className="text-xs text-gray-500">Name, trigger, and status of this rule</p>
                                        </div>
                                    </div>

                                    {/* Name · Trigger Type · Status */}
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                                        {/* Name */}
                                        <div className="space-y-2">
                                            <Label htmlFor="name" className="text-sm font-medium text-gray-900">
                                                Name <span className="text-red-500">*</span>
                                            </Label>
                                            <Input
                                                id="name"
                                                value={form.name}
                                                onChange={(e) => handleChange('name', e.target.value)}
                                                placeholder="e.g. Welcome New Lead"
                                                className={`h-10 ${errors.name ? 'border-red-500 focus-visible:ring-red-500' : ''}`}
                                                disabled={submitting}
                                            />
                                            {errors.name ? (
                                                <p className="text-xs text-red-500">{errors.name}</p>
                                            ) : (
                                                <p className="text-xs text-gray-500">A descriptive name for this rule</p>
                                            )}
                                        </div>

                                        {/* Trigger Type */}
                                        <div className="space-y-2">
                                            <Label htmlFor="triggerType" className="text-sm font-medium text-gray-900">
                                                Trigger Type <span className="text-red-500">*</span>
                                            </Label>
                                            <Select
                                                value={form.triggerType}
                                                onValueChange={(v) => handleChange('triggerType', v)}
                                                disabled={submitting}
                                            >
                                                <SelectTrigger
                                                    id="triggerType"
                                                    className={`h-10 w-full ${errors.triggerType ? 'border-red-500' : ''}`}
                                                >
                                                    <SelectValue placeholder="Select trigger" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {TRIGGER_TYPES.map((t) => (
                                                        <SelectItem key={t.value} value={t.value}>
                                                            <span className="flex items-center gap-2">
                                                                <Zap className="h-3 w-3 text-amber-500" />
                                                                {t.label}
                                                            </span>
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                            {errors.triggerType ? (
                                                <p className="text-xs text-red-500">{errors.triggerType}</p>
                                            ) : (
                                                <p className="text-xs text-gray-500">Event that fires this rule</p>
                                            )}
                                        </div>

                                        {/* Status */}
                                        <div className="space-y-2">
                                            <Label htmlFor="isActive" className="text-sm font-medium text-gray-900">
                                                Status
                                            </Label>
                                            <Select
                                                value={form.isActive ? 'active' : 'inactive'}
                                                onValueChange={(v) => handleChange('isActive', v === 'active')}
                                                disabled={submitting}
                                            >
                                                <SelectTrigger id="isActive" className="h-10 w-full">
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="active">
                                                        <span className="flex items-center gap-2">
                                                            <span className="h-2 w-2 rounded-full bg-green-500" />
                                                            Active
                                                        </span>
                                                    </SelectItem>
                                                    <SelectItem value="inactive">
                                                        <span className="flex items-center gap-2">
                                                            <span className="h-2 w-2 rounded-full bg-gray-400" />
                                                            Inactive
                                                        </span>
                                                    </SelectItem>
                                                </SelectContent>
                                            </Select>
                                            <p className="text-xs text-gray-500">Rule availability</p>
                                        </div>
                                    </div>

                                    {/* Conditions JSON — full width */}
                                    <div className="space-y-2">
                                        <Label htmlFor="conditionsJson" className="text-sm font-medium text-gray-900">
                                            Conditions JSON
                                        </Label>
                                        <Textarea
                                            id="conditionsJson"
                                            value={form.conditionsJson}
                                            onChange={(e) => handleChange('conditionsJson', e.target.value)}
                                            placeholder='{"field": "value"}'
                                            rows={3}
                                            className="font-mono text-sm"
                                            disabled={submitting}
                                        />
                                        <p className="text-xs text-gray-500">
                                            Optional JSON conditions for additional filtering (leave blank to match all)
                                        </p>
                                    </div>
                                </div>

                                {/* ── Card 2: Actions (create mode only) ── */}
                                {!isEdit && (
                                    <div className="border rounded-lg bg-white p-6 space-y-5">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-2">
                                                <div className="h-8 w-8 rounded-full bg-purple-100 flex items-center justify-center">
                                                    <Settings2 className="h-4 w-4 text-purple-600" />
                                                </div>
                                                <div>
                                                    <h2 className="text-base font-semibold text-gray-900">Actions</h2>
                                                    <p className="text-xs text-gray-500">
                                                        Define what happens when this rule triggers
                                                    </p>
                                                </div>
                                            </div>
                                            <Button
                                                type="button"
                                                variant="outline"
                                                size="sm"
                                                onClick={addAction}
                                                disabled={submitting}
                                            >
                                                <Plus className="h-4 w-4 mr-1" />
                                                Add Action
                                            </Button>
                                        </div>

                                        {actions.length === 0 ? (
                                            <div className="border-2 border-dashed rounded-lg p-8 text-center">
                                                <Settings2 className="h-8 w-8 text-gray-300 mx-auto mb-3" />
                                                <p className="text-sm text-gray-500 font-medium">No actions added yet</p>
                                                <p className="text-xs text-gray-400 mt-1 mb-4">
                                                    Add actions to define what happens when this rule fires
                                                </p>
                                                <Button
                                                    type="button"
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={addAction}
                                                    disabled={submitting}
                                                >
                                                    <Plus className="h-4 w-4 mr-1" />
                                                    Add First Action
                                                </Button>
                                            </div>
                                        ) : (
                                            <div className="space-y-3">
                                                {actions.map((action, index) => (
                                                    <div
                                                        key={index}
                                                        className="flex items-start gap-3 p-4 bg-gray-50 rounded-lg border border-gray-100"
                                                    >
                                                        {/* Step label */}
                                                        <div className="flex items-center h-9 shrink-0">
                                                            <span className="text-xs font-medium text-gray-500 uppercase tracking-wide w-14">
                                                                #{index + 1}
                                                            </span>
                                                        </div>

                                                        {/* Action Type */}
                                                        <div className="space-y-1 w-[130px] shrink-0">
                                                            <Label className="text-xs text-gray-500">Type</Label>
                                                            <Select
                                                                value={action.actionType}
                                                                onValueChange={(v) => updateAction(index, 'actionType', v)}
                                                                disabled={submitting}
                                                            >
                                                                <SelectTrigger className="h-9">
                                                                    <SelectValue />
                                                                </SelectTrigger>
                                                                <SelectContent>
                                                                    <SelectItem value="SendEmail">Send Email</SelectItem>
                                                                </SelectContent>
                                                            </Select>
                                                        </div>

                                                        {/* Email Template */}
                                                        <div className="flex-1 min-w-0 space-y-1">
                                                            <Label className="text-xs text-gray-500">Email Template</Label>
                                                            <Select
                                                                value={action.emailTemplateId?.toString() || ''}
                                                                onValueChange={(v) => updateAction(index, 'emailTemplateId', parseInt(v))}
                                                                disabled={submitting}
                                                            >
                                                                <SelectTrigger className="h-9">
                                                                    <SelectValue placeholder="Select template" />
                                                                </SelectTrigger>
                                                                <SelectContent>
                                                                    {templates.map((t) => (
                                                                        <SelectItem key={t.id} value={t.id.toString()}>
                                                                            {t.name}
                                                                        </SelectItem>
                                                                    ))}
                                                                </SelectContent>
                                                            </Select>
                                                        </div>

                                                        {/* Delay */}
                                                        <div className="w-[110px] shrink-0 space-y-1">
                                                            <Label className="text-xs text-gray-500">Delay (min)</Label>
                                                            <Input
                                                                type="number"
                                                                min={0}
                                                                value={action.delayMinutes}
                                                                onChange={(e) => updateAction(index, 'delayMinutes', e.target.value)}
                                                                className="h-9"
                                                                disabled={submitting}
                                                            />
                                                        </div>

                                                        {/* Status */}
                                                        <div className="w-[110px] shrink-0 space-y-1">
                                                            <Label className="text-xs text-gray-500">Status</Label>
                                                            <Select
                                                                value={action.isActive ? 'active' : 'inactive'}
                                                                onValueChange={(v) => updateAction(index, 'isActive', v === 'active')}
                                                                disabled={submitting}
                                                            >
                                                                <SelectTrigger className="h-9">
                                                                    <SelectValue />
                                                                </SelectTrigger>
                                                                <SelectContent>
                                                                    <SelectItem value="active">
                                                                        <span className="flex items-center gap-1.5">
                                                                            <span className="h-2 w-2 rounded-full bg-green-500" />
                                                                            Active
                                                                        </span>
                                                                    </SelectItem>
                                                                    <SelectItem value="inactive">
                                                                        <span className="flex items-center gap-1.5">
                                                                            <span className="h-2 w-2 rounded-full bg-gray-400" />
                                                                            Inactive
                                                                        </span>
                                                                    </SelectItem>
                                                                </SelectContent>
                                                            </Select>
                                                        </div>

                                                        {/* Remove */}
                                                        <div className="flex items-end h-[54px] shrink-0">
                                                            <Tooltip>
                                                                <TooltipTrigger asChild>
                                                                    <Button
                                                                        type="button"
                                                                        variant="ghost"
                                                                        size="icon"
                                                                        onClick={() => removeAction(index)}
                                                                        className="text-red-500 hover:text-red-600 hover:bg-red-50 h-9 w-9"
                                                                        disabled={submitting}
                                                                    >
                                                                        <Trash2 className="h-4 w-4" />
                                                                    </Button>
                                                                </TooltipTrigger>
                                                                <TooltipContent>Remove this action</TooltipContent>
                                                            </Tooltip>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                )}

                                {/* ── Footer ── */}
                                <div className="flex items-center justify-end gap-3 pt-2">
                                    <Button
                                        type="button"
                                        variant="outline"
                                        onClick={handleClear}
                                        disabled={submitting}
                                    >
                                        <RotateCcw className="h-4 w-4 mr-2" />
                                        Clear
                                    </Button>
                                    <Button type="submit" disabled={submitting}>
                                        {submitting ? (
                                            <>
                                                <span className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                                                Saving...
                                            </>
                                        ) : (
                                            <>
                                                <Save className="h-4 w-4 mr-2" />
                                                {isEdit ? 'Save Changes' : 'Create Rule'}
                                            </>
                                        )}
                                    </Button>
                                </div>
                            </form>
                        </div>
                    </>
                )}
            </div>

            {/* ── Confirm AlertDialog ── */}
            <AlertDialog open={confirmModal} onOpenChange={setConfirmModal}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>
                            {isEdit ? 'Update Automation Rule' : 'Create Automation Rule'}
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                            Are you sure you want to {isEdit ? 'update' : 'create'} the rule{' '}
                            <span className="font-semibold text-gray-900">"{form.name}"</span>?
                            {isEdit
                                ? ' This will update the existing rule record.'
                                : ' This will add a new automation rule to the system.'}
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={confirmSave}>
                            {isEdit ? 'Update' : 'Create'}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </AppLayout>
    );
}
