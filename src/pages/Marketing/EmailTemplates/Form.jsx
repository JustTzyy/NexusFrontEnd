import { useEffect, useState, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Editor from '@monaco-editor/react';
import { emailTemplateService } from '../../../services/emailTemplateService';
import { FormSkeleton } from '../../../utils/skeletonLoaders';
import AppLayout from '../../../layouts/AppLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { ArrowLeft, Save, AlertCircle, Eye, Code2, Columns2 } from 'lucide-react';

const DEFAULT_HTML = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Email Template</title>
    <style>
        body {
            margin: 0;
            padding: 0;
            background-color: #f4f4f5;
            font-family: 'Segoe UI', Arial, sans-serif;
        }

        .wrapper {
            max-width: 600px;
            margin: 40px auto;
            background: #ffffff;
            border-radius: 12px;
            overflow: hidden;
            box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
        }

        .header {
            background: linear-gradient(135deg, #1e40af 0%, #3b82f6 100%);
            padding: 36px 40px;
            text-align: center;
        }

        .header h1 {
            margin: 0;
            color: #ffffff;
            font-size: 22px;
            font-weight: 700;
        }

        .header p {
            margin: 6px 0 0;
            color: #bfdbfe;
            font-size: 13px;
        }

        .body {
            padding: 36px 40px;
        }

        .greeting {
            font-size: 16px;
            color: #1e293b;
            font-weight: 600;
            margin-bottom: 8px;
        }

        .intro {
            font-size: 14px;
            color: #475569;
            line-height: 1.7;
            margin-bottom: 28px;
        }

        .footer {
            background: #f8fafc;
            border-top: 1px solid #e2e8f0;
            padding: 20px 40px;
            text-align: center;
        }

        .footer p {
            margin: 0;
            font-size: 12px;
            color: #94a3b8;
        }
    </style>
</head>
<body>
    <div class="wrapper">
        <div class="header">
            <h1>{{CompanyName}}</h1>
            <p>Email Notification</p>
        </div>
        <div class="body">
            <p class="greeting">Hello, {{RecipientName}}!</p>
            <p class="intro">
                Your email content goes here. Use {{VariableName}} syntax for dynamic values.
            </p>
        </div>
        <div class="footer">
            <p>&copy; {{Year}} {{CompanyName}}. All rights reserved.</p>
        </div>
    </div>
</body>
</html>`;

export default function EmailTemplateForm() {
    const navigate = useNavigate();
    const { id } = useParams();
    const isEdit = Boolean(id);

    const [loading, setLoading] = useState(isEdit);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState('');
    const [saveModal, setSaveModal] = useState(false);
    const [viewMode, setViewMode] = useState('split'); // 'editor', 'preview', 'split'
    const iframeRef = useRef(null);

    const [form, setForm] = useState({
        name: '',
        subject: '',
        htmlContent: DEFAULT_HTML,
        variables: '',
        category: 'Welcome',
        isActive: true,
    });

    useEffect(() => {
        if (isEdit) {
            setLoading(true);
            emailTemplateService
                .getById(id)
                .then((res) => {
                    const d = res.data;
                    setForm({
                        name: d.name || '',
                        subject: d.subject || '',
                        htmlContent: d.htmlContent || DEFAULT_HTML,
                        variables: d.variables || '',
                        category: d.category || 'Welcome',
                        isActive: d.isActive ?? true,
                    });
                })
                .catch((err) => {
                    setError(err.message || 'Failed to load template');
                })
                .finally(() => setLoading(false));
        }
    }, [id, isEdit]);

    // Update preview iframe whenever htmlContent changes
    useEffect(() => {
        if (iframeRef.current) {
            const doc = iframeRef.current.contentDocument || iframeRef.current.contentWindow?.document;
            if (doc) {
                doc.open();
                doc.write(form.htmlContent || '');
                doc.close();
            }
        }
    }, [form.htmlContent, viewMode]);

    const handleChange = (field, value) => {
        setForm((prev) => ({ ...prev, [field]: value }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!form.name.trim() || !form.subject.trim()) {
            setError('Name and subject are required.');
            return;
        }
        if (!form.htmlContent.trim()) {
            setError('HTML content cannot be empty.');
            return;
        }
        setError('');
        setSaveModal(true);
    };

    const confirmSave = async () => {
        setSaveModal(false);
        setSubmitting(true);
        setError('');
        try {
            const payload = {
                name: form.name,
                subject: form.subject,
                fileName: '',
                htmlContent: form.htmlContent,
                variables: form.variables,
                category: form.category,
                isActive: form.isActive,
            };

            if (isEdit) {
                await emailTemplateService.update(id, payload);
            } else {
                await emailTemplateService.create(payload);
            }
            navigate('/marketing/email-templates', {
                state: {
                    alert: {
                        type: 'success',
                        message: isEdit
                            ? `Template "${form.name}" updated successfully!`
                            : `Template "${form.name}" created successfully!`,
                    },
                },
            });
        } catch (err) {
            setError(err.response?.data?.message || err.message || 'Failed to save template');
            setSubmitting(false);
        }
    };

    const viewModeButtons = [
        { mode: 'editor', icon: Code2, label: 'Code Only' },
        { mode: 'split', icon: Columns2, label: 'Split View' },
        { mode: 'preview', icon: Eye, label: 'Preview Only' },
    ];

    return (
        <AppLayout title={isEdit ? 'Edit Template' : 'Create Template'}>
            <div className="space-y-5">
                {error && (
                    <Alert variant="destructive">
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription>{error}</AlertDescription>
                    </Alert>
                )}

                {loading ? (
                    <FormSkeleton fields={5} />
                ) : (
                    <>
                        {/* Header */}
                        <div className="flex items-center justify-between gap-3">
                            <div className="flex items-center gap-3">
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <Button
                                            variant="outline"
                                            size="icon"
                                            onClick={() => navigate('/marketing/email-templates')}
                                        >
                                            <ArrowLeft className="h-4 w-4" />
                                        </Button>
                                    </TooltipTrigger>
                                    <TooltipContent>Back to email templates</TooltipContent>
                                </Tooltip>
                                <div>
                                    <h1 className="text-3xl font-bold text-gray-900">
                                        {isEdit ? 'Edit Template' : 'Create Template'}
                                    </h1>
                                    <p className="mt-1 text-sm text-gray-600">
                                        {isEdit
                                            ? 'Update the email template content and metadata'
                                            : 'Design a new email template with the code editor'}
                                    </p>
                                </div>
                            </div>
                        </div>

                        <Separator />

                        {/* Metadata Fields */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="name">
                                    Template Name <span className="text-red-500">*</span>
                                </Label>
                                <Input
                                    id="name"
                                    value={form.name}
                                    onChange={(e) => handleChange('name', e.target.value)}
                                    disabled={submitting}
                                    required
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="subject">
                                    Subject <span className="text-red-500">*</span>
                                </Label>
                                <Input
                                    id="subject"
                                    value={form.subject}
                                    onChange={(e) => handleChange('subject', e.target.value)}
                                    disabled={submitting}
                                    required
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="variables">
                                    Variables{' '}
                                    <span className="text-gray-400 text-xs font-normal">
                                        (comma-separated)
                                    </span>
                                </Label>
                                <Input
                                    id="variables"
                                    placeholder="RecipientName,CompanyName"
                                    value={form.variables}
                                    onChange={(e) => handleChange('variables', e.target.value)}
                                    disabled={submitting}
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="category">Category</Label>
                                <Select
                                    value={form.category}
                                    onValueChange={(v) => handleChange('category', v)}
                                    disabled={submitting}
                                >
                                    <SelectTrigger id="category">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="Welcome">Welcome</SelectItem>
                                        <SelectItem value="Campaign">Campaign</SelectItem>
                                        <SelectItem value="Automation">Automation</SelectItem>
                                        <SelectItem value="Reminder">Reminder</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        <div className="flex items-center gap-3">
                            <Switch
                                id="isActive"
                                checked={form.isActive}
                                onCheckedChange={(v) => handleChange('isActive', v)}
                                disabled={submitting}
                            />
                            <Label htmlFor="isActive" className="cursor-pointer">
                                Active
                            </Label>
                        </div>

                        <Separator />

                        {/* Editor Toolbar */}
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-1">
                                <Label className="text-sm font-semibold mr-2">HTML Editor</Label>
                                <div className="flex items-center bg-gray-100 rounded-lg p-1">
                                    {viewModeButtons.map(({ mode, icon: Icon, label }) => (
                                        <Tooltip key={mode}>
                                            <TooltipTrigger asChild>
                                                <Button
                                                    type="button"
                                                    variant={viewMode === mode ? 'default' : 'ghost'}
                                                    size="sm"
                                                    className={`h-8 px-3 ${viewMode === mode ? '' : 'text-gray-600 hover:text-gray-900'}`}
                                                    onClick={() => setViewMode(mode)}
                                                >
                                                    <Icon className="h-4 w-4 mr-1.5" />
                                                    {label}
                                                </Button>
                                            </TooltipTrigger>
                                            <TooltipContent>{label}</TooltipContent>
                                        </Tooltip>
                                    ))}
                                </div>
                            </div>
                            <p className="text-xs text-gray-500">
                                Use <code className="bg-gray-100 px-1 py-0.5 rounded text-xs">{'{{VariableName}}'}</code> for dynamic content
                            </p>
                        </div>

                        {/* Editor + Preview */}
                        <div
                            className="border rounded-lg overflow-hidden bg-white"
                            style={{ height: '520px' }}
                        >
                            <div className="flex h-full">
                                {/* Code Editor */}
                                {(viewMode === 'editor' || viewMode === 'split') && (
                                    <div
                                        className={`${viewMode === 'split' ? 'w-1/2 border-r' : 'w-full'} h-full`}
                                    >
                                        <Editor
                                            height="100%"
                                            language="html"
                                            theme="vs-dark"
                                            value={form.htmlContent}
                                            onChange={(val) => handleChange('htmlContent', val || '')}
                                            options={{
                                                minimap: { enabled: false },
                                                fontSize: 13,
                                                wordWrap: 'on',
                                                lineNumbers: 'on',
                                                scrollBeyondLastLine: false,
                                                automaticLayout: true,
                                                tabSize: 4,
                                                formatOnPaste: true,
                                                suggestOnTriggerCharacters: true,
                                            }}
                                        />
                                    </div>
                                )}

                                {/* Live Preview */}
                                {(viewMode === 'preview' || viewMode === 'split') && (
                                    <div
                                        className={`${viewMode === 'split' ? 'w-1/2' : 'w-full'} h-full bg-gray-50 relative`}
                                    >
                                        <div className="absolute top-0 left-0 right-0 bg-gray-100 border-b px-4 py-1.5 flex items-center gap-2 z-10">
                                            <div className="flex gap-1.5">
                                                <div className="w-2.5 h-2.5 rounded-full bg-red-400" />
                                                <div className="w-2.5 h-2.5 rounded-full bg-yellow-400" />
                                                <div className="w-2.5 h-2.5 rounded-full bg-green-400" />
                                            </div>
                                            <span className="text-xs text-gray-500 ml-2">Preview</span>
                                        </div>
                                        <iframe
                                            ref={iframeRef}
                                            title="Email Preview"
                                            className="w-full h-full border-0 pt-8"
                                            sandbox="allow-same-origin"
                                            style={{ background: '#f4f4f5' }}
                                        />
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center justify-end gap-3">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => navigate('/marketing/email-templates')}
                                disabled={submitting}
                            >
                                Cancel
                            </Button>
                            <Button onClick={handleSubmit} disabled={submitting}>
                                {submitting ? (
                                    <>
                                        <span className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                                        Saving...
                                    </>
                                ) : (
                                    <>
                                        <Save className="h-4 w-4 mr-2" />
                                        {isEdit ? 'Save Template' : 'Create Template'}
                                    </>
                                )}
                            </Button>
                        </div>
                    </>
                )}
            </div>

            <AlertDialog open={saveModal} onOpenChange={setSaveModal}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>{isEdit ? 'Update Template' : 'Create Template'}</AlertDialogTitle>
                        <AlertDialogDescription>
                            Are you sure you want to {isEdit ? 'update' : 'create'} the template{' '}
                            <span className="font-semibold">"{form.name}"</span>?{' '}
                            {isEdit
                                ? 'This will update the template content and details.'
                                : 'This will create a new template and save the HTML file.'}
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
