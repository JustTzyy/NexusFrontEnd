import { useEffect, useState } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import AppLayout from "../../layouts/AppLayout";
import { generatePersonalInfoPDF } from "../../utils/pdfExport";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { DetailViewSkeleton } from "../../utils/skeletonLoaders";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Calendar, User, Building2, BookOpen, AlertCircle, ArrowRight } from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

const STATUS_CONFIG = {
    "Pending Teacher Interest":     { color: "bg-indigo-100 text-indigo-700",  label: "Pending Teacher Interest" },
    "Teacher Assigned":             { color: "bg-purple-100 text-purple-700",  label: "Teacher Assigned" },
    "Waiting for Teacher Approval": { color: "bg-amber-100 text-amber-700",    label: "Waiting for Teacher Approval" },
    "Waiting for Admin Approval":   { color: "bg-orange-100 text-orange-700",  label: "Waiting for Admin Approval" },
    "Confirmed":                    { color: "bg-emerald-100 text-emerald-700", label: "Confirmed" },
    "Cancelled by Student":         { color: "bg-gray-100 text-gray-500",       label: "Cancelled by Student" },
    "Cancelled by Admin":           { color: "bg-red-100 text-red-600",         label: "Cancelled by Admin" },
};

const ROLE_COLOR = {
    Student: "bg-blue-600",
    Teacher: "bg-violet-600",
    Admin:   "bg-rose-600",
    System:  "bg-gray-500",
};

const getStatusConfig = (s) =>
    STATUS_CONFIG[s] || { color: "bg-gray-100 text-gray-600", label: s || "—" };

const formatDateTime = (dateString) => {
    if (!dateString) return "—";
    return new Date(dateString).toLocaleString("en-US", {
        year: "numeric", month: "long", day: "numeric",
        hour: "2-digit", minute: "2-digit",
    });
};

