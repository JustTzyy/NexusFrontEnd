import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { TableIndexSkeleton } from "../../utils/skeletonLoaders";
import AppLayout from "../../layouts/AppLayout";
import { generatePDF, generatePersonalInfoPDF } from "../../utils/pdfExport";
import { applyFilters } from "../../utils/filterUtils";
import DateRangeFilter from "../../components/DateRangeFilter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tooltip, TooltipContent, TooltipTrigger, } from "@/components/ui/tooltip";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue, } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, } from "@/components/ui/alert-dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { RotateCcw, Trash2, Search, X, AlertCircle, CheckCircle2, ArrowLeft, Printer, } from "lucide-react";
import { permissionService } from "@/services/permissionService";
import PermissionGate from '@/components/PermissionGate';

export default function PermissionsArchive() {
  const navigate = useNavigate();

  /* ------------------------------ api state ------------------------------ */
  const [permissions, setPermissions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true); // Only true on first load
  const [error, setError] = useState("");

  /* ---------------------------- filter state ---------------------------- */
  const [q, setQ] = useState("");
  const [debouncedQ, setDebouncedQ] = useState(""); // Debounced search term for API calls
  const [fromDate, setFromDate] = useState(undefined);
  const [toDate, setToDate] = useState(undefined);
  const [module, setModule] = useState("all");

  /* -------------------------- pagination state -------------------------- */
  const [page, setPage] = useState(1);
  const pageSize = 10;
  const [pagination, setPagination] = useState({
    totalCount: 0,
    totalPages: 0,
    currentPage: 1,
    hasNextPage: false,
    hasPreviousPage: false,
  });

  /* -------------------------- modal state -------------------------- */
  const [viewModal, setViewModal] = useState({ open: false, permission: null });
  const [restoreModal, setRestoreModal] = useState({ open: false, permission: null });
  const [deleteModal, setDeleteModal] = useState({ open: false, permission: null });

  /* -------------------------- alert state -------------------------- */
  const [alert, setAlert] = useState({ show: false, type: "success", message: "" });

  const resetPage = () => setPage(1);

  const clearFilters = () => {
    setQ("");
    setFromDate(undefined);
    setToDate(undefined);
    setModule("all");
    setPage(1);
  };

  // PDF Export function using reusable utility
  const handlePrintPDF = () => {
    generatePDF({
      title: "Archived Permissions Report",
      data: filtered,
      columns: [
        { header: "Name", key: "name" },
        { header: "Module", key: "module" },
        { header: "Description", key: "description" },
        { header: "Deleted At", key: "deletedAt" },
      ],
      filters: {
        Search: q || null,
        "From Date": fromDate || null,
        "To Date": toDate || null,
        Module: module !== "all" ? module : null,
      },
      companyName: "Archived Permissions Management System",
    });
  };

  // Print single permission in personal info format
  const handlePrintSinglePDF = (permission) => {
    if (!permission) return;

    generatePersonalInfoPDF({
      title: "Archived Permission Details",
      data: permission,
      fields: [
        { label: "Permission Name", key: "name" },
        { label: "Module", key: "module" },
        { label: "Description", key: "description" },
        { label: "Deleted At", key: "deletedAt" },
      ],
      companyName: "Permission Management System",
      headerInfo: { name: permission.name },
    });
  };

  /* ------------------------------ routes ------------------------------ */
  const goBack = () => navigate("/permissions");

  /* ------------------------------ api ------------------------------ */
  const loadArchivedPermissions = async () => {
    setLoading(true);
    setError("");

    try {
      const response = await permissionService.getArchived({
        pageNumber: page,
        pageSize: pageSize,
        searchTerm: debouncedQ || undefined,
        module: module !== "all" ? module : undefined,
      });

      // Transform backend response to match frontend format
      const transformedPermissions = response.data.items.map(permission => ({
        id: permission.id,
        name: permission.name,
        module: permission.module,
        description: permission.description,
        deletedAt: permission.deletedAt ? new Date(permission.deletedAt).toLocaleDateString('en-CA') : "—",
      }));

      setPermissions(transformedPermissions);

      // Capture pagination metadata from backend
      setPagination({
        totalCount: response.data.totalCount || 0,
        totalPages: response.data.totalPages || 0,
        currentPage: response.data.pageNumber || 1,
        hasNextPage: response.data.hasNextPage || false,
        hasPreviousPage: response.data.hasPreviousPage || false,
      });
    } catch (err) {
      setError(err.message || "Failed to load archived permissions");
      console.error("Error loading archived permissions:", err);
    } finally {
      setLoading(false);
      setInitialLoading(false); // After first load, no more skeleton
    }
  };

  // Debounce search input to avoid excessive API calls
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQ(q);
    }, 300); // Wait 300ms after user stops typing

    return () => clearTimeout(timer);
  }, [q]);

  useEffect(() => {
    loadArchivedPermissions();
  }, [page, debouncedQ, module]); // Reload when page, debounced search, or module changes

  useEffect(() => {
    if (alert.show) {
      const timer = setTimeout(() => {
        setAlert({ show: false, type: "success", message: "" });
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [alert.show]);

  /* ------------------------------ modals ------------------------------ */
  const openViewModal = (permission) => {
    setViewModal({ open: true, permission });
  };

  const openRestoreModal = (permission) => {
    setRestoreModal({ open: true, permission });
  };

  const openDeleteModal = (permission) => {
    setDeleteModal({ open: true, permission });
  };

  const confirmView = () => {
    if (viewModal.permission) {
      navigate(`/permissions/${viewModal.permission.id}`, { state: { from: "archive" } });
    }
    setViewModal({ open: false, permission: null });
  };

  const confirmRestore = async () => {
    const p = restoreModal.permission;
    setRestoreModal({ open: false, permission: null });

    if (!p) return;

    try {
      await permissionService.restore(p.id);
      setAlert({ show: true, type: "success", message: `Permission "${p.name}" restored successfully!` });
      loadArchivedPermissions(); // Refresh the list
    } catch (err) {
      setAlert({ show: true, type: "error", message: err.message || "Failed to restore permission" });
      console.error("Error restoring permission:", err);
    }
  };

  const confirmDelete = async () => {
    const p = deleteModal.permission;
    setDeleteModal({ open: false, permission: null });

    if (!p) return;

    try {
      await permissionService.permanentDelete(p.id);
      setAlert({ show: true, type: "success", message: `Permission "${p.name}" permanently deleted!` });
      loadArchivedPermissions(); // Refresh the list
    } catch (err) {
      setAlert({ show: true, type: "error", message: err.message || "Failed to permanently delete permission" });
      console.error("Error deleting permission:", err);
    }
  };

  /* ------------------------- filtering (using reusable utilities) ------------------------- */
  const filtered = useMemo(() => {
    return applyFilters(permissions, {
      search: q,
      searchFields: ['name', 'module', 'description'],
      fromDate,
      toDate,
      dateField: 'deletedAt',
      fields: {
        module: module,
      },
    });
  }, [permissions, q, fromDate, toDate, module]);

  // Use backend-paginated data directly (no frontend re-pagination)
  const paged = permissions; // Already paginated by backend

  // Static list of modules for filtering (same as Index page)
  const modules = ["Users", "Roles", "Permissions", "Departments", "Buildings", "Rooms", "Subjects", "AuditLog", "OperationLog", "Auth"];

  return (
    <AppLayout title="Archived Permissions" onPrint={filtered.length > 0 ? handlePrintPDF : undefined}>
      {initialLoading ? (
        <TableIndexSkeleton
          columns={5}
          rows={10}
          headers={["Name", "Module", "Description", "Deleted At", "Actions"]}
        />
      ) : (
        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-start justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Archived Permissions</h1>
              <p className="mt-1 text-sm text-gray-600">
                View and manage soft-deleted permissions
              </p>
            </div>

            <div className="flex items-center gap-4">
              {/* Alert Notification - in header for consistency */}
              {alert.show && (
                <Alert
                  className={`flex items-center gap-2 py-2 px-4 w-fit rounded-full animate-in fade-in slide-in-from-right-4 duration-300 ${alert.type === "success"
                    ? "border-green-500 bg-green-50 text-green-800"
                    : "border-red-500 bg-red-50 text-red-800"
                    }`}
                >
                  {alert.type === "success" ? (
                    <CheckCircle2 className="h-4 w-4 text-green-600 flex-shrink-0" />
                  ) : (
                    <AlertCircle className="h-4 w-4 text-red-600 flex-shrink-0" />
                  )}
                  <AlertDescription className={`text-sm font-medium whitespace-nowrap ${alert.type === "success" ? "text-green-800" : "text-red-800"
                    }`}>
                    {alert.message}
                  </AlertDescription>
                  <Button
                    variant="ghost"
                    size="icon"
                    className={`h-5 w-5 ml-1 rounded-full flex-shrink-0 ${alert.type === "success"
                      ? "text-green-600 hover:text-green-700 hover:bg-green-100"
                      : "text-red-600 hover:text-red-700 hover:bg-red-100"
                      }`}
                    onClick={() => setAlert({ show: false, type: "success", message: "" })}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </Alert>
              )}

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="outline" onClick={goBack}>
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Back to Permissions
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Return to active permissions</TooltipContent>
              </Tooltip>
            </div>
          </div>

          {/* Error */}
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Filters */}
          <div className="space-y-3">
            {/* Date Range Filter Component with Search and Module Filter */}
            <DateRangeFilter
              fromDate={fromDate}
              toDate={toDate}
              onFromDateChange={(date) => {
                setFromDate(date);
                resetPage();
              }}
              onToDateChange={(date) => {
                setToDate(date);
                resetPage();
              }}
              onRangeChange={() => resetPage()}
              leftElement={
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <Input
                        placeholder="Search archived permissions..."
                        value={q}
                        onChange={(e) => {
                          setQ(e.target.value);
                          resetPage();
                        }}
                        className="pl-10 w-[240px]"
                      />
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>Search by name, module, or description</TooltipContent>
                </Tooltip>
              }
              rightElement={
                <>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div>
                        <Select value={module} onValueChange={(v) => { setModule(v); resetPage(); }}>
                          <SelectTrigger className="w-[180px]">
                            <SelectValue placeholder="All Modules" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">All Modules</SelectItem>
                            {modules.map((m) => (
                              <SelectItem key={m} value={m.toLowerCase()}>
                                {m}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </TooltipTrigger>
                    <TooltipContent>Filter by module</TooltipContent>
                  </Tooltip>

                  {/* Clear button */}
                  {(q || fromDate || toDate || module !== "all") && (
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button variant="outline" size="sm" onClick={clearFilters}>
                          Clear
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>Clear all filters</TooltipContent>
                    </Tooltip>
                  )}
                </>
              }
            />
          </div>

          {/* Table */}
          <div className="border rounded-lg overflow-hidden bg-white">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Module</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Deleted At</TableHead>
                  <TableHead className="text-center">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {initialLoading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <TableRow key={i}>
                      <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-48" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-16 ml-auto" /></TableCell>
                    </TableRow>
                  ))
                ) : paged.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="h-32 text-center text-gray-500">
                      No archived permissions found.
                    </TableCell>
                  </TableRow>
                ) : (
                  paged.map((p) => (
                    <Tooltip key={p.id}>
                      <TooltipTrigger asChild>
                        <TableRow
                          className="cursor-pointer"
                          onClick={() => openViewModal(p)}
                        >
                          <TableCell className="font-medium">{p.name}</TableCell>
                          <TableCell className="text-gray-600">{p.module}</TableCell>
                          <TableCell className="max-w-md truncate">{p.description || "—"}</TableCell>
                          <TableCell className="text-gray-600">{p.deletedAt}</TableCell>
                          <TableCell className="text-center">
                            <div className="flex items-center justify-center gap-1">
                              <PermissionGate permission="RestorePermissions">
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        openRestoreModal(p);
                                      }}
                                      className="text-green-600 hover:text-green-700 hover:bg-green-50"
                                    >
                                      <RotateCcw className="h-4 w-4" />
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent>Restore permission</TooltipContent>
                                </Tooltip>
                              </PermissionGate>
                              <PermissionGate permission="PermanentDeletePermissions">
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        openDeleteModal(p);
                                      }}
                                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                    >
                                      <Trash2 className="h-4 w-4" />
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent>Permanently delete</TooltipContent>
                                </Tooltip>
                              </PermissionGate>
                            </div>
                          </TableCell>
                        </TableRow>
                      </TooltipTrigger>
                      <TooltipContent>Click to view details</TooltipContent>
                    </Tooltip>
                  ))
                )}
              </TableBody>
            </Table>

            {/* Pagination */}
            {!loading && paged.length > 0 && (
              <div className="flex items-center justify-between border-t px-6 py-4">
                <p className="text-sm text-gray-600">
                  Showing {(page - 1) * pageSize + 1} to {Math.min(page * pageSize, pagination.totalCount)} of {pagination.totalCount} results
                </p>
                <div className="flex items-center gap-2">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setPage(p => Math.max(1, p - 1))}
                        disabled={!pagination.hasPreviousPage}
                      >
                        Previous
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Go to previous page</TooltipContent>
                  </Tooltip>
                  <span className="text-sm text-gray-600">
                    Page {page} of {pagination.totalPages}
                  </span>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setPage(p => Math.min(pagination.totalPages, p + 1))}
                        disabled={!pagination.hasNextPage}
                      >
                        Next
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Go to next page</TooltipContent>
                  </Tooltip>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* View Confirmation */}
      <Dialog open={viewModal.open} onOpenChange={(open) => !open && setViewModal({ open: false, permission: null })}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>View Permission Details</DialogTitle>
            <DialogDescription>
              You are about to view the archived permission{" "}
              <span className="font-semibold">{viewModal.permission?.name}</span>. Do you want to
              continue?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setViewModal({ open: false, permission: null })}>
              Cancel
            </Button>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="outline" onClick={() => handlePrintSinglePDF(viewModal.permission)}>
                  <Printer className="h-4 w-4 mr-2" />
                  Print
                </Button>
              </TooltipTrigger>
              <TooltipContent>Print permission details as PDF</TooltipContent>
            </Tooltip>
            <Button onClick={confirmView}>View Details</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Restore Confirmation */}
      <AlertDialog open={restoreModal.open} onOpenChange={(open) => !open && setRestoreModal({ open: false, permission: null })}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Restore</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to restore the permission{" "}
              <span className="font-semibold">{restoreModal.permission?.name}</span>?
              This will move it back to the active permissions list.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmRestore} className="bg-green-600 hover:bg-green-700">
              Restore
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Permanent Delete Confirmation */}
      <AlertDialog open={deleteModal.open} onOpenChange={(open) => !open && setDeleteModal({ open: false, permission: null })}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Permanent Delete</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to <span className="font-semibold text-red-600">permanently delete</span> the permission{" "}
              <span className="font-semibold">{deleteModal.permission?.name}</span>?
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-red-600 hover:bg-red-700">
              Permanently Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AppLayout>
  );
}
