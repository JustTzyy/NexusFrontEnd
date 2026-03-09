import { useEffect, useState } from "react";
import { useNavigate, useParams, useLocation, Link } from "react-router-dom";
import { tutoringRequestService } from "../../services/tutoringRequestService";
import { useAuth } from "@/contexts/AuthContext";
import { useStudentSetup } from "@/hooks/useStudentSetup";
import { DetailViewSkeleton } from "../../utils/skeletonLoaders";
import AppLayout from "../../layouts/AppLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import {
    AlertDialog, AlertDialogAction, AlertDialogCancel,
    AlertDialogContent, AlertDialogDescription, AlertDialogFooter,
    AlertDialogHeader, AlertDialogTitle
} from "@/components/ui/alert-dialog";
import {
    ArrowLeft, AlertCircle, CheckCircle2, BookOpen, Building2,
    GraduationCap, Calendar, Flag, Clock, UserPlus, DoorOpen, User, FileText,
    LogOut, Info
} from "lucide-react";

const PRIORITY_COLOR = {
    High: "text-red-600 bg-red-50",
    Normal: "text-orange-600 bg-orange-50",
    Low: "text-gray-500 bg-gray-50",
};

export default function AvailableSessionView() {
    const { id } = useParams();
    const navigate = useNavigate();
    const location = useLocation();

    const [session, setSession] = useState(location.state?.session || null);
    const [loading, setLoading] = useState(!session);
    const [error, setError] = useState("");
    const [enrolling, setEnrolling] = useState(false);
    const [confirmEnroll, setConfirmEnroll] = useState(false);
    const [enrolled, setEnrolled] = useState(false);
    const [withdrawModal, setWithdrawModal] = useState(false);
    const [withdrawing, setWithdrawing] = useState(false);

    const { user: authUser } = useAuth();
    const { isSetupComplete } = useStudentSetup();
    const isLeadOrCustomer = authUser?.roles?.some(r => r === "Lead" || r === "Customer");

    const fromEnrolled = location.state?.from === "enrolled";
    const isEnrolledSession = fromEnrolled || (session && (session.status === "Confirmed" || session.status === "Waiting for Teacher Approval"));

    useEffect(() => {
        if (session) return;
        const load = async () => {
            try {
                const res = await tutoringRequestService.getAvailableSessions({ pageSize: 200 });
                const items = res.data?.data?.items || res.data?.items || [];
                const found = items.find(s => s.id === parseInt(id));
                if (found) {
                    setSession({
                        ...found,
                        createdAtDisplay: found.createdAt ? new Date(found.createdAt).toLocaleDateString() : "",
                    });
                } else {
                    setError("Session not found or no longer available.");
                }
            } catch {
                setError("Failed to load session details.");
            } finally {
                setLoading(false);
            }
        };
        load();
    }, [id, session]);

    const handleEnroll = async () => {
        setEnrolling(true);
        try {
            await tutoringRequestService.enroll(session.id);
            setEnrolled(true);
            setConfirmEnroll(false);
        } catch (err) {
            setError(err.response?.data?.message || err.message || "Failed to enroll in session.");
            setConfirmEnroll(false);
        } finally {
            setEnrolling(false);
        }
    };

    const goBack = () => navigate(fromEnrolled ? "/my-enrolled-sessions" : "/available-sessions");

    const confirmWithdraw = async () => {
        setWithdrawing(true);
        try {
            await tutoringRequestService.studentWithdraw(session.id);
            setWithdrawModal(false);
            navigate("/my-enrolled-sessions", {
                state: { alert: { type: "success", message: "You have withdrawn from the session." } },
            });
        } catch (err) {
            setError(err.response?.data?.message || "Failed to withdraw from session");
            setWithdrawModal(false);
            setWithdrawing(false);
        }
    };

    const isConfirmed = session?.status === "Confirmed";
    const isWaitingTeacher = session?.status === "Waiting for Teacher Approval";

    return (
        <AppLayout title="Session Details">
            <div className="space-y-6">
                {error && (
                    <Alert variant="destructive">
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription>{error}</AlertDescription>
                    </Alert>
                )}

                {loading ? (
                    <DetailViewSkeleton fields={6} />
                ) : session ? (
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
                                    <TooltipContent>
                                        {fromEnrolled ? "Back to enrolled sessions" : "Back to available sessions"}
                                    </TooltipContent>
                                </Tooltip>
                                <div>
                                    <h1 className="text-3xl font-bold text-gray-900">
                                        {isEnrolledSession ? "Confirmed Schedule" : "Session Details"}
                                    </h1>
                                    <p className="mt-1 text-sm text-gray-600">
                                        #{session.id} &middot; {session.subjectName}
                                    </p>
                                </div>
                            </div>

                            {/* Actions */}
                            <div className="flex items-center gap-2">
                                {!isEnrolledSession && !enrolled && (
                                    isLeadOrCustomer && isSetupComplete === false ? (
                                        <Alert className="mb-0 border-amber-200 bg-amber-50 py-2 px-3">
                                            <AlertCircle className="h-4 w-4 text-amber-600" />
                                            <AlertDescription className="text-amber-800 text-xs">
                                                Complete your profile to enroll.{" "}
                                                <Link to="/register/welcome" className="underline font-semibold">Complete Setup →</Link>
                                            </AlertDescription>
                                        </Alert>
                                    ) : (
                                        <Button
                                            size="sm"
                                            className="bg-indigo-600 hover:bg-indigo-700"
                                            onClick={() => setConfirmEnroll(true)}
                                            disabled={enrolling}
                                        >
                                            <UserPlus className="h-4 w-4 mr-2" />
                                            Enroll Now
                                        </Button>
                                    )
                                )}
                                {isEnrolledSession && (
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => setWithdrawModal(true)}
                                        className="text-red-600 hover:bg-red-50"
                                    >
                                        <LogOut className="h-4 w-4 mr-2" />
                                        Withdraw
                                    </Button>
                                )}
                            </div>
                        </div>

                        {/* Status Message */}
                        {enrolled ? (
                            <div className="rounded-xl p-5 bg-emerald-50 border border-emerald-200 flex items-start gap-4">
                                <CheckCircle2 className="h-5 w-5 text-emerald-600 mt-0.5 flex-shrink-0" />
                                <div>
                                    <p className="text-sm font-semibold text-emerald-800">Successfully Enrolled!</p>
                                    <p className="text-sm mt-0.5 text-emerald-700">
                                        You are now enrolled in this tutoring session. You can view it in your{" "}
                                        <button
                                            onClick={() => navigate("/my-enrolled-sessions")}
                                            className="underline font-semibold hover:text-emerald-900"
                                        >
                                            My Enrolled Sessions
                                        </button>.
                                    </p>
                                </div>
                            </div>
                        ) : isEnrolledSession ? (
                            <div className={`rounded-xl p-5 flex items-start gap-4 ${
                                isConfirmed
                                    ? "bg-emerald-50 border border-emerald-200"
                                    : "bg-purple-50 border border-purple-200"
                            }`}>
                                {isConfirmed
                                    ? <CheckCircle2 className="h-5 w-5 text-emerald-600 mt-0.5 flex-shrink-0" />
                                    : <Clock className="h-5 w-5 text-purple-600 mt-0.5 flex-shrink-0" />
                                }
                                <div>
                                    <p className={`text-sm font-semibold ${isConfirmed ? "text-emerald-800" : "text-purple-800"}`}>
                                        {isConfirmed ? "Confirmed" : "Awaiting Teacher Confirmation"}
                                    </p>
                                    <p className={`text-sm mt-0.5 ${isConfirmed ? "text-emerald-700" : "text-purple-700"}`}>
                                        {isConfirmed
                                            ? "Your tutoring session is confirmed! See you there."
                                            : "Your enrollment is recorded. The teacher is confirming the schedule."}
                                    </p>
                                </div>
                            </div>
                        ) : (
                            <div className="rounded-xl p-5 bg-blue-50 border border-blue-200 flex items-start gap-4">
                                <Info className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                                <div>
                                    <p className="text-sm font-semibold text-blue-800">Open for Enrollment</p>
                                    <p className="text-sm mt-0.5 text-blue-700">
                                        This session is available for students to enroll. Review the details and click "Enroll Now" to secure your spot.
                                    </p>
                                </div>
                            </div>
                        )}

                        {/* Session Information Card */}
                        <div className="border rounded-xl bg-white overflow-hidden">
                            <div className="bg-gradient-to-r from-gray-50 to-gray-100 px-6 py-4 border-b">
                                <div className="flex items-center justify-between">
                                    <h2 className="text-lg font-bold text-gray-900">Session Information</h2>
                                    <Badge className={
                                        isEnrolledSession
                                            ? isConfirmed
                                                ? "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200"
                                                : "bg-purple-50 text-purple-700 ring-1 ring-purple-200"
                                            : "bg-blue-50 text-blue-700 ring-1 ring-blue-200"
                                    }>
                                        {isEnrolledSession ? (isConfirmed ? "Confirmed" : "Awaiting Teacher") : "Open"}
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
                                        <p className="text-sm text-gray-900 font-medium">{session.subjectName}</p>
                                    </div>

                                    {/* Building */}
                                    <div className="space-y-1.5">
                                        <div className="flex items-center gap-2 text-sm font-medium text-gray-500">
                                            <Building2 className="h-4 w-4" />
                                            <span>Building</span>
                                        </div>
                                        <p className="text-sm text-gray-900 font-medium">{session.buildingName}</p>
                                    </div>

                                    {/* Department */}
                                    <div className="space-y-1.5">
                                        <div className="flex items-center gap-2 text-sm font-medium text-gray-500">
                                            <FileText className="h-4 w-4" />
                                            <span>Department</span>
                                        </div>
                                        <p className="text-sm text-gray-900 font-medium">{session.departmentName}</p>
                                    </div>

                                    {/* Teacher */}
                                    <div className="space-y-1.5">
                                        <div className="flex items-center gap-2 text-sm font-medium text-gray-500">
                                            <GraduationCap className="h-4 w-4" />
                                            <span>Teacher</span>
                                        </div>
                                        <p className="text-sm text-gray-900 font-medium">
                                            {session.assignedTeacherName || "To be assigned"}
                                        </p>
                                    </div>

                                    {/* Priority */}
                                    <div className="space-y-1.5">
                                        <div className="flex items-center gap-2 text-sm font-medium text-gray-500">
                                            <Flag className="h-4 w-4" />
                                            <span>Priority</span>
                                        </div>
                                        <span className={`inline-flex text-xs font-semibold px-2.5 py-1 rounded-full ${PRIORITY_COLOR[session.priority] || "text-gray-600 bg-gray-50"}`}>
                                            {session.priority}
                                        </span>
                                    </div>

                                    {/* Date Posted */}
                                    <div className="space-y-1.5">
                                        <div className="flex items-center gap-2 text-sm font-medium text-gray-500">
                                            <Calendar className="h-4 w-4" />
                                            <span>Date Posted</span>
                                        </div>
                                        <p className="text-sm text-gray-900">
                                            {session.createdAt ? new Date(session.createdAt).toLocaleDateString() : "—"}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Schedule Details Card */}
                        {(session.roomName || session.dayName || session.timeSlotLabel) && (
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
                                            <p className="text-sm text-gray-900 font-medium">{session.roomName || "—"}</p>
                                        </div>

                                        <div className="space-y-1.5">
                                            <div className="flex items-center gap-2 text-sm font-medium text-gray-500">
                                                <Calendar className="h-4 w-4" />
                                                <span>Day</span>
                                            </div>
                                            <p className="text-sm text-gray-900 font-medium">{session.dayName || "—"}</p>
                                        </div>

                                        <div className="space-y-1.5">
                                            <div className="flex items-center gap-2 text-sm font-medium text-gray-500">
                                                <Clock className="h-4 w-4" />
                                                <span>Time Slot</span>
                                            </div>
                                            <p className="text-sm text-gray-900 font-medium">{session.timeSlotLabel || "—"}</p>
                                        </div>

                                        <div className="space-y-1.5">
                                            <div className="flex items-center gap-2 text-sm font-medium text-gray-500">
                                                <User className="h-4 w-4" />
                                                <span>Teacher</span>
                                            </div>
                                            <p className="text-sm text-gray-900 font-medium">{session.assignedTeacherName || "—"}</p>
                                        </div>
                                    </div>

                                    {session.confirmedAt && (
                                        <>
                                            <Separator className="my-4" />
                                            <div className="flex items-center gap-2 text-sm">
                                                <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                                                <span className="text-emerald-700 font-medium">
                                                    Confirmed on {new Date(session.confirmedAt).toLocaleDateString()}
                                                </span>
                                            </div>
                                        </>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                ) : (
                    <Alert>
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription>Session not found or no longer available.</AlertDescription>
                    </Alert>
                )}
            </div>

            {/* Withdraw Confirmation Dialog */}
            <AlertDialog open={withdrawModal} onOpenChange={(open) => !open && setWithdrawModal(false)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Withdraw from Session</AlertDialogTitle>
                        <AlertDialogDescription>
                            Are you sure you want to withdraw from{" "}
                            <span className="font-semibold text-gray-900">{session?.subjectName}</span>?
                            Your spot will be freed for another student to enroll.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={withdrawing}>Keep Session</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={confirmWithdraw}
                            disabled={withdrawing}
                            className="bg-red-600 hover:bg-red-700"
                        >
                            {withdrawing ? "Withdrawing..." : "Withdraw"}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            {/* Enrollment Confirmation Dialog */}
            <AlertDialog open={confirmEnroll} onOpenChange={(open) => !open && setConfirmEnroll(false)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Enroll in Session</AlertDialogTitle>
                        <AlertDialogDescription>
                            Are you sure you want to enroll in the{" "}
                            <span className="font-semibold text-gray-900">{session?.subjectName}</span> tutoring session
                            at <span className="font-semibold text-gray-900">{session?.buildingName}</span>?
                            {session?.assignedTeacherName && (
                                <> Your teacher will be <span className="font-semibold text-gray-900">{session.assignedTeacherName}</span>.</>
                            )}
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={enrolling}>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleEnroll}
                            disabled={enrolling}
                            className="bg-indigo-600 hover:bg-indigo-700"
                        >
                            {enrolling ? "Enrolling..." : "Enroll Now"}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </AppLayout>
    );
}
