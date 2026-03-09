import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import AppLayout from "../../layouts/AppLayout";
import { generatePersonalInfoPDF } from "../../utils/pdfExport";
import { auditLogService } from "../../services/auditLogService";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { DetailViewSkeleton } from "../../utils/skeletonLoaders";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Calendar, User, Box, FileText, AlertCircle } from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

export default function AuditLogView() {
    const navigate = useNavigate();
    const { id } = useParams();

    const [log, setLog] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const goBack = () => navigate("/audit-logs");

    const handlePrintPDF = () => {
        if (!log) return;

        generatePersonalInfoPDF({
            title: "Audit Log Details",
            data: log,
            fields: [
                { label: "User", key: "user" },
                { label: "Action", key: "action" },
                { label: "Module", key: "module" },
                { label: "Details", key: "details" },
                { label: "Date", key: "createdAt" },
            ],
            companyName: "Learning Flow Management System",
            headerInfo: { name: `Log #${log.id}` },
        });
    };

    const loadLog = async () => {
        setLoading(true);
        setError("");

        try {
            const response = await auditLogService.getById(id);
            setLog(response.data);
        } catch (err) {
            console.error("Error loading audit log:", err);
            setError(err.message || "Failed to load audit log");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadLog();
    }, [id]);

    const formatDateTime = (dateString) => {
        if (!dateString) return "—";
        const date = new Date(dateString);
        return date.toLocaleString("en-US", {
            year: "numeric",
            month: "short",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit",
        });
    };

    const getActionBadgeColor = (action) => {
        const act = action?.toLowerCase();
        switch (act) {
            case "create": return "bg-green-600";
            case "update": return "bg-amber-600";
            case "delete": return "bg-red-600";
            case "login": return "bg-blue-600";
            case "logout": return "bg-gray-500";
            case "restore": return "bg-purple-600";
            case "permanentdelete": return "bg-red-800";
            case "assignpermissions":
            case "assignroles": return "bg-indigo-600";
            default: return "bg-gray-600";
        }
    };

    return (
        <AppLayout title="View Activity" onPrint={log ? handlePrintPDF : undefined}>
            <div className="space-y-6">
                {/* Error */}
                {error && (
                    <Alert variant="destructive">
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription>{error}</AlertDescription>
                    </Alert>
                )}

                {/* Content */}
                {loading ? (
                    <DetailViewSkeleton fields={6} />
                ) : log ? (
                    <div className="space-y-6">
                        {/* Header */}
                        <div className="flex items-start justify-between gap-4">
                            <div className="flex items-center gap-3">
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <Button variant="outline" size="icon" onClick={goBack}>
                                            <ArrowLeft className="h-4 w-4" />
                                        </Button>
                                    </TooltipTrigger>
                                    <TooltipContent>Back to logs</TooltipContent>
                                </Tooltip>
                                <div>
                                    <h1 className="text-3xl font-bold text-gray-900">Activity Details</h1>
                                    <p className="mt-1 text-sm text-gray-600">
                                        View in-depth activity information and metadata
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Content Card */}
                        <div className="border rounded-lg bg-white overflow-hidden">
                            {/* Header Section */}
                            <div className="bg-gradient-to-r from-gray-50 to-gray-100 p-6 border-b">
                                <div className="flex items-start justify-between">
                                    <div className="space-y-2">
                                        <div className="flex items-center gap-3">
                                            <h2 className="text-2xl font-bold text-gray-900">{log.action} Action</h2>
                                            <Badge variant="default" className={getActionBadgeColor(log.action)}>
                                                {log.action}
                                            </Badge>
                                        </div>
                                        <p className="text-gray-700 max-w-2xl">{log.details}</p>
                                    </div>
                                </div>
                            </div>

                            {/* Details Section */}
                            <div className="p-6">
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-x-6 gap-y-5">
                                    {/* Performed By */}
                                    <div className="space-y-1.5">
                                        <div className="flex items-center gap-2 text-sm font-medium text-gray-500">
                                            <User className="h-4 w-4" />
                                            <span>Performed By</span>
                                        </div>
                                        <p className="text-sm text-gray-900 font-medium">{log.user}</p>
                                    </div>

                                    {/* Module */}
                                    <div className="space-y-1.5">
                                        <div className="flex items-center gap-2 text-sm font-medium text-gray-500">
                                            <Box className="h-4 w-4" />
                                            <span>System Module</span>
                                        </div>
                                        <p className="text-sm text-gray-900 font-medium">{log.module}</p>
                                    </div>

                                    {/* Date & Time */}
                                    <div className="space-y-1.5">
                                        <div className="flex items-center gap-2 text-sm font-medium text-gray-500">
                                            <Calendar className="h-4 w-4" />
                                            <span>Activity Date</span>
                                        </div>
                                        <p className="text-sm text-gray-900">{formatDateTime(log.createdAt)}</p>
                                        <p className="text-xs text-gray-500">Exact time of event</p>
                                    </div>

                                    {/* Full Description */}
                                    <div className="space-y-1.5 md:col-span-3">
                                        <div className="flex items-center gap-2 text-sm font-medium text-gray-500">
                                            <FileText className="h-4 w-4" />
                                            <span>Full Description</span>
                                        </div>
                                        <p className="text-sm text-gray-900">{log.details}</p>
                                    </div>
                                </div>

                                <Separator className="my-6" />

                                {/* Close Action */}
                                <div className="flex items-center justify-end gap-3">
                                    <Button variant="outline" onClick={goBack}>
                                        Close Details
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </div>
                ) : (
                    <Alert>
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription>Activity log not found.</AlertDescription>
                    </Alert>
                )}
            </div>
        </AppLayout>
    );
}
