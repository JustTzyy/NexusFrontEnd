import { useNavigate } from "react-router-dom";
import { useState, useEffect, useMemo, useRef, useCallback } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import AppLayout from "../../layouts/AppLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Input } from "@/components/ui/input";
import {
    BookOpen,
    HandHeart,
    ClockAlert,
    CheckCircle2,
    ArrowUpRight,
    ChevronRight,
    Calendar,
    CalendarDays,
    MapPin,
    Clock,
    User,
    DoorOpen,
    Search,
    X,
} from "lucide-react";
import { dashboardService } from "@/services/dashboardService";
import { useAuth } from "@/contexts/AuthContext";
import { useTeacherAssignment } from "@/hooks/useTeacherAssignment";
import SetupRequiredState from "@/components/SetupRequiredState";
import { generatePDF } from "../../utils/pdfExport";
import DateRangeFilter from "../../components/DateRangeFilter";

const DAY_ORDER = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
const DAY_SHORT  = { Monday: "Mon", Tuesday: "Tue", Wednesday: "Wed", Thursday: "Thu", Friday: "Fri", Saturday: "Sat", Sunday: "Sun" };
const getTodayName = () => {
    const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
    return days[new Date().getDay()];
};
const SESSION_STYLE = {
    "Confirmed": {
        dot: "bg-emerald-400", leftBorder: "border-l-emerald-400",
        timeCls: "text-emerald-600", label: "Confirmed",
        badgeCls: "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200",
    },
    "Waiting for Teacher Approval": {
        dot: "bg-purple-400", leftBorder: "border-l-purple-400",
        timeCls: "text-purple-600", label: "Needs Approval",
        badgeCls: "bg-purple-50 text-purple-700 ring-1 ring-purple-200",
    },
};

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
};

const PRIORITY_BADGE = {
    "High": "bg-red-100 text-red-700",
    "Medium": "bg-amber-100 text-amber-700",
    "Low": "bg-gray-100 text-gray-600",
};

