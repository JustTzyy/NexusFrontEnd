import { useEffect, useState } from "react";
import AppLayout from "../../layouts/AppLayout";
import { buildingService } from "../../services/buildingService";
import { locationService } from "../../services/locationService";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { DetailViewSkeleton } from "../../utils/skeletonLoaders";
import {
    Building2, MapPin, User, Tag, Globe, FileText,
    Calendar, Clock, AlertCircle, CheckCircle2,
} from "lucide-react";

function NoBuildingState() {
    return (
        <div className="flex flex-col items-center justify-center py-24 text-center space-y-4">
            <div className="flex items-center justify-center w-16 h-16 rounded-2xl bg-gray-100">
                <Building2 className="h-8 w-8 text-gray-400" />
            </div>
            <div>
                <p className="text-base font-semibold text-gray-900">No Building Assigned</p>
                <p className="text-sm text-gray-500 mt-1">
                    You have not been assigned to manage any building yet.
                    <br />Contact an administrator to get started.
                </p>
            </div>
        </div>
    );
}

const formatDateTime = (dateString) => {
    if (!dateString) return "—";
    return new Date(dateString).toLocaleString("en-US", {
        year: "numeric", month: "short", day: "numeric",
        hour: "2-digit", minute: "2-digit",
    });
};

