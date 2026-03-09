import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { tutoringRequestService } from "../../services/tutoringRequestService";
import { useAuth } from "../../contexts/AuthContext";
import { DetailViewSkeleton } from "../../utils/skeletonLoaders";
import AppLayout from "../../layouts/AppLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import {
    ArrowLeft, Pencil, XCircle, AlertCircle, BookOpen, Building2,
    Flag, FileText, Calendar, User, Clock, DoorOpen, CheckCircle2, Info, CalendarClock,
    LogOut
} from "lucide-react";

/* ==================== Status configuration ==================== */
const STATUS_ORDER = [
    "Pending Teacher Interest",
    "Waiting for Admin Approval",
    "Teacher Assigned",
    "Waiting for Teacher Approval",
    "Confirmed",
];

const STATUS_CONFIG = {
    "Pending Teacher Interest": {
        step: 0,
        color: "bg-blue-600",
        badgeClass: "bg-blue-50 text-blue-700 ring-1 ring-blue-200",
        label: "Pending",
        message: "Your request has been submitted. We're looking for available teachers.",
        icon: Clock,
    },
    "Waiting for Admin Approval": {
        step: 1,
        color: "bg-amber-500",
        badgeClass: "bg-amber-50 text-amber-700 ring-1 ring-amber-200",
        label: "Admin Confirmation",
        message: "A teacher has shown interest. The admin is now processing the review and confirmation.",
        icon: Info,
    },
    "Teacher Assigned": {
        step: 2,
        color: "bg-indigo-600",
        badgeClass: "bg-indigo-50 text-indigo-700 ring-1 ring-indigo-200",
        label: "Teacher Assigned",
        message: "A teacher has been assigned! The admin is preparing your schedule.",
        icon: User,
    },
    "Waiting for Teacher Approval": {
        step: 3,
        color: "bg-purple-600",
        badgeClass: "bg-purple-50 text-purple-700 ring-1 ring-purple-200",
        label: "Awaiting Confirmation",
        message: "Your schedule is set! Waiting for the teacher to confirm.",
        icon: Clock,
    },
    "Confirmed": {
        step: 4,
        color: "bg-emerald-600",
        badgeClass: "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200",
        label: "Confirmed",
        message: "Your tutoring session is confirmed! See you there.",
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
        message: "This request was cancelled by you.",
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

export default function BookRequestView() {
    const { requestId } = useParams();
    const navigate = useNavigate();
    const { hasRole } = useAuth();

    const [request, setRequest] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [cancelModal, setCancelModal] = useState(false);
    const [cancelling, setCancelling] = useState(false);
    const [withdrawModal, setWithdrawModal] = useState(false);
    const [withdrawing, setWithdrawing] = useState(false);

    const goBack = () => navigate("/book-request");
    const goEdit = () => navigate(`/book-request/${requestId}/edit`);

    useEffect(() => {
        const load = async () => {
            try {
                const res = await tutoringRequestService.getStudentView(requestId);
                const data = res.data?.data || res.data;
                if (!data) {
                    setError("Request not found");
                    setLoading(false);
                    return;
                }
                setRequest(data);
            } catch {
                setError("Failed to load request details");
            } finally {
                setLoading(false);
            }
        };
        load();
    }, [requestId]);

    const confirmCancel = async () => {
        setCancelling(true);
        try {
            await tutoringRequestService.cancel(request.id);
            setCancelModal(false);
            navigate("/book-request", {
                state: { alert: { type: "success", message: "Request cancelled successfully." } },
            });
        } catch (err) {
            setError(err.response?.data?.message || "Failed to cancel request");
            setCancelModal(false);
            setCancelling(false);
        }
    };

    const confirmWithdraw = async () => {
        setWithdrawing(true);
        try {
            await tutoringRequestService.studentWithdraw(request.id);
            setWithdrawModal(false);
            navigate("/book-request", {
                state: { alert: { type: "success", message: "You have withdrawn from the session." } },
            });
        } catch (err) {
            setError(err.response?.data?.message || "Failed to withdraw from session");
            setWithdrawModal(false);
            setWithdrawing(false);
        }
    };

    const getConfig = (status) => STATUS_CONFIG[status] || STATUS_CONFIG["Pending Teacher Interest"];
    const isCancelled = (s) => s?.startsWith("Cancelled");
    const canEdit = request?.status === "Pending Teacher Interest";
    const canCancel = request && !isCancelled(request.status) && request.status !== "Confirmed";
    const canCancelConfirmed = request?.status === "Confirmed" && !request?.isAdminCreated;
    const canWithdraw = request?.status === "Confirmed" || request?.status === "Waiting for Teacher Approval";
    const isAdmin = hasRole("Super Admin") || hasRole("Admin");
    const canProcess = isAdmin && (request?.status === "Waiting for Admin Approval" || request?.status === "Teacher Assigned");

    // Determine which step the request is at for the progress tracker
    const currentStep = request ? getConfig(request.status).step : 0;

    // Schedule info should only be shown when status >= "Waiting for Teacher Approval"
    const showSchedule = request && currentStep >= 3;

    // Teacher name visible from "Teacher Assigned" onward
    const showTeacher = request && (currentStep >= 2 || request.assignedTeacherName);

    return (
        <AppLayout title="View Request">
            <div className="space-y-6">
                {error && (
                    <Alert variant="destructive">
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription>{error}</AlertDescription>
                    </Alert>
                )}

                {loading ? (
                    <DetailViewSkeleton fields={6} />
                ) : request ? (
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
                                    <TooltipContent>Back to requests</TooltipContent>
                                </Tooltip>
                                <div>
                                    <h1 className="text-3xl font-bold text-gray-900">Request Details</h1>
                                    <p className="mt-1 text-sm text-gray-600">
                                        #{request.id} &middot; {request.subjectName}
                                    </p>
                                </div>
                            </div>

                            {/* Actions */}
                            <div className="flex items-center gap-2">
                                {canEdit && (
                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <Button variant="outline" size="sm" onClick={goEdit}>
                                                <Pencil className="h-4 w-4 mr-2" />
                                                Edit
                                            </Button>
                                        </TooltipTrigger>
                                        <TooltipContent>Edit this request</TooltipContent>
                                    </Tooltip>
                                )}
                                {canCancel && (
                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => setCancelModal(true)}
                                                className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                            >
                                                <XCircle className="h-4 w-4 mr-2" />
                                                Cancel
                                            </Button>
                                        </TooltipTrigger>
                                        <TooltipContent>Cancel this request</TooltipContent>
                                    </Tooltip>
                                )}
                                {canWithdraw && (
                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => setWithdrawModal(true)}
                                                className="text-orange-600 hover:text-orange-700 hover:bg-orange-50"
                                            >
                                                <LogOut className="h-4 w-4 mr-2" />
                                                Withdraw
                                            </Button>
                                        </TooltipTrigger>
                                        <TooltipContent>Withdraw from this session</TooltipContent>
                                    </Tooltip>
                                )}
                                {canCancelConfirmed && (
                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => setCancelModal(true)}
                                                className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                            >
                                                <XCircle className="h-4 w-4 mr-2" />
                                                Cancel Request
                                            </Button>
                                        </TooltipTrigger>
                                        <TooltipContent>Permanently cancel this request</TooltipContent>
                                    </Tooltip>
                                )}
                                {canProcess && (
                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <Button
                                                size="sm"
                                                onClick={() => navigate(`/admin-scheduling/${request.id}/schedule`)}
                                            >
                                                <CalendarClock className="h-4 w-4 mr-2" />
                                                Process Request
                                            </Button>
                                        </TooltipTrigger>
                                        <TooltipContent>Assign teacher and schedule session</TooltipContent>
                                    </Tooltip>
                                )}
                            </div>
                        </div>

                        {/* Status Progress Tracker (not shown for cancelled) */}
                        {!isCancelled(request.status) && (
                            <div className="border rounded-xl bg-white p-6">
                                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4">Progress</p>
                                <div className="flex items-center gap-0">
                                    {STATUS_ORDER.map((statusKey, idx) => {
                                        const isCompleted = currentStep > idx;
                                        const isCurrent = currentStep === idx;

                                        return (
                                            <div key={statusKey} className="flex items-center flex-1 last:flex-none">
                                                {/* Step circle */}
                                                <div className="flex flex-col items-center">
                                                    <div
                                                        className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-300 ${
                                                            isCompleted
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
                                                    <span className={`text-[10px] mt-1.5 text-center max-w-[80px] leading-tight ${
                                                        isCurrent ? "font-semibold text-gray-900" :
                                                        isCompleted ? "text-emerald-600 font-medium" :
                                                        "text-gray-400"
                                                    }`}>
                                                        {STATUS_CONFIG[statusKey].label}
                                                    </span>
                                                </div>

                                                {/* Connector line */}
                                                {idx < STATUS_ORDER.length - 1 && (
                                                    <div className={`flex-1 h-0.5 mx-1 mt-[-16px] transition-all duration-300 ${
                                                        isCompleted ? "bg-emerald-400" : "bg-gray-200"
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
                            const isWaitingTeacher = request.status === "Waiting for Teacher Approval";
                            return (
                                <div className={`rounded-xl p-5 flex items-start gap-4 ${
                                    isCancelledStatus
                                        ? "bg-gray-50 border border-gray-200"
                                        : request.status === "Confirmed"
                                            ? "bg-emerald-50 border border-emerald-200"
                                            : isWaitingTeacher
                                                ? "bg-purple-50 border border-purple-200"
                                                : "bg-blue-50 border border-blue-200"
                                }`}>
                                    <StatusIcon className={`h-5 w-5 mt-0.5 flex-shrink-0 ${
                                        isCancelledStatus ? "text-gray-500" :
                                        request.status === "Confirmed" ? "text-emerald-600" :
                                        isWaitingTeacher ? "text-purple-600" :
                                        "text-blue-600"
                                    }`} />
                                    <div>
                                        <p className={`text-sm font-semibold ${
                                            isCancelledStatus ? "text-gray-700" :
                                            request.status === "Confirmed" ? "text-emerald-800" :
                                            isWaitingTeacher ? "text-purple-800" :
                                            "text-blue-800"
                                        }`}>
                                            {cfg.label}
                                        </p>
                                        <p className={`text-sm mt-0.5 ${
                                            isCancelledStatus ? "text-gray-600" :
                                            request.status === "Confirmed" ? "text-emerald-700" :
                                            isWaitingTeacher ? "text-purple-700" :
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

                                    {/* Assigned Teacher (only when status >= Teacher Assigned) */}
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

                                    {/* Description */}
                                    <div className="space-y-1.5 md:col-span-3">
                                        <div className="flex items-center gap-2 text-sm font-medium text-gray-500">
                                            <FileText className="h-4 w-4" />
                                            <span>Description</span>
                                        </div>
                                        <p className="text-sm text-gray-900 leading-relaxed">
                                            {request.message || "No description provided."}
                                        </p>
                                    </div>
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

                        {/* Cancellation info */}
                        {isCancelled(request.status) && request.cancelledAt && (
                            <div className="border border-gray-200 rounded-xl bg-gray-50 p-5">
                                <div className="flex items-center gap-2 text-sm">
                                    <XCircle className="h-4 w-4 text-gray-500" />
                                    <span className="text-gray-700 font-medium">
                                        Cancelled on {new Date(request.cancelledAt).toLocaleDateString()}
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

            {/* Withdraw Confirmation */}
            <AlertDialog open={withdrawModal} onOpenChange={setWithdrawModal}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Withdraw from Session</AlertDialogTitle>
                        <AlertDialogDescription>
                            Are you sure you want to withdraw from{" "}
                            <span className="font-semibold text-gray-900">"{request?.subjectName}"</span>?
                            {request?.isAdminCreated
                                ? " Your spot will be freed for another student to enroll."
                                : " The session will be reset and the admin will need to re-process it."}
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={withdrawing}>Keep Session</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={confirmWithdraw}
                            disabled={withdrawing}
                            className="bg-orange-600 hover:bg-orange-700"
                        >
                            {withdrawing ? "Withdrawing..." : "Withdraw"}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            {/* Cancel Confirmation */}
            <AlertDialog open={cancelModal} onOpenChange={setCancelModal}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Cancel Request</AlertDialogTitle>
                        <AlertDialogDescription>
                            Are you sure you want to cancel your request for{" "}
                            <span className="font-semibold text-gray-900">"{request?.subjectName}"</span>?
                            {request?.status !== "Pending Teacher Interest" && (
                                <span className="block mt-1 text-red-600">
                                    This request is already in progress. Cancelling will notify the admin and any assigned teacher.
                                </span>
                            )}
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={cancelling}>Keep Request</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={confirmCancel}
                            disabled={cancelling}
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
