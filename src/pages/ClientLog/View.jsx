import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { userService } from "../../services/userService";
import AppLayout from "../../layouts/AppLayout";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, AlertCircle, User, Mail, Calendar, Building2, BookOpen, Clock } from "lucide-react";

/* ── Status colours ────────────────────────────────────────────────────── */
const getStatusColor = (s) => {
    switch (s) {
        case "Confirmed": return "bg-emerald-100 text-emerald-700 border-emerald-200";
        case "Pending Teacher Interest": return "bg-indigo-100 text-indigo-700 border-indigo-200";
        case "Teacher Assigned": return "bg-purple-100 text-purple-700 border-purple-200";
        case "Waiting for Teacher Approval": return "bg-amber-100 text-amber-700 border-amber-200";
        case "Waiting for Admin Approval": return "bg-orange-100 text-orange-700 border-orange-200";
        case "Cancelled by Student":
        case "Cancelled by Admin": return "bg-red-100 text-red-700 border-red-200";
        default: return "bg-gray-100 text-gray-700 border-gray-200";
    }
};

const getRoleColor = (roles = "") => {
    if (roles.includes("Customer")) return "bg-emerald-100 text-emerald-700 border-emerald-200";
    if (roles.includes("Lead")) return "bg-amber-100 text-amber-700 border-amber-200";
    return "bg-gray-100 text-gray-700 border-gray-200";
};

const formatDateTime = (d) => {
    if (!d) return "—";
    return new Date(d).toLocaleString("en-US", {
        year: "numeric", month: "short", day: "numeric",
        hour: "2-digit", minute: "2-digit",
    });
};

const formatDate = (d) => {
    if (!d) return "—";
    return new Date(d).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
};

/* ── Reusable Info Card ─────────────────────────────────────────────────── */
function InfoItem({ icon: Icon, label, value }) {
    return (
        <div className="flex items-start gap-3">
            <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gray-100">
                <Icon className="h-4 w-4 text-gray-500" />
            </div>
            <div>
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">{label}</p>
                <p className="mt-0.5 text-sm font-semibold text-gray-900">{value || "—"}</p>
            </div>
        </div>
    );
}