export default function DashboardTeacher() {
    const navigate = useNavigate();
    const { user, logout } = useAuth();
    const { hasAssignment, loading: assignmentLoading } = useTeacherAssignment();
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
        if (assignmentLoading || hasAssignment === false) return;
        const isFilter = !isInitialMount.current;
        if (isInitialMount.current) isInitialMount.current = false;
        const fetchData = async (from, to, isFilter) => {
            if (isFilter) setFiltering(true);
            else setLoading(true);
            try {
                const params = {};
                if (from) params.fromDate = from.toISOString();
                if (to) params.toDate = to.toISOString();
                const response = await dashboardService.getTeacherSummary(params);
                setStats(response.data);
            } catch (error) {
                console.error("Failed to load teacher dashboard:", error);
            } finally {
                setLoading(false);
                setFiltering(false);
            }
        };
        fetchData(fromDate, toDate, isFilter);
    }, [assignmentLoading, hasAssignment, fromDate, toDate]);

    const handleLogout = () => {
        logout();
        navigate("/login");
    };

    const firstName = user?.fullName?.split(" ")[0] || "Teacher";
    const initials = user?.fullName?.split(" ").map(n => n[0]).join("") || "T";

    const statCards = stats ? [
        { title: "Available Requests", value: stats.availableRequestsCount, icon: BookOpen, color: "text-blue-600", bgColor: "bg-blue-100", desc: "Matching your assignments", path: "/student-requests" },
        { title: "My Interests", value: stats.expressedInterestCount, icon: HandHeart, color: "text-purple-600", bgColor: "bg-purple-100", desc: "Expressed interest", path: "/my-interests" },
        { title: "Pending Approval", value: stats.pendingApprovalCount, icon: ClockAlert, color: "text-orange-600", bgColor: "bg-orange-100", desc: "Awaiting your confirmation", path: "/my-interests" },
        { title: "Confirmed Sessions", value: stats.confirmedSessionsCount, icon: CheckCircle2, color: "text-green-600", bgColor: "bg-green-100", desc: "Active sessions", path: "/my-interests" },
    ] : [];

    const handlePrint = useCallback(() => {
        generatePDF({
            title: "Teacher Dashboard Report",
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

    const todayName = useMemo(() => getTodayName(), []);

    const byDay = useMemo(() => {
        const map = {};
        DAY_ORDER.forEach(d => { map[d] = []; });
        (stats?.upcomingSessions || []).forEach(s => {
            if (s.dayName && map[s.dayName]) map[s.dayName].push(s);
        });
        DAY_ORDER.forEach(d =>
            map[d].sort((a, b) => (a.timeSlotLabel || "").localeCompare(b.timeSlotLabel || ""))
        );
        return map;
    }, [stats]);

    return (
        <AppLayout
            title="Teacher Dashboard"
            brand={{ name: "NexUs", subtitle: "Tutoring Portal", mark: "NX" }}
            onLogout={handleLogout}
            onPrint={handlePrint}
            user={{ name: user?.fullName || "Teacher", initials, email: user?.email || "" }}
        >
            {assignmentLoading ? (
                <DashboardSkeleton />
            ) : hasAssignment === false ? (
                <SetupRequiredState />
            ) : loading ? (
                <DashboardSkeleton />
            ) : (
                <div ref={printRef} className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-700 max-w-7xl mx-auto">

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
                                                Teacher
                                            </Badge>
                                        </div>
                                    </div>
                                    <Button
                                        onClick={() => navigate("/teacher-interest")}
                                        className="h-10 px-6 font-semibold shadow-lg transition-all"
                                    >
                                        Browse Requests
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

                        {/* Left column: tables */}
                        <div className="lg:col-span-8 space-y-8">

                            {/* Available Requests Table */}
                            <Card className="border-2 shadow-sm reveal-on-scroll overflow-hidden">
                                <CardHeader className="flex flex-row items-center justify-between border-b bg-gray-50/50 py-5 px-6">
                                    <div className="flex items-center gap-3">
                                        <div className="bg-blue-100 p-2 rounded-xl">
                                            <BookOpen className="h-5 w-5 text-blue-600" />
                                        </div>
                                        <div>
                                            <CardTitle className="text-lg font-bold text-gray-900">Available Requests</CardTitle>
                                            <CardDescription className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Matching your building & department</CardDescription>
                                        </div>
                                    </div>
                                    <Button variant="ghost" size="sm" onClick={() => navigate("/teacher-interest")} className="text-xs font-bold text-gray-400 hover:text-gray-900">
                                        View All <ArrowUpRight className="ml-1 h-4 w-4" />
                                    </Button>
                                </CardHeader>
                                <CardContent className="p-0">
                                    {stats?.recentAvailable?.length > 0 ? (
                                        <Table>
                                            <TableHeader>
                                                <TableRow className="hover:bg-transparent bg-gray-50/30">
                                                    <TableHead className="font-bold text-[10px] uppercase tracking-wider text-gray-400 pl-6 h-10">Subject</TableHead>
                                                    <TableHead className="font-bold text-[10px] uppercase tracking-wider text-gray-400 h-10">Student</TableHead>
                                                    <TableHead className="font-bold text-[10px] uppercase tracking-wider text-gray-400 h-10">Building</TableHead>
                                                    <TableHead className="font-bold text-[10px] uppercase tracking-wider text-gray-400 h-10">Priority</TableHead>
                                                    <TableHead className="font-bold text-[10px] uppercase tracking-wider text-gray-400 pr-6 h-10 text-right">Date</TableHead>
                                                </TableRow>
                                            </TableHeader>
                                            <TableBody>
                                                {stats.recentAvailable.map((req) => (
                                                    <TableRow key={req.id} className="hover:bg-gray-50/50 transition-all cursor-pointer border-b border-gray-100" onClick={() => navigate(`/teacher-interest/${req.id}`, { state: { from: "dashboardTeacher" } })}>
                                                        <TableCell className="pl-6 py-4">
                                                            <div className="font-semibold text-gray-900 text-sm">{req.subjectName}</div>
                                                            <div className="text-[10px] text-gray-400 font-medium">{req.departmentName}</div>
                                                        </TableCell>
                                                        <TableCell className="text-sm text-gray-700 font-medium">{req.studentName}</TableCell>
                                                        <TableCell className="text-sm text-gray-500">{req.buildingName}</TableCell>
                                                        <TableCell>
                                                            <Badge className={`text-[10px] font-bold uppercase ${PRIORITY_BADGE[req.priority] || "bg-gray-100 text-gray-600"}`}>
                                                                {req.priority}
                                                            </Badge>
                                                        </TableCell>
                                                        <TableCell className="pr-6 text-right text-xs text-gray-400">
                                                            {new Date(req.createdAt).toLocaleDateString()}
                                                        </TableCell>
                                                    </TableRow>
                                                ))}
                                            </TableBody>
                                        </Table>
                                    ) : (
                                        <div className="p-12 text-center">
                                            <BookOpen className="h-10 w-10 text-gray-300 mx-auto mb-3" />
                                            <p className="text-sm font-medium text-gray-500">No available requests matching your assignments</p>
                                            <p className="text-xs text-gray-400 mt-1">New requests will appear here when students submit them</p>
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
                                            <CardDescription className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Confirmed & pending your approval</CardDescription>
                                        </div>
                                    </div>
                                </CardHeader>
                                <CardContent className="p-0">
                                    {stats?.upcomingSessions?.length > 0 ? (
                                        <div className="divide-y divide-gray-100">
                                            {stats.upcomingSessions.map((session) => (
                                                <div key={session.id} className="p-5 hover:bg-gray-50/50 transition-all cursor-pointer" onClick={() => navigate(`/teacher-interest/${session.id}`, { state: { from: "dashboardTeacher" } })}>
                                                    <div className="flex items-center justify-between mb-2">
                                                        <h4 className="font-bold text-gray-900 text-sm">{session.subjectName}</h4>
                                                        <Badge className={`text-[9px] font-bold uppercase tracking-wider px-3 py-1 rounded-lg ${session.confirmedAt ? "bg-green-100 text-green-700" : "bg-orange-100 text-orange-700"}`}>
                                                            {session.confirmedAt ? "Confirmed" : "Pending Approval"}
                                                        </Badge>
                                                    </div>
                                                    <div className="flex flex-wrap gap-3 text-xs text-gray-500">
                                                        <span className="flex items-center gap-1.5">
                                                            <User className="h-3.5 w-3.5 text-gray-400" />
                                                            {session.studentName}
                                                        </span>
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
                                        onClick={() => navigate("/teacher-interest")}
                                    >
                                        <BookOpen className="mr-3 h-4 w-4 text-blue-600" />
                                        Browse Available Requests
                                    </Button>
                                    <Button
                                        variant="outline"
                                        className="w-full justify-start h-12 font-semibold text-sm"
                                        onClick={() => navigate("/my-interests")}
                                    >
                                        <Calendar className="mr-3 h-4 w-4 text-green-600" />
                                        My Schedule Tracking
                                    </Button>
                                    <Button
                                        variant="outline"
                                        className="w-full justify-start h-12 font-semibold text-sm"
                                        onClick={() => navigate("/my-schedule")}
                                    >
                                        <CalendarDays className="mr-3 h-4 w-4 text-indigo-600" />
                                        Weekly Schedule
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
                                        <p className="text-xs text-gray-500 font-medium leading-relaxed px-4">Keep your profile updated for better request matching.</p>
                                    </div>
                                    <Button variant="outline" onClick={() => navigate("/settings")} className="w-full h-12 rounded-xl font-bold text-xs uppercase tracking-wider group-hover:bg-gray-900 group-hover:text-white group-hover:border-gray-900 transition-all shadow-sm">
                                        Update Profile
                                    </Button>
                                </CardContent>
                            </Card>

                        </div>
                    </div>

                    {/* Weekly Schedule — full width */}
                    <Card className="border-2 shadow-sm reveal-on-scroll overflow-hidden">
                        <CardHeader className="flex flex-row items-center justify-between border-b bg-gray-50/50 py-5 px-6">
                            <div className="flex items-center gap-3">
                                <div className="bg-indigo-100 p-2 rounded-xl">
                                    <CalendarDays className="h-5 w-5 text-indigo-600" />
                                </div>
                                <div>
                                    <CardTitle className="text-lg font-bold text-gray-900">Weekly Schedule</CardTitle>
                                    <CardDescription className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Your confirmed & pending sessions by day</CardDescription>
                                </div>
                            </div>
                            <Button variant="ghost" size="sm" onClick={() => navigate("/my-schedule")} className="text-xs font-bold text-gray-400 hover:text-gray-900">
                                Full View <ArrowUpRight className="ml-1 h-4 w-4" />
                            </Button>
                        </CardHeader>
                        <CardContent className="p-0">
                            {(stats?.upcomingSessions?.length ?? 0) === 0 ? (
                                <div className="py-12 text-center">
                                    <CalendarDays className="h-10 w-10 text-gray-200 mx-auto mb-3" />
                                    <p className="text-sm font-medium text-gray-500">No scheduled sessions yet</p>
                                    <p className="text-xs text-gray-400 mt-1">Confirmed and pending-approval sessions will appear here</p>
                                </div>
                            ) : (
                                <div className="divide-y divide-gray-100">
                                    {DAY_ORDER.map(day => {
                                        const daySessions = byDay[day];
                                        const isToday    = day === todayName;
                                        const hasItems   = daySessions.length > 0;
                                        return (
                                            <div key={day} className={`flex items-stretch min-h-[52px] ${isToday ? "bg-indigo-50/60" : "bg-white"}`}>
                                                {/* Day label */}
                                                <div className={`w-28 flex-shrink-0 flex flex-col items-center justify-center gap-0.5 border-r px-3 py-2 ${
                                                    isToday ? "bg-indigo-600 border-indigo-500" : hasItems ? "bg-gray-800 border-gray-700" : "bg-gray-50 border-gray-100"
                                                }`}>
                                                    <p className={`text-[9px] font-bold uppercase tracking-widest leading-none ${isToday ? "text-indigo-200" : "text-gray-400"}`}>
                                                        {DAY_SHORT[day]}
                                                    </p>
                                                    <p className={`text-xs font-bold leading-tight ${isToday || hasItems ? "text-white" : "text-gray-400"}`}>
                                                        {day}
                                                    </p>
                                                    {hasItems && (
                                                        <span className={`mt-0.5 text-[9px] font-bold px-1.5 py-0.5 rounded-full ${isToday ? "bg-white/20 text-white" : "bg-white/10 text-gray-300"}`}>
                                                            {daySessions.length}
                                                        </span>
                                                    )}
                                                </div>
                                                {/* Sessions */}
                                                <div className="flex-1 flex flex-wrap items-center gap-2 px-4 py-2">
                                                    {!hasItems ? (
                                                        <p className="text-xs text-gray-300 italic select-none">Free</p>
                                                    ) : (
                                                        daySessions.map(session => {
                                                            const st = SESSION_STYLE[session.status] || SESSION_STYLE["Confirmed"];
                                                            return (
                                                                <Tooltip key={session.id}>
                                                                    <TooltipTrigger asChild>
                                                                        <button
                                                                            className={`group text-left border-l-2 ${st.leftBorder} pl-2.5 pr-3 py-1.5 rounded-r-xl bg-gray-50 hover:bg-gray-100 transition-colors shadow-sm min-w-[150px] max-w-[210px]`}
                                                                            onClick={() => navigate(`/teacher-interest/${session.id}`, { state: { from: "dashboardTeacher" } })}
                                                                        >
                                                                            <div className="flex items-start justify-between gap-1">
                                                                                <p className="text-[11px] font-bold text-gray-800 leading-tight line-clamp-1 flex-1">{session.subjectName}</p>
                                                                                <span className={`flex-shrink-0 w-1.5 h-1.5 rounded-full mt-0.5 ${st.dot}`} />
                                                                            </div>
                                                                            <div className={`flex items-center gap-0.5 mt-0.5 ${st.timeCls}`}>
                                                                                <Clock className="h-2.5 w-2.5 flex-shrink-0" />
                                                                                <p className="text-[10px] font-semibold leading-none">{session.timeSlotLabel}</p>
                                                                            </div>
                                                                            <div className="flex items-center gap-2 mt-0.5">
                                                                                {session.studentName ? (
                                                                                    <div className="flex items-center gap-0.5 text-gray-400 min-w-0">
                                                                                        <User className="h-2.5 w-2.5 flex-shrink-0" />
                                                                                        <p className="text-[10px] truncate leading-none">{session.studentName}</p>
                                                                                    </div>
                                                                                ) : (
                                                                                    <p className="text-[10px] text-gray-300 leading-none italic">No student</p>
                                                                                )}
                                                                                {session.roomName && (
                                                                                    <div className="flex items-center gap-0.5 text-gray-400 flex-shrink-0">
                                                                                        <DoorOpen className="h-2.5 w-2.5" />
                                                                                        <p className="text-[10px] leading-none truncate max-w-[55px]">{session.roomName}</p>
                                                                                    </div>
                                                                                )}
                                                                            </div>
                                                                        </button>
                                                                    </TooltipTrigger>
                                                                    <TooltipContent side="top" className="max-w-[200px]">
                                                                        <div className="space-y-1 text-xs">
                                                                            <p className="font-semibold">{session.subjectName}</p>
                                                                            <p className="flex items-center gap-1 text-gray-400"><Clock className="h-3 w-3" /> {session.timeSlotLabel}</p>
                                                                            {session.studentName && <p className="flex items-center gap-1 text-gray-400"><User className="h-3 w-3" /> {session.studentName}</p>}
                                                                            {session.roomName && <p className="flex items-center gap-1 text-gray-400"><DoorOpen className="h-3 w-3" /> {session.roomName}</p>}
                                                                            <span className={`inline-block px-1.5 py-0.5 rounded-full text-[10px] font-semibold ${st.badgeCls}`}>{st.label}</span>
                                                                        </div>
                                                                    </TooltipContent>
                                                                </Tooltip>
                                                            );
                                                        })
                                                    )}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>
            )}
        </AppLayout>
    );
}