export default function StudentRequestHistoryView() {
    const navigate = useNavigate();
    const { id } = useParams();
    const location = useLocation();

    const [item] = useState(location.state?.item || null);
    const [loading] = useState(false);
    const [error, setError] = useState("");

    const goBack = () => navigate("/schedule-configuration/log");

    useEffect(() => {
        if (!location.state?.item) {
            setError("Entry not found. Please go back and select a record.");
        }
    }, [location.state]);

    const handlePrintPDF = () => {
        if (!item) return;
        generatePersonalInfoPDF({
            title: "Student Request History Details",
            data: {
                ...item,
                changedAt: formatDateTime(item.changedAt),
                fromStatus: item.fromStatus || "Initial",
            },
            fields: [
                { label: "Changed By",  key: "changedByName" },
                { label: "Role",        key: "changedByRole" },
                { label: "Subject",     key: "subjectName" },
                { label: "Building",    key: "buildingName" },
                { label: "Student",     key: "studentName" },
                { label: "From Status", key: "fromStatus" },
                { label: "To Status",   key: "toStatus" },
                { label: "Date & Time", key: "changedAt" },
            ],
            companyName: "Learning Flow Management System",
            headerInfo: { name: `Entry #${id}` },
        });
    };

    const fromCfg   = getStatusConfig(item?.fromStatus);
    const toCfg     = getStatusConfig(item?.toStatus);
    const roleColor = ROLE_COLOR[item?.changedByRole] || "bg-gray-500";

    return (
        <AppLayout title="View Entry" onPrint={item ? handlePrintPDF : undefined}>
            <div className="space-y-6">
                {error && (
                    <Alert variant="destructive">
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription>{error}</AlertDescription>
                    </Alert>
                )}

                {loading ? (
                    <DetailViewSkeleton fields={6} />
                ) : item ? (
                    <div className="space-y-6">
                        <div className="flex items-start justify-between gap-4">
                            <div className="flex items-center gap-3">
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <Button variant="outline" size="icon" onClick={goBack}>
                                            <ArrowLeft className="h-4 w-4" />
                                        </Button>
                                    </TooltipTrigger>
                                    <TooltipContent>Back to student request log</TooltipContent>
                                </Tooltip>
                                <div>
                                    <h1 className="text-3xl font-bold text-gray-900">Entry Details</h1>
                                    <p className="mt-1 text-sm text-gray-600">
                                        Full details of this status change event
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="border rounded-lg bg-white overflow-hidden">
                            <div className="bg-gradient-to-r from-gray-50 to-gray-100 p-6 border-b">
                                <div className="space-y-3">
                                    <div className="flex items-center gap-3 flex-wrap">
                                        <h2 className="text-2xl font-bold text-gray-900">Status Transition</h2>
                                        <Badge variant="default" className={`${roleColor} text-white`}>
                                            {item.changedByRole}
                                        </Badge>
                                    </div>
                                    <div className="flex items-center gap-2 flex-wrap">
                                        <span className={`text-[11px] font-semibold tracking-wide px-2.5 py-1 rounded-full ${fromCfg.color}`}>
                                            {item.fromStatus || "Initial"}
                                        </span>
                                        <ArrowRight className="h-4 w-4 text-gray-400 flex-shrink-0" />
                                        <span className={`text-[11px] font-semibold tracking-wide px-2.5 py-1 rounded-full ${toCfg.color}`}>
                                            {toCfg.label}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            <div className="p-6">
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-x-6 gap-y-5">
                                    <div className="space-y-1.5">
                                        <div className="flex items-center gap-2 text-sm font-medium text-gray-500">
                                            <User className="h-4 w-4" />
                                            <span>Changed By</span>
                                        </div>
                                        <p className="text-sm text-gray-900 font-medium">{item.changedByName || "—"}</p>
                                        <p className="text-xs text-gray-500">{item.changedByRole}</p>
                                    </div>

                                    <div className="space-y-1.5">
                                        <div className="flex items-center gap-2 text-sm font-medium text-gray-500">
                                            <BookOpen className="h-4 w-4" />
                                            <span>Subject</span>
                                        </div>
                                        <p className="text-sm text-gray-900 font-medium">{item.subjectName}</p>
                                    </div>

                                    <div className="space-y-1.5">
                                        <div className="flex items-center gap-2 text-sm font-medium text-gray-500">
                                            <Building2 className="h-4 w-4" />
                                            <span>Building</span>
                                        </div>
                                        <p className="text-sm text-gray-900 font-medium">{item.buildingName}</p>
                                    </div>

                                    {item.studentName && (
                                        <div className="space-y-1.5">
                                            <div className="flex items-center gap-2 text-sm font-medium text-gray-500">
                                                <User className="h-4 w-4" />
                                                <span>Student</span>
                                            </div>
                                            <p className="text-sm text-gray-900 font-medium">{item.studentName}</p>
                                        </div>
                                    )}

                                    <div className="space-y-1.5">
                                        <div className="flex items-center gap-2 text-sm font-medium text-gray-500">
                                            <Calendar className="h-4 w-4" />
                                            <span>Date & Time</span>
                                        </div>
                                        <p className="text-sm text-gray-900">{formatDateTime(item.changedAt)}</p>
                                        <p className="text-xs text-gray-500">Exact time of status change</p>
                                    </div>

                                    <div className="space-y-1.5">
                                        <div className="flex items-center gap-2 text-sm font-medium text-gray-500">
                                            <span className="text-xs font-mono">#</span>
                                            <span>Request ID</span>
                                        </div>
                                        <p className="text-sm text-gray-900 font-mono">#{item.tutoringRequestId}</p>
                                    </div>
                                </div>

                                <Separator className="my-6" />

                                <div className="flex items-center justify-end gap-3">
                                    <Button variant="outline" onClick={goBack}>Close Details</Button>
                                </div>
                            </div>
                        </div>
                    </div>
                ) : (
                    !error && (
                        <Alert>
                            <AlertCircle className="h-4 w-4" />
                            <AlertDescription>Entry not found.</AlertDescription>
                        </Alert>
                    )
                )}
            </div>
        </AppLayout>
    );
}
