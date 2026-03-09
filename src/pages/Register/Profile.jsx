import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { userService } from "../../services/userService";
import LandingLayout from "../../layouts/LandingLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { User, Phone, MapPin, ClipboardList, Star, ArrowRight, Loader2, SkipForward, CheckCircle2 } from "lucide-react";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { locationService } from "@/services/locationService";
import { studentAssignmentService } from "@/services/studentAssignmentService";
import { lettersOnly, philippinePhoneNumber } from "../../utils/inputValidation";
import LandingImg from "../../assets/LandingPage_Home.png";

export default function ProfileCompletion() {
    const navigate = useNavigate();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [currentStep, setCurrentStep] = useState(1);
    const totalSteps = 3;

    // Form Data
    const [formData, setFormData] = useState({
        firstName: "",
        middleName: "",
        lastName: "",
        suffix: "",
        dateOfBirth: "",
        gender: "",
        nationality: "Filipino",
        phone: "",
        street: "",
        region: "",
        province: "",
        city: "",
        postalCode: "",
        notes: ""
    });

    // PH Locations State
    const [regions, setRegions] = useState([]);
    const [provinces, setProvinces] = useState([]);
    const [cities, setCities] = useState([]);
    const [loadingRegions, setLoadingRegions] = useState(false);
    const [loadingProvinces, setLoadingProvinces] = useState(false);
    const [loadingCities, setLoadingCities] = useState(false);

    useEffect(() => {
        const loadInitialData = async () => {
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
        loadInitialData();
    }, []);

    useEffect(() => {
        if (formData.region) {
            const loadProv = async () => {
                setLoadingProvinces(true);
                try {
                    const res = await locationService.getProvinces(formData.region);
                    setProvinces(res.data || []);
                    setFormData(prev => ({ ...prev, province: "", city: "" }));
                } finally {
                    setLoadingProvinces(false);
                }
            };
            loadProv();
        }
    }, [formData.region]);

    useEffect(() => {
        if (formData.province) {
            const loadCity = async () => {
                setLoadingCities(true);
                try {
                    const res = await locationService.getCities(formData.province);
                    setCities(res.data || []);
                    setFormData(prev => ({ ...prev, city: "" }));
                } finally {
                    setLoadingCities(false);
                }
            };
            loadCity();
        }
    }, [formData.province]);

    const handleInputChange = (field, value) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            // Build update payload
            const payload = {
                firstName: formData.firstName || undefined,
                lastName: formData.lastName || undefined,
                middleName: formData.middleName || undefined,
                suffix: formData.suffix || undefined,
                dateOfBirth: formData.dateOfBirth || undefined,
                gender: formData.gender || undefined,
                nationality: formData.nationality || undefined,
                phone: formData.phone || undefined,
            };

            // Add address if any location fields are filled
            if (formData.street || formData.region || formData.province || formData.city) {
                payload.address = {
                    street: formData.street || "",
                    region: formData.region || "",
                    province: formData.province || "",
                    city: formData.city || "",
                    postalCode: formData.postalCode || "",
                };
            }

            await userService.updateMe(payload);

            // Save notes to StudentAssignment
            if (formData.notes) {
                await studentAssignmentService.updateMine({ notes: formData.notes }).catch(() => {});
            }

            navigate("/dashboardLead");
        } catch (err) {
            console.error("Profile update failed:", err);
            // Still navigate on error — profile completion is optional
            navigate("/dashboardLead");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleSkip = () => {
        navigate("/dashboardLead");
    };

    const suffixes = ["Jr.", "Sr.", "II", "III", "IV", "V"];
    const genders = ["Male", "Female", "Other"];

    const nextStep = () => {
        if (currentStep < totalSteps) {
            setCurrentStep(prev => prev + 1);
            window.scrollTo({ top: 0, behavior: "smooth" });
        }
    };

    const prevStep = () => {
        if (currentStep > 1) {
            setCurrentStep(prev => prev - 1);
            window.scrollTo({ top: 0, behavior: "smooth" });
        }
    };

    const getStepTitle = () => {
        switch (currentStep) {
            case 1: return "Basic Information";
            case 2: return "Address Details";
            case 3: return "Notes & Preferences";
            default: return "";
        }
    };

    return (
        <LandingLayout>
            <div className="min-h-[calc(100vh-3.5rem)] flex items-center justify-center p-4">
                <div className="w-full max-w-6xl grid lg:grid-cols-2 gap-8 items-start py-8">
                    {/* Left Side - Branding */}
                    <div className="hidden lg:block space-y-8 sticky top-24">
                        <div className="space-y-4">
                            <div className="flex items-center gap-3">
                                <Avatar className="h-12 w-12 rounded-xl">
                                    <AvatarFallback className="bg-gradient-to-br from-gray-900 to-gray-700 text-white rounded-xl">
                                        <Star className="h-6 w-6" />
                                    </AvatarFallback>
                                </Avatar>
                                <div>
                                    <p className="text-2xl font-bold text-gray-900 leading-tight">Teach. Learn. Grow.</p>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Badge variant="secondary" className="w-fit">
                                    <User className="h-3 w-3 mr-1" />
                                    Profile Completion
                                </Badge>
                                <h2 className="text-4xl font-bold text-gray-900 leading-tight">
                                    Tell us more about yourself
                                </h2>
                                <p className="text-gray-600 font-medium">
                                    Completing your profile helps us provide a better experience. This is entirely optional and you can always do it later.
                                </p>
                            </div>
                        </div>

                        <Card className="border-2 shadow-lg overflow-hidden">
                            <CardContent className="p-0">
                                <img
                                    src={LandingImg}
                                    alt="Profile illustration"
                                    className="w-full h-auto object-cover"
                                />
                            </CardContent>
                        </Card>
                    </div>

                    {/* Right Side - Profile Form */}
                    <Card className="relative w-full mx-auto shadow-xl border-2 overflow-hidden flex flex-col min-h-[700px] bg-white">
                        {/* Progressive Header Line - Pinned to absolute top */}
                        <div className="absolute top-0 left-0 right-0 h-1 bg-gray-100">
                            <div
                                className="h-full bg-gray-900 transition-all duration-1000 ease-in-out"
                                style={{ width: `${(currentStep / totalSteps) * 100}%` }}
                            />
                        </div>

                        <CardHeader className="space-y-2 px-8 pt-8">
                            <div className="flex items-start justify-between">
                                <div className="space-y-2">
                                    <div className="flex items-center gap-2">
                                        <Badge variant="secondary" className="px-2 py-0.5 rounded-md text-[10px] uppercase font-bold tracking-widest border-none">
                                            Step {currentStep} of 3
                                        </Badge>
                                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                                            {getStepTitle()}
                                        </span>
                                    </div>
                                    <CardTitle className="text-2xl font-bold">Complete your profile</CardTitle>
                                    <CardDescription className="text-base">
                                        Optional steps to personalize your experience
                                    </CardDescription>
                                </div>
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    onClick={handleSkip}
                                    className="text-gray-400 hover:text-gray-900 hover:bg-gray-50 -mt-1 transition-all group"
                                >
                                    Skip <SkipForward className="ml-2 h-4 w-4 group-hover:translate-x-0.5 transition-transform" />
                                </Button>
                            </div>
                        </CardHeader>

                        <CardContent className="px-8 pb-8 flex-grow">
                            <form onSubmit={handleSubmit} className="h-full flex flex-col">
                                <div className="flex-grow">
                                    {currentStep === 1 && (
                                        <div className="space-y-10 animate-in fade-in slide-in-from-right-4 duration-500">
                                            <div className="space-y-6">
                                                <div className="flex items-center gap-3 text-gray-900">
                                                    <div className="h-10 w-10 rounded-xl bg-gray-50 flex items-center justify-center border-2 border-gray-100/50 shadow-sm">
                                                        <User className="h-5 w-5 text-gray-600" />
                                                    </div>
                                                    <h3 className="text-lg font-bold tracking-tight">Personal Information</h3>
                                                </div>

                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
                                                    <div className="space-y-2">
                                                        <Label htmlFor="firstName" className="text-sm font-semibold">First Name</Label>
                                                        <Input
                                                            id="firstName"
                                                            placeholder="John"
                                                            value={formData.firstName}
                                                            onChange={(e) => handleInputChange("firstName", lettersOnly(e.target.value))}
                                                            className="h-12 text-base transition-all focus:ring-2 focus:ring-gray-900/10"
                                                        />
                                                        <p className="text-[10px] text-gray-400">Example: John</p>
                                                    </div>
                                                    <div className="space-y-2">
                                                        <Label htmlFor="lastName" className="text-sm font-semibold">Last Name</Label>
                                                        <Input
                                                            id="lastName"
                                                            placeholder="Doe"
                                                            value={formData.lastName}
                                                            onChange={(e) => handleInputChange("lastName", lettersOnly(e.target.value))}
                                                            className="h-12 text-base transition-all focus:ring-2 focus:ring-gray-900/10"
                                                        />
                                                        <p className="text-[10px] text-gray-400">Example: Doe</p>
                                                    </div>
                                                    <div className="space-y-2">
                                                        <Label htmlFor="middleName" className="text-sm font-semibold">
                                                            Middle Name <span className="text-gray-400 font-normal">(optional)</span>
                                                        </Label>
                                                        <Input
                                                            id="middleName"
                                                            placeholder="Santos"
                                                            value={formData.middleName}
                                                            onChange={(e) => handleInputChange("middleName", lettersOnly(e.target.value))}
                                                            className="h-12 text-base transition-all focus:ring-2 focus:ring-gray-900/10"
                                                        />
                                                    </div>
                                                    <div className="space-y-2">
                                                        <Label htmlFor="suffix" className="text-sm font-semibold">
                                                            Suffix <span className="text-gray-400 font-normal">(optional)</span>
                                                        </Label>
                                                        <Select
                                                            value={formData.suffix}
                                                            onValueChange={(v) => handleInputChange("suffix", v)}
                                                        >
                                                            <SelectTrigger id="suffix" className="h-12 text-base">
                                                                <SelectValue placeholder="Select suffix" />
                                                            </SelectTrigger>
                                                            <SelectContent>
                                                                {suffixes.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                                                            </SelectContent>
                                                        </Select>
                                                    </div>
                                                    <div className="space-y-2">
                                                        <Label htmlFor="dateOfBirth" className="text-sm font-semibold">
                                                            Date of Birth <span className="text-gray-400 font-normal">(optional)</span>
                                                        </Label>
                                                        <Input
                                                            id="dateOfBirth"
                                                            type="date"
                                                            value={formData.dateOfBirth}
                                                            onChange={(e) => handleInputChange("dateOfBirth", e.target.value)}
                                                            className="h-12 text-base transition-all focus:ring-2 focus:ring-gray-900/10"
                                                            max={new Date().toISOString().split('T')[0]}
                                                        />
                                                    </div>
                                                    <div className="space-y-2">
                                                        <Label htmlFor="gender" className="text-sm font-semibold">
                                                            Gender <span className="text-gray-400 font-normal">(optional)</span>
                                                        </Label>
                                                        <Select
                                                            value={formData.gender}
                                                            onValueChange={(v) => handleInputChange("gender", v)}
                                                        >
                                                            <SelectTrigger id="gender" className="h-12 text-base">
                                                                <SelectValue placeholder="Select gender" />
                                                            </SelectTrigger>
                                                            <SelectContent>
                                                                {genders.map(g => <SelectItem key={g} value={g}>{g}</SelectItem>)}
                                                            </SelectContent>
                                                        </Select>
                                                    </div>
                                                    <div className="space-y-2">
                                                        <Label htmlFor="nationality" className="text-sm font-semibold">
                                                            Nationality <span className="text-gray-400 font-normal">(optional)</span>
                                                        </Label>
                                                        <Input
                                                            id="nationality"
                                                            placeholder="Filipino"
                                                            value={formData.nationality}
                                                            onChange={(e) => handleInputChange("nationality", lettersOnly(e.target.value))}
                                                            className="h-12 text-base transition-all focus:ring-2 focus:ring-gray-900/10"
                                                        />
                                                    </div>
                                                    <div className="space-y-2">
                                                        <Label htmlFor="phone" className="text-sm font-semibold">
                                                            Phone Number <span className="text-gray-400 font-normal">(optional)</span>
                                                        </Label>
                                                        <div className="relative">
                                                            <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                                                            <Input
                                                                id="phone"
                                                                className="pl-10 h-12 text-base transition-all focus:ring-2 focus:ring-gray-900/10"
                                                                placeholder="0912 345 6789"
                                                                value={formData.phone}
                                                                onChange={(e) => handleInputChange("phone", philippinePhoneNumber(e.target.value))}
                                                                maxLength={11}
                                                            />
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {currentStep === 2 && (
                                        <div className="space-y-10 animate-in fade-in slide-in-from-right-4 duration-500">
                                            <div className="space-y-6">
                                                <div className="flex items-center gap-3 text-gray-900">
                                                    <div className="h-10 w-10 rounded-xl bg-gray-50 flex items-center justify-center border-2 border-gray-100/50 shadow-sm">
                                                        <MapPin className="h-5 w-5 text-gray-600" />
                                                    </div>
                                                    <h3 className="text-lg font-bold tracking-tight">Location Details</h3>
                                                </div>

                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
                                                    <div className="space-y-2 md:col-span-2">
                                                        <Label htmlFor="street" className="text-sm font-semibold">
                                                            Street / Barangay <span className="text-gray-400 font-normal">(optional)</span>
                                                        </Label>
                                                        <Input
                                                            id="street"
                                                            placeholder="123 Street, Brgy. Name"
                                                            value={formData.street}
                                                            onChange={(e) => handleInputChange("street", e.target.value)}
                                                            className="h-12 text-base transition-all focus:ring-2 focus:ring-gray-900/10"
                                                        />
                                                    </div>
                                                    <div className="space-y-2">
                                                        <Label htmlFor="region" className="text-sm font-semibold">
                                                            Region <span className="text-gray-400 font-normal">(optional)</span>
                                                        </Label>
                                                        <Select value={formData.region} onValueChange={(v) => handleInputChange("region", v)}>
                                                            <SelectTrigger id="region" className="h-12 text-base">
                                                                <SelectValue placeholder={loadingRegions ? "Loading..." : "Select Region"} />
                                                            </SelectTrigger>
                                                            <SelectContent className="max-h-[300px]">
                                                                {regions.map(r => <SelectItem key={r.code} value={r.code}>{r.name}</SelectItem>)}
                                                            </SelectContent>
                                                        </Select>
                                                    </div>
                                                    <div className="space-y-2">
                                                        <Label htmlFor="province" className="text-sm font-semibold">
                                                            Province <span className="text-gray-400 font-normal">(optional)</span>
                                                        </Label>
                                                        <Select
                                                            value={formData.province}
                                                            onValueChange={(v) => handleInputChange("province", v)}
                                                            disabled={!formData.region || loadingProvinces}
                                                        >
                                                            <SelectTrigger id="province" className="h-12 text-base">
                                                                <SelectValue placeholder={loadingProvinces ? "Loading..." : "Select Province"} />
                                                            </SelectTrigger>
                                                            <SelectContent className="max-h-[300px]">
                                                                {provinces.map(p => <SelectItem key={p.code} value={p.code}>{p.name}</SelectItem>)}
                                                            </SelectContent>
                                                        </Select>
                                                    </div>
                                                    <div className="space-y-2">
                                                        <Label htmlFor="city" className="text-sm font-semibold">
                                                            City / Municipality <span className="text-gray-400 font-normal">(optional)</span>
                                                        </Label>
                                                        <Select
                                                            value={formData.city}
                                                            onValueChange={(v) => handleInputChange("city", v)}
                                                            disabled={!formData.province || loadingCities}
                                                        >
                                                            <SelectTrigger id="city" className="h-12 text-base">
                                                                <SelectValue placeholder={loadingCities ? "Loading..." : "Select City"} />
                                                            </SelectTrigger>
                                                            <SelectContent className="max-h-[300px]">
                                                                {cities.map(c => <SelectItem key={c.code} value={c.code}>{c.name}</SelectItem>)}
                                                            </SelectContent>
                                                        </Select>
                                                    </div>
                                                    <div className="space-y-2">
                                                        <Label htmlFor="postalCode" className="text-sm font-semibold">
                                                            Postal Code <span className="text-gray-400 font-normal">(optional)</span>
                                                        </Label>
                                                        <Input
                                                            id="postalCode"
                                                            placeholder="1234"
                                                            value={formData.postalCode}
                                                            onChange={(e) => handleInputChange("postalCode", e.target.value)}
                                                            className="h-12 text-base transition-all focus:ring-2 focus:ring-gray-900/10"
                                                        />
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {currentStep === 3 && (
                                        <div className="space-y-10 animate-in fade-in slide-in-from-right-4 duration-500">
                                            <div className="space-y-6">
                                                <div className="flex items-center gap-3 text-gray-900">
                                                    <div className="h-10 w-10 rounded-xl bg-gray-50 flex items-center justify-center border-2 border-gray-100/50 shadow-sm">
                                                        <ClipboardList className="h-5 w-5 text-gray-600" />
                                                    </div>
                                                    <h3 className="text-lg font-bold tracking-tight">Preferences</h3>
                                                </div>

                                                <div className="space-y-4">
                                                    <Label htmlFor="notes" className="text-sm font-semibold">
                                                        Learning Goals or Interests <span className="text-gray-400 font-normal">(optional)</span>
                                                    </Label>
                                                    <Textarea
                                                        id="notes"
                                                        className="min-h-[220px] text-base transition-all focus:ring-2 focus:ring-gray-900/10 leading-relaxed"
                                                        placeholder="What would you like to achieve?"
                                                        value={formData.notes}
                                                        onChange={(e) => handleInputChange("notes", e.target.value)}
                                                    />
                                                    <div className="bg-gray-50 border rounded-xl p-4 flex gap-3 items-center">
                                                        <Star className="h-4 w-4 text-gray-400 fill-gray-400" />
                                                        <p className="text-xs text-gray-500 font-medium">
                                                            Tip: Sharing your goals helps us match you with the best tutors.
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-10 border-t border-gray-100 mt-auto">
                                    <div className="flex items-center gap-4 w-full sm:w-auto">
                                        {currentStep > 1 && (
                                            <Button
                                                key="back-btn"
                                                type="button"
                                                variant="ghost"
                                                className="h-12 px-8 font-bold text-gray-500 hover:text-gray-900 hover:bg-gray-100 transition-all border-2 border-transparent hover:border-gray-200"
                                                onClick={prevStep}
                                                disabled={isSubmitting}
                                            >
                                                Back
                                            </Button>
                                        )}

                                        {currentStep === 1 && (
                                            <Button
                                                type="button"
                                                variant="ghost"
                                                className="h-12 px-6 font-bold text-gray-400 hover:text-gray-900 transition-all group"
                                                onClick={handleSkip}
                                            >
                                                Finish later
                                            </Button>
                                        )}
                                    </div>

                                    <div className="w-full sm:w-auto min-w-[200px]">
                                        {currentStep < totalSteps ? (
                                            <Button
                                                key="next-btn"
                                                type="button"
                                                className="w-full h-12 text-base font-semibold shadow-lg hover:shadow-xl transition-all"
                                                onClick={nextStep}
                                            >
                                                Next Step
                                                <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                                            </Button>
                                        ) : (
                                            <Button
                                                key="submit-btn"
                                                type="submit"
                                                className="w-full h-12 text-base font-semibold shadow-lg hover:shadow-xl transition-all"
                                                disabled={isSubmitting}
                                            >
                                                {isSubmitting ? (
                                                    <>
                                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                                        Saving...
                                                    </>
                                                ) : (
                                                    <>
                                                        Complete Profile
                                                        <CheckCircle2 className="ml-2 h-4 w-4" />
                                                    </>
                                                )}
                                            </Button>
                                        )}
                                    </div>
                                </div>
                            </form>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </LandingLayout>
    );
}
