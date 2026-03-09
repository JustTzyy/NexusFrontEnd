import { useState, useEffect, useMemo } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { buildingService } from "../../services/buildingService";
import { scheduleMockService } from "../../services/mock/scheduleMockService";
import { CardGridSkeleton } from "../../utils/skeletonLoaders";
import AppLayout from "../../layouts/AppLayout";
import { applyFilters } from "../../utils/filterUtils";
import DateRangeFilter from "../../components/DateRangeFilter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
    ArrowLeft, RotateCcw, Search, CheckCircle2, AlertCircle, X
} from "lucide-react";

export default function BookRequestScheduleArchive() {
    const { buildingId } = useParams();
    const navigate = useNavigate();

    /* ----------------------------- state ----------------------------- */
    const [building, setBuilding] = useState(null);
    const [archivedSchedules, setArchivedSchedules] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [q, setQ] = useState("");
    const [fromDate, setFromDate] = useState(undefined);
    const [toDate, setToDate] = useState(undefined);

    /* ----------------------------- alert ----------------------------- */
    const [alert, setAlert] = useState({ show: false, type: "success", message: "" });

    /* ----------------------------- modals ----------------------------- */
    const [restoreModal, setRestoreModal] = useState({ open: false, schedule: null });

    /* ----------------------------- load ----------------------------- */
    useEffect(() => {
        const load = async () => {
            try {
                const buildingRes = await buildingService.getById(buildingId);
                const buildingData = buildingRes.data?.data || buildingRes.data;
                if (!buildingData) { setError("Building not found"); setLoading(false); return; }
                setBuilding(buildingData);

                const archivedData = await scheduleMockService.getArchivedByBuilding(buildingId);
                setArchivedSchedules(archivedData);
            } catch {
                setError("Failed to load archived requests");
            } finally {
                setLoading(false);
            }
        };
        load();
    }, [buildingId]);

    /* ----------------------------- alert timer ----------------------------- */
    useEffect(() => {
        if (alert.show) {
            const t = setTimeout(() => setAlert({ show: false, type: "success", message: "" }), 4000);
            return () => clearTimeout(t);
        }
    }, [alert.show]);

    /* ----------------------------- search ----------------------------- */
    const filtered = useMemo(() => {
        return applyFilters(archivedSchedules, {
            search: q,
            searchFields: ["subjectName", "departmentName", "description", "priority"],
        });
    }, [archivedSchedules, q]);

    /* ----------------------------- restore ----------------------------- */
    const confirmRestore = async () => {
        const s = restoreModal.schedule;
        setRestoreModal({ open: false, schedule: null });
        if (!s) return;
        try {
            await scheduleMockService.restore(s.id);
            const archivedData = await scheduleMockService.getArchivedByBuilding(buildingId);
            setArchivedSchedules(archivedData);
            setAlert({ show: true, type: "success", message: `"${s.subjectName}" request restored!` });
        } catch {
            setAlert({ show: true, type: "error", message: "Failed to restore request" });
        }
    };

    /* ----------------------------- navigation ----------------------------- */
    const goBack = () => navigate(`/book-request/building/${buildingId}`);

    /* ----------------------------- render ----------------------------- */
    return (
        <AppLayout title={building ? `${building.name} — Archived Requests` : "Archived Requests"}>
            {loading ? (
                <CardGridSkeleton
                    cards={6}
                    detailRows={2}
                    showBackButton
                    showAddButton={false}
                />
            ) : error ? (
                <div className="text-center py-20">
                    <p className="text-red-600 font-medium">{error}</p>
                    <Button variant="outline" className="mt-4" onClick={goBack}>
                        Back to Requests
                    </Button>
                </div>
            ) : building && (
                <div className="space-y-6">
                    {/* Header */}
                    <div className="flex items-start justify-between gap-4">
                        <div>
                            <h1 className="text-3xl font-bold text-gray-900">Archived Requests</h1>
                            <p className="mt-1 text-sm text-gray-600">
                                View and restore archived requests for {building.name}
                            </p>
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
                                    <Button variant="outline" onClick={goBack}>
                                        <ArrowLeft className="h-4 w-4 mr-2" />
                                        Back to Requests
                                    </Button>
                                </TooltipTrigger>
                                <TooltipContent>Return to active requests</TooltipContent>
                            </Tooltip>
                        </div>
                    </div>

                    {/* Filters */}
                    <div className="space-y-3">
                        <DateRangeFilter
                            fromDate={fromDate}
                            toDate={toDate}
                            onFromDateChange={(date) => setFromDate(date)}
                            onToDateChange={(date) => setToDate(date)}
                            onRangeChange={() => {}}
                            leftElement={
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <div className="relative">
                                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                                            <Input
                                                placeholder="Search archived requests..."
                                                value={q}
                                                onChange={(e) => setQ(e.target.value)}
                                                className="pl-10 w-[240px]"
                                            />
                                        </div>
                                    </TooltipTrigger>
                                    <TooltipContent>Search by subject, department, or priority</TooltipContent>
                                </Tooltip>
                            }
                            rightElement={
                                <>
                                    {(q || fromDate || toDate) && (
                                        <Tooltip>
                                            <TooltipTrigger asChild>
                                                <Button variant="outline" size="sm" onClick={() => { setQ(""); setFromDate(undefined); setToDate(undefined); }}>
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

                    {/* Archived Request Cards */}
                    {filtered.length === 0 ? (
                        <div className="border rounded-lg py-20 text-center bg-white">
                            <p className="font-medium text-gray-600">No archived requests</p>
                            <p className="text-sm text-gray-400 mt-1">
                                {q ? "Try a different search term" : "Archived requests will appear here"}
                            </p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {filtered.map((schedule) => (
                                <Card
                                    key={schedule.id}
                                    className="group overflow-hidden border border-orange-200 rounded-2xl bg-white hover:shadow-xl hover:-translate-y-1 transition-all duration-300"
                                >
                                    <CardContent className="p-0">
                                        {/* Accent stripe */}
                                        <div className="h-1.5 bg-gradient-to-r from-orange-400 via-red-400 to-orange-300 opacity-80 transition-opacity duration-300" />

                                        <div className="p-6 space-y-4">
                                            {/* Subject & Status */}
                                            <div className="flex items-start justify-between gap-3">
                                                <div>
                                                    <h3 className="text-lg font-bold text-gray-900 leading-snug">{schedule.subjectName}</h3>
                                                    <p className="text-xs text-gray-400 mt-0.5">ID: {schedule.id}</p>
                                                </div>
                                                <span className="text-[11px] font-semibold tracking-wide px-2.5 py-1 rounded-full flex-shrink-0 bg-orange-50 text-orange-600 ring-1 ring-orange-200">
                                                    Archived
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
                                                            className="flex-1 text-green-700 border-green-200 hover:bg-green-50"
                                                            onClick={() => setRestoreModal({ open: true, schedule })}
                                                        >
                                                            <RotateCcw className="h-3.5 w-3.5 mr-1.5" />
                                                            Restore
                                                        </Button>
                                                    </TooltipTrigger>
                                                    <TooltipContent>Restore this request</TooltipContent>
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

            {/* ==================== Restore Confirm ==================== */}
            <AlertDialog open={restoreModal.open} onOpenChange={(open) => !open && setRestoreModal({ open: false, schedule: null })}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Restore Request</AlertDialogTitle>
                        <AlertDialogDescription>
                            Are you sure you want to restore the <span className="font-semibold text-gray-900">"{restoreModal.schedule?.subjectName}"</span> request?
                            This will make it active again.
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
        </AppLayout>
    );
}
