import { useEffect, useState } from "react";
import { buildingService } from "../../services/buildingService";
import { locationService } from "../../services/locationService";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import AppLayout from "../../layouts/AppLayout";
import { generatePersonalInfoPDF } from "../../utils/pdfExport";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { DetailViewSkeleton } from "../../utils/skeletonLoaders";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Pencil, Trash2, Calendar, Clock, Building2, MapPin, User, AlertCircle, Tag, FileText } from "lucide-react";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

export default function BuildingView() {
    const navigate = useNavigate();
    const { id } = useParams();
    const location = useLocation();

    const [building, setBuilding] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [deleteModal, setDeleteModal] = useState(false);
    const [addressText, setAddressText] = useState("");
    const [resolvingAddress, setResolvingAddress] = useState(false);

    const goBack = () => {
        if (location.state?.from === "archive") {
            navigate("/buildings/archive");
        } else {
            navigate("/buildings");
        }
    };
    const goEdit = () => navigate(`/buildings/${id}/edit`);

    const handlePrintPDF = () => {
        if (!building) return;

        generatePersonalInfoPDF({
            title: "Building Details",
            data: {
                ...building,
                address: addressText, // Use resolved address for PDF
            },
            fields: [
                { label: "Building Name", key: "name" },
                { label: "Status", key: "isActive", format: (v) => v ? "Active" : "Inactive" },
                { label: "Managed By", key: "managedBy" },
                { label: "Address", key: "address" },
                { label: "Created At", key: "createdAt" },
                { label: "Created By", key: "createdBy" },
                { label: "Last Updated", key: "updatedAt" },
                { label: "Updated By", key: "updatedBy" },
            ],
            companyName: "Learning Flow Management System",
            headerInfo: { name: building.name },
        });
    };

    const loadBuilding = async () => {
        setLoading(true);
        setError("");

        try {
            const response = await buildingService.getById(id);
            const data = response.data;
            if (!data) throw new Error("Building not found");

            setBuilding({
                id: data.id,
                name: data.name,
                isActive: data.isActive,
                managedBy: data.managerName || "—",
                address: data.address, // Store full address object for resolution
                createdAt: data.createdAt,
                updatedAt: data.updatedAt,
                createdBy: data.createdByName || "System",
                updatedBy: data.updatedByName || "System",
            });
        } catch (err) {
            setError(err.message || "Failed to load building");
        } finally {
            setLoading(false);
        }
    };

    const resolveAddress = async (addr) => {
        if (!addr) {
            setAddressText("—");
            return;
        }

        setResolvingAddress(true);
        try {
            let region = addr.region;
            let province = addr.province;
            let city = addr.cityMunicipality;
            let street = addr.streetBarangay;
            let postal = addr.postal;

            // Fetch Region Name from backend LocationService
            if (region) {
                try {
                    const regionsRes = await locationService.getRegions();
                    const foundRegion = regionsRes.data.find(r => r.code === region);
                    if (foundRegion) region = foundRegion.name;
                } catch (err) {
                    console.error("Failed to fetch regions:", err);
                }
            }

            // Fetch Province Name
            if (province && addr.region) {
                try {
                    const provincesRes = await locationService.getProvinces(addr.region);
                    const foundProvince = provincesRes.data.find(p => p.code === province);
                    if (foundProvince) province = foundProvince.name;
                } catch (err) {
                    console.error("Failed to fetch provinces:", err);
                }
            }

            // Fetch City Name
            if (city && addr.province) {
                try {
                    const citiesRes = await locationService.getCities(addr.province);
                    const foundCity = citiesRes.data.find(c => c.code === city);
                    if (foundCity) city = foundCity.name;
                } catch (err) {
                    console.error("Failed to fetch cities:", err);
                }
            }

            const fullAddress = [street, city, province, region, postal]
                .filter(Boolean)
                .join(", ");

            setAddressText(fullAddress || "—");
        } catch (err) {
            console.error("Failed to resolve address location names", err);
            const fallbackAddress = [addr.streetBarangay, addr.cityMunicipality, addr.province, addr.region, addr.postal]
                .filter(Boolean)
                .join(", ");
            setAddressText(fallbackAddress || "—");
        } finally {
            setResolvingAddress(false);
        }
    };

    useEffect(() => {
        loadBuilding();
    }, [id]);

    useEffect(() => {
        if (building && building.address) {
            resolveAddress(building.address);
        }
    }, [building]);

    const confirmDelete = async () => {
        try {
            await buildingService.delete(id);
            setDeleteModal(false);
            navigate("/buildings", {
                state: {
                    alert: {
                        type: "success",
                        message: `Building "${building.name}" archived successfully!`
                    }
                }
            });
        } catch (err) {
            setError(err.message || "Failed to archive building");
            setDeleteModal(false);
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
        <AppLayout title="View Building" onPrint={building ? handlePrintPDF : undefined}>
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
                ) : building ? (
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
                                    <TooltipContent>Back to buildings</TooltipContent>
                                </Tooltip>
                                <div>
                                    <h1 className="text-3xl font-bold text-gray-900">Building Details</h1>
                                    <p className="mt-1 text-sm text-gray-600">
                                        View detailed information about this building
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
                                            <h2 className="text-2xl font-bold text-gray-900">{building.name}</h2>
                                            <Badge variant="default" className={building.isActive ? "bg-green-600" : "bg-gray-500"}>
                                                {building.isActive ? "Active" : "Inactive"}
                                            </Badge>
                                        </div>
                                        <p className="text-gray-700 max-w-2xl">{resolvingAddress ? "Loading address..." : addressText}</p>
                                    </div>
                                </div>
                            </div>

                            {/* Details Section */}
                            <div className="p-6">
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-x-6 gap-y-5">
                                    {/* Building Name */}
                                    <div className="space-y-1.5">
                                        <div className="flex items-center gap-2 text-sm font-medium text-gray-500">
                                            <Tag className="h-4 w-4" />
                                            <span>Building Name</span>
                                        </div>
                                        <p className="text-sm text-gray-900 font-medium">{building.name}</p>
                                    </div>

                                    {/* Managed By */}
                                    <div className="space-y-1.5">
                                        <div className="flex items-center gap-2 text-sm font-medium text-gray-500">
                                            <User className="h-4 w-4" />
                                            <span>Managed By</span>
                                        </div>
                                        <p className="text-sm text-gray-900 font-medium">{building.managedBy}</p>
                                    </div>

                                    {/* Status */}
                                    <div className="space-y-1.5">
                                        <div className="flex items-center gap-2 text-sm font-medium text-gray-500">
                                            <FileText className="h-4 w-4" />
                                            <span>Status</span>
                                        </div>
                                        <p className="text-sm text-gray-900 font-medium">{building.isActive ? "Active" : "Inactive"}</p>
                                    </div>

                                    {/* Address */}
                                    <div className="space-y-1.5 md:col-span-3">
                                        <div className="flex items-center gap-2 text-sm font-medium text-gray-500">
                                            <FileText className="h-4 w-4" />
                                            <span>Address</span>
                                        </div>
                                        <p className="text-sm text-gray-900">{resolvingAddress ? "Loading address..." : (addressText || "No address provided.")}</p>
                                    </div>

                                    {/* Created At */}
                                    <div className="space-y-1.5">
                                        <div className="flex items-center gap-2 text-sm font-medium text-gray-500">
                                            <Calendar className="h-4 w-4" />
                                            <span>Created At</span>
                                        </div>
                                        <p className="text-sm text-gray-900">{formatDateTime(building.createdAt)}</p>
                                        <p className="text-xs text-gray-500">by {building.createdBy}</p>
                                    </div>

                                    {/* Last Updated - Highlighted */}
                                    <div className="space-y-1.5 md:col-span-2">
                                        <div className="flex items-center gap-2 text-sm font-medium text-gray-700">
                                            <Clock className="h-4 w-4" />
                                            <span>Last Updated</span>
                                        </div>
                                        <div className="bg-gray-50 border border-gray-200 rounded-lg p-2.5">
                                            <p className="text-sm text-gray-900 font-semibold">
                                                {formatDateTime(building.updatedAt)}
                                            </p>
                                            <p className="text-xs text-gray-600">by {building.updatedBy}</p>
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
                                                Edit Building
                                            </Button>
                                        </TooltipTrigger>
                                        <TooltipContent>Edit this building</TooltipContent>
                                    </Tooltip>
                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <Button
                                                variant="outline"
                                                onClick={() => setDeleteModal(true)}
                                                className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                            >
                                                <Trash2 className="h-4 w-4 mr-2" />
                                                Archive Building
                                            </Button>
                                        </TooltipTrigger>
                                        <TooltipContent>Archive this building</TooltipContent>
                                    </Tooltip>
                                </div>
                            </div>
                        </div>
                    </div>
                ) : (
                    <Alert>
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription>Building not found.</AlertDescription>
                    </Alert>
                )}
            </div>

            {/* Delete Confirmation */}
            <AlertDialog open={deleteModal} onOpenChange={setDeleteModal}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Confirm Archive</AlertDialogTitle>
                        <AlertDialogDescription>
                            Are you sure you want to archive the building{" "}
                            <span className="font-semibold">{building?.name}</span>? This action will move it to
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