export default function MyBuilding() {
    const [building, setBuilding] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [noBuilding, setNoBuilding] = useState(false);
    const [resolvingAddress, setResolvingAddress] = useState(false);
    const [resolvedAddress, setResolvedAddress] = useState({
        city: "",
        province: "",
        region: "",
    });

    const loadBuilding = async () => {
        setLoading(true);
        setError("");
        try {
            const res = await buildingService.getMy();
            const data = res.data ?? null;
            if (!data) {
                setNoBuilding(true);
                return;
            }
            setBuilding(data);
        } catch (err) {
            setError(err?.message || "Failed to load building information.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadBuilding();
    }, []);

    useEffect(() => {
        const resolveAddress = async () => {
            if (!building) return;

            const address = building.address || {
                region: building.region || "",
                province: building.province || "",
                cityMunicipality: building.cityMunicipality || "",
            };

            let region = address.region || "";
            let province = address.province || "";
            let city = address.cityMunicipality || "";

            setResolvingAddress(true);
            try {
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
                if (province && address.region) {
                    try {
                        const provincesRes = await locationService.getProvinces(address.region);
                        const foundProvince = provincesRes.data.find(p => p.code === province);
                        if (foundProvince) province = foundProvince.name;
                    } catch (err) {
                        console.error("Failed to fetch provinces:", err);
                    }
                }

                // Fetch City Name
                if (city && address.province) {
                    try {
                        const citiesRes = await locationService.getCities(address.province);
                        const foundCity = citiesRes.data.find(c => c.code === city);
                        if (foundCity) city = foundCity.name;
                    } catch (err) {
                        console.error("Failed to fetch cities:", err);
                    }
                }

                setResolvedAddress({ city, province, region });
            } finally {
                setResolvingAddress(false);
            }
        };

        resolveAddress();
    }, [building]);

    if (noBuilding && !loading) {
        return (
            <AppLayout title="My Building">
                <NoBuildingState />
            </AppLayout>
        );
    }

    return (
        <AppLayout title="My Building">
            <div className="space-y-6">
                {error && (
                    <Alert variant="destructive">
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription>{error}</AlertDescription>
                    </Alert>
                )}

                {loading ? (
                    <DetailViewSkeleton fields={8} />
                ) : building ? (
                    <div className="space-y-6">
                        {/* Page header */}
                        <div>
                            <h1 className="text-3xl font-bold text-gray-900">My Building</h1>
                            <p className="mt-1 text-sm text-gray-600">
                                Your assigned building profile and details
                            </p>
                        </div>

                        {/* Detail card */}
                        <div className="border rounded-lg bg-white overflow-hidden">
                            {/* Gradient header */}
                            <div className="bg-gradient-to-r from-gray-50 to-gray-100 p-6 border-b">
                                <div className="flex items-start gap-4">
                                    <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-gray-900 flex-shrink-0">
                                        <Building2 className="h-6 w-6 text-white" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-3 flex-wrap">
                                            <h2 className="text-2xl font-bold text-gray-900 truncate">{building.name}</h2>
                                            {building.isActive ? (
                                                <Badge className="bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200 font-medium">
                                                    <CheckCircle2 className="h-3 w-3 mr-1" /> Active
                                                </Badge>
                                            ) : (
                                                <Badge className="bg-gray-100 text-gray-500 ring-1 ring-gray-200 font-medium">
                                                    Inactive
                                                </Badge>
                                            )}
                                        </div>
                                        {building.addressLine && (
                                            <p className="text-sm text-gray-500 mt-1 flex items-center gap-1.5">
                                                <MapPin className="h-3.5 w-3.5 flex-shrink-0" />
                                                {building.addressLine}
                                            </p>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Details grid */}
                            <div className="p-6">
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-x-6 gap-y-5">
                                    {/* Building name */}
                                    <div className="space-y-1.5">
                                        <div className="flex items-center gap-2 text-sm font-medium text-gray-500">
                                            <Tag className="h-4 w-4" /><span>Building Name</span>
                                        </div>
                                        <p className="text-sm text-gray-900 font-medium">{building.name}</p>
                                    </div>

                                    {/* Status */}
                                    <div className="space-y-1.5">
                                        <div className="flex items-center gap-2 text-sm font-medium text-gray-500">
                                            <FileText className="h-4 w-4" /><span>Status</span>
                                        </div>
                                        <p className="text-sm text-gray-900 font-medium">{building.isActive ? "Active" : "Inactive"}</p>
                                    </div>

                                    {/* Manager */}
                                    <div className="space-y-1.5">
                                        <div className="flex items-center gap-2 text-sm font-medium text-gray-500">
                                            <User className="h-4 w-4" /><span>Building Manager</span>
                                        </div>
                                        <p className="text-sm text-gray-900 font-medium">{building.managerName || "—"}</p>
                                    </div>

                                    {/* Address line */}
                                    <div className="space-y-1.5">
                                        <div className="flex items-center gap-2 text-sm font-medium text-gray-500">
                                            <MapPin className="h-4 w-4" /><span>Address</span>
                                        </div>
                                        <p className="text-sm text-gray-900 font-medium">{building.addressLine || "—"}</p>
                                    </div>

                                    {/* City */}
                                    <div className="space-y-1.5">
                                        <div className="flex items-center gap-2 text-sm font-medium text-gray-500">
                                            <Globe className="h-4 w-4" /><span>City / Municipality</span>
                                        </div>
                                        <p className="text-sm text-gray-900 font-medium">{resolvingAddress ? "Loading..." : (resolvedAddress.city ? resolvedAddress.city : "—")}</p>
                                    </div>

                                    {/* Province */}
                                    <div className="space-y-1.5">
                                        <div className="flex items-center gap-2 text-sm font-medium text-gray-500">
                                            <Globe className="h-4 w-4" /><span>Province</span>
                                        </div>
                                        <p className="text-sm text-gray-900 font-medium">{resolvingAddress ? "Loading..." : (resolvedAddress.province ? resolvedAddress.province : "—")}</p>
                                    </div>

                                    {/* Region */}
                                    <div className="space-y-1.5">
                                        <div className="flex items-center gap-2 text-sm font-medium text-gray-500">
                                            <Globe className="h-4 w-4" /><span>Region</span>
                                        </div>
                                        <p className="text-sm text-gray-900 font-medium">{resolvingAddress ? "Loading..." : (resolvedAddress.region ? resolvedAddress.region : "—")}</p>
                                    </div>

                                    {/* Created at */}
                                    <div className="space-y-1.5">
                                        <div className="flex items-center gap-2 text-sm font-medium text-gray-500">
                                            <Calendar className="h-4 w-4" /><span>Created At</span>
                                        </div>
                                        <p className="text-sm text-gray-900">{formatDateTime(building.createdAt)}</p>
                                    </div>

                                    {/* Last updated */}
                                    <div className="space-y-1.5">
                                        <div className="flex items-center gap-2 text-sm font-medium text-gray-700">
                                            <Clock className="h-4 w-4" /><span>Last Updated</span>
                                        </div>
                                        <div className="bg-gray-50 border border-gray-200 rounded-lg p-2.5">
                                            <p className="text-sm text-gray-900 font-semibold">{formatDateTime(building.updatedAt)}</p>
                                        </div>
                                    </div>
                                </div>

                                <Separator className="my-6" />

                                <p className="text-xs text-gray-400 text-center">
                                    Building details are managed by an administrator. Contact admin to request changes.
                                </p>
                            </div>
                        </div>
                    </div>
                ) : (
                    !error && (
                        <Alert>
                            <AlertCircle className="h-4 w-4" />
                            <AlertDescription>Building not found.</AlertDescription>
                        </Alert>
                    )
                )}
            </div>
        </AppLayout>
    );
}
