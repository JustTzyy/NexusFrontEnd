import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { tutoringRequestService } from "../../services/tutoringRequestService";
import AppLayout from "../../layouts/AppLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { DetailViewSkeleton } from "../../utils/skeletonLoaders";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Textarea } from "@/components/ui/textarea";
import {
    ArrowLeft, AlertCircle, BookOpen, Building2, GraduationCap, Clock, DoorOpen,
    Calendar, FileText, Flag, MessageCircle, CalendarClock, Users, XCircle,
    ChevronRight, CheckCircle2, Info, User, RotateCcw
} from "lucide-react";

/* ==================== Status configuration ==================== */
const STATUS_ORDER = [
    "Pending Teacher Interest",
    "Waiting for Admin Approval",
    "Teacher Assigned",
    "Waiting for Teacher Approval",
    "Confirmed",
];

const ADMIN_CREATED_STATUS_ORDER = [
    "Pending Teacher Interest",
    "Waiting for Admin Approval",
    "Teacher Assigned",
    "Waiting for Teacher Approval",
    "Pending Student Interest",
    "Confirmed",
];

const STATUS_CONFIG = {
    "Pending Teacher Interest": {
        step: 0,
        color: "bg-orange-600",
        badgeClass: "bg-orange-50 text-orange-700 ring-1 ring-orange-200",
        label: "Pending",
        message: "The request has been submitted. Waiting for teachers to express interest.",
        icon: Clock,
    },
    "Waiting for Admin Approval": {
        step: 1,
        color: "bg-blue-600",
        badgeClass: "bg-blue-50 text-blue-700 ring-1 ring-blue-200",
        label: "In Review",
        message: "A teacher has shown interest. Assign a teacher and schedule the session.",
        icon: Info,
    },
    "Teacher Assigned": {
        step: 2,
        color: "bg-indigo-600",
        badgeClass: "bg-indigo-50 text-indigo-700 ring-1 ring-indigo-200",
        label: "Teacher Assigned",
        message: "A teacher has been assigned. Complete the scheduling to proceed.",
        icon: User,
    },
    "Waiting for Teacher Approval": {
        step: 3,
        color: "bg-purple-600",
        badgeClass: "bg-purple-50 text-purple-700 ring-1 ring-purple-200",
        label: "Awaiting Confirmation",
        message: "Schedule is set. Waiting for the teacher to confirm the session.",
        icon: Clock,
    },
    "Confirmed": {
        step: 4,
        color: "bg-emerald-600",
        badgeClass: "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200",
        label: "Confirmed",
        message: "The tutoring session is confirmed and scheduled.",
        icon: CheckCircle2,
    },
    "Pending Student Interest": {
        step: 4,
        color: "bg-cyan-600",
        badgeClass: "bg-cyan-50 text-cyan-700 ring-1 ring-cyan-200",
        label: "Awaiting Student",
        message: "Teacher confirmed. Waiting for a student to enroll in this session.",
        icon: Clock,
    },
    "Cancelled by Student": {
        step: -1,
        color: "bg-gray-500",
        badgeClass: "bg-gray-50 text-gray-500 ring-1 ring-gray-200",
        label: "Cancelled",
        message: "This request was cancelled by the student.",
        icon: XCircle,
    },
    "Cancelled by Admin": {
        step: -1,
        color: "bg-red-600",
        badgeClass: "bg-red-50 text-red-600 ring-1 ring-red-200",
        label: "Cancelled by Admin",
        message: "This request was cancelled by an administrator.",
        icon: XCircle,
    },
};

const PRIORITY_COLOR = {
    High: "text-red-600 bg-red-50",
    Normal: "text-orange-600 bg-orange-50",
    Low: "text-gray-500 bg-gray-50",
};

const getConfig = (status) => STATUS_CONFIG[status] || STATUS_CONFIG["Pending Teacher Interest"];
const isCancelled = (s) => s?.startsWith("Cancelled");

const getInterestStatusStyle = (status) => {
    switch (status) {
        case "Selected": return "bg-green-100 text-green-700 border-green-200";
        case "Declined": return "bg-red-100 text-red-700 border-red-200";
        case "Withdrawn": return "bg-orange-100 text-orange-700 border-orange-200";
        case "Closed": return "bg-gray-100 text-gray-500";
        case "Interested":
        default: return "bg-blue-100 text-blue-700 border-blue-200";
    }
};