export default function ClientLogView() {
    const { id } = useParams();
    const navigate = useNavigate();

    const [client, setClient] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        (async () => {
            setLoading(true);
            setError("");
            try {
                const res = await userService.getClientDetail(id);
                const data = res.data?.data || res.data;
                setClient(data);
            } catch (err) {
                console.error(err);
                setError(err.response?.data?.message || err.message || "Failed to load client details");
            } finally {
                setLoading(false);
            }
        })();
    }, [id]);

    if (loading) {
        return (
            <AppLayout title="Client Details">
                <div className="space-y-6">
                    <Skeleton className="h-8 w-48" />
                    <Skeleton className="h-40 w-full rounded-lg" />
                    <Skeleton className="h-64 w-full rounded-lg" />
                    <Skeleton className="h-64 w-full rounded-lg" />
                </div>
            </AppLayout>
        );
    }

    if (error || !client) {
        return (
            <AppLayout title="Client Details">
                <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{error || "Client not found."}</AlertDescription>
                </Alert>
                <Button variant="outline" className="mt-4" onClick={() => navigate("/client-log")}>
                    <ArrowLeft className="h-4 w-4 mr-2" /> Back to Client Log
                </Button>
            </AppLayout>
        );
    }

    const ongoing = client.ongoingSessions ?? [];
    const transactions = client.transactions ?? [];

    return (
        <AppLayout title="Client Details">
            <div className="space-y-6">

                {/* Back button */}
                <Button
                    variant="outline"
                    size="sm"
                    onClick={() => navigate("/client-log")}
                    className="flex items-center gap-2"
                >
                    <ArrowLeft className="h-4 w-4" /> Back to Client Log
                </Button>

                {/* ── Section 1: Profile ────────────────────────────────────── */}
                <div className="rounded-lg border bg-white p-6">
                    <div className="flex items-center justify-between mb-5">
                        <h2 className="text-lg font-semibold text-gray-900">Profile Information</h2>
                        <Badge className={`text-xs font-medium px-3 py-1 border rounded-full ${getRoleColor(client.roles)}`}>
                            {client.roles}
                        </Badge>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                        <InfoItem icon={User} label="Full Name" value={client.fullName} />
                        <InfoItem icon={Mail} label="Email" value={client.email} />
                        <InfoItem icon={Calendar} label="Registered" value={formatDate(client.createdAt)} />
                    </div>
                </div>

                {/* ── Section 2: Transaction Log ────────────────────────────── */}
                <div className="rounded-lg border bg-white overflow-hidden">
                    <div className="px-6 py-4 border-b bg-gray-50">
                        <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                            <BookOpen className="h-5 w-5 text-gray-500" />
                            Transaction Log
                            <span className="ml-auto text-sm font-normal text-gray-500">
                                {transactions.length} request{transactions.length !== 1 ? "s" : ""}
                            </span>
                        </h2>
                    </div>
                    {transactions.length === 0 ? (
                        <p className="px-6 py-8 text-center text-sm text-gray-500">No tutoring requests found.</p>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Subject</TableHead>
                                    <TableHead>Building</TableHead>
                                    <TableHead>Type</TableHead>
                                    <TableHead>Priority</TableHead>
                                    <TableHead>Created At</TableHead>
                                    <TableHead className="text-center">Status</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {transactions.map((tx) => (
                                    <TableRow key={tx.id}>
                                        <TableCell className="font-medium">{tx.subjectName}</TableCell>
                                        <TableCell className="text-gray-600">{tx.buildingName}</TableCell>
                                        <TableCell className="text-gray-600">
                                            {tx.isAdminCreated ? "Admin-Created" : "Student Request"}
                                        </TableCell>
                                        <TableCell className="text-gray-600">{tx.priority || "—"}</TableCell>
                                        <TableCell className="text-gray-600">{formatDateTime(tx.createdAt)}</TableCell>
                                        <TableCell className="text-center">
                                            <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold ${getStatusColor(tx.status)}`}>
                                                {tx.status}
                                            </span>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    )}
                </div>

                {/* ── Section 3: Ongoing / Confirmed Sessions ───────────────── */}
                <div className="rounded-lg border bg-white overflow-hidden">
                    <div className="px-6 py-4 border-b bg-gray-50">
                        <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                            <Clock className="h-5 w-5 text-gray-500" />
                            Ongoing &amp; Active Sessions
                            <span className="ml-auto text-sm font-normal text-gray-500">
                                {ongoing.length} session{ongoing.length !== 1 ? "s" : ""}
                            </span>
                        </h2>
                    </div>
                    {ongoing.length === 0 ? (
                        <p className="px-6 py-8 text-center text-sm text-gray-500">No ongoing or active sessions found.</p>
                    ) : (
                        <div className="divide-y">
                            {ongoing.map((session) => (
                                <div key={session.id} className="px-6 py-4 flex items-start justify-between gap-4">
                                    <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                                        <div>
                                            <p className="text-xs text-gray-500 uppercase tracking-wide font-medium">Subject</p>
                                            <p className="text-sm font-semibold text-gray-900 mt-0.5">{session.subjectName}</p>
                                        </div>
                                        <div>
                                            <p className="text-xs text-gray-500 uppercase tracking-wide font-medium">
                                                <Building2 className="inline h-3 w-3 mr-1" />Building / Room
                                            </p>
                                            <p className="text-sm text-gray-700 mt-0.5">
                                                {session.buildingName}
                                                {session.roomName ? ` · ${session.roomName}` : ""}
                                            </p>
                                        </div>
                                        <div>
                                            <p className="text-xs text-gray-500 uppercase tracking-wide font-medium">
                                                <Calendar className="inline h-3 w-3 mr-1" />Day &amp; Time
                                            </p>
                                            <p className="text-sm text-gray-700 mt-0.5">
                                                {session.dayName || "—"}
                                                {session.timeSlotLabel ? ` · ${session.timeSlotLabel}` : ""}
                                            </p>
                                        </div>
                                        <div>
                                            <p className="text-xs text-gray-500 uppercase tracking-wide font-medium">Teacher</p>
                                            <p className="text-sm text-gray-700 mt-0.5">{session.assignedTeacherName || "Not yet assigned"}</p>
                                        </div>
                                    </div>
                                    <span className={`shrink-0 inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold ${getStatusColor(session.status)}`}>
                                        {session.status}
                                    </span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

            </div>
        </AppLayout>
    );
}
