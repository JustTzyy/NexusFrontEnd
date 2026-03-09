import { useEffect, useState } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import { roomService } from "../../services/roomService";
import AppLayout from "../../layouts/AppLayout";
import { generatePersonalInfoPDF } from "../../utils/pdfExport";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { DetailViewSkeleton } from "../../utils/skeletonLoaders";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Pencil, Trash2, Calendar, Clock, Tag, FileText, AlertCircle, Building2, Users } from "lucide-react";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

export default function RoomView() {
    const navigate = useNavigate();
    const { id } = useParams();
    const location = useLocation();

    const [room, setRoom] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [deleteModal, setDeleteModal] = useState(false);

    const goBack = () => {
        if (location.state?.from === "archive") {
            navigate("/rooms/archive");
        } else {
            navigate("/rooms");
        }
    };
    const goEdit = () => navigate(`/rooms/${id}/edit`);

    const handlePrintPDF = () => {
        if (!room) return;

        generatePersonalInfoPDF({
            title: "Room Details",
            data: room,
            fields: [
                { label: "Room Name", key: "name" },
                { label: "Building", key: "buildingName" },
                { label: "Capacity", key: "capacity" },
                { label: "Status", key: "isActive", format: (v) => v ? "Active" : "Inactive" },
                { label: "Created At", key: "createdAt" },
                { label: "Created By", key: "createdBy" },
                { label: "Last Updated", key: "updatedAt" },
                { label: "Updated By", key: "updatedBy" },
            ],
            companyName: "Learning Flow Management System",
            headerInfo: { name: room.name },
        });
    };

    const loadRoom = async () => {
        setLoading(true);
        setError("");

        try {
            const response = await roomService.getById(id);
            const data = response.data;
            if (!data) throw new Error("Room not found");

            setRoom({
                id: data.id,
                name: data.name,
                buildingName: data.buildingName || "—",
                capacity: data.capacity,
                isActive: data.isActive,
                createdAt: data.createdAt,
                updatedAt: data.updatedAt,
                createdBy: data.createdByName || "System",
                updatedBy: data.updatedByName || "System",
            });
        } catch (err) {
            setError(err.response?.data?.message || err.message || "Failed to load room");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadRoom();
    }, [id]);

    const confirmDelete = async () => {
        setDeleteModal(false);
        try {
            await roomService.delete(id);
            navigate("/rooms", {
                state: {
                    alert: {
                        type: "success",
                        message: `Room "${room.name}" archived successfully!`
                    }
                }
            });
        } catch (err) {
            setError(err.response?.data?.message || "Failed to archive room");
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
        <AppLayout title="View Room" onPrint={room ? handlePrintPDF : undefined}>
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
                ) : room ? (
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
                                    <TooltipContent>Back to rooms</TooltipContent>
                                </Tooltip>
                                <div>
                                    <h1 className="text-3xl font-bold text-gray-900">Room Details</h1>
                                    <p className="mt-1 text-sm text-gray-600">
                                        View detailed information about this room
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
                                            <h2 className="text-2xl font-bold text-gray-900">{room.name}</h2>
                                            <Badge variant="default" className={room.isActive ? "bg-green-600" : "bg-gray-500"}>
                                                {room.isActive ? "Active" : "Inactive"}
                                            </Badge>
                                        </div>
                                        <p className="text-gray-700 flex items-center gap-2">
                                            <Building2 className="h-4 w-4 text-gray-400" />
                                            Located in <span className="font-semibold">{room.buildingName}</span>
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Details Section */}
                            <div className="p-6">
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-x-6 gap-y-5">
                                    {/* Room Name */}
                                    <div className="space-y-1.5">
                                        <div className="flex items-center gap-2 text-sm font-medium text-gray-500">
                                            <Tag className="h-4 w-4" />
                                            <span>Room Name</span>
                                        </div>
                                        <p className="text-sm text-gray-900 font-medium">{room.name}</p>
                                    </div>

                                    {/* Building */}
                                    <div className="space-y-1.5">
                                        <div className="flex items-center gap-2 text-sm font-medium text-gray-500">
                                            <Building2 className="h-4 w-4" />
                                            <span>Building</span>
                                        </div>
                                        <p className="text-sm text-gray-900 font-medium">{room.buildingName}</p>
                                    </div>

                                    {/* Capacity */}
                                    <div className="space-y-1.5">
                                        <div className="flex items-center gap-2 text-sm font-medium text-gray-500">
                                            <Users className="h-4 w-4" />
                                            <span>Seating Capacity</span>
                                        </div>
                                        <p className="text-sm text-gray-900 font-medium">{room.capacity} Persons</p>
                                    </div>

                                    {/* Status */}
                                    <div className="space-y-1.5">
                                        <div className="flex items-center gap-2 text-sm font-medium text-gray-500">
                                            <FileText className="h-4 w-4" />
                                            <span>Status</span>
                                        </div>
                                        <p className="text-sm text-gray-900 font-medium">{room.isActive ? "Active" : "Inactive"}</p>
                                    </div>

                                    {/* Created At */}
                                    <div className="space-y-1.5">
                                        <div className="flex items-center gap-2 text-sm font-medium text-gray-500">
                                            <Calendar className="h-4 w-4" />
                                            <span>Created At</span>
                                        </div>
                                        <p className="text-sm text-gray-900">{formatDateTime(room.createdAt)}</p>
                                        <p className="text-xs text-gray-500">by {room.createdBy}</p>
                                    </div>

                                    {/* Last Updated */}
                                    <div className="space-y-1.5 md:col-span-2">
                                        <div className="flex items-center gap-2 text-sm font-medium text-gray-700">
                                            <Clock className="h-4 w-4" />
                                            <span>Last Updated</span>
                                        </div>
                                        <div className="bg-gray-50 border border-gray-200 rounded-lg p-2.5">
                                            <p className="text-sm text-gray-900 font-semibold">
                                                {formatDateTime(room.updatedAt)}
                                            </p>
                                            <p className="text-xs text-gray-600">by {room.updatedBy}</p>
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
                                                Edit Room
                                            </Button>
                                        </TooltipTrigger>
                                        <TooltipContent>Edit this room</TooltipContent>
                                    </Tooltip>
                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <Button
                                                variant="outline"
                                                onClick={() => setDeleteModal(true)}
                                                className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                            >
                                                <Trash2 className="h-4 w-4 mr-2" />
                                                Archive Room
                                            </Button>
                                        </TooltipTrigger>
                                        <TooltipContent>Archive this room</TooltipContent>
                                    </Tooltip>
                                </div>
                            </div>
                        </div>
                    </div>
                ) : (
                    <Alert>
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription>Room not found.</AlertDescription>
                    </Alert>
                )}
            </div>

            {/* Delete Confirmation */}
            <AlertDialog open={deleteModal} onOpenChange={setDeleteModal}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Confirm Archive</AlertDialogTitle>
                        <AlertDialogDescription>
                            Are you sure you want to archive the room{" "}
                            <span className="font-semibold">{room?.name}</span>? This action will move it to
                            the archive.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={confirmDelete}
                            className="bg-red-600 hover:bg-red-700"
                        >
                            Archive
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </AppLayout>
    );
}
