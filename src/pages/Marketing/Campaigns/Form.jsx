import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { campaignService } from '../../../services/campaignService';
import { emailTemplateService } from '../../../services/emailTemplateService';
import { segmentService } from '../../../services/segmentService';
import { FormSkeleton } from '../../../utils/skeletonLoaders';
import AppLayout from '../../../layouts/AppLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { ArrowLeft, Save, AlertCircle, RotateCcw, Mail, Users } from 'lucide-react';

const initialForm = {
    name: '',
    subject: '',
    emailTemplateId: '',
    segmentId: '',
};

export default function CampaignForm() {
    const navigate = useNavigate();
    const { id } = useParams();
    const isEdit = Boolean(id);

    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState('');
    const [saveModal, setSaveModal] = useState(false);

    const [form, setForm] = useState(initialForm);
    const [errors, setErrors] = useState({ name: '', emailTemplateId: '' });
    const [templates, setTemplates] = useState([]);
    const [segments, setSegments] = useState([]);

    useEffect(() => {
        const init = async () => {
            setLoading(true);
            try {
                const [tRes, sRes] = await Promise.all([
                    emailTemplateService.getAll({ pageNumber: 1, pageSize: 100 }),
                    segmentService.getAll({ pageNumber: 1, pageSize: 100 }),
                ]);
                setTemplates(tRes.data?.items || []);
                setSegments(sRes.data?.items || []);

                if (isEdit) {
                    const cRes = await campaignService.getById(id);
                    const d = cRes.data;
                    setForm({
                        name: d.name || '',
                        subject: d.subject || '',
                        emailTemplateId: d.emailTemplateId ? String(d.emailTemplateId) : '',
                        segmentId: d.segmentId ? String(d.segmentId) : '',
                    });
                }
            } catch (err) {
                setError(err.message || 'Failed to load data');
            } finally {
                setLoading(false);
            }
        };
        init();
    }, [id, isEdit]);

    const handleChange = (field, value) => {
        setForm((prev) => ({ ...prev, [field]: value }));
        if (errors[field]) setErrors((prev) => ({ ...prev, [field]: '' }));
    };

    const handleClear = () => {
        setForm(initialForm);
        setErrors({ name: '', emailTemplateId: '' });
    };

    const validate = () => {
        const newErrors = { name: '', emailTemplateId: '' };
        let valid = true;
        if (!form.name.trim()) {
            newErrors.name = 'Campaign name is required';
            valid = false;
        }
        if (!form.emailTemplateId) {
            newErrors.emailTemplateId = 'Please select an email template';
            valid = false;
        }
        setErrors(newErrors);
        return valid;
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!validate()) return;
        setError('');
        setSaveModal(true);
    };

    const confirmSave = async () => {
        setSaveModal(false);
        setSubmitting(true);
        setError('');
        const payload = {
            name: form.name.trim(),
            subject: form.subject.trim() || null,
            emailTemplateId: form.emailTemplateId ? Number(form.emailTemplateId) : null,
            segmentId: form.segmentId ? Number(form.segmentId) : null,
        };
        try {
            if (isEdit) {
                await campaignService.update(id, payload);
            } else {
                await campaignService.create(payload);
            }
            navigate('/marketing/campaigns', {
                state: {
                    alert: {
                        type: 'success',
                        message: isEdit
                            ? `Campaign "${form.name}" updated successfully!`
                            : `Campaign "${form.name}" created successfully!`,
                    },
                },
            });
        } catch (err) {
            setError(err.response?.data?.message || err.message || 'Failed to save campaign');
            setSubmitting(false);
        }
    };

    return (
        <AppLayout title={isEdit ? 'Edit Campaign' : 'Create Campaign'}>
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
                                    <Button variant="outline" size="icon" onClick={() => navigate('/marketing/campaigns')}>
                                        <ArrowLeft className="h-4 w-4" />
                                    </Button>
                                </TooltipTrigger>
                                <TooltipContent>Back to campaigns</TooltipContent>
                            </Tooltip>
                            <div>
                                <h1 className="text-3xl font-bold text-gray-900">
                                    {isEdit ? 'Edit Campaign' : 'Create Campaign'}
                                </h1>
                                <p className="mt-1 text-sm text-gray-600">
                                    {isEdit ? 'Update the campaign details' : 'Set up a new email marketing campaign'}
                                </p>
                            </div>
                        </div>

                        <Separator />

                        {/* ── Form ── */}
                        <div className="max-w-4xl mx-auto">
                            <form onSubmit={handleSubmit} className="space-y-6 pt-2 animate-in fade-in slide-in-from-bottom-4 duration-500">

                                {/* ── Card 1: Campaign Details ── */}
                                <div className="border rounded-lg bg-white p-6 space-y-5">
                                    <div className="flex items-center gap-2 mb-1">
                                        <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center">
                                            <span className="text-blue-600 font-bold text-sm">1</span>
                                        </div>
                                        <div>
                                            <h2 className="text-base font-semibold text-gray-900">Campaign Details</h2>
                                            <p className="text-xs text-gray-500">Name and subject line for this campaign</p>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                        {/* Name */}
                                        <div className="space-y-2">
                                            <Label htmlFor="name" className="text-sm font-medium text-gray-900">
                                                Campaign Name <span className="text-red-500">*</span>
                                            </Label>
                                            <Input
                                                id="name"
                                                placeholder="e.g. March Welcome Campaign"
                                                value={form.name}
                                                onChange={(e) => handleChange('name', e.target.value)}
                                                className={errors.name ? 'border-red-500 focus-visible:ring-red-500' : ''}
                                                disabled={submitting}
                                            />
                                            {errors.name ? (
                                                <p className="text-xs text-red-500">{errors.name}</p>
                                            ) : (
                                                <p className="text-xs text-gray-500">A descriptive name for this campaign</p>
                                            )}
                                        </div>

                                        {/* Subject */}
                                        <div className="space-y-2">
                                            <Label htmlFor="subject" className="text-sm font-medium text-gray-900">
                                                Email Subject{' '}
                                                <span className="text-gray-400 text-xs font-normal">(optional)</span>
                                            </Label>
                                            <Input
                                                id="subject"
                                                placeholder="Overrides the template subject if provided"
                                                value={form.subject}
                                                onChange={(e) => handleChange('subject', e.target.value)}
                                                disabled={submitting}
                                            />
                                            <p className="text-xs text-gray-500">Leave blank to use the template's subject line</p>
                                        </div>
                                    </div>
                                </div>

                                {/* ── Card 2: Message & Audience ── */}
                                <div className="border rounded-lg bg-white p-6 space-y-5">
                                    <div className="flex items-center gap-2 mb-1">
                                        <div className="h-8 w-8 rounded-full bg-purple-100 flex items-center justify-center">
                                            <Users className="h-4 w-4 text-purple-600" />
                                        </div>
                                        <div>
                                            <h2 className="text-base font-semibold text-gray-900">Message & Audience</h2>
                                            <p className="text-xs text-gray-500">Choose the email template and target audience</p>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                        {/* Email Template */}
                                        <div className="space-y-2">
                                            <Label htmlFor="emailTemplateId" className="text-sm font-medium text-gray-900">
                                                Email Template <span className="text-red-500">*</span>
                                            </Label>
                                            <Select
                                                value={form.emailTemplateId}
                                                onValueChange={(v) => handleChange('emailTemplateId', v)}
                                                disabled={submitting}
                                            >
                                                <SelectTrigger
                                                    id="emailTemplateId"
                                                    className={`h-10 w-full ${errors.emailTemplateId ? 'border-red-500' : ''}`}
                                                >
                                                    <SelectValue placeholder="Select template..." />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {templates.map((t) => (
                                                        <SelectItem key={t.id} value={String(t.id)}>
                                                            <span className="flex items-center gap-2">
                                                                <Mail className="h-3.5 w-3.5 text-gray-400" />
                                                                {t.name}
                                                            </span>
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                            {errors.emailTemplateId ? (
                                                <p className="text-xs text-red-500">{errors.emailTemplateId}</p>
                                            ) : (
                                                <p className="text-xs text-gray-500">The HTML template used to generate the email body</p>
                                            )}
                                        </div>

                                        {/* Target Segment */}
                                        <div className="space-y-2">
                                            <Label htmlFor="segmentId" className="text-sm font-medium text-gray-900">
                                                Target Segment{' '}
                                                <span className="text-gray-400 text-xs font-normal">(optional)</span>
                                            </Label>
                                            <Select
                                                value={form.segmentId}
                                                onValueChange={(v) => handleChange('segmentId', v)}
                                                disabled={submitting}
                                            >
                                                <SelectTrigger id="segmentId" className="h-10 w-full">
                                                    <SelectValue placeholder="All leads & customers" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {segments.map((s) => (
                                                        <SelectItem key={s.id} value={String(s.id)}>
                                                            <span className="flex items-center gap-2">
                                                                <span className={`h-2 w-2 rounded-full shrink-0 ${s.type === 'Dynamic' ? 'bg-blue-500' : 'bg-gray-400'}`} />
                                                                {s.name}
                                                            </span>
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                            <p className="text-xs text-gray-500">
                                                Leave blank to target all active leads and customers
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                {/* ── Footer ── */}
                                <div className="flex items-center justify-end gap-3 pt-2">
                                    <Button type="button" variant="outline" onClick={handleClear} disabled={submitting}>
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
                                                {isEdit ? 'Save Changes' : 'Create Campaign'}
                                            </>
                                        )}
                                    </Button>
                                </div>
                            </form>
                        </div>
                    </>
                )}
            </div>

            <AlertDialog open={saveModal} onOpenChange={setSaveModal}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>{isEdit ? 'Update Campaign' : 'Create Campaign'}</AlertDialogTitle>
                        <AlertDialogDescription>
                            Are you sure you want to {isEdit ? 'update' : 'create'} the campaign{' '}
                            <span className="font-semibold text-gray-900">"{form.name}"</span>?{' '}
                            {isEdit
                                ? 'This will update the existing campaign details.'
                                : 'This will add a new campaign to the system.'}
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
