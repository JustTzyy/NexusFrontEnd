import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useStudentSetup } from "@/hooks/useStudentSetup";
import { useState, useEffect, useRef, useCallback } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import AppLayout from "../../layouts/AppLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import {
    Calendar,
    CalendarDays,
    MapPin,
    User,
    Clock,
    CheckCircle2,
    ArrowUpRight,
    ChevronRight,
    FileText,
    Hourglass,
    PlusCircle,
    History,
    BookOpen,
    AlertCircle,
    ArrowRight,
    Search,
    X,
} from "lucide-react";
import { dashboardService } from "@/services/dashboardService";
import { generatePDF } from "../../utils/pdfExport";
import DateRangeFilter from "../../components/DateRangeFilter";

const DashboardSkeleton = () => (
    <div className="space-y-6 max-w-7xl mx-auto">
        <Card className="border shadow-sm">
            <CardHeader className="space-y-2">
                <Skeleton className="h-8 w-64" />
                <Skeleton className="h-4 w-96" />
            </CardHeader>
        </Card>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
                <Card key={i}>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <Skeleton className="h-4 w-24" />
                        <Skeleton className="h-8 w-8 rounded-lg" />
                    </CardHeader>
                    <CardContent>
                        <Skeleton className="h-8 w-16 mb-2" />
                    </CardContent>
                </Card>
            ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-8 space-y-6">
                <Card><CardContent className="p-6"><Skeleton className="h-48 w-full" /></CardContent></Card>
                <Card><CardContent className="p-6"><Skeleton className="h-48 w-full" /></CardContent></Card>
            </div>
            <div className="lg:col-span-4 space-y-6">
                <Card><CardContent className="p-6"><Skeleton className="h-32 w-full" /></CardContent></Card>
                <Card><CardContent className="p-6"><Skeleton className="h-32 w-full" /></CardContent></Card>
            </div>
        </div>
    </div>
);

const STATUS_BADGE = {
    "Pending Teacher Interest": "bg-amber-100 text-amber-700 border-amber-200",
    "Waiting for Admin Approval": "bg-blue-100 text-blue-700 border-blue-200",
    "Teacher Assigned": "bg-purple-100 text-purple-700 border-purple-200",
    "Waiting for Teacher Approval": "bg-orange-100 text-orange-700 border-orange-200",
    "Confirmed": "bg-green-100 text-green-700 border-green-200",
    "Cancelled by Student": "bg-red-100 text-red-700 border-red-200",
    "Cancelled by Admin": "bg-red-100 text-red-700 border-red-200",
};

