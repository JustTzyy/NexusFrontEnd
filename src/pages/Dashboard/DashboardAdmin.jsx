import { useNavigate } from "react-router-dom";
import { useState, useEffect, useMemo, useRef, useCallback } from "react";
import ReactECharts from "echarts-for-react";
import { Skeleton } from "@/components/ui/skeleton";
import {
    generateDateLabels,
    createLineChartConfig,
    createDonutChartConfig,
    createMultiLineChartConfig,
} from "../../utils/chartHelpers";
import AppLayout from "../../layouts/AppLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import {
    Users, UserCheck, TrendingUp, ArrowUpRight, Eye,
    Building, GraduationCap,
    BookOpen, CheckCircle2, Clock, XCircle,
    ChevronRight, User, BarChart2, CalendarDays,
    Search, X,
} from "lucide-react";
import { dashboardService } from "@/services/dashboardService";
import { useAuth } from "@/contexts/AuthContext";
import { generatePDF } from "../../utils/pdfExport";
import DateRangeFilter from "../../components/DateRangeFilter";

const STATUS_COLORS = {
    "Pending Teacher Interest":     "#f97316",
    "Waiting for Admin Approval":   "#3b82f6",
    "Teacher Assigned":             "#6366f1",
    "Waiting for Teacher Approval": "#8b5cf6",
    "Pending Student Interest":     "#06b6d4",
    "Confirmed":                    "#10b981",
    "Cancelled by Admin":           "#ef4444",
    "Cancelled by Student":         "#9ca3af",
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
            {Array.from({ length: 8 }).map((_, i) => (
                <Card key={i}>
                    <CardContent className="p-5">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <Skeleton className="h-10 w-10 rounded-xl" />
                                <div>
                                    <Skeleton className="h-4 w-20 mb-1" />
                                    <Skeleton className="h-3 w-28" />
                                </div>
                            </div>
                            <Skeleton className="h-8 w-12" />
                        </div>
                    </CardContent>
                </Card>
            ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-8 space-y-6">
                <Card><CardContent className="p-6"><Skeleton className="h-48 w-full" /></CardContent></Card>
                <Card><CardContent className="p-6"><Skeleton className="h-64 w-full" /></CardContent></Card>
            </div>
            <div className="lg:col-span-4 space-y-6">
                <Card><CardContent className="p-6"><Skeleton className="h-48 w-full" /></CardContent></Card>
                <Card><CardContent className="p-6"><Skeleton className="h-40 w-full" /></CardContent></Card>
            </div>
        </div>
    </div>
);

export default function DashboardAdmin() {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [filtering, setFiltering] = useState(false);
    const [summaryData, setSummaryData] = useState(null);
    const [recentUsers, setRecentUsers] = useState([]);
    const [chartData, setChartData] = useState([]);
    const [fromDate, setFromDate] = useState(undefined);
    const [toDate, setToDate] = useState(undefined);
    const [searchTerm, setSearchTerm] = useState("");
    const isInitialMount = useRef(true);
    const printRef = useRef(null);
    const { user, logout } = useAuth();

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

    const fetchDashboardData = async (from, to, isFilter = false) => {
        if (isFilter) setFiltering(true);
        else setLoading(true);
        try {
            const params = {};
            if (from) params.fromDate = from.toISOString();
            if (to) params.toDate = to.toISOString();
            const response = await dashboardService.getAdminSummary(params);
            const data = response.data;
            setSummaryData(data);
            setRecentUsers(data.recentUsers || []);
            setChartData(data.registrationTrends || []);
        } catch (error) {
            console.error("Failed to load dashboard data:", error);
        } finally {
            setLoading(false);
            setFiltering(false);
        }
    };

    useEffect(() => {
        const isFilter = !isInitialMount.current;
        if (isInitialMount.current) isInitialMount.current = false;
        fetchDashboardData(fromDate, toDate, isFilter);
    }, [fromDate, toDate]);

    const handleLogout = () => { logout(); navigate("/login"); };

    const firstName = user?.fullName?.split(" ")[0] || "Admin";
    const initials = user?.fullName?.split(" ").map(n => n[0]).join("") || "AD";

    const chartDates = useMemo(() => generateDateLabels(30), []);

    const registrationOption = useMemo(() => createLineChartConfig({
        xAxisData: chartDates,
        seriesData: chartData,
        seriesName: "New Users",
        yAxisName: "Users",
        smooth: true,
        showArea: true,
        lineWidth: 3,
        areaOpacity: 0.3,
        visualMap: { min: 0, max: 50 },
    }), [chartDates, chartData]);

    const statusDonutOption = useMemo(() => createDonutChartConfig({
        title: "Requests",
        data: (summaryData?.statusDistribution || []).map(s => ({
            name: s.status,
            value: s.count,
            itemStyle: { color: STATUS_COLORS[s.status] || "#6b7280" },
        })),
    }), [summaryData]);

    const requestTrendOption = useMemo(() => createMultiLineChartConfig({
        xAxisData: generateDateLabels(30),
        yAxisName: "Requests",
        seriesConfig: [
            { name: "Admin Created",     data: summaryData?.adminRequestTrends   || [], showArea: true, areaOpacity: 0.15, lineWidth: 2 },
            { name: "Student Submitted", data: summaryData?.studentRequestTrends || [], showArea: true, areaOpacity: 0.15, lineWidth: 2 },
        ],
    }), [summaryData]);

    const statCards = summaryData ? [
        { title: "Total Users",         value: summaryData.totalUsers              ?? 0, icon: Users,         color: "text-blue-600",    bgColor: "bg-blue-100",    desc: "Registered in system",   path: "/users" },
        { title: "Active Users",        value: summaryData.activeUsers             ?? 0, icon: UserCheck,     color: "text-green-600",   bgColor: "bg-green-100",   desc: "Currently active",       path: "/users" },
        { title: "Buildings",           value: summaryData.totalBuildings          ?? 0, icon: Building,      color: "text-sky-600",     bgColor: "bg-sky-100",     desc: "Active buildings",       path: "/buildings" },
        { title: "Teacher Assignments", value: summaryData.totalTeacherAssignments ?? 0, icon: GraduationCap, color: "text-rose-600",    bgColor: "bg-rose-100",    desc: "Active assignments",     path: "/teacher-assignments" },
        { title: "Total Requests",      value: summaryData.totalRequests           ?? 0, icon: BookOpen,      color: "text-gray-600",    bgColor: "bg-gray-100",    desc: "All tutoring requests",  path: "/admin-scheduling" },
        { title: "Confirmed Sessions",  value: summaryData.confirmedSessions       ?? 0, icon: CheckCircle2,  color: "text-emerald-600", bgColor: "bg-emerald-100", desc: "Successfully confirmed", path: "/admin-scheduling" },
        { title: "Active Requests",     value: summaryData.activeRequests          ?? 0, icon: Clock,         color: "text-blue-600",    bgColor: "bg-blue-100",    desc: "Currently in progress",  path: "/admin-scheduling" },
        { title: "Cancelled",           value: summaryData.cancelledRequests       ?? 0, icon: XCircle,       color: "text-red-600",     bgColor: "bg-red-100",     desc: "By admin or student",    path: "/admin-scheduling" },
    ] : [];

    const handlePrint = useCallback(() => {
        generatePDF({
            title: "Admin Dashboard Report",
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
            title="Admin Dashboard"
            brand={{ name: "Admin Panel", subtitle: "System", mark: "AD" }}
            onLogout={handleLogout}
            onPrint={handlePrint}
        >
            {loading ? (
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
                                                Admin
                                            </Badge>
                                        </div>
                                    </div>
                                    <Button
                                        onClick={() => navigate("/admin-scheduling")}
                                        className="h-10 px-6 font-semibold shadow-lg transition-all"
                                    >
                                        View Scheduling
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

                    {/* Stat Cards */}
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
                                        {filtering ? <Skeleton className="h-8 w-14" /> : <div className="text-3xl font-bold text-gray-900">{stat.value.toLocaleString()}</div>}
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>

                    {/* Main 2-column layout */}
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

                        {/* Left column */}
                        <div className="lg:col-span-8 space-y-8">

                            {/* Recently Added Users */}
                            <Card className="border-2 shadow-sm reveal-on-scroll overflow-hidden">
                                <CardHeader className="flex flex-row items-center justify-between border-b bg-gray-50/50 py-5 px-6">
                                    <div className="flex items-center gap-3">
                                        <div className="bg-blue-100 p-2 rounded-xl">
                                            <Users className="h-5 w-5 text-blue-600" />
                                        </div>
                                        <div>
                                            <CardTitle className="text-lg font-bold text-gray-900">Recently Added Users</CardTitle>
                                            <CardDescription className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Latest registrations in the system</CardDescription>
                                        </div>
                                    </div>
                                    <Button variant="ghost" size="sm" onClick={() => navigate("/users")} className="text-xs font-bold text-gray-400 hover:text-gray-900">
                                        View All <ArrowUpRight className="ml-1 h-4 w-4" />
                                    </Button>
                                </CardHeader>
                                <CardContent className="p-0">
                                    {recentUsers.length > 0 ? (
                                        <Table>
                                            <TableHeader>
                                                <TableRow className="hover:bg-transparent bg-gray-50/30">
                                                    <TableHead className="font-bold text-[10px] uppercase tracking-wider text-gray-400 pl-6 h-10">Name</TableHead>
                                                    <TableHead className="font-bold text-[10px] uppercase tracking-wider text-gray-400 h-10">Email</TableHead>
                                                    <TableHead className="font-bold text-[10px] uppercase tracking-wider text-gray-400 h-10">Role</TableHead>
                                                    <TableHead className="font-bold text-[10px] uppercase tracking-wider text-gray-400 h-10">Status</TableHead>
                                                    <TableHead className="font-bold text-[10px] uppercase tracking-wider text-gray-400 pr-6 h-10 text-right">Joined</TableHead>
                                                    <TableHead className="w-10" />
                                                </TableRow>
                                            </TableHeader>
                                            <TableBody>
                                                {recentUsers.map((u, index) => (
                                                    <TableRow key={index} className="hover:bg-gray-50/50 transition-all cursor-pointer border-b border-gray-100" onClick={() => navigate(`/users/${u.id}`)}>
                                                        <TableCell className="pl-6 py-4">
                                                            <div className="flex items-center gap-3">
                                                                <Avatar className="h-8 w-8">
                                                                    <AvatarFallback className="bg-gray-200 text-gray-700 text-xs">
                                                                        {u.name.split(" ").map(n => n[0]).join("")}
                                                                    </AvatarFallback>
                                                                </Avatar>
                                                                <span className="font-semibold text-gray-900 text-sm">{u.name}</span>
                                                            </div>
                                                        </TableCell>
                                                        <TableCell className="text-sm text-gray-500">{u.email}</TableCell>
                                                        <TableCell>
                                                            <Badge variant="outline" className="text-[10px] font-bold uppercase">{u.role}</Badge>
                                                        </TableCell>
                                                        <TableCell>
                                                            <Badge variant={u.status === "Active" ? "default" : "secondary"} className="text-xs">{u.status}</Badge>
                                                        </TableCell>
                                                        <TableCell className="pr-6 text-right text-xs text-gray-400">{u.joinedDate}</TableCell>
                                                        <TableCell>
                                                            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={(e) => { e.stopPropagation(); navigate(`/users/${u.id}`); }}>
                                                                <Eye className="h-4 w-4" />
                                                            </Button>
                                                        </TableCell>
                                                    </TableRow>
                                                ))}
                                            </TableBody>
                                        </Table>
                                    ) : (
                                        <div className="p-12 text-center">
                                            <Users className="h-10 w-10 text-gray-300 mx-auto mb-3" />
                                            <p className="text-sm font-medium text-gray-500">No users registered yet</p>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>

                            {/* Charts row — Registration + Status Donut */}
                            <div className="grid gap-6 lg:grid-cols-2">
                                <Card className="border-2 shadow-sm reveal-on-scroll overflow-hidden">
                                    <CardHeader className="flex flex-row items-center gap-3 border-b bg-gray-50/50 py-5 px-6">
                                        <div className="bg-indigo-100 p-2 rounded-xl">
                                            <TrendingUp className="h-5 w-5 text-indigo-600" />
                                        </div>
                                        <div>
                                            <CardTitle className="text-lg font-bold text-gray-900">Registration Trend</CardTitle>
                                            <CardDescription className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Daily registrations — past 30 days</CardDescription>
                                        </div>
                                    </CardHeader>
                                    <CardContent className="p-6">
                                        <ReactECharts option={registrationOption} style={{ height: "240px" }} opts={{ renderer: "svg" }} />
                                    </CardContent>
                                </Card>

                                <Card className="border-2 shadow-sm reveal-on-scroll overflow-hidden">
                                    <CardHeader className="flex flex-row items-center gap-3 border-b bg-gray-50/50 py-5 px-6">
                                        <div className="bg-purple-100 p-2 rounded-xl">
                                            <BarChart2 className="h-5 w-5 text-purple-600" />
                                        </div>
                                        <div>
                                            <CardTitle className="text-lg font-bold text-gray-900">Request Status</CardTitle>
                                            <CardDescription className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Breakdown by pipeline stage</CardDescription>
                                        </div>
                                    </CardHeader>
                                    <CardContent className="p-6">
                                        <ReactECharts option={statusDonutOption} style={{ height: "240px" }} opts={{ renderer: "svg" }} />
                                    </CardContent>
                                </Card>
                            </div>

                            {/* Request Creation Trend — full width */}
                            <Card className="border-2 shadow-sm reveal-on-scroll overflow-hidden">
                                <CardHeader className="flex flex-row items-center justify-between border-b bg-gray-50/50 py-5 px-6">
                                    <div className="flex items-center gap-3">
                                        <div className="bg-emerald-100 p-2 rounded-xl">
                                            <CalendarDays className="h-5 w-5 text-emerald-600" />
                                        </div>
                                        <div>
                                            <CardTitle className="text-lg font-bold text-gray-900">Request Creation Trend</CardTitle>
                                            <CardDescription className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Admin-created vs student-submitted — past 30 days</CardDescription>
                                        </div>
                                    </div>
                                </CardHeader>
                                <CardContent className="p-6">
                                    <ReactECharts option={requestTrendOption} style={{ height: "260px" }} opts={{ renderer: "svg" }} />
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
                                        onClick={() => navigate("/users")}
                                    >
                                        <Users className="mr-3 h-4 w-4 text-blue-600" />
                                        Manage Users
                                    </Button>
                                    <Button
                                        variant="outline"
                                        className="w-full justify-start h-12 font-semibold text-sm"
                                        onClick={() => navigate("/admin-scheduling")}
                                    >
                                        <CalendarDays className="mr-3 h-4 w-4 text-emerald-600" />
                                        Admin Scheduling
                                    </Button>
                                    <Button
                                        variant="outline"
                                        className="w-full justify-start h-12 font-semibold text-sm"
                                        onClick={() => navigate("/buildings")}
                                    >
                                        <Building className="mr-3 h-4 w-4 text-sky-600" />
                                        Buildings
                                    </Button>
                                    <Button
                                        variant="outline"
                                        className="w-full justify-start h-12 font-semibold text-sm"
                                        onClick={() => navigate("/teacher-assignments")}
                                    >
                                        <GraduationCap className="mr-3 h-4 w-4 text-rose-600" />
                                        Teacher Assignments
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
                                        <p className="text-xs text-gray-500 font-medium leading-relaxed px-4">Manage your admin profile and account settings.</p>
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
