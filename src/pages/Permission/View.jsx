import { useEffect, useState } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import AppLayout from "../../layouts/AppLayout";
import { generatePersonalInfoPDF } from "../../utils/pdfExport";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { DetailViewSkeleton } from "../../utils/skeletonLoaders";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Pencil, Trash2, Calendar, Clock, Tag, FileText, AlertCircle, } from "lucide-react";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, } from "@/components/ui/alert-dialog";
import { Tooltip, TooltipContent, TooltipTrigger, } from "@/components/ui/tooltip";
import { permissionService } from "@/services/permissionService";

export default function PermissionView() {
  const navigate = useNavigate();
  const { id } = useParams();
  const location = useLocation();

  const [permission, setPermission] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [deleteModal, setDeleteModal] = useState(false);

  const goBack = () => {
    if (location.state?.from === "archive") {
      navigate("/permissions/archive");
    } else {
      navigate("/permissions");
    }
  };
  const goEdit = () => navigate(`/permissions/${id}/edit`);

  const handlePrintPDF = () => {
    if (!permission) return;

    generatePersonalInfoPDF({
      title: "Permission Details",
      data: permission,
      fields: [
        { label: "Permission Name", key: "name" },
        { label: "Module", key: "module" },
        { label: "Status", key: "status" },
        { label: "Description", key: "description" },
        { label: "Created At", key: "createdAt" },
        { label: "Created By", key: "createdBy" },
        { label: "Last Updated", key: "updatedAt" },
        { label: "Updated By", key: "updatedBy" },
      ],
      companyName: "Permission Management System",
      headerInfo: { name: permission.name },
    });
  };

  const loadPermission = async () => {
    setLoading(true);
    setError("");

    try {
      const response = await permissionService.getById(id);
      const data = response.data;

      // Transform data if necessary, or use directly if backend matches
      const mappedData = {
        id: data.id,
        name: data.name,
        module: data.module,
        description: data.description,
        status: data.deletedAt ? "Archived" : "Active",
        createdAt: data.createdAt,
        updatedAt: data.updatedAt,
        createdBy: data.createdByName || "System",
        updatedBy: data.updatedByName || "System",
      };

      setPermission(mappedData);
    } catch (err) {
      setError(err.message || "Failed to load permission");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPermission();
  }, [id]);

  const confirmDelete = () => {
    setDeleteModal(false);
    navigate("/permissions");
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
    <AppLayout title="View Permission" onPrint={permission ? handlePrintPDF : undefined}>
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
        ) : permission ? (
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
                  <TooltipContent>Back to permissions</TooltipContent>
                </Tooltip>
                <div>
                  <h1 className="text-3xl font-bold text-gray-900">Permission Details</h1>
                  <p className="mt-1 text-sm text-gray-600">
                    View detailed information about this permission
                  </p>
                </div>
              </div>
            </div>

            {/* Content Card */}
            <div className="border rounded-lg bg-white overflow-hidden">
              {/* Header Section */}
              <div className="bg-gradient-to-r from-gray-50 to-gray-100 p-6 border-b">
                <div className="flex items-start justify-between">
                  <div className="space-y-2">
                    <div className="flex items-center gap-3">
                      <h2 className="text-2xl font-bold text-gray-900">{permission.name}</h2>
                      <Badge variant="default" className="bg-green-600">
                        {permission.status}
                      </Badge>
                    </div>
                    <p className="text-gray-700 max-w-2xl">{permission.description}</p>
                  </div>
                </div>
              </div>

              {/* Details Section */}
              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-x-6 gap-y-5">
                  {/* Module */}
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2 text-sm font-medium text-gray-500">
                      <Tag className="h-4 w-4" />
                      <span>Module</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-sm px-2.5 py-0.5">
                        {permission.module}
                      </Badge>
                    </div>
                  </div>

                  {/* Status */}
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2 text-sm font-medium text-gray-500">
                      <FileText className="h-4 w-4" />
                      <span>Status</span>
                    </div>
                    <p className="text-sm text-gray-900 font-medium">{permission.status}</p>
                  </div>

                  {/* Description */}
                  <div className="space-y-1.5 md:col-span-3">
                    <div className="flex items-center gap-2 text-sm font-medium text-gray-500">
                      <FileText className="h-4 w-4" />
                      <span>Description</span>
                    </div>
                    <p className="text-sm text-gray-900">{permission.description}</p>
                  </div>

                  {/* Created At */}
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2 text-sm font-medium text-gray-500">
                      <Calendar className="h-4 w-4" />
                      <span>Created At</span>
                    </div>
                    <p className="text-sm text-gray-900">{formatDateTime(permission.createdAt)}</p>
                    <p className="text-xs text-gray-500">by {permission.createdBy}</p>
                  </div>

                  {/* Updated At - Highlighted */}
                  <div className="space-y-1.5 md:col-span-2">
                    <div className="flex items-center gap-2 text-sm font-medium text-gray-700">
                      <Clock className="h-4 w-4" />
                      <span>Last Updated</span>
                    </div>
                    <div className="bg-gray-50 border border-gray-200 rounded-lg p-2.5">
                      <p className="text-sm text-gray-900 font-semibold">
                        {formatDateTime(permission.updatedAt)}
                      </p>
                      <p className="text-xs text-gray-600">by {permission.updatedBy}</p>
                    </div>
                  </div>
                </div>

                <Separator className="my-6" />

                {/* Actions */}
                <div className="flex items-center justify-end gap-3">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button variant="outline" onClick={goEdit}>
                        <Pencil className="h-4 w-4 mr-2" />
                        Edit Permission
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Edit this permission</TooltipContent>
                  </Tooltip>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="outline"
                        onClick={() => setDeleteModal(true)}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete Permission
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Delete this permission</TooltipContent>
                  </Tooltip>
                </div>
              </div>
            </div>
          </div>
        ) : !loading && !error ? (
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>Permission not found.</AlertDescription>
          </Alert>
        ) : null}
      </div>

      {/* Delete Confirmation */}
      <AlertDialog open={deleteModal} onOpenChange={setDeleteModal}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Delete</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete the permission{" "}
              <span className="font-semibold">{permission?.name}</span>? This action will move it to
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
