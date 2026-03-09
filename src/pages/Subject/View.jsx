import { useEffect, useState } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import { subjectService } from "../../services/subjectService";
import AppLayout from "../../layouts/AppLayout";
import { generatePersonalInfoPDF } from "../../utils/pdfExport";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { DetailViewSkeleton } from "../../utils/skeletonLoaders";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Pencil, Trash2, Calendar, Clock, Tag, FileText, AlertCircle, Building2 } from "lucide-react";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

export default function SubjectView() {
    const navigate = useNavigate();
    const { id } = useParams();
    const location = useLocation();

    const [subject, setSubject] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [deleteModal, setDeleteModal] = useState(false);

    const isFromArchive = location.state?.from === "archive";
    const goBack = () => {
        if (isFromArchive) {
            navigate("/subjects/archive");
        } else {
            navigate("/subjects");
        }
    };
    const goEdit = () => navigate(`/subjects/${id}/edit`);

    const handlePrintPDF = () => {
        if (!subject) return;
        generatePersonalInfoPDF({
            title: "Subject Details",
            data: subject,
            fields: [
                { label: "Subject Name", key: "name" },
                { label: "Department", key: "departmentName" },
                { label: "Status", key: "isActive", format: (v) => v ? "Active" : "Inactive" },
                { label: "Description", key: "description" },
                { label: "Created At", key: "createdAt" },
                { label: "Last Updated", key: "updatedAt" },
            ],
            companyName: "Learning Flow Management System",
            headerInfo: { name: subject.name },
        });
    };

    const loadSubject = async () => {
        setLoading(true);
        setError("");
        try {
            const response = await subjectService.getById(id);
            const data = response.data;
            if (!data) throw new Error("Subject not found");
            setSubject({
                id: data.id,
                name: data.name,
                description: data.description,
                isActive: data.isActive,
                departmentId: data.departmentId,
                departmentName: data.departmentName || "—",
                createdAt: data.createdAt,
                updatedAt: data.updatedAt,
                createdBy: data.createdByName || "System",
                updatedBy: data.updatedByName || "System",
            });
        } catch (err) {
            setError(err.response?.data?.message || err.message || "Failed to load subject");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadSubject();
    }, [id]);

    const confirmDelete = async () => {
        setDeleteModal(false);
        try {
            await subjectService.delete(id);
            navigate("/subjects", {
                state: { alert: { type: "success", message: `Subject "${subject.name}" archived successfully!` } }
            });
        } catch (err) {
            setError(err.response?.data?.message || "Failed to archive subject");
        }
    };

    const formatDateTime = (dateString) => {
        if (!dateString) return "—";
        const date = new Date(dateString);
        return date.toLocaleString("en-US", {
            year: "numeric",
            month: "short",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit",
        });
    };

    return (
        <AppLayout title="View Subject" onPrint={subject ? handlePrintPDF : undefined}>
            <div className="space-y-6">
                {error && (
                    <Alert variant="destructive">
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription>{error}</AlertDescription>
                    </Alert>
                )}

                {loading ? (
                    <DetailViewSkeleton fields={6} />
                ) : subject ? (
                    <div className="space-y-6">
                        <div className="flex items-start justify-between gap-4">
                            <div className="flex items-center gap-3">
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <Button variant="outline" size="icon" onClick={goBack}>
                                            <ArrowLeft className="h-4 w-4" />
                                        </Button>
                                    </TooltipTrigger>
                                    <TooltipContent>{isFromArchive ? "Back to archived subjects" : "Back to subjects"}</TooltipContent>
                                </Tooltip>
                                <div>
                                    <h1 className="text-3xl font-bold text-gray-900">Subject Details</h1>
                                    <p className="mt-1 text-sm text-gray-600">View detailed information about this subject</p>
                                </div>
                            </div>
                        </div>

                        <div className="border rounded-lg bg-white overflow-hidden">
                            <div className="bg-gradient-to-r from-gray-50 to-gray-100 p-6 border-b">
                                <div className="flex items-start justify-between">
                                    <div className="space-y-2">
                                        <div className="flex items-center gap-3">
                                            <h2 className="text-2xl font-bold text-gray-900">{subject.name}</h2>
                                            <Badge variant="default" className={subject.isActive ? "bg-green-600" : "bg-gray-500"}>
                                                {subject.isActive ? "Active" : "Inactive"}
                                            </Badge>
                                        </div>
                                        <p className="text-gray-700 max-w-2xl">{subject.description}</p>
                                    </div>
                                </div>
                            </div>

                            <div className="p-6">
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-x-6 gap-y-5">
                                    <div className="space-y-1.5">
                                        <div className="flex items-center gap-2 text-sm font-medium text-gray-500">
                                            <Tag className="h-4 w-4" />
                                            <span>Subject Name</span>
                                        </div>
                                        <p className="text-sm text-gray-900 font-medium">{subject.name}</p>
                                    </div>

                                    <div className="space-y-1.5">
                                        <div className="flex items-center gap-2 text-sm font-medium text-gray-500">
                                            <Building2 className="h-4 w-4" />
                                            <span>Department</span>
                                        </div>
                                        <p className="text-sm text-gray-900 font-medium">{subject.departmentName || "—"}</p>
                                    </div>

                                    <div className="space-y-1.5">
                                        <div className="flex items-center gap-2 text-sm font-medium text-gray-500">
                                            <FileText className="h-4 w-4" />
                                            <span>Status</span>
                                        </div>
                                        <p className="text-sm text-gray-900 font-medium">{subject.isActive ? "Active" : "Inactive"}</p>
                                    </div>

                                    <div className="space-y-1.5 md:col-span-3">
                                        <div className="flex items-center gap-2 text-sm font-medium text-gray-500">
                                            <FileText className="h-4 w-4" />
                                            <span>Description</span>
                                        </div>
                                        <p className="text-sm text-gray-900">{subject.description || "No description provided."}</p>
                                    </div>

                                    <div className="space-y-1.5">
                                        <div className="flex items-center gap-2 text-sm font-medium text-gray-500">
                                            <Calendar className="h-4 w-4" />
                                            <span>Created At</span>
                                        </div>
                                        <p className="text-sm text-gray-900">{formatDateTime(subject.createdAt)}</p>
                                        <p className="text-xs text-gray-500">by {subject.createdBy || "—"}</p>
                                    </div>

                                    <div className="space-y-1.5 md:col-span-2">
                                        <div className="flex items-center gap-2 text-sm font-medium text-gray-700">
                                            <Clock className="h-4 w-4" />
                                            <span>Last Updated</span>
                                        </div>
                                        <div className="bg-gray-50 border border-gray-200 rounded-lg p-2.5">
                                            <p className="text-sm text-gray-900 font-semibold">{formatDateTime(subject.updatedAt)}</p>
                                            <p className="text-xs text-gray-600">by {subject.updatedBy || "—"}</p>
                                        </div>
                                    </div>
                                </div>

                                <Separator className="my-6" />

                                <div className="flex items-center justify-end gap-3">
                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <Button variant="outline" onClick={goEdit}>
                                                <Pencil className="h-4 w-4 mr-2" />
                                                Edit Subject
                                            </Button>
                                        </TooltipTrigger>
                                        <TooltipContent>Edit this subject</TooltipContent>
                                    </Tooltip>
                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <Button variant="outline" onClick={() => setDeleteModal(true)} className="text-red-600 hover:text-red-700 hover:bg-red-50">
                                                <Trash2 className="h-4 w-4 mr-2" />
                                                Archive Subject
                                            </Button>
                                        </TooltipTrigger>
                                        <TooltipContent>Archive this subject</TooltipContent>
                                    </Tooltip>
                                </div>
                            </div>
                        </div>
                    </div>
                ) : (
                    <Alert>
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription>Subject not found.</AlertDescription>
                    </Alert>
                )}
            </div>

            <AlertDialog open={deleteModal} onOpenChange={setDeleteModal}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Confirm Archive</AlertDialogTitle>
                        <AlertDialogDescription>
                            Are you sure you want to archive the subject{" "}
                            <span className="font-semibold">{subject?.name}</span>? This action will move it to
                            the archive.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={confirmDelete} className="bg-red-600 hover:bg-red-700">
                            Archive
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </AppLayout>
    );
}
