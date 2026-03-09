import { useEffect, useState } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { segmentService } from '../../../services/segmentService';
import AppLayout from '../../../layouts/AppLayout';
import { FormSkeleton } from '../../../utils/skeletonLoaders';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { ArrowLeft, Pencil, AlertCircle, Filter, Users, Mail } from 'lucide-react';

/* ─── Human-readable labels ─── */
const FIELD_LABELS = {
    role: 'Role',
    name: 'Name',
    suffix: 'Suffix',
    email: 'Email',
    phone: 'Phone',
    gender: 'Gender',
    nationality: 'Nationality',
    streetBarangay: 'Street / Barangay',
    region: 'Region',
    province: 'Province',
    city: 'City / Municipality',
    postal: 'Postal Code',
};

const OPERATOR_LABELS = {
    equals: 'is',
    notEquals: 'is not',
    contains: 'contains',
    startsWith: 'starts with',
    endsWith: 'ends with',
};

/* ─── Parse rules JSON into readable array ─── */
const parseRules = (json) => {
    if (!json) return [];
    try {
        const parsed = JSON.parse(json);

        // New array format
        if (Array.isArray(parsed)) {
            return parsed.map((r) => ({
                field: r.field || '',
                operator: r.operator || 'equals',
                value: r.value || '',
            }));
        }

        // Legacy flat-object format
        return Object.entries(parsed).map(([field, value]) => {
            if (typeof value === 'string') {
                return { field, operator: 'equals', value };
            }
            if (typeof value === 'object' && value !== null) {
                const [operator, val] = Object.entries(value)[0];
                return { field, operator, value: String(val) };
            }
            return { field, operator: 'equals', value: String(value) };
        });
    } catch {
        return [];
    }
};

