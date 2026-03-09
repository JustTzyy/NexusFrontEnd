import { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import AppLayout from "../../layouts/AppLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Checkbox } from "@/components/ui/checkbox";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
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
    Save,
    AlertCircle,
    RotateCcw,
    User,
    MapPin,
    ShieldCheck,
    Lock,
    Trash2,
    Mail,
    ChevronRight,
    Eye,
    EyeOff,
    CalendarCheck,
    Loader2,
    Building2,
} from "lucide-react";
import { toast } from "sonner";
import { locationService } from "@/services/locationService";
import { lettersOnly, philippinePhoneNumber } from "../../utils/inputValidation";
import { LateralFormSkeleton } from "../../utils/skeletonLoaders";
import { generatePersonalInfoPDF } from "../../utils/pdfExport";
import { useAuth } from "@/contexts/AuthContext";
import { userService } from "@/services/userService";
import { authService } from "@/services/authService";
import { teacherAvailabilityService } from "@/services/teacherAvailabilityService";
import { availableDayService } from "@/services/availableDayService";
import { availableTimeSlotService } from "@/services/availableTimeSlotService";
import { buildingService } from "@/services/buildingService";
import { studentAssignmentService } from "@/services/studentAssignmentService";

export default function SettingPage() {
    const navigate = useNavigate();
    const { user: authUser, logout, updateUserProfile } = useAuth();

    /* ------------------------------ State ------------------------------ */
    const [isLoading, setIsLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [changingPassword, setChangingPassword] = useState(false);
    const [deactivating, setDeactivating] = useState(false);
    const [error, setError] = useState("");

    // Availability state (only used when role === "Teacher")
    const [availDays, setAvailDays] = useState([]);
    const [availSlots, setAvailSlots] = useState([]);
    const [checkedSet, setCheckedSet] = useState(new Set()); // "dayId-slotId"
    const [availSaving, setAvailSaving] = useState(false);
    const isTeacher = useMemo(() => authUser?.roles?.includes("Teacher"), [authUser]);
    const isLeadOrCustomer = useMemo(() =>
        authUser?.roles?.includes("Lead") || authUser?.roles?.includes("Customer"), [authUser]);
    const [activeTab, setActiveTab] = useState("personal");
    const [originalData, setOriginalData] = useState(null);

    // Building state (Lead/Customer only)
    const [recommendedBuilding, setRecommendedBuilding] = useState(null);
    const [loadingBuildings, setLoadingBuildings] = useState(false);

    const initialFormData = {
        firstName: "", middleName: "", lastName: "", suffix: "",
        dateOfBirth: "", gender: "", nationality: "",
        email: "", phone: "",
        street: "", region: "", province: "", city: "", postalCode: "", addressId: null,
        preferredBuildingId: null,
        currentPassword: "", newPassword: "", confirmPassword: "",
    };

    const [formData, setFormData] = useState(initialFormData);
    const [saveModal, setSaveModal] = useState(false);
    const [deactivateModal, setDeactivateModal] = useState(false);

    // Password visibility toggles
    const [showCurrentPassword, setShowCurrentPassword] = useState(false);
    const [showNewPassword, setShowNewPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    // PSGC States
    const [regions, setRegions] = useState([]);
    const [provinces, setProvinces] = useState([]);
    const [cities, setCities] = useState([]);
    const [loadingRegions, setLoadingRegions] = useState(false);
    const [loadingProvinces, setLoadingProvinces] = useState(false);
    const [loadingCities, setLoadingCities] = useState(false);
    const [psgcCodes, setPsgcCodes] = useState({ region: "", province: "", city: "" });

    const genders = ["Male", "Female", "Other"];
    const suffixes = ["Jr.", "Sr.", "II", "III", "IV", "V"];

    // User display info
    const userDisplayInfo = useMemo(() => {
        if (!authUser) return { name: "Loading...", initials: "?", email: "", roles: [] };
        const fullName = authUser.fullName || "User";
        const nameParts = fullName.split(" ").filter(Boolean);
        const initials = nameParts.length >= 2
            ? `${nameParts[0][0]}${nameParts[nameParts.length - 1][0]}`.toUpperCase()
            : fullName.substring(0, 2).toUpperCase();
        return { name: fullName, initials, email: authUser.email || "", roles: authUser.roles || [] };
    }, [authUser]);

    /* ------------------------------ Effects ------------------------------ */
    useEffect(() => {
        const loadUserData = async () => {
            if (!authUser?.id) return;
            try {
                setIsLoading(true);
                const response = await userService.getMe();
                const userData = response.data;

                // Parse date without timezone conversion to prevent day shift
                const formattedDate = userData.dateOfBirth
                    ? userData.dateOfBirth.split('T')[0]
                    : "";

                const addressRegion = userData.address?.region || "";
                const addressProvince = userData.address?.province || "";
                const addressCity = userData.address?.cityMunicipality || "";

                const loadedData = {
                    firstName: userData.firstName || "",
                    middleName: userData.middleName || "",
                    lastName: userData.lastName || "",
                    suffix: userData.suffix || "",
                    dateOfBirth: formattedDate,
                    gender: userData.gender || "",
                    nationality: userData.nationality || "",
                    email: userData.email || "",
                    phone: userData.phone || "",
                    street: userData.address?.streetBarangay || "",
                    region: addressRegion,
                    province: addressProvince,
                    city: addressCity,
                    postalCode: userData.address?.postal || "",
                    addressId: userData.address?.id || null,
                    preferredBuildingId: userData.preferredBuildingId || null,
                    currentPassword: "", newPassword: "", confirmPassword: "",
                };

                setFormData(loadedData);
                setOriginalData(loadedData);
                // Populate psgcCodes so cascading effects fire
                setPsgcCodes({ region: addressRegion, province: addressProvince, city: addressCity });

                // Fetch recommended building for Lead/Customer
                const isLeadCustomer = userData.roles?.some(r => r.name === "Lead" || r.name === "Customer");
                if (isLeadCustomer) {
                    try {
                        const buildingRes = await buildingService.getRecommended({
                            city: addressCity || undefined,
                            province: addressProvince || undefined,
                            region: addressRegion || undefined,
                            preferredBuildingId: userData.preferredBuildingId || undefined,
                        });
                        const building = buildingRes.data || null;
                        setRecommendedBuilding(building);
                        if (building) {
                            studentAssignmentService.updateMine({ preferredBuildingId: building.id }).catch(() => {});
                        }
                    } catch { /* silent */ }
                }

                await loadRegions();

                // Load availability if teacher
                const roleName = userData.roles?.[0]?.name;
                if (roleName === "Teacher") {
                    const [daysRes, slotsRes, availRes] = await Promise.all([
                        availableDayService.lookup(),
                        availableTimeSlotService.lookup(),
                        teacherAvailabilityService.getMyAvailability(),
                    ]);
                    const extractItems = (res) => { const d = res.data?.data || res.data; return d?.items || d || []; };
                    setAvailDays(extractItems(daysRes));
                    setAvailSlots(extractItems(slotsRes));
                    const savedSlots = availRes.data?.data?.slots || availRes.data?.slots || [];
                    setCheckedSet(new Set(savedSlots.map(s => `${s.dayId}-${s.timeSlotId}`)));
                }
            } catch (err) {
                console.error("Failed to load user data:", err);
                setError("Failed to load your profile data.");
                toast.error("Failed to load profile data");
            } finally {
                setIsLoading(false);
            }
        };
        loadUserData();
    }, [authUser?.id]);

    // Cascade: region -> provinces
    useEffect(() => {
        if (!isLoading && psgcCodes.region) loadProvinces(psgcCodes.region);
        else { setProvinces([]); setCities([]); }
    }, [psgcCodes.region, isLoading]);

    // Cascade: province -> cities
    useEffect(() => {
        if (!isLoading && psgcCodes.province) loadCities(psgcCodes.province);
        else setCities([]);
    }, [psgcCodes.province, isLoading]);

    // Fetch recommended building for Lead/Customer based on their address
    useEffect(() => {
        if (!isLeadOrCustomer) return;
        if (!formData.city && !formData.province && !formData.region) {
            setRecommendedBuilding(null);
            return;
        }
        const fetchRecommended = async () => {
            setLoadingBuildings(true);
            try {
                const res = await buildingService.getRecommended({
                    city: formData.city || undefined,
                    province: formData.province || undefined,
                    region: formData.region || undefined,
                    preferredBuildingId: formData.preferredBuildingId || undefined,
                });
                const building = res.data || null;
                setRecommendedBuilding(building);
                studentAssignmentService.updateMine({
                    preferredBuildingId: building?.id ?? null,
                    clearPreferredBuilding: building == null,
                }).catch(() => {});
            } catch { /* silent */ }
            finally { setLoadingBuildings(false); }
        };
        fetchRecommended();
    }, [isLeadOrCustomer, formData.city, formData.province, formData.region]);

    /* ------------------------------ API Helpers ------------------------------ */
    const loadRegions = async () => {
        setLoadingRegions(true);
        try { const response = await locationService.getRegions(); setRegions(response.data || []); }
        catch (err) { console.error(err); }
        finally { setLoadingRegions(false); }
    };

    const loadProvinces = async (rCode) => {
        setLoadingProvinces(true);
        try { const response = await locationService.getProvinces(rCode); setProvinces(response.data || []); }
        catch (err) { console.error(err); }
        finally { setLoadingProvinces(false); }
    };

    const loadCities = async (pCode) => {
        setLoadingCities(true);
        try { const response = await locationService.getCities(pCode); setCities(response.data || []); }
        catch (err) { console.error(err); }
        finally { setLoadingCities(false); }
    };

    /* ------------------------------ Handlers ------------------------------ */
    const handleInputChange = (field, value) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const handleRegionChange = (code) => {
        setPsgcCodes({ region: code, province: "", city: "" });
        setFormData(prev => ({ ...prev, region: code, province: "", city: "" }));
    };

    const handleProvinceChange = (code) => {
        setPsgcCodes(prev => ({ ...prev, province: code, city: "" }));
        setFormData(prev => ({ ...prev, province: code, city: "" }));
    };

    const handleCityChange = (code) => {
        setPsgcCodes(prev => ({ ...prev, city: code }));
        setFormData(prev => ({ ...prev, city: code }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        setSaveModal(true);
    };

    const confirmSave = async () => {
        setSaveModal(false);
        setSubmitting(true);
        setError("");
        try {
            const updateDto = {
                firstName: formData.firstName,
                lastName: formData.lastName,
                middleName: formData.middleName || null,
                suffix: formData.suffix || null,
                dateOfBirth: formData.dateOfBirth ? new Date(formData.dateOfBirth).toISOString() : null,
                gender: formData.gender || null,
                nationality: formData.nationality || null,
                email: formData.email,
                phone: formData.phone || null,
                addressId: formData.addressId,
                address: {
                    street: formData.street || "",
                    region: formData.region || "",
                    province: formData.province || "",
                    city: formData.city || "",
                    postalCode: formData.postalCode || "",
                },
            };
            await userService.updateMe(updateDto);
            setOriginalData({ ...formData });
            // Update sidebar name immediately using saved form values
            const fullName = [formData.firstName, formData.lastName].filter(Boolean).join(" ").trim();
            if (fullName) updateUserProfile({ fullName });
            toast.success("Settings updated successfully");
        } catch (err) {
            console.error("Failed to update settings:", err);
            const errorMessage = err.response?.data?.message || "Failed to update settings.";
            setError(errorMessage);
            toast.error(errorMessage);
        } finally {
            setSubmitting(false);
        }
    };

    const handleChangePassword = async () => {
        if (formData.newPassword !== formData.confirmPassword) {
            toast.error("New password and confirm password do not match");
            return;
        }
        if (formData.newPassword.length < 8) {
            toast.error("New password must be at least 8 characters");
            return;
        }
        setChangingPassword(true);
        try {
            await authService.changePassword(formData.currentPassword, formData.newPassword, formData.confirmPassword);
            toast.success("Password changed successfully");
            setFormData(prev => ({ ...prev, currentPassword: "", newPassword: "", confirmPassword: "" }));
            setShowCurrentPassword(false);
            setShowNewPassword(false);
            setShowConfirmPassword(false);
        } catch (err) {
            console.error("Failed to change password:", err);
            toast.error(err.response?.data?.message || "Failed to change password. Please check your current password.");
        } finally {
            setChangingPassword(false);
        }
    };

    /* ------------------------------ Availability Handlers ------------------------------ */
    const toggleSlot = (dayId, slotId) => {
        const key = `${dayId}-${slotId}`;
        setCheckedSet(prev => { const n = new Set(prev); n.has(key) ? n.delete(key) : n.add(key); return n; });
    };

    const toggleDayAll = (dayId) => {
        const keys = availSlots.map(s => `${dayId}-${s.id}`);
        const allOn = keys.every(k => checkedSet.has(k));
        setCheckedSet(prev => { const n = new Set(prev); keys.forEach(k => allOn ? n.delete(k) : n.add(k)); return n; });
    };

    const saveAvailability = async () => {
        setAvailSaving(true);
        try {
            const slots = [...checkedSet].map(key => {
                const [dayId, timeSlotId] = key.split("-").map(Number);
                return { dayId, timeSlotId };
            });
            await teacherAvailabilityService.setMyAvailability(slots);
            toast.success("Availability saved successfully");
        } catch (err) {
            const msg = err.response?.data?.message;
            toast.error(msg || "Failed to save availability");
        } finally {
            setAvailSaving(false);
        }
    };

    const handleDeactivateAccount = async () => {
        setDeactivating(true);
        try {
            await authService.deactivateAccount();
            toast.success("Account deactivated successfully");
            setDeactivateModal(false);
            logout();
            navigate("/login");
        } catch (err) {
            console.error("Failed to deactivate account:", err);
            toast.error(err.response?.data?.message || "Failed to deactivate account.");
            setDeactivating(false);
        }
    };

    const handlePrint = () => {
        generatePersonalInfoPDF({
            title: "User Profile Report",
            data: formData,
            fields: [
                { label: "Full Name", accessor: (d) => `${d.firstName} ${d.middleName} ${d.lastName} ${d.suffix}`.trim() },
                { label: "Email", key: "email" },
                { label: "Phone", key: "phone" },
                { label: "Date of Birth", key: "dateOfBirth" },
                { label: "Gender", key: "gender" },
                { label: "Nationality", key: "nationality" },
                { label: "Postal Code", key: "postalCode" },
            ],
            companyName: "Management System",
            headerInfo: { name: `${formData.firstName} ${formData.lastName}` },
        });
    };

    // Password strength calculator
    const passwordStrength = useMemo(() => {
        const pw = formData.newPassword;
        if (!pw) return { score: 0, label: "", color: "" };
        let score = 0;
        if (pw.length >= 8) score++;
        if (pw.length >= 12) score++;
        if (/[A-Z]/.test(pw)) score++;
        if (/[0-9]/.test(pw)) score++;
        if (/[^A-Za-z0-9]/.test(pw)) score++;
        if (score <= 1) return { score: 1, label: "Weak", color: "bg-red-500" };
        if (score <= 2) return { score: 2, label: "Fair", color: "bg-orange-500" };
        if (score <= 3) return { score: 3, label: "Good", color: "bg-yellow-500" };
        if (score <= 4) return { score: 4, label: "Strong", color: "bg-green-500" };
        return { score: 5, label: "Very Strong", color: "bg-emerald-600" };
    }, [formData.newPassword]);


    /* ------------------------------ Helpers ------------------------------ */
    /* ------------------------------ Tab config ------------------------------ */
    const tabs = [
        { id: "personal", label: "Personal Information", description: "Name, birth date, gender", icon: User },
        { id: "contact", label: "Contact Details", description: "Email and phone number", icon: Mail },
        { id: "address", label: "Residential Address", description: "Region, province, city", icon: MapPin },
        ...(isLeadOrCustomer ? [{ id: "building", label: "Preferred Building", description: "Select your preferred location", icon: Building2 }] : []),
        { id: "security", label: "Security & Password", description: "Change your password", icon: ShieldCheck },
        ...(isTeacher ? [{ id: "availability", label: "Teaching Availability", description: "Days & times you can teach", icon: CalendarCheck }] : []),
        { id: "danger", label: "Account Status", description: "Deactivate your account", icon: AlertCircle },
    ];

    const activeTabConfig = tabs.find(t => t.id === activeTab);

    /* ------------------------------ Main Render ------------------------------ */
    return (
        <AppLayout title="Settings" onPrint={handlePrint}>
            {isLoading ? (
                <LateralFormSkeleton />
            ) : (
                <div className="space-y-8">
                    {/* Profile Header */}
                    <div className="flex items-center gap-5 animate-in fade-in slide-in-from-bottom-2 duration-400">
                        <Avatar className="h-16 w-16 ring-2 ring-gray-100">
                            <AvatarFallback className="bg-gray-900 text-white text-lg font-semibold">
                                {userDisplayInfo.initials}
                            </AvatarFallback>
                        </Avatar>
                        <div className="space-y-1.5">
                            <h1 className="text-2xl font-bold text-gray-900 tracking-tight">{userDisplayInfo.name}</h1>
                            <div className="flex items-center gap-2">
                                <span className="text-sm text-gray-500">{userDisplayInfo.email}</span>
                                {userDisplayInfo.roles.map(role => (
                                    <Badge key={role} variant="secondary" className="text-[10px] px-2 py-0">
                                        {role}
                                    </Badge>
                                ))}
                            </div>
                        </div>
                    </div>

                    <Separator />

                    <div className="grid grid-cols-1 lg:grid-cols-[240px_1fr] gap-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                        {/* Side Navigation */}
                        <aside className="space-y-1">
                            {tabs.map(({ id, label, description, icon: Icon }) => (
                                <button
                                    key={id}
                                    type="button"
                                    onClick={() => setActiveTab(id)}
                                    className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-left transition-all duration-200 group ${activeTab === id
                                        ? "bg-gray-900 text-white shadow-sm"
                                        : "text-gray-600 hover:bg-gray-50"
                                        }`}
                                >
                                    <div className={`p-1.5 rounded-md ${activeTab === id ? "bg-white/15" : "bg-gray-100 group-hover:bg-gray-200"
                                        }`}>
                                        <Icon className="h-3.5 w-3.5" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="text-sm font-medium truncate">{label}</div>
                                        <div className={`text-[11px] truncate ${activeTab === id ? "text-white/60" : "text-gray-400"
                                            }`}>{description}</div>
                                    </div>
                                    {activeTab === id && <ChevronRight className="h-3.5 w-3.5 opacity-40 shrink-0" />}
                                </button>
                            ))}
                        </aside>

                        {/* Content Area */}
                        <div className="max-w-3xl">
                            <form onSubmit={handleSubmit}>
                                {/* Card wrapper for each tab */}
                                <div className="border rounded-xl bg-white shadow-sm overflow-hidden">
                                    {/* Card Header */}
                                    <div className="px-6 py-4 bg-gradient-to-r from-gray-50 to-gray-50/50 border-b">
                                        <div className="flex items-center gap-3">
                                            {activeTabConfig && <activeTabConfig.icon className="h-5 w-5 text-gray-500" />}
                                            <div>
                                                <h2 className="text-base font-semibold text-gray-900">{activeTabConfig?.label}</h2>
                                                <p className="text-xs text-gray-500 mt-0.5">{activeTabConfig?.description}</p>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Card Body */}
                                    <div className="p-6">
                                        {activeTab === "personal" && (
                                            <div className="space-y-6 animate-in slide-in-from-right-2 duration-300">
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                                    <div className="space-y-1.5">
                                                        <Label className="text-xs font-medium text-gray-500 uppercase tracking-wider">First Name <span className="text-red-500">*</span></Label>
                                                        <Input value={formData.firstName} onChange={(e) => handleInputChange("firstName", lettersOnly(e.target.value))} className="h-10" />
                                                    </div>
                                                    <div className="space-y-1.5">
                                                        <Label className="text-xs font-medium text-gray-500 uppercase tracking-wider">Last Name <span className="text-red-500">*</span></Label>
                                                        <Input value={formData.lastName} onChange={(e) => handleInputChange("lastName", lettersOnly(e.target.value))} className="h-10" />
                                                    </div>
                                                    <div className="space-y-1.5">
                                                        <Label className="text-xs font-medium text-gray-500 uppercase tracking-wider">Middle Name</Label>
                                                        <Input value={formData.middleName} onChange={(e) => handleInputChange("middleName", lettersOnly(e.target.value))} className="h-10" />
                                                    </div>
                                                    <div className="space-y-1.5">
                                                        <Label className="text-xs font-medium text-gray-500 uppercase tracking-wider">Suffix</Label>
                                                        <Select value={formData.suffix} onValueChange={(v) => handleInputChange("suffix", v)}>
                                                            <SelectTrigger className="h-10"><SelectValue placeholder="Select suffix" /></SelectTrigger>
                                                            <SelectContent>{suffixes.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                                                        </Select>
                                                    </div>
                                                </div>
                                                <Separator />
                                                <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                                                    <div className="space-y-1.5">
                                                        <Label className="text-xs font-medium text-gray-500 uppercase tracking-wider">Date of Birth</Label>
                                                        <Input type="date" value={formData.dateOfBirth} onChange={(e) => handleInputChange("dateOfBirth", e.target.value)} className="h-10" />
                                                    </div>
                                                    <div className="space-y-1.5">
                                                        <Label className="text-xs font-medium text-gray-500 uppercase tracking-wider">Gender</Label>
                                                        <Select value={formData.gender} onValueChange={(v) => handleInputChange("gender", v)}>
                                                            <SelectTrigger className="h-10"><SelectValue placeholder="Select gender" /></SelectTrigger>
                                                            <SelectContent>{genders.map(g => <SelectItem key={g} value={g}>{g}</SelectItem>)}</SelectContent>
                                                        </Select>
                                                    </div>
                                                    <div className="space-y-1.5">
                                                        <Label className="text-xs font-medium text-gray-500 uppercase tracking-wider">Nationality</Label>
                                                        <Input value={formData.nationality} onChange={(e) => handleInputChange("nationality", lettersOnly(e.target.value))} className="h-10" />
                                                    </div>
                                                </div>
                                            </div>
                                        )}

                                        {activeTab === "contact" && (
                                            <div className="space-y-5 animate-in slide-in-from-right-2 duration-300">
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                                    <div className="space-y-1.5">
                                                        <Label className="text-xs font-medium text-gray-500 uppercase tracking-wider">Email Address <span className="text-red-500">*</span></Label>
                                                        <Input type="email" value={formData.email} onChange={(e) => handleInputChange("email", e.target.value)} className="h-10" />
                                                    </div>
                                                    <div className="space-y-1.5">
                                                        <Label className="text-xs font-medium text-gray-500 uppercase tracking-wider">Phone Number</Label>
                                                        <Input value={formData.phone} onChange={(e) => handleInputChange("phone", philippinePhoneNumber(e.target.value))} className="h-10" maxLength={11} placeholder="09XXXXXXXXX" />
                                                    </div>
                                                </div>
                                            </div>
                                        )}

                                        {activeTab === "address" && (
                                            <div className="space-y-5 animate-in slide-in-from-right-2 duration-300">
                                                <div className="space-y-1.5">
                                                    <Label className="text-xs font-medium text-gray-500 uppercase tracking-wider">Street / Barangay</Label>
                                                    <Input value={formData.street} onChange={(e) => handleInputChange("street", e.target.value)} className="h-10" />
                                                </div>
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                                    <div className="space-y-1.5">
                                                        <Label className="text-xs font-medium text-gray-500 uppercase tracking-wider">Region</Label>
                                                        <Select value={psgcCodes.region} onValueChange={handleRegionChange}>
                                                            <SelectTrigger className="h-10">
                                                                <SelectValue placeholder={loadingRegions ? "Loading..." : "Select region"} />
                                                            </SelectTrigger>
                                                            <SelectContent className="max-h-[300px]">
                                                                {regions.map(r => <SelectItem key={r.code} value={r.code}>{r.name}</SelectItem>)}
                                                            </SelectContent>
                                                        </Select>
                                                    </div>
                                                    <div className="space-y-1.5">
                                                        <Label className="text-xs font-medium text-gray-500 uppercase tracking-wider">Province</Label>
                                                        <Select value={psgcCodes.province} onValueChange={handleProvinceChange} disabled={!psgcCodes.region}>
                                                            <SelectTrigger className="h-10">
                                                                <SelectValue placeholder={loadingProvinces ? "Loading..." : !psgcCodes.region ? "Select region first" : "Select province"} />
                                                            </SelectTrigger>
                                                            <SelectContent className="max-h-[300px]">
                                                                {provinces.map(p => <SelectItem key={p.code} value={p.code}>{p.name}</SelectItem>)}
                                                            </SelectContent>
                                                        </Select>
                                                    </div>
                                                    <div className="space-y-1.5">
                                                        <Label className="text-xs font-medium text-gray-500 uppercase tracking-wider">City / Municipality</Label>
                                                        <Select value={psgcCodes.city} onValueChange={handleCityChange} disabled={!psgcCodes.province}>
                                                            <SelectTrigger className="h-10">
                                                                <SelectValue placeholder={loadingCities ? "Loading..." : !psgcCodes.province ? "Select province first" : "Select city"} />
                                                            </SelectTrigger>
                                                            <SelectContent className="max-h-[300px]">
                                                                {cities.map(c => <SelectItem key={c.code} value={c.code}>{c.name}</SelectItem>)}
                                                            </SelectContent>
                                                        </Select>
                                                    </div>
                                                    <div className="space-y-1.5">
                                                        <Label className="text-xs font-medium text-gray-500 uppercase tracking-wider">Postal Code</Label>
                                                        <Input value={formData.postalCode} onChange={(e) => handleInputChange("postalCode", e.target.value)} className="h-10" />
                                                    </div>
                                                </div>
                                                <p className="text-[11px] text-gray-400 italic">
                                                    To change your address, select a new Region first, then Province, then City.
                                                </p>
                                            </div>
                                        )}

                                        {activeTab === "building" && (
                                            <div className="space-y-4 animate-in slide-in-from-right-2 duration-300">
                                                <p className="text-xs text-gray-500">
                                                    Your assigned building is automatically determined from your registered address.
                                                    Update your address to change this.
                                                </p>
                                                {loadingBuildings ? (
                                                    <div className="text-sm text-gray-400 flex items-center gap-2 py-6">
                                                        <Loader2 className="h-4 w-4 animate-spin" /> Loading...
                                                    </div>
                                                ) : recommendedBuilding ? (
                                                    <div className="p-5 rounded-lg border-2 border-gray-900 bg-gray-50 space-y-2">
                                                        <div className="flex items-center gap-2.5">
                                                            <div className="p-1.5 bg-gray-900 rounded-md">
                                                                <Building2 className="h-4 w-4 text-white" />
                                                            </div>
                                                            <p className="font-semibold text-gray-900">{recommendedBuilding.name}</p>
                                                        </div>
                                                        {recommendedBuilding.addressLine && (
                                                            <p className="text-xs text-gray-500 pl-9">{recommendedBuilding.addressLine}</p>
                                                        )}
                                                        <p className="text-[11px] text-gray-400 pl-9 pt-1">
                                                            This building is automatically matched to your address. It cannot be changed manually.
                                                        </p>
                                                    </div>
                                                ) : (formData.city || formData.province || formData.region) ? (
                                                    <div className="py-8 text-center space-y-2">
                                                        <Building2 className="mx-auto h-8 w-8 text-gray-300" />
                                                        <p className="text-sm text-gray-500">No building available in this area.</p>
                                                        <p className="text-xs text-gray-400">There are no buildings that match your registered address yet.</p>
                                                    </div>
                                                ) : (
                                                    <div className="py-8 text-center space-y-2">
                                                        <Building2 className="mx-auto h-8 w-8 text-gray-300" />
                                                        <p className="text-sm text-gray-500">No building assigned yet.</p>
                                                        <p className="text-xs text-gray-400">Complete your address in the Residential Address tab first.</p>
                                                    </div>
                                                )}
                                            </div>
                                        )}

                                        {activeTab === "security" && (
                                            <div className="space-y-6 animate-in slide-in-from-right-2 duration-300">
                                                <div className="space-y-5">
                                                    <div className="space-y-1.5">
                                                        <Label className="text-xs font-medium text-gray-500 uppercase tracking-wider">Current Password <span className="text-red-500">*</span></Label>
                                                        <div className="relative">
                                                            <Input
                                                                type={showCurrentPassword ? "text" : "password"}
                                                                placeholder="Enter current password"
                                                                className="h-10 pr-10"
                                                                value={formData.currentPassword}
                                                                onChange={(e) => handleInputChange("currentPassword", e.target.value)}
                                                            />
                                                            <button type="button" onClick={() => setShowCurrentPassword(!showCurrentPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                                                                {showCurrentPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                                            </button>
                                                        </div>
                                                    </div>
                                                    <Separator />
                                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                                        <div className="space-y-1.5">
                                                            <Label className="text-xs font-medium text-gray-500 uppercase tracking-wider">New Password <span className="text-red-500">*</span></Label>
                                                            <div className="relative">
                                                                <Input
                                                                    type={showNewPassword ? "text" : "password"}
                                                                    placeholder="Min. 8 characters"
                                                                    className="h-10 pr-10"
                                                                    value={formData.newPassword}
                                                                    onChange={(e) => handleInputChange("newPassword", e.target.value)}
                                                                />
                                                                <button type="button" onClick={() => setShowNewPassword(!showNewPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                                                                    {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                                                </button>
                                                            </div>
                                                        </div>
                                                        <div className="space-y-1.5">
                                                            <Label className="text-xs font-medium text-gray-500 uppercase tracking-wider">Confirm Password <span className="text-red-500">*</span></Label>
                                                            <div className="relative">
                                                                <Input
                                                                    type={showConfirmPassword ? "text" : "password"}
                                                                    placeholder="Re-enter new password"
                                                                    className="h-10 pr-10"
                                                                    value={formData.confirmPassword}
                                                                    onChange={(e) => handleInputChange("confirmPassword", e.target.value)}
                                                                />
                                                                <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                                                                    {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                                                </button>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    {/* Password strength bar */}
                                                    {formData.newPassword && (
                                                        <div className="space-y-1.5">
                                                            <div className="flex gap-1.5">
                                                                {[1, 2, 3, 4, 5].map(i => (
                                                                    <div key={i} className={`h-1 flex-1 rounded-full transition-colors ${i <= passwordStrength.score ? passwordStrength.color : "bg-gray-200"}`} />
                                                                ))}
                                                            </div>
                                                            <p className={`text-[11px] font-medium ${passwordStrength.color.replace("bg-", "text-")}`}>
                                                                {passwordStrength.label}
                                                            </p>
                                                        </div>
                                                    )}
                                                </div>
                                                <div className="pt-2">
                                                    <Button
                                                        type="button"
                                                        onClick={handleChangePassword}
                                                        disabled={changingPassword || !formData.currentPassword || !formData.newPassword || !formData.confirmPassword}
                                                        className="w-full sm:w-auto"
                                                    >
                                                        <Lock className="h-4 w-4 mr-2" />
                                                        {changingPassword ? "Changing..." : "Update Password"}
                                                    </Button>
                                                </div>
                                            </div>
                                        )}

                                        {activeTab === "availability" && isTeacher && (
                                            <div className="space-y-5 animate-in slide-in-from-right-2 duration-300">
                                                <p className="text-xs text-gray-500">
                                                    Check every day + time combination you are available to teach.
                                                    Admins scheduling sessions for you will only see these slots.
                                                </p>

                                                {/* Grid: rows = days, cols = timeslots */}
                                                <div className="overflow-x-auto">
                                                    <table className="w-full text-xs border-collapse">
                                                        <thead>
                                                            <tr className="bg-gray-50">
                                                                <th className="text-left p-2.5 border text-gray-500 font-medium uppercase tracking-wider text-[10px] w-28">Day \ Time</th>
                                                                {availSlots.map(s => (
                                                                    <th key={s.id} className="p-2.5 border text-center text-gray-500 font-medium uppercase tracking-wider text-[10px] whitespace-nowrap">
                                                                        {s.startTime}
                                                                        {s.endTime && <span className="block normal-case text-gray-400 font-normal">{s.endTime}</span>}
                                                                    </th>
                                                                ))}
                                                                <th className="p-2.5 border text-center text-gray-400 font-medium uppercase tracking-wider text-[10px] w-16">All</th>
                                                            </tr>
                                                        </thead>
                                                        <tbody>
                                                            {availDays.map(d => {
                                                                const keys = availSlots.map(s => `${d.id}-${s.id}`);
                                                                const allOn = keys.every(k => checkedSet.has(k));
                                                                return (
                                                                    <tr key={d.id} className="hover:bg-gray-50 transition-colors">
                                                                        <td className="p-2.5 border font-medium text-gray-700 text-xs">{d.dayName || d.name}</td>
                                                                        {availSlots.map(s => (
                                                                            <td key={s.id} className="p-2.5 border text-center">
                                                                                <Checkbox
                                                                                    checked={checkedSet.has(`${d.id}-${s.id}`)}
                                                                                    onCheckedChange={() => toggleSlot(d.id, s.id)}
                                                                                />
                                                                            </td>
                                                                        ))}
                                                                        <td className="p-2.5 border text-center">
                                                                            <Checkbox
                                                                                checked={allOn}
                                                                                onCheckedChange={() => toggleDayAll(d.id)}
                                                                                className="border-indigo-400 data-[state=checked]:bg-indigo-600 data-[state=checked]:border-indigo-600"
                                                                            />
                                                                        </td>
                                                                    </tr>
                                                                );
                                                            })}
                                                        </tbody>
                                                    </table>
                                                </div>

                                                <div className="flex justify-end">
                                                    <Button type="button" size="sm" onClick={saveAvailability} disabled={availSaving} className="gap-2">
                                                        {availSaving
                                                            ? <><Loader2 className="h-3.5 w-3.5 animate-spin" />Saving...</>
                                                            : <><Save className="h-3.5 w-3.5" />Save Availability</>}
                                                    </Button>
                                                </div>
                                            </div>
                                        )}

                                        {activeTab === "danger" && (
                                            <div className="animate-in slide-in-from-right-2 duration-300">
                                                <div className="p-5 border border-red-200 bg-red-50/50 rounded-lg space-y-4">
                                                    <div className="flex items-start gap-4">
                                                        <div className="p-2.5 bg-red-100 rounded-lg shrink-0">
                                                            <Trash2 className="h-5 w-5 text-red-600" />
                                                        </div>
                                                        <div className="space-y-1">
                                                            <h4 className="font-semibold text-red-900">Deactivate Account</h4>
                                                            <p className="text-sm text-red-700/80 leading-relaxed">
                                                                This will revoke all system privileges and archive your data. You will be logged out immediately. Only an administrator can reactivate your account.
                                                            </p>
                                                        </div>
                                                    </div>
                                                    <div className="flex justify-end pt-1">
                                                        <Button type="button" variant="destructive" size="sm" onClick={() => setDeactivateModal(true)}>
                                                            Deactivate My Account
                                                        </Button>
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    {/* Card Footer - Save/Reset actions (not for security, danger, or availability tabs) */}
                                    {activeTab !== "danger" && activeTab !== "security" && activeTab !== "availability" && activeTab !== "building" && (
                                        <div className="px-6 py-4 bg-gray-50/50 border-t flex items-center justify-end gap-3">
                                            <Button type="button" variant="outline" size="sm" onClick={() => window.location.reload()}>
                                                <RotateCcw className="h-3.5 w-3.5 mr-1.5" />
                                                Reset
                                            </Button>
                                            <Button type="submit" size="sm" disabled={submitting}>
                                                <Save className="h-3.5 w-3.5 mr-1.5" />
                                                {submitting ? "Saving..." : "Save Changes"}
                                            </Button>
                                        </div>
                                    )}
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}

            {/* Save Confirmation */}
            <AlertDialog open={saveModal} onOpenChange={setSaveModal}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Save Changes</AlertDialogTitle>
                        <AlertDialogDescription>Are you sure you want to update your profile settings?</AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={confirmSave}>Save</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            {/* Deactivate Confirmation */}
            <AlertDialog open={deactivateModal} onOpenChange={setDeactivateModal}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle className="text-red-600">Deactivate Account?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This will revoke all system privileges and archive your data. You will be logged out immediately. This action can only be undone by an administrator.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={deactivating}>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDeactivateAccount} className="bg-red-600 hover:bg-red-700" disabled={deactivating}>
                            {deactivating ? "Deactivating..." : "Deactivate"}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </AppLayout>
    );
}