export default function DashboardLead() {
    const navigate = useNavigate();
    const { user, logout } = useAuth();
    const { isSetupComplete, loading: setupLoading } = useStudentSetup();
    const [loading, setLoading] = useState(true);
    const [filtering, setFiltering] = useState(false);
    const [stats, setStats] = useState(null);
    const [fromDate, setFromDate] = useState(undefined);
    const [toDate, setToDate] = useState(undefined);
    const [searchTerm, setSearchTerm] = useState("");
    const isInitialMount = useRef(true);
    const printRef = useRef(null);

    const clearFilters = useCallback(() => {
        setSearchTerm("");
        setFromDate(undefined);
        setToDate(undefined);
    }, []);

    const hasActiveFilters = searchTerm || fromDate || toDate;

    const matchesSearch = useCallback((text) => {
        if (!searchTerm.trim()) return true;
        return text.toLowerCase().includes(searchTerm.trim().toLowerCase());
    }, [searchTerm]);

    const filterCards = useCallback((cards) => {
        if (!searchTerm.trim()) return cards;
        return cards.filter(c => matchesSearch(c.title) || matchesSearch(c.desc || ""));
    }, [searchTerm, matchesSearch]);

    useEffect(() => {
        const isFilter = !isInitialMount.current;
        if (isInitialMount.current) isInitialMount.current = false;
        const fetchData = async (from, to, isFilter) => {
            if (isFilter) setFiltering(true);
            else setLoading(true);
            try {
                const params = {};
                if (from) params.fromDate = from.toISOString();
                if (to) params.toDate = to.toISOString();
                const response = await dashboardService.getStudentSummary(params);
                setStats(response.data);
            } catch (error) {
                console.error("Failed to load student dashboard:", error);
            } finally {
                setLoading(false);
                setFiltering(false);
            }
        };
        fetchData(fromDate, toDate, isFilter);
    }, [fromDate, toDate]);

    const handleLogout = () => {
        logout();
        navigate("/login");
    };

    const firstName = user?.fullName?.split(" ")[0] || "Student";
    const initials = user?.fullName?.split(" ").map(n => n[0]).join("") || "S";

    const statCards = stats ? [
        { title: "Total Requests", value: stats.totalRequestsCount, icon: FileText, color: "text-blue-600", bgColor: "bg-blue-100", desc: "All submitted requests", path: "/book-request" },
        { title: "Pending", value: stats.pendingCount, icon: Hourglass, color: "text-amber-600", bgColor: "bg-amber-100", desc: "Awaiting teacher interest", path: "/book-request" },
        { title: "In Progress", value: stats.inProgressCount, icon: Clock, color: "text-purple-600", bgColor: "bg-purple-100", desc: "Being processed", path: "/book-request" },
        { title: "Confirmed", value: stats.confirmedCount, icon: CheckCircle2, color: "text-green-600", bgColor: "bg-green-100", desc: "Active sessions", path: "/book-request" },
    ] : [];

    const handlePrint = useCallback(() => {
        generatePDF({
            title: "Student Dashboard Report",
            data: statCards.map(c => ({ metric: c.title, value: c.value, description: c.desc })),
            columns: [
                { header: "Metric", key: "metric" },
                { header: "Value", accessor: (row) => typeof row.value === "number" ? row.value.toLocaleString() : String(row.value) },
                { header: "Description", key: "description" },
            ],
            filters: {
                "From Date": fromDate ? fromDate.toLocaleDateString() : null,
                "To Date": toDate ? toDate.toLocaleDateString() : null,
                "Search": searchTerm || null,
            },
            companyName: "NexUs Tutoring Portal",
        });
    }, [statCards, fromDate, toDate, searchTerm]);

    return (
        <AppLayout
            title="Student Dashboard"
            brand={{ name: "NexUs", subtitle: "Tutoring Portal", mark: "NX" }}
            onLogout={handleLogout}
            onPrint={handlePrint}
            user={{ name: user?.fullName || "Student", initials, email: user?.email || "" }}
        >
            {loading ? (
                <DashboardSkeleton />
            ) : (
                <div ref={printRef} className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-700 max-w-7xl mx-auto">

                    {/* Setup incomplete card */}
                    {!setupLoading && isSetupComplete === false && (
                        <div className="rounded-2xl border-2 border-amber-200 bg-amber-50 overflow-hidden">
                            <div className="flex items-center gap-3 bg-amber-100 border-b border-amber-200 px-6 py-4">
                                <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-amber-500 flex-shrink-0">
                                    <AlertCircle className="h-5 w-5 text-white" />
                                </div>
                                <div>
                                    <p className="text-sm font-bold text-amber-900">Profile Setup Required</p>
                                    <p className="text-xs text-amber-700 mt-0.5">
                                        Complete your profile to make requests and access full system functionality.
                                    </p>
                                </div>
                            </div>

                            <div className="px-6 py-5 flex flex-col sm:flex-row gap-6">
                                <div className="flex-1 space-y-2">
                                    <p className="text-xs font-semibold text-amber-800 uppercase tracking-wider mb-3">
                                        What you need to complete:
                                    </p>
                                    {[
                                        { label: "Personal Information", desc: "First name, last name, and date of birth" },
                                        { label: "Contact Details", desc: "Phone number and other contact info" },
                                        { label: "Residential Address", desc: "Region, province, and city — used for building assignment" },
                                    ].map((item) => (
                                        <div key={item.label} className="flex items-start gap-2.5">
                                            <div className="mt-0.5 flex-shrink-0 w-4 h-4 rounded-full border-2 border-amber-400 bg-white" />
                                            <div>
                                                <p className="text-sm font-semibold text-amber-900">{item.label}</p>
                                                <p className="text-xs text-amber-700">{item.desc}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                <div className="flex flex-col gap-3 sm:items-end justify-between sm:min-w-[180px]">
                                    <div className="space-y-1.5">
                                        <p className="text-xs font-semibold text-amber-800 uppercase tracking-wider">Blocked until complete:</p>
                                        {["Submit book requests", "Enroll in sessions"].map((item) => (
                                            <div key={item} className="flex items-center gap-2">
                                                <div className="w-1.5 h-1.5 rounded-full bg-amber-500 flex-shrink-0" />
                                                <p className="text-xs text-amber-700">{item}</p>
                                            </div>
                                        ))}
                                    </div>
                                    <Button
                                        asChild
                                        className="mt-3 sm:mt-0 w-full sm:w-auto bg-amber-500 hover:bg-amber-600 text-white font-bold shadow-sm"
                                    >
                                        <Link to="/register/welcome">
                                            Complete Setup
                                            <ArrowRight className="ml-2 h-4 w-4" />
                                        </Link>
                                    </Button>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Welcome Bar */}
                    <div className="reveal-on-scroll">
                        <Card className="border border-gray-100 shadow-sm w-full overflow-hidden rounded-xl bg-white">
                            <div className="flex flex-col py-3 px-6 sm:px-8 gap-3.5">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-4">
                                        <Avatar className="h-10 w-10 bg-gray-50 border-0">
                                            <AvatarFallback className="bg-gray-100 text-gray-900 font-bold text-xs">
                                                {initials}
                                            </AvatarFallback>
                                        </Avatar>
                                        <div className="flex items-center gap-3">
                                            <h2 className="text-xl font-bold text-gray-900">Welcome back, {firstName}</h2>
                                            <Badge variant="secondary" className="px-3 py-1 rounded-full font-semibold text-[10px] uppercase tracking-wider">
                                                Student
                                            </Badge>
                                        </div>
                                    </div>
                                    <Button
                                        onClick={() => navigate("/book-request/new")}
                                        className="h-10 px-6 font-semibold shadow-lg transition-all"
                                    >
                                        New Request
                                        <ChevronRight className="ml-2 h-4 w-4" />
                                    </Button>
                                </div>
                            </div>
                        </Card>
                    </div>

                    {/* Filters */}
                    <div className="space-y-3 print:hidden">
                        <DateRangeFilter
                            fromDate={fromDate}
                            toDate={toDate}
                            onFromDateChange={setFromDate}
                            onToDateChange={setToDate}
                            leftElement={
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <div className="relative">
                                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                                            <Input
                                                placeholder="Search dashboard..."
                                                value={searchTerm}
                                                onChange={(e) => setSearchTerm(e.target.value)}
                                                className="pl-10 w-[240px]"
                                            />
                                        </div>
                                    </TooltipTrigger>
                                    <TooltipContent>Search KPI cards by title or description</TooltipContent>
                                </Tooltip>
                            }
                            rightElement={
                                hasActiveFilters && (
                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <Button variant="outline" size="sm" onClick={clearFilters}>
                                                Clear
                                            </Button>
                                        </TooltipTrigger>
                                        <TooltipContent>Clear all filters</TooltipContent>
                                    </Tooltip>
                                )
                            }
                        />
                    </div>

                    {/* Stats Grid */}
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                        {filterCards(statCards).map((stat) => (
                            <Card key={stat.title} className="reveal-on-scroll hover:shadow-lg transition-all cursor-pointer group" onClick={() => navigate(stat.path)}>
                                <CardContent className="p-5">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className={`p-2.5 rounded-xl ${stat.bgColor} group-hover:scale-110 transition-transform`}>
                                                <stat.icon className={`h-5 w-5 ${stat.color}`} />
                                            </div>
                                            <div>
                                                <p className="text-sm font-medium text-gray-500">{stat.title}</p>
                                                <p className="text-xs text-gray-400 mt-0.5">{stat.desc}</p>
                                            </div>
                                        </div>
                                        {filtering ? <Skeleton className="h-8 w-14" /> : <div className="text-3xl font-bold text-gray-900">{stat.value?.toLocaleString?.() ?? stat.value}</div>}
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>

                    {/* Main 2-column layout */}
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

                        {/* Left column */}
                        <div className="lg:col-span-8 space-y-8">

                            {/* Recent Requests Table */}
                            <Card className="border-2 shadow-sm reveal-on-scroll overflow-hidden">
                                <CardHeader className="flex flex-row items-center justify-between border-b bg-gray-50/50 py-5 px-6">
                                    <div className="flex items-center gap-3">
                                        <div className="bg-gray-900 p-2 rounded-xl">
                                            <History className="h-5 w-5 text-white" />
                                        </div>
                                        <div>
                                            <CardTitle className="text-lg font-bold text-gray-900">Recent Requests</CardTitle>
                                            <CardDescription className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Your latest tutoring requests</CardDescription>
                                        </div>
                                    </div>
                                    <Button variant="ghost" size="sm" onClick={() => navigate("/book-request")} className="text-xs font-bold text-gray-400 hover:text-gray-900">
                                        View All <ArrowUpRight className="ml-1 h-4 w-4" />
                                    </Button>
                                </CardHeader>
                                <CardContent className="p-0">
                                    {stats?.recentRequests?.length > 0 ? (
                                        <Table>
                                            <TableHeader>
                                                <TableRow className="hover:bg-transparent bg-gray-50/30">
                                                    <TableHead className="font-bold text-[10px] uppercase tracking-wider text-gray-400 pl-6 h-10">Subject</TableHead>
                                                    <TableHead className="font-bold text-[10px] uppercase tracking-wider text-gray-400 h-10">Building</TableHead>
                                                    <TableHead className="font-bold text-[10px] uppercase tracking-wider text-gray-400 h-10">Date</TableHead>
                                                    <TableHead className="font-bold text-[10px] uppercase tracking-wider text-gray-400 pr-6 h-10 text-right">Status</TableHead>
                                                </TableRow>
                                            </TableHeader>
                                            <TableBody>
                                                {stats.recentRequests.map((req) => (
                                                    <TableRow
                                                        key={req.id}
                                                        className="hover:bg-gray-50/50 transition-all cursor-pointer border-b border-gray-100"
                                                        onClick={() => navigate(`/book-request/${req.id}`)}
                                                    >
                                                        <TableCell className="pl-6 py-4">
                                                            <div className="font-semibold text-gray-900 text-sm">{req.subjectName}</div>
                                                            <div className="text-[10px] text-gray-400 font-medium">{req.departmentName}</div>
                                                        </TableCell>
                                                        <TableCell className="text-sm text-gray-500">{req.buildingName}</TableCell>
                                                        <TableCell className="text-xs text-gray-400">
                                                            {new Date(req.createdAt).toLocaleDateString()}
                                                        </TableCell>
                                                        <TableCell className="pr-6 text-right">
                                                            <Badge className={`text-[9px] font-bold uppercase tracking-wider px-3 py-1 rounded-lg ${STATUS_BADGE[req.status] || "bg-gray-100 text-gray-600"}`}>
                                                                {req.status}
                                                            </Badge>
                                                        </TableCell>
                                                    </TableRow>
                                                ))}
                                            </TableBody>
                                        </Table>
                                    ) : (
                                        <div className="p-12 text-center">
                                            <BookOpen className="h-10 w-10 text-gray-300 mx-auto mb-3" />
                                            <p className="text-sm font-medium text-gray-500">No requests submitted yet</p>
                                            <p className="text-xs text-gray-400 mt-1">Submit a tutoring request to get started</p>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>

                            {/* Upcoming Sessions */}
                            <Card className="border-2 shadow-sm reveal-on-scroll overflow-hidden">
                                <CardHeader className="flex flex-row items-center justify-between border-b bg-gray-50/50 py-5 px-6">
                                    <div className="flex items-center gap-3">
                                        <div className="bg-green-100 p-2 rounded-xl">
                                            <Calendar className="h-5 w-5 text-green-600" />
                                        </div>
                                        <div>
                                            <CardTitle className="text-lg font-bold text-gray-900">Upcoming Sessions</CardTitle>
                                            <CardDescription className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Confirmed tutoring sessions</CardDescription>
                                        </div>
                                    </div>
                                </CardHeader>
                                <CardContent className="p-0">
                                    {stats?.upcomingSessions?.length > 0 ? (
                                        <div className="divide-y divide-gray-100">
                                            {stats.upcomingSessions.map((session) => (
                                                <div
                                                    key={session.id}
                                                    className="p-5 hover:bg-gray-50/50 transition-all cursor-pointer"
                                                    onClick={() => navigate(`/book-request/${session.id}`)}
                                                >
                                                    <div className="flex items-center justify-between mb-2">
                                                        <h4 className="font-bold text-gray-900 text-sm">{session.subjectName}</h4>
                                                        <Badge className="text-[9px] font-bold uppercase tracking-wider px-3 py-1 rounded-lg bg-green-100 text-green-700">
                                                            Confirmed
                                                        </Badge>
                                                    </div>
                                                    <div className="flex flex-wrap gap-3 text-xs text-gray-500">
                                                        {session.assignedTeacherName && (
                                                            <span className="flex items-center gap-1.5">
                                                                <User className="h-3.5 w-3.5 text-gray-400" />
                                                                {session.assignedTeacherName}
                                                            </span>
                                                        )}
                                                        <span className="flex items-center gap-1.5">
                                                            <MapPin className="h-3.5 w-3.5 text-gray-400" />
                                                            {session.buildingName}{session.roomName ? ` - ${session.roomName}` : ""}
                                                        </span>
                                                        {session.dayName && (
                                                            <span className="flex items-center gap-1.5">
                                                                <Clock className="h-3.5 w-3.5 text-gray-400" />
                                                                {session.dayName}{session.timeSlotLabel ? ` @ ${session.timeSlotLabel}` : ""}
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="p-12 text-center">
                                            <Calendar className="h-10 w-10 text-gray-300 mx-auto mb-3" />
                                            <p className="text-sm font-medium text-gray-500">No upcoming sessions</p>
                                            <p className="text-xs text-gray-400 mt-1">Sessions will appear here once confirmed</p>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        </div>

                        {/* Right sidebar */}
                        <div className="lg:col-span-4 space-y-8">

                            {/* Quick Actions */}
                            <Card className="border-2 shadow-sm overflow-hidden bg-white reveal-on-scroll">
                                <CardHeader className="bg-gray-50/50 border-b py-5 px-6">
                                    <CardTitle className="text-xs font-bold uppercase tracking-wider text-gray-500">Quick Actions</CardTitle>
                                </CardHeader>
                                <CardContent className="p-4 space-y-3">
                                    <Button
                                        variant="outline"
                                        className="w-full justify-start h-12 font-semibold text-sm"
                                        onClick={() => navigate("/book-request/new")}
                                    >
                                        <PlusCircle className="mr-3 h-4 w-4 text-blue-600" />
                                        Submit New Request
                                    </Button>
                                    <Button
                                        variant="outline"
                                        className="w-full justify-start h-12 font-semibold text-sm"
                                        onClick={() => navigate("/my-student-schedule")}
                                    >
                                        <CalendarDays className="mr-3 h-4 w-4 text-green-600" />
                                        My Schedule
                                    </Button>
                                    <Button
                                        variant="outline"
                                        className="w-full justify-start h-12 font-semibold text-sm"
                                        onClick={() => navigate("/book-request")}
                                    >
                                        <History className="mr-3 h-4 w-4 text-purple-600" />
                                        My Request History
                                    </Button>
                                </CardContent>
                            </Card>

                            {/* Profile Card */}
                            <Card className="border-2 border-dashed border-gray-200 bg-gray-50/10 shadow-none hover:border-gray-900 hover:bg-white transition-all group overflow-hidden cursor-pointer relative reveal-on-scroll">
                                <CardContent className="p-8 text-center space-y-6">
                                    <div className="mx-auto bg-gray-100 h-20 w-20 rounded-[2.5rem] flex items-center justify-center group-hover:bg-gray-900 group-hover:rotate-[15deg] transition-all duration-700 shadow-inner border border-gray-200 group-hover:border-gray-900">
                                        <User className="h-10 w-10 text-gray-300 group-hover:text-white transition-colors" />
                                    </div>
                                    <div className="space-y-2">
                                        <h4 className="font-bold text-gray-900 text-lg">My Profile</h4>
                                        <p className="text-xs text-gray-500 font-medium leading-relaxed px-4">Keep your profile updated for better tutor matching.</p>
                                    </div>
                                    <Button variant="outline" onClick={() => navigate("/settings")} className="w-full h-12 rounded-xl font-bold text-xs uppercase tracking-wider group-hover:bg-gray-900 group-hover:text-white group-hover:border-gray-900 transition-all shadow-sm">
                                        Update Profile
                                    </Button>
                                </CardContent>
                            </Card>
                        </div>
                    </div>
                </div>
            )}
        </AppLayout>
    );
}
