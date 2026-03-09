import { useNavigate } from "react-router-dom";
import { useState, useEffect, useMemo, useRef, useCallback } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import AppLayout from "../../layouts/AppLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Input } from "@/components/ui/input";
import {
    Building2,
    DoorOpen,
    CalendarDays,
    Clock,
    User,
    BookOpen,
    AlertCircle,
    CheckCircle2,
    Users,
    Wrench,
    ArrowUpRight,
    ChevronRight,
    Calendar,
    MapPin,
    Search,
    X,
} from "lucide-react";
import { dashboardService } from "@/services/dashboardService";
import { useAuth } from "@/contexts/AuthContext";
import { generatePDF } from "../../utils/pdfExport";
import DateRangeFilter from "../../components/DateRangeFilter";

const DAY_ORDER = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
const DAY_SHORT = { Monday: "Mon", Tuesday: "Tue", Wednesday: "Wed", Thursday: "Thu", Friday: "Fri", Saturday: "Sat", Sunday: "Sun" };
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
        timeCls: "text-purple-600", label: "Awaiting Approval",
        badgeCls: "bg-purple-50 text-purple-700 ring-1 ring-purple-200",
    },
};

const ROOM_STATUS_STYLE = {
    Available: { color: "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200", icon: CheckCircle2 },
    Occupied: { color: "bg-rose-50 text-rose-700 ring-1 ring-rose-200", icon: Users },
    Maintenance: { color: "bg-gray-100 text-gray-600 ring-1 ring-gray-200", icon: Wrench },
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

function NoBuildingState() {
    return (
        <div className="flex flex-col items-center justify-center py-24 text-center space-y-4 max-w-7xl mx-auto">
            <div className="flex items-center justify-center w-16 h-16 rounded-2xl bg-gray-100">
                <Building2 className="h-8 w-8 text-gray-400" />
            </div>
            <div>
                <p className="text-base font-semibold text-gray-900">No Building Assigned</p>
                <p className="text-sm text-gray-500 mt-1">
                    You have not been assigned to manage any building yet.
                    <br />Contact an administrator to get started.
                </p>
            </div>
        </div>
    );
}

export default function DashboardBuildingManager() {
    const navigate = useNavigate();
    const { user } = useAuth();
    const [loading, setLoading] = useState(true);
    const [filtering, setFiltering] = useState(false);
    const [stats, setStats] = useState(null);
    const [error, setError] = useState(null);
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

    const fetchData = useCallback(async (from, to, isFilter = false) => {
        if (isFilter) setFiltering(true);
        else setLoading(true);
        try {
            const params = {};
            if (from) params.fromDate = from.toISOString();
            if (to) params.toDate = to.toISOString();
            const response = await dashboardService.getBuildingManagerSummary(params);
            setStats(response.data);
        } catch (err) {
            console.error("Failed to load building manager dashboard:", err);
            setError(err?.response?.data?.message || "Failed to load dashboard data.");
        } finally {
            setLoading(false);
            setFiltering(false);
        }
    }, []);

    useEffect(() => {
        const isFilter = !isInitialMount.current;
        if (isInitialMount.current) isInitialMount.current = false;
        fetchData(fromDate, toDate, isFilter);
    }, [fromDate, toDate]);

    const firstName = user?.fullName?.split(" ")[0] || "Manager";
    const initials = user?.fullName?.split(" ").map(n => n[0]).join("") || "BM";

    const todayName = useMemo(() => getTodayName(), []);

    const statCards = stats?.hasBuilding ? [
        { title: "Total Rooms", value: stats.totalRooms, icon: DoorOpen, color: "text-gray-600", bgColor: "bg-gray-100", desc: "In your building", path: "/my-rooms" },
        { title: "Available", value: stats.availableRooms, icon: CheckCircle2, color: "text-emerald-600", bgColor: "bg-emerald-100", desc: "Ready for use", path: "/my-rooms" },
        { title: "Occupied", value: stats.occupiedRooms, icon: Users, color: "text-rose-600", bgColor: "bg-rose-100", desc: "Currently in session", path: "/my-rooms" },
        { title: "Today's Sessions", value: stats.todaySessionsCount, icon: CalendarDays, color: "text-blue-600", bgColor: "bg-blue-100", desc: todayName, path: "/my-building/today" },
    ] : [];

    const handlePrint = useCallback(() => {
        generatePDF({
            title: "Building Manager Dashboard Report",
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

    // Build sessions by day for weekly schedule
    const byDay = useMemo(() => {
        const map = {};
        DAY_ORDER.forEach(d => { map[d] = []; });
        const allSessions = [...(stats?.todaySessions || []), ...(stats?.upcomingSessions || [])];
        allSessions.forEach(s => {
            if (s.dayName && map[s.dayName]) map[s.dayName].push(s);
        });
        DAY_ORDER.forEach(d =>
            map[d].sort((a, b) => (a.timeSlotLabel || "").localeCompare(b.timeSlotLabel || ""))
        );
        return map;
    }, [stats]);

    return (
        <AppLayout title="Building Manager Dashboard" onPrint={handlePrint}>
            {loading ? (
                <DashboardSkeleton />
            ) : error ? (
                <div className="flex items-center gap-3 rounded-xl border border-red-200 bg-red-50 px-5 py-4 max-w-xl mx-auto mt-12">
                    <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0" />
                    <p className="text-sm text-red-700">{error}</p>
                </div>
            ) : !stats?.hasBuilding ? (
                <NoBuildingState />
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
                                                Building Manager
                                            </Badge>
                                        </div>
                                    </div>
                                    <Button
                                        onClick={() => navigate("/my-building")}
                                        className="h-10 px-6 font-semibold shadow-lg transition-all"
                                    >
                                        <Building2 className="mr-2 h-4 w-4" />
                                        {stats.buildingName}
                                        <ChevronRight className="ml-2 h-4 w-4" />
                                    </Button>
                                </div>
                                {stats.addressLine && (
                                    <p className="text-xs text-gray-400 flex items-center gap-1.5 -mt-1 ml-14">
                                        <MapPin className="h-3 w-3 flex-shrink-0" />
                                        {stats.addressLine}
                                    </p>
                                )}
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

                            {/* Room Overview Table */}
                            <Card className="border-2 shadow-sm reveal-on-scroll overflow-hidden">
                                <CardHeader className="flex flex-row items-center justify-between border-b bg-gray-50/50 py-5 px-6">
                                    <div className="flex items-center gap-3">
                                        <div className="bg-gray-100 p-2 rounded-xl">
                                            <DoorOpen className="h-5 w-5 text-gray-600" />
                                        </div>
                                        <div>
                                            <CardTitle className="text-lg font-bold text-gray-900">Room Overview</CardTitle>
                                            <CardDescription className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                                                {stats.totalRooms} room{stats.totalRooms !== 1 ? "s" : ""} in {stats.buildingName}
                                            </CardDescription>
                                        </div>
                                    </div>
                                    <Button variant="ghost" size="sm" onClick={() => navigate("/my-rooms")} className="text-xs font-bold text-gray-400 hover:text-gray-900">
                                        View All <ArrowUpRight className="ml-1 h-4 w-4" />
                                    </Button>
                                </CardHeader>
                                <CardContent className="p-0">
                                    {stats.rooms?.length > 0 ? (
                                        <Table>
                                            <TableHeader>
                                                <TableRow className="hover:bg-transparent bg-gray-50/30">
                                                    <TableHead className="font-bold text-[10px] uppercase tracking-wider text-gray-400 pl-6 h-10">Room</TableHead>
                                                    <TableHead className="font-bold text-[10px] uppercase tracking-wider text-gray-400 h-10">Status</TableHead>
                                                    <TableHead className="font-bold text-[10px] uppercase tracking-wider text-gray-400 h-10">Current Session</TableHead>
                                                    <TableHead className="font-bold text-[10px] uppercase tracking-wider text-gray-400 h-10">Teacher</TableHead>
                                                    <TableHead className="font-bold text-[10px] uppercase tracking-wider text-gray-400 pr-6 h-10 text-right">Capacity</TableHead>
                                                </TableRow>
                                            </TableHeader>
                                            <TableBody>
                                                {stats.rooms.map((room) => {
                                                    const statusStyle = ROOM_STATUS_STYLE[room.status] || ROOM_STATUS_STYLE.Available;
                                                    const StatusIcon = statusStyle.icon;
                                                    return (
                                                        <TableRow key={room.id} className="hover:bg-gray-50/50 transition-all cursor-pointer border-b border-gray-100" onClick={() => navigate(`/my-rooms/${room.id}`)}>
                                                            <TableCell className="pl-6 py-4">
                                                                <div className="flex items-center gap-2.5">
                                                                    <div className={`flex items-center justify-center w-8 h-8 rounded-lg flex-shrink-0 ${room.status === "Maintenance" ? "bg-gray-200" : room.status === "Occupied" ? "bg-rose-100" : "bg-emerald-100"}`}>
                                                                        <DoorOpen className={`h-4 w-4 ${room.status === "Maintenance" ? "text-gray-500" : room.status === "Occupied" ? "text-rose-600" : "text-emerald-600"}`} />
                                                                    </div>
                                                                    <span className="font-semibold text-gray-900 text-sm">{room.name}</span>
                                                                </div>
                                                            </TableCell>
                                                            <TableCell>
                                                                <Badge className={`text-[10px] font-bold uppercase gap-1 ${statusStyle.color}`}>
                                                                    <StatusIcon className="h-3 w-3" />
                                                                    {room.status}
                                                                </Badge>
                                                            </TableCell>
                                                            <TableCell className="text-sm text-gray-600">
                                                                {room.currentSession ? (
                                                                    <div>
                                                                        <span className="font-medium text-gray-900">{room.currentSession.subjectName}</span>
                                                                        {room.currentSession.timeSlotLabel && (
                                                                            <span className="text-xs text-gray-400 ml-2">{room.currentSession.timeSlotLabel}</span>
                                                                        )}
                                                                    </div>
                                                                ) : (
                                                                    <span className="text-gray-400 italic text-xs">{room.status === "Maintenance" ? "Inactive" : "No session"}</span>
                                                                )}
                                                            </TableCell>
                                                            <TableCell className="text-sm text-gray-600">
                                                                {room.currentSession?.assignedTeacherName || <span className="text-gray-400 italic text-xs">—</span>}
                                                            </TableCell>
                                                            <TableCell className="pr-6 text-right text-xs text-gray-400">
                                                                {room.capacity > 0 ? room.capacity : "—"}
                                                            </TableCell>
                                                        </TableRow>
                                                    );
                                                })}
                                            </TableBody>
                                        </Table>
                                    ) : (
                                        <div className="p-12 text-center">
                                            <DoorOpen className="h-10 w-10 text-gray-300 mx-auto mb-3" />
                                            <p className="text-sm font-medium text-gray-500">No rooms found for this building</p>
                                            <p className="text-xs text-gray-400 mt-1">Rooms will appear here once they are added</p>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>

                            {/* Today's Sessions */}
                            <Card className="border-2 shadow-sm reveal-on-scroll overflow-hidden">
                                <CardHeader className="flex flex-row items-center justify-between border-b bg-gray-50/50 py-5 px-6">
                                    <div className="flex items-center gap-3">
                                        <div className="bg-blue-100 p-2 rounded-xl">
                                            <Calendar className="h-5 w-5 text-blue-600" />
                                        </div>
                                        <div>
                                            <CardTitle className="text-lg font-bold text-gray-900">Today's Sessions</CardTitle>
                                            <CardDescription className="text-xs font-semibold text-gray-400 uppercase tracking-wider">{todayName}</CardDescription>
                                        </div>
                                    </div>
                                    <Button variant="ghost" size="sm" onClick={() => navigate("/my-building/today")} className="text-xs font-bold text-gray-400 hover:text-gray-900">
                                        View All <ArrowUpRight className="ml-1 h-4 w-4" />
                                    </Button>
                                </CardHeader>
                                <CardContent className="p-0">
                                    {stats.todaySessions?.length > 0 ? (
                                        <div className="divide-y divide-gray-100">
                                            {stats.todaySessions.map((session) => (
                                                <div key={session.id} className="p-5 hover:bg-gray-50/50 transition-all cursor-pointer" onClick={() => navigate("/my-building/today")}>
                                                    <div className="flex items-center justify-between mb-2">
                                                        <h4 className="font-bold text-gray-900 text-sm">{session.subjectName}</h4>
                                                        <Badge className={`text-[9px] font-bold uppercase tracking-wider px-3 py-1 rounded-lg ${session.confirmedAt ? "bg-green-100 text-green-700" : "bg-orange-100 text-orange-700"}`}>
                                                            {session.confirmedAt ? "Confirmed" : "Pending Approval"}
                                                        </Badge>
                                                    </div>
                                                    <div className="flex flex-wrap gap-3 text-xs text-gray-500">
                                                        <span className="flex items-center gap-1.5">
                                                            <DoorOpen className="h-3.5 w-3.5 text-gray-400" />
                                                            {session.roomName || "No room"}
                                                        </span>
                                                        {session.assignedTeacherName && (
                                                            <span className="flex items-center gap-1.5">
                                                                <User className="h-3.5 w-3.5 text-gray-400" />
                                                                {session.assignedTeacherName}
                                                            </span>
                                                        )}
                                                        <span className="flex items-center gap-1.5">
                                                            <BookOpen className="h-3.5 w-3.5 text-gray-400" />
                                                            {session.studentName || "No student"}
                                                        </span>
                                                        {session.timeSlotLabel && (
                                                            <span className="flex items-center gap-1.5">
                                                                <Clock className="h-3.5 w-3.5 text-gray-400" />
                                                                {session.timeSlotLabel}
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="p-12 text-center">
                                            <Calendar className="h-10 w-10 text-gray-300 mx-auto mb-3" />
                                            <p className="text-sm font-medium text-gray-500">No sessions scheduled for today</p>
                                            <p className="text-xs text-gray-400 mt-1">Sessions will appear here when they are scheduled</p>
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
                                        onClick={() => navigate("/my-rooms")}
                                    >
                                        <DoorOpen className="mr-3 h-4 w-4 text-gray-600" />
                                        Manage Rooms
                                    </Button>
                                    <Button
                                        variant="outline"
                                        className="w-full justify-start h-12 font-semibold text-sm"
                                        onClick={() => navigate("/my-building/today")}
                                    >
                                        <Calendar className="mr-3 h-4 w-4 text-blue-600" />
                                        Today's Sessions
                                    </Button>
                                    <Button
                                        variant="outline"
                                        className="w-full justify-start h-12 font-semibold text-sm"
                                        onClick={() => navigate("/my-building/schedule")}
                                    >
                                        <CalendarDays className="mr-3 h-4 w-4 text-indigo-600" />
                                        Building Schedule
                                    </Button>
                                </CardContent>
                            </Card>

                            {/* Building Info Card */}
                            <Card className="border-2 border-dashed border-gray-200 bg-gray-50/10 shadow-none hover:border-gray-900 hover:bg-white transition-all group overflow-hidden cursor-pointer relative reveal-on-scroll" onClick={() => navigate("/my-building")}>
                                <CardContent className="p-8 text-center space-y-6">
                                    <div className="mx-auto bg-gray-100 h-20 w-20 rounded-[2.5rem] flex items-center justify-center group-hover:bg-gray-900 group-hover:rotate-[15deg] transition-all duration-700 shadow-inner border border-gray-200 group-hover:border-gray-900">
                                        <Building2 className="h-10 w-10 text-gray-300 group-hover:text-white transition-colors" />
                                    </div>
                                    <div className="space-y-2">
                                        <h4 className="font-bold text-gray-900 text-lg">{stats.buildingName}</h4>
                                        <p className="text-xs text-gray-500 font-medium leading-relaxed px-4">
                                            {stats.totalRooms} room{stats.totalRooms !== 1 ? "s" : ""} · {stats.availableRooms} available
                                            {stats.maintenanceRooms > 0 && ` · ${stats.maintenanceRooms} maintenance`}
                                        </p>
                                    </div>
                                    <Button variant="outline" className="w-full h-12 rounded-xl font-bold text-xs uppercase tracking-wider group-hover:bg-gray-900 group-hover:text-white group-hover:border-gray-900 transition-all shadow-sm">
                                        View Building Details
                                    </Button>
                                </CardContent>
                            </Card>

                            {/* Profile Card */}
                            <Card className="border-2 border-dashed border-gray-200 bg-gray-50/10 shadow-none hover:border-gray-900 hover:bg-white transition-all group overflow-hidden cursor-pointer relative reveal-on-scroll" onClick={() => navigate("/settings")}>
                                <CardContent className="p-8 text-center space-y-6">
                                    <div className="mx-auto bg-gray-100 h-20 w-20 rounded-[2.5rem] flex items-center justify-center group-hover:bg-gray-900 group-hover:rotate-[15deg] transition-all duration-700 shadow-inner border border-gray-200 group-hover:border-gray-900">
                                        <User className="h-10 w-10 text-gray-300 group-hover:text-white transition-colors" />
                                    </div>
                                    <div className="space-y-2">
                                        <h4 className="font-bold text-gray-900 text-lg">My Profile</h4>
                                        <p className="text-xs text-gray-500 font-medium leading-relaxed px-4">Manage your account and preferences.</p>
                                    </div>
                                    <Button variant="outline" className="w-full h-12 rounded-xl font-bold text-xs uppercase tracking-wider group-hover:bg-gray-900 group-hover:text-white group-hover:border-gray-900 transition-all shadow-sm">
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
                                    <CardDescription className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Sessions by day across all rooms</CardDescription>
                                </div>
                            </div>
                            <Button variant="ghost" size="sm" onClick={() => navigate("/my-building/schedule")} className="text-xs font-bold text-gray-400 hover:text-gray-900">
                                Full View <ArrowUpRight className="ml-1 h-4 w-4" />
                            </Button>
                        </CardHeader>
                        <CardContent className="p-0">
                            {(stats.todaySessions?.length ?? 0) + (stats.upcomingSessions?.length ?? 0) === 0 ? (
                                <div className="py-12 text-center">
                                    <CalendarDays className="h-10 w-10 text-gray-200 mx-auto mb-3" />
                                    <p className="text-sm font-medium text-gray-500">No scheduled sessions yet</p>
                                    <p className="text-xs text-gray-400 mt-1">Confirmed and pending sessions will appear here</p>
                                </div>
                            ) : (
                                <div className="divide-y divide-gray-100">
                                    {DAY_ORDER.map(day => {
                                        const daySessions = byDay[day];
                                        const isToday = day === todayName;
                                        const hasItems = daySessions.length > 0;
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
                                                                            className={`group/pill text-left border-l-2 ${st.leftBorder} pl-2.5 pr-3 py-1.5 rounded-r-xl bg-gray-50 hover:bg-gray-100 transition-colors shadow-sm min-w-[150px] max-w-[210px]`}
                                                                            onClick={() => navigate("/my-building/today")}
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
                                                                                {session.roomName && (
                                                                                    <div className="flex items-center gap-0.5 text-gray-400 flex-shrink-0">
                                                                                        <DoorOpen className="h-2.5 w-2.5" />
                                                                                        <p className="text-[10px] leading-none truncate max-w-[55px]">{session.roomName}</p>
                                                                                    </div>
                                                                                )}
                                                                                {session.assignedTeacherName && (
                                                                                    <div className="flex items-center gap-0.5 text-gray-400 min-w-0">
                                                                                        <User className="h-2.5 w-2.5 flex-shrink-0" />
                                                                                        <p className="text-[10px] truncate leading-none">{session.assignedTeacherName}</p>
                                                                                    </div>
                                                                                )}
                                                                            </div>
                                                                        </button>
                                                                    </TooltipTrigger>
                                                                    <TooltipContent side="top" className="max-w-[200px]">
                                                                        <div className="space-y-1 text-xs">
                                                                            <p className="font-semibold">{session.subjectName}</p>
                                                                            <p className="flex items-center gap-1 text-gray-400"><Clock className="h-3 w-3" /> {session.timeSlotLabel}</p>
                                                                            {session.roomName && <p className="flex items-center gap-1 text-gray-400"><DoorOpen className="h-3 w-3" /> {session.roomName}</p>}
                                                                            {session.assignedTeacherName && <p className="flex items-center gap-1 text-gray-400"><User className="h-3 w-3" /> {session.assignedTeacherName}</p>}
                                                                            {session.studentName && <p className="flex items-center gap-1 text-gray-400"><BookOpen className="h-3 w-3" /> {session.studentName}</p>}
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
