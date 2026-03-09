import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import AppLayout from "../../layouts/AppLayout";
import { sessionLogService } from "../../services/sessionLogService";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { DetailViewSkeleton } from "../../utils/skeletonLoaders";
import { Separator } from "@/components/ui/separator";
import { ArrowLeft, Calendar, User, BookOpen, FileText, AlertCircle, UserX } from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

export default function SessionLogView() {
    const navigate = useNavigate();
    const { id } = useParams();

    const [log, setLog] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const goBack = () => navigate("/session-logs");

    const loadLog = async () => {
        setLoading(true);
        setError("");
        try {
            const response = await sessionLogService.getById(id);
            setLog(response.data);
        } catch (err) {
            setError(err?.message || "Failed to load session log");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadLog();
    }, [id]);

    const formatDate = (dateString) => {
        if (!dateString) return "—";
        return new Date(dateString).toLocaleDateString("en-US", {
            year: "numeric", month: "short", day: "numeric",
        });
    };

    const formatDateTime = (dateString) => {
        if (!dateString) return "—";
        return new Date(dateString).toLocaleString("en-US", {
            year: "numeric", month: "short", day: "numeric",
            hour: "2-digit", minute: "2-digit",
        });
    };

    const getOutcomeBadgeColor = (outcome) => {
        switch (outcome) {
            case "Completed": return "bg-emerald-600";
            case "Late":      return "bg-amber-600";
            case "Absent":    return "bg-red-600";
            default:          return "bg-gray-600";
        }
    };

    return (
        <AppLayout title="View Session Log">
            <div className="space-y-6">
                {error && (
                    <Alert variant="destructive">
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription>{error}</AlertDescription>
                    </Alert>
                )}

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
                                    <TooltipContent>Back to session logs</TooltipContent>
                                </Tooltip>
                                <div>
                                    <h1 className="text-3xl font-bold text-gray-900">Session Log Details</h1>
                                    <p className="mt-1 text-sm text-gray-600">
                                        View in-depth session log information and metadata
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Content Card */}
                        <div className="border rounded-lg bg-white overflow-hidden">
                            {/* Gradient Header */}
                            <div className="bg-gradient-to-r from-gray-50 to-gray-100 p-6 border-b">
                                <div className="flex items-start justify-between">
                                    <div className="space-y-2">
                                        <div className="flex items-center gap-3">
                                            <h2 className="text-2xl font-bold text-gray-900">{log.subjectName ?? "Session"}</h2>
                                            <Badge variant="default" className={getOutcomeBadgeColor(log.outcome)}>
                                                {log.outcome}
                                            </Badge>
                                        </div>
                                        <p className="text-gray-700 max-w-2xl">
                                            Session on {formatDate(log.sessionDate)}
                                            {log.absentParty && <> &mdash; Absent: {log.absentParty}</>}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Details Section */}
                            <div className="p-6">
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-x-6 gap-y-5">
                                    {/* Session Date */}
                                    <div className="space-y-1.5">
                                        <div className="flex items-center gap-2 text-sm font-medium text-gray-500">
                                            <Calendar className="h-4 w-4" />
                                            <span>Session Date</span>
                                        </div>
                                        <p className="text-sm text-gray-900 font-medium">{formatDate(log.sessionDate)}</p>
                                    </div>

                                    {/* Subject */}
                                    <div className="space-y-1.5">
                                        <div className="flex items-center gap-2 text-sm font-medium text-gray-500">
                                            <BookOpen className="h-4 w-4" />
                                            <span>Subject</span>
                                        </div>
                                        <p className="text-sm text-gray-900 font-medium">{log.subjectName ?? "—"}</p>
                                    </div>

                                    {/* Absent Party */}
                                    <div className="space-y-1.5">
                                        <div className="flex items-center gap-2 text-sm font-medium text-gray-500">
                                            <UserX className="h-4 w-4" />
                                            <span>Absent Party</span>
                                        </div>
                                        <p className="text-sm text-gray-900 font-medium">{log.absentParty ?? "—"}</p>
                                    </div>

                                    {/* Notes */}
                                    <div className="space-y-1.5 md:col-span-3">
                                        <div className="flex items-center gap-2 text-sm font-medium text-gray-500">
                                            <FileText className="h-4 w-4" />
                                            <span>Notes</span>
                                        </div>
                                        <p className="text-sm text-gray-900">{log.notes || <span className="italic text-gray-400">No notes recorded</span>}</p>
                                    </div>

                                    {/* Logged By */}
                                    <div className="space-y-1.5">
                                        <div className="flex items-center gap-2 text-sm font-medium text-gray-500">
                                            <User className="h-4 w-4" />
                                            <span>Logged By</span>
                                        </div>
                                        <p className="text-sm text-gray-900 font-medium">{log.createdByName ?? "—"}</p>
                                    </div>

                                    {/* Logged At */}
                                    <div className="space-y-1.5">
                                        <div className="flex items-center gap-2 text-sm font-medium text-gray-500">
                                            <Calendar className="h-4 w-4" />
                                            <span>Logged At</span>
                                        </div>
                                        <p className="text-sm text-gray-900">{formatDateTime(log.createdAt)}</p>
                                        <p className="text-xs text-gray-500">Exact time of entry</p>
                                    </div>
                                </div>

                                <Separator className="my-6" />

                                <div className="flex items-center justify-end gap-3">
                                    <Button variant="outline" onClick={goBack}>
                                        Close Details
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </div>
                ) : (
                    !error && (
                        <Alert>
                            <AlertCircle className="h-4 w-4" />
                            <AlertDescription>Session log not found.</AlertDescription>
                        </Alert>
                    )
                )}
            </div>
        </AppLayout>
    );
}
