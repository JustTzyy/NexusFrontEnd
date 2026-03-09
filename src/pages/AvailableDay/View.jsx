import { useEffect, useState } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import { availableDayService } from "../../services/availableDayService";
import AppLayout from "../../layouts/AppLayout";
import { generatePersonalInfoPDF } from "../../utils/pdfExport";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { DetailViewSkeleton } from "../../utils/skeletonLoaders";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Pencil, Trash2, Calendar, Clock, FileText, AlertCircle, Hash } from "lucide-react";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

export default function AvailableDayView() {
    const navigate = useNavigate();
    const { id } = useParams();
    const location = useLocation();

    const [day, setDay] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [deleteModal, setDeleteModal] = useState(false);

    const isFromArchive = location.state?.from === "archive";
    const goBack = () => {
        if (isFromArchive) {
            navigate("/available-days/archive");
        } else {
            navigate("/available-days");
        }
    };
    const goEdit = () => navigate(`/available-days/${id}/edit`);

    const handlePrintPDF = () => {
        if (!day) return;
        generatePersonalInfoPDF({
            title: "Available Day Details",
            data: day,
            fields: [
                { label: "Day Name", key: "dayName" },
                { label: "Sort Order", key: "sortOrder" },
                { label: "Status", key: "isActive", format: (v) => v ? "Active" : "Inactive" },
                { label: "Created At", key: "createdAt" },
                { label: "Last Updated", key: "updatedAt" },
            ],
            companyName: "Available Day Management System",
            headerInfo: { name: day.dayName },
        });
    };

    const loadDay = async () => {
        setLoading(true);
        setError("");
        try {
            const response = await availableDayService.getById(id);
            const data = response.data;
            if (!data) throw new Error("Day not found");
            setDay({
                ...data,
                createdByName: data.createdByName || "System",
                updatedByName: data.updatedByName || "System",
            });
        } catch (err) {
            setError(err.response?.data?.message || err.message || "Failed to load day");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { loadDay(); }, [id]);

    const confirmDelete = async () => {
        setDeleteModal(false);
        try {
            await availableDayService.delete(id);
            navigate("/available-days", { state: { alert: { type: "success", message: `"${day.dayName}" archived successfully!` } } });
        } catch (err) {
            setError(err.response?.data?.message || "Failed to archive day");
        }
    };

    const formatDateTime = (dateString) => {
        if (!dateString) return "—";
        const date = new Date(dateString);
        return date.toLocaleString("en-US", { year: "numeric", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
    };

    return (
        <AppLayout title="View Day" onPrint={day ? handlePrintPDF : undefined}>
            <div className="space-y-6">
                {error && <Alert variant="destructive"><AlertCircle className="h-4 w-4" /><AlertDescription>{error}</AlertDescription></Alert>}

                {loading ? (
                    <DetailViewSkeleton fields={4} />
                ) : day ? (
                    <div className="space-y-6">
                        <div className="flex items-start justify-between gap-4">
                            <div className="flex items-center gap-3">
                                <Tooltip><TooltipTrigger asChild><Button variant="outline" size="icon" onClick={goBack}><ArrowLeft className="h-4 w-4" /></Button></TooltipTrigger><TooltipContent>{isFromArchive ? "Back to archived days" : "Back to available days"}</TooltipContent></Tooltip>
                                <div>
                                    <h1 className="text-3xl font-bold text-gray-900">Day Details</h1>
                                    <p className="mt-1 text-sm text-gray-600">View available day information</p>
                                </div>
                            </div>
                        </div>

                        <div className="border rounded-lg bg-white overflow-hidden">
                            <div className="bg-gradient-to-r from-gray-50 to-gray-100 p-6 border-b">
                                <div className="flex items-center gap-3">
                                    <h2 className="text-2xl font-bold text-gray-900">{day.dayName}</h2>
                                    <Badge variant="default" className={day.isActive ? "bg-green-600" : "bg-gray-500"}>{day.isActive ? "Active" : "Inactive"}</Badge>
                                </div>
                            </div>
                            <div className="p-6">
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-x-6 gap-y-5">
                                    <div className="space-y-1.5">
                                        <div className="flex items-center gap-2 text-sm font-medium text-gray-500"><Calendar className="h-4 w-4" /><span>Day Name</span></div>
                                        <p className="text-sm text-gray-900 font-medium">{day.dayName}</p>
                                    </div>
                                    <div className="space-y-1.5">
                                        <div className="flex items-center gap-2 text-sm font-medium text-gray-500"><Hash className="h-4 w-4" /><span>Sort Order</span></div>
                                        <p className="text-sm text-gray-900 font-medium">{day.sortOrder}</p>
                                    </div>
                                    <div className="space-y-1.5">
                                        <div className="flex items-center gap-2 text-sm font-medium text-gray-500"><FileText className="h-4 w-4" /><span>Status</span></div>
                                        <p className="text-sm text-gray-900 font-medium">{day.isActive ? "Active" : "Inactive"}</p>
                                    </div>
                                    <div className="space-y-1.5">
                                        <div className="flex items-center gap-2 text-sm font-medium text-gray-500"><Calendar className="h-4 w-4" /><span>Created At</span></div>
                                        <p className="text-sm text-gray-900">{formatDateTime(day.createdAt)}</p>
                                        <p className="text-xs text-gray-500">by {day.createdByName}</p>
                                    </div>
                                    <div className="space-y-1.5 md:col-span-2">
                                        <div className="flex items-center gap-2 text-sm font-medium text-gray-700"><Clock className="h-4 w-4" /><span>Last Updated</span></div>
                                        <div className="bg-gray-50 border border-gray-200 rounded-lg p-2.5">
                                            <p className="text-sm text-gray-900 font-semibold">{formatDateTime(day.updatedAt)}</p>
                                            <p className="text-xs text-gray-600">by {day.updatedByName}</p>
                                        </div>
                                    </div>
                                </div>

                                <Separator className="my-6" />

                                <div className="flex items-center justify-end gap-3">
                                    <Tooltip><TooltipTrigger asChild><Button variant="outline" onClick={goEdit}><Pencil className="h-4 w-4 mr-2" />Edit Day</Button></TooltipTrigger><TooltipContent>Edit this day</TooltipContent></Tooltip>
                                    <Tooltip><TooltipTrigger asChild><Button variant="outline" onClick={() => setDeleteModal(true)} className="text-red-600 hover:text-red-700 hover:bg-red-50"><Trash2 className="h-4 w-4 mr-2" />Archive Day</Button></TooltipTrigger><TooltipContent>Archive this day</TooltipContent></Tooltip>
                                </div>
                            </div>
                        </div>
                    </div>
                ) : (
                    <Alert><AlertCircle className="h-4 w-4" /><AlertDescription>Day not found.</AlertDescription></Alert>
                )}
            </div>

            <AlertDialog open={deleteModal} onOpenChange={setDeleteModal}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Confirm Archive</AlertDialogTitle>
                        <AlertDialogDescription>Are you sure you want to archive the day <span className="font-semibold">{day?.dayName}</span>? This action will move it to the archive.</AlertDialogDescription>
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
