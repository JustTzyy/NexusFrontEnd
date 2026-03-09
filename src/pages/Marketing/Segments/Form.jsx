import { useEffect, useState, useRef, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { segmentService } from '../../../services/segmentService';
import AppLayout from '../../../layouts/AppLayout';
import { FormSkeleton } from '../../../utils/skeletonLoaders';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { ArrowLeft, Save, AlertCircle, RotateCcw, Plus, Trash2, Filter, ChevronDown, Check, X } from 'lucide-react';

/* ────────────────────────── rule builder config ────────────────────────── */
const RULE_FIELDS = [
    // Lead fields (target unregistered / pipeline filtering)
    { value: 'leadtype',   label: 'Lead Type',   group: 'Lead' },
    { value: 'leadstatus', label: 'Lead Status',  group: 'Lead' },
    { value: 'leadsource', label: 'Lead Source',  group: 'Lead' },
    // Role (via UserRoles)
    { value: 'role', label: 'Role', group: 'User' },
    // User fields
    { value: 'name',        label: 'Name',        group: 'User' },
    { value: 'suffix',      label: 'Suffix',       group: 'User' },
    { value: 'email',       label: 'Email',        group: 'User' },
    { value: 'phone',       label: 'Phone',        group: 'User' },
    { value: 'gender',      label: 'Gender',       group: 'User' },
    { value: 'nationality', label: 'Nationality',  group: 'User' },
    // Address fields
    { value: 'streetBarangay', label: 'Street / Barangay',  group: 'Address' },
    { value: 'region',         label: 'Region',              group: 'Address' },
    { value: 'province',       label: 'Province',            group: 'Address' },
    { value: 'city',           label: 'City / Municipality', group: 'Address' },
    { value: 'postal',         label: 'Postal Code',         group: 'Address' },
];

const FIELD_GROUPS = ['Lead', 'User', 'Address'];

const OPERATORS = [
    { value: 'equals', label: 'is' },
    { value: 'notEquals', label: 'is not' },
    { value: 'contains', label: 'contains' },
    { value: 'startsWith', label: 'starts with' },
    { value: 'endsWith', label: 'ends with' },
];

/* — convert visual rules array → JSON array string — */
const rulesToJson = (rules) => {
    const valid = rules.filter((r) => r.field && r.value);
    if (valid.length === 0) return '';
    return JSON.stringify(
        valid.map((r) => ({
            field: r.field,
            operator: r.operator,
            value: r.value,
        }))
    );
};

/* — parse JSON string → visual rules array (handles both array & legacy object format) — */
const jsonToRules = (json) => {
    if (!json) return [];
    try {
        const parsed = JSON.parse(json);

        // New array format: [{ field, operator, value }, ...]
        if (Array.isArray(parsed)) {
            return parsed.map((r) => ({
                field: r.field || '',
                operator: r.operator || 'equals',
                value: r.value || '',
            }));
        }

        // Legacy flat-object format: { "role": "Student", "status": { "contains": "Act" } }
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

/* ─── Typeable value combobox (fetches suggestions from DB) ─── */
function ValueCombobox({ value, onChange, suggestions, loading, disabled, placeholder }) {
    const [open, setOpen] = useState(false);
    const [search, setSearch] = useState('');
    const wrapperRef = useRef(null);

    // Parse incoming CSV value into array
    const selectedItems = (value || '').split(',').map(s => s.trim()).filter(Boolean);

    useEffect(() => {
        const handleClick = (e) => {
            if (wrapperRef.current && !wrapperRef.current.contains(e.target)) setOpen(false);
        };
        document.addEventListener('mousedown', handleClick);
        return () => document.removeEventListener('mousedown', handleClick);
    }, []);

    const filtered = suggestions.filter((s) =>
        s.toLowerCase().includes(search.toLowerCase())
    );

    const toggleItem = (item) => {
        const newItems = selectedItems.includes(item)
            ? selectedItems.filter(i => i !== item)
            : [...selectedItems, item];
        onChange(newItems.join(', '));
        setSearch('');
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter' && search) {
            e.preventDefault();
            if (!selectedItems.includes(search)) {
                onChange([...selectedItems, search].join(', '));
                setSearch('');
            }
        } else if (e.key === 'Backspace' && !search && selectedItems.length > 0) {
            const newItems = [...selectedItems];
            newItems.pop();
            onChange(newItems.join(', '));
        }
    };

    return (
        <div ref={wrapperRef} className="relative">
            <div
                className={`min-h-[40px] flex flex-wrap items-center gap-1.5 p-1.5 rounded-md border ${disabled ? 'bg-gray-50 border-gray-100 cursor-not-allowed' : 'bg-white border-gray-200'} focus-within:ring-2 focus-within:ring-indigo-500 focus-within:border-indigo-500 transition-shadow`}
                onClick={() => !disabled && setOpen(true)}
            >
                {selectedItems.map((item, idx) => (
                    <span key={idx} className="inline-flex items-center gap-1 rounded bg-indigo-50 px-2 py-0.5 text-xs font-medium text-indigo-700 ring-1 ring-inset ring-indigo-700/10">
                        {item}
                        <button
                            type="button"
                            onClick={(e) => { e.stopPropagation(); toggleItem(item); }}
                            className="text-indigo-600 hover:bg-indigo-200 hover:text-indigo-900 rounded p-0.5 ml-1"
                            disabled={disabled}
                        >
                            <X className="h-3 w-3" />
                        </button>
                    </span>
                ))}

                <input
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    onFocus={() => setOpen(true)}
                    onKeyDown={handleKeyDown}
                    placeholder={selectedItems.length === 0 ? placeholder : ''}
                    className="flex-1 min-w-[120px] bg-transparent outline-none text-sm px-1.5 py-0.5 disabled:cursor-not-allowed"
                    disabled={disabled}
                    autoComplete="off"
                />

                <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); setOpen(!open); }}
                    className="text-gray-400 hover:text-gray-600 px-1 ml-auto"
                    disabled={disabled}
                    tabIndex={-1}
                >
                    <ChevronDown className={`h-4 w-4 transition-transform ${open ? 'rotate-180' : ''}`} />
                </button>
            </div>

            {open && !disabled && (
                <div className="absolute z-50 mt-1 w-full bg-white border border-gray-200 rounded-md shadow-lg max-h-48 overflow-auto">
                    {loading ? (
                        <div className="flex items-center gap-2 px-3 py-2 text-sm text-gray-500">
                            <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-indigo-500 border-t-transparent" />
                            Loading values...
                        </div>
                    ) : filtered.length === 0 ? (
                        <div className="px-3 py-2 text-sm text-gray-400 italic">
                            {search && suggestions.length > 0 ? 'Press Enter to add custom value' : (suggestions.length === 0 ? 'No values in database' : 'No matches found')}
                        </div>
                    ) : (
                        filtered.slice(0, 50).map((item, idx) => {
                            const isSelected = selectedItems.includes(item);
                            return (
                                <button
                                    key={idx}
                                    type="button"
                                    onClick={() => toggleItem(item)}
                                    className={`w-full text-left px-3 py-2 text-sm hover:bg-indigo-50 flex items-center justify-between ${isSelected ? 'bg-indigo-50 text-indigo-700 font-medium' : 'text-gray-700 hover:text-indigo-700'
                                        }`}
                                >
                                    {item}
                                    {isSelected && <Check className="h-3.5 w-3.5 text-indigo-600" />}
                                </button>
                            );
                        })
                    )}
                </div>
            )}
        </div>
    );
}

