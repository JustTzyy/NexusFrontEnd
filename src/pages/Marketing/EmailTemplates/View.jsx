import { useEffect, useState, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { emailTemplateService } from '../../../services/emailTemplateService';
import AppLayout from '../../../layouts/AppLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { ArrowLeft, Pencil, Code2, Eye, AlertCircle } from 'lucide-react';

export default function EmailTemplateView() {
    const navigate = useNavigate();
    const { id } = useParams();

    const [template, setTemplate] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [showCode, setShowCode] = useState(false);
    const iframeRef = useRef(null);

    useEffect(() => {
        setLoading(true);
        setError('');
        emailTemplateService
            .getById(id)
            .then((res) => setTemplate(res.data))
            .catch((err) => setError(err.message || 'Failed to load template'))
            .finally(() => setLoading(false));
    }, [id]);

    // Render preview
    useEffect(() => {
        if (iframeRef.current && template?.htmlContent) {
            const doc = iframeRef.current.contentDocument || iframeRef.current.contentWindow?.document;
            if (doc) {
                doc.open();
                doc.write(template.htmlContent);
                doc.close();
            }
        }
    }, [template, showCode]);

    const detailRows = template
        ? [
            { label: 'Template Name', value: template.name },
            { label: 'Subject', value: template.subject },
            { label: 'File Name', value: template.fileName },
            { label: 'Category', value: template.category || '—' },
            { label: 'Variables', value: template.variables || '—' },
            {
                label: 'Status',
                value: template.isActive ? 'Active' : 'Inactive',
                color: template.isActive ? 'text-green-700' : 'text-gray-500',
            },
            { label: 'Created At', value: new Date(template.createdAt).toLocaleString() },
            { label: 'Updated At', value: new Date(template.updatedAt).toLocaleString() },
            { label: 'Created By', value: template.createdByName || '—' },
            { label: 'Updated By', value: template.updatedByName || '—' },
        ]
        : [];

    return (
        <AppLayout title="Template Details">
            <div className="space-y-6">
                {/* Header */}
                <div className="flex items-start justify-between gap-4 flex-wrap">
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
                                {loading ? (
                                    <Skeleton className="h-9 w-56 inline-block" />
                                ) : (
                                    template?.name || 'Template'
                                )}
                            </h1>
                            {!loading && template && (
                                <span
                                    className={`text-sm font-medium ${template.isActive ? 'text-green-700' : 'text-gray-500'
                                        }`}
                                >
                                    {template.isActive ? 'Active' : 'Inactive'}
                                </span>
                            )}
                        </div>
                    </div>

                    {!loading && template && (
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Button
                                    onClick={() =>
                                        navigate(`/marketing/email-templates/${id}/edit`)
                                    }
                                >
                                    <Pencil className="h-4 w-4 mr-2" />
                                    Edit Template
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent>Edit this template</TooltipContent>
                        </Tooltip>
                    )}
                </div>

                {error && (
                    <Alert variant="destructive">
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription>{error}</AlertDescription>
                    </Alert>
                )}

                {loading ? (
                    <div className="space-y-4">
                        <Skeleton className="h-64 w-full" />
                        <Skeleton className="h-96 w-full" />
                    </div>
                ) : template ? (
                    <>
                        {/* Details Card */}
                        <Card>
                            <CardHeader>
                                <CardTitle>Template Details</CardTitle>
                            </CardHeader>
                            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                                {detailRows.map((row) => (
                                    <div key={row.label}>
                                        <span className="text-gray-500 block mb-1">{row.label}</span>
                                        <p className={`font-medium ${row.color || ''}`}>
                                            {row.label === 'File Name' ? (
                                                <code className="bg-gray-100 px-2 py-0.5 rounded text-xs font-mono">
                                                    {row.value}
                                                </code>
                                            ) : (
                                                row.value
                                            )}
                                        </p>
                                    </div>
                                ))}
                            </CardContent>
                        </Card>

                        <Separator />

                        {/* Email Preview / Code */}
                        <Card>
                            <CardHeader>
                                <div className="flex items-center justify-between">
                                    <CardTitle>
                                        {showCode ? 'HTML Source Code' : 'Email Preview'}
                                    </CardTitle>
                                    <div className="flex items-center bg-gray-100 rounded-lg p-1">
                                        <Tooltip>
                                            <TooltipTrigger asChild>
                                                <Button
                                                    type="button"
                                                    variant={!showCode ? 'default' : 'ghost'}
                                                    size="sm"
                                                    className={`h-8 px-3 ${!showCode ? '' : 'text-gray-600 hover:text-gray-900'}`}
                                                    onClick={() => setShowCode(false)}
                                                >
                                                    <Eye className="h-4 w-4 mr-1.5" />
                                                    Preview
                                                </Button>
                                            </TooltipTrigger>
                                            <TooltipContent>View email preview</TooltipContent>
                                        </Tooltip>
                                        <Tooltip>
                                            <TooltipTrigger asChild>
                                                <Button
                                                    type="button"
                                                    variant={showCode ? 'default' : 'ghost'}
                                                    size="sm"
                                                    className={`h-8 px-3 ${showCode ? '' : 'text-gray-600 hover:text-gray-900'}`}
                                                    onClick={() => setShowCode(true)}
                                                >
                                                    <Code2 className="h-4 w-4 mr-1.5" />
                                                    Source
                                                </Button>
                                            </TooltipTrigger>
                                            <TooltipContent>View HTML source</TooltipContent>
                                        </Tooltip>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent>
                                {template.htmlContent ? (
                                    showCode ? (
                                        <div className="border rounded-lg overflow-hidden">
                                            <pre className="bg-gray-900 text-gray-100 p-6 overflow-x-auto text-sm leading-relaxed max-h-[600px] overflow-y-auto">
                                                <code>{template.htmlContent}</code>
                                            </pre>
                                        </div>
                                    ) : (
                                        <div
                                            className="border rounded-lg overflow-hidden bg-gray-50"
                                            style={{ height: '600px' }}
                                        >
                                            {/* Browser-like top bar */}
                                            <div className="bg-gray-100 border-b px-4 py-2 flex items-center gap-2">
                                                <div className="flex gap-1.5">
                                                    <div className="w-2.5 h-2.5 rounded-full bg-red-400" />
                                                    <div className="w-2.5 h-2.5 rounded-full bg-yellow-400" />
                                                    <div className="w-2.5 h-2.5 rounded-full bg-green-400" />
                                                </div>
                                                <span className="text-xs text-gray-500 ml-2">
                                                    {template.fileName}
                                                </span>
                                            </div>
                                            <iframe
                                                ref={iframeRef}
                                                title="Email Preview"
                                                className="w-full border-0"
                                                style={{ height: 'calc(100% - 36px)', background: '#f4f4f5' }}
                                                sandbox="allow-same-origin"
                                            />
                                        </div>
                                    )
                                ) : (
                                    <p className="text-gray-400 text-center py-12">
                                        No HTML content available. The template file may not exist on the server.
                                    </p>
                                )}
                            </CardContent>
                        </Card>
                    </>
                ) : (
                    <p className="text-gray-400 text-center py-12">Template not found.</p>
                )}
            </div>
        </AppLayout>
    );
}
