import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { subjectService } from "../../services/subjectService";
import { departmentService } from "../../services/departmentService";
import AppLayout from "../../layouts/AppLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { lettersOnly } from "../../utils/inputValidation";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { FormSkeleton } from "../../utils/skeletonLoaders";
import { Separator } from "@/components/ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { ArrowLeft, Save, AlertCircle, RotateCcw } from "lucide-react";

export default function SubjectForm() {
    const navigate = useNavigate();
    const { id } = useParams();
    const isEditMode = Boolean(id);

    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState("");
    const [departments, setDepartments] = useState([]);

    const initialFormData = { name: "", departmentId: "", isActive: "active", description: "" };
    const [formData, setFormData] = useState(initialFormData);
    const [errors, setErrors] = useState({});
    const [saveModal, setSaveModal] = useState(false);

    useEffect(() => {
        loadDepartments();
        if (isEditMode) {
            loadSubject();
        } else {
            const timer = setTimeout(() => setLoading(false), 500);
            return () => clearTimeout(timer);
        }
    }, [id]);

    const loadDepartments = async () => {
        try {
            const response = await departmentService.getAll({ pageNumber: 1, pageSize: 100 });
            const data = response.data?.items || [];
            setDepartments(data.map(d => ({ id: d.id, name: d.name, code: d.code })));
        } catch (err) {
            console.error("Failed to load departments:", err);
        }
    };

    const loadSubject = async () => {
        setLoading(true);
        setError("");
        try {
            const response = await subjectService.getById(id);
            const data = response.data;
            if (!data) throw new Error("Subject not found");
            setFormData({
                name: data.name || "",
                departmentId: String(data.departmentId),
                isActive: data.isActive ? "active" : "inactive",
                description: data.description || "",
            });
        } catch (err) {
            setError(err.response?.data?.message || err.message || "Failed to load subject");
        } finally {
            setLoading(false);
        }
    };

    const goBack = () => navigate("/subjects");

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

        if (!formData.name.trim()) { newErrors.name = "Subject name is required"; isValid = false; }
        else if (!/^[a-zA-Z\s]+$/.test(formData.name)) { newErrors.name = "Only letters and spaces are allowed"; isValid = false; }

        if (!formData.departmentId) { newErrors.departmentId = "Department is required"; isValid = false; }

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
                departmentId: parseInt(formData.departmentId),
                description: formData.description.trim() || null,
                isActive: formData.isActive === "active",
            };
            if (isEditMode) {
                await subjectService.update(id, payload);
            } else {
                await subjectService.create(payload);
            }
            navigate("/subjects", {
                state: { alert: { type: "success", message: isEditMode ? `Subject "${formData.name}" updated successfully!` : `Subject "${formData.name}" created successfully!` } },
            });
        } catch (err) {
            setError(err.response?.data?.message || err.message || "Failed to save subject");
            setSubmitting(false);
        }
    };

    return (
        <AppLayout title={isEditMode ? "Edit Subject" : "Create Subject"}>
            <div className="space-y-6">
                {error && (
                    <Alert variant="destructive">
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription>{error}</AlertDescription>
                    </Alert>
                )}

                {loading ? (
                    <FormSkeleton fields={4} showTabs={false} />
                ) : (
                    <>
                        <div className="flex items-center gap-3">
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <Button variant="outline" size="icon" onClick={goBack}>
                                        <ArrowLeft className="h-4 w-4" />
                                    </Button>
                                </TooltipTrigger>
                                <TooltipContent>Back to subjects</TooltipContent>
                            </Tooltip>
                            <div>
                                <h1 className="text-3xl font-bold text-gray-900">
                                    {isEditMode ? "Edit Subject" : "Create Subject"}
                                </h1>
                                <p className="mt-1 text-sm text-gray-600">
                                    {isEditMode ? "Update the academic subject details below" : "Add a new academic subject to the curriculum"}
                                </p>
                            </div>
                        </div>

                        <Separator />

                        <div className="max-w-4xl mx-auto">
                            <form onSubmit={handleSubmit} className="space-y-6 pt-2 animate-in fade-in slide-in-from-bottom-4 duration-500">
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                    <div className="space-y-2 md:col-span-2">
                                        <Label htmlFor="name" className="text-sm font-medium text-gray-900">
                                            Subject Name <span className="text-red-500">*</span>
                                        </Label>
                                        <Input
                                            id="name"
                                            type="text"
                                            placeholder="e.g. Mathematics"
                                            value={formData.name}
                                            onChange={(e) => handleInputChange("name", lettersOnly(e.target.value))}
                                            className={`h-10 ${errors.name ? "border-red-500 focus-visible:ring-red-500" : ""}`}
                                            disabled={submitting}
                                        />
                                        {errors.name ? (
                                            <p className="text-xs text-red-500">{errors.name}</p>
                                        ) : (
                                            <p className="text-xs text-gray-500">The primary title of the subject</p>
                                        )}
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="isActive" className="text-sm font-medium text-gray-900">
                                            Status <span className="text-red-500">*</span>
                                        </Label>
                                        <Select
                                            value={formData.isActive}
                                            onValueChange={(value) => handleInputChange("isActive", value)}
                                            disabled={submitting}
                                        >
                                            <SelectTrigger id="isActive" className="h-10 w-full">
                                                <SelectValue placeholder="Select status" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="active">Active</SelectItem>
                                                <SelectItem value="inactive">Inactive</SelectItem>
                                            </SelectContent>
                                        </Select>
                                        <p className="text-xs text-gray-500">Manage subject availability</p>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <Label htmlFor="departmentId" className="text-sm font-medium text-gray-900">
                                            Department <span className="text-red-500">*</span>
                                        </Label>
                                        <Select
                                            value={formData.departmentId}
                                            onValueChange={(value) => handleInputChange("departmentId", value)}
                                            disabled={submitting}
                                        >
                                            <SelectTrigger id="departmentId" className={`h-10 w-full ${errors.departmentId ? "border-red-500 focus-visible:ring-red-500" : ""}`}>
                                                <SelectValue placeholder="Select department" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {departments.map((d) => (
                                                    <SelectItem key={d.id} value={String(d.id)}>
                                                        {d.name} ({d.code})
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        {errors.departmentId ? (
                                            <p className="text-xs text-red-500">{errors.departmentId}</p>
                                        ) : (
                                            <p className="text-xs text-gray-500">The department this subject belongs to</p>
                                        )}
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="description" className="text-sm font-medium text-gray-900">
                                        Description <span className="text-gray-400 font-normal">(optional)</span>
                                    </Label>
                                    <Textarea
                                        id="description"
                                        placeholder="Briefly describe the topics covered in this subject."
                                        value={formData.description}
                                        onChange={(e) => handleInputChange("description", e.target.value)}
                                        className="min-h-[120px] resize-y"
                                        disabled={submitting}
                                    />
                                </div>

                                <Separator />

                                <div className="flex items-center justify-end gap-3 pt-2">
                                    <Button type="button" variant="outline" onClick={handleClear} disabled={submitting}>
                                        <RotateCcw className="h-4 w-4 mr-2" />
                                        Clear
                                    </Button>
                                    <Button type="submit" disabled={submitting}>
                                        {submitting ? (
                                            <>
                                                <span className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                                                Saving...
                                            </>
                                        ) : (
                                            <>
                                                <Save className="h-4 w-4 mr-2" />
                                                {isEditMode ? "Save Changes" : "Save Subject"}
                                            </>
                                        )}
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
                        <AlertDialogTitle>{isEditMode ? "Update Subject" : "Create Subject"}</AlertDialogTitle>
                        <AlertDialogDescription>
                            Are you sure you want to {isEditMode ? "update" : "create"} the subject{" "}
                            <span className="font-semibold text-gray-900">"{formData.name}"</span>?
                            {isEditMode ? " This will update the existing subject record." : " This will add a new subject to the curriculum."}
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={confirmSave}>
                            {isEditMode ? "Update" : "Create"}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </AppLayout>
    );
}
