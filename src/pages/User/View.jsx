import { useEffect, useState } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import AppLayout from "../../layouts/AppLayout";
import { generatePersonalInfoPDF } from "../../utils/pdfExport";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { DetailViewSkeleton } from "../../utils/skeletonLoaders";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { ArrowLeft, Pencil, Trash2, Calendar, Clock, User, Mail, Phone, MapPin, Shield, AlertCircle, CalendarCheck, Save, Loader2 } from "lucide-react";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { userService } from "@/services/userService";
import { locationService } from "@/services/locationService";
import { teacherAvailabilityService } from "@/services/teacherAvailabilityService";
import { availableDayService } from "@/services/availableDayService";
import { availableTimeSlotService } from "@/services/availableTimeSlotService";

export default function UserView() {
    const navigate = useNavigate();
    const { id } = useParams();
    const location = useLocation();

    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [deleteModal, setDeleteModal] = useState(false);

    // Teacher availability editor state
    const [availDays, setAvailDays] = useState([]);
    const [availSlots, setAvailSlots] = useState([]);
    const [checkedSet, setCheckedSet] = useState(new Set()); // "dayId-slotId"
    const [availSaving, setAvailSaving] = useState(false);
    const [availSaveMsg, setAvailSaveMsg] = useState("");

    const goBack = () => {
        if (location.state?.from === "archive") {
            navigate("/users/archive");
        } else {
            navigate("/users");
        }
    };
    const goEdit = () => navigate(`/users/${id}/edit`);

    const handlePrintPDF = () => {
        if (!user) return;

        generatePersonalInfoPDF({
            title: "User Details",
            data: {
                ...user,
                fullName: `${user.firstName} ${user.middleName || ''} ${user.lastName} ${user.suffix || ''}`.replace(/\s+/g, ' ').trim(),
                fullAddress: [user.street, user.city, user.province, user.postalCode].filter(Boolean).join(", "),
            },
            fields: [
                { label: "Full Name", key: "fullName" },
                { label: "Email", key: "email" },
                { label: "Phone", key: "phone" },
                { label: "Role", key: "role" },
                { label: "Gender", key: "gender" },
                { label: "Date of Birth", key: "dateOfBirth" },
                { label: "Nationality", key: "nationality" },
                { label: "Address", key: "fullAddress" },
                { label: "Status", key: "status" },
                { label: "Created At", key: "createdAt" },
                { label: "Created By", key: "createdBy" },
                { label: "Last Updated", key: "updatedAt" },
                { label: "Updated By", key: "updatedBy" },
            ],
            companyName: "User Management System",
            headerInfo: { name: `${user.firstName} ${user.lastName}` },
        });
    };

    // Address Resolution
    const [addressText, setAddressText] = useState("");

    useEffect(() => {
        loadUser();
    }, [id]);

    useEffect(() => {
        if (user && user.address) {
            resolveAddress(user.address);
        }
    }, [user]);

    const resolveAddress = async (addr) => {
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
            setAddressText([addr.streetBarangay, addr.cityMunicipality, addr.province, addr.region, addr.postal].filter(Boolean).join(", "));
        }
    };

    const loadUser = async () => {
        setLoading(true);
        setError("");

        try {
            const response = await userService.getById(id);
            const data = response.data;

            // Map backend DTO to frontend display format
            const mappedData = {
                id: data.id,
                firstName: data.firstName,
                middleName: data.middleName || "",
                lastName: data.lastName,
                suffix: data.suffix || "",
                email: data.email,
                phone: data.phone,
                role: data.roles?.[0]?.name || "No Role",
                dateOfBirth: data.dateOfBirth,
                gender: data.gender,
                nationality: data.nationality,
                address: data.address,
                status: data.deletedAt ? "Archived" : "Active",
                createdAt: data.createdAt,
                updatedAt: data.updatedAt,
                createdBy: data.createdByName || "System",
                updatedBy: data.updatedByName || "System",
            };

            setUser(mappedData);

            // If teacher, load days/slots/existing availability
            if (data.roles?.[0]?.name === "Teacher") {
                const [daysRes, slotsRes, availRes] = await Promise.all([
                    availableDayService.getAll({ pageSize: 200 }),
                    availableTimeSlotService.getAll({ pageSize: 200 }),
                    teacherAvailabilityService.getByTeacher(data.id),
                ]);
                const extractItems = (res) => {
                    const d = res.data?.data || res.data;
                    return d?.items || d || [];
                };
                setAvailDays(extractItems(daysRes));
                setAvailSlots(extractItems(slotsRes));
                const savedSlots = availRes.data?.data?.slots || availRes.data?.slots || [];
                setCheckedSet(new Set(savedSlots.map(s => `${s.dayId}-${s.timeSlotId}`)));
            }
        } catch (err) {
            setError(err.message || "Failed to load user");
            console.error("Error loading user:", err);
        } finally {
            setLoading(false);
        }
    };

    const toggleSlot = (dayId, slotId) => {
        const key = `${dayId}-${slotId}`;
        setCheckedSet(prev => {
            const next = new Set(prev);
            next.has(key) ? next.delete(key) : next.add(key);
            return next;
        });
    };

    const toggleDayAll = (dayId) => {
        const daySlotKeys = availSlots.map(s => `${dayId}-${s.id}`);
        const allChecked = daySlotKeys.every(k => checkedSet.has(k));
        setCheckedSet(prev => {
            const next = new Set(prev);
            daySlotKeys.forEach(k => allChecked ? next.delete(k) : next.add(k));
            return next;
        });
    };

    const saveAvailability = async () => {
        setAvailSaving(true);
        setAvailSaveMsg("");
        try {
            const slots = [...checkedSet].map(key => {
                const [dayId, timeSlotId] = key.split("-").map(Number);
                return { dayId, timeSlotId };
            });
            await teacherAvailabilityService.setAvailability(user.id, slots);
            setAvailSaveMsg("Availability saved successfully.");
        } catch (err) {
            const msg = err.response?.data?.message;
            setAvailSaveMsg(msg || "Failed to save availability.");
        } finally {
            setAvailSaving(false);
        }
    };

    useEffect(() => {
        loadUser();
    }, [id]);

    const confirmDelete = () => {
        setDeleteModal(false);
        navigate("/users");
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

    const formatDate = (dateString) => {
        if (!dateString) return "—";
        const date = new Date(dateString);
        return date.toLocaleDateString("en-US", {
            year: "numeric",
            month: "long",
            day: "numeric",
        });
    };

    return (
        <AppLayout title="View User" onPrint={user ? handlePrintPDF : undefined}>
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
                    <DetailViewSkeleton fields={10} />
                ) : user ? (
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
                                    <TooltipContent>Back to users</TooltipContent>
                                </Tooltip>
                                <div>
                                    <h1 className="text-3xl font-bold text-gray-900">User Details</h1>
                                    <p className="mt-1 text-sm text-gray-600">
                                        View detailed information about this user
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
                                            <h2 className="text-2xl font-bold text-gray-900">
                                                {user.firstName} {user.middleName} {user.lastName} {user.suffix}
                                            </h2>
                                            <Badge variant="default" className="bg-green-600">
                                                {user.status}
                                            </Badge>
                                        </div>
                                        <div className="flex items-center gap-2 text-gray-700">
                                            <Mail className="h-4 w-4" />
                                            <span>{user.email}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Details Section */}
                            <div className="p-6">
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-x-6 gap-y-5">
                                    {/* Email */}
                                    <div className="space-y-1.5">
                                        <div className="flex items-center gap-2 text-sm font-medium text-gray-500">
                                            <Mail className="h-4 w-4" />
                                            <span>Email Address</span>
                                        </div>
                                        <p className="text-sm text-gray-900 font-medium">{user.email}</p>
                                    </div>

                                    {/* Phone */}
                                    <div className="space-y-1.5">
                                        <div className="flex items-center gap-2 text-sm font-medium text-gray-500">
                                            <Phone className="h-4 w-4" />
                                            <span>Phone Number</span>
                                        </div>
                                        <p className="text-sm text-gray-900">{user.phone || "—"}</p>
                                    </div>

                                    {/* Role */}
                                    <div className="space-y-1.5">
                                        <div className="flex items-center gap-2 text-sm font-medium text-gray-500">
                                            <Shield className="h-4 w-4" />
                                            <span>Role</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Badge variant="outline" className="text-sm px-2.5 py-0.5">
                                                {user.role}
                                            </Badge>
                                        </div>
                                    </div>

                                    {/* Gender */}
                                    <div className="space-y-1.5">
                                        <div className="flex items-center gap-2 text-sm font-medium text-gray-500">
                                            <User className="h-4 w-4" />
                                            <span>Gender</span>
                                        </div>
                                        <p className="text-sm text-gray-900">{user.gender || "—"}</p>
                                    </div>

                                    {/* Date of Birth */}
                                    <div className="space-y-1.5">
                                        <div className="flex items-center gap-2 text-sm font-medium text-gray-500">
                                            <Calendar className="h-4 w-4" />
                                            <span>Date of Birth</span>
                                        </div>
                                        <p className="text-sm text-gray-900">{formatDate(user.dateOfBirth)}</p>
                                    </div>

                                    {/* Nationality */}
                                    <div className="space-y-1.5">
                                        <div className="flex items-center gap-2 text-sm font-medium text-gray-500">
                                            <User className="h-4 w-4" />
                                            <span>Nationality</span>
                                        </div>
                                        <p className="text-sm text-gray-900">{user.nationality || "—"}</p>
                                    </div>

                                    {/* Address */}
                                    <div className="space-y-1.5 md:col-span-3">
                                        <div className="flex items-center gap-2 text-sm font-medium text-gray-500">
                                            <MapPin className="h-4 w-4" />
                                            <span>Address</span>
                                        </div>
                                        <p className="text-sm text-gray-900">
                                            {addressText || "—"}
                                        </p>
                                    </div>

                                    {/* Created At */}
                                    <div className="space-y-1.5">
                                        <div className="flex items-center gap-2 text-sm font-medium text-gray-500">
                                            <Calendar className="h-4 w-4" />
                                            <span>Created At</span>
                                        </div>
                                        <p className="text-sm text-gray-900">{formatDateTime(user.createdAt)}</p>
                                        <p className="text-xs text-gray-500">by {user.createdBy}</p>
                                    </div>

                                    {/* Updated At - Highlighted */}
                                    <div className="space-y-1.5 md:col-span-2">
                                        <div className="flex items-center gap-2 text-sm font-medium text-gray-700">
                                            <Clock className="h-4 w-4" />
                                            <span>Last Updated</span>
                                        </div>
                                        <div className="bg-gray-50 border border-gray-200 rounded-lg p-2.5">
                                            <p className="text-sm text-gray-900 font-semibold">
                                                {formatDateTime(user.updatedAt)}
                                            </p>
                                            <p className="text-xs text-gray-600">by {user.updatedBy}</p>
                                        </div>
                                    </div>
                                </div>

                                <Separator className="my-6" />

                                {/* Teacher Availability Editor */}
                                {user.role === "Teacher" && availDays.length > 0 && (
                                    <div className="space-y-4">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-2">
                                                <CalendarCheck className="h-4 w-4 text-indigo-500" />
                                                <h3 className="text-sm font-semibold text-gray-900">Teaching Availability</h3>
                                            </div>
                                            <Button
                                                size="sm"
                                                onClick={saveAvailability}
                                                disabled={availSaving}
                                                className="gap-2"
                                            >
                                                {availSaving
                                                    ? <><Loader2 className="h-3.5 w-3.5 animate-spin" />Saving...</>
                                                    : <><Save className="h-3.5 w-3.5" />Save Availability</>}
                                            </Button>
                                        </div>

                                        {availSaveMsg && (
                                            <p className={`text-xs font-medium ${availSaveMsg.includes("successfully") ? "text-green-600" : "text-red-500"
                                                }`}>{availSaveMsg}</p>
                                        )}

                                        <p className="text-xs text-gray-500">
                                            Check the day+time combinations this teacher is available to teach.
                                            The admin scheduling form will only show these slots.
                                        </p>

                                        {/* Grid: rows = days, cols = timeslots */}
                                        <div className="overflow-x-auto">
                                            <table className="w-full text-xs border-collapse">
                                                <thead>
                                                    <tr className="bg-gray-50">
                                                        <th className="text-left p-2 border text-gray-600 font-medium w-28">Day \ Time</th>
                                                        {availSlots.map(s => (
                                                            <th key={s.id} className="p-2 border text-center text-gray-600 font-medium whitespace-nowrap">
                                                                {s.startTime}
                                                                {s.endTime && <span className="block text-gray-400">{s.endTime}</span>}
                                                            </th>
                                                        ))}
                                                        <th className="p-2 border text-center text-gray-500 font-medium">All</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {availDays.map(d => {
                                                        const daySlotKeys = availSlots.map(s => `${d.id}-${s.id}`);
                                                        const allChecked = daySlotKeys.every(k => checkedSet.has(k));
                                                        return (
                                                            <tr key={d.id} className="hover:bg-gray-50">
                                                                <td className="p-2 border font-medium text-gray-700">{d.dayName || d.name}</td>
                                                                {availSlots.map(s => (
                                                                    <td key={s.id} className="p-2 border text-center">
                                                                        <Checkbox
                                                                            checked={checkedSet.has(`${d.id}-${s.id}`)}
                                                                            onCheckedChange={() => toggleSlot(d.id, s.id)}
                                                                        />
                                                                    </td>
                                                                ))}
                                                                <td className="p-2 border text-center">
                                                                    <Checkbox
                                                                        checked={allChecked}
                                                                        onCheckedChange={() => toggleDayAll(d.id)}
                                                                        className="border-indigo-400"
                                                                    />
                                                                </td>
                                                            </tr>
                                                        );
                                                    })}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                )}

                                <Separator className="my-6" />

                                {/* Actions */}
                                <div className="flex items-center justify-end gap-3">
                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <Button variant="outline" onClick={goEdit}>
                                                <Pencil className="h-4 w-4 mr-2" />
                                                Edit User
                                            </Button>
                                        </TooltipTrigger>
                                        <TooltipContent>Edit this user</TooltipContent>
                                    </Tooltip>
                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <Button
                                                variant="outline"
                                                onClick={() => setDeleteModal(true)}
                                                className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                            >
                                                <Trash2 className="h-4 w-4 mr-2" />
                                                Delete User
                                            </Button>
                                        </TooltipTrigger>
                                        <TooltipContent>Delete this user</TooltipContent>
                                    </Tooltip>
                                </div>
                            </div>
                        </div>
                    </div>
                ) : !loading && !error ? (
                    <Alert>
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription>User not found.</AlertDescription>
                    </Alert>
                ) : null}
            </div>

            {/* Delete Confirmation */}
            <AlertDialog open={deleteModal} onOpenChange={setDeleteModal}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Confirm Delete</AlertDialogTitle>
                        <AlertDialogDescription>
                            Are you sure you want to delete the user{" "}
                            <span className="font-semibold">{user?.firstName} {user?.lastName}</span>? This action will move them to
                            the archive.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={confirmDelete}
                            className="bg-red-600 hover:bg-red-700"
                        >
                            Delete
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </AppLayout>
    );
}