export default function SegmentView() {
    const navigate = useNavigate();
    const { id } = useParams();
    const location = useLocation();

    const [segment, setSegment] = useState(null);
    const [preview, setPreview] = useState(null);
    const [loading, setLoading] = useState(true);
    const [previewLoading, setPreviewLoading] = useState(false);
    const [error, setError] = useState('');

    const fromArchive = location.state?.from === 'archive';

    useEffect(() => {
        loadSegment();
    }, [id]);

    const loadSegment = async () => {
        setLoading(true);
        setError('');
        try {
            const response = await segmentService.getById(id);
            const data = response.data;
            if (!data) throw new Error('Segment not found');
            setSegment(data);

            // Load preview (targeted users)
            setPreviewLoading(true);
            try {
                const previewRes = await segmentService.preview(id);
                setPreview(previewRes.data);
            } catch { /* preview optional */ }
            setPreviewLoading(false);
        } catch (err) {
            setError(err.response?.data?.message || err.message || 'Failed to load segment');
        } finally {
            setLoading(false);
        }
    };

    const goBack = () => {
        if (fromArchive) {
            navigate('/marketing/segments/archive');
        } else {
            navigate('/marketing/segments');
        }
    };

    const parsedRules = segment ? parseRules(segment.rulesJson) : [];

    return (
        <AppLayout title="Segment Details">
            <div className="space-y-6">
                {error && (
                    <Alert variant="destructive">
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription>{error}</AlertDescription>
                    </Alert>
                )}

                {loading ? (
                    <FormSkeleton fields={6} showTabs={false} />
                ) : segment ? (
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
                                    <TooltipContent>{fromArchive ? 'Back to archive' : 'Back to segments'}</TooltipContent>
                                </Tooltip>
                                <div>
                                    <h1 className="text-3xl font-bold text-gray-900">{segment.name}</h1>
                                    <p className="mt-1 text-sm text-gray-600">Segment details and configuration</p>
                                </div>
                            </div>
                            {!fromArchive && (
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <Button onClick={() => navigate(`/marketing/segments/${id}/edit`)}>
                                            <Pencil className="h-4 w-4 mr-2" />
                                            Edit Segment
                                        </Button>
                                    </TooltipTrigger>
                                    <TooltipContent>Edit this segment</TooltipContent>
                                </Tooltip>
                            )}
                        </div>

                        <Separator />

                        <div className="max-w-4xl mx-auto space-y-5 animate-in fade-in slide-in-from-bottom-4 duration-500">
                            {/* ────── Details Card ────── */}
                            <div className="border rounded-lg bg-white overflow-hidden">
                                <div className="px-6 py-4 bg-gray-50 border-b">
                                    <h2 className="text-lg font-semibold text-gray-900">Segment Information</h2>
                                </div>
                                <div className="divide-y">
                                    <div className="grid grid-cols-3 px-6 py-4">
                                        <span className="text-sm font-medium text-gray-500">Name</span>
                                        <span className="col-span-2 text-sm text-gray-900">{segment.name}</span>
                                    </div>
                                    <div className="grid grid-cols-3 px-6 py-4">
                                        <span className="text-sm font-medium text-gray-500">Type</span>
                                        <span className="col-span-2 text-sm">
                                            <span className="inline-flex items-center gap-1.5">
                                                <span className={`h-2 w-2 rounded-full ${segment.type === 'Dynamic' ? 'bg-blue-500' : 'bg-gray-400'}`} />
                                                <span className={`font-medium ${segment.type === 'Dynamic' ? 'text-blue-700' : 'text-gray-600'}`}>
                                                    {segment.type}
                                                </span>
                                            </span>
                                        </span>
                                    </div>
                                    <div className="grid grid-cols-3 px-6 py-4">
                                        <span className="text-sm font-medium text-gray-500">Status</span>
                                        <span className="col-span-2 text-sm">
                                            <span className="inline-flex items-center gap-1.5">
                                                <span className={`h-2 w-2 rounded-full ${segment.isActive ? 'bg-green-500' : 'bg-gray-400'}`} />
                                                {segment.isActive ? (
                                                    <span className="font-medium text-green-700">Active</span>
                                                ) : (
                                                    <span className="font-medium text-gray-500">Inactive</span>
                                                )}
                                            </span>
                                        </span>
                                    </div>
                                    <div className="grid grid-cols-3 px-6 py-4">
                                        <span className="text-sm font-medium text-gray-500">Description</span>
                                        <span className="col-span-2 text-sm text-gray-900">
                                            {segment.description || '—'}
                                        </span>
                                    </div>
                                    <div className="grid grid-cols-3 px-6 py-4">
                                        <span className="text-sm font-medium text-gray-500">Created At</span>
                                        <span className="col-span-2 text-sm text-gray-900">
                                            {new Date(segment.createdAt).toLocaleString()}
                                        </span>
                                    </div>
                                    <div className="grid grid-cols-3 px-6 py-4">
                                        <span className="text-sm font-medium text-gray-500">Updated At</span>
                                        <span className="col-span-2 text-sm text-gray-900">
                                            {new Date(segment.updatedAt).toLocaleString()}
                                        </span>
                                    </div>
                                    {segment.createdByName && (
                                        <div className="grid grid-cols-3 px-6 py-4">
                                            <span className="text-sm font-medium text-gray-500">Created By</span>
                                            <span className="col-span-2 text-sm text-gray-900">{segment.createdByName}</span>
                                        </div>
                                    )}
                                    {segment.updatedByName && (
                                        <div className="grid grid-cols-3 px-6 py-4">
                                            <span className="text-sm font-medium text-gray-500">Updated By</span>
                                            <span className="col-span-2 text-sm text-gray-900">{segment.updatedByName}</span>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* ────── Segment Rules Card ────── */}
                            {parsedRules.length > 0 && (
                                <div className="border rounded-lg bg-white overflow-hidden">
                                    <div className="px-6 py-4 bg-gray-50 border-b flex items-center gap-2">
                                        <Filter className="h-4 w-4 text-purple-600" />
                                        <h2 className="text-lg font-semibold text-gray-900">
                                            Segment Rules
                                            <span className="ml-2 text-sm font-normal text-gray-500">
                                                ({parsedRules.length} {parsedRules.length === 1 ? 'rule' : 'rules'})
                                            </span>
                                        </h2>
                                    </div>
                                    <div className="p-6 space-y-3">
                                        {parsedRules.map((rule, index) => (
                                            <div key={index} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg border border-gray-100">
                                                {/* Connector */}
                                                <span className="text-xs font-semibold text-purple-600 uppercase tracking-wide w-14 shrink-0 text-center">
                                                    {index === 0 ? 'Where' : 'And'}
                                                </span>

                                                {/* Field */}
                                                <span className="bg-blue-50 text-blue-700 px-2.5 py-1 rounded text-sm font-medium">
                                                    {FIELD_LABELS[rule.field] || rule.field}
                                                </span>

                                                {/* Operator */}
                                                <span className="text-sm text-gray-500 italic">
                                                    {OPERATOR_LABELS[rule.operator] || rule.operator}
                                                </span>

                                                {/* Value */}
                                                <span className="bg-green-50 text-green-700 px-2.5 py-1 rounded text-sm font-semibold">
                                                    {rule.value}
                                                </span>
                                            </div>
                                        ))}

                                        <p className="text-xs text-gray-500 flex items-center gap-1.5 pt-1 px-1">
                                            <span className="h-1.5 w-1.5 rounded-full bg-purple-400" />
                                            Users matching <strong>all</strong> of the above rules are included in this segment
                                        </p>
                                    </div>
                                </div>
                            )}

                            {/* No rules message for Dynamic segments */}
                            {segment.type === 'Dynamic' && parsedRules.length === 0 && (
                                <div className="border-2 border-dashed rounded-lg p-6 text-center">
                                    <Filter className="h-7 w-7 text-gray-300 mx-auto mb-2" />
                                    <p className="text-sm text-gray-500">No filtering rules defined for this segment</p>
                                </div>
                            )}

                            {/* ────── Targeted Users Card ────── */}
                            <div className="border rounded-lg bg-white overflow-hidden">
                                <div className="px-6 py-4 bg-gray-50 border-b flex items-center gap-2">
                                    <Users className="h-4 w-4 text-indigo-600" />
                                    <h2 className="text-lg font-semibold text-gray-900">Targeted Users</h2>
                                </div>
                                <div className="p-6">
                                    {previewLoading ? (
                                        <div className="flex items-center gap-3 text-sm text-gray-500">
                                            <span className="h-4 w-4 animate-spin rounded-full border-2 border-indigo-500 border-t-transparent" />
                                            Loading matched users...
                                        </div>
                                    ) : preview ? (
                                        <div className="space-y-4">
                                            {/* Count */}
                                            <div className="flex items-center gap-4 p-4 bg-indigo-50 rounded-lg border border-indigo-100">
                                                <div className="h-12 w-12 rounded-full bg-indigo-100 flex items-center justify-center shrink-0">
                                                    <Users className="h-6 w-6 text-indigo-600" />
                                                </div>
                                                <div>
                                                    <p className="text-2xl font-bold text-indigo-700">{preview.count}</p>
                                                    <p className="text-sm text-indigo-600">
                                                        {preview.count === 1 ? 'user matches' : 'users match'} this segment
                                                    </p>
                                                </div>
                                            </div>

                                            {/* Sample emails */}
                                            {preview.sampleEmails && preview.sampleEmails.length > 0 && (
                                                <div className="space-y-2">
                                                    <p className="text-sm font-medium text-gray-700 flex items-center gap-1.5">
                                                        <Mail className="h-3.5 w-3.5 text-gray-400" />
                                                        Sample recipients
                                                    </p>
                                                    <div className="space-y-1.5">
                                                        {preview.sampleEmails.map((email, i) => (
                                                            <div key={i} className="flex items-center gap-2 px-3 py-2 bg-gray-50 rounded-md border border-gray-100">
                                                                <span className="h-2 w-2 rounded-full bg-green-400 shrink-0" />
                                                                <span className="text-sm text-gray-700 font-mono">{email}</span>
                                                            </div>
                                                        ))}
                                                    </div>
                                                    {preview.count > preview.sampleEmails.length && (
                                                        <p className="text-xs text-gray-500 italic pl-1">
                                                            ...and {preview.count - preview.sampleEmails.length} more
                                                        </p>
                                                    )}
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
                        </div>
                    </>
                ) : null}
            </div>
        </AppLayout>
    );
}
