import { useState, useEffect, useMemo } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import { buildingService } from "../../services/buildingService";
import { scheduleMockService } from "../../services/mock/scheduleMockService";
import { CardGridSkeleton } from "../../utils/skeletonLoaders";
import AppLayout from "../../layouts/AppLayout";
import { applyFilters } from "../../utils/filterUtils";
import DateRangeFilter from "../../components/DateRangeFilter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
    ArrowLeft, Plus, Pencil, Trash2, Search, CheckCircle2, AlertCircle, X, Archive
} from "lucide-react";

export default function BookRequestSchedules() {
    const { buildingId } = useParams();
    const navigate = useNavigate();
    const location = useLocation();

    /* ----------------------------- state ----------------------------- */
    const [building, setBuilding] = useState(null);
    const [schedules, setSchedules] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [q, setQ] = useState("");
    const [fromDate, setFromDate] = useState(undefined);
    const [toDate, setToDate] = useState(undefined);
    const [status, setStatus] = useState("all");

    /* ----------------------------- alert ----------------------------- */
    const [alert, setAlert] = useState({ show: false, type: "success", message: "" });

    /* ----------------------------- modals ----------------------------- */
    const [archiveModal, setArchiveModal] = useState({ open: false, schedule: null });
    const [viewModal, setViewModal] = useState({ open: false, schedule: null });

    /* ----------------------------- load ----------------------------- */
    useEffect(() => {
        const load = async () => {
            try {
                const buildingRes = await buildingService.getById(buildingId);
                const buildingData = buildingRes.data?.data || buildingRes.data;
                if (!buildingData) { setError("Building not found"); setLoading(false); return; }
                setBuilding(buildingData);

                const schedulesData = await scheduleMockService.getByBuilding(buildingId);
                setSchedules(schedulesData);
            } catch {
                setError("Failed to load building data");
            } finally {
                setLoading(false);
            }
        };
        load();
    }, [buildingId]);

    /* ----------------------------- location state alert (from form page) ---- */
    useEffect(() => {
        if (location.state?.alert) {
            setAlert({ show: true, ...location.state.alert });
            // Clear state so refresh doesn't re-show
            window.history.replaceState({}, "");
        }
    }, [location.state]);

    /* ----------------------------- alert timer ----------------------------- */
    useEffect(() => {
        if (alert.show) {
            const t = setTimeout(() => setAlert({ show: false, type: "success", message: "" }), 4000);
            return () => clearTimeout(t);
        }
    }, [alert.show]);

    /* ----------------------------- search ----------------------------- */
    const filtered = useMemo(() => {
        let result = applyFilters(schedules, {
            search: q,
            searchFields: ["subjectName", "departmentName", "description", "priority"],
        });

        if (status !== "all") {
            result = result.filter((s) => s.status === status);
        }

        return result;
    }, [schedules, q, status]);

    /* ----------------------------- archive/restore ----------------------------- */
    const confirmArchive = async () => {
        const s = archiveModal.schedule;
        setArchiveModal({ open: false, schedule: null });
        if (!s) return;
        try {
            await scheduleMockService.archive(s.id);
            const schedulesData = await scheduleMockService.getByBuilding(buildingId);
            setSchedules(schedulesData);
            setAlert({ show: true, type: "success", message: `"${s.subjectName}" request archived!` });
        } catch {
            setAlert({ show: true, type: "error", message: "Failed to archive request" });
        }
    };

    /* ----------------------------- render ----------------------------- */
    return (
        <AppLayout title={building ? `${building.name} Requests` : "Requests"}>
            {loading ? (
                <CardGridSkeleton
                    cards={6}
                    detailRows={2}
                    showBackButton
                />
            ) : error ? (
                <div className="text-center py-20">
                    <p className="text-red-600 font-medium">{error}</p>
                    <Button variant="outline" className="mt-4" onClick={() => navigate("/book-request")}>
                        Back to Buildings
                    </Button>
                </div>
            ) : building && (
                <div className="space-y-6">
                    {/* Header */}
                    <div className="flex items-start justify-between gap-4">
                        <div className="flex items-center gap-4">
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <Button variant="outline" size="icon" onClick={() => navigate("/book-request")} className="flex-shrink-0">
                                        <ArrowLeft className="h-4 w-4" />
                                    </Button>
                                </TooltipTrigger>
                                <TooltipContent>Back to buildings</TooltipContent>
                            </Tooltip>
                            <div>
                                <h1 className="text-3xl font-bold text-gray-900">{building.name}</h1>
                                <p className="mt-1 text-sm text-gray-600">
                                    Manage requests for this building
                                </p>
                            </div>
                        </div>

                        <div className="flex items-center gap-4">
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
                                    <AlertDescription className={`text-sm font-medium whitespace-nowrap ${alert.type === "success" ? "text-green-800" : "text-red-800"}`}>
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
                                    <Button onClick={() => navigate(`/book-request/building/${buildingId}/create`)}>
                                        <Plus className="h-4 w-4 mr-2" />
                                        New Request
                                    </Button>
                                </TooltipTrigger>
                                <TooltipContent>Create a new request</TooltipContent>
                            </Tooltip>
                        </div>
                    </div>

                    {/* Filters */}
                    <div className="space-y-3">
                        <DateRangeFilter
                            fromDate={fromDate}
                            toDate={toDate}
                            onFromDateChange={(date) => { setFromDate(date); }}
                            onToDateChange={(date) => { setToDate(date); }}
                            onRangeChange={() => {}}
                            leftElement={
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <div className="relative">
                                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                                            <Input
                                                placeholder="Search requests..."
                                                value={q}
                                                onChange={(e) => setQ(e.target.value)}
                                                className="pl-10 w-[240px]"
                                            />
                                        </div>
                                    </TooltipTrigger>
                                    <TooltipContent>Search by subject, teacher, room or day</TooltipContent>
                                </Tooltip>
                            }
                            rightElement={
                                <>
                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <div>
                                                <Select value={status} onValueChange={(v) => setStatus(v)}>
                                                    <SelectTrigger className="w-[220px]">
                                                        <SelectValue placeholder="All Status" />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="all">All Status</SelectItem>
                                                        <SelectItem value="Waiting for Approval">Waiting for Approval</SelectItem>
                                                        <SelectItem value="Pending Teacher Interest">Pending Teacher Interest</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                        </TooltipTrigger>
                                        <TooltipContent>Filter by status</TooltipContent>
                                    </Tooltip>

                                    {(q || fromDate || toDate || status !== "all") && (
                                        <Tooltip>
                                            <TooltipTrigger asChild>
                                                <Button variant="outline" size="sm" onClick={() => { setQ(""); setFromDate(undefined); setToDate(undefined); setStatus("all"); }}>
                                                    Clear
                                                </Button>
                                            </TooltipTrigger>
                                            <TooltipContent>Clear all filters</TooltipContent>
                                        </Tooltip>
                                    )}

                                    <div className="ml-auto">
                                        <Tooltip>
                                            <TooltipTrigger asChild>
                                                <Button
                                                    variant="outline"
                                                    onClick={() => navigate(`/book-request/building/${buildingId}/archive`)}
                                                >
                                                    <Archive className="h-4 w-4 mr-2" />
                                                    Archive
                                                </Button>
                                            </TooltipTrigger>
                                            <TooltipContent>View archived requests</TooltipContent>
                                        </Tooltip>
                                    </div>
                                </>
                            }
                        />
                    </div>

                    {/* Request Cards */}
                    {filtered.length === 0 ? (
                        <div className="border rounded-lg py-20 text-center bg-white">
                            <p className="font-medium text-gray-600">No requests yet</p>
                            <p className="text-sm text-gray-400 mt-1">
                                {q ? "Try a different search term" : "Click \"New Request\" to create one"}
                            </p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {filtered.map((schedule) => (
                                <Card
                                    key={schedule.id}
                                    className="group overflow-hidden border border-gray-200 rounded-2xl bg-white hover:shadow-xl hover:-translate-y-1 transition-all duration-300 cursor-pointer"
                                    onClick={() => setViewModal({ open: true, schedule })}
                                >
                                    <CardContent className="p-0">
                                        {/* Accent stripe */}
                                        <div className="h-1.5 bg-gradient-to-r from-indigo-500 via-purple-500 to-indigo-400 opacity-80 group-hover:opacity-100 transition-opacity duration-300" />

                                        <div className="p-6 space-y-4">
                                            {/* Subject & Status */}
                                            <div className="flex items-start justify-between gap-3">
                                                <div>
                                                    <h3 className="text-lg font-bold text-gray-900 leading-snug">{schedule.subjectName}</h3>
                                                    <p className="text-xs text-gray-400 mt-0.5">ID: {schedule.id}</p>
                                                </div>
                                                <span className={`text-[11px] font-semibold tracking-wide px-2.5 py-1 rounded-full flex-shrink-0 text-right max-w-[160px] leading-tight ${
                                                    schedule.status === "Approved"
                                                            ? "bg-emerald-50 text-emerald-600 ring-1 ring-emerald-200"
                                                            : schedule.status === "Waiting for Approval"
                                                                ? "bg-amber-50 text-amber-600 ring-1 ring-amber-200"
                                                                : schedule.status === "Pending Teacher Interest"
                                                                    ? "bg-blue-50 text-blue-600 ring-1 ring-blue-200"
                                                                    : schedule.status === "Rejected"
                                                                        ? "bg-red-50 text-red-600 ring-1 ring-red-200"
                                                                        : "bg-gray-50 text-gray-600 ring-1 ring-gray-200"
                                                    }`}>
                                                    {schedule.status}
                                                </span>
                                            </div>

                                            {/* Details */}
                                            <div className="space-y-2 text-sm">
                                                <div className="flex items-center justify-between">
                                                    <span className="text-gray-400">Department</span>
                                                    <span className="font-medium text-gray-700">{schedule.departmentName}</span>
                                                </div>
                                                <div className="flex items-center justify-between">
                                                    <span className="text-gray-400">Priority</span>
                                                    <span className={`font-medium ${
                                                        schedule.priority === "High" ? "text-red-600" :
                                                        schedule.priority === "Low" ? "text-gray-500" : "text-orange-600"
                                                    }`}>{schedule.priority}</span>
                                                </div>
                                                {schedule.description && (
                                                    <div className="pt-1">
                                                        <span className="text-gray-400 block mb-0.5">Description</span>
                                                        <span className="font-medium text-gray-700 line-clamp-2">{schedule.description}</span>
                                                    </div>
                                                )}
                                            </div>

                                            {/* Actions */}
                                            <div className="flex items-center gap-2 pt-3 border-t border-gray-100">
                                                <Tooltip>
                                                    <TooltipTrigger asChild>
                                                        <Button
                                                            variant="outline"
                                                            size="sm"
                                                            className="flex-1"
                                                            onClick={(e) => { e.stopPropagation(); navigate(`/book-request/building/${buildingId}/${schedule.id}/edit`); }}
                                                        >
                                                            <Pencil className="h-3.5 w-3.5 mr-1.5" />
                                                            Edit
                                                        </Button>
                                                    </TooltipTrigger>
                                                    <TooltipContent>Edit request</TooltipContent>
                                                </Tooltip>
                                                <Tooltip>
                                                    <TooltipTrigger asChild>
                                                        <Button
                                                            variant="outline"
                                                            size="sm"
                                                            className="text-red-600 border-red-200 hover:bg-red-50"
                                                            onClick={(e) => { e.stopPropagation(); setArchiveModal({ open: true, schedule }); }}
                                                        >
                                                            <Trash2 className="h-3.5 w-3.5" />
                                                        </Button>
                                                    </TooltipTrigger>
                                                    <TooltipContent>Archive request</TooltipContent>
                                                </Tooltip>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* ==================== Archive Confirm ==================== */}
            <AlertDialog open={archiveModal.open} onOpenChange={(open) => !open && setArchiveModal({ open: false, schedule: null })}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Archive Request</AlertDialogTitle>
                        <AlertDialogDescription>
                            Are you sure you want to archive the <span className="font-semibold text-gray-900">"{archiveModal.schedule?.subjectName}"</span> request?
                            This will move it to the archive and can be restored later.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={confirmArchive} className="bg-red-600 hover:bg-red-700">
                            Archive
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            {/* ==================== View Confirm ==================== */}
            <Dialog open={viewModal.open} onOpenChange={(open) => !open && setViewModal({ open: false, schedule: null })}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>View Request Details</DialogTitle>
                        <DialogDescription>
                            You are about to view the request{" "}
                            <span className="font-semibold text-gray-900">"{viewModal.schedule?.subjectName}"</span>. Do you want to continue?
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setViewModal({ open: false, schedule: null })}>
                            Cancel
                        </Button>
                        <Button onClick={() => { setViewModal({ open: false, schedule: null }); navigate(`/book-request/building/${buildingId}/${viewModal.schedule?.id}`); }}>
                            View Details
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

        </AppLayout>
    );
}