export default function SegmentForm() {
    const navigate = useNavigate();
    const { id } = useParams();
    const isEditMode = Boolean(id);

    /* ------------------------------ State ------------------------------ */
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState('');

    const initialFormData = {
        name: '',
        description: '',
        type: 'Dynamic',
        rulesJson: '',
        isActive: 'active',
    };

    const [formData, setFormData] = useState(initialFormData);
    const [rules, setRules] = useState([]);
    const [errors, setErrors] = useState({ name: '', type: '' });
    const [saveModal, setSaveModal] = useState(false);
    const [fieldValues, setFieldValues] = useState({});     // cache: { role: [...], email: [...], ... }
    const [loadingField, setLoadingField] = useState(null);  // which field is loading

    /* ------------------------------ Effects ------------------------------ */
    useEffect(() => {
        if (isEditMode) {
            loadSegment();
        } else {
            const timer = setTimeout(() => setLoading(false), 500);
            return () => clearTimeout(timer);
        }
    }, [id]);

    /* ------------------------------ API ------------------------------ */
    const loadSegment = async () => {
        setLoading(true);
        setError('');
        try {
            const response = await segmentService.getById(id);
            const data = response.data;
            if (!data) throw new Error('Segment not found');

            setFormData({
                name: data.name || '',
                description: data.description || '',
                type: data.type || 'Dynamic',
                rulesJson: data.rulesJson || '',
                isActive: data.isActive ? 'active' : 'inactive',
            });

            // Parse existing JSON into visual rules
            const parsed = jsonToRules(data.rulesJson);
            setRules(parsed);
            // Pre-load DB values for each rule's field
            parsed.forEach(r => { if (r.field) loadFieldValues(r.field); });
        } catch (err) {
            setError(err.response?.data?.message || err.message || 'Failed to load segment');
        } finally {
            setLoading(false);
        }
    };

    /* ------------------------------ Handlers ------------------------------ */
    const goBack = () => navigate('/marketing/segments');

    const handleClear = () => {
        setFormData(initialFormData);
        setRules([]);
        setErrors({ name: '', type: '' });
    };

    const handleInputChange = (field, value) => {
        setFormData((prev) => ({ ...prev, [field]: value }));
        if (errors[field]) {
            setErrors((prev) => ({ ...prev, [field]: '' }));
        }
    };

    /* ─── Rule Builder ─── */
    const addRule = () => {
        setRules((prev) => [...prev, { field: '', operator: 'equals', value: '' }]);
    };

    const updateRule = (index, key, value) => {
        setRules((prev) => {
            const updated = [...prev];
            updated[index] = { ...updated[index], [key]: value };

            // When field changes, reset operator and value, load DB values
            if (key === 'field') {
                updated[index].operator = 'equals';
                updated[index].value = '';
                loadFieldValues(value);
            }

            return updated;
        });
    };

    const removeRule = (index) => {
        setRules((prev) => prev.filter((_, i) => i !== index));
    };

    const getFieldConfig = (fieldValue) => RULE_FIELDS.find((f) => f.value === fieldValue);

    /* ─── Load field values from DB ─── */
    const loadFieldValues = useCallback(async (field) => {
        if (!field || fieldValues[field]) return;
        setLoadingField(field);
        try {
            const res = await segmentService.getFieldValues(field);
            setFieldValues((prev) => ({ ...prev, [field]: res.data || [] }));
        } catch {
            setFieldValues((prev) => ({ ...prev, [field]: [] }));
        }
        setLoadingField(null);
    }, [fieldValues]);

    /* ─── Validation ─── */
    const validateForm = () => {
        const newErrors = { name: '', type: '' };
        let isValid = true;

        if (!formData.name.trim()) {
            newErrors.name = 'Segment name is required';
            isValid = false;
        }

        if (!formData.type) {
            newErrors.type = 'Segment type is required';
            isValid = false;
        }

        setErrors(newErrors);
        return isValid;
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!validateForm()) return;
        setSaveModal(true);
    };

    const confirmSave = async () => {
        setSaveModal(false);
        setSubmitting(true);
        setError('');

        try {
            const payload = {
                name: formData.name.trim(),
                description: formData.description.trim() || null,
                type: formData.type,
                rulesJson: rulesToJson(rules) || formData.rulesJson.trim() || null,
                isActive: formData.isActive === 'active',
            };

            if (isEditMode) {
                await segmentService.update(id, payload);
            } else {
                await segmentService.create(payload);
            }

            navigate('/marketing/segments', {
                state: {
                    alert: {
                        type: 'success',
                        message: isEditMode
                            ? `Segment "${formData.name}" updated successfully!`
                            : `Segment "${formData.name}" created successfully!`,
                    },
                },
            });
        } catch (err) {
            setError(err.response?.data?.message || err.message || 'Failed to save segment');
            setSubmitting(false);
        }
    };

    /* ------------------------------ Render ------------------------------ */
    return (
        <AppLayout title={isEditMode ? 'Edit Segment' : 'Create Segment'}>
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
                        {/* Header */}
                        <div className="flex items-center gap-3">
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <Button variant="outline" size="icon" onClick={goBack}>
                                        <ArrowLeft className="h-4 w-4" />
                                    </Button>
                                </TooltipTrigger>
                                <TooltipContent>Back to segments</TooltipContent>
                            </Tooltip>
                            <div>
                                <h1 className="text-3xl font-bold text-gray-900">
                                    {isEditMode ? 'Edit Segment' : 'Create Segment'}
                                </h1>
                                <p className="mt-1 text-sm text-gray-600">
                                    {isEditMode ? 'Update the segment details below' : 'Define a new audience segment'}
                                </p>
                            </div>
                        </div>

                        <Separator />

                        {/* Form Content */}
                        <div className="max-w-4xl mx-auto">
                            <form onSubmit={handleSubmit} className="space-y-6 pt-2 animate-in fade-in slide-in-from-bottom-4 duration-500">

                                {/* ────── Basic Information Card ────── */}
                                <div className="border rounded-lg bg-white p-6 space-y-5">
                                    <div className="flex items-center gap-2 mb-1">
                                        <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center">
                                            <span className="text-blue-600 font-bold text-sm">1</span>
                                        </div>
                                        <div>
                                            <h2 className="text-base font-semibold text-gray-900">Basic Information</h2>
                                            <p className="text-xs text-gray-500">Name, type, and status of your segment</p>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                                        {/* Name */}
                                        <div className="space-y-2">
                                            <Label htmlFor="name" className="text-sm font-medium text-gray-900">
                                                Segment Name <span className="text-red-500">*</span>
                                            </Label>
                                            <Input
                                                id="name"
                                                type="text"
                                                placeholder="e.g. Active Students"
                                                value={formData.name}
                                                onChange={(e) => handleInputChange('name', e.target.value)}
                                                className={`h-10 ${errors.name ? 'border-red-500 focus-visible:ring-red-500' : ''}`}
                                                disabled={submitting}
                                            />
                                            {errors.name ? (
                                                <p className="text-xs text-red-500">{errors.name}</p>
                                            ) : (
                                                <p className="text-xs text-gray-500">A descriptive name for this segment</p>
                                            )}
                                        </div>

                                        {/* Type */}
                                        <div className="space-y-2">
                                            <Label htmlFor="type" className="text-sm font-medium text-gray-900">
                                                Type <span className="text-red-500">*</span>
                                            </Label>
                                            <Select
                                                value={formData.type}
                                                onValueChange={(value) => handleInputChange('type', value)}
                                                disabled={submitting}
                                            >
                                                <SelectTrigger id="type" className={`h-10 w-full ${errors.type ? 'border-red-500' : ''}`}>
                                                    <SelectValue placeholder="Select type" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="Dynamic">
                                                        <span className="flex items-center gap-2">
                                                            <span className="h-2 w-2 rounded-full bg-blue-500" />
                                                            Dynamic
                                                        </span>
                                                    </SelectItem>
                                                    <SelectItem value="Static">
                                                        <span className="flex items-center gap-2">
                                                            <span className="h-2 w-2 rounded-full bg-gray-400" />
                                                            Static
                                                        </span>
                                                    </SelectItem>
                                                </SelectContent>
                                            </Select>
                                            {errors.type ? (
                                                <p className="text-xs text-red-500">{errors.type}</p>
                                            ) : (
                                                <p className="text-xs text-gray-500">
                                                    {formData.type === 'Dynamic'
                                                        ? 'Auto-updates based on rules'
                                                        : 'Manually managed members'}
                                                </p>
                                            )}
                                        </div>

                                        {/* Status */}
                                        <div className="space-y-2">
                                            <Label htmlFor="isActive" className="text-sm font-medium text-gray-900">
                                                Status
                                            </Label>
                                            <Select
                                                value={formData.isActive}
                                                onValueChange={(value) => handleInputChange('isActive', value)}
                                                disabled={submitting}
                                            >
                                                <SelectTrigger id="isActive" className="h-10 w-full">
                                                    <SelectValue placeholder="Select status" />
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
                                            <p className="text-xs text-gray-500">Segment availability</p>
                                        </div>
                                    </div>

                                    {/* Description */}
                                    <div className="space-y-2">
                                        <Label htmlFor="description" className="text-sm font-medium text-gray-900">
                                            Description
                                        </Label>
                                        <Textarea
                                            id="description"
                                            placeholder="Describe who belongs in this segment and why..."
                                            value={formData.description}
                                            onChange={(e) => handleInputChange('description', e.target.value)}
                                            rows={2}
                                            disabled={submitting}
                                        />
                                        <p className="text-xs text-gray-500">Help others understand this segment's purpose</p>
                                    </div>
                                </div>

                                {/* ────── Segment Rules Card ────── */}
                                {formData.type === 'Dynamic' && (
                                    <div className="border rounded-lg bg-white p-6 space-y-5">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-2">
                                                <div className="h-8 w-8 rounded-full bg-purple-100 flex items-center justify-center">
                                                    <Filter className="h-4 w-4 text-purple-600" />
                                                </div>
                                                <div>
                                                    <h2 className="text-base font-semibold text-gray-900">Segment Rules</h2>
                                                    <p className="text-xs text-gray-500">
                                                        Define conditions to automatically include users
                                                    </p>
                                                </div>
                                            </div>
                                            <Button type="button" variant="outline" size="sm" onClick={addRule} disabled={submitting}>
                                                <Plus className="h-4 w-4 mr-1" />
                                                Add Rule
                                            </Button>
                                        </div>

                                        {rules.length === 0 ? (
                                            <div className="border-2 border-dashed rounded-lg p-8 text-center">
                                                <Filter className="h-8 w-8 text-gray-300 mx-auto mb-3" />
                                                <p className="text-sm text-gray-500 font-medium">No rules defined yet</p>
                                                <p className="text-xs text-gray-400 mt-1 mb-4">
                                                    Add rules to automatically filter users into this segment
                                                </p>
                                                <Button type="button" variant="outline" size="sm" onClick={addRule} disabled={submitting}>
                                                    <Plus className="h-4 w-4 mr-1" />
                                                    Add First Rule
                                                </Button>
                                            </div>
                                        ) : (
                                            <div className="space-y-3">
                                                {rules.map((rule, index) => {
                                                    const suggestions = rule.field ? (fieldValues[rule.field] || []) : [];
                                                    const isFieldLoading = loadingField === rule.field;

                                                    return (
                                                        <div key={index} className="flex items-start gap-3 p-4 bg-gray-50 rounded-lg border border-gray-100">
                                                            {/* Row label */}
                                                            <div className="flex items-center h-10 shrink-0">
                                                                <span className="text-xs font-medium text-gray-500 uppercase tracking-wide w-12">
                                                                    {index === 0 ? 'Where' : 'And'}
                                                                </span>
                                                            </div>

                                                            {/* Field */}
                                                            <div className="flex-1 min-w-0 space-y-1">
                                                                <Label className="text-xs text-gray-500">Field</Label>
                                                                <Select
                                                                    value={rule.field}
                                                                    onValueChange={(v) => updateRule(index, 'field', v)}
                                                                    disabled={submitting}
                                                                >
                                                                    <SelectTrigger className="h-10">
                                                                        <SelectValue placeholder="Select field..." />
                                                                    </SelectTrigger>
                                                                    <SelectContent>
                                                                        {FIELD_GROUPS.map((group) => (
                                                                            <SelectGroup key={group}>
                                                                                <SelectLabel className="text-xs text-gray-400 uppercase tracking-wide">{group}</SelectLabel>
                                                                                {RULE_FIELDS.filter(f => f.group === group).map((f) => (
                                                                                    <SelectItem key={f.value} value={f.value}>
                                                                                        {f.label}
                                                                                    </SelectItem>
                                                                                ))}
                                                                            </SelectGroup>
                                                                        ))}
                                                                    </SelectContent>
                                                                </Select>
                                                            </div>

                                                            {/* Operator */}
                                                            <div className="w-[140px] shrink-0 space-y-1">
                                                                <Label className="text-xs text-gray-500">Condition</Label>
                                                                <Select
                                                                    value={rule.operator}
                                                                    onValueChange={(v) => updateRule(index, 'operator', v)}
                                                                    disabled={submitting}
                                                                >
                                                                    <SelectTrigger className="h-10">
                                                                        <SelectValue />
                                                                    </SelectTrigger>
                                                                    <SelectContent>
                                                                        {OPERATORS.map((op) => (
                                                                            <SelectItem key={op.value} value={op.value}>
                                                                                {op.label}
                                                                            </SelectItem>
                                                                        ))}
                                                                    </SelectContent>
                                                                </Select>
                                                            </div>

                                                            {/* Value — Typeable combobox */}
                                                            <div className="flex-1 min-w-0 space-y-1">
                                                                <Label className="text-xs text-gray-500">Value</Label>
                                                                <ValueCombobox
                                                                    value={rule.value}
                                                                    onChange={(v) => updateRule(index, 'value', v)}
                                                                    suggestions={suggestions}
                                                                    loading={isFieldLoading}
                                                                    disabled={submitting}
                                                                    placeholder={rule.field ? `Search ${getFieldConfig(rule.field)?.label || rule.field}...` : 'Select a field first'}
                                                                />
                                                            </div>

                                                            {/* Remove */}
                                                            <div className="flex items-end h-[62px] shrink-0">
                                                                <Tooltip>
                                                                    <TooltipTrigger asChild>
                                                                        <Button
                                                                            type="button"
                                                                            variant="ghost"
                                                                            size="icon"
                                                                            onClick={() => removeRule(index)}
                                                                            className="text-red-500 hover:text-red-600 hover:bg-red-50 h-10 w-10"
                                                                            disabled={submitting}
                                                                        >
                                                                            <Trash2 className="h-4 w-4" />
                                                                        </Button>
                                                                    </TooltipTrigger>
                                                                    <TooltipContent>Remove this rule</TooltipContent>
                                                                </Tooltip>
                                                            </div>
                                                        </div>
                                                    );
                                                })}

                                                {/* Summary */}
                                                <div className="flex items-center gap-2 text-xs text-gray-500 pt-1 px-1">
                                                    <span className="h-1.5 w-1.5 rounded-full bg-purple-400" />
                                                    Contacts matching <strong>all</strong> of the above rules will be included in this segment
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                )}

                                {/* ────── Footer ────── */}
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
                                                {isEditMode ? 'Save Changes' : 'Save Segment'}
                                            </>
                                        )}
                                    </Button>
                                </div>
                            </form>
                        </div>
                    </>
                )}
            </div>

            {/* Save Confirmation Dialog */}
            <AlertDialog open={saveModal} onOpenChange={setSaveModal}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>
                            {isEditMode ? 'Update Segment' : 'Create Segment'}
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                            Are you sure you want to {isEditMode ? 'update' : 'create'} the segment{' '}
                            <span className="font-semibold text-gray-900">"{formData.name}"</span>?
                            {isEditMode
                                ? ' This will update the existing segment record.'
                                : ' This will add a new segment to the system.'}
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={confirmSave}>
                            {isEditMode ? 'Update' : 'Create'}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </AppLayout>
    );
}
