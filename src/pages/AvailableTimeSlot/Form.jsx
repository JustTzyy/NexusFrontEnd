import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { availableTimeSlotService } from "../../services/availableTimeSlotService";
import AppLayout from "../../layouts/AppLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { FormSkeleton } from "../../utils/skeletonLoaders";
import { Separator } from "@/components/ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { ArrowLeft, Save, AlertCircle, RotateCcw } from "lucide-react";

export default function AvailableTimeSlotForm() {
    const navigate = useNavigate();
    const { id } = useParams();
    const isEditMode = Boolean(id);

    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState("");

    const initialFormData = { startTime: "", endTime: "", isActive: "active" };
    const [formData, setFormData] = useState(initialFormData);
    const [errors, setErrors] = useState({});
    const [saveModal, setSaveModal] = useState(false);

    useEffect(() => {
        if (isEditMode) {
            const load = async () => {
                setLoading(true); setError("");
                try {
                    const response = await availableTimeSlotService.getById(id);
                    const data = response.data;
                    if (!data) throw new Error("Time slot not found");
                    setFormData({ startTime: data.startTime, endTime: data.endTime, isActive: data.isActive ? "active" : "inactive" });
                } catch (err) { setError(err.message); } finally { setLoading(false); }
            };
            load();
        } else {
            const timer = setTimeout(() => setLoading(false), 500);
            return () => clearTimeout(timer);
        }
    }, [id]);

    const goBack = () => navigate("/available-time-slots");
    const handleClear = () => { setFormData(initialFormData); setErrors({}); };

    const handleInputChange = (field, value) => {
        setFormData(prev => ({ ...prev, [field]: value }));
        if (errors[field]) setErrors(prev => ({ ...prev, [field]: "" }));
    };

    const validateForm = () => {
        const newErrors = {};
        let isValid = true;
        if (!formData.startTime) { newErrors.startTime = "Start time is required"; isValid = false; }
        if (!formData.endTime) { newErrors.endTime = "End time is required"; isValid = false; }
        if (formData.startTime && formData.endTime && formData.endTime <= formData.startTime) {
            newErrors.endTime = "End time must be after start time"; isValid = false;
        }
        setErrors(newErrors);
        return isValid;
    };

    const handleSubmit = (e) => { e.preventDefault(); if (!validateForm()) return; setSaveModal(true); };

    const confirmSave = async () => {
        setSaveModal(false); setSubmitting(true); setError("");
        try {
            const payload = { label: `${formData.startTime} - ${formData.endTime}`, startTime: formData.startTime, endTime: formData.endTime, isActive: formData.isActive === "active" };
            if (isEditMode) { await availableTimeSlotService.update(id, payload); } else { await availableTimeSlotService.create(payload); }
            navigate("/available-time-slots", { state: { alert: { type: "success", message: isEditMode ? "Time slot updated!" : "Time slot created!" } } });
        } catch (err) { setError(err.message); setSubmitting(false); }
    };

    return (
        <AppLayout title={isEditMode ? "Edit Time Slot" : "Add Time Slot"}>
            <div className="space-y-6">
                {error && <Alert variant="destructive"><AlertCircle className="h-4 w-4" /><AlertDescription>{error}</AlertDescription></Alert>}

                {loading ? <FormSkeleton fields={3} showTabs={false} /> : (
                    <>
                        <div className="flex items-center gap-3">
                            <Tooltip><TooltipTrigger asChild><Button variant="outline" size="icon" onClick={goBack}><ArrowLeft className="h-4 w-4" /></Button></TooltipTrigger><TooltipContent>Back to time slots</TooltipContent></Tooltip>
                            <div>
                                <h1 className="text-3xl font-bold text-gray-900">{isEditMode ? "Edit Time Slot" : "Add Time Slot"}</h1>
                                <p className="mt-1 text-sm text-gray-600">{isEditMode ? "Update the time slot details" : "Add a new available time slot"}</p>
                            </div>
                        </div>

                        <Separator />

                        <div className="max-w-4xl mx-auto">
                            <form onSubmit={handleSubmit} className="space-y-6 pt-2 animate-in fade-in slide-in-from-bottom-4 duration-500">
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                    <div className="space-y-2">
                                        <Label className="text-sm font-medium text-gray-900">Start Time <span className="text-red-500">*</span></Label>
                                        <Input type="time" value={formData.startTime} onChange={(e) => handleInputChange("startTime", e.target.value)} className={`h-10 ${errors.startTime ? "border-red-500" : ""}`} disabled={submitting} />
                                        {errors.startTime ? <p className="text-xs text-red-500">{errors.startTime}</p> : <p className="text-xs text-gray-500">Session start time</p>}
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-sm font-medium text-gray-900">End Time <span className="text-red-500">*</span></Label>
                                        <Input type="time" value={formData.endTime} onChange={(e) => handleInputChange("endTime", e.target.value)} className={`h-10 ${errors.endTime ? "border-red-500" : ""}`} disabled={submitting} />
                                        {errors.endTime ? <p className="text-xs text-red-500">{errors.endTime}</p> : <p className="text-xs text-gray-500">Session end time</p>}
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-sm font-medium text-gray-900">Status</Label>
                                        <Select value={formData.isActive} onValueChange={(v) => handleInputChange("isActive", v)} disabled={submitting}>
                                            <SelectTrigger className="h-10"><SelectValue /></SelectTrigger>
                                            <SelectContent><SelectItem value="active">Active</SelectItem><SelectItem value="inactive">Inactive</SelectItem></SelectContent>
                                        </Select>
                                        <p className="text-xs text-gray-500">Availability status</p>
                                    </div>
                                </div>

                                {formData.startTime && formData.endTime && formData.endTime > formData.startTime && (
                                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                                        <p className="text-sm text-blue-800">Preview label: <span className="font-semibold">{formData.startTime} - {formData.endTime}</span></p>
                                    </div>
                                )}

                                <Separator />

                                <div className="flex items-center justify-end gap-3 pt-2">
                                    <Button type="button" variant="outline" onClick={handleClear} disabled={submitting}><RotateCcw className="h-4 w-4 mr-2" />Clear</Button>
                                    <Button type="submit" disabled={submitting}>
                                        {submitting ? (<><span className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />Saving...</>) : (<><Save className="h-4 w-4 mr-2" />{isEditMode ? "Save Changes" : "Save Time Slot"}</>)}
                                    </Button>
                                </div>
                            </form>
                        </div>
                    </>
                )}
            </div>

            <AlertDialog open={saveModal} onOpenChange={setSaveModal}>
                <AlertDialogContent><AlertDialogHeader><AlertDialogTitle>{isEditMode ? "Update Time Slot" : "Add Time Slot"}</AlertDialogTitle><AlertDialogDescription>Are you sure you want to {isEditMode ? "update" : "add"} this time slot?</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel><AlertDialogAction onClick={confirmSave}>{isEditMode ? "Update" : "Add"}</AlertDialogAction></AlertDialogFooter></AlertDialogContent>
            </AlertDialog>
        </AppLayout>
    );
}
