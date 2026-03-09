import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import AppLayout from "../../layouts/AppLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { lettersOnly } from "../../utils/inputValidation";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { FormSkeleton } from "../../utils/skeletonLoaders";
import { Separator } from "@/components/ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue, } from "@/components/ui/select";
import { Tooltip, TooltipContent, TooltipTrigger, } from "@/components/ui/tooltip";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, } from "@/components/ui/alert-dialog";
import { ArrowLeft, Save, AlertCircle, RotateCcw } from "lucide-react";
import { permissionService } from "@/services/permissionService";

export default function PermissionForm() {
    const navigate = useNavigate();
    const { id } = useParams();
    const isEditMode = Boolean(id);

    /* ------------------------------ State ------------------------------ */
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState("");

    // Form data
    const initialFormData = {
        name: "",
        module: "",
        description: "",
    };

    const [formData, setFormData] = useState(initialFormData);

    // Validation errors
    const [errors, setErrors] = useState({
        name: "",
        module: "",
    });

    // Save confirmation modal
    const [saveModal, setSaveModal] = useState(false);

    // Available modules (mock data)
    const modules = [
        "Users",
        "Roles",
        "Permissions",
        "AutditLogs",
        "Comments",
        "Settings",
        "Reports",
        "Dashboard",
    ];

    /* ------------------------------ Effects ------------------------------ */
    useEffect(() => {
        if (isEditMode) {
            loadPermission();
        } else {
            // For create mode, just show skeleton briefly then show form
            const timer = setTimeout(() => setLoading(false), 500);
            return () => clearTimeout(timer);
        }
    }, [id]);

    /* ------------------------------ API ------------------------------ */
    const loadPermission = async () => {
        setLoading(true);
        setError("");

        try {
            const response = await permissionService.getById(id);
            const permission = response.data;

            setFormData({
                name: permission.name || "",
                module: permission.module || "",
                description: permission.description || "",
            });
        } catch (err) {
            setError(err.message || "Failed to load permission");
        } finally {
            setLoading(false);
        }
    };

    /* ------------------------------ Handlers ------------------------------ */
    const goBack = () => navigate("/permissions");

    const handleClear = () => {
        setFormData(initialFormData);
        setErrors({ name: "", module: "" });
    };

    const handleInputChange = (field, value) => {
        setFormData((prev) => ({ ...prev, [field]: value }));
        // Clear error when user starts typing
        if (errors[field]) {
            setErrors((prev) => ({ ...prev, [field]: "" }));
        }
    };

    const validateForm = () => {
        const newErrors = { name: "", module: "" };
        let isValid = true;

        // Validate name
        if (!formData.name.trim()) {
            newErrors.name = "Permission name is required";
            isValid = false;
        } else if (!/^[a-zA-Z\s.]+$/.test(formData.name)) {
            newErrors.name = "Only letters, spaces, and dots are allowed";
            isValid = false;
        }

        // Validate module
        if (!formData.module) {
            newErrors.module = "Please select a module";
            isValid = false;
        }

        setErrors(newErrors);
        return isValid;
    };

    const handleSubmit = (e) => {
        e.preventDefault();

        if (!validateForm()) return;

        // Open confirmation modal
        setSaveModal(true);
    };

    const confirmSave = async () => {
        setSaveModal(false);
        setSubmitting(true);
        setError("");

        try {
            const permissionData = {
                name: formData.name,
                module: formData.module,
                description: formData.description || null,
            };

            if (isEditMode) {
                await permissionService.update(id, permissionData);
            } else {
                await permissionService.create(permissionData);
            }

            // Navigate to Index with alert state
            navigate("/permissions", {
                state: {
                    alert: {
                        type: "success",
                        message: isEditMode
                            ? `Permission "${formData.name}" updated successfully!`
                            : `Permission "${formData.name}" created successfully!`,
                    },
                },
            });
        } catch (err) {
            setError(err.message || "Failed to save permission");
            setSubmitting(false);
        }
    };

    /* ------------------------------ Render ------------------------------ */
    return (
        <AppLayout title={isEditMode ? "Edit Permission" : "Create Permission"}>
            <div className="space-y-6">
                {/* Alerts */}
                {error && (
                    <Alert variant="destructive">
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription>{error}</AlertDescription>
                    </Alert>
                )}

                {loading ? (
                    <FormSkeleton fields={3} showTabs={false} />
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
                                <TooltipContent>Back to permissions</TooltipContent>
                            </Tooltip>
                            <div>
                                <h1 className="text-3xl font-bold text-gray-900">
                                    {isEditMode ? "Edit Permission" : "Create Permission"}
                                </h1>
                                <p className="mt-1 text-sm text-gray-600">
                                    {isEditMode
                                        ? "Update the permission details below"
                                        : "Define a new access control rule for the system."}
                                </p>
                            </div>
                        </div>

                        {/* Separator */}
                        <Separator />

                        {/* Form Content - Centered */}
                        <div className="max-w-4xl mx-auto">
                            <form onSubmit={handleSubmit} className="space-y-6 pt-2 animate-in fade-in slide-in-from-bottom-4 duration-500">
                                {/* Row 1: Name and Module - Equal Width */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    {/* Permission Name */}
                                    <div className="space-y-2">
                                        <Label
                                            htmlFor="name"
                                            className="text-sm font-medium text-gray-900"
                                        >
                                            Permission Name <span className="text-red-500">*</span>
                                        </Label>
                                        <Input
                                            id="name"
                                            type="text"
                                            placeholder="e.g. campaign manage"
                                            value={formData.name}
                                            onChange={(e) => handleInputChange("name", lettersOnly(e.target.value))}
                                            className={`h-10 ${errors.name
                                                ? "border-red-500 focus-visible:ring-red-500"
                                                : ""
                                                }`}
                                            disabled={submitting}
                                        />
                                        {errors.name ? (
                                            <p className="text-xs text-red-500">{errors.name}</p>
                                        ) : (
                                            <p className="text-xs text-gray-500">
                                                Must be unique across the system (letters and spaces only)
                                            </p>
                                        )}
                                    </div>

                                    {/* Module */}
                                    <div className="space-y-2">
                                        <Label
                                            htmlFor="module"
                                            className="text-sm font-medium text-gray-900"
                                        >
                                            Module <span className="text-red-500">*</span>
                                        </Label>
                                        <Select
                                            value={formData.module}
                                            onValueChange={(value) => handleInputChange("module", value)}
                                            disabled={submitting}
                                        >
                                            <SelectTrigger
                                                id="module"
                                                className={`h-10 w-full ${errors.module
                                                    ? "border-red-500 focus-visible:ring-red-500"
                                                    : ""
                                                    }`}
                                            >
                                                <SelectValue placeholder="Select module" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {modules.map((mod) => (
                                                    <SelectItem key={mod} value={mod}>
                                                        {mod}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        {errors.module ? (
                                            <p className="text-xs text-red-500">{errors.module}</p>
                                        ) : (
                                            <p className="text-xs text-gray-500">
                                                Select the module this permission belongs to
                                            </p>
                                        )}
                                    </div>
                                </div>

                                {/* Row 2: Description */}
                                <div className="space-y-2">
                                    <Label
                                        htmlFor="description"
                                        className="text-sm font-medium text-gray-900"
                                    >
                                        Description{" "}
                                        <span className="text-gray-400 font-normal">(optional)</span>
                                    </Label>
                                    <Textarea
                                        id="description"
                                        placeholder="What can this permission do? Explain the scope of access."
                                        value={formData.description}
                                        onChange={(e) =>
                                            handleInputChange("description", e.target.value)
                                        }
                                        className="min-h-[120px] resize-y"
                                        disabled={submitting}
                                    />
                                </div>

                                {/* Bottom Separator */}
                                <Separator />

                                {/* Footer Actions */}
                                <div className="flex items-center justify-end gap-3 pt-2">
                                    <Button
                                        type="button"
                                        variant="outline"
                                        onClick={handleClear}
                                        disabled={submitting}
                                    >
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
                                                {isEditMode ? "Save Permission" : "Save Permission"}
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
                            {isEditMode ? "Update Permission" : "Create Permission"}
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                            Are you sure you want to {isEditMode ? "update" : "create"} the permission{" "}
                            <span className="font-semibold">"{formData.name}"</span>?
                            {isEditMode
                                ? " This will update the existing permission details."
                                : " This will add a new permission to the system."}
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
