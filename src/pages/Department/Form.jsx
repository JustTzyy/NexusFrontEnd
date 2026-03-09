import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { departmentService } from "../../services/departmentService";
import AppLayout from "../../layouts/AppLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { FormSkeleton } from "../../utils/skeletonLoaders";
import { Separator } from "@/components/ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { ArrowLeft, Save, AlertCircle, RotateCcw } from "lucide-react";
import { lettersOnly } from "../../utils/inputValidation";

export default function DepartmentForm() {
    const navigate = useNavigate();
    const { id } = useParams();
    const isEditMode = Boolean(id);

    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState("");

    const initialFormData = { name: "", code: "", description: "", isActive: "active" };
    const [formData, setFormData] = useState(initialFormData);
    const [errors, setErrors] = useState({});
    const [saveModal, setSaveModal] = useState(false);

    useEffect(() => {
        if (isEditMode) {
            loadDepartment();
        } else {
            const timer = setTimeout(() => setLoading(false), 500);
            return () => clearTimeout(timer);
        }
    }, [id]);

    const loadDepartment = async () => {
        setLoading(true);
        setError("");
        try {
            const response = await departmentService.getById(id);
            const data = response.data;
            if (!data) throw new Error("Department not found");
            setFormData({
                name: data.name || "",
                code: data.code || "",
                description: data.description || "",
                isActive: data.isActive ? "active" : "inactive",
            });
        } catch (err) {
            setError(err.response?.data?.message || err.message || "Failed to load department");
        } finally {
            setLoading(false);
        }
    };

    const goBack = () => navigate("/departments");

    const handleClear = () => {
        setFormData(initialFormData);
        setErrors({});
    };

    const handleInputChange = (field, value) => {
        setFormData((prev) => ({ ...prev, [field]: value }));
        if (errors[field]) setErrors((prev) => ({ ...prev, [field]: "" }));
    };

    const validateForm = () => {
        const newErrors = {};
        let isValid = true;

        if (!formData.name.trim()) { newErrors.name = "Department name is required"; isValid = false; }
        if (!formData.code.trim()) { newErrors.code = "Department code is required"; isValid = false; }
        else if (formData.code.length > 10) { newErrors.code = "Code must be 10 characters or less"; isValid = false; }

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
            const payload = {
                name: formData.name.trim(),
                code: formData.code.toUpperCase().trim(),
                description: formData.description.trim() || null,
                isActive: formData.isActive === "active",
            };
            if (isEditMode) {
                await departmentService.update(id, payload);
            } else {
                await departmentService.create(payload);
            }
            navigate("/departments", {
                state: { alert: { type: "success", message: isEditMode ? `Department "${formData.name}" updated successfully!` : `Department "${formData.name}" created successfully!` } },
            });
        } catch (err) {
            setError(err.response?.data?.message || err.message || "Failed to save department");
            setSubmitting(false);
        }
    };

    return (
        <AppLayout title={isEditMode ? "Edit Department" : "Create Department"}>
            <div className="space-y-6">
                {error && <Alert variant="destructive"><AlertCircle className="h-4 w-4" /><AlertDescription>{error}</AlertDescription></Alert>}

                {loading ? (
                    <FormSkeleton fields={4} showTabs={false} />
                ) : (
                    <>
                        <div className="flex items-center gap-3">
                            <Tooltip><TooltipTrigger asChild><Button variant="outline" size="icon" onClick={goBack}><ArrowLeft className="h-4 w-4" /></Button></TooltipTrigger><TooltipContent>Back to departments</TooltipContent></Tooltip>
                            <div>
                                <h1 className="text-3xl font-bold text-gray-900">{isEditMode ? "Edit Department" : "Create Department"}</h1>
                                <p className="mt-1 text-sm text-gray-600">{isEditMode ? "Update the department details below" : "Add a new academic department"}</p>
                            </div>
                        </div>

                        <Separator />

                        <div className="max-w-4xl mx-auto">
                            <form onSubmit={handleSubmit} className="space-y-6 pt-2 animate-in fade-in slide-in-from-bottom-4 duration-500">
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                    <div className="space-y-2 md:col-span-2">
                                        <Label htmlFor="name" className="text-sm font-medium text-gray-900">Department Name <span className="text-red-500">*</span></Label>
                                        <Input id="name" type="text" placeholder="e.g. Information Technology" value={formData.name} onChange={(e) => handleInputChange("name", e.target.value)} className={`h-10 ${errors.name ? "border-red-500 focus-visible:ring-red-500" : ""}`} disabled={submitting} />
                                        {errors.name ? <p className="text-xs text-red-500">{errors.name}</p> : <p className="text-xs text-gray-500">Full name of the department or strand</p>}
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="code" className="text-sm font-medium text-gray-900">Code <span className="text-red-500">*</span></Label>
                                        <Input id="code" type="text" placeholder="e.g. IT" value={formData.code} onChange={(e) => handleInputChange("code", e.target.value.toUpperCase())} className={`h-10 ${errors.code ? "border-red-500 focus-visible:ring-red-500" : ""}`} disabled={submitting} maxLength={10} />
                                        {errors.code ? <p className="text-xs text-red-500">{errors.code}</p> : <p className="text-xs text-gray-500">Short code (e.g. IT, STEM, ABM)</p>}
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <Label htmlFor="isActive" className="text-sm font-medium text-gray-900">Status <span className="text-red-500">*</span></Label>
                                        <Select value={formData.isActive} onValueChange={(value) => handleInputChange("isActive", value)} disabled={submitting}>
                                            <SelectTrigger id="isActive" className="h-10 w-full"><SelectValue placeholder="Select status" /></SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="active">Active</SelectItem>
                                                <SelectItem value="inactive">Inactive</SelectItem>
                                            </SelectContent>
                                        </Select>
                                        <p className="text-xs text-gray-500">Department availability status</p>
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="description" className="text-sm font-medium text-gray-900">Description <span className="text-gray-400 font-normal">(optional)</span></Label>
                                    <Textarea id="description" placeholder="Briefly describe this department and its focus areas." value={formData.description} onChange={(e) => handleInputChange("description", e.target.value)} className="min-h-[120px] resize-y" disabled={submitting} />
                                </div>

                                <Separator />

                                <div className="flex items-center justify-end gap-3 pt-2">
                                    <Button type="button" variant="outline" onClick={handleClear} disabled={submitting}><RotateCcw className="h-4 w-4 mr-2" />Clear</Button>
                                    <Button type="submit" disabled={submitting}>
                                        {submitting ? (<><span className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />Saving...</>) : (<><Save className="h-4 w-4 mr-2" />{isEditMode ? "Save Changes" : "Save Department"}</>)}
                                    </Button>
                                </div>
                            </form>
                        </div>
                    </>
                )}
            </div>

            <AlertDialog open={saveModal} onOpenChange={setSaveModal}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>{isEditMode ? "Update Department" : "Create Department"}</AlertDialogTitle>
                        <AlertDialogDescription>Are you sure you want to {isEditMode ? "update" : "create"} the department <span className="font-semibold text-gray-900">"{formData.name}"</span>?{isEditMode ? " This will update the existing department record." : " This will add a new department to the system."}</AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={confirmSave}>{isEditMode ? "Update" : "Create"}</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </AppLayout>
    );
}
