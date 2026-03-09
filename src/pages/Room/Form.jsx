import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { roomService } from "../../services/roomService";
import { buildingService } from "../../services/buildingService";
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

export default function RoomForm() {
    const navigate = useNavigate();
    const { id } = useParams();
    const isEditMode = Boolean(id);

    /* ------------------------------ State ------------------------------ */
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState("");
    const [buildings, setBuildings] = useState([]);
    const [loadingBuildings, setLoadingBuildings] = useState(false);

    // Form data
    const initialFormData = {
        name: "",
        capacity: "",
        isActive: "active",
        buildingId: "",
    };

    const [formData, setFormData] = useState(initialFormData);

    // Validation errors
    const [errors, setErrors] = useState({
        name: "",
        capacity: "",
        isActive: "",
        buildingId: "",
    });

    // Save confirmation modal
    const [saveModal, setSaveModal] = useState(false);

    /* ------------------------------ Effects ------------------------------ */
    useEffect(() => {
        loadBuildings();
        if (isEditMode) {
            loadRoom();
        } else {
            const timer = setTimeout(() => setLoading(false), 500);
            return () => clearTimeout(timer);
        }
    }, [id]);

    /* ------------------------------ API ------------------------------ */
    const loadBuildings = async () => {
        setLoadingBuildings(true);
        try {
            const response = await buildingService.getAll({ pageNumber: 1, pageSize: 100 });
            const data = response.data?.items || [];
            setBuildings(data.map(b => ({ id: b.id, name: b.name })));
        } catch (err) {
            console.error("Failed to load buildings:", err);
        } finally {
            setLoadingBuildings(false);
        }
    };

    const loadRoom = async () => {
        setLoading(true);
        setError("");

        try {
            const response = await roomService.getById(id);
            const data = response.data;
            if (!data) throw new Error("Room not found");

            setFormData({
                name: data.name || "",
                capacity: data.capacity?.toString() || "",
                isActive: data.isActive ? "active" : "inactive",
                buildingId: data.buildingId?.toString() || "",
            });
        } catch (err) {
            setError(err.response?.data?.message || err.message || "Failed to load room");
        } finally {
            setLoading(false);
        }
    };

    /* ------------------------------ Handlers ------------------------------ */
    const goBack = () => navigate("/rooms");

    const handleClear = () => {
        setFormData(initialFormData);
        setErrors({ name: "", capacity: "", isActive: "", buildingId: "" });
    };

    const handleInputChange = (field, value) => {
        setFormData((prev) => ({ ...prev, [field]: value }));
        if (errors[field]) {
            setErrors((prev) => ({ ...prev, [field]: "" }));
        }
    };

    const validateForm = () => {
        const newErrors = { name: "", capacity: "", isActive: "", buildingId: "" };
        let isValid = true;

        if (!formData.name.trim()) {
            newErrors.name = "Room name is required";
            isValid = false;
        }

        if (!formData.capacity.trim()) {
            newErrors.capacity = "Capacity is required";
            isValid = false;
        } else if (isNaN(formData.capacity) || parseInt(formData.capacity) <= 0) {
            newErrors.capacity = "Please enter a valid positive number";
            isValid = false;
        }

        if (!formData.buildingId) {
            newErrors.buildingId = "Please select a building";
            isValid = false;
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
            const payload = {
                name: formData.name.trim(),
                capacity: parseInt(formData.capacity),
                isActive: formData.isActive === "active",
                buildingId: parseInt(formData.buildingId),
            };

            if (isEditMode) {
                await roomService.update(id, payload);
            } else {
                await roomService.create(payload);
            }

            navigate("/rooms", {
                state: {
                    alert: {
                        type: "success",
                        message: isEditMode
                            ? `Room "${formData.name}" updated successfully!`
                            : `Room "${formData.name}" created successfully!`,
                    },
                },
            });
        } catch (err) {
            setError(err.response?.data?.message || err.message || "Failed to save room");
            setSubmitting(false);
        }
    };

    /* ------------------------------ Render ------------------------------ */
    return (
        <AppLayout title={isEditMode ? "Edit Room" : "Create Room"}>
            <div className="space-y-6">
                {/* Alerts */}
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
                        {/* Header */}
                        <div className="flex items-center gap-3">
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <Button variant="outline" size="icon" onClick={goBack}>
                                        <ArrowLeft className="h-4 w-4" />
                                    </Button>
                                </TooltipTrigger>
                                <TooltipContent>Back to rooms</TooltipContent>
                            </Tooltip>
                            <div>
                                <h1 className="text-3xl font-bold text-gray-900">
                                    {isEditMode ? "Edit Room" : "Create Room"}
                                </h1>
                                <p className="mt-1 text-sm text-gray-600">
                                    {isEditMode
                                        ? "Update the room details below"
                                        : "Add a new room to a building"}
                                </p>
                            </div>
                        </div>

                        <Separator />

                        {/* Form Content */}
                        <div className="max-w-4xl mx-auto">
                            <form onSubmit={handleSubmit} className="space-y-6 pt-2 animate-in fade-in slide-in-from-bottom-4 duration-500">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    {/* Room Name */}
                                    <div className="space-y-2">
                                        <Label htmlFor="name" className="text-sm font-medium text-gray-900">
                                            Room Name <span className="text-red-500">*</span>
                                        </Label>
                                        <Input
                                            id="name"
                                            type="text"
                                            placeholder="e.g. Room 101"
                                            value={formData.name}
                                            onChange={(e) => handleInputChange("name", e.target.value)}
                                            className={`h-10 ${errors.name ? "border-red-500 focus-visible:ring-red-500" : ""}`}
                                            disabled={submitting}
                                        />
                                        {errors.name ? (
                                            <p className="text-xs text-red-500">{errors.name}</p>
                                        ) : (
                                            <p className="text-xs text-gray-500">The specific name or number of the room</p>
                                        )}
                                    </div>

                                    {/* Capacity */}
                                    <div className="space-y-2">
                                        <Label htmlFor="capacity" className="text-sm font-medium text-gray-900">
                                            Capacity <span className="text-red-500">*</span>
                                        </Label>
                                        <Input
                                            id="capacity"
                                            type="number"
                                            placeholder="e.g. 30"
                                            value={formData.capacity}
                                            onChange={(e) => handleInputChange("capacity", e.target.value)}
                                            className={`h-10 ${errors.capacity ? "border-red-500 focus-visible:ring-red-500" : ""}`}
                                            disabled={submitting}
                                        />
                                        {errors.capacity ? (
                                            <p className="text-xs text-red-500">{errors.capacity}</p>
                                        ) : (
                                            <p className="text-xs text-gray-500">Maximum number of people the room can hold</p>
                                        )}
                                    </div>

                                    {/* Building Selection */}
                                    <div className="space-y-2">
                                        <Label htmlFor="buildingId" className="text-sm font-medium text-gray-900">
                                            Building <span className="text-red-500">*</span>
                                        </Label>
                                        <Select
                                            value={formData.buildingId}
                                            onValueChange={(value) => handleInputChange("buildingId", value)}
                                            disabled={submitting || loadingBuildings}
                                        >
                                            <SelectTrigger id="buildingId" className={`h-10 w-full ${errors.buildingId ? "border-red-500" : ""}`}>
                                                <SelectValue placeholder={loadingBuildings ? "Loading buildings..." : "Select a building"} />
                                            </SelectTrigger>
                                            <SelectContent className="max-h-[300px]">
                                                {buildings.map((b) => (
                                                    <SelectItem key={b.id} value={b.id.toString()}>
                                                        {b.name}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        {errors.buildingId ? (
                                            <p className="text-xs text-red-500">{errors.buildingId}</p>
                                        ) : (
                                            <p className="text-xs text-gray-500">The building where this room is located</p>
                                        )}
                                    </div>

                                    {/* Status */}
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
                                        <p className="text-xs text-gray-500">Room availability status</p>
                                    </div>
                                </div>

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
                                                {isEditMode ? "Save Changes" : "Save Room"}
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
                            {isEditMode ? "Update Room" : "Create Room"}
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                            Are you sure you want to {isEditMode ? "update" : "create"} the room{" "}
                            <span className="font-semibold text-gray-900">"{formData.name}"</span>?
                            {isEditMode
                                ? " This will update the existing room record."
                                : " This will add a new room to the system."}
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
