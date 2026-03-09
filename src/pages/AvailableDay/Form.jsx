import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { availableDayService } from "../../services/availableDayService";
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

const DAY_OPTIONS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

export default function AvailableDayForm() {
    const navigate = useNavigate();
    const { id } = useParams();
    const isEditMode = Boolean(id);

    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState("");

    const initialFormData = { dayName: "", sortOrder: "", isActive: "active" };
    const [formData, setFormData] = useState(initialFormData);
    const [errors, setErrors] = useState({});
    const [saveModal, setSaveModal] = useState(false);

    useEffect(() => {
        if (isEditMode) {
            loadDay();
        } else {
            const timer = setTimeout(() => setLoading(false), 500);
            return () => clearTimeout(timer);
        }
    }, [id]);

    const loadDay = async () => {
        setLoading(true);
        setError("");
        try {
            const response = await availableDayService.getById(id);
            const data = response.data;
            if (!data) throw new Error("Day not found");
            setFormData({ dayName: data.dayName, sortOrder: String(data.sortOrder), isActive: data.isActive ? "active" : "inactive" });
        } catch (err) {
            setError(err.message || "Failed to load day");
        } finally {
            setLoading(false);
        }
    };

    const goBack = () => navigate("/available-days");
    const handleClear = () => { setFormData(initialFormData); setErrors({}); };

    const handleInputChange = (field, value) => {
        setFormData((prev) => ({ ...prev, [field]: value }));
        if (errors[field]) setErrors((prev) => ({ ...prev, [field]: "" }));
    };

    const validateForm = () => {
        const newErrors = {};
        let isValid = true;
        if (!formData.dayName) { newErrors.dayName = "Day is required"; isValid = false; }
        if (!formData.sortOrder || isNaN(Number(formData.sortOrder))) { newErrors.sortOrder = "Valid sort order is required"; isValid = false; }
        setErrors(newErrors);
        return isValid;
    };

    const handleSubmit = (e) => { e.preventDefault(); if (!validateForm()) return; setSaveModal(true); };

    const confirmSave = async () => {
        setSaveModal(false);
        setSubmitting(true);
        setError("");
        try {
            const payload = { dayName: formData.dayName, sortOrder: Number(formData.sortOrder), isActive: formData.isActive === "active" };
            if (isEditMode) { await availableDayService.update(id, payload); } else { await availableDayService.create(payload); }
            navigate("/available-days", { state: { alert: { type: "success", message: isEditMode ? `"${formData.dayName}" updated successfully!` : `"${formData.dayName}" added successfully!` } } });
        } catch (err) {
            setError(err.message || "Failed to save day");
            setSubmitting(false);
        }
    };

    return (
        <AppLayout title={isEditMode ? "Edit Day" : "Add Day"}>
            <div className="space-y-6">
                {error && <Alert variant="destructive"><AlertCircle className="h-4 w-4" /><AlertDescription>{error}</AlertDescription></Alert>}

                {loading ? <FormSkeleton fields={3} showTabs={false} /> : (
                    <>
                        <div className="flex items-center gap-3">
                            <Tooltip><TooltipTrigger asChild><Button variant="outline" size="icon" onClick={goBack}><ArrowLeft className="h-4 w-4" /></Button></TooltipTrigger><TooltipContent>Back to available days</TooltipContent></Tooltip>
                            <div>
                                <h1 className="text-3xl font-bold text-gray-900">{isEditMode ? "Edit Day" : "Add Available Day"}</h1>
                                <p className="mt-1 text-sm text-gray-600">{isEditMode ? "Update the day details" : "Add a new day for tutoring availability"}</p>
                            </div>
                        </div>

                        <Separator />

                        <div className="max-w-4xl mx-auto">
                            <form onSubmit={handleSubmit} className="space-y-6 pt-2 animate-in fade-in slide-in-from-bottom-4 duration-500">
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                    <div className="space-y-2">
                                        <Label className="text-sm font-medium text-gray-900">Day <span className="text-red-500">*</span></Label>
                                        <Select value={formData.dayName} onValueChange={(v) => handleInputChange("dayName", v)} disabled={submitting}>
                                            <SelectTrigger className={`h-10 ${errors.dayName ? "border-red-500" : ""}`}><SelectValue placeholder="Select day" /></SelectTrigger>
                                            <SelectContent>{DAY_OPTIONS.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}</SelectContent>
                                        </Select>
                                        {errors.dayName ? <p className="text-xs text-red-500">{errors.dayName}</p> : <p className="text-xs text-gray-500">Day of the week</p>}
                                    </div>

                                    <div className="space-y-2">
                                        <Label className="text-sm font-medium text-gray-900">Sort Order <span className="text-red-500">*</span></Label>
                                        <Input type="number" min="1" max="7" placeholder="e.g. 1" value={formData.sortOrder} onChange={(e) => handleInputChange("sortOrder", e.target.value)} className={`h-10 ${errors.sortOrder ? "border-red-500" : ""}`} disabled={submitting} />
                                        {errors.sortOrder ? <p className="text-xs text-red-500">{errors.sortOrder}</p> : <p className="text-xs text-gray-500">Display order (1 = first)</p>}
                                    </div>

                                    <div className="space-y-2">
                                        <Label className="text-sm font-medium text-gray-900">Status <span className="text-red-500">*</span></Label>
                                        <Select value={formData.isActive} onValueChange={(v) => handleInputChange("isActive", v)} disabled={submitting}>
                                            <SelectTrigger className="h-10"><SelectValue /></SelectTrigger>
                                            <SelectContent><SelectItem value="active">Active</SelectItem><SelectItem value="inactive">Inactive</SelectItem></SelectContent>
                                        </Select>
                                        <p className="text-xs text-gray-500">Availability status</p>
                                    </div>
                                </div>

                                <Separator />

                                <div className="flex items-center justify-end gap-3 pt-2">
                                    <Button type="button" variant="outline" onClick={handleClear} disabled={submitting}><RotateCcw className="h-4 w-4 mr-2" />Clear</Button>
                                    <Button type="submit" disabled={submitting}>
                                        {submitting ? (<><span className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />Saving...</>) : (<><Save className="h-4 w-4 mr-2" />{isEditMode ? "Save Changes" : "Save Day"}</>)}
                                    </Button>
                                </div>
                            </form>
                        </div>
                    </>
                )}
            </div>

            <AlertDialog open={saveModal} onOpenChange={setSaveModal}>
                <AlertDialogContent>
                    <AlertDialogHeader><AlertDialogTitle>{isEditMode ? "Update Day" : "Add Day"}</AlertDialogTitle><AlertDialogDescription>Are you sure you want to {isEditMode ? "update" : "add"} <span className="font-semibold">"{formData.dayName}"</span>?</AlertDialogDescription></AlertDialogHeader>
                    <AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel><AlertDialogAction onClick={confirmSave}>{isEditMode ? "Update" : "Add"}</AlertDialogAction></AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </AppLayout>
    );
}
