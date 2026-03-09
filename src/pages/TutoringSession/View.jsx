import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import AppLayout from "../../layouts/AppLayout";
import { generatePersonalInfoPDF } from "../../utils/pdfExport";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { DetailViewSkeleton } from "../../utils/skeletonLoaders";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, Pencil, Trash2, Calendar, Clock, BookOpen, User, Home, FileText, AlertCircle, Users, CheckCircle2 } from "lucide-react";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export default function TutoringSessionView() {
    const navigate = useNavigate();
    const { id } = useParams();

    const [session, setSession] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [deleteModal, setDeleteModal] = useState(false);

    const goBack = () => navigate("/tutoring-sessions");
    const goEdit = () => navigate(`/tutoring-sessions/${id}/edit`);

    const handlePrintPDF = () => {
        if (!session) return;
        generatePersonalInfoPDF({
            title: "Tutoring Session Details",
            data: session,
            fields: [
                { label: "Subject", key: "subjectName" },
                { label: "Teacher", key: "teacherName" },
                { label: "Room", key: "roomName" },
                { label: "Status", key: "status" },
                { label: "Schedule", key: "scheduleFull" },
                { label: "Notes", key: "notes" },
                { label: "Created By", key: "createdBy" },
            ],
            companyName: "Learning Flow Management System",
            headerInfo: { name: session.subjectName },
        });
    };

    const loadSession = async () => {
        setLoading(true);
        setError("");
        try {
            // TODO: replace with real API call, e.g. tutoringSessionService.getById(id)
            setSession(null);
        } catch (err) {
            setError(err.message || "Failed to load session");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadSession();
    }, [id]);

    const confirmDelete = () => {
        setDeleteModal(false);
        navigate("/tutoring-sessions", {
            state: { alert: { type: "success", message: `Session archived successfully!` } }
        });
    };

    const getStatusBadge = (status) => {
        switch (status?.toLowerCase()) {
            case "scheduled": return <Badge className="bg-blue-600">Scheduled</Badge>;
            case "completed": return <Badge className="bg-green-600">Completed</Badge>;
            case "cancelled": return <Badge className="bg-red-600">Cancelled</Badge>;
            case "draft": return <Badge className="bg-gray-500">Draft</Badge>;
            default: return <Badge variant="outline">{status}</Badge>;
        }
    };

    return (
        <AppLayout title="View Session" onPrint={session ? handlePrintPDF : undefined}>
            <div className="space-y-6">
                {error && (
                    <Alert variant="destructive">
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription>{error}</AlertDescription>
                    </Alert>
                )}

                {loading ? (
                    <DetailViewSkeleton fields={6} />
                ) : session ? (
                    <div className="space-y-6">
                        {/* Header Row */}
                        <div className="flex items-center gap-3">
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <Button variant="outline" size="icon" onClick={goBack}>
                                        <ArrowLeft className="h-4 w-4" />
                                    </Button>
                                </TooltipTrigger>
                                <TooltipContent>Back to sessions</TooltipContent>
                            </Tooltip>
                            <div>
                                <h1 className="text-3xl font-bold text-gray-900">Session Information</h1>
                                <p className="mt-1 text-sm text-gray-600">Detailed overview of the tutoring schedule</p>
                            </div>
                        </div>

                        <Tabs defaultValue="overview" className="w-full">
                            <TabsList className="grid w-[400px] grid-cols-3 mb-6 bg-gray-100 p-1 rounded-lg">
                                <TabsTrigger value="overview" className="rounded-md data-[state=active]:bg-white data-[state=active]:shadow-sm">Overview</TabsTrigger>
                                <TabsTrigger value="students" className="rounded-md data-[state=active]:bg-white data-[state=active]:shadow-sm">Attendees</TabsTrigger>
                                <TabsTrigger value="attendance" className="rounded-md data-[state=active]:bg-white data-[state=active]:shadow-sm">Attendance</TabsTrigger>
                            </TabsList>

                            {/* Tab 1: Overview */}
                            <TabsContent value="overview" className="animate-in fade-in duration-500">
                                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                                    {/* Main Details Card */}
                                    <div className="lg:col-span-2 space-y-6">
                                        <div className="bg-white border rounded-xl overflow-hidden shadow-sm">
                                            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-6 border-b flex justify-between items-start">
                                                <div className="space-y-2">
                                                    <div className="flex items-center gap-3">
                                                        <h2 className="text-2xl font-bold text-gray-900">{session.subjectName}</h2>
                                                        {getStatusBadge(session.status)}
                                                    </div>
                                                    <div className="flex items-center gap-4 text-sm text-gray-600 font-medium">
                                                        <span className="flex items-center gap-1.5"><Calendar className="h-4 w-4 text-blue-500" /> {session.startDateTime.split(' ')[0]}</span>
                                                        <span className="flex items-center gap-1.5"><Clock className="h-4 w-4 text-blue-500" /> {session.startDateTime.split(' ')[1]} - {session.endDateTime.split(' ')[1]}</span>
                                                    </div>
                                                </div>
                                                <div className="flex gap-2">
                                                    <Button variant="outline" size="sm" onClick={goEdit}><Pencil className="h-4 w-4 mr-2" /> Edit</Button>
                                                    <Button variant="outline" size="sm" className="text-red-600 border-red-100 hover:bg-red-50" onClick={() => setDeleteModal(true)}><Trash2 className="h-4 w-4 mr-2" /> Archive</Button>
                                                </div>
                                            </div>
                                            <div className="p-6 grid grid-cols-2 gap-8">
                                                <div className="space-y-4">
                                                    <div className="flex items-start gap-3">
                                                        <div className="p-2 bg-blue-50 rounded-lg text-blue-600"><User className="h-5 w-5" /></div>
                                                        <div>
                                                            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Teacher In-Charge</p>
                                                            <p className="text-base font-medium text-gray-900">{session.teacherName}</p>
                                                        </div>
                                                    </div>
                                                    <div className="flex items-start gap-3">
                                                        <div className="p-2 bg-indigo-50 rounded-lg text-indigo-600"><Home className="h-5 w-5" /></div>
                                                        <div>
                                                            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Assigned Room</p>
                                                            <p className="text-base font-medium text-gray-900">{session.roomName}</p>
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="space-y-4">
                                                    <div className="flex items-start gap-3">
                                                        <div className="p-2 bg-green-50 rounded-lg text-green-600"><BookOpen className="h-5 w-5" /></div>
                                                        <div>
                                                            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Scheduled By</p>
                                                            <p className="text-base font-medium text-gray-900">{session.createdBy}</p>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Notes Section */}
                                        <div className="bg-white border rounded-xl p-6 shadow-sm">
                                            <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2 mb-4">
                                                <FileText className="h-4 w-4 text-blue-600" />
                                                Pedagogical Notes
                                            </h3>
                                            <div className="p-4 bg-gray-50 rounded-lg border border-gray-100 italic text-gray-700 leading-relaxed">
                                                "{session.notes || "No special instructions provided for this session."}"
                                            </div>
                                        </div>
                                    </div>

                                    {/* Sidebar Info */}
                                    <div className="space-y-6">
                                        <div className="bg-white border rounded-xl p-5 shadow-sm space-y-4">
                                            <div className="flex items-center justify-between group">
                                                <span className="text-gray-500 text-sm">Attendance Count</span>
                                                <Badge variant="secondary" className="bg-blue-50 text-blue-700">{session.students.length} Students</Badge>
                                            </div>
                                            <Separator />
                                            <div className="flex items-center justify-between">
                                                <span className="text-gray-500 text-sm">Recorded Presence</span>
                                                <span className="text-sm font-semibold text-green-600">66%</span>
                                            </div>
                                        </div>

                                        <Alert className="bg-amber-50 border-amber-200">
                                            <AlertCircle className="h-4 w-4 text-amber-600" />
                                            <AlertDescription className="text-xs text-amber-800 font-medium leading-relaxed">
                                                Ensure students bring their materials. Check room capacity before adding more attendees.
                                            </AlertDescription>
                                        </Alert>
                                    </div>
                                </div>
                            </TabsContent>

                            {/* Tab 2: Students */}
                            <TabsContent value="students" className="animate-in fade-in duration-500">
                                <div className="bg-white border rounded-xl shadow-sm">
                                    <div className="px-6 py-4 border-b flex items-center justify-between">
                                        <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                                            <Users className="h-5 w-5 text-blue-600" />
                                            Session Attendees
                                        </h3>
                                        <Button size="sm"><Plus className="h-4 w-4 mr-2" /> Add Student</Button>
                                    </div>
                                    <Table>
                                        <TableHeader>
                                            <TableRow className="bg-gray-50">
                                                <TableHead>Student Name</TableHead>
                                                <TableHead>Email Address</TableHead>
                                                <TableHead>Grade Level</TableHead>
                                                <TableHead className="text-center">Action</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {session.students.map(s => (
                                                <TableRow key={s.id}>
                                                    <TableCell className="font-medium text-gray-900">{s.name}</TableCell>
                                                    <TableCell className="text-gray-600">{s.email}</TableCell>
                                                    <TableCell className="text-gray-600">{s.grade}</TableCell>
                                                    <TableCell className="text-center">
                                                        <Button variant="ghost" size="icon" className="text-red-500"><X className="h-4 w-4" /></Button>
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </div>
                            </TabsContent>

                            {/* Tab 3: Attendance */}
                            <TabsContent value="attendance" className="animate-in fade-in duration-500">
                                <div className="bg-white border rounded-xl shadow-sm">
                                    <div className="px-6 py-4 border-b flex items-center justify-between">
                                        <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                                            <CheckCircle2 className="h-5 w-5 text-green-600" />
                                            Attendance Log
                                        </h3>
                                        <Button variant="outline" size="sm" className="text-green-600 border-green-200">Finalize Attendance</Button>
                                    </div>
                                    <Table>
                                        <TableHeader>
                                            <TableRow className="bg-gray-50">
                                                <TableHead>Student</TableHead>
                                                <TableHead>Status</TableHead>
                                                <TableHead>Time Logged</TableHead>
                                                <TableHead className="text-center">Update</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {session.attendance.map(a => (
                                                <TableRow key={a.studentId}>
                                                    <TableCell className="font-medium text-gray-900">{a.name}</TableCell>
                                                    <TableCell>
                                                        <Badge variant="outline" className={
                                                            a.status === "Present" ? "bg-green-50 text-green-700 border-green-200" :
                                                                a.status === "Late" ? "bg-amber-50 text-amber-700 border-amber-200" :
                                                                    "bg-gray-50 text-gray-500 border-gray-200"
                                                        }>
                                                            {a.status}
                                                        </Badge>
                                                    </TableCell>
                                                    <TableCell className="text-gray-600 font-mono text-sm">{a.time}</TableCell>
                                                    <TableCell className="text-center">
                                                        <Button variant="ghost" size="sm" className="text-blue-600">Mark</Button>
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </div>
                            </TabsContent>
                        </Tabs>
                    </div>
                ) : (
                    <Alert><AlertCircle className="h-4 w-4" /><AlertDescription>Session not found.</AlertDescription></Alert>
                )}
            </div>

            {/* Confirmation Modals */}
            <AlertDialog open={deleteModal} onOpenChange={setDeleteModal}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Archive Session</AlertDialogTitle>
                        <AlertDialogDescription>Are you sure you want to archive this session? All scheduled attendees will be notified if integrated with mailing.</AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={confirmDelete} className="bg-red-600 hover:bg-red-700 text-white">Archive</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </AppLayout>
    );
}
