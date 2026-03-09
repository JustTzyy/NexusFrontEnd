import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { teacherAssignmentService } from "../../services/teacherAssignmentService";
import { userService } from "../../services/userService";
import { buildingService } from "../../services/buildingService";
import { departmentService } from "../../services/departmentService";
import AppLayout from "../../layouts/AppLayout";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { FormSkeleton } from "../../utils/skeletonLoaders";
import { Separator } from "@/components/ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { ArrowLeft, Save, AlertCircle, RotateCcw } from "lucide-react";

export default function TeacherAssignmentForm() {
    const navigate = useNavigate();
    const { id } = useParams();
    const isEditMode = Boolean(id);

    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState("");

    const [teachers, setTeachers] = useState([]);
    const [buildings, setBuildings] = useState([]);
    const [departments, setDepartments] = useState([]);

    const initialFormData = { teacherId: "", buildingId: "", departmentId: "" };
    const [formData, setFormData] = useState(initialFormData);
    const [errors, setErrors] = useState({});
    const [saveModal, setSaveModal] = useState(false);

    useEffect(() => {
        loadDropdowns();
    }, []);

    useEffect(() => {
        if (isEditMode) {
            loadAssignment();
        }
    }, [id]);

    const loadDropdowns = async () => {
        try {
            const [teachersRes, buildingsRes, deptsRes, assignmentsRes] = await Promise.all([
                userService.getByRole("Teacher"),
                buildingService.getAll({ pageNumber: 1, pageSize: 100 }),
                departmentService.getAll({ pageNumber: 1, pageSize: 100 }),
                teacherAssignmentService.getAll({ pageNumber: 1, pageSize: 100 }),
            ]);
            const teachersData = teachersRes.data || [];
            const assignmentsData = assignmentsRes.data?.items || [];
            const assignedTeacherIds = new Set(assignmentsData.map(a => a.teacherId));

            // In edit mode, find the teacherId of the assignment being edited so we keep it in the list
            const currentAssignmentTeacherId = isEditMode
                ? assignmentsData.find(a => String(a.id) === String(id))?.teacherId
                : null;

            // Filter out already-assigned teachers (keep current teacher in edit mode)
            const availableTeachers = teachersData.filter(t =>
                !assignedTeacherIds.has(t.id) || (isEditMode && t.id === currentAssignmentTeacherId)
            );

            setTeachers(availableTeachers.map(t => ({ id: t.id, name: t.fullName })));
            const buildingsData = buildingsRes.data?.items || [];
            setBuildings(buildingsData.map(b => ({ id: b.id, name: b.name })));
            const deptsData = deptsRes.data?.items || [];
            setDepartments(deptsData.map(d => ({ id: d.id, name: d.name })));
            if (!isEditMode) setLoading(false);
        } catch (err) {
            setError(err.message || "Failed to load dropdown data");
            setLoading(false);
        }
    };

    const loadAssignment = async () => {
        setLoading(true);
        setError("");
        try {
            const response = await teacherAssignmentService.getById(id);
            const data = response.data;
            if (!data) throw new Error("Assignment not found");
            setFormData({
                teacherId: String(data.teacherId),
                buildingId: String(data.buildingId),
                departmentId: String(data.departmentId),
            });
        } catch (err) {
            setError(err.message || "Failed to load assignment");
        } finally {
            setLoading(false);
        }
    };

    const goBack = () => navigate("/teacher-assignments");

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
        if (!formData.teacherId) { newErrors.teacherId = "Teacher is required"; isValid = false; }
        if (!formData.buildingId) { newErrors.buildingId = "Building is required"; isValid = false; }
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
                teacherId: parseInt(formData.teacherId),
                buildingId: parseInt(formData.buildingId),
                departmentId: parseInt(formData.departmentId),
            };
            if (isEditMode) {
                await teacherAssignmentService.update(id, payload);
            } else {
                await teacherAssignmentService.create(payload);
            }
            const teacherName = teachers.find(t => String(t.id) === formData.teacherId)?.name || "Teacher";
            navigate("/teacher-assignments", {
                state: { alert: { type: "success", message: isEditMode ? `Assignment for "${teacherName}" updated successfully!` : `"${teacherName}" assigned successfully!` } },
            });
        } catch (err) {
            setError(err.message || "Failed to save assignment");
            setSubmitting(false);
        }
    };

    const teacherName = teachers.find(t => String(t.id) === formData.teacherId)?.name || "";
    const buildingName = buildings.find(b => String(b.id) === formData.buildingId)?.name || "";
    const deptName = departments.find(d => String(d.id) === formData.departmentId)?.name || "";

    return (
        <AppLayout title={isEditMode ? "Edit Assignment" : "Create Assignment"}>
            <div className="space-y-6">
                {error && <Alert variant="destructive"><AlertCircle className="h-4 w-4" /><AlertDescription>{error}</AlertDescription></Alert>}

                {loading ? (
                    <FormSkeleton fields={3} showTabs={false} />
                ) : (
                    <>
                        <div className="flex items-center gap-3">
                            <Tooltip><TooltipTrigger asChild><Button variant="outline" size="icon" onClick={goBack}><ArrowLeft className="h-4 w-4" /></Button></TooltipTrigger><TooltipContent>Back to assignments</TooltipContent></Tooltip>
                            <div>
                                <h1 className="text-3xl font-bold text-gray-900">{isEditMode ? "Edit Assignment" : "Assign Teacher"}</h1>
                                <p className="mt-1 text-sm text-gray-600">{isEditMode ? "Update the teacher assignment details below" : "Assign a teacher to a building and department"}</p>
                            </div>
                        </div>

                        <Separator />

                        <div className="max-w-4xl mx-auto">
                            <form onSubmit={handleSubmit} className="space-y-6 pt-2 animate-in fade-in slide-in-from-bottom-4 duration-500">
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                    <div className="space-y-2">
                                        <Label className="text-sm font-medium text-gray-900">Teacher <span className="text-red-500">*</span></Label>
                                        <Select value={formData.teacherId} onValueChange={(v) => handleInputChange("teacherId", v)} disabled={submitting}>
                                            <SelectTrigger className={`h-10 w-full ${errors.teacherId ? "border-red-500 focus-visible:ring-red-500" : ""}`}>
                                                <SelectValue placeholder="Select a teacher" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {teachers.map((t) => <SelectItem key={t.id} value={String(t.id)}>{t.name}</SelectItem>)}
                                            </SelectContent>
                                        </Select>
                                        {errors.teacherId ? <p className="text-xs text-red-500">{errors.teacherId}</p> : <p className="text-xs text-gray-500">Select the teacher to assign</p>}
                                    </div>

                                    <div className="space-y-2">
                                        <Label className="text-sm font-medium text-gray-900">Building <span className="text-red-500">*</span></Label>
                                        <Select value={formData.buildingId} onValueChange={(v) => handleInputChange("buildingId", v)} disabled={submitting}>
                                            <SelectTrigger className={`h-10 w-full ${errors.buildingId ? "border-red-500 focus-visible:ring-red-500" : ""}`}>
                                                <SelectValue placeholder="Select a building" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {buildings.map((b) => <SelectItem key={b.id} value={String(b.id)}>{b.name}</SelectItem>)}
                                            </SelectContent>
                                        </Select>
                                        {errors.buildingId ? <p className="text-xs text-red-500">{errors.buildingId}</p> : <p className="text-xs text-gray-500">Target building for the assignment</p>}
                                    </div>

                                    <div className="space-y-2">
                                        <Label className="text-sm font-medium text-gray-900">Department <span className="text-red-500">*</span></Label>
                                        <Select value={formData.departmentId} onValueChange={(v) => handleInputChange("departmentId", v)} disabled={submitting}>
                                            <SelectTrigger className={`h-10 w-full ${errors.departmentId ? "border-red-500 focus-visible:ring-red-500" : ""}`}>
                                                <SelectValue placeholder="Select a department" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {departments.map((d) => <SelectItem key={d.id} value={String(d.id)}>{d.name}</SelectItem>)}
                                            </SelectContent>
                                        </Select>
                                        {errors.departmentId ? <p className="text-xs text-red-500">{errors.departmentId}</p> : <p className="text-xs text-gray-500">Target department for the assignment</p>}
                                    </div>
                                </div>

                                <Separator />

                                <div className="flex items-center justify-end gap-3 pt-2">
                                    <Button type="button" variant="outline" onClick={handleClear} disabled={submitting}><RotateCcw className="h-4 w-4 mr-2" />Clear</Button>
                                    <Button type="submit" disabled={submitting}>
                                        {submitting ? (<><span className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />Saving...</>) : (<><Save className="h-4 w-4 mr-2" />{isEditMode ? "Save Changes" : "Assign Teacher"}</>)}
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
                        <AlertDialogTitle>{isEditMode ? "Update Assignment" : "Create Assignment"}</AlertDialogTitle>
                        <AlertDialogDescription>
                            Are you sure you want to {isEditMode ? "update" : "assign"}{" "}
                            <span className="font-semibold text-gray-900">"{teacherName}"</span> to{" "}
                            <span className="font-semibold text-gray-900">{buildingName}</span> —{" "}
                            <span className="font-semibold text-gray-900">{deptName}</span>?
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={confirmSave}>{isEditMode ? "Update" : "Assign"}</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </AppLayout>
    );
}
