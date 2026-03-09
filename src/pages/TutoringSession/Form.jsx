import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import AppLayout from "../../layouts/AppLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { FormSkeleton } from "../../utils/skeletonLoaders";
import { Separator } from "@/components/ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Textarea } from "@/components/ui/textarea";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { ArrowLeft, Save, AlertCircle, RotateCcw, Calendar, Clock, BookOpen, User, Home, Check, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";

export default function TutoringSessionForm() {
    const navigate = useNavigate();
    const { id } = useParams();
    const isEditMode = Boolean(id);

    /* ------------------------------ State ------------------------------ */
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState("");

    // Select Data Mocks
    const [subjects, setSubjects] = useState([]);
    const [teachers, setTeachers] = useState([]);
    const [rooms, setRooms] = useState([]);

    // Form data
    const initialFormData = {
        subjectId: "",
        teacherId: "",
        roomId: "",
        sessionDate: "",
        startTime: "",
        endTime: "",
        status: "scheduled",
        notes: "",
    };

    const [formData, setFormData] = useState(initialFormData);

    // Validation errors
    const [errors, setErrors] = useState({});

    // Save confirmation modal
    const [saveModal, setSaveModal] = useState(false);

    /* ------------------------------ Effects ------------------------------ */
    useEffect(() => {
        loadSelectOptions();
        if (isEditMode) {
            loadSession();
        } else {
            const timer = setTimeout(() => setLoading(false), 500);
            return () => clearTimeout(timer);
        }
    }, [id]);

    /* ------------------------------ API ------------------------------ */
    const loadSelectOptions = async () => {
        try {
            // TODO: replace with real API calls
            setSubjects([]);
            setTeachers([]);
            setRooms([]);
        } catch (err) {
            console.error("Failed to load options", err);
        }
    };

    const loadSession = async () => {
        setLoading(true);
        setError("");
        try {
            // TODO: replace with real API call, e.g. tutoringSessionService.getById(id)
            // setFormData(data);
        } catch (err) {
            setError(err.message || "Failed to load session");
        } finally {
            setLoading(false);
        }
    };

    /* ------------------------------ Handlers ------------------------------ */
    const goBack = () => navigate("/tutoring-sessions");

    const handleClear = () => {
        setFormData(initialFormData);
        setErrors({});
    };

    const handleInputChange = (field, value) => {
        setFormData((prev) => ({ ...prev, [field]: value }));
        if (errors[field]) {
            setErrors((prev) => ({ ...prev, [field]: "" }));
        }
    };

    const validateForm = () => {
        const newErrors = {};
        let isValid = true;

        if (!formData.subjectId) { newErrors.subjectId = "Subject is required"; isValid = false; }
        if (!formData.teacherId) { newErrors.teacherId = "Teacher is required"; isValid = false; }
        if (!formData.roomId) { newErrors.roomId = "Room is required"; isValid = false; }
        if (!formData.sessionDate) { newErrors.sessionDate = "Session date is required"; isValid = false; }
        if (!formData.startTime) { newErrors.startTime = "Start time is required"; isValid = false; }
        if (!formData.endTime) { newErrors.endTime = "End time is required"; isValid = false; }

        // Start vs End time validation
        if (formData.sessionDate && formData.startTime && formData.endTime) {
            const start = new Date(`${formData.sessionDate}T${formData.startTime}`);
            const end = new Date(`${formData.sessionDate}T${formData.endTime}`);
            if (end <= start) {
                newErrors.endTime = "End time must be after start time";
                isValid = false;
            }
        }

        setErrors(newErrors);
        return isValid;
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!validateForm()) return;
        setSaveModal(true);
    };

    const confirmSave = async () => {
        setSaveModal(false);
        setSubmitting(true);
        setError("");

        try {
            await new Promise((resolve) => setTimeout(resolve, 1000));

            // Logic to simulate conflict checking
            const hasConflict = false; // Mock

            if (hasConflict) {
                throw new Error("Conflict detected: Teacher is already assigned to another session at this time.");
            }

            navigate("/tutoring-sessions", {
                state: {
                    alert: {
                        type: "success",
                        message: isEditMode
                            ? "Tutoring session updated successfully!"
                            : "New tutoring session scheduled successfully!",
                    },
                },
            });
        } catch (err) {
            setError(err.message || "Failed to save session");
            setSubmitting(false);
        }
    };

    /* ------------------------------ Render ------------------------------ */
    return (
        <AppLayout title={isEditMode ? "Edit Session" : "Schedule Session"}>
            <div className="space-y-6">
                {error && (
                    <Alert variant="destructive">
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription>{error}</AlertDescription>
                    </Alert>
                )}

                {loading ? (
                    <FormSkeleton fields={6} showTabs={false} />
                ) : (
                    <>
                        {/* Header */}
                        <div className="flex items-center gap-3">
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <Button variant="outline" size="icon" onClick={goBack}>
                                        <ArrowLeft className="h-4 w-4" />
                                    </Button>
                                </TooltipTrigger>
                                <TooltipContent>Back to sessions</TooltipContent>
                            </Tooltip>
                            <div>
                                <h1 className="text-3xl font-bold text-gray-900">
                                    {isEditMode ? "Edit Session" : "Schedule Session"}
                                </h1>
                                <p className="mt-1 text-sm text-gray-600">
                                    {isEditMode
                                        ? "Update the tutoring session details and schedule."
                                        : "Create a new tutoring session by assigning a subject, teacher, and room."}
                                </p>
                            </div>
                        </div>

                        <Separator />

                        {/* Form Content */}
                        <div className="max-w-5xl mx-auto">
                            <form onSubmit={handleSubmit} className="space-y-6 pt-2 animate-in fade-in slide-in-from-bottom-4 duration-500">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">

                                    {/* Left Column: Core Assignments */}
                                    <div className="space-y-6 bg-gray-50/50 p-6 rounded-xl border border-gray-100">
                                        <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                                            <BookOpen className="h-5 w-5 text-blue-600" />
                                            Session Details
                                        </h3>

                                        {/* Subject */}
                                        <div className="space-y-2">
                                            <Label htmlFor="subjectId" className="flex items-center gap-2">
                                                Subject <span className="text-red-500">*</span>
                                            </Label>
                                            <Popover>
                                                <PopoverTrigger asChild>
                                                    <Button
                                                        variant="outline"
                                                        role="combobox"
                                                        className={cn(
                                                            "w-full justify-between font-normal h-10 px-3 hover:bg-white",
                                                            !formData.subjectId && "text-muted-foreground",
                                                            errors.subjectId && "border-red-500"
                                                        )}
                                                    >
                                                        {formData.subjectId
                                                            ? subjects.find((s) => s.id === formData.subjectId)?.name
                                                            : "Select Subject"}
                                                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                                    </Button>
                                                </PopoverTrigger>
                                                <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
                                                    <Command>
                                                        <CommandInput placeholder="Search subject..." />
                                                        <CommandList>
                                                            <CommandEmpty>No subject found.</CommandEmpty>
                                                            <CommandGroup>
                                                                {subjects.map((s) => (
                                                                    <CommandItem
                                                                        key={s.id}
                                                                        value={s.name}
                                                                        onSelect={() => handleInputChange("subjectId", s.id)}
                                                                    >
                                                                        <Check
                                                                            className={cn(
                                                                                "mr-2 h-4 w-4",
                                                                                formData.subjectId === s.id ? "opacity-100" : "opacity-0"
                                                                            )}
                                                                        />
                                                                        {s.name}
                                                                    </CommandItem>
                                                                ))}
                                                            </CommandGroup>
                                                        </CommandList>
                                                    </Command>
                                                </PopoverContent>
                                            </Popover>
                                            {errors.subjectId && <p className="text-xs text-red-500">{errors.subjectId}</p>}
                                        </div>

                                        {/* Teacher */}
                                        <div className="space-y-2">
                                            <Label htmlFor="teacherId" className="flex items-center gap-2">
                                                Teacher <span className="text-red-500">*</span>
                                            </Label>
                                            <Popover>
                                                <PopoverTrigger asChild>
                                                    <Button
                                                        variant="outline"
                                                        role="combobox"
                                                        className={cn(
                                                            "w-full justify-between font-normal h-10 px-3 hover:bg-white",
                                                            !formData.teacherId && "text-muted-foreground",
                                                            errors.teacherId && "border-red-500"
                                                        )}
                                                    >
                                                        {formData.teacherId
                                                            ? teachers.find((t) => t.id === formData.teacherId)?.name
                                                            : "Select Teacher"}
                                                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                                    </Button>
                                                </PopoverTrigger>
                                                <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
                                                    <Command>
                                                        <CommandInput placeholder="Search teacher..." />
                                                        <CommandList>
                                                            <CommandEmpty>No teacher found.</CommandEmpty>
                                                            <CommandGroup>
                                                                {teachers.map((t) => (
                                                                    <CommandItem
                                                                        key={t.id}
                                                                        value={t.name}
                                                                        onSelect={() => handleInputChange("teacherId", t.id)}
                                                                    >
                                                                        <Check
                                                                            className={cn(
                                                                                "mr-2 h-4 w-4",
                                                                                formData.teacherId === t.id ? "opacity-100" : "opacity-0"
                                                                            )}
                                                                        />
                                                                        {t.name}
                                                                    </CommandItem>
                                                                ))}
                                                            </CommandGroup>
                                                        </CommandList>
                                                    </Command>
                                                </PopoverContent>
                                            </Popover>
                                            {errors.teacherId && <p className="text-xs text-red-500">{errors.teacherId}</p>}
                                        </div>

                                        {/* Room */}
                                        <div className="space-y-2">
                                            <Label htmlFor="roomId" className="flex items-center gap-2">
                                                Room <span className="text-red-500">*</span>
                                            </Label>
                                            <Popover>
                                                <PopoverTrigger asChild>
                                                    <Button
                                                        variant="outline"
                                                        role="combobox"
                                                        className={cn(
                                                            "w-full justify-between font-normal h-10 px-3 hover:bg-white",
                                                            !formData.roomId && "text-muted-foreground",
                                                            errors.roomId && "border-red-500"
                                                        )}
                                                    >
                                                        {formData.roomId
                                                            ? rooms.find((r) => r.id === formData.roomId)?.name
                                                            : "Select Room"}
                                                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                                    </Button>
                                                </PopoverTrigger>
                                                <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
                                                    <Command>
                                                        <CommandInput placeholder="Search room..." />
                                                        <CommandList>
                                                            <CommandEmpty>No room found.</CommandEmpty>
                                                            <CommandGroup>
                                                                {rooms.map((r) => (
                                                                    <CommandItem
                                                                        key={r.id}
                                                                        value={r.name}
                                                                        onSelect={() => handleInputChange("roomId", r.id)}
                                                                    >
                                                                        <Check
                                                                            className={cn(
                                                                                "mr-2 h-4 w-4",
                                                                                formData.roomId === r.id ? "opacity-100" : "opacity-0"
                                                                            )}
                                                                        />
                                                                        {r.name}
                                                                    </CommandItem>
                                                                ))}
                                                            </CommandGroup>
                                                        </CommandList>
                                                    </Command>
                                                </PopoverContent>
                                            </Popover>
                                            {errors.roomId && <p className="text-xs text-red-500">{errors.roomId}</p>}
                                        </div>
                                    </div>

                                    {/* Right Column: Schedule */}
                                    <div className="space-y-6 bg-gray-50/50 p-6 rounded-xl border border-gray-100">
                                        <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                                            <Calendar className="h-5 w-5 text-blue-600" />
                                            Schedule & Status
                                        </h3>

                                        {/* Session Date */}
                                        <div className="space-y-2">
                                            <Label>Session Date <span className="text-red-500">*</span></Label>
                                            <Input type="date" value={formData.sessionDate} onChange={(e) => handleInputChange("sessionDate", e.target.value)} className={errors.sessionDate ? "border-red-500" : ""} />
                                            {errors.sessionDate && <p className="text-xs text-red-500">{errors.sessionDate}</p>}
                                        </div>

                                        {/* Times */}
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="space-y-2">
                                                <Label>Start Time <span className="text-red-500">*</span></Label>
                                                <Input type="time" value={formData.startTime} onChange={(e) => handleInputChange("startTime", e.target.value)} className={errors.startTime ? "border-red-500" : ""} />
                                                {errors.startTime && <p className="text-xs text-red-500">{errors.startTime}</p>}
                                            </div>
                                            <div className="space-y-2">
                                                <Label>End Time <span className="text-red-500">*</span></Label>
                                                <Input type="time" value={formData.endTime} onChange={(e) => handleInputChange("endTime", e.target.value)} className={errors.endTime ? "border-red-500" : ""} />
                                                {errors.endTime && <p className="text-xs text-red-500">{errors.endTime}</p>}
                                            </div>
                                        </div>

                                        {/* Status */}
                                        <div className="space-y-2">
                                            <Label>Initial Status</Label>
                                            <Select value={formData.status} onValueChange={(v) => handleInputChange("status", v)}>
                                                <SelectTrigger>
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="scheduled">Scheduled</SelectItem>
                                                    <SelectItem value="draft">Draft</SelectItem>
                                                    {isEditMode && (
                                                        <>
                                                            <SelectItem value="completed">Completed</SelectItem>
                                                            <SelectItem value="cancelled">Cancelled</SelectItem>
                                                        </>
                                                    )}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    </div>
                                </div>

                                {/* Full Width: Notes */}
                                <div className="space-y-2 px-6 pb-6 bg-white border border-gray-100 rounded-xl shadow-sm">
                                    <Label htmlFor="notes" className="pt-6 block text-sm font-medium text-gray-700">Session Notes</Label>
                                    <Textarea
                                        id="notes"
                                        placeholder="e.g. Topics to cover, materials needed, or special instructions."
                                        value={formData.notes}
                                        onChange={(e) => handleInputChange("notes", e.target.value)}
                                        className="min-h-[100px] bg-gray-50/10"
                                    />
                                    <p className="text-xs text-gray-500">Optional notes for the teacher and attendees.</p>
                                </div>

                                <Separator />

                                {/* Footer Actions */}
                                <div className="flex items-center justify-end gap-3 pt-2">
                                    <Button type="button" variant="outline" onClick={handleClear} disabled={submitting}>
                                        <RotateCcw className="h-4 w-4 mr-2" />
                                        Clear
                                    </Button>

                                    <Button type="submit" disabled={submitting} className="min-w-[140px]">
                                        {submitting ? (
                                            <>
                                                <span className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                                                Validating...
                                            </>
                                        ) : (
                                            <>
                                                <Save className="h-4 w-4 mr-2" />
                                                {isEditMode ? "Save Changes" : "Schedule Session"}
                                            </>
                                        )}
                                    </Button>
                                </div>
                            </form>
                        </div>
                    </>
                )}
            </div>

            {/* Save Confirmation Dialog */}
            <AlertDialog open={saveModal} onOpenChange={setSaveModal}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>
                            {isEditMode ? "Update Session" : "Schedule Session"}
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                            Are you sure you want to {isEditMode ? "update" : "schedule"} this session?
                            The system will automatically check for room and teacher conflicts.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={confirmSave}>
                            Confirm
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </AppLayout>
    );
}
