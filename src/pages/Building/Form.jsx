import { useEffect, useState } from "react";
import { buildingService } from "../../services/buildingService";
import { useNavigate, useParams } from "react-router-dom";
import AppLayout from "../../layouts/AppLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { locationService } from "@/services/locationService";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { FormSkeleton } from "../../utils/skeletonLoaders";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    Tooltip,
    TooltipContent,
    TooltipTrigger,
} from "@/components/ui/tooltip";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from "@/components/ui/command";
import { cn } from "@/lib/utils";
import { ArrowLeft, Save, AlertCircle, RotateCcw, Check, ChevronsUpDown } from "lucide-react";

export default function BuildingForm() {
    const navigate = useNavigate();
    const { id } = useParams();
    const isEditMode = Boolean(id);

    /* ------------------------------ State ------------------------------ */
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState("");

    // Users for managedBy suggestions
    const [users, setUsers] = useState([]);
    const [loadingUsers, setLoadingUsers] = useState(false);
    const [managedByOpen, setManagedByOpen] = useState(false);

    // Form data
    const initialFormData = {
        name: "",
        managedBy: "",
        isActive: "active",
        // Address
        street: "",
        region: "",
        province: "",
        city: "",
        postalCode: "",
    };

    const [formData, setFormData] = useState(initialFormData);

    // Validation errors
    const [errors, setErrors] = useState({
        name: "",
        managedBy: "",
        region: "",
        province: "",
        city: "",
    });

    // Save confirmation modal
    const [saveModal, setSaveModal] = useState(false);

    // Philippines location state
    const [regions, setRegions] = useState([]);
    const [provinces, setProvinces] = useState([]);
    const [cities, setCities] = useState([]);
    const [loadingRegions, setLoadingRegions] = useState(false);
    const [loadingProvinces, setLoadingProvinces] = useState(false);
    const [loadingCities, setLoadingCities] = useState(false);

    /* ------------------------------ Effects ------------------------------ */
    useEffect(() => {
        loadRegions();
        loadUsers();
    }, []);

    // Load provinces when region changes
    useEffect(() => {
        if (formData.region) {
            loadProvinces(formData.region);
        } else {
            setProvinces([]);
            setCities([]);
            if (formData.province || formData.city) {
                setFormData(prev => ({ ...prev, province: "", city: "" }));
            }
        }
    }, [formData.region]);

    // Load cities when province changes
    useEffect(() => {
        if (formData.province) {
            loadCities(formData.province);
        } else {
            setCities([]);
            if (formData.city) {
                setFormData(prev => ({ ...prev, city: "" }));
            }
        }
    }, [formData.province]);

    useEffect(() => {
        if (isEditMode) {
            loadBuilding();
        } else {
            const timer = setTimeout(() => setLoading(false), 500);
            return () => clearTimeout(timer);
        }
    }, [id]);

    /* ------------------------------ Loaders ------------------------------ */
    const loadUsers = async () => {
        setLoadingUsers(true);
        try {
            const response = await buildingService.getAvailableManagers(isEditMode ? id : null);
            const data = response.data?.data || response.data || [];
            setUsers(data.map(u => ({ id: u.id, name: u.fullName })));
        } catch (err) {
            console.error("Failed to load available managers:", err);
        } finally {
            setLoadingUsers(false);
        }
    };

    const loadRegions = async () => {
        setLoadingRegions(true);
        try {
            const res = await locationService.getRegions();
            setRegions(res.data || []);
        } catch (err) {
            console.error("Failed to load regions:", err);
        } finally {
            setLoadingRegions(false);
        }
    };

    const loadProvinces = async (regionCode) => {
        setLoadingProvinces(true);
        try {
            const res = await locationService.getProvinces(regionCode);
            setProvinces(res.data || []);
        } catch (err) {
            console.error("Failed to load provinces:", err);
        } finally {
            setLoadingProvinces(false);
        }
    };

    const loadCities = async (provinceCode) => {
        setLoadingCities(true);
        try {
            const res = await locationService.getCities(provinceCode);
            setCities(res.data || []);
        } catch (err) {
            console.error("Failed to load cities:", err);
        } finally {
            setLoadingCities(false);
        }
    };

    /* ------------------------------ API ------------------------------ */
    const loadBuilding = async () => {
        setLoading(true);
        setError("");

        try {
            const response = await buildingService.getById(id);
            const data = response.data;
            if (!data) throw new Error("Building not found");

            setFormData({
                name: data.name || "",
                managedBy: data.managerName || "",
                managedById: data.managedBy || null,
                isActive: data.isActive ? "active" : "inactive",
                street: data.address?.streetBarangay || "",
                region: data.address?.region || "",
                province: data.address?.province || "",
                city: data.address?.cityMunicipality || "",
                postalCode: data.address?.postal || "",
            });
        } catch (err) {
            setError(err.response?.data?.message || err.message || "Failed to load building");
        } finally {
            setLoading(false);
        }
    };

    /* ------------------------------ Handlers ------------------------------ */
    const goBack = () => navigate("/buildings");

    const handleClear = () => {
        setFormData(initialFormData);
        setErrors({ name: "", managedBy: "", region: "", province: "", city: "" });
    };

    const handleInputChange = (field, value) => {
        setFormData((prev) => ({ ...prev, [field]: value }));
        if (errors[field]) {
            setErrors((prev) => ({ ...prev, [field]: "" }));
        }
    };

    const validateForm = () => {
        const newErrors = { name: "", managedBy: "", region: "", province: "", city: "" };
        let isValid = true;

        if (!formData.name.trim()) {
            newErrors.name = "Building name is required";
            isValid = false;
        }

        if (!formData.managedBy.trim()) {
            newErrors.managedBy = "Managed by is required";
            isValid = false;
        } else {
            // Check if managedBy exists in the users list
            const userExists = users.some(u => u.name.toLowerCase() === formData.managedBy.toLowerCase());
            if (!userExists) {
                newErrors.managedBy = "Please select a registered user from the list";
                isValid = false;
            }
        }

        if (!formData.region) {
            newErrors.region = "Region is required";
            isValid = false;
        }

        if (!formData.province) {
            newErrors.province = "Province is required";
            isValid = false;
        }

        if (!formData.city) {
            newErrors.city = "City/Municipality is required";
            isValid = false;
        }

        setErrors(newErrors);
        return isValid;
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!validateForm()) return;
        setSaveModal(true);
    };

    const confirmSave = async () => {
        setSaveModal(false);
        setSubmitting(true);
        setError("");

        try {
            // Get selected user ID from the users list
            const selectedUser = users.find(u => u.name.toLowerCase() === formData.managedBy.toLowerCase());

            const payload = {
                name: formData.name,
                isActive: formData.isActive === "active",
                managedBy: selectedUser?.id || null,
                address: {
                    street: formData.street,
                    region: formData.region,
                    province: formData.province,
                    city: formData.city,
                    postalCode: formData.postalCode
                }
            };

            if (isEditMode) {
                await buildingService.update(id, payload);
            } else {
                await buildingService.create(payload);
            }

            navigate("/buildings", {
                state: {
                    alert: {
                        type: "success",
                        message: isEditMode
                            ? `Building "${formData.name}" updated successfully!`
                            : `Building "${formData.name}" created successfully!`,
                    },
                },
            });
        } catch (err) {
            setError(err.message || "Failed to save building");
            setSubmitting(false);
        }
    };

    return (
        <AppLayout title={isEditMode ? "Edit Building" : "Create Building"}>
            <div className="space-y-6">
                {error && (
                    <Alert variant="destructive">
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription>{error}</AlertDescription>
                    </Alert>
                )}

                {loading ? (
                    <FormSkeleton fields={8} showTabs={true} />
                ) : (
                    <>
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
                                <h1 className="text-3xl font-bold text-gray-900">
                                    {isEditMode ? "Edit Building" : "Create Building"}
                                </h1>
                                <p className="mt-1 text-sm text-gray-600">
                                    {isEditMode
                                        ? "Update the building details and location"
                                        : "Add a new building to the system"}
                                </p>
                            </div>
                        </div>

                        <Separator />

                        <div className="max-w-4xl mx-auto">
                            <form onSubmit={handleSubmit} className="space-y-6 pt-2 animate-in fade-in slide-in-from-bottom-4 duration-500">
                                <Tabs defaultValue="general" className="w-full">
                                    <TabsList className="grid w-full grid-cols-2">
                                        <TabsTrigger value="general">General Information</TabsTrigger>
                                        <TabsTrigger value="address">Address</TabsTrigger>
                                    </TabsList>

                                    <TabsContent value="general" className="space-y-4 mt-6">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            <div className="space-y-2">
                                                <Label htmlFor="name" className="text-sm font-medium text-gray-900">
                                                    Building Name <span className="text-red-500">*</span>
                                                </Label>
                                                <Input
                                                    id="name"
                                                    type="text"
                                                    placeholder="e.g. Main Building"
                                                    value={formData.name}
                                                    onChange={(e) => handleInputChange("name", e.target.value)}
                                                    className={`h-10 ${errors.name ? "border-red-500 focus-visible:ring-red-500" : ""}`}
                                                    disabled={submitting}
                                                />
                                                {errors.name ? (
                                                    <p className="text-xs text-red-500">{errors.name}</p>
                                                ) : (
                                                    <p className="text-xs text-gray-500">The primary name of the building</p>
                                                )}
                                            </div>

                                            <div className="space-y-2 flex flex-col">
                                                <Label htmlFor="managedBy" className="text-sm font-medium text-gray-900 mb-2">
                                                    Managed By <span className="text-red-500">*</span>
                                                </Label>
                                                <Popover open={managedByOpen} onOpenChange={setManagedByOpen}>
                                                    <PopoverTrigger asChild>
                                                        <Button
                                                            variant="outline"
                                                            role="combobox"
                                                            aria-expanded={managedByOpen}
                                                            className={cn(
                                                                "h-10 w-full justify-between font-normal",
                                                                !formData.managedBy && "text-muted-foreground",
                                                                errors.managedBy && "border-red-500"
                                                            )}
                                                            disabled={submitting}
                                                        >
                                                            {formData.managedBy || "Select a user..."}
                                                            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                                        </Button>
                                                    </PopoverTrigger>
                                                    <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
                                                        <Command>
                                                            <CommandInput placeholder="Search users..." className="h-9" />
                                                            <CommandList>
                                                                <CommandEmpty>No user found.</CommandEmpty>
                                                                <CommandGroup>
                                                                    {users.map((user) => (
                                                                        <CommandItem
                                                                            key={user.id}
                                                                            value={user.name}
                                                                            onSelect={(currentValue) => {
                                                                                handleInputChange("managedBy", currentValue);
                                                                                setManagedByOpen(false);
                                                                            }}
                                                                        >
                                                                            <Check
                                                                                className={cn(
                                                                                    "mr-2 h-4 w-4",
                                                                                    formData.managedBy.toLowerCase() === user.name.toLowerCase() ? "opacity-100" : "opacity-0"
                                                                                )}
                                                                            />
                                                                            {user.name}
                                                                        </CommandItem>
                                                                    ))}
                                                                </CommandGroup>
                                                            </CommandList>
                                                        </Command>
                                                    </PopoverContent>
                                                </Popover>
                                                {errors.managedBy ? (
                                                    <p className="text-xs text-red-500 mt-2">{errors.managedBy}</p>
                                                ) : (
                                                    <p className="text-xs text-gray-500 mt-2">Person in charge of this building</p>
                                                )}
                                            </div>

                                            <div className="space-y-2">
                                                <Label htmlFor="isActive" className="text-sm font-medium text-gray-900">
                                                    Status <span className="text-red-500">*</span>
                                                </Label>
                                                <Select
                                                    value={formData.isActive}
                                                    onValueChange={(value) => handleInputChange("isActive", value)}
                                                    disabled={submitting}
                                                >
                                                    <SelectTrigger id="isActive" className="h-10 w-full">
                                                        <SelectValue placeholder="Select status" />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="active">Active</SelectItem>
                                                        <SelectItem value="inactive">Inactive</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                                <p className="text-xs text-gray-500">Building availability status</p>
                                            </div>
                                        </div>
                                    </TabsContent>

                                    <TabsContent value="address" className="space-y-4 mt-6">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            <div className="space-y-2 md:col-span-2">
                                                <Label htmlFor="street" className="text-sm font-medium text-gray-900">
                                                    Street/Barangay <span className="text-gray-400 font-normal">(optional)</span>
                                                </Label>
                                                <Input
                                                    id="street"
                                                    type="text"
                                                    placeholder="e.g. 123 Bonifacio St., Brgy. San Antonio"
                                                    value={formData.street}
                                                    onChange={(e) => handleInputChange("street", e.target.value)}
                                                    className="h-10"
                                                    disabled={submitting}
                                                />
                                                <p className="text-xs text-gray-500">Street address and barangay</p>
                                            </div>

                                            <div className="space-y-2">
                                                <Label htmlFor="region" className="text-sm font-medium text-gray-900">
                                                    Region <span className="text-red-500">*</span>
                                                </Label>
                                                <Select
                                                    value={formData.region}
                                                    onValueChange={(value) => handleInputChange("region", value)}
                                                    disabled={submitting || loadingRegions}
                                                >
                                                    <SelectTrigger id="region" className={`h-10 w-full ${errors.region ? "border-red-500 focus-visible:ring-red-500" : ""}`}>
                                                        <SelectValue placeholder={loadingRegions ? "Loading regions..." : "Select region"} />
                                                    </SelectTrigger>
                                                    <SelectContent className="max-h-[300px]">
                                                        {regions.map((region) => (
                                                            <SelectItem key={region.code} value={region.code}>
                                                                {region.name}
                                                            </SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                                {errors.region ? (
                                                    <p className="text-xs text-red-500">{errors.region}</p>
                                                ) : (
                                                    <p className="text-xs text-gray-500">Philippine region</p>
                                                )}
                                            </div>

                                            <div className="space-y-2">
                                                <Label htmlFor="province" className="text-sm font-medium text-gray-900">
                                                    Province <span className="text-red-500">*</span>
                                                </Label>
                                                <Select
                                                    value={formData.province}
                                                    onValueChange={(value) => handleInputChange("province", value)}
                                                    disabled={submitting || loadingProvinces || !formData.region}
                                                >
                                                    <SelectTrigger id="province" className={`h-10 w-full ${errors.province ? "border-red-500 focus-visible:ring-red-500" : ""}`}>
                                                        <SelectValue placeholder={
                                                            loadingProvinces ? "Loading provinces..." :
                                                                !formData.region ? "Select region first" :
                                                                    "Select province"
                                                        } />
                                                    </SelectTrigger>
                                                    <SelectContent className="max-h-[300px]">
                                                        {provinces.map((prov) => (
                                                            <SelectItem key={prov.code} value={prov.code}>
                                                                {prov.name}
                                                            </SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                                {errors.province ? (
                                                    <p className="text-xs text-red-500">{errors.province}</p>
                                                ) : (
                                                    <p className="text-xs text-gray-500">Province/Metro Manila</p>
                                                )}
                                            </div>

                                            <div className="space-y-2">
                                                <Label htmlFor="city" className="text-sm font-medium text-gray-900">
                                                    City/Municipality <span className="text-red-500">*</span>
                                                </Label>
                                                <Select
                                                    value={formData.city}
                                                    onValueChange={(value) => handleInputChange("city", value)}
                                                    disabled={submitting || loadingCities || !formData.province}
                                                >
                                                    <SelectTrigger id="city" className={`h-10 w-full ${errors.city ? "border-red-500 focus-visible:ring-red-500" : ""}`}>
                                                        <SelectValue placeholder={
                                                            loadingCities ? "Loading cities..." :
                                                                !formData.province ? "Select province first" :
                                                                    "Select city/municipality"
                                                        } />
                                                    </SelectTrigger>
                                                    <SelectContent className="max-h-[300px]">
                                                        {cities.map((city) => (
                                                            <SelectItem key={city.code} value={city.code}>
                                                                {city.name}
                                                            </SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                                {errors.city ? (
                                                    <p className="text-xs text-red-500">{errors.city}</p>
                                                ) : (
                                                    <p className="text-xs text-gray-500">City or municipality</p>
                                                )}
                                            </div>

                                            <div className="space-y-2">
                                                <Label htmlFor="postalCode" className="text-sm font-medium text-gray-900">
                                                    Postal Code <span className="text-gray-400 font-normal">(optional)</span>
                                                </Label>
                                                <Input
                                                    id="postalCode"
                                                    type="text"
                                                    placeholder="e.g. 1105"
                                                    value={formData.postalCode}
                                                    onChange={(e) => handleInputChange("postalCode", e.target.value)}
                                                    className="h-10"
                                                    disabled={submitting}
                                                />
                                                <p className="text-xs text-gray-500">4-digit postal code</p>
                                            </div>
                                        </div>
                                    </TabsContent>
                                </Tabs>

                                <Separator />

                                <div className="flex items-center justify-end gap-3 pt-2">
                                    <Button
                                        type="button"
                                        variant="outline"
                                        onClick={handleClear}
                                        disabled={submitting}
                                    >
                                        <RotateCcw className="h-4 w-4 mr-2" />
                                        Clear
                                    </Button>

                                    <Button type="submit" disabled={submitting}>
                                        {submitting ? (
                                            <>
                                                <span className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                                                Saving...
                                            </>
                                        ) : (
                                            <>
                                                <Save className="h-4 w-4 mr-2" />
                                                {isEditMode ? "Save Building" : "Save Building"}
                                            </>
                                        )}
                                    </Button>
                                </div>
                            </form>
                        </div>
                    </>
                )}
            </div>

            <AlertDialog open={saveModal} onOpenChange={setSaveModal}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>
                            {isEditMode ? "Update Building" : "Create Building"}
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                            Are you sure you want to {isEditMode ? "update" : "create"} the building{" "}
                            <span className="font-semibold">"{formData.name}"</span>?
                            {isEditMode
                                ? " This will update the existing building details."
                                : " This will add a new building to the system."}
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={confirmSave}>
                            {isEditMode ? "Update" : "Create"}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </AppLayout>
    );
}
