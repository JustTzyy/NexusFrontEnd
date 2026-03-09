import { useEffect, useState } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import { departmentService } from "../../services/departmentService";
import AppLayout from "../../layouts/AppLayout";
import { generatePersonalInfoPDF } from "../../utils/pdfExport";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { DetailViewSkeleton } from "../../utils/skeletonLoaders";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Pencil, Trash2, Calendar, Clock, Tag, FileText, AlertCircle, Layers } from "lucide-react";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

export default function DepartmentView() {
    const navigate = useNavigate();
    const { id } = useParams();
    const location = useLocation();

    const [department, setDepartment] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [deleteModal, setDeleteModal] = useState(false);

    const isFromArchive = location.state?.from === "archive";
    const goBack = () => {
        if (isFromArchive) {
            navigate("/departments/archive");
        } else {
            navigate("/departments");
        }
    };
    const goEdit = () => navigate(`/departments/${id}/edit`);

    const handlePrintPDF = () => {
        if (!department) return;
        generatePersonalInfoPDF({
            title: "Department Details",
            data: department,
            fields: [
                { label: "Department Name", key: "name" },
                { label: "Code", key: "code" },
                { label: "Status", key: "isActive", format: (v) => v ? "Active" : "Inactive" },
                { label: "Description", key: "description" },
                { label: "Created At", key: "createdAt" },
                { label: "Last Updated", key: "updatedAt" },
            ],
            companyName: "Department Management System",
            headerInfo: { name: department.name },
        });
    };

    const loadDepartment = async () => {
        setLoading(true);
        setError("");
        try {
            const response = await departmentService.getById(id);
            const data = response.data;
            if (!data) throw new Error("Department not found");
            setDepartment({
                id: data.id,
                name: data.name,
                code: data.code,
                description: data.description,
                isActive: data.isActive,
                createdAt: data.createdAt,
                updatedAt: data.updatedAt,
                createdBy: data.createdByName || "System",
                updatedBy: data.updatedByName || "System",
            });
        } catch (err) {
            setError(err.response?.data?.message || err.message || "Failed to load department");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { loadDepartment(); }, [id]);

    const confirmDelete = async () => {
        setDeleteModal(false);
        try {
            await departmentService.delete(id);
            navigate("/departments", { state: { alert: { type: "success", message: `Department "${department.name}" archived successfully!` } } });
        } catch (err) {
            setError(err.response?.data?.message || "Failed to archive department");
        }
    };

    const formatDateTime = (dateString) => {
        if (!dateString) return "—";
        const date = new Date(dateString);
        return date.toLocaleString("en-US", { year: "numeric", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
    };

    return (
        <AppLayout title="View Department" onPrint={department ? handlePrintPDF : undefined}>
            <div className="space-y-6">
                {error && <Alert variant="destructive"><AlertCircle className="h-4 w-4" /><AlertDescription>{error}</AlertDescription></Alert>}

                {loading ? (
                    <DetailViewSkeleton fields={6} />
                ) : department ? (
                    <div className="space-y-6">
                        <div className="flex items-start justify-between gap-4">
                            <div className="flex items-center gap-3">
                                <Tooltip><TooltipTrigger asChild><Button variant="outline" size="icon" onClick={goBack}><ArrowLeft className="h-4 w-4" /></Button></TooltipTrigger><TooltipContent>{isFromArchive ? "Back to archived departments" : "Back to departments"}</TooltipContent></Tooltip>
                                <div>
                                    <h1 className="text-3xl font-bold text-gray-900">Department Details</h1>
                                    <p className="mt-1 text-sm text-gray-600">View detailed information about this department</p>
                                </div>
                            </div>
                        </div>

                        <div className="border rounded-lg bg-white overflow-hidden">
                            <div className="bg-gradient-to-r from-gray-50 to-gray-100 p-6 border-b">
                                <div className="flex items-start justify-between">
                                    <div className="space-y-2">
                                        <div className="flex items-center gap-3">
                                            <h2 className="text-2xl font-bold text-gray-900">{department.name}</h2>
                                            <Badge variant="default" className={department.isActive ? "bg-green-600" : "bg-gray-500"}>{department.isActive ? "Active" : "Inactive"}</Badge>
                                        </div>
                                        <p className="text-gray-700 max-w-2xl">{department.description || "No description provided."}</p>
                                    </div>
                                </div>
                            </div>

                            <div className="p-6">
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-x-6 gap-y-5">
                                    <div className="space-y-1.5">
                                        <div className="flex items-center gap-2 text-sm font-medium text-gray-500"><Tag className="h-4 w-4" /><span>Department Name</span></div>
                                        <p className="text-sm text-gray-900 font-medium">{department.name}</p>
                                    </div>
                                    <div className="space-y-1.5">
                                        <div className="flex items-center gap-2 text-sm font-medium text-gray-500"><Layers className="h-4 w-4" /><span>Code</span></div>
                                        <p className="text-sm text-gray-900 font-bold">{department.code}</p>
                                    </div>
                                    <div className="space-y-1.5">
                                        <div className="flex items-center gap-2 text-sm font-medium text-gray-500"><FileText className="h-4 w-4" /><span>Status</span></div>
                                        <p className="text-sm text-gray-900 font-medium">{department.isActive ? "Active" : "Inactive"}</p>
                                    </div>
                                    <div className="space-y-1.5 md:col-span-3">
                                        <div className="flex items-center gap-2 text-sm font-medium text-gray-500"><FileText className="h-4 w-4" /><span>Description</span></div>
                                        <p className="text-sm text-gray-900">{department.description || "No description provided."}</p>
                                    </div>
                                    <div className="space-y-1.5">
                                        <div className="flex items-center gap-2 text-sm font-medium text-gray-500"><Calendar className="h-4 w-4" /><span>Created At</span></div>
                                        <p className="text-sm text-gray-900">{formatDateTime(department.createdAt)}</p>
                                        <p className="text-xs text-gray-500">by {department.createdBy || "—"}</p>
                                    </div>
                                    <div className="space-y-1.5 md:col-span-2">
                                        <div className="flex items-center gap-2 text-sm font-medium text-gray-700"><Clock className="h-4 w-4" /><span>Last Updated</span></div>
                                        <div className="bg-gray-50 border border-gray-200 rounded-lg p-2.5">
                                            <p className="text-sm text-gray-900 font-semibold">{formatDateTime(department.updatedAt)}</p>
                                            <p className="text-xs text-gray-600">by {department.updatedBy || "—"}</p>
                                        </div>
                                    </div>
                                </div>

                                <Separator className="my-6" />

                                <div className="flex items-center justify-end gap-3">
                                    <Tooltip><TooltipTrigger asChild><Button variant="outline" onClick={goEdit}><Pencil className="h-4 w-4 mr-2" />Edit Department</Button></TooltipTrigger><TooltipContent>Edit this department</TooltipContent></Tooltip>
                                    <Tooltip><TooltipTrigger asChild><Button variant="outline" onClick={() => setDeleteModal(true)} className="text-red-600 hover:text-red-700 hover:bg-red-50"><Trash2 className="h-4 w-4 mr-2" />Archive Department</Button></TooltipTrigger><TooltipContent>Archive this department</TooltipContent></Tooltip>
                                </div>
                            </div>
                        </div>
                    </div>
                ) : (
                    <Alert><AlertCircle className="h-4 w-4" /><AlertDescription>Department not found.</AlertDescription></Alert>
                )}
            </div>

            <AlertDialog open={deleteModal} onOpenChange={setDeleteModal}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Confirm Archive</AlertDialogTitle>
                        <AlertDialogDescription>Are you sure you want to archive the department <span className="font-semibold">{department?.name}</span>? This action will move it to the archive.</AlertDialogDescription>
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
