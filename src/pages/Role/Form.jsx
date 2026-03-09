import { useEffect, useState, useMemo } from "react";
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
import { Checkbox } from "@/components/ui/checkbox";
import { roleService } from "@/services/roleService";
import { permissionService } from "@/services/permissionService";
import {
    Tooltip,
    TooltipContent,
    TooltipTrigger,
} from "@/components/ui/tooltip";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { ArrowLeft, Save, AlertCircle, RotateCcw } from "lucide-react";

export default function RoleForm() {
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
        description: "",
        permissions: [],
    };

    const [formData, setFormData] = useState(initialFormData);

    // Validation errors
    const [errors, setErrors] = useState({
        name: "",
        permissions: "",
    });

    // Save confirmation modal
    const [saveModal, setSaveModal] = useState(false);

    // Available permissions state
    const [availablePermissions, setAvailablePermissions] = useState([]);

    /* ------------------------------ Derived State ------------------------------ */
    // Group permissions by module
    const permissionsByModule = useMemo(() => {
        return availablePermissions.reduce((acc, permission) => {
            const module = permission.module || "Other";
            if (!acc[module]) {
                acc[module] = [];
            }
            acc[module].push(permission);
            return acc;
        }, {});
    }, [availablePermissions]);

    // Sort modules alphabetically
    const sortedModules = useMemo(() => {
        return Object.keys(permissionsByModule).sort();
    }, [permissionsByModule]);

    /* ------------------------------ Effects ------------------------------ */
    useEffect(() => {
        loadPermissions();
    }, []);

    useEffect(() => {
        if (isEditMode) {
            loadRole();
        } else {
            // For create mode, just show skeleton briefly then show form
            const timer = setTimeout(() => setLoading(false), 500);
            return () => clearTimeout(timer);
        }
    }, [id]);

    /* ------------------------------ API ------------------------------ */
    const loadPermissions = async () => {
        try {
            // Fetch all permissions (using a large page size to get all)
            const response = await permissionService.getAll({ pageSize: 1000 });

            // Defensively extract and transform items
            // response can be { data: { items: [] } } or { items: [] } depending on intercepted ApiResponse
            const rawItems = response.data?.items || response.items || [];

            const transformed = rawItems.map(p => ({
                id: p.id || p.Id,
                name: p.name || p.Name,
                module: p.module || p.Module || "Other",
                description: p.description || p.Description || ""
            }));

            setAvailablePermissions(transformed);
        } catch (err) {
            console.error("Failed to load permissions:", err);
            setError("Failed to load available permissions.");
        }
    };

    const loadRole = async () => {
        setLoading(true);
        setError("");

        try {
            const response = await roleService.getById(id);
            // Handle structured ApiResponse wrapper
            const role = response.data || response;

            // Defensively extract permissions IDs
            const rawPermissions = role.permissions || role.Permissions || [];
            const permissionIds = rawPermissions.map(p => p.id || p.Id).filter(id => id != null);

            setFormData({
                name: role.name || role.Name || "",
                description: role.description || role.Description || "",
                permissions: permissionIds,
            });
        } catch (err) {
            console.error("Failed to load role:", err);
            setError(err.message || "Failed to load role");
        } finally {
            setLoading(false);
        }
    };

    /* ------------------------------ Handlers ------------------------------ */
    const goBack = () => navigate("/roles");

    const handleClear = () => {
        setFormData(initialFormData);
        setErrors({ name: "", permissions: "" });
    };

    const handleInputChange = (field, value) => {
        setFormData((prev) => ({ ...prev, [field]: value }));
        // Clear error when user starts typing
        if (errors[field]) {
            setErrors((prev) => ({ ...prev, [field]: "" }));
        }
    };

    const handlePermissionToggle = (permId) => {
        setFormData((prev) => {
            const newPermissions = prev.permissions.includes(permId)
                ? prev.permissions.filter((id) => id !== permId)
                : [...prev.permissions, permId];
            return { ...prev, permissions: newPermissions };
        });
        // Clear permission error when user selects
        if (errors.permissions) {
            setErrors((prev) => ({ ...prev, permissions: "" }));
        }
    };

    const handleModuleSelectAll = (module) => {
        const perms = permissionsByModule[module] || [];
        const modulePerms = perms.map((p) => p.id);
        const allSelected = modulePerms.length > 0 && modulePerms.every((id) => formData.permissions.includes(id));

        setFormData((prev) => {
            let newPermissions;
            if (allSelected) {
                newPermissions = prev.permissions.filter((id) => !modulePerms.includes(id));
            } else {
                newPermissions = [...new Set([...prev.permissions, ...modulePerms])];
            }
            return { ...prev, permissions: newPermissions };
        });
        if (errors.permissions) {
            setErrors((prev) => ({ ...prev, permissions: "" }));
        }
    };

    const validateForm = () => {
        const newErrors = { name: "", permissions: "" };
        let isValid = true;

        // Validate name
        if (!formData.name.trim()) {
            newErrors.name = "Role name is required";
            isValid = false;
        } else if (!/^[a-zA-Z\s]+$/.test(formData.name)) {
            newErrors.name = "Only letters and spaces are allowed";
            isValid = false;
        }

        // Validate permissions
        if (formData.permissions.length === 0) {
            newErrors.permissions = "Please select at least one permission";
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
            const roleData = {
                name: formData.name,
                description: formData.description || null,
                permissionIds: formData.permissions,
            };

            if (isEditMode) {
                await roleService.update(id, roleData);
            } else {
                await roleService.create(roleData);
            }

            // Navigate to Index with alert state
            navigate("/roles", {
                state: {
                    alert: {
                        type: "success",
                        message: isEditMode
                            ? `Role "${formData.name}" updated successfully!`
                            : `Role "${formData.name}" created successfully!`,
                    },
                },
            });
        } catch (err) {
            setError(err.message || "Failed to save role");
            setSubmitting(false);
        }
    };

    /* ------------------------------ Render ------------------------------ */
    return (
        <AppLayout title={isEditMode ? "Edit Role" : "Create Role"}>
            <div className="space-y-6">
                {/* Alerts */}
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
                                <TooltipContent>Back to roles</TooltipContent>
                            </Tooltip>
                            <div>
                                <h1 className="text-3xl font-bold text-gray-900">
                                    {isEditMode ? "Edit Role" : "Create Role"}
                                </h1>
                                <p className="mt-1 text-sm text-gray-600">
                                    {isEditMode
                                        ? "Update the role details below"
                                        : "Define a new role with specific permissions."}
                                </p>
                            </div>
                        </div>

                        {/* Separator */}
                        <Separator />

                        {/* Form Content - Centered */}
                        <div className="max-w-4xl mx-auto">
                            <form onSubmit={handleSubmit} className="space-y-6 pt-2 animate-in fade-in slide-in-from-bottom-4 duration-500">
                                {/* Row 1: Name */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    {/* Role Name */}
                                    <div className="space-y-2">
                                        <Label
                                            htmlFor="name"
                                            className="text-sm font-medium text-gray-900"
                                        >
                                            Role Name <span className="text-red-500">*</span>
                                        </Label>
                                        <Input
                                            id="name"
                                            type="text"
                                            placeholder="e.g. Admin, Manager"
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

                                    {/* Description */}
                                    <div className="space-y-2">
                                        <Label
                                            htmlFor="description"
                                            className="text-sm font-medium text-gray-900"
                                        >
                                            Description{" "}
                                            <span className="text-gray-400 font-normal">(optional)</span>
                                        </Label>
                                        <Input
                                            id="description"
                                            type="text"
                                            placeholder="Brief description of this role"
                                            value={formData.description}
                                            onChange={(e) =>
                                                handleInputChange("description", e.target.value)
                                            }
                                            className="h-10"
                                            disabled={submitting}
                                        />
                                        <p className="text-xs text-gray-500">
                                            Describe the purpose of this role
                                        </p>
                                    </div>
                                </div>

                                {/* Row 2: Permissions */}
                                <div className="space-y-3">
                                    <Label className="text-sm font-medium text-gray-900">
                                        Permissions <span className="text-red-500">*</span>
                                        <span className="ml-2 text-gray-500 font-normal">
                                            ({formData.permissions.length} selected)
                                        </span>
                                    </Label>
                                    {errors.permissions && (
                                        <p className="text-xs text-red-500">{errors.permissions}</p>
                                    )}
                                    <div className="border rounded-lg p-4 bg-gray-50">
                                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                            {sortedModules.map((module) => {
                                                const perms = permissionsByModule[module];
                                                const allSelected = perms.every((p) =>
                                                    formData.permissions.includes(p.id)
                                                );
                                                const someSelected = perms.some((p) =>
                                                    formData.permissions.includes(p.id)
                                                );

                                                return (
                                                    <div key={module} className="space-y-2">
                                                        <div className="flex items-center gap-2">
                                                            <Checkbox
                                                                id={`module-${module}`}
                                                                checked={allSelected}
                                                                onCheckedChange={() => handleModuleSelectAll(module)}
                                                                className={someSelected && !allSelected ? "opacity-50" : ""}
                                                                disabled={submitting}
                                                            />
                                                            <Label
                                                                htmlFor={`module-${module}`}
                                                                className="text-sm font-semibold text-gray-800 cursor-pointer"
                                                            >
                                                                {module}
                                                            </Label>
                                                        </div>
                                                        <div className="ml-6 space-y-1">
                                                            {perms.map((perm, index) => (
                                                                <div key={perm.id || index} className="flex items-center gap-2">
                                                                    <Checkbox
                                                                        id={`perm-${perm.id}-${module}`}
                                                                        checked={formData.permissions.includes(perm.id)}
                                                                        onCheckedChange={() => handlePermissionToggle(perm.id)}
                                                                        disabled={submitting}
                                                                    />
                                                                    <Label
                                                                        htmlFor={`perm-${perm.id}-${module}`}
                                                                        className="text-sm text-gray-600 cursor-pointer"
                                                                    >
                                                                        {perm.name}
                                                                    </Label>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
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
                                                {isEditMode ? "Save Role" : "Save Role"}
                                            </>
                                        )}
                                    </Button>
                                </div>
                            </form>
                        </div>
                    </>
                )
                }
            </div >

            {/* Save Confirmation Dialog */}
            < AlertDialog open={saveModal} onOpenChange={setSaveModal} >
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>
                            {isEditMode ? "Update Role" : "Create Role"}
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                            Are you sure you want to {isEditMode ? "update" : "create"} the role{" "}
                            <span className="font-semibold">"{formData.name}"</span> with{" "}
                            <span className="font-semibold">{formData.permissions.length} permissions</span>?
                            {isEditMode
                                ? " This will update the existing role details."
                                : " This will add a new role to the system."}
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={confirmSave}>
                            {isEditMode ? "Update" : "Create"}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog >
        </AppLayout >
    );
}
