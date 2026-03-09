import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { tutoringRequestService } from "../../services/tutoringRequestService";
import { buildingService } from "../../services/buildingService";
import { departmentService } from "../../services/departmentService";
import { subjectService } from "../../services/subjectService";
import { userService } from "../../services/userService";
import { useAuth } from "@/contexts/AuthContext";
import { useStudentSetup } from "@/hooks/useStudentSetup";
import { FormSkeleton } from "../../utils/skeletonLoaders";
import AppLayout from "../../layouts/AppLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ArrowLeft, Send, Building2, BookOpen, AlertCircle, Sparkles } from "lucide-react";

export default function BookRequestForm() {
    const { requestId } = useParams();
    const navigate = useNavigate();
    const isEditMode = Boolean(requestId);
    const { user: authUser } = useAuth();
    const { isSetupComplete, loading: setupLoading } = useStudentSetup();
    const isLeadOrCustomer = authUser?.roles?.some(r => r === "Lead" || r === "Customer");

    /* ------------------------------ State ------------------------------ */
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState("");

    // Reference data
    const [buildings, setBuildings] = useState([]);
    const [departmentsList, setDepartmentsList] = useState([]);
    const [allSubjects, setAllSubjects] = useState([]);
    const [filteredSubjects, setFilteredSubjects] = useState([]);

    // Form data
    const initialFormData = {
        buildingId: "",
        departmentId: "",
        subjectId: "",
        priority: "Normal",
        message: "",
    };

    const [formData, setFormData] = useState(initialFormData);
    const [errors, setErrors] = useState({});
    const [confirmModal, setConfirmModal] = useState(false);

    /* ------------------------------ Load initial data ------------------------------ */
    useEffect(() => {
        const load = async () => {
            try {
                const [buildingRes, deptRes, subjectRes, profileRes] = await Promise.all([
                    buildingService.lookup(),
                    departmentService.lookup(),
                    subjectService.lookup(),
                    authUser?.id ? userService.getMe() : Promise.resolve(null),
                ]);

                const buildingItems = buildingRes.data?.data?.items || buildingRes.data?.items || [];
                const deptItems = deptRes.data?.data?.items || deptRes.data?.items || [];
                const subjectItems = subjectRes.data?.data?.items || subjectRes.data?.items || [];
                const preferredBuildingId = profileRes?.data?.preferredBuildingId || null;

                setBuildings(buildingItems);
                setDepartmentsList(deptItems);
                setAllSubjects(subjectItems);

                // Edit mode — load existing request
                if (isEditMode) {
                    const reqRes = await tutoringRequestService.getStudentView(requestId);
                    const request = reqRes.data?.data || reqRes.data;
                    if (!request) {
                        setError("Request not found");
                        setLoading(false);
                        return;
                    }
                    // Only allow editing when Pending
                    if (request.status !== "Pending Teacher Interest") {
                        setError("This request can no longer be edited");
                        setLoading(false);
                        return;
                    }
                    // Pre-filter subjects for the department
                    setFilteredSubjects(subjectItems.filter(s => s.departmentId === request.departmentId));
                    setFormData({
                        buildingId: String(request.buildingId),
                        departmentId: String(request.departmentId),
                        subjectId: String(request.subjectId),
                        priority: request.priority || "Normal",
                        message: request.message || "",
                    });
                } else if (preferredBuildingId) {
                    setFormData(prev => ({ ...prev, buildingId: String(preferredBuildingId) }));
                }
            } catch {
                setError("Failed to load data");
            } finally {
                setLoading(false);
            }
        };
        load();
    }, [requestId, isEditMode]);

    /* ------------------------------ Filter subjects when dept changes ------------------------------ */
    useEffect(() => {
        if (!formData.departmentId) {
            setFilteredSubjects([]);
            return;
        }
        const deptId = Number(formData.departmentId);
        setFilteredSubjects(allSubjects.filter(s => s.departmentId === deptId));
        // Clear subject if it doesn't belong to the new department (skip initial edit load)
        if (!loading && !isEditMode) {
            setFormData(prev => ({ ...prev, subjectId: "" }));
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [formData.departmentId, allSubjects]);

    /* ------------------------------ Handlers ------------------------------ */
    const goBack = () => navigate("/book-request");

    const handleChange = (field, value) => {
        setFormData(prev => ({ ...prev, [field]: value }));
        if (errors[field]) setErrors(prev => ({ ...prev, [field]: "" }));
    };

    const validateForm = () => {
        const newErrors = {};
        if (!formData.buildingId) newErrors.buildingId = "Building is required";
        if (!formData.departmentId) newErrors.departmentId = "Department is required";
        if (!formData.subjectId) newErrors.subjectId = "Subject is required";
        if (!formData.message.trim()) newErrors.message = "Please describe what you need help with";
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!validateForm()) return;
        setConfirmModal(true);
    };

    const confirmSubmit = async () => {
        setConfirmModal(false);
        setSubmitting(true);
        setError("");

        try {
            const payload = {
                buildingId: Number(formData.buildingId),
                departmentId: Number(formData.departmentId),
                subjectId: Number(formData.subjectId),
                priority: formData.priority,
                message: formData.message,
            };

            if (isEditMode) {
                await tutoringRequestService.update(requestId, {
                    message: formData.message,
                    priority: formData.priority,
                });
            } else {
                await tutoringRequestService.create(payload);
            }

            navigate("/book-request", {
                state: {
                    alert: {
                        type: "success",
                        message: isEditMode
                            ? "Request updated successfully!"
                            : "Request created successfully!",
                    },
                },
            });
        } catch (err) {
            setError(err.response?.data?.message || err.message || "Failed to save request");
            setSubmitting(false);
        }
    };

    // Resolve names for summary
    const selectedBuilding = buildings.find(b => String(b.id) === formData.buildingId);
    const selectedDept = departmentsList.find(d => String(d.id) === formData.departmentId);
    const selectedSubj = filteredSubjects.find(s => String(s.id) === formData.subjectId);

    return (
        <AppLayout title={isEditMode ? "Edit Request" : "New Request"}>
            <div className="max-w-4xl mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
                {error && (
                    <Alert variant="destructive">
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription>{error}</AlertDescription>
                    </Alert>
                )}

                {isLeadOrCustomer && !setupLoading && isSetupComplete === false && (
                    <Alert variant="destructive" className="mb-2">
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription>
                            <strong>Profile setup incomplete.</strong> Complete your profile setup before submitting requests.{" "}
                            <Link to="/register/welcome" className="underline font-semibold">Complete Setup →</Link>
                        </AlertDescription>
                    </Alert>
                )}

                {loading ? (
                    <FormSkeleton fields={5} />
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
                                <TooltipContent>Back to requests</TooltipContent>
                            </Tooltip>
                            <div>
                                <div className="flex items-center gap-2">
                                    <Sparkles className="h-4 w-4 text-indigo-600" />
                                    <p className="text-xs font-semibold text-indigo-600 uppercase tracking-wider">
                                        {isEditMode ? "Edit" : "New"} Request
                                    </p>
                                </div>
                                <h1 className="text-3xl font-bold text-gray-900">
                                    {isEditMode ? "Update Request" : "Create Request"}
                                </h1>
                            </div>
                        </div>

                        <Separator />

                        {/* Form */}
                        <form onSubmit={handleSubmit} className="space-y-6">
                            {/* Building */}
                            <div className="space-y-2">
                                <Label className="text-sm font-medium text-gray-900">
                                    Building <span className="text-red-500">*</span>
                                </Label>
                                <Select
                                    value={formData.buildingId}
                                    disabled
                                >
                                    <SelectTrigger className={`h-10 ${errors.buildingId ? "border-red-500" : ""}`}>
                                        <SelectValue placeholder="No preferred building set" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {buildings.map(b => (
                                            <SelectItem key={b.id} value={String(b.id)}>
                                                <span className="flex items-center gap-2">
                                                    <Building2 className="h-3.5 w-3.5 text-gray-400" />
                                                    {b.name}
                                                </span>
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                {errors.buildingId ? (
                                    <p className="text-xs text-red-500">{errors.buildingId}</p>
                                ) : (
                                    <p className="text-xs text-gray-500">
                                        Automatically set from your preferred building in Settings.
                                    </p>
                                )}
                            </div>

                            {/* Department & Subject */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {/* Department */}
                                <div className="space-y-2">
                                    <Label className="text-sm font-medium text-gray-900">
                                        Department <span className="text-red-500">*</span>
                                    </Label>
                                    <Select
                                        value={formData.departmentId}
                                        onValueChange={(v) => handleChange("departmentId", v)}
                                        disabled={submitting || isEditMode}
                                    >
                                        <SelectTrigger className={`h-10 ${errors.departmentId ? "border-red-500" : ""}`}>
                                            <SelectValue placeholder="Select department" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {departmentsList.map(d => (
                                                <SelectItem key={d.id} value={String(d.id)}>{d.name}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    {errors.departmentId ? (
                                        <p className="text-xs text-red-500">{errors.departmentId}</p>
                                    ) : (
                                        <p className="text-xs text-gray-500">
                                            {isEditMode ? "Department cannot be changed" : "The academic department for your request"}
                                        </p>
                                    )}
                                </div>

                                {/* Subject */}
                                <div className="space-y-2">
                                    <Label className="text-sm font-medium text-gray-900">
                                        Subject <span className="text-red-500">*</span>
                                    </Label>
                                    <Select
                                        value={formData.subjectId}
                                        onValueChange={(v) => handleChange("subjectId", v)}
                                        disabled={submitting || isEditMode || !formData.departmentId}
                                    >
                                        <SelectTrigger className={`h-10 ${errors.subjectId ? "border-red-500" : ""}`}>
                                            <SelectValue placeholder={formData.departmentId ? "Select subject" : "Select department first"} />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {filteredSubjects.map(s => (
                                                <SelectItem key={s.id} value={String(s.id)}>{s.name}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    {errors.subjectId ? (
                                        <p className="text-xs text-red-500">{errors.subjectId}</p>
                                    ) : (
                                        <p className="text-xs text-gray-500">
                                            {isEditMode
                                                ? "Subject cannot be changed"
                                                : formData.departmentId
                                                    ? "Choose the subject you need help with"
                                                    : "Select a department to see subjects"}
                                        </p>
                                    )}
                                </div>
                            </div>

                            {/* Priority */}
                            <div className="space-y-2">
                                <Label className="text-sm font-medium text-gray-900">Priority</Label>
                                <div className="flex gap-2">
                                    {['Low', 'Normal', 'High'].map(p => (
                                        <Button
                                            key={p}
                                            type="button"
                                            variant={formData.priority === p ? "default" : "outline"}
                                            size="sm"
                                            onClick={() => handleChange("priority", p)}
                                            disabled={submitting}
                                            className={formData.priority === p
                                                ? p === "High" ? "bg-red-600 hover:bg-red-700" : p === "Low" ? "bg-gray-600 hover:bg-gray-700" : ""
                                                : ""}
                                        >
                                            {p}
                                        </Button>
                                    ))}
                                </div>
                            </div>

                            {/* Message */}
                            <div className="space-y-2">
                                <Label className="text-sm font-medium text-gray-900">
                                    What do you need help with? <span className="text-red-500">*</span>
                                </Label>
                                <Textarea
                                    placeholder="Describe what topics or concepts you'd like to study. Be specific so teachers can understand your needs."
                                    value={formData.message}
                                    onChange={(e) => handleChange("message", e.target.value)}
                                    className={`min-h-[140px] resize-y ${errors.message ? "border-red-500" : ""}`}
                                    disabled={submitting}
                                />
                                {errors.message && <p className="text-xs text-red-500">{errors.message}</p>}
                            </div>

                            {/* Summary preview */}
                            {formData.buildingId && formData.departmentId && formData.subjectId && (
                                <div className="p-4 rounded-lg bg-gray-50 border space-y-2">
                                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Request Summary</p>
                                    <div className="flex flex-wrap gap-2">
                                        <Badge variant="outline"><Building2 className="h-3 w-3 mr-1" />{selectedBuilding?.name}</Badge>
                                        <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200">{selectedDept?.name}</Badge>
                                        <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200"><BookOpen className="h-3 w-3 mr-1" />{selectedSubj?.name}</Badge>
                                        <Badge variant="outline" className={
                                            formData.priority === "High" ? "bg-red-50 text-red-700 border-red-200" :
                                            formData.priority === "Low" ? "bg-gray-50 text-gray-600" : "bg-orange-50 text-orange-700 border-orange-200"
                                        }>{formData.priority} Priority</Badge>
                                    </div>
                                    {!isEditMode && (
                                        <p className="text-xs text-gray-500 mt-1">
                                            Status will be: <strong>Pending Teacher Interest</strong> — teachers assigned to this building + department will be notified.
                                        </p>
                                    )}
                                </div>
                            )}

                            <Separator />

                            {/* Actions */}
                            <div className="flex items-center justify-end gap-3">
                                <Button type="button" variant="outline" onClick={goBack} disabled={submitting}>
                                    Back
                                </Button>
                                <Button type="submit" disabled={submitting || (isLeadOrCustomer && isSetupComplete === false)}>
                                    {submitting ? (
                                        <>
                                            <span className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                                            Submitting...
                                        </>
                                    ) : (
                                        <>
                                            <Send className="h-4 w-4 mr-2" />
                                            {isEditMode ? "Update Request" : "Submit Request"}
                                        </>
                                    )}
                                </Button>
                            </div>
                        </form>
                    </>
                )}
            </div>

            {/* Confirm dialog */}
            <AlertDialog open={confirmModal} onOpenChange={setConfirmModal}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>{isEditMode ? "Update Request" : "Create Request"}</AlertDialogTitle>
                        <AlertDialogDescription>
                            Are you sure you want to {isEditMode ? "update" : "submit"} a request for{" "}
                            <span className="font-semibold text-gray-900">{selectedSubj?.name}</span> at{" "}
                            <span className="font-semibold text-gray-900">{selectedBuilding?.name}</span>?
                            {!isEditMode && (
                                <> Your request will be visible to qualified teachers in the{" "}
                                <span className="font-semibold text-gray-900">{selectedDept?.name}</span> department.</>
                            )}
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={confirmSubmit}>
                            {isEditMode ? "Update Request" : "Submit Request"}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </AppLayout>
    );
}
