import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { userService } from "@/services/userService";
import { buildingService } from "@/services/buildingService";
import { locationService } from "@/services/locationService";
import { studentAssignmentService } from "@/services/studentAssignmentService";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
    User,
    MapPin,
    CheckCircle2,
    ArrowRight,
    Loader2,
    AlertCircle,
    Phone,
} from "lucide-react";

const STEPS = { WELCOME: "welcome", PERSONAL: "personal", ADDRESS: "address", DONE: "done" };
const STEP_ORDER = [STEPS.WELCOME, STEPS.PERSONAL, STEPS.ADDRESS, STEPS.DONE];

const genders = ["Male", "Female", "Other"];

export default function WelcomeSetup() {
    const navigate = useNavigate();
    const { user, updateUserProfile } = useAuth();

    const [step, setStep] = useState(STEPS.WELCOME);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");

    // Personal step state
    const [personal, setPersonal] = useState({
        firstName: "",
        lastName: "",
        phone: "",
        dateOfBirth: "",
        gender: "",
        nationality: "Filipino",
    });
    const [personalErrors, setPersonalErrors] = useState({});

    // Address step state
    const [address, setAddress] = useState({
        region: "",
        province: "",
        city: "",
        street: "",
        postalCode: "",
    });
    const [addressErrors, setAddressErrors] = useState({});

    // Location data
    const [regions, setRegions] = useState([]);
    const [provinces, setProvinces] = useState([]);
    const [cities, setCities] = useState([]);
    const [loadingRegions, setLoadingRegions] = useState(false);
    const [loadingProvinces, setLoadingProvinces] = useState(false);
    const [loadingCities, setLoadingCities] = useState(false);

    // Load regions on mount
    useEffect(() => {
        setLoadingRegions(true);
        locationService.getRegions()
            .then(res => setRegions(res.data || []))
            .catch(() => {})
            .finally(() => setLoadingRegions(false));
    }, []);

    // Load provinces when region changes
    useEffect(() => {
        if (!address.region) { setProvinces([]); return; }
        setLoadingProvinces(true);
        setAddress(prev => ({ ...prev, province: "", city: "" }));
        setCities([]);
        locationService.getProvinces(address.region)
            .then(res => setProvinces(res.data || []))
            .catch(() => {})
            .finally(() => setLoadingProvinces(false));
    }, [address.region]);

    // Load cities when province changes
    useEffect(() => {
        if (!address.province) { setCities([]); return; }
        setLoadingCities(true);
        setAddress(prev => ({ ...prev, city: "" }));
        locationService.getCities(address.province)
            .then(res => setCities(res.data || []))
            .catch(() => {})
            .finally(() => setLoadingCities(false));
    }, [address.province]);

    const stepIndex = STEP_ORDER.indexOf(step);

    const setPersonalField = (field, value) => {
        setPersonal(prev => ({ ...prev, [field]: value }));
        if (personalErrors[field]) setPersonalErrors(prev => ({ ...prev, [field]: "" }));
    };

    const setAddressField = (field, value) => {
        setAddress(prev => ({ ...prev, [field]: value }));
        if (addressErrors[field]) setAddressErrors(prev => ({ ...prev, [field]: "" }));
    };

    const validatePersonal = () => {
        const errs = {};
        if (!personal.firstName.trim()) errs.firstName = "First name is required";
        if (!personal.lastName.trim()) errs.lastName = "Last name is required";
        setPersonalErrors(errs);
        return Object.keys(errs).length === 0;
    };

    const validateAddress = () => {
        const errs = {};
        if (!address.region) errs.region = "Region is required";
        if (!address.province) errs.province = "Province is required";
        if (!address.city) errs.city = "City / Municipality is required";
        setAddressErrors(errs);
        return Object.keys(errs).length === 0;
    };

    const handlePersonalContinue = () => {
        if (validatePersonal()) setStep(STEPS.ADDRESS);
    };

    const handleSave = async () => {
        if (!validateAddress()) return;
        setSaving(true);
        setError("");

        try {
            // Send PSGC codes directly — same as Settings does
            const payload = {
                firstName: personal.firstName.trim(),
                lastName: personal.lastName.trim(),
                phone: personal.phone || undefined,
                dateOfBirth: personal.dateOfBirth || undefined,
                gender: personal.gender || undefined,
                nationality: personal.nationality || undefined,
                address: {
                    street: address.street || "",
                    region: address.region,
                    province: address.province,
                    city: address.city,
                    postalCode: address.postalCode || "",
                },
            };

            await userService.updateMe(payload);

            // Update sidebar name immediately using the saved values
            const fullName = [personal.firstName.trim(), personal.lastName.trim()].filter(Boolean).join(" ");
            if (fullName) updateUserProfile({ fullName });

            // Auto-assign preferred building using the same PSGC codes
            try {
                const buildingRes = await buildingService.getRecommended({
                    city: address.city || undefined,
                    province: address.province || undefined,
                    region: address.region || undefined,
                });
                const building = buildingRes?.data;
                if (building?.id) {
                    await studentAssignmentService.updateMine({ preferredBuildingId: building.id }).catch(() => {});
                }
            } catch {
                // Building lookup failure is non-blocking
            }

            // Notify backend — fires the "ProfileCompleted" automation email.
            // Non-blocking: failure here should never block the user from proceeding.
            try { await userService.completeProfile(); } catch { /* ignore */ }

            setStep(STEPS.DONE);
        } catch (err) {
            setError(err?.message || "Failed to save your profile. Please try again.");
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100 flex items-center justify-center p-4">
            <div className="w-full max-w-md">

                {/* Logo */}
                <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-gray-900 text-white font-black text-lg mb-3 shadow-lg">
                        NX
                    </div>
                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest">NexUs Platform</p>
                </div>

                {/* Progress dots */}
                <div className="flex items-center justify-center gap-2 mb-8">
                    {STEP_ORDER.map((s, i) => (
                        <div key={s} className={`transition-all duration-300 rounded-full ${
                            step === s ? "w-6 h-2 bg-gray-900" :
                            stepIndex > i ? "w-2 h-2 bg-gray-400" :
                            "w-2 h-2 bg-gray-200"
                        }`} />
                    ))}
                </div>

                {/* ── WELCOME ── */}
                {step === STEPS.WELCOME && (
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <div className="bg-gradient-to-br from-gray-900 to-gray-700 px-8 py-10 text-center">
                            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-white/10 mb-4 backdrop-blur-sm">
                                <User className="h-8 w-8 text-white" />
                            </div>
                            <h1 className="text-2xl font-bold text-white mb-1">Welcome to NexUs!</h1>
                            <p className="text-gray-300 text-sm">Let's set up your student profile.</p>
                        </div>

                        <div className="px-8 py-8 space-y-6">
                            <div className="flex items-center gap-3 p-4 rounded-xl bg-gray-50 border border-gray-100">
                                <div className="w-8 h-8 rounded-lg bg-gray-900 flex items-center justify-center flex-shrink-0">
                                    <span className="text-white text-xs font-bold">
                                        {user?.email?.[0]?.toUpperCase() || "S"}
                                    </span>
                                </div>
                                <div>
                                    <p className="text-sm font-semibold text-gray-900">{user?.email}</p>
                                    <p className="text-xs text-gray-500">Student account</p>
                                </div>
                            </div>

                            <div className="space-y-3">
                                <p className="text-sm font-semibold text-gray-700">Complete your setup to:</p>
                                {[
                                    "Provide your name and contact details",
                                    "Set your residential address",
                                    "Automatically get assigned your nearest building",
                                ].map((item, i) => (
                                    <div key={i} className="flex items-start gap-2.5">
                                        <CheckCircle2 className="h-4 w-4 text-emerald-500 mt-0.5 flex-shrink-0" />
                                        <p className="text-sm text-gray-600">{item}</p>
                                    </div>
                                ))}
                            </div>

                            <Button
                                className="w-full h-12 font-bold text-sm bg-gray-900 hover:bg-gray-800"
                                onClick={() => setStep(STEPS.PERSONAL)}
                            >
                                Start Setup
                                <ArrowRight className="ml-2 h-4 w-4" />
                            </Button>

                            <button
                                type="button"
                                className="w-full text-sm text-gray-400 hover:text-gray-700 transition-colors py-1"
                                onClick={() => navigate("/dashboardLead")}
                            >
                                Skip for now — some features will be restricted
                            </button>
                        </div>
                    </div>
                )}

                {/* ── PERSONAL ── */}
                {step === STEPS.PERSONAL && (
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <div className="px-8 pt-8 pb-6 border-b border-gray-100">
                            <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-gray-100 mb-4">
                                <User className="h-5 w-5 text-gray-700" />
                            </div>
                            <h2 className="text-xl font-bold text-gray-900">Personal Information</h2>
                            <p className="text-sm text-gray-500 mt-1">Tell us a bit about yourself.</p>
                        </div>

                        <div className="px-8 py-6 space-y-4">
                            {/* First Name */}
                            <div className="space-y-1.5">
                                <Label className="text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                    First Name <span className="text-red-500">*</span>
                                </Label>
                                <Input
                                    value={personal.firstName}
                                    onChange={(e) => setPersonalField("firstName", e.target.value)}
                                    placeholder="John"
                                    className={`h-11 ${personalErrors.firstName ? "border-red-500" : ""}`}
                                />
                                {personalErrors.firstName && (
                                    <p className="text-xs text-red-500">{personalErrors.firstName}</p>
                                )}
                            </div>

                            {/* Last Name */}
                            <div className="space-y-1.5">
                                <Label className="text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                    Last Name <span className="text-red-500">*</span>
                                </Label>
                                <Input
                                    value={personal.lastName}
                                    onChange={(e) => setPersonalField("lastName", e.target.value)}
                                    placeholder="Doe"
                                    className={`h-11 ${personalErrors.lastName ? "border-red-500" : ""}`}
                                />
                                {personalErrors.lastName && (
                                    <p className="text-xs text-red-500">{personalErrors.lastName}</p>
                                )}
                            </div>

                            {/* Phone */}
                            <div className="space-y-1.5">
                                <Label className="text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                    Phone <span className="text-gray-400 font-normal normal-case">(optional)</span>
                                </Label>
                                <div className="relative">
                                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                                    <Input
                                        value={personal.phone}
                                        onChange={(e) => setPersonalField("phone", e.target.value)}
                                        placeholder="0912 345 6789"
                                        className="pl-10 h-11"
                                        maxLength={11}
                                    />
                                </div>
                            </div>

                            {/* Date of Birth */}
                            <div className="space-y-1.5">
                                <Label className="text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                    Date of Birth <span className="text-gray-400 font-normal normal-case">(optional)</span>
                                </Label>
                                <Input
                                    type="date"
                                    value={personal.dateOfBirth}
                                    onChange={(e) => setPersonalField("dateOfBirth", e.target.value)}
                                    className="h-11"
                                    max={new Date().toISOString().split("T")[0]}
                                />
                            </div>

                            {/* Gender */}
                            <div className="space-y-1.5">
                                <Label className="text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                    Gender <span className="text-gray-400 font-normal normal-case">(optional)</span>
                                </Label>
                                <Select value={personal.gender} onValueChange={(v) => setPersonalField("gender", v)}>
                                    <SelectTrigger className="h-11">
                                        <SelectValue placeholder="Select gender" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {genders.map(g => <SelectItem key={g} value={g}>{g}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                            </div>

                            {/* Nationality */}
                            <div className="space-y-1.5">
                                <Label className="text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                    Nationality <span className="text-gray-400 font-normal normal-case">(optional)</span>
                                </Label>
                                <Input
                                    value={personal.nationality}
                                    onChange={(e) => setPersonalField("nationality", e.target.value)}
                                    placeholder="Filipino"
                                    className="h-11"
                                />
                            </div>

                            <div className="flex gap-3 pt-2">
                                <Button
                                    type="button"
                                    variant="outline"
                                    className="flex-1 h-11"
                                    onClick={() => setStep(STEPS.WELCOME)}
                                >
                                    Back
                                </Button>
                                <Button
                                    type="button"
                                    className="flex-1 h-11 font-bold bg-gray-900 hover:bg-gray-800"
                                    onClick={handlePersonalContinue}
                                >
                                    Continue
                                    <ArrowRight className="ml-2 h-4 w-4" />
                                </Button>
                            </div>
                        </div>
                    </div>
                )}

                {/* ── ADDRESS ── */}
                {step === STEPS.ADDRESS && (
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <div className="px-8 pt-8 pb-6 border-b border-gray-100">
                            <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-gray-100 mb-4">
                                <MapPin className="h-5 w-5 text-gray-700" />
                            </div>
                            <h2 className="text-xl font-bold text-gray-900">Residential Address</h2>
                            <p className="text-sm text-gray-500 mt-1">
                                Your building assignment will be automatically determined from this address.
                            </p>
                        </div>

                        <div className="px-8 py-6 space-y-4">
                            {error && (
                                <div className="flex items-start gap-2 p-3 rounded-lg bg-red-50 border border-red-100">
                                    <AlertCircle className="h-4 w-4 text-red-500 flex-shrink-0 mt-0.5" />
                                    <p className="text-sm text-red-600">{error}</p>
                                </div>
                            )}

                            {/* Region */}
                            <div className="space-y-1.5">
                                <Label className="text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                    Region <span className="text-red-500">*</span>
                                </Label>
                                <Select
                                    value={address.region}
                                    onValueChange={(v) => setAddressField("region", v)}
                                    disabled={loadingRegions}
                                >
                                    <SelectTrigger className={`h-11 ${addressErrors.region ? "border-red-500" : ""}`}>
                                        <SelectValue placeholder={loadingRegions ? "Loading..." : "Select region"} />
                                    </SelectTrigger>
                                    <SelectContent className="max-h-[280px]">
                                        {regions.map(r => (
                                            <SelectItem key={r.code} value={r.code}>{r.name}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                {addressErrors.region && <p className="text-xs text-red-500">{addressErrors.region}</p>}
                            </div>

                            {/* Province */}
                            <div className="space-y-1.5">
                                <Label className="text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                    Province <span className="text-red-500">*</span>
                                </Label>
                                <Select
                                    value={address.province}
                                    onValueChange={(v) => setAddressField("province", v)}
                                    disabled={!address.region || loadingProvinces}
                                >
                                    <SelectTrigger className={`h-11 ${addressErrors.province ? "border-red-500" : ""}`}>
                                        <SelectValue placeholder={loadingProvinces ? "Loading..." : "Select province"} />
                                    </SelectTrigger>
                                    <SelectContent className="max-h-[280px]">
                                        {provinces.map(p => (
                                            <SelectItem key={p.code} value={p.code}>{p.name}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                {addressErrors.province && <p className="text-xs text-red-500">{addressErrors.province}</p>}
                            </div>

                            {/* City */}
                            <div className="space-y-1.5">
                                <Label className="text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                    City / Municipality <span className="text-red-500">*</span>
                                </Label>
                                <Select
                                    value={address.city}
                                    onValueChange={(v) => setAddressField("city", v)}
                                    disabled={!address.province || loadingCities}
                                >
                                    <SelectTrigger className={`h-11 ${addressErrors.city ? "border-red-500" : ""}`}>
                                        <SelectValue placeholder={loadingCities ? "Loading..." : "Select city"} />
                                    </SelectTrigger>
                                    <SelectContent className="max-h-[280px]">
                                        {cities.map(c => (
                                            <SelectItem key={c.code} value={c.code}>{c.name}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                {addressErrors.city && <p className="text-xs text-red-500">{addressErrors.city}</p>}
                            </div>

                            {/* Street */}
                            <div className="space-y-1.5">
                                <Label className="text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                    Street / Barangay <span className="text-gray-400 font-normal normal-case">(optional)</span>
                                </Label>
                                <Input
                                    value={address.street}
                                    onChange={(e) => setAddressField("street", e.target.value)}
                                    placeholder="123 Street, Brgy. Name"
                                    className="h-11"
                                />
                            </div>

                            {/* Postal Code */}
                            <div className="space-y-1.5">
                                <Label className="text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                    Postal Code <span className="text-gray-400 font-normal normal-case">(optional)</span>
                                </Label>
                                <Input
                                    value={address.postalCode}
                                    onChange={(e) => setAddressField("postalCode", e.target.value)}
                                    placeholder="1234"
                                    className="h-11"
                                />
                            </div>

                            <div className="flex gap-3 pt-2">
                                <Button
                                    type="button"
                                    variant="outline"
                                    className="flex-1 h-11"
                                    onClick={() => { setError(""); setStep(STEPS.PERSONAL); }}
                                    disabled={saving}
                                >
                                    Back
                                </Button>
                                <Button
                                    type="button"
                                    className="flex-1 h-11 font-bold bg-gray-900 hover:bg-gray-800"
                                    onClick={handleSave}
                                    disabled={saving}
                                >
                                    {saving ? (
                                        <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving…</>
                                    ) : (
                                        <>Save & Complete Setup <ArrowRight className="ml-2 h-4 w-4" /></>
                                    )}
                                </Button>
                            </div>
                        </div>
                    </div>
                )}

                {/* ── DONE ── */}
                {step === STEPS.DONE && (
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <div className="px-8 py-12 text-center space-y-5">
                            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-emerald-50 mx-auto">
                                <CheckCircle2 className="h-10 w-10 text-emerald-500" />
                            </div>
                            <div>
                                <h2 className="text-2xl font-bold text-gray-900">Setup Complete!</h2>
                                <p className="text-sm text-gray-500 mt-2 leading-relaxed">
                                    You now have full access to all features. Submit book requests and enroll in tutoring sessions.
                                </p>
                            </div>
                            <Button
                                className="w-full h-12 font-bold text-sm bg-gray-900 hover:bg-gray-800 mt-2"
                                onClick={() => navigate("/dashboardLead", { replace: true })}
                            >
                                Go to Dashboard
                                <ArrowRight className="ml-2 h-4 w-4" />
                            </Button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
