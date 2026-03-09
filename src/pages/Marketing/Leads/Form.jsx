import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { leadService } from '../../../services/leadService';
import { FormSkeleton } from '../../../utils/skeletonLoaders';
import AppLayout from '../../../layouts/AppLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { ArrowLeft, Save, AlertCircle, RotateCcw, UserCheck, Lock } from 'lucide-react';

const initialForm = {
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    source: 'Manual',
    status: 'New',
    notes: '',
};

const STATUS_COLORS = {
    New: 'bg-blue-500',
    Contacted: 'bg-yellow-500',
    Interested: 'bg-purple-500',
    Converted: 'bg-green-500',
    Closed: 'bg-gray-400',
};

export default function LeadForm() {
    const navigate = useNavigate();
    const { id } = useParams();
    const isEdit = Boolean(id);

    const [loading, setLoading] = useState(isEdit);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState('');
    const [saveModal, setSaveModal] = useState(false);
    const [form, setForm] = useState(initialForm);
    const [errors, setErrors] = useState({});

    useEffect(() => {
        if (isEdit) {
            setLoading(true);
            leadService
                .getById(id)
                .then((res) => {
                    const d = res.data;
                    setForm({
                        firstName: d.firstName || '',
                        lastName: d.lastName || '',
                        email: d.email || '',
                        phone: d.phone || '',
                        source: d.source || 'Manual',
                        status: d.status || 'New',
                        notes: d.notes || '',
                    });
                })
                .catch((err) => setError(err.message || 'Failed to load lead'))
                .finally(() => setLoading(false));
        }
    }, [id, isEdit]);

    const handleChange = (field, value) => {
        setForm((prev) => ({ ...prev, [field]: value }));
        if (errors[field]) setErrors((prev) => ({ ...prev, [field]: '' }));
    };

    const handleClear = () => {
        setForm(initialForm);
        setErrors({});
    };

    const validate = () => {
        const newErrors = {};
        if (!form.firstName.trim()) newErrors.firstName = 'First name is required';
        if (!form.lastName.trim()) newErrors.lastName = 'Last name is required';
        if (!form.email.trim()) newErrors.email = 'Email is required';
        else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) newErrors.email = 'Enter a valid email address';
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
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
        try {
            if (isEdit) {
                await leadService.update(id, form);
            } else {
                await leadService.create(form);
            }
            navigate('/marketing/leads', {
                state: {
                    alert: {
                        type: 'success',
                        message: isEdit
                            ? `Lead "${form.firstName} ${form.lastName}" updated successfully!`
                            : `Lead "${form.firstName} ${form.lastName}" created successfully!`,
                    },
                },
            });
        } catch (err) {
            setError(err.response?.data?.message || err.message || 'Failed to save lead');
            setSubmitting(false);
        }
    };

    return (
        <AppLayout title={isEdit ? 'Edit Lead' : 'Create Lead'}>
            <div className="space-y-6">
                {error && (
                    <Alert variant="destructive">
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription>{error}</AlertDescription>
                    </Alert>
                )}

                {loading ? (
                    <FormSkeleton fields={6} />
                ) : (
                    <>
                        {/* Header */}
                        <div className="flex items-center gap-3">
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <Button variant="outline" size="icon" onClick={() => navigate('/marketing/leads')}>
                                        <ArrowLeft className="h-4 w-4" />
                                    </Button>
                                </TooltipTrigger>
                                <TooltipContent>Back to leads</TooltipContent>
                            </Tooltip>
                            <div>
                                <h1 className="text-3xl font-bold text-gray-900">
                                    {isEdit ? 'Edit Lead' : 'Create Lead'}
                                </h1>
                                <p className="mt-1 text-sm text-gray-600">
                                    {isEdit ? 'Update lead contact and pipeline information' : 'Add a new lead to the system'}
                                </p>
                            </div>
                        </div>

                        <Separator />

                        <div className="max-w-4xl mx-auto">
                            <form onSubmit={handleSubmit} className="space-y-6 pt-2 animate-in fade-in slide-in-from-bottom-4 duration-500">

                                {/* ── Card 1: Contact Information ── */}
                                <div className="border rounded-lg bg-white p-6 space-y-5">
                                    <div className="flex items-center gap-2 mb-1">
                                        <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center">
                                            <span className="text-blue-600 font-bold text-sm">1</span>
                                        </div>
                                        <div>
                                            <h2 className="text-base font-semibold text-gray-900">Contact Information</h2>
                                            <p className="text-xs text-gray-500">Basic contact details for this lead</p>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                        {/* First Name */}
                                        <div className="space-y-2">
                                            <Label htmlFor="firstName" className="text-sm font-medium text-gray-900">
                                                First Name <span className="text-red-500">*</span>
                                            </Label>
                                            <Input
                                                id="firstName"
                                                placeholder="e.g. Juan"
                                                value={form.firstName}
                                                onChange={(e) => handleChange('firstName', e.target.value)}
                                                className={`h-10 ${errors.firstName ? 'border-red-500 focus-visible:ring-red-500' : ''}`}
                                                disabled={submitting}
                                            />
                                            {errors.firstName ? (
                                                <p className="text-xs text-red-500">{errors.firstName}</p>
                                            ) : (
                                                <p className="text-xs text-gray-500">Lead's first name</p>
                                            )}
                                        </div>

                                        {/* Last Name */}
                                        <div className="space-y-2">
                                            <Label htmlFor="lastName" className="text-sm font-medium text-gray-900">
                                                Last Name <span className="text-red-500">*</span>
                                            </Label>
                                            <Input
                                                id="lastName"
                                                placeholder="e.g. Dela Cruz"
                                                value={form.lastName}
                                                onChange={(e) => handleChange('lastName', e.target.value)}
                                                className={`h-10 ${errors.lastName ? 'border-red-500 focus-visible:ring-red-500' : ''}`}
                                                disabled={submitting}
                                            />
                                            {errors.lastName ? (
                                                <p className="text-xs text-red-500">{errors.lastName}</p>
                                            ) : (
                                                <p className="text-xs text-gray-500">Lead's last name</p>
                                            )}
                                        </div>

                                        {/* Email */}
                                        <div className="space-y-2">
                                            <Label htmlFor="email" className="text-sm font-medium text-gray-900">
                                                Email <span className="text-red-500">*</span>
                                            </Label>
                                            <Input
                                                id="email"
                                                type="email"
                                                placeholder="e.g. juan@example.com"
                                                value={form.email}
                                                onChange={(e) => handleChange('email', e.target.value)}
                                                className={`h-10 ${errors.email ? 'border-red-500 focus-visible:ring-red-500' : ''}`}
                                                disabled={submitting}
                                            />
                                            {errors.email ? (
                                                <p className="text-xs text-red-500">{errors.email}</p>
                                            ) : (
                                                <p className="text-xs text-gray-500">Used for campaign targeting</p>
                                            )}
                                        </div>

                                        {/* Phone */}
                                        <div className="space-y-2">
                                            <Label htmlFor="phone" className="text-sm font-medium text-gray-900">
                                                Phone
                                            </Label>
                                            <Input
                                                id="phone"
                                                placeholder="e.g. +63 912 345 6789"
                                                value={form.phone}
                                                onChange={(e) => handleChange('phone', e.target.value)}
                                                className="h-10"
                                                disabled={submitting}
                                            />
                                            <p className="text-xs text-gray-500">Optional contact number</p>
                                        </div>
                                    </div>
                                </div>

                                {/* ── Card 2: Pipeline Details ── */}
                                <div className="border rounded-lg bg-white p-6 space-y-5">
                                    <div className="flex items-center gap-2 mb-1">
                                        <div className="h-8 w-8 rounded-full bg-purple-100 flex items-center justify-center">
                                            <UserCheck className="h-4 w-4 text-purple-600" />
                                        </div>
                                        <div>
                                            <h2 className="text-base font-semibold text-gray-900">Pipeline Details</h2>
                                            <p className="text-xs text-gray-500">Source, status, and notes for this lead</p>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                        {/* Source */}
                                        <div className="space-y-2">
                                            <Label className="text-sm font-medium text-gray-900">
                                                Source
                                            </Label>
                                            <div className="h-10 px-3 flex items-center gap-2 rounded-md border border-gray-200 bg-gray-50 cursor-not-allowed">
                                                <Lock className="h-3.5 w-3.5 text-gray-400 flex-shrink-0" />
                                                <span className="text-sm text-gray-700">{form.source}</span>
                                                <Badge variant="outline" className="ml-auto text-[10px] text-gray-500 border-gray-300 py-0">
                                                    Auto-set
                                                </Badge>
                                            </div>
                                            <p className="text-xs text-gray-500">
                                                {isEdit ? 'Source is fixed and cannot be changed' : 'Automatically set to Manual for form entries'}
                                            </p>
                                        </div>

                                        {/* Status */}
                                        <div className="space-y-2">
                                            <Label htmlFor="status" className="text-sm font-medium text-gray-900">
                                                Status
                                            </Label>
                                            <Select
                                                value={form.status}
                                                onValueChange={(v) => handleChange('status', v)}
                                                disabled={submitting}
                                            >
                                                <SelectTrigger id="status" className="h-10 w-full">
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {Object.entries(STATUS_COLORS).map(([s, color]) => (
                                                        <SelectItem key={s} value={s}>
                                                            <span className="flex items-center gap-2">
                                                                <span className={`h-2 w-2 rounded-full ${color}`} />
                                                                {s}
                                                            </span>
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                            <p className="text-xs text-gray-500">Current pipeline stage</p>
                                        </div>
                                    </div>

                                    {/* Notes */}
                                    <div className="space-y-2">
                                        <Label htmlFor="notes" className="text-sm font-medium text-gray-900">
                                            Notes
                                        </Label>
                                        <Textarea
                                            id="notes"
                                            placeholder="Any additional notes about this lead..."
                                            value={form.notes}
                                            onChange={(e) => handleChange('notes', e.target.value)}
                                            rows={3}
                                            disabled={submitting}
                                        />
                                        <p className="text-xs text-gray-500">Internal notes visible only to the team</p>
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
                                                {isEdit ? 'Save Changes' : 'Create Lead'}
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
                        <AlertDialogTitle>{isEdit ? 'Update Lead' : 'Create Lead'}</AlertDialogTitle>
                        <AlertDialogDescription>
                            Are you sure you want to {isEdit ? 'update' : 'create'} the lead{' '}
                            <span className="font-semibold">"{form.firstName} {form.lastName}"</span>?{' '}
                            {isEdit
                                ? 'This will update the existing lead record.'
                                : 'This will add a new lead to the system.'}
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
