import { useEffect, useState } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import { tutoringRequestService } from "../../services/tutoringRequestService";
import { DetailViewSkeleton } from "../../utils/skeletonLoaders";
import AppLayout from "../../layouts/AppLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import {
    ArrowLeft, Hand, AlertCircle, BookOpen, Building2,
    Flag, FileText, Calendar, User, Clock, DoorOpen, CheckCircle2, Info, XCircle,
    Check, X, LogOut, RotateCcw
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
        color: "bg-amber-600",
        badgeClass: "bg-amber-50 text-amber-700 ring-1 ring-amber-200",
        label: "Open",
        message: "This request is open for teacher interest. Express your interest to get assigned.",
        icon: Clock,
    },
    "Waiting for Admin Approval": {
        step: 1,
        color: "bg-blue-600",
        badgeClass: "bg-blue-50 text-blue-700 ring-1 ring-blue-200",
        label: "In Review",
        message: "A teacher has expressed interest. The admin is reviewing and will assign a teacher.",
        icon: Info,
    },
    "Teacher Assigned": {
        step: 2,
        color: "bg-indigo-600",
        badgeClass: "bg-indigo-50 text-indigo-700 ring-1 ring-indigo-200",
        label: "Assigned",
        message: "A teacher has been assigned. The admin is preparing the schedule.",
        icon: User,
    },
    "Waiting for Teacher Approval": {
        step: 3,
        color: "bg-purple-600",
        badgeClass: "bg-purple-50 text-purple-700 ring-1 ring-purple-200",
        label: "Needs Your Approval",
        message: "The schedule is set. Please review and accept or decline this session.",
        icon: Clock,
    },
    "Confirmed": {
        step: 4,
        color: "bg-emerald-600",
        badgeClass: "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200",
        label: "Confirmed",
        message: "This tutoring session is confirmed. See you there!",
        icon: CheckCircle2,
    },
    "Pending Student Interest": {
        step: 4,
        color: "bg-cyan-600",
        badgeClass: "bg-cyan-50 text-cyan-700 ring-1 ring-cyan-200",
        label: "Awaiting Student",
        message: "You confirmed this session. Waiting for a student to enroll.",
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

export default function TeacherInterestView() {
    const { requestId } = useParams();
    const navigate = useNavigate();
    const location = useLocation();
    const { user } = useAuth();

    const [request, setRequest] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [actionLoading, setActionLoading] = useState(false);

    // Modals
    const [interestModal, setInterestModal] = useState(false);
    const [interestDescription, setInterestDescription] = useState("");
    const [confirmModal, setConfirmModal] = useState({ open: false, action: null });
    const [withdrawModal, setWithdrawModal] = useState(false);
    const [reExpressModal, setReExpressModal] = useState(false);
    const [reExpressDescription, setReExpressDescription] = useState("");

    const fromState = location.state?.from;
    const backPath = fromState === "dashboardTeacher" ? "/dashboardTeacher"
        : fromState === "my-interests" ? "/my-interests"
        : fromState === "my-admin-schedules" ? "/my-admin-schedules"
        : fromState === "admin-requests" ? "/admin-requests"
        : fromState === "student-requests" ? "/student-requests"
        : "/teacher-interest";
    const goBack = () => navigate(backPath);

    useEffect(() => {
        const load = async () => {
            try {
                const res = await tutoringRequestService.getById(requestId);
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

    // Express Interest
    const handleExpressInterest = async () => {
        const description = interestDescription.trim();
        setInterestModal(false);
        setInterestDescription("");
        setActionLoading(true);
        try {
            await tutoringRequestService.expressInterest(request.id, { description: description || "I am interested in tutoring this student." });
            navigate(backPath, {
                state: { alert: { type: "success", message: `You've expressed interest in "${request.subjectName}"!` } },
            });
        } catch (err) {
            setError(err.response?.data?.message || "Failed to express interest");
            setActionLoading(false);
        }
    };

    // Confirm/Decline
    const handleConfirmAction = async () => {
        const action = confirmModal.action;
        setConfirmModal({ open: false, action: null });
        setActionLoading(true);
        try {
            await tutoringRequestService.confirmSession(request.id, action === "accept");
            navigate(backPath, {
                state: {
                    alert: {
                        type: "success",
                        message: action === "accept"
                            ? `Session for "${request.subjectName}" confirmed!`
                            : `Session for "${request.subjectName}" declined. Admin will be notified.`,
                    },
                },
            });
        } catch (err) {
            setError(err.response?.data?.message || "Action failed");
            setActionLoading(false);
        }
    };

    // Withdraw
    const handleWithdraw = async () => {
        setWithdrawModal(false);
        setActionLoading(true);
        try {
            await tutoringRequestService.withdraw(request.id);
            navigate(backPath, {
                state: { alert: { type: "success", message: `You've withdrawn from "${request.subjectName}".` } },
            });
        } catch (err) {
            setError(err.response?.data?.message || "Failed to withdraw");
            setActionLoading(false);
        }
    };

    // Re-express interest (for withdrawn teachers)
    const handleReExpressInterest = async () => {
        const description = reExpressDescription.trim();
        setReExpressModal(false);
        setReExpressDescription("");
        setActionLoading(true);
        try {
            await tutoringRequestService.expressInterest(request.id, {
                description: description || "I am re-expressing interest in this request.",
            });
            navigate(backPath, {
                state: { alert: { type: "success", message: `You've re-expressed interest in "${request.subjectName}"!` } },
            });
        } catch (err) {
            setError(err.response?.data?.message || "Failed to re-express interest");
            setActionLoading(false);
        }
    };

    const getConfig = (status) => STATUS_CONFIG[status] || STATUS_CONFIG["Pending Teacher Interest"];
    const isCancelled = (s) => s?.startsWith("Cancelled");

    const currentStep = request ? getConfig(request.status).step : 0;
    const showSchedule = request && currentStep >= 3;
    const showTeacher = request && (currentStep >= 2 || request.assignedTeacherName);

    // Action visibility
    const canExpressInterest = request?.status === "Pending Teacher Interest";
    const needsConfirmation = request?.status === "Waiting for Teacher Approval";
    const isConfirmed = request?.status === "Confirmed";

    const myInterest = request?.interestedTeachers?.find(t => t.teacherId === user?.id);
    const canReExpress = myInterest?.status === "Withdrawn" &&
        (request?.status === "Pending Teacher Interest" || request?.status === "Waiting for Admin Approval");

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
                                {canExpressInterest && (
                                    <Button
                                        size="sm"
                                        onClick={() => { setInterestModal(true); setInterestDescription(""); }}
                                        disabled={actionLoading}
                                    >
                                        <Hand className="h-4 w-4 mr-2" />
                                        I'm Interested
                                    </Button>
                                )}
                                {needsConfirmation && (
                                    <>
                                        <Button
                                            size="sm"
                                            className="bg-green-600 hover:bg-green-700"
                                            onClick={() => setConfirmModal({ open: true, action: "accept" })}
                                            disabled={actionLoading}
                                        >
                                            <Check className="h-4 w-4 mr-2" />
                                            Accept
                                        </Button>
                                        <Button
                                            size="sm"
                                            variant="outline"
                                            className="text-red-600 hover:bg-red-50"
                                            onClick={() => setConfirmModal({ open: true, action: "decline" })}
                                            disabled={actionLoading}
                                        >
                                            <X className="h-4 w-4 mr-2" />
                                            Decline
                                        </Button>
                                    </>
                                )}
                                {isConfirmed && (
                                    <Button
                                        size="sm"
                                        variant="outline"
                                        className="text-red-600 hover:bg-red-50"
                                        onClick={() => setWithdrawModal(true)}
                                        disabled={actionLoading}
                                    >
                                        <LogOut className="h-4 w-4 mr-2" />
                                        Withdraw
                                    </Button>
                                )}
                                {canReExpress && (
                                    <Button
                                        size="sm"
                                        variant="outline"
                                        className="text-indigo-600 hover:bg-indigo-50"
                                        onClick={() => { setReExpressModal(true); setReExpressDescription(""); }}
                                        disabled={actionLoading}
                                    >
                                        <RotateCcw className="h-4 w-4 mr-2" />
                                        Re-express Interest
                                    </Button>
                                )}
                            </div>
                        </div>

                        {/* Status Progress Tracker */}
                        {!isCancelled(request.status) && (
                            <div className="border rounded-xl bg-white p-6">
                                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4">Progress</p>
                                <div className="flex items-center gap-0">
                                    {STATUS_ORDER.map((statusKey, idx) => {
                                        const isCompleted = currentStep > idx;
                                        const isCurrent = currentStep === idx;

                                        return (
                                            <div key={statusKey} className="flex items-center flex-1 last:flex-none">
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
                            return (
                                <div className={`rounded-xl p-5 flex items-start gap-4 ${
                                    isCancelledStatus
                                        ? "bg-gray-50 border border-gray-200"
                                        : request.status === "Confirmed"
                                            ? "bg-emerald-50 border border-emerald-200"
                                            : needsConfirmation
                                                ? "bg-purple-50 border border-purple-200"
                                                : "bg-blue-50 border border-blue-200"
                                }`}>
                                    <StatusIcon className={`h-5 w-5 mt-0.5 flex-shrink-0 ${
                                        isCancelledStatus ? "text-gray-500" :
                                        request.status === "Confirmed" ? "text-emerald-600" :
                                        needsConfirmation ? "text-purple-600" :
                                        "text-blue-600"
                                    }`} />
                                    <div>
                                        <p className={`text-sm font-semibold ${
                                            isCancelledStatus ? "text-gray-700" :
                                            request.status === "Confirmed" ? "text-emerald-800" :
                                            needsConfirmation ? "text-purple-800" :
                                            "text-blue-800"
                                        }`}>
                                            {cfg.label}
                                        </p>
                                        <p className={`text-sm mt-0.5 ${
                                            isCancelledStatus ? "text-gray-600" :
                                            request.status === "Confirmed" ? "text-emerald-700" :
                                            needsConfirmation ? "text-purple-700" :
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
                                            <User className="h-4 w-4" />
                                            <span>Student</span>
                                        </div>
                                        <p className="text-sm text-gray-900 font-medium">{request.studentName}</p>
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
                                            <span>Requested</span>
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
                                    <div className="space-y-1.5 md:col-span-3">
                                        <div className="flex items-center gap-2 text-sm font-medium text-gray-500">
                                            <FileText className="h-4 w-4" />
                                            <span>Student's Message</span>
                                        </div>
                                        <p className="text-sm text-gray-900 leading-relaxed">
                                            {request.message || "No message provided."}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Schedule Section */}
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
                                        <div className="space-y-1.5">
                                            <div className="flex items-center gap-2 text-sm font-medium text-gray-500">
                                                <DoorOpen className="h-4 w-4" />
                                                <span>Room</span>
                                            </div>
                                            <p className="text-sm text-gray-900 font-medium">{request.roomName || "—"}</p>
                                        </div>

                                        <div className="space-y-1.5">
                                            <div className="flex items-center gap-2 text-sm font-medium text-gray-500">
                                                <Calendar className="h-4 w-4" />
                                                <span>Day</span>
                                            </div>
                                            <p className="text-sm text-gray-900 font-medium">{request.dayName || "—"}</p>
                                        </div>

                                        <div className="space-y-1.5">
                                            <div className="flex items-center gap-2 text-sm font-medium text-gray-500">
                                                <Clock className="h-4 w-4" />
                                                <span>Time Slot</span>
                                            </div>
                                            <p className="text-sm text-gray-900 font-medium">{request.timeSlotLabel || "—"}</p>
                                        </div>

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

            {/* Express Interest Dialog */}
            <AlertDialog open={interestModal} onOpenChange={(open) => { if (!open) { setInterestModal(false); setInterestDescription(""); } }}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Express Interest</AlertDialogTitle>
                        <AlertDialogDescription asChild>
                            <div className="space-y-3">
                                <p>
                                    Are you sure you want to express interest in tutoring{" "}
                                    <span className="font-semibold">{request?.studentName}</span> for{" "}
                                    <span className="font-semibold">{request?.subjectName}</span>?
                                    The admin will review and finalize the scheduling.
                                </p>
                                <div>
                                    <label className="text-sm font-medium text-gray-700 block mb-1">
                                        Why are you interested? <span className="text-red-500">*</span>
                                    </label>
                                    <Textarea
                                        placeholder="Briefly describe your qualifications or interest..."
                                        value={interestDescription}
                                        onChange={(e) => setInterestDescription(e.target.value)}
                                        rows={3}
                                        className="text-gray-900"
                                    />
                                </div>
                            </div>
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={handleExpressInterest} disabled={!interestDescription.trim() || actionLoading}>
                            Express Interest
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            {/* Confirm/Decline Session */}
            <AlertDialog open={confirmModal.open} onOpenChange={(open) => !open && setConfirmModal({ open: false, action: null })}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>
                            {confirmModal.action === "accept" ? "Accept Session" : "Decline Session"}
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                            {confirmModal.action === "accept"
                                ? <>Are you sure you want to accept the tutoring session for <span className="font-semibold">{request?.subjectName}</span>?</>
                                : <>Are you sure you want to decline this session? The admin will be notified and may assign another teacher.</>
                            }
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleConfirmAction}
                            disabled={actionLoading}
                            className={confirmModal.action === "decline" ? "bg-red-600 hover:bg-red-700" : "bg-green-600 hover:bg-green-700"}
                        >
                            {confirmModal.action === "accept" ? "Accept" : "Decline"}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            {/* Withdraw Dialog */}
            <AlertDialog open={withdrawModal} onOpenChange={(open) => !open && setWithdrawModal(false)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Withdraw from Session</AlertDialogTitle>
                        <AlertDialogDescription>
                            Are you sure you want to withdraw from the confirmed session for{" "}
                            <span className="font-semibold">{request?.subjectName}</span>?
                            The admin will be notified and will need to reassign another teacher.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Keep Session</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleWithdraw}
                            disabled={actionLoading}
                            className="bg-red-600 hover:bg-red-700"
                        >
                            Withdraw
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            {/* Re-express Interest Dialog */}
            <AlertDialog open={reExpressModal} onOpenChange={(open) => { if (!open) { setReExpressModal(false); setReExpressDescription(""); } }}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Re-express Interest</AlertDialogTitle>
                        <AlertDialogDescription asChild>
                            <div className="space-y-3">
                                <p>
                                    You previously withdrew from{" "}
                                    <span className="font-semibold">{request?.subjectName}</span>.
                                    Re-expressing interest will notify the admin that you are available again.
                                </p>
                                <div>
                                    <label className="text-sm font-medium text-gray-700 block mb-1">
                                        Add a note <span className="text-gray-400 font-normal">(optional)</span>
                                    </label>
                                    <Textarea
                                        placeholder="Why are you re-expressing interest?"
                                        value={reExpressDescription}
                                        onChange={(e) => setReExpressDescription(e.target.value)}
                                        rows={3}
                                        className="text-gray-900"
                                    />
                                </div>
                            </div>
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={handleReExpressInterest} disabled={actionLoading}>
                            Re-express Interest
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </AppLayout>
    );
}
