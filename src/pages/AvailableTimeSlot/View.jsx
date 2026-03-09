import { useEffect, useState } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import { availableTimeSlotService } from "../../services/availableTimeSlotService";
import AppLayout from "../../layouts/AppLayout";
import { generatePersonalInfoPDF } from "../../utils/pdfExport";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { DetailViewSkeleton } from "../../utils/skeletonLoaders";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Pencil, Trash2, Clock, FileText, AlertCircle, Calendar } from "lucide-react";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

export default function AvailableTimeSlotView() {
    const navigate = useNavigate();
    const { id } = useParams();
    const location = useLocation();

    const [slot, setSlot] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [deleteModal, setDeleteModal] = useState(false);

    const isFromArchive = location.state?.from === "archive";
    const goBack = () => {
        if (isFromArchive) {
            navigate("/available-time-slots/archive");
        } else {
            navigate("/available-time-slots");
        }
    };
    const goEdit = () => navigate(`/available-time-slots/${id}/edit`);

    const handlePrintPDF = () => {
        if (!slot) return;
        generatePersonalInfoPDF({
            title: "Time Slot Details",
            data: slot,
            fields: [
                { label: "Label", key: "label" },
                { label: "Start Time", key: "startTime" },
                { label: "End Time", key: "endTime" },
                { label: "Status", key: "isActive", format: (v) => v ? "Active" : "Inactive" },
                { label: "Created At", key: "createdAt" },
                { label: "Last Updated", key: "updatedAt" },
            ],
            companyName: "Time Slot Management System",
            headerInfo: { name: slot.label },
        });
    };

    const loadSlot = async () => {
        setLoading(true);
        setError("");
        try {
            const response = await availableTimeSlotService.getById(id);
            const data = response.data;
            if (!data) throw new Error("Time slot not found");
            setSlot({
                ...data,
                createdByName: data.createdByName || "System",
                updatedByName: data.updatedByName || "System",
            });
        } catch (err) {
            setError(err.response?.data?.message || err.message || "Failed to load time slot");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { loadSlot(); }, [id]);

    const confirmDelete = async () => {
        setDeleteModal(false);
        try {
            await availableTimeSlotService.delete(id);
            navigate("/available-time-slots", { state: { alert: { type: "success", message: `"${slot.label}" archived successfully!` } } });
        } catch (err) {
            setError(err.response?.data?.message || "Failed to archive time slot");
        }
    };

    const formatDateTime = (dateString) => {
        if (!dateString) return "—";
        const date = new Date(dateString);
        return date.toLocaleString("en-US", { year: "numeric", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
    };

    return (
        <AppLayout title="View Time Slot" onPrint={slot ? handlePrintPDF : undefined}>
            <div className="space-y-6">
                {error && <Alert variant="destructive"><AlertCircle className="h-4 w-4" /><AlertDescription>{error}</AlertDescription></Alert>}

                {loading ? (
                    <DetailViewSkeleton fields={4} />
                ) : slot ? (
                    <div className="space-y-6">
                        <div className="flex items-start justify-between gap-4">
                            <div className="flex items-center gap-3">
                                <Tooltip><TooltipTrigger asChild><Button variant="outline" size="icon" onClick={goBack}><ArrowLeft className="h-4 w-4" /></Button></TooltipTrigger><TooltipContent>{isFromArchive ? "Back to archived time slots" : "Back to time slots"}</TooltipContent></Tooltip>
                                <div>
                                    <h1 className="text-3xl font-bold text-gray-900">Time Slot Details</h1>
                                    <p className="mt-1 text-sm text-gray-600">View time slot information</p>
                                </div>
                            </div>
                        </div>

                        <div className="border rounded-lg bg-white overflow-hidden">
                            <div className="bg-gradient-to-r from-gray-50 to-gray-100 p-6 border-b">
                                <div className="flex items-center gap-3">
                                    <h2 className="text-2xl font-bold text-gray-900">{slot.label}</h2>
                                    <Badge variant="default" className={slot.isActive ? "bg-green-600" : "bg-gray-500"}>{slot.isActive ? "Active" : "Inactive"}</Badge>
                                </div>
                            </div>
                            <div className="p-6">
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-x-6 gap-y-5">
                                    <div className="space-y-1.5">
                                        <div className="flex items-center gap-2 text-sm font-medium text-gray-500"><Clock className="h-4 w-4" /><span>Start Time</span></div>
                                        <p className="text-sm text-gray-900 font-medium">{slot.startTime}</p>
                                    </div>
                                    <div className="space-y-1.5">
                                        <div className="flex items-center gap-2 text-sm font-medium text-gray-500"><Clock className="h-4 w-4" /><span>End Time</span></div>
                                        <p className="text-sm text-gray-900 font-medium">{slot.endTime}</p>
                                    </div>
                                    <div className="space-y-1.5">
                                        <div className="flex items-center gap-2 text-sm font-medium text-gray-500"><FileText className="h-4 w-4" /><span>Status</span></div>
                                        <p className="text-sm text-gray-900 font-medium">{slot.isActive ? "Active" : "Inactive"}</p>
                                    </div>
                                    <div className="space-y-1.5">
                                        <div className="flex items-center gap-2 text-sm font-medium text-gray-500"><Calendar className="h-4 w-4" /><span>Created At</span></div>
                                        <p className="text-sm text-gray-900">{formatDateTime(slot.createdAt)}</p>
                                        <p className="text-xs text-gray-500">by {slot.createdByName}</p>
                                    </div>
                                    <div className="space-y-1.5 md:col-span-2">
                                        <div className="flex items-center gap-2 text-sm font-medium text-gray-700"><Clock className="h-4 w-4" /><span>Last Updated</span></div>
                                        <div className="bg-gray-50 border border-gray-200 rounded-lg p-2.5">
                                            <p className="text-sm text-gray-900 font-semibold">{formatDateTime(slot.updatedAt)}</p>
                                            <p className="text-xs text-gray-600">by {slot.updatedByName}</p>
                                        </div>
                                    </div>
                                </div>

                                <Separator className="my-6" />

                                <div className="flex items-center justify-end gap-3">
                                    <Tooltip><TooltipTrigger asChild><Button variant="outline" onClick={goEdit}><Pencil className="h-4 w-4 mr-2" />Edit Time Slot</Button></TooltipTrigger><TooltipContent>Edit this time slot</TooltipContent></Tooltip>
                                    <Tooltip><TooltipTrigger asChild><Button variant="outline" onClick={() => setDeleteModal(true)} className="text-red-600 hover:text-red-700 hover:bg-red-50"><Trash2 className="h-4 w-4 mr-2" />Archive Time Slot</Button></TooltipTrigger><TooltipContent>Archive this time slot</TooltipContent></Tooltip>
                                </div>
                            </div>
                        </div>
                    </div>
                ) : (
                    <Alert><AlertCircle className="h-4 w-4" /><AlertDescription>Time slot not found.</AlertDescription></Alert>
                )}
            </div>

            <AlertDialog open={deleteModal} onOpenChange={setDeleteModal}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Confirm Archive</AlertDialogTitle>
                        <AlertDialogDescription>Are you sure you want to archive the time slot <span className="font-semibold">{slot?.label}</span>? This action will move it to the archive.</AlertDialogDescription>
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
