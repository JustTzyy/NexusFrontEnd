import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import AppLayout from "../../layouts/AppLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { lettersOnly, philippinePhoneNumber } from "../../utils/inputValidation";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { FormSkeleton } from "../../utils/skeletonLoaders";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import { userService } from "@/services/userService";
import { locationService } from "@/services/locationService";
import { addressService } from "@/services/addressService";
import { roleService } from "@/services/roleService";
import { useAuth } from "@/contexts/AuthContext";
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
import { ArrowLeft, Save, AlertCircle, RotateCcw } from "lucide-react";

export default function UserForm() {
    const navigate = useNavigate();
    const { id } = useParams();
    const isEditMode = Boolean(id);
    const { user: currentUser } = useAuth();
    const isAdminOnly = currentUser?.roles?.includes("Admin") && !currentUser?.roles?.includes("Super Admin");

    /* ------------------------------ State ------------------------------ */
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState("");

    // Form data
    const initialFormData = {
        // Personal Info
        firstName: "",
        middleName: "",
        lastName: "",
        suffix: "",
        dateOfBirth: "",
        gender: "",
        nationality: "Filipino",
        email: "",
        phone: "",

        // Address (Philippines)
        street: "",
        region: "",
        province: "",
        city: "",
        postalCode: "",

        // Role
        roleId: "",  // Primary role ID as string
    };

    const [formData, setFormData] = useState(initialFormData);

    // Validation errors
    const [errors, setErrors] = useState({
        firstName: "",
        middleName: "",
        lastName: "",
        dateOfBirth: "",
        gender: "",
        email: "",
        phone: "",
        roleId: "",
        street: "",
        region: "",
        province: "",
        city: "",
        postalCode: "",
    });

    // Save confirmation modal
    const [saveModal, setSaveModal] = useState(false);

    // Gender options
    const genders = ["Male", "Female", "Other"];

    // Suffix options
    const suffixes = ["Jr.", "Sr.", "II", "III", "IV", "V"];

    // Philippines location state
    const [regions, setRegions] = useState([]);
    const [provinces, setProvinces] = useState([]);
    const [cities, setCities] = useState([]);
    const [loadingRegions, setLoadingRegions] = useState(false);
    const [loadingProvinces, setLoadingProvinces] = useState(false);
    const [loadingCities, setLoadingCities] = useState(false);

    // Available roles for selection
    const [availableRoles, setAvailableRoles] = useState([]);

    /* ------------------------------ Effects ------------------------------ */
    useEffect(() => {
        loadRegions();
        loadAvailableRoles();
    }, []);

    // Load provinces when region changes
    useEffect(() => {
        if (formData.region) {
            loadProvinces(formData.region);
        } else {
            setProvinces([]);
            setCities([]);
            // Only update if values need to be cleared
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
            // Only update if city needs to be cleared
            if (formData.city) {
                setFormData(prev => ({ ...prev, city: "" }));
            }
        }
    }, [formData.province]);

    // Handle initial loading state
    useEffect(() => {
        if (isEditMode) {
            loadUser();
        } else {
            // For create mode, just show skeleton briefly then show form
            const timer = setTimeout(() => setLoading(false), 500);
            return () => clearTimeout(timer);
        }
    }, [id]);

    /* ------------------------------ Location API ------------------------------ */
    const loadRegions = async () => {
        setLoadingRegions(true);
        try {
            const response = await locationService.getRegions();
            setRegions(response.data || []);
        } catch (err) {
            console.error("Failed to load regions:", err);
        } finally {
            setLoadingRegions(false);
        }
    };

    const loadProvinces = async (regionCode) => {
        setLoadingProvinces(true);
        try {
            const response = await locationService.getProvinces(regionCode);
            setProvinces(response.data || []);
        } catch (err) {
            console.error("Failed to load provinces:", err);
        } finally {
            setLoadingProvinces(false);
        }
    };

    const loadCities = async (provinceCode) => {
        setLoadingCities(true);
        try {
            const response = await locationService.getCities(provinceCode);
            setCities(response.data || []);
        } catch (err) {
            console.error("Failed to load cities:", err);
        } finally {
            setLoadingCities(false);
        }
    };

    /* ------------------------------ Roles API ------------------------------ */
    const loadAvailableRoles = async () => {
        try {
            const response = await roleService.getAll({ pageSize: 100 });
            let filteredRoles = (response.data.items || []).filter(
                role => role.name !== 'Lead' && role.name !== 'Customer'
            );
            if (isAdminOnly) {
                filteredRoles = filteredRoles.filter(
                    role => role.name !== 'Super Admin' && role.name !== 'Admin'
                );
            }
            setAvailableRoles(filteredRoles);
        } catch (err) {
            console.error("Failed to load roles:", err);
        }
    };

    /* ------------------------------ Address API ------------------------------ */
    const createAddress = async (addressData) => {
        try {
            const response = await addressService.create({
                street: addressData.street,
                region: addressData.region,
                province: addressData.province,
                city: addressData.city,
                postalCode: addressData.postalCode
            });
            return response.data.id || response.data; // Return just the address ID
        } catch (err) {
            throw new Error("Failed to create address: " + err.message);
        }
    };

    /* ------------------------------ API ------------------------------ */
    const loadUser = async () => {
        setLoading(true);
        setError("");

        try {
            const response = await userService.getById(id);
            const user = response.data;

            setFormData({
                firstName: user.firstName || "",
                middleName: user.middleName || "",
                lastName: user.lastName || "",
                suffix: user.suffix || "",
                dateOfBirth: user.dateOfBirth ? user.dateOfBirth.split('T')[0] : "",
                gender: user.gender || "",
                nationality: user.nationality || "Filipino",
                email: user.email || "",
                phone: user.phone || "",
                street: user.address?.streetBarangay || "",
                region: user.address?.region || "",
                province: user.address?.province || "",
                city: user.address?.cityMunicipality || "",
                postalCode: user.address?.postal || "",
                roleId: user.roles && user.roles.length > 0 ? user.roles[0].id.toString() : "",
            });
        } catch (err) {
            setError(err.message || "Failed to load user");
        } finally {
            setLoading(false);
        }
    };

    /* ------------------------------ Handlers ------------------------------ */
    const goBack = () => navigate("/users");

    const handleClear = () => {
        setFormData(initialFormData);
        setErrors({ firstName: "", middleName: "", lastName: "", dateOfBirth: "", gender: "", email: "", phone: "", roleId: "" });
    };

    const handleInputChange = (field, value) => {
        setFormData((prev) => ({ ...prev, [field]: value }));
        // Clear error when user starts typing
        if (errors[field]) {
            setErrors((prev) => ({ ...prev, [field]: "" }));
        }
    };

    const validateForm = () => {
        const newErrors = { firstName: "", middleName: "", lastName: "", dateOfBirth: "", gender: "", email: "", phone: "", roleId: "" };
        let isValid = true;

        // Validate first name
        if (!formData.firstName.trim()) {
            newErrors.firstName = "First name is required";
            isValid = false;
        } else if (!/^[a-zA-Z\s]+$/.test(formData.firstName)) {
            newErrors.firstName = "Only letters and spaces are allowed";
            isValid = false;
        }

        // Validate last name
        if (!formData.lastName.trim()) {
            newErrors.lastName = "Last name is required";
            isValid = false;
        } else if (!/^[a-zA-Z\s]+$/.test(formData.lastName)) {
            newErrors.lastName = "Only letters and spaces are allowed";
            isValid = false;
        }

        // Validate email
        if (!formData.email.trim()) {
            newErrors.email = "Email is required";
            isValid = false;
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
            newErrors.email = "Please enter a valid email address";
            isValid = false;
        }

        // Validate roles (optional)
        // Roles are optional - validation removed

        // Address is completely optional - no validation needed
        // The system will only create an address if all fields are complete

        setErrors(newErrors);
        return isValid;
    };

    const handleSubmit = (e) => {
        e.preventDefault();

        if (!validateForm()) return;

        // Open confirmation modal
        setSaveModal(true);
    };

    const confirmSave = async () => {
        setSaveModal(false);
        setSubmitting(true);
        setError("");

        try {
            let addressId = null;

            // Create address if ALL address fields are filled
            const hasCompleteAddress =
                formData.street &&
                formData.region &&
                formData.province &&
                formData.city &&
                formData.postalCode;

            if (hasCompleteAddress) {
                addressId = await createAddress({
                    street: formData.street,
                    region: formData.region,
                    province: formData.province,
                    city: formData.city,
                    postalCode: formData.postalCode
                });
            }

            const userData = {
                firstName: formData.firstName,
                lastName: formData.lastName,
                middleName: formData.middleName || null,
                suffix: formData.suffix || null,
                email: formData.email,
                phone: formData.phone || null,
                dateOfBirth: formData.dateOfBirth || null,
                gender: formData.gender || null,
                nationality: formData.nationality || null,
                addressId: addressId,  // Add address ID
                roleIds: formData.roleId ? [parseInt(formData.roleId)] : [] // Use the selected roleId
            };

            if (isEditMode) {
                await userService.update(id, userData);
            } else {
                await userService.create(userData);
            }

            // Navigate to Index with alert state
            navigate("/users", {
                state: {
                    alert: {
                        type: "success",
                        message: isEditMode
                            ? `User "${formData.firstName} ${formData.lastName}" updated successfully!`
                            : `User "${formData.firstName} ${formData.lastName}" created successfully! Welcome email sent.`,
                    },
                },
            });
        } catch (err) {
            setError(err.message || "Failed to save user");
            setSubmitting(false);
        }
    };

    /* ------------------------------ Render ------------------------------ */
    return (
        <AppLayout title={isEditMode ? "Edit User" : "Create User"}>
            <div className="space-y-6">
                {/* Alerts */}
                {error && (
                    <Alert variant="destructive">
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription>{error}</AlertDescription>
                    </Alert>
                )}

                {loading ? (
                    <FormSkeleton fields={12} showTabs={true} />
                ) : (
                    <>
                        {/* Header */}
                        <div className="flex items-center gap-3">
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <Button variant="outline" size="icon" onClick={goBack}>
                                        <ArrowLeft className="h-4 w-4" />
                                    </Button>
                                </TooltipTrigger>
                                <TooltipContent>Back to users</TooltipContent>
                            </Tooltip>
                            <div>
                                <h1 className="text-3xl font-bold text-gray-900">
                                    {isEditMode ? "Edit User" : "Create User"}
                                </h1>
                                <p className="mt-1 text-sm text-gray-600">
                                    {isEditMode
                                        ? "Update the user details below"
                                        : "Add a new user to the system"}
                                </p>
                            </div>
                        </div>

                        {/* Separator */}
                        <Separator />

                        {/* Form Content - Centered */}
                        <div className="max-w-4xl mx-auto">
                            <form onSubmit={handleSubmit} className="space-y-6 pt-2 animate-in fade-in slide-in-from-bottom-4 duration-500">
                                <Tabs defaultValue="personal" className="w-full">
                                    <TabsList className="grid w-full grid-cols-3">
                                        <TabsTrigger value="personal">Personal Information</TabsTrigger>
                                        <TabsTrigger value="contact">Contact</TabsTrigger>
                                        <TabsTrigger value="address">Address</TabsTrigger>
                                    </TabsList>

                                    {/* Personal Information Tab */}
                                    <TabsContent value="personal" className="space-y-4 mt-6">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            {/* First Name */}
                                            <div className="space-y-2">
                                                <Label htmlFor="firstName" className="text-sm font-medium text-gray-900">
                                                    First Name <span className="text-red-500">*</span>
                                                </Label>
                                                <Input
                                                    id="firstName"
                                                    type="text"
                                                    placeholder="e.g. John"
                                                    value={formData.firstName}
                                                    onChange={(e) => handleInputChange("firstName", lettersOnly(e.target.value))}
                                                    className={`h-10 ${errors.firstName ? "border-red-500 focus-visible:ring-red-500" : ""}`}
                                                    disabled={submitting}
                                                />
                                                {errors.firstName ? (
                                                    <p className="text-xs text-red-500">{errors.firstName}</p>
                                                ) : (
                                                    <p className="text-xs text-gray-500">User's first name</p>
                                                )}
                                            </div>

                                            {/* Last Name */}
                                            <div className="space-y-2">
                                                <Label htmlFor="lastName" className="text-sm font-medium text-gray-900">
                                                    Last Name <span className="text-red-500">*</span>
                                                </Label>
                                                <Input
                                                    id="lastName"
                                                    type="text"
                                                    placeholder="e.g. Dela Cruz"
                                                    value={formData.lastName}
                                                    onChange={(e) => handleInputChange("lastName", lettersOnly(e.target.value))}
                                                    className={`h-10 ${errors.lastName ? "border-red-500 focus-visible:ring-red-500" : ""}`}
                                                    disabled={submitting}
                                                />
                                                {errors.lastName ? (
                                                    <p className="text-xs text-red-500">{errors.lastName}</p>
                                                ) : (
                                                    <p className="text-xs text-gray-500">User's last name</p>
                                                )}
                                            </div>

                                            {/* Middle Name */}
                                            <div className="space-y-2">
                                                <Label htmlFor="middleName" className="text-sm font-medium text-gray-900">
                                                    Middle Name <span className="text-gray-400 font-normal">(optional)</span>
                                                </Label>
                                                <Input
                                                    id="middleName"
                                                    type="text"
                                                    placeholder="e.g. Santos"
                                                    value={formData.middleName}
                                                    onChange={(e) => handleInputChange("middleName", lettersOnly(e.target.value))}
                                                    className="h-10"
                                                    disabled={submitting}
                                                />
                                                <p className="text-xs text-gray-500">User's middle name</p>
                                            </div>

                                            {/* Suffix */}
                                            <div className="space-y-2">
                                                <Label htmlFor="suffix" className="text-sm font-medium text-gray-900">
                                                    Suffix <span className="text-gray-400 font-normal">(optional)</span>
                                                </Label>
                                                <Select
                                                    value={formData.suffix}
                                                    onValueChange={(value) => handleInputChange("suffix", value)}
                                                    disabled={submitting}
                                                >
                                                    <SelectTrigger id="suffix" className="h-10 w-full">
                                                        <SelectValue placeholder="Select suffix" />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        {suffixes.map((suffix) => (
                                                            <SelectItem key={suffix} value={suffix}>
                                                                {suffix}
                                                            </SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                                <p className="text-xs text-gray-500">Jr., Sr., II, etc.</p>
                                            </div>

                                            {/* Date of Birth */}
                                            <div className="space-y-2">
                                                <Label htmlFor="dateOfBirth" className="text-sm font-medium text-gray-900">
                                                    Date of Birth <span className="text-gray-400 font-normal">(optional)</span>
                                                </Label>
                                                <Input
                                                    id="dateOfBirth"
                                                    type="date"
                                                    value={formData.dateOfBirth}
                                                    onChange={(e) => handleInputChange("dateOfBirth", e.target.value)}
                                                    className="h-10"
                                                    disabled={submitting}
                                                    max={new Date().toISOString().split('T')[0]}
                                                />
                                                <p className="text-xs text-gray-500">User's birth date</p>
                                            </div>

                                            {/* Gender */}
                                            <div className="space-y-2">
                                                <Label htmlFor="gender" className="text-sm font-medium text-gray-900">
                                                    Gender <span className="text-gray-400 font-normal">(optional)</span>
                                                </Label>
                                                <Select
                                                    value={formData.gender}
                                                    onValueChange={(value) => handleInputChange("gender", value)}
                                                    disabled={submitting}
                                                >
                                                    <SelectTrigger id="gender" className="h-10 w-full">
                                                        <SelectValue placeholder="Select gender" />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        {genders.map((gender) => (
                                                            <SelectItem key={gender} value={gender}>
                                                                {gender}
                                                            </SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                                <p className="text-xs text-gray-500">User's gender</p>
                                            </div>

                                            {/* Nationality */}
                                            <div className="space-y-2">
                                                <Label htmlFor="nationality" className="text-sm font-medium text-gray-900">
                                                    Nationality <span className="text-gray-400 font-normal">(optional)</span>
                                                </Label>
                                                <Input
                                                    id="nationality"
                                                    type="text"
                                                    placeholder="e.g. Filipino"
                                                    value={formData.nationality}
                                                    onChange={(e) => handleInputChange("nationality", lettersOnly(e.target.value))}
                                                    className="h-10"
                                                    disabled={submitting}
                                                />
                                                <p className="text-xs text-gray-500">User's nationality</p>
                                            </div>


                                            {/* Roles */}
                                            <div className="space-y-2">
                                                <Label htmlFor="role" className="text-sm font-medium text-gray-900">
                                                    Assign Role <span className="text-red-500">*</span>
                                                </Label>
                                                <Select
                                                    value={formData.roleId}
                                                    onValueChange={(value) => handleInputChange("roleId", value)}
                                                    disabled={submitting}
                                                >
                                                    <SelectTrigger id="role" className={`h-10 w-full ${errors.roleId ? "border-red-500 focus-visible:ring-red-500" : ""}`}>
                                                        <SelectValue placeholder={availableRoles.length === 0 ? "Loading roles..." : "Select a role"} />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        {availableRoles.map((role) => (
                                                            <SelectItem key={role.id} value={role.id.toString()}>
                                                                {role.name}
                                                            </SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>

                                                {errors.roleId ? (
                                                    <p className="text-xs text-red-500">{errors.roleId}</p>
                                                ) : (
                                                    <p className="text-xs text-gray-500">Select the primary role for this user</p>
                                                )}
                                            </div>
                                        </div>
                                    </TabsContent>


                                    {/* Contact Tab */}
                                    <TabsContent value="contact" className="space-y-4 mt-6">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            {/* Email */}
                                            <div className="space-y-2">
                                                <Label htmlFor="email" className="text-sm font-medium text-gray-900">
                                                    Email <span className="text-red-500">*</span>
                                                </Label>
                                                <Input
                                                    id="email"
                                                    type="email"
                                                    placeholder="e.g. juan.delacruz@example.com"
                                                    value={formData.email}
                                                    onChange={(e) => handleInputChange("email", e.target.value)}
                                                    className={`h-10 ${errors.email ? "border-red-500 focus-visible:ring-red-500" : ""}`}
                                                    disabled={submitting}
                                                />
                                                {errors.email ? (
                                                    <p className="text-xs text-red-500">{errors.email}</p>
                                                ) : (
                                                    <p className="text-xs text-gray-500">Primary email address</p>
                                                )}
                                            </div>

                                            {/* Phone */}
                                            <div className="space-y-2">
                                                <Label htmlFor="phone" className="text-sm font-medium text-gray-900">
                                                    Phone <span className="text-gray-400 font-normal">(optional)</span>
                                                </Label>
                                                <Input
                                                    id="phone"
                                                    type="tel"
                                                    placeholder="e.g. 09171234567"
                                                    value={formData.phone}
                                                    onChange={(e) => handleInputChange("phone", philippinePhoneNumber(e.target.value))}
                                                    className="h-10"
                                                    disabled={submitting}
                                                    maxLength={11}
                                                />
                                                <p className="text-xs text-gray-500">11-digit PH mobile number (starts with 09)</p>
                                            </div>


                                        </div>
                                    </TabsContent>

                                    {/* Address Tab */}
                                    <TabsContent value="address" className="space-y-4 mt-6">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            {/* Street */}
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
                                                    className={`h-10 ${errors.street ? "border-red-500 focus-visible:ring-red-500" : ""}`}
                                                    disabled={submitting}
                                                />
                                                {errors.street ? (
                                                    <p className="text-xs text-red-500">{errors.street}</p>
                                                ) : (
                                                    <p className="text-xs text-gray-500">Street address and barangay</p>
                                                )}
                                            </div>

                                            {/* Region */}
                                            <div className="space-y-2">
                                                <Label htmlFor="region" className="text-sm font-medium text-gray-900">
                                                    Region <span className="text-gray-400 font-normal">(optional)</span>
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

                                            {/* Province */}
                                            <div className="space-y-2">
                                                <Label htmlFor="province" className="text-sm font-medium text-gray-900">
                                                    Province <span className="text-gray-400 font-normal">(optional)</span>
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

                                            {/* City/Municipality */}
                                            <div className="space-y-2">
                                                <Label htmlFor="city" className="text-sm font-medium text-gray-900">
                                                    City/Municipality <span className="text-gray-400 font-normal">(optional)</span>
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

                                            {/* Postal Code */}
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
                                                    className={`h-10 ${errors.postalCode ? "border-red-500 focus-visible:ring-red-500" : ""}`}
                                                    disabled={submitting}
                                                />
                                                {errors.postalCode ? (
                                                    <p className="text-xs text-red-500">{errors.postalCode}</p>
                                                ) : (
                                                    <p className="text-xs text-gray-500">4-digit postal code</p>
                                                )}
                                            </div>
                                        </div>
                                    </TabsContent>
                                </Tabs>

                                {/* Bottom Separator */}
                                <Separator />

                                {/* Footer Actions */}
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
                                                {isEditMode ? "Save User" : "Save User"}
                                            </>
                                        )}
                                    </Button>
                                </div>
                            </form>
                        </div>
                    </>
                )}
            </div>

            {/* Save Confirmation Dialog */}
            < AlertDialog open={saveModal} onOpenChange={setSaveModal} >
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>
                            {isEditMode ? "Update User" : "Create User"}
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                            Are you sure you want to {isEditMode ? "update" : "create"} the user{" "}
                            <span className="font-semibold">"{formData.firstName} {formData.lastName}"</span>?
                            {isEditMode
                                ? " This will update the existing user details."
                                : " This will add a new user to the system."}
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={confirmSave}>
                            {isEditMode ? "Update" : "Create"}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog >
        </AppLayout >
    );
}
