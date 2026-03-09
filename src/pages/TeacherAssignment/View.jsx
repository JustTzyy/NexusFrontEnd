import { useEffect, useState } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import { teacherAssignmentService } from "../../services/teacherAssignmentService";
import AppLayout from "../../layouts/AppLayout";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { DetailViewSkeleton } from "../../utils/skeletonLoaders";
import { Separator } from "@/components/ui/separator";
import { ArrowLeft, Pencil, Trash2, Calendar, Clock, GraduationCap, Building2, FileText, AlertCircle } from "lucide-react";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

export default function TeacherAssignmentView() {
    const navigate = useNavigate();
    const location = useLocation();
    const { id } = useParams();

    const [assignment, setAssignment] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [deleteModal, setDeleteModal] = useState(false);

    const goBack = () => {
        if (location.state?.from === "archive") {
            navigate("/teacher-assignments/archive");
        } else {
            navigate("/teacher-assignments");
        }
    };
    const goEdit = () => navigate(`/teacher-assignments/${id}/edit`);

    const loadAssignment = async () => {
        setLoading(true);
        setError("");
        try {
            const response = await teacherAssignmentService.getById(id);
            const data = response.data;
            if (!data) throw new Error("Assignment not found");
            setAssignment({
                ...data,
                createdByName: data.createdByName || null,
                updatedByName: data.updatedByName || null
            });
        } catch (err) {
            setError(err.message || "Failed to load assignment");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { loadAssignment(); }, [id]);

    const confirmDelete = async () => {
        try {
            await teacherAssignmentService.delete(id);
            setDeleteModal(false);
            navigate("/teacher-assignments", { state: { alert: { type: "success", message: `Assignment for "${assignment.teacherName}" archived successfully!` } } });
        } catch (err) {
            setError(err.message || "Failed to archive assignment");
            setDeleteModal(false);
        }
    };

    const formatDateTime = (dateString) => {
        if (!dateString) return "—";
        const date = new Date(dateString);
        return date.toLocaleString("en-US", { year: "numeric", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
    };

    return (
        <AppLayout title="View Assignment">
            <div className="space-y-6">
                {error && <Alert variant="destructive"><AlertCircle className="h-4 w-4" /><AlertDescription>{error}</AlertDescription></Alert>}

                {loading ? (
                    <DetailViewSkeleton fields={6} />
                ) : assignment ? (
                    <div className="space-y-6">
                        <div className="flex items-start justify-between gap-4">
                            <div className="flex items-center gap-3">
                                <Tooltip><TooltipTrigger asChild><Button variant="outline" size="icon" onClick={goBack}><ArrowLeft className="h-4 w-4" /></Button></TooltipTrigger><TooltipContent>Back to assignments</TooltipContent></Tooltip>
                                <div>
                                    <h1 className="text-3xl font-bold text-gray-900">Assignment Details</h1>
                                    <p className="mt-1 text-sm text-gray-600">View detailed information about this assignment</p>
                                </div>
                            </div>
                        </div>

                        <div className="border rounded-lg bg-white overflow-hidden">
                            <div className="bg-gradient-to-r from-gray-50 to-gray-100 p-6 border-b">
                                <div className="flex items-start justify-between">
                                    <div className="space-y-2">
                                        <h2 className="text-2xl font-bold text-gray-900">{assignment.teacherName}</h2>
                                        <p className="text-gray-700 max-w-2xl">{assignment.buildingName} — {assignment.departmentName}</p>
                                    </div>
                                </div>
                            </div>

                            <div className="p-6">
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-x-6 gap-y-5">
                                    <div className="space-y-1.5">
                                        <div className="flex items-center gap-2 text-sm font-medium text-gray-500"><GraduationCap className="h-4 w-4" /><span>Teacher</span></div>
                                        <p className="text-sm text-gray-900 font-medium">{assignment.teacherName}</p>
                                    </div>
                                    <div className="space-y-1.5">
                                        <div className="flex items-center gap-2 text-sm font-medium text-gray-500"><Building2 className="h-4 w-4" /><span>Building</span></div>
                                        <p className="text-sm text-gray-900 font-medium">{assignment.buildingName}</p>
                                    </div>
                                    <div className="space-y-1.5">
                                        <div className="flex items-center gap-2 text-sm font-medium text-gray-500"><FileText className="h-4 w-4" /><span>Department</span></div>
                                        <p className="text-sm text-gray-900 font-medium">{assignment.departmentName}</p>
                                    </div>
                                    <div className="space-y-1.5">
                                        <div className="flex items-center gap-2 text-sm font-medium text-gray-500"><Calendar className="h-4 w-4" /><span>Created At</span></div>
                                        <p className="text-sm text-gray-900">{formatDateTime(assignment.createdAt)}</p>
                                        <p className="text-xs text-gray-500">by {assignment.createdByName || "—"}</p>
                                    </div>
                                    <div className="space-y-1.5 md:col-span-2">
                                        <div className="flex items-center gap-2 text-sm font-medium text-gray-700"><Clock className="h-4 w-4" /><span>Last Updated</span></div>
                                        <div className="bg-gray-50 border border-gray-200 rounded-lg p-2.5">
                                            <p className="text-sm text-gray-900 font-semibold">{formatDateTime(assignment.updatedAt)}</p>
                                            <p className="text-xs text-gray-600">by {assignment.updatedByName || "—"}</p>
                                        </div>
                                    </div>
                                </div>

                                <Separator className="my-6" />

                                <div className="flex items-center justify-end gap-3">
                                    <Tooltip><TooltipTrigger asChild><Button variant="outline" onClick={goEdit}><Pencil className="h-4 w-4 mr-2" />Edit Assignment</Button></TooltipTrigger><TooltipContent>Edit this assignment</TooltipContent></Tooltip>
                                    <Tooltip><TooltipTrigger asChild><Button variant="outline" onClick={() => setDeleteModal(true)} className="text-red-600 hover:text-red-700 hover:bg-red-50"><Trash2 className="h-4 w-4 mr-2" />Archive Assignment</Button></TooltipTrigger><TooltipContent>Archive this assignment</TooltipContent></Tooltip>
                                </div>
                            </div>
                        </div>
                    </div>
                ) : (
                    <Alert><AlertCircle className="h-4 w-4" /><AlertDescription>Assignment not found.</AlertDescription></Alert>
                )}
            </div>

            <AlertDialog open={deleteModal} onOpenChange={setDeleteModal}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Confirm Archive</AlertDialogTitle>
                        <AlertDialogDescription>Are you sure you want to archive the assignment for <span className="font-semibold">{assignment?.teacherName}</span>? This action will move it to the archive.</AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={confirmDelete} className="bg-red-600 hover:bg-red-700">Archive</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </AppLayout>
    );
}