export default function AdminSchedulingView() {
    const { id } = useParams();
    const navigate = useNavigate();

    const [request, setRequest] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [cancelDialog, setCancelDialog] = useState(false);
    const [cancellationReason, setCancellationReason] = useState("");
    const [cancelling, setCancelling] = useState(false);
    const [restoreDialog, setRestoreDialog] = useState(false);
    const [restoring, setRestoring] = useState(false);

    useEffect(() => {
        const load = async () => {
            try {
                const res = await tutoringRequestService.getById(id);
                const data = res.data?.data || res.data;
                if (!data) throw new Error("Request not found");
                setRequest(data);
            } catch (err) {
                setError(err.response?.data?.message || err.message);
            } finally {
                setLoading(false);
            }
        };
        load();
    }, [id]);

    const canSchedule =
        request?.status === "Waiting for Admin Approval" ||
        request?.status === "Teacher Assigned" ||
        request?.status === "Pending Teacher Interest";
    const canCancel = request && !isCancelled(request.status);

    const statusOrder = request?.isAdminCreated ? ADMIN_CREATED_STATUS_ORDER : STATUS_ORDER;

    const interestedTeachers = (request?.interestedTeachers || []).filter(
        (t) => t.status === "Interested" || t.status === "Selected"
    );

    const currentStepValue = request ? getConfig(request.status).step : 0;
    const currentStep = request?.isAdminCreated && request.status === "Pending Student Interest" ? 4
        : request?.isAdminCreated && request.status === "Confirmed" ? 5
            : currentStepValue;
    const showSchedule = request && currentStepValue >= 3;
    const showTeacher = request && (currentStepValue >= 2 || request.assignedTeacherName);

    const handleSelectTeacher = (teacher) => {
        navigate(`/admin-scheduling/${id}/schedule`, {
            state: { selectedTeacher: teacher },
        });
    };

    const handleAdminCancel = async () => {
        if (!cancellationReason.trim()) return;
        setCancelling(true);
        try {
            await tutoringRequestService.adminCancel(id, cancellationReason);
            setCancelDialog(false);
            setCancellationReason("");
            navigate("/admin-scheduling", {
                state: { alert: { type: "success", message: `Request for "${request.subjectName}" cancelled.` } },
            });
        } catch (err) {
            setError(err.response?.data?.message || "Failed to cancel request");
            setCancelDialog(false);
            setCancelling(false);
        }
    };

    const handleAdminRestore = async () => {
        setRestoring(true);
        try {
            await tutoringRequestService.adminRestore(id);
            setRestoreDialog(false);
            navigate("/admin-scheduling", {
                state: { alert: { type: "success", message: `Request for "${request.subjectName}" restored to Pending Teacher Interest.` } },
            });
        } catch (err) {
            setError(err.response?.data?.message || "Failed to restore request");
            setRestoreDialog(false);
            setRestoring(false);
        }
    };

    return (
        <AppLayout title="Request Details">
            <div className="space-y-6">
                {error && (
                    <Alert variant="destructive">
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription>{error}</AlertDescription>
                    </Alert>
                )}

                {loading ? (
                    <DetailViewSkeleton fields={8} />
                ) : request ? (
                    <div className="space-y-6">
                        {/* Header */}
                        <div className="flex items-start justify-between gap-4">
                            <div className="flex items-center gap-3">
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <Button variant="outline" size="icon" onClick={() => navigate(-1)}>
                                            <ArrowLeft className="h-4 w-4" />
                                        </Button>
                                    </TooltipTrigger>
                                    <TooltipContent>Go back</TooltipContent>
                                </Tooltip>
                                <div>
                                    <h1 className="text-3xl font-bold text-gray-900">Request Details</h1>
                                    <p className="mt-1 text-sm text-gray-600">
                                        #{id} &middot; {request.subjectName}
                                    </p>
                                </div>
                            </div>

                            {/* Actions */}
                            <div className="flex items-center gap-2">
                                {(request?.status === "Cancelled by Admin" || request?.status === "Cancelled by Student") && (
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => setRestoreDialog(true)}
                                        className="text-indigo-600 border-indigo-200 hover:bg-indigo-50"
                                    >
                                        <RotateCcw className="h-4 w-4 mr-2" />
                                        Restore
                                    </Button>
                                )}
                                {canCancel && (
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => setCancelDialog(true)}
                                        className="text-red-600 border-red-200 hover:bg-red-50"
                                    >
                                        <XCircle className="h-4 w-4 mr-2" />
                                        Cancel Request
                                    </Button>
                                )}
                            </div>
                        </div>

                        {/* Status Progress Tracker (not shown for cancelled) */}
                        {!isCancelled(request.status) && (
                            <div className="border rounded-xl bg-white p-6">
                                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4">Progress</p>
                                <div className="flex items-center gap-0">
                                    {statusOrder.map((statusKey, idx) => {
                                        const isCompleted = currentStep > idx;
                                        const isCurrent = currentStep === idx;

                                        return (
                                            <div key={statusKey} className="flex items-center flex-1 last:flex-none">
                                                {/* Step circle */}
                                                <div className="flex flex-col items-center">
                                                    <div
                                                        className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-300 ${isCompleted
                                                            ? "bg-emerald-500 text-white"
                                                            : isCurrent
                                                                ? `${getConfig(statusKey).color} text-white ring-4 ring-offset-2 ring-opacity-30 ${getConfig(statusKey).color.replace("bg-", "ring-")}`
                                                                : "bg-gray-100 text-gray-400"
                                                            }`}
                                                    >
                                                        {isCompleted ? (
                                                            <CheckCircle2 className="h-4 w-4" />
                                                        ) : (
                                                            idx + 1
                                                        )}
                                                    </div>
                                                    <span className={`text-[10px] mt-1.5 text-center max-w-[80px] leading-tight ${isCurrent ? "font-semibold text-gray-900" :
                                                        isCompleted ? "text-emerald-600 font-medium" :
                                                            "text-gray-400"
                                                        }`}>
                                                        {STATUS_CONFIG[statusKey].label}
                                                    </span>
                                                </div>

                                                {/* Connector line */}
                                                {idx < statusOrder.length - 1 && (
                                                    <div className={`flex-1 h-0.5 mx-1 mt-[-16px] transition-all duration-300 ${isCompleted ? "bg-emerald-400" : "bg-gray-200"
                                                        }`} />
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        )}

                        {/* Status Message */}
                        {(() => {
                            const cfg = getConfig(request.status);
                            const StatusIcon = cfg.icon;
                            const isCancelledStatus = isCancelled(request.status);
                            return (
                                <div className={`rounded-xl p-5 flex items-start gap-4 ${isCancelledStatus
                                    ? "bg-gray-50 border border-gray-200"
                                    : request.status === "Confirmed"
                                        ? "bg-emerald-50 border border-emerald-200"
                                        : "bg-blue-50 border border-blue-200"
                                    }`}>
                                    <StatusIcon className={`h-5 w-5 mt-0.5 flex-shrink-0 ${isCancelledStatus ? "text-gray-500" :
                                        request.status === "Confirmed" ? "text-emerald-600" :
                                            "text-blue-600"
                                        }`} />
                                    <div>
                                        <p className={`text-sm font-semibold ${isCancelledStatus ? "text-gray-700" :
                                            request.status === "Confirmed" ? "text-emerald-800" :
                                                "text-blue-800"
                                            }`}>
                                            {cfg.label}
                                        </p>
                                        <p className={`text-sm mt-0.5 ${isCancelledStatus ? "text-gray-600" :
                                            request.status === "Confirmed" ? "text-emerald-700" :
                                                "text-blue-700"
                                            }`}>
                                            {cfg.message}
                                        </p>
                                    </div>
                                </div>
                            );
                        })()}

                        {/* Request Details Card */}
                        <div className="border rounded-xl bg-white overflow-hidden">
                            <div className="bg-gradient-to-r from-gray-50 to-gray-100 px-6 py-4 border-b">
                                <div className="flex items-center justify-between">
                                    <h2 className="text-lg font-bold text-gray-900">Request Information</h2>
                                    <Badge className={getConfig(request.status).badgeClass}>
                                        {getConfig(request.status).label}
                                    </Badge>
                                </div>
                            </div>

                            <div className="p-6">
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-x-6 gap-y-5">
                                    {/* Subject */}
                                    <div className="space-y-1.5">
                                        <div className="flex items-center gap-2 text-sm font-medium text-gray-500">
                                            <BookOpen className="h-4 w-4" />
                                            <span>Subject</span>
                                        </div>
                                        <p className="text-sm text-gray-900 font-medium">{request.subjectName}</p>
                                    </div>

                                    {/* Building */}
                                    <div className="space-y-1.5">
                                        <div className="flex items-center gap-2 text-sm font-medium text-gray-500">
                                            <Building2 className="h-4 w-4" />
                                            <span>Building</span>
                                        </div>
                                        <p className="text-sm text-gray-900 font-medium">{request.buildingName}</p>
                                    </div>

                                    {/* Department */}
                                    <div className="space-y-1.5">
                                        <div className="flex items-center gap-2 text-sm font-medium text-gray-500">
                                            <FileText className="h-4 w-4" />
                                            <span>Department</span>
                                        </div>
                                        <p className="text-sm text-gray-900 font-medium">{request.departmentName}</p>
                                    </div>

                                    {/* Student */}
                                    <div className="space-y-1.5">
                                        <div className="flex items-center gap-2 text-sm font-medium text-gray-500">
                                            <GraduationCap className="h-4 w-4" />
                                            <span>Student</span>
                                        </div>
                                        {request.studentName ? (
                                            <p className="text-sm text-gray-900 font-medium">{request.studentName}</p>
                                        ) : (
                                            <span className="inline-flex items-center gap-1.5 text-sm text-cyan-700 bg-cyan-50 px-2.5 py-1 rounded-full font-medium">
                                                <Clock className="h-3.5 w-3.5" />
                                                Awaiting enrollment
                                            </span>
                                        )}
                                    </div>

                                    {/* Admin Created Badge */}
                                    {request.isAdminCreated && (
                                        <div className="space-y-1.5">
                                            <div className="flex items-center gap-2 text-sm font-medium text-gray-500">
                                                <Info className="h-4 w-4" />
                                                <span>Request Type</span>
                                            </div>
                                            <Badge className="bg-violet-50 text-violet-700 ring-1 ring-violet-200">
                                                Admin Created
                                            </Badge>
                                        </div>
                                    )}

                                    {/* Priority */}
                                    <div className="space-y-1.5">
                                        <div className="flex items-center gap-2 text-sm font-medium text-gray-500">
                                            <Flag className="h-4 w-4" />
                                            <span>Priority</span>
                                        </div>
                                        <span className={`inline-flex text-xs font-semibold px-2.5 py-1 rounded-full ${PRIORITY_COLOR[request.priority] || "text-gray-600 bg-gray-50"}`}>
                                            {request.priority}
                                        </span>
                                    </div>

                                    {/* Created At */}
                                    <div className="space-y-1.5">
                                        <div className="flex items-center gap-2 text-sm font-medium text-gray-500">
                                            <Calendar className="h-4 w-4" />
                                            <span>Created</span>
                                        </div>
                                        <p className="text-sm text-gray-900">
                                            {request.createdAt ? new Date(request.createdAt).toLocaleDateString() : "—"}
                                        </p>
                                    </div>

                                    {/* Assigned Teacher */}
                                    {showTeacher && (
                                        <div className="space-y-1.5">
                                            <div className="flex items-center gap-2 text-sm font-medium text-gray-500">
                                                <User className="h-4 w-4" />
                                                <span>Assigned Teacher</span>
                                            </div>
                                            <p className="text-sm text-gray-900 font-medium">
                                                {request.assignedTeacherName || "—"}
                                            </p>
                                        </div>
                                    )}

                                    {/* Message */}
                                    {request.message && (
                                        <div className="space-y-1.5 md:col-span-3">
                                            <div className="flex items-center gap-2 text-sm font-medium text-gray-500">
                                                <MessageCircle className="h-4 w-4" />
                                                <span>{request.isAdminCreated ? "Admin's Message" : "Student's Message"}</span>
                                            </div>
                                            <p className="text-sm text-gray-900 leading-relaxed bg-gray-50 p-3 rounded-lg">
                                                {request.message}
                                            </p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Schedule Section — only visible when status >= "Waiting for Teacher Approval" */}
                        {showSchedule && (
                            <div className="border rounded-xl bg-white overflow-hidden">
                                <div className="bg-gradient-to-r from-indigo-50 to-purple-50 px-6 py-4 border-b">
                                    <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                                        <Calendar className="h-5 w-5 text-indigo-500" />
                                        Schedule Details
                                    </h2>
                                </div>

                                <div className="p-6">
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                                        {/* Room */}
                                        <div className="space-y-1.5">
                                            <div className="flex items-center gap-2 text-sm font-medium text-gray-500">
                                                <DoorOpen className="h-4 w-4" />
                                                <span>Room</span>
                                            </div>
                                            <p className="text-sm text-gray-900 font-medium">{request.roomName || "—"}</p>
                                        </div>

                                        {/* Day */}
                                        <div className="space-y-1.5">
                                            <div className="flex items-center gap-2 text-sm font-medium text-gray-500">
                                                <Calendar className="h-4 w-4" />
                                                <span>Day</span>
                                            </div>
                                            <p className="text-sm text-gray-900 font-medium">{request.dayName || "—"}</p>
                                        </div>

                                        {/* Time Slot */}
                                        <div className="space-y-1.5">
                                            <div className="flex items-center gap-2 text-sm font-medium text-gray-500">
                                                <Clock className="h-4 w-4" />
                                                <span>Time Slot</span>
                                            </div>
                                            <p className="text-sm text-gray-900 font-medium">{request.timeSlotLabel || "—"}</p>
                                        </div>

                                        {/* Teacher */}
                                        <div className="space-y-1.5">
                                            <div className="flex items-center gap-2 text-sm font-medium text-gray-500">
                                                <User className="h-4 w-4" />
                                                <span>Teacher</span>
                                            </div>
                                            <p className="text-sm text-gray-900 font-medium">{request.assignedTeacherName || "—"}</p>
                                        </div>
                                    </div>

                                    {request.confirmedAt && (
                                        <>
                                            <Separator className="my-4" />
                                            <div className="flex items-center gap-2 text-sm">
                                                <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                                                <span className="text-emerald-700 font-medium">
                                                    Confirmed on {new Date(request.confirmedAt).toLocaleDateString()}
                                                </span>
                                            </div>
                                        </>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Interested Teachers */}
                        {request.interestedTeachers && request.interestedTeachers.length > 0 && (
                            <div className="border rounded-xl bg-white overflow-hidden">
                                <div className="bg-gradient-to-r from-amber-50 to-orange-50 px-6 py-4 border-b">
                                    <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                                        <Users className="h-5 w-5 text-amber-600" />
                                        Interested Teachers ({request.interestedTeachers.length})
                                    </h2>
                                </div>

                                <div className="p-6">
                                    {canSchedule && interestedTeachers.length > 0 && (
                                        <p className="text-sm text-gray-500 mb-4">
                                            Click a teacher to select them and proceed to scheduling.
                                        </p>
                                    )}

                                    <div className="space-y-2">
                                        {request.interestedTeachers.map((t) => {
                                            const isSelectable = canSchedule && (t.status === "Interested" || t.status === "Selected");
                                            return (
                                                <div
                                                    key={t.id}
                                                    className={`flex items-center justify-between p-4 rounded-lg border transition-all duration-200 ${isSelectable
                                                        ? "bg-white hover:bg-indigo-50 hover:border-indigo-300 cursor-pointer group"
                                                        : "bg-gray-50"
                                                        }`}
                                                    onClick={() => isSelectable && handleSelectTeacher(t)}
                                                >
                                                    <div className="flex items-center gap-3">
                                                        <div className={`h-10 w-10 rounded-full flex items-center justify-center ${isSelectable
                                                            ? "bg-indigo-100 group-hover:bg-indigo-200 transition-colors"
                                                            : "bg-gray-100"
                                                            }`}>
                                                            <GraduationCap className={`h-5 w-5 ${isSelectable ? "text-indigo-600" : "text-gray-400"}`} />
                                                        </div>
                                                        <div>
                                                            <p className={`font-medium ${isSelectable ? "text-gray-900 group-hover:text-indigo-700" : "text-gray-600"}`}>
                                                                {t.teacherName}
                                                            </p>
                                                            <p className="text-xs text-gray-500">
                                                                Expressed interest on {t.createdAt ? new Date(t.createdAt).toLocaleDateString() : "—"}
                                                            </p>
                                                            {t.description && (
                                                                <p className="text-sm text-gray-600 mt-1 italic">"{t.description}"</p>
                                                            )}
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center gap-3">
                                                        <Badge variant="outline" className={getInterestStatusStyle(t.status)}>{t.status}</Badge>
                                                        {isSelectable && (
                                                            <div className="flex items-center gap-1 text-sm font-medium text-indigo-600 opacity-0 group-hover:opacity-100 transition-opacity">
                                                                <span>Select</span>
                                                                <ChevronRight className="h-4 w-4" />
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* No teachers yet */}
                        {canSchedule && interestedTeachers.length === 0 && (
                            <div className="border rounded-xl bg-white p-6 text-center">
                                <Users className="h-10 w-10 text-gray-300 mx-auto mb-3" />
                                <p className="font-medium text-gray-600">No teachers have expressed interest yet</p>
                                <p className="text-sm text-gray-400 mt-1">Teachers matching this request's assignments will see it in their portal</p>
                            </div>
                        )}

                        {/* Cancellation info */}
                        {isCancelled(request.status) && request.cancelledAt && (
                            <div className="border border-gray-200 rounded-xl bg-gray-50 p-5">
                                <div className="flex items-center gap-2 text-sm">
                                    <XCircle className="h-4 w-4 text-gray-500" />
                                    <span className="text-gray-700 font-medium">
                                        Cancelled on {new Date(request.cancelledAt).toLocaleDateString()}
                                        {request.cancelledBy && ` by ${request.cancelledBy}`}
                                    </span>
                                </div>
                            </div>
                        )}
                    </div>
                ) : (
                    <Alert>
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription>Request not found.</AlertDescription>
                    </Alert>
                )}
            </div>

            {/* Admin Restore Confirmation */}
            <AlertDialog open={restoreDialog} onOpenChange={setRestoreDialog}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Restore Cancelled Schedule?</AlertDialogTitle>
                        <AlertDialogDescription>
                            <strong>"{request?.subjectName}"</strong> will be moved back to{" "}
                            <strong>Pending Teacher Interest</strong>. Previous teacher interests will not be restored — teachers will need to re-express interest.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={restoring}>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={handleAdminRestore} disabled={restoring}>
                            {restoring ? "Restoring..." : "Restore"}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            {/* Admin Cancel Confirmation */}
            <AlertDialog open={cancelDialog} onOpenChange={setCancelDialog}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Cancel Request</AlertDialogTitle>
                        <AlertDialogDescription>
                            Are you sure you want to cancel the request for{" "}
                            <span className="font-semibold text-gray-900">"{request?.subjectName}"</span>
                            {request?.studentName ? (
                                <> by <span className="font-semibold text-gray-900">{request.studentName}</span></>
                            ) : null}?
                            {request?.status === "Confirmed" && (
                                <span className="block mt-1 text-red-600">
                                    This session is already confirmed. Cancelling will clear the teacher assignment and schedule.
                                </span>
                            )}
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <div className="py-4">
                        <label className="text-sm font-medium text-gray-700 mb-2 block">
                            Cancellation Reason <span className="text-red-500">*</span>
                        </label>
                        <Textarea
                            placeholder="Please provide a reason for cancelling this schedule..."
                            value={cancellationReason}
                            onChange={(e) => setCancellationReason(e.target.value)}
                            className="min-h-[100px]"
                        />
                    </div>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={cancelling} onClick={() => setCancellationReason("")}>Keep Request</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={(e) => {
                                e.preventDefault();
                                handleAdminCancel();
                            }}
                            disabled={cancelling || !cancellationReason.trim()}
                            className="bg-red-600 hover:bg-red-700"
                        >
                            {cancelling ? "Cancelling..." : "Cancel Request"}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </AppLayout>
    );
}
