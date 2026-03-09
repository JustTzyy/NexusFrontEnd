import { useEffect, useState } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import { tutoringRequestService } from "../../services/tutoringRequestService";
import { roomService } from "../../services/roomService";
import { availableDayService } from "../../services/availableDayService";
import { availableTimeSlotService } from "../../services/availableTimeSlotService";
import AppLayout from "../../layouts/AppLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { DetailViewSkeleton } from "../../utils/skeletonLoaders";
import {
    Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle
} from "@/components/ui/dialog";
import {
    ArrowLeft, AlertCircle, BookOpen, Building2, GraduationCap, CalendarClock,
    Check, Loader2, Calendar, Clock, DoorOpen, Info
} from "lucide-react";

const getStatusStyle = (status) => {
    switch (status) {
        case "Pending Teacher Interest": return "bg-orange-600";
        case "Waiting for Admin Approval": return "bg-blue-600";
        case "Teacher Assigned": return "bg-indigo-600";
        case "Waiting for Teacher Approval": return "bg-purple-600";
        case "Confirmed": return "bg-green-600";
        case "Cancelled by Student": return "bg-gray-500";
        case "Cancelled by Admin": return "bg-red-600";
        default: return "bg-gray-500";
    }
};

export default function ScheduleConfigurationSchedule() {
    const { id } = useParams();
    const navigate = useNavigate();
    const location = useLocation();

    // Teacher passed from the view page
    const teacher = location.state?.selectedTeacher;

    const [request, setRequest] = useState(null);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState("");
    const [confirmOpen, setConfirmOpen] = useState(false);

    // Raw dropdown data
    const [rooms, setRooms] = useState([]);
    const [days, setDays] = useState([]);
    const [timeSlots, setTimeSlots] = useState([]);

    // Conflict lookup sets (populated from API)
    const [teacherBusySet, setTeacherBusySet] = useState(new Set()); // "dayId-timeSlotId"
    const [roomBusySet, setRoomBusySet] = useState(new Set());       // "roomId-dayId-timeSlotId"

    // Teacher availability (restrict dropdowns to days/slots teacher has set)
    const [teacherAvailableDayIds, setTeacherAvailableDayIds] = useState(new Set());
    const [teacherAvailableSlotSet, setTeacherAvailableSlotSet] = useState(new Set()); // "dayId-timeSlotId"

    // Form state — cascading order: Day → Time Slot → Room
    const [selectedDayId, setSelectedDayId] = useState("");
    const [selectedTimeSlotId, setSelectedTimeSlotId] = useState("");
    const [selectedRoomId, setSelectedRoomId] = useState("");

    useEffect(() => {
        // If no teacher was passed, redirect back to view
        if (!teacher) {
            navigate(`/schedule-configuration/${id}`, { replace: true });
            return;
        }

        const loadAll = async () => {
            try {
                const [reqRes, roomsRes, daysRes, slotsRes, conflictRes] = await Promise.all([
                    tutoringRequestService.getById(id),
                    roomService.getAll({ pageSize: 200 }),
                    availableDayService.getAll({ pageSize: 200 }),
                    availableTimeSlotService.getAll({ pageSize: 200 }),
                    tutoringRequestService.getConflictData(teacher.teacherId, parseInt(id)),
                ]);

                const reqData = reqRes.data?.data || reqRes.data;
                if (!reqData) throw new Error("Request not found");
                setRequest(reqData);

                // Pre-select existing values if already partially set
                if (reqData.availableDayId) setSelectedDayId(String(reqData.availableDayId));
                if (reqData.availableTimeSlotId) setSelectedTimeSlotId(String(reqData.availableTimeSlotId));
                if (reqData.roomId) setSelectedRoomId(String(reqData.roomId));

                const extractItems = (res) => {
                    const d = res.data?.data || res.data;
                    return d?.items || d || [];
                };
                setRooms(extractItems(roomsRes));
                setDays(extractItems(daysRes));
                setTimeSlots(extractItems(slotsRes));

                // Build conflict lookup sets
                const conflictData = conflictRes.data?.data || conflictRes.data || { teacherBusy: [], roomBusy: [] };
                setTeacherBusySet(new Set(
                    (conflictData.teacherBusy || []).map(x => `${x.dayId}-${x.timeSlotId}`)
                ));
                setRoomBusySet(new Set(
                    (conflictData.roomBusy || []).map(x => `${x.roomId}-${x.dayId}-${x.timeSlotId}`)
                ));

                // Build teacher availability sets (empty = no restriction)
                const availDayIds = conflictData.teacherAvailableDayIds || [];
                const availSlots = conflictData.teacherAvailableSlots || [];
                setTeacherAvailableDayIds(new Set(availDayIds));
                setTeacherAvailableSlotSet(new Set(availSlots.map(s => `${s.dayId}-${s.timeSlotId}`)));
            } catch (err) {
                setError(err.response?.data?.message || err.message);
            } finally {
                setLoading(false);
            }
        };
        loadAll();
    }, [id, teacher, navigate]);

    // Cascading handlers — each resets downstream selections
    const handleDayChange = (dayId) => {
        setSelectedDayId(dayId);
        setSelectedTimeSlotId("");
        setSelectedRoomId("");
    };

    const handleTimeSlotChange = (slotId) => {
        setSelectedTimeSlotId(slotId);
        setSelectedRoomId("");
    };

    // Derived filtered lists
    const buildingRooms = request ? rooms.filter(r => r.buildingId === request.buildingId) : [];
    const teacherHasAvailability = teacherAvailableDayIds.size > 0;

    // Days: restrict to teacher-available days (or all if none set)
    const availableDays = teacherHasAvailability
        ? days.filter(d => teacherAvailableDayIds.has(d.id))
        : days;

    // Time slots: restrict to teacher-available + not conflict-busy
    const availableTimeSlots = selectedDayId
        ? timeSlots.filter(s => {
            const notBusy = !teacherBusySet.has(`${selectedDayId}-${s.id}`);
            const isTeacherAvailable = !teacherHasAvailability ||
                teacherAvailableSlotSet.has(`${selectedDayId}-${s.id}`);
            return notBusy && isTeacherAvailable;
        })
        : timeSlots;

    // Rooms available for selected day + time (no room conflict, same building)
    const availableRooms = selectedDayId && selectedTimeSlotId
        ? buildingRooms.filter(r => !roomBusySet.has(`${r.id}-${selectedDayId}-${selectedTimeSlotId}`))
        : buildingRooms;

    // Check if a day is fully booked — compare against teacher-available slots only
    const isDayFullyBooked = (dayId) => {
        const slotsForDay = teacherHasAvailability
            ? timeSlots.filter(s => teacherAvailableSlotSet.has(`${dayId}-${s.id}`))
            : timeSlots;
        return slotsForDay.length > 0 && slotsForDay.every(s => teacherBusySet.has(`${dayId}-${s.id}`));
    };

    const isValid = selectedDayId && selectedTimeSlotId && selectedRoomId;

    const handleSubmit = async () => {
        setSubmitting(true);
        setError("");
        try {
            const teacherId = teacher.teacherId;

            // Step 1: Assign teacher if not yet assigned
            if (request.status === "Waiting for Admin Approval") {
                await tutoringRequestService.assignTeacher(id, teacherId);
            }

            // Step 2: Schedule session (room, day, time)
            await tutoringRequestService.scheduleSession(id, {
                assignedTeacherId: teacherId,
                roomId: parseInt(selectedRoomId),
                availableDayId: parseInt(selectedDayId),
                availableTimeSlotId: parseInt(selectedTimeSlotId),
            });

            navigate("/schedule-configuration", {
                state: { alert: { type: "success", message: "Session scheduled successfully! Waiting for teacher approval." } },
            });
        } catch (err) {
            const msg = err.response?.data?.message || err.response?.data?.errors?.join(", ") || err.message;
            setError(msg);
            setConfirmOpen(false);
        } finally {
            setSubmitting(false);
        }
    };

    const selectedRoom = rooms.find((r) => String(r.id) === selectedRoomId);
    const selectedDay = days.find((d) => String(d.id) === selectedDayId);
    const selectedSlot = timeSlots.find((s) => String(s.id) === selectedTimeSlotId);

    return (
        <AppLayout title="Schedule Session">
            <div className="space-y-6">
                {loading ? (
                    <DetailViewSkeleton fields={6} />
                ) : !request ? (
                    <Alert variant="destructive">
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription>Request not found.</AlertDescription>
                    </Alert>
                ) : (
                    <>
                        {/* Header */}
                        <div className="flex items-center gap-3">
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <Button variant="outline" size="icon" onClick={() => navigate(`/schedule-configuration/${id}`)}>
                                        <ArrowLeft className="h-4 w-4" />
                                    </Button>
                                </TooltipTrigger>
                                <TooltipContent>Back to details</TooltipContent>
                            </Tooltip>
                            <div>
                                <h1 className="text-3xl font-bold text-gray-900">Schedule Session</h1>
                                <p className="mt-1 text-sm text-gray-600">Set day, time, and room for this request</p>
                            </div>
                        </div>

                        {error && (
                            <Alert variant="destructive">
                                <AlertCircle className="h-4 w-4" />
                                <AlertDescription>{error}</AlertDescription>
                            </Alert>
                        )}

                        {/* Request Summary + Selected Teacher */}
                        <div className="border rounded-lg bg-white p-5">
                            <h3 className="text-sm font-medium text-gray-500 mb-3">Request Summary</h3>
                            <div className="flex items-start justify-between">
                                <div className="space-y-1">
                                    <div className="flex items-center gap-2">
                                        <BookOpen className="h-4 w-4 text-gray-400" />
                                        <span className="font-semibold text-gray-900">{request.subjectName}</span>
                                    </div>
                                    <div className="flex items-center gap-2 text-sm text-gray-600">
                                        <Building2 className="h-3.5 w-3.5" />
                                        <span>{request.buildingName} — {request.departmentName}</span>
                                    </div>
                                    <p className="text-sm text-gray-600">Student: <strong>{request.studentName}</strong></p>
                                </div>
                                <Badge className={getStatusStyle(request.status)}>{request.status}</Badge>
                            </div>

                            <Separator className="my-4" />

                            {/* Selected Teacher */}
                            <div className="flex items-center gap-3 p-3 bg-indigo-50 rounded-lg border border-indigo-200">
                                <div className="h-10 w-10 rounded-full bg-indigo-100 flex items-center justify-center">
                                    <GraduationCap className="h-5 w-5 text-indigo-600" />
                                </div>
                                <div>
                                    <p className="text-xs font-medium text-indigo-600 uppercase tracking-wide">Selected Teacher</p>
                                    <p className="font-semibold text-gray-900">{teacher.teacherName}</p>
                                    {teacher.description && (
                                        <p className="text-sm text-gray-600 italic mt-0.5">"{teacher.description}"</p>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Conflict info banner */}
                        <div className="flex items-start gap-2 p-3 bg-blue-50 border border-blue-200 rounded-lg text-sm text-blue-800">
                            <Info className="h-4 w-4 mt-0.5 flex-shrink-0 text-blue-500" />
                            <span>
                                Only the teacher's available days and time slots are shown.
                                {teacherHasAvailability
                                    ? " Options are further restricted to the teacher's posted availability."
                                    : " (This teacher has not set availability — all days are shown.)"
                                }
                                {" "}Fully-booked and room-conflict slots are automatically excluded.
                            </span>
                        </div>

                        {/* Schedule Form — Day → Time Slot → Room (cascading) */}
                        <div className="border rounded-lg bg-white p-6 space-y-6">
                            {/* Step 1: Day */}
                            <div className="space-y-2">
                                <Label className="flex items-center gap-2">
                                    <Calendar className="h-4 w-4 text-indigo-500" />
                                    Day <span className="text-red-500">*</span>
                                </Label>
                                {availableDays.length === 0 ? (
                                    <Alert><AlertCircle className="h-4 w-4" /><AlertDescription>No available days for this teacher.</AlertDescription></Alert>
                                ) : (
                                    <Select value={selectedDayId} onValueChange={handleDayChange}>
                                        <SelectTrigger className="w-full">
                                            <SelectValue placeholder="Select a day..." />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {availableDays.map((d) => {
                                                const fullyBooked = isDayFullyBooked(d.id);
                                                return (
                                                    <SelectItem key={d.id} value={String(d.id)} disabled={fullyBooked}>
                                                        <span className="flex items-center gap-2">
                                                            {d.dayName || d.name}
                                                            {fullyBooked && (
                                                                <span className="text-xs text-red-500 font-medium">(teacher fully booked)</span>
                                                            )}
                                                        </span>
                                                    </SelectItem>
                                                );
                                            })}
                                        </SelectContent>
                                    </Select>
                                )}
                            </div>

                            {/* Step 2: Time Slot (cascades from Day) */}
                            <div className="space-y-2">
                                <Label className="flex items-center gap-2">
                                    <Clock className="h-4 w-4 text-indigo-500" />
                                    Time Slot <span className="text-red-500">*</span>
                                </Label>
                                {!selectedDayId ? (
                                    <p className="text-sm text-gray-400 italic">Select a day first</p>
                                ) : availableTimeSlots.length === 0 ? (
                                    <Alert>
                                        <AlertCircle className="h-4 w-4" />
                                        <AlertDescription>No available time slots — teacher is fully booked on this day.</AlertDescription>
                                    </Alert>
                                ) : (
                                    <Select value={selectedTimeSlotId} onValueChange={handleTimeSlotChange}>
                                        <SelectTrigger className="w-full">
                                            <SelectValue placeholder="Select a time slot..." />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {availableTimeSlots.map((s) => (
                                                <SelectItem key={s.id} value={String(s.id)}>
                                                    {s.label || s.timeLabel || `${s.startTime} - ${s.endTime}`}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                )}
                            </div>

                            {/* Step 3: Room (cascades from Day + Time Slot, filtered by building) */}
                            <div className="space-y-2">
                                <Label className="flex items-center gap-2">
                                    <DoorOpen className="h-4 w-4 text-indigo-500" />
                                    Room <span className="text-red-500">*</span>
                                </Label>
                                {!selectedTimeSlotId ? (
                                    <p className="text-sm text-gray-400 italic">Select a time slot first</p>
                                ) : buildingRooms.length === 0 ? (
                                    <Alert>
                                        <AlertCircle className="h-4 w-4" />
                                        <AlertDescription>No rooms available for {request.buildingName || "this building"}.</AlertDescription>
                                    </Alert>
                                ) : availableRooms.length === 0 ? (
                                    <Alert>
                                        <AlertCircle className="h-4 w-4" />
                                        <AlertDescription>All rooms in {request.buildingName} are booked at this day and time. Please choose a different time slot.</AlertDescription>
                                    </Alert>
                                ) : (
                                    <Select value={selectedRoomId} onValueChange={setSelectedRoomId}>
                                        <SelectTrigger className="w-full">
                                            <SelectValue placeholder="Select a room..." />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {availableRooms.map((r) => (
                                                <SelectItem key={r.id} value={String(r.id)}>
                                                    {r.name}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                )}
                            </div>

                            <Separator />

                            {/* Actions */}
                            <div className="flex items-center justify-end gap-3">
                                <Button variant="outline" onClick={() => navigate(`/schedule-configuration/${id}`)}>
                                    Cancel
                                </Button>
                                <Button
                                    disabled={!isValid || submitting}
                                    onClick={() => setConfirmOpen(true)}
                                >
                                    <CalendarClock className="h-4 w-4 mr-2" />
                                    Schedule Session
                                </Button>
                            </div>
                        </div>
                    </>
                )}

                {/* Confirmation Dialog */}
                <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Confirm Schedule</DialogTitle>
                            <DialogDescription>
                                Please review the session details before confirming.
                            </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-3 py-2">
                            <div className="grid grid-cols-2 gap-2 text-sm">
                                <span className="text-gray-500">Teacher:</span>
                                <span className="font-medium">{teacher?.teacherName || "—"}</span>
                                <span className="text-gray-500">Day:</span>
                                <span className="font-medium">{selectedDay?.dayName || selectedDay?.name || "—"}</span>
                                <span className="text-gray-500">Time:</span>
                                <span className="font-medium">{selectedSlot?.label || selectedSlot?.timeLabel || "—"}</span>
                                <span className="text-gray-500">Room:</span>
                                <span className="font-medium">{selectedRoom?.name || "—"}</span>
                            </div>
                            <p className="text-xs text-gray-500 mt-2">
                                This will notify the teacher for approval. The session status will change to "Waiting for Teacher Approval".
                            </p>
                        </div>
                        <DialogFooter>
                            <Button variant="outline" onClick={() => setConfirmOpen(false)} disabled={submitting}>
                                Cancel
                            </Button>
                            <Button onClick={handleSubmit} disabled={submitting}>
                                {submitting ? (
                                    <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Scheduling...</>
                                ) : (
                                    <><Check className="h-4 w-4 mr-2" />Confirm</>
                                )}
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>
        </AppLayout>
    );
}
