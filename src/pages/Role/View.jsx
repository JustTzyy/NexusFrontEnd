import { useEffect, useState } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import AppLayout from "../../layouts/AppLayout";
import { generatePersonalInfoPDF } from "../../utils/pdfExport";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { DetailViewSkeleton } from "../../utils/skeletonLoaders";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Pencil, Trash2, Calendar, Clock, Shield, FileText, AlertCircle } from "lucide-react";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { roleService } from "@/services/roleService";

export default function RoleView() {
    const navigate = useNavigate();
    const { id } = useParams();
    const location = useLocation();

    const [role, setRole] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [deleteModal, setDeleteModal] = useState(false);

    const goBack = () => {
        if (location.state?.from === "archive") {
            navigate("/roles/archive");
        } else {
            navigate("/roles");
        }
    };
    const goEdit = () => navigate(`/roles/${id}/edit`);

    const handlePrintPDF = () => {
        if (!role) return;

        generatePersonalInfoPDF({
            title: "Role Details",
            data: {
                ...role,
                permissions: role.permissions?.map(p => p.name).join(", ") || "No permissions assigned",
            },
            fields: [
                { label: "Role Name", key: "name" },
                { label: "Permissions", key: "permissions" },
                { label: "Status", key: "status" },
                { label: "Description", key: "description" },
                { label: "Created At", key: "createdAt" },
                { label: "Created By", key: "createdBy" },
                { label: "Last Updated", key: "updatedAt" },
                { label: "Updated By", key: "updatedBy" },
            ],
            companyName: "Role Management System",
            headerInfo: { name: role.name },
        });
    };

    const loadRole = async () => {
        setLoading(true);
        setError("");

        try {
            const response = await roleService.getById(id);
            const data = response.data;

            // Transform data for view
            const mappedData = {
                id: data.id,
                name: data.name,
                description: data.description || "No description provided",
                permissions: data.permissions || [],
                status: data.deletedAt ? "Archived" : "Active",
                createdAt: data.createdAt,
                updatedAt: data.updatedAt,
                createdBy: data.createdByName || "System",
                updatedBy: data.updatedByName || "System",
            };

            setRole(mappedData);
        } catch (err) {
            setError(err.message || "Failed to load role");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadRole();
    }, [id]);

    const confirmDelete = async () => {
        setDeleteModal(false);
        try {
            await roleService.delete(id);
            navigate("/roles", {
                state: {
                    alert: {
                        type: "success",
                        message: `Role "${role?.name}" moved to archive successfully!`,
                    },
                },
            });
        } catch (err) {
            setError(err.message || "Failed to delete role");
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
        <AppLayout title="View Role" onPrint={role ? handlePrintPDF : undefined}>
            <div className="space-y-6">
                {/* Error */}
                {error && (
                    <Alert variant="destructive">
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription>{error}</AlertDescription>
                    </Alert>
                )}

                {/* Content */}
                {loading ? (
                    <DetailViewSkeleton fields={6} />
                ) : role ? (
                    <div className="space-y-6">
                        {/* Header */}
                        <div className="flex items-start justify-between gap-4">
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
                                    <h1 className="text-3xl font-bold text-gray-900">Role Details</h1>
                                    <p className="mt-1 text-sm text-gray-600">
                                        View detailed information about this role
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Content Card */}
                        <div className="border rounded-lg bg-white overflow-hidden shadow-sm">
                            {/* Header Section */}
                            <div className="bg-gradient-to-r from-gray-50 to-gray-100 p-6 border-b">
                                <div className="flex items-start justify-between">
                                    <div className="space-y-2">
                                        <div className="flex items-center gap-3">
                                            <h2 className="text-2xl font-bold text-gray-900">{role.name}</h2>
                                            <Badge variant="default" className={role.status === "Active" ? "bg-green-600 hover:bg-green-600" : "bg-gray-500 hover:bg-gray-500"}>
                                                {role.status}
                                            </Badge>
                                        </div>
                                        <p className="text-gray-700 max-w-2xl">{role.description}</p>
                                    </div>
                                </div>
                            </div>

                            {/* Details Section */}
                            <div className="p-6">
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-x-6 gap-y-6">
                                    {/* Permissions */}
                                    <div className="space-y-2 md:col-span-3">
                                        <div className="flex items-center gap-2 text-sm font-medium text-gray-500">
                                            <Shield className="h-4 w-4" />
                                            <span>Permissions ({role.permissions.length})</span>
                                        </div>
                                        <div className="flex flex-wrap gap-2 p-3 bg-gray-50 rounded-lg border border-gray-100">
                                            {role.permissions.length > 0 ? (
                                                role.permissions.map((p) => (
                                                    <Badge key={p.id} variant="secondary" className="px-2.5 py-1 text-xs font-medium">
                                                        {p.name}
                                                    </Badge>
                                                ))
                                            ) : (
                                                <span className="text-sm text-gray-500 italic">No permissions assigned to this role</span>
                                            )}
                                        </div>
                                    </div>

                                    {/* Status */}
                                    <div className="space-y-1.5">
                                        <div className="flex items-center gap-2 text-sm font-medium text-gray-500">
                                            <FileText className="h-4 w-4" />
                                            <span>Status</span>
                                        </div>
                                        <p className="text-sm text-gray-900 font-medium">{role.status}</p>
                                    </div>

                                    {/* Created At */}
                                    <div className="space-y-1.5">
                                        <div className="flex items-center gap-2 text-sm font-medium text-gray-500">
                                            <Calendar className="h-4 w-4" />
                                            <span>Created At</span>
                                        </div>
                                        <p className="text-sm text-gray-900">{formatDateTime(role.createdAt)}</p>
                                        <p className="text-xs text-gray-500">by {role.createdBy}</p>
                                    </div>

                                    {/* Last Updated */}
                                    <div className="space-y-1.5">
                                        <div className="flex items-center gap-2 text-sm font-medium text-gray-700 font-semibold">
                                            <Clock className="h-4 w-4" />
                                            <span>Last Updated</span>
                                        </div>
                                        <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
                                            <p className="text-sm text-gray-900 font-bold">
                                                {formatDateTime(role.updatedAt)}
                                            </p>
                                            <p className="text-xs text-gray-600 font-medium">by {role.updatedBy}</p>
                                        </div>
                                    </div>

                                    {/* Description (Spans 3 cols on mobile, 3 on desktop to take full width if needed, but grid is 3 cols) */}
                                    <div className="space-y-1.5 md:col-span-3">
                                        <Separator className="my-2" />
                                    </div>
                                </div>

                                {/* Actions */}
                                <div className="mt-6 flex items-center justify-end gap-3">
                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <Button variant="outline" onClick={goEdit}>
                                                <Pencil className="h-4 w-4 mr-2" />
                                                Edit Role
                                            </Button>
                                        </TooltipTrigger>
                                        <TooltipContent>Edit this role</TooltipContent>
                                    </Tooltip>
                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <Button
                                                variant="outline"
                                                onClick={() => setDeleteModal(true)}
                                                className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                            >
                                                <Trash2 className="h-4 w-4 mr-2" />
                                                Delete Role
                                            </Button>
                                        </TooltipTrigger>
                                        <TooltipContent>Delete this role</TooltipContent>
                                    </Tooltip>
                                </div>
                            </div>
                        </div>
                    </div>
                ) : !loading && !error ? (
                    <Alert>
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription>Role not found.</AlertDescription>
                    </Alert>
                ) : null}
            </div>

            {/* Delete Confirmation */}
            <AlertDialog open={deleteModal} onOpenChange={setDeleteModal}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Confirm Delete</AlertDialogTitle>
                        <AlertDialogDescription>
                            Are you sure you want to delete the role{" "}
                            <span className="font-semibold">{role?.name}</span>? This action will move it to
                            the archive.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={confirmDelete}
                            className="bg-red-600 hover:bg-red-700"
                        >
                            Delete
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </AppLayout>
    );
}
