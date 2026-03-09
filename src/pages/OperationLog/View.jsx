import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import AppLayout from "../../layouts/AppLayout";
import { generatePersonalInfoPDF } from "../../utils/pdfExport";
import { operationLogService } from "../../services/operationLogService";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { DetailViewSkeleton } from "../../utils/skeletonLoaders";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Calendar, User, Monitor, Globe, Wifi, Shield, AlertCircle } from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

export default function OperationLogView() {
    const navigate = useNavigate();
    const { id } = useParams();

    const [log, setLog] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const goBack = () => navigate("/operation-logs");

    const handlePrintPDF = () => {
        if (!log) return;

        generatePersonalInfoPDF({
            title: "Operation Log Details",
            data: {
                ...log,
                createdAt: formatDateTime(log.createdAt),
            },
            fields: [
                { label: "User", key: "user" },
                { label: "Action", key: "action" },
                { label: "Status", key: "status" },
                { label: "IP Address", key: "ipAddress" },
                { label: "Device", key: "device" },
                { label: "Location", key: "location" },
                { label: "Date", key: "createdAt" },
            ],
            companyName: "Learning Flow Management System",
            headerInfo: { name: `Operation Log #${log.id}` },
        });
    };

    const loadLog = async () => {
        setLoading(true);
        setError("");

        try {
            const response = await operationLogService.getById(id);
            setLog(response.data);
        } catch (err) {
            console.error("Error loading operation log:", err);
            setError(err.message || "Failed to load operation log");
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

    const getActionBadgeColor = (act) => {
        switch (act?.toLowerCase()) {
            case "login": return "bg-blue-600";
            case "logout": return "bg-gray-500";
            case "failed_login": return "bg-red-600";
            default: return "bg-gray-600";
        }
    };

    const getActionLabel = (act) => {
        switch (act?.toLowerCase()) {
            case "login": return "Login";
            case "logout": return "Logout";
            case "failed_login": return "Failed Login";
            default: return act;
        }
    };

    const getStatusBadgeColor = (st) => {
        if (st?.toLowerCase() === "success") return "bg-green-600";
        return "bg-red-600";
    };

    return (
        <AppLayout title="View Operation" onPrint={log ? handlePrintPDF : undefined}>
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
                    <DetailViewSkeleton fields={7} />
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
                                    <h1 className="text-3xl font-bold text-gray-900">Operation Details</h1>
                                    <p className="mt-1 text-sm text-gray-600">
                                        View in-depth authentication activity information
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
                                            <h2 className="text-2xl font-bold text-gray-900">{getActionLabel(log.action)} Activity</h2>
                                            <Badge variant="default" className={getActionBadgeColor(log.action)}>
                                                {getActionLabel(log.action)}
                                            </Badge>
                                            <Badge variant="default" className={getStatusBadgeColor(log.status)}>
                                                {log.status}
                                            </Badge>
                                        </div>
                                        <p className="text-gray-700">
                                            {log.user || "Unknown"} — {formatDateTime(log.createdAt)}
                                        </p>
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
                                        <p className="text-sm text-gray-900 font-medium">{log.user || "Unknown"}</p>
                                    </div>

                                    {/* Action */}
                                    <div className="space-y-1.5">
                                        <div className="flex items-center gap-2 text-sm font-medium text-gray-500">
                                            <Shield className="h-4 w-4" />
                                            <span>Action</span>
                                        </div>
                                        <Badge variant="default" className={getActionBadgeColor(log.action)}>
                                            {getActionLabel(log.action)}
                                        </Badge>
                                    </div>

                                    {/* Status */}
                                    <div className="space-y-1.5">
                                        <div className="flex items-center gap-2 text-sm font-medium text-gray-500">
                                            <Shield className="h-4 w-4" />
                                            <span>Status</span>
                                        </div>
                                        <Badge variant="default" className={getStatusBadgeColor(log.status)}>
                                            {log.status}
                                        </Badge>
                                    </div>

                                    {/* IP Address */}
                                    <div className="space-y-1.5">
                                        <div className="flex items-center gap-2 text-sm font-medium text-gray-500">
                                            <Wifi className="h-4 w-4" />
                                            <span>IP Address</span>
                                        </div>
                                        <p className="text-sm text-gray-900 font-mono">{log.ipAddress || "—"}</p>
                                    </div>

                                    {/* Device / Browser */}
                                    <div className="space-y-1.5 md:col-span-2">
                                        <div className="flex items-center gap-2 text-sm font-medium text-gray-500">
                                            <Monitor className="h-4 w-4" />
                                            <span>Device / Browser</span>
                                        </div>
                                        <p className="text-sm text-gray-900 break-all">{log.device || "—"}</p>
                                    </div>

                                    {/* Location */}
                                    <div className="space-y-1.5">
                                        <div className="flex items-center gap-2 text-sm font-medium text-gray-500">
                                            <Globe className="h-4 w-4" />
                                            <span>Location</span>
                                        </div>
                                        <p className="text-sm text-gray-900">{log.location || "—"}</p>
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
                        <AlertDescription>Operation log not found.</AlertDescription>
                    </Alert>
                )}
            </div>
        </AppLayout>
    );
}
