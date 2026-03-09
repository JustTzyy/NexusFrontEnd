import { useNavigate } from "react-router-dom";
import { useState, useEffect, useMemo, useRef, useCallback } from "react";
import ReactECharts from "echarts-for-react";
import { Skeleton } from "@/components/ui/skeleton";
import { createLineChartConfig, createDonutChartConfig, createHorizontalBarChartConfig, createMultiLineChartConfig } from "../../utils/chartHelpers";
import { generatePDF } from "../../utils/pdfExport";
import AppLayout from "../../layouts/AppLayout";
import DateRangeFilter from "../../components/DateRangeFilter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
    Users, Shield, Key, UserCheck, TrendingUp, ArrowUpRight, Eye, Settings,
    BookOpen, CheckCircle2, Clock, XCircle,
    Building2, BookMarked, Building, DoorOpen, CalendarDays, Timer, GraduationCap,
    ChevronRight, User, BarChart2,
    Mail, Megaphone, Send, AlertCircle, MailCheck, MailX, Layers, PieChart,
    Search, X,
} from "lucide-react";
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip,
    ResponsiveContainer, Legend,
} from "recharts";
import { dashboardService } from "@/services/dashboardService";
import { marketingAnalyticsService } from "@/services/marketingAnalyticsService";
import { useAuth } from "@/contexts/AuthContext";

const SECTIONS = [
    { key: "userMgmt", label: "User Management" },
    { key: "tutoringOverview", label: "Tutoring Overview" },
    { key: "tutoringSetup", label: "Tutoring Setup" },
    { key: "marketingKpi", label: "Marketing Overview" },
    { key: "recentUsers", label: "Recently Added Users" },
    { key: "tutoringCharts", label: "Tutoring Charts" },
    { key: "setupCharts", label: "Setup Charts" },
    { key: "marketing", label: "Marketing" },
];

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

const SETUP_COLORS = ["#6366f1", "#8b5cf6", "#0ea5e9", "#14b8a6", "#f59e0b", "#f97316", "#f43f5e"];

const CAMPAIGN_STATUS_BADGE = {
    Sent:      "bg-green-100 text-green-700 ring-1 ring-green-200",
    Sending:   "bg-purple-100 text-purple-700 ring-1 ring-purple-200",
    Scheduled: "bg-blue-100 text-blue-700 ring-1 ring-blue-200",
    Draft:     "bg-gray-100 text-gray-600 ring-1 ring-gray-200",
    Paused:    "bg-amber-100 text-amber-700 ring-1 ring-amber-200",
    Cancelled: "bg-red-100 text-red-700 ring-1 ring-red-200",
};

const PIPELINE_COLORS = ["bg-blue-500", "bg-purple-500", "bg-amber-500", "bg-green-500", "bg-rose-500", "bg-indigo-500"];

const EmailTooltip = ({ active, payload, label }) => {
    if (!active || !payload?.length) return null;
    return (
        <div className="bg-white border border-gray-200 rounded-xl shadow-lg p-3 text-xs">
            <p className="font-bold text-gray-700 mb-1">{label}</p>
            {payload.map((p) => (
                <p key={p.name} style={{ color: p.color }} className="font-medium">
                    {p.name}: {p.value}
                </p>
            ))}
        </div>
    );
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

export default function DashboardSuperAdmin() {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [filtering, setFiltering] = useState(false);
    const [roleDistribution, setRoleDistribution] = useState([]);
    const [recentUsers, setRecentUsers] = useState([]);
    const [chartData, setChartData] = useState([]);
    const [summaryData, setSummaryData] = useState(null);
    // Marketing state
    const [marketingOverview, setMarketingOverview] = useState(null);
    const [campaigns, setCampaigns] = useState([]);
    const [pipeline, setPipeline] = useState([]);
    const [emailPerf, setEmailPerf] = useState([]);
    const isInitialMount = useRef(true);
    const { user, logout } = useAuth();

    // Search & Filter state
    const [searchTerm, setSearchTerm] = useState("");
    const [fromDate, setFromDate] = useState(undefined);
    const [toDate, setToDate] = useState(undefined);
    const [sectionFilter, setSectionFilter] = useState("all");
    const printRef = useRef(null);

    const clearFilters = useCallback(() => {
        setSearchTerm("");
        setFromDate(undefined);
        setToDate(undefined);
        setSectionFilter("all");
    }, []);

    const hasActiveFilters = searchTerm || fromDate || toDate || sectionFilter !== "all";

    // Check if a card's text matches the search term
    const matchesSearch = useCallback((text) => {
        if (!searchTerm.trim()) return true;
        return text.toLowerCase().includes(searchTerm.trim().toLowerCase());
    }, [searchTerm]);

    // Filter KPI cards by search
    const filterCards = useCallback((cards) => {
        if (!searchTerm.trim()) return cards;
        return cards.filter(c => matchesSearch(c.title) || matchesSearch(c.desc || ""));
    }, [searchTerm, matchesSearch]);

    // Check if a section is visible (both section filter and search)
    const isSectionVisible = useCallback((key, cards = []) => {
        // Section dropdown filter
        if (sectionFilter !== "all" && sectionFilter !== key) return false;
        if (!searchTerm.trim()) return true;
        // For KPI sections, show if any card matches
        if (cards.length > 0) return cards.some(c => matchesSearch(c.title) || matchesSearch(c.desc || ""));
        // For chart/table sections, match against section label
        const section = SECTIONS.find(s => s.key === key);
        return section ? matchesSearch(section.label) : true;
    }, [sectionFilter, searchTerm, matchesSearch]);

    const fetchDashboardData = async (from, to, isFilter = false) => {
        if (isFilter) {
            setFiltering(true);
        } else {
            setLoading(true);
        }
        try {
            const params = {};
            if (from) params.fromDate = from.toISOString();
            if (to) params.toDate = to.toISOString();

            const [adminRes, ovRes, campRes, plRes, perfRes] = await Promise.all([
                dashboardService.getSummary(params),
                marketingAnalyticsService.getOverview(params),
                marketingAnalyticsService.getCampaignStats(),
                marketingAnalyticsService.getLeadPipeline(),
                marketingAnalyticsService.getEmailPerformance({ groupBy: "day" }),
            ]);

            const data = adminRes.data;
            const colorMap = ["bg-red-500", "bg-blue-500", "bg-green-500", "bg-gray-500", "bg-purple-500"];
            setRoleDistribution(data.roleDistribution.map((r, i) => ({
                role: r.role,
                count: r.count,
                color: colorMap[i] || "bg-gray-500",
                percentage: r.percentage,
            })));
            setRecentUsers(data.recentUsers);
            setChartData(data.registrationTrends);
            setSummaryData(data);

            setMarketingOverview(ovRes.data);
            setCampaigns((campRes.data || []).slice(0, 6));
            const plRaw = plRes.data || [];
            setPipeline(
                Array.isArray(plRaw)
                    ? plRaw.map((p) => ({ name: p.status, count: p.count }))
                    : Object.entries(plRaw).map(([name, count]) => ({ name, count }))
            );
            setEmailPerf((perfRes.data || []).slice(-14));
        } catch (error) {
            console.error("Failed to load dashboard data:", error);
        } finally {
            setLoading(false);
            setFiltering(false);
        }
    };

    const prevDatesRef = useRef({ fromDate: undefined, toDate: undefined });
    useEffect(() => {
        const isFilter = !isInitialMount.current;
        isInitialMount.current = false;
        prevDatesRef.current = { fromDate, toDate };
        fetchDashboardData(fromDate, toDate, isFilter);
    }, [fromDate, toDate]);

    const handleLogout = () => { logout(); navigate("/login"); };

    const firstName = user?.fullName?.split(" ")[0] || "Super Admin";
    const initials = user?.fullName?.split(" ").map(n => n[0]).join("") || "SA";

    // Generate chart date labels matching the date range
    const getDateLabelsForRange = useCallback((from, to) => {
        const start = from ? new Date(from) : new Date(new Date().setDate(new Date().getDate() - 29));
        const end = to ? new Date(to) : new Date();
        start.setHours(0, 0, 0, 0);
        end.setHours(0, 0, 0, 0);
        const labels = [];
        const current = new Date(start);
        while (current <= end) {
            labels.push(current.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }));
            current.setDate(current.getDate() + 1);
        }
        return labels;
    }, []);

    const chartDates = useMemo(() => getDateLabelsForRange(fromDate, toDate), [fromDate, toDate, getDateLabelsForRange]);

    const chartOption = useMemo(() => createLineChartConfig({
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

    const priorityBarOption = useMemo(() => createHorizontalBarChartConfig({
        categories: ["Low", "Normal", "High"],
        values: ["Low", "Normal", "High"].map(p =>
            summaryData?.priorityDistribution?.find(x => x.priority === p)?.count || 0),
        colors: ["#9ca3af", "#f97316", "#ef4444"],
    }), [summaryData]);

    const requestTrendOption = useMemo(() => createMultiLineChartConfig({
        xAxisData: chartDates,
        yAxisName: "Requests",
        seriesConfig: [
            { name: "Admin Created",     data: summaryData?.adminRequestTrends   || [], showArea: true, areaOpacity: 0.15, lineWidth: 2 },
            { name: "Student Submitted", data: summaryData?.studentRequestTrends || [], showArea: true, areaOpacity: 0.15, lineWidth: 2 },
        ],
    }), [summaryData, chartDates]);

    const setupOverviewOption = useMemo(() => ({
        tooltip: { trigger: "axis", axisPointer: { type: "shadow" } },
        grid: { left: "3%", right: "4%", bottom: "3%", containLabel: true },
        xAxis: {
            type: "category",
            data: ["Departments", "Subjects", "Buildings", "Rooms", "Avail. Days", "Time Slots", "Assignments"],
            axisLabel: { fontSize: 11 },
        },
        yAxis: { type: "value", minInterval: 1 },
        series: [{
            type: "bar",
            barMaxWidth: 52,
            data: [
                summaryData?.totalDepartments        ?? 0,
                summaryData?.totalSubjects            ?? 0,
                summaryData?.totalBuildings           ?? 0,
                summaryData?.totalRooms               ?? 0,
                summaryData?.totalAvailableDays       ?? 0,
                summaryData?.totalTimeSlots           ?? 0,
                summaryData?.totalTeacherAssignments  ?? 0,
            ].map((v, i) => ({ value: v, itemStyle: { color: SETUP_COLORS[i], borderRadius: [4, 4, 0, 0] } })),
        }],
    }), [summaryData]);

    const subjectsPerDeptOption    = useMemo(() => createHorizontalBarChartConfig({ categories: (summaryData?.subjectsPerDepartment  || []).map(x => x.name), values: (summaryData?.subjectsPerDepartment  || []).map(x => x.count), colors: (summaryData?.subjectsPerDepartment  || []).map((_, i) => SETUP_COLORS[i % SETUP_COLORS.length]) }), [summaryData]);
    const roomsPerBuildingOption   = useMemo(() => createHorizontalBarChartConfig({ categories: (summaryData?.roomsPerBuilding        || []).map(x => x.name), values: (summaryData?.roomsPerBuilding        || []).map(x => x.count), colors: (summaryData?.roomsPerBuilding        || []).map((_, i) => SETUP_COLORS[(i + 2) % SETUP_COLORS.length]) }), [summaryData]);
    const assignmentsPerDeptOption = useMemo(() => createHorizontalBarChartConfig({ categories: (summaryData?.assignmentsPerDepartment || []).map(x => x.name), values: (summaryData?.assignmentsPerDepartment || []).map(x => x.count), colors: (summaryData?.assignmentsPerDepartment || []).map((_, i) => SETUP_COLORS[(i + 4) % SETUP_COLORS.length]) }), [summaryData]);

    const userMgmtCards = summaryData ? [
        { title: "Total Users",   value: summaryData.totalUsers,       desc: "Registered in system",   icon: Users,    color: "text-blue-600",   bgColor: "bg-blue-100",   path: "/users" },
        { title: "Active Users",  value: summaryData.activeUsers,      desc: "Currently active",        icon: UserCheck,color: "text-green-600",  bgColor: "bg-green-100",  path: "/users" },
        { title: "Total Roles",   value: summaryData.totalRoles,       desc: "Configured roles",        icon: Shield,   color: "text-purple-600", bgColor: "bg-purple-100", path: "/roles" },
        { title: "Permissions",   value: summaryData.totalPermissions, desc: "Assigned permissions",    icon: Key,      color: "text-orange-600", bgColor: "bg-orange-100", path: "/permissions" },
    ] : [];

    const tutoringCards = summaryData ? [
        { title: "Total Requests",     value: summaryData.totalRequests     ?? 0, desc: "All tutoring requests",   icon: BookOpen,    color: "text-gray-600",    bgColor: "bg-gray-100",    path: "/admin-scheduling" },
        { title: "Confirmed Sessions", value: summaryData.confirmedSessions ?? 0, desc: "Successfully confirmed",  icon: CheckCircle2,color: "text-emerald-600", bgColor: "bg-emerald-100", path: "/admin-scheduling" },
        { title: "Active Requests",    value: summaryData.activeRequests    ?? 0, desc: "Currently in progress",   icon: Clock,       color: "text-blue-600",    bgColor: "bg-blue-100",    path: "/admin-scheduling" },
        { title: "Cancelled",          value: summaryData.cancelledRequests ?? 0, desc: "By admin or student",     icon: XCircle,     color: "text-red-600",     bgColor: "bg-red-100",     path: "/admin-scheduling" },
    ] : [];

    const setupCards = summaryData ? [
        { title: "Departments", value: summaryData.totalDepartments       ?? 0, icon: Building2,    color: "text-indigo-600", bgColor: "bg-indigo-100", path: "/departments" },
        { title: "Subjects",    value: summaryData.totalSubjects           ?? 0, icon: BookMarked,   color: "text-violet-600", bgColor: "bg-violet-100", path: "/subjects" },
        { title: "Buildings",   value: summaryData.totalBuildings          ?? 0, icon: Building,     color: "text-sky-600",    bgColor: "bg-sky-100",    path: "/buildings" },
        { title: "Rooms",       value: summaryData.totalRooms              ?? 0, icon: DoorOpen,     color: "text-teal-600",   bgColor: "bg-teal-100",   path: "/rooms" },
        { title: "Avail. Days", value: summaryData.totalAvailableDays      ?? 0, icon: CalendarDays, color: "text-amber-600",  bgColor: "bg-amber-100",  path: "/available-days" },
        { title: "Time Slots",  value: summaryData.totalTimeSlots          ?? 0, icon: Timer,        color: "text-orange-600", bgColor: "bg-orange-100", path: "/available-time-slots" },
        { title: "Assignments", value: summaryData.totalTeacherAssignments ?? 0, icon: GraduationCap,color: "text-rose-600",   bgColor: "bg-rose-100",   path: "/teacher-assignments" },
    ] : [];

    const marketingStatCards = useMemo(() => {
        if (!marketingOverview) return [];
        return [
            { title: "Total Leads",    value: marketingOverview.totalLeads      ?? 0, desc: "In the pipeline",   icon: Users,    color: "text-blue-600",    bgColor: "bg-blue-100",    path: "/leads" },
            { title: "Customers",      value: marketingOverview.totalCustomers  ?? 0, desc: "Converted leads",   icon: UserCheck,color: "text-emerald-600", bgColor: "bg-emerald-100", path: "/customers" },
            { title: "Campaigns Sent", value: marketingOverview.totalCampaigns  ?? 0, desc: "All campaigns",     icon: Megaphone,color: "text-purple-600",  bgColor: "bg-purple-100",  path: "/campaigns" },
            { title: "Emails Sent",    value: marketingOverview.totalEmailsSent ?? 0, desc: "Total delivered",   icon: Mail,     color: "text-indigo-600",  bgColor: "bg-indigo-100",  path: "/marketing/email-messages" },
        ];
    }, [marketingOverview]);

    const pipelineTotal = useMemo(() => pipeline.reduce((s, p) => s + p.count, 0), [pipeline]);

    const handlePrint = useCallback(() => {
        const allKpiRows = [
            ...(userMgmtCards.length ? userMgmtCards.map(c => ({ section: "User Management", metric: c.title, value: c.value, description: c.desc || "" })) : []),
            ...(tutoringCards.length ? tutoringCards.map(c => ({ section: "Tutoring Overview", metric: c.title, value: c.value, description: c.desc || "" })) : []),
            ...(setupCards.length ? setupCards.map(c => ({ section: "Tutoring Setup", metric: c.title, value: c.value, description: "" })) : []),
            ...(marketingStatCards.length ? marketingStatCards.map(c => ({ section: "Marketing Overview", metric: c.title, value: c.value, description: c.desc || "" })) : []),
        ];

        generatePDF({
            title: "Super Admin Dashboard Report",
            data: allKpiRows,
            columns: [
                { header: "Section", key: "section" },
                { header: "Metric", key: "metric" },
                { header: "Value", accessor: (row) => row.value.toLocaleString() },
                { header: "Description", key: "description" },
            ],
            filters: {
                "From Date": fromDate ? fromDate.toLocaleDateString() : null,
                "To Date": toDate ? toDate.toLocaleDateString() : null,
                "Section": sectionFilter !== "all" ? SECTIONS.find(s => s.key === sectionFilter)?.label : null,
                "Search": searchTerm || null,
            },
            companyName: "NexUs Tutoring Portal",
        });
    }, [userMgmtCards, tutoringCards, setupCards, marketingStatCards, fromDate, toDate, sectionFilter, searchTerm]);

    const successPct = useMemo(() => {
        if (!marketingOverview) return 0;
        const total = (marketingOverview.totalEmailsSent ?? 0) + (marketingOverview.totalEmailsFailed ?? 0);
        if (total === 0) return 0;
        return Math.round(((marketingOverview.totalEmailsSent ?? 0) / total) * 100);
    }, [marketingOverview]);

    return (
        <AppLayout
            title="Super Admin Dashboard"
            brand={{ name: "User Management", subtitle: "System", mark: "UM" }}
            onLogout={handleLogout}
            onPrint={handlePrint}
        >
            {loading ? (
                <DashboardSkeleton />
            ) : (
                <div ref={printRef} className="space-y-10 animate-in fade-in slide-in-from-bottom-2 duration-700 max-w-7xl mx-auto">

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
                                                Super Admin
                                            </Badge>
                                        </div>
                                    </div>
                                    <Button
                                        onClick={() => navigate("/users")}
                                        className="h-10 px-6 font-semibold shadow-lg transition-all"
                                    >
                                        Manage Users
                                        <ChevronRight className="ml-2 h-4 w-4" />
                                    </Button>
                                </div>
                            </div>
                        </Card>
                    </div>

                    {/* Filters - same pattern as User Index */}
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
                                <>
                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <div>
                                                <Select value={sectionFilter} onValueChange={setSectionFilter}>
                                                    <SelectTrigger className="w-[180px]">
                                                        <SelectValue placeholder="All Sections" />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="all">All Sections</SelectItem>
                                                        {SECTIONS.map((s) => (
                                                            <SelectItem key={s.key} value={s.key}>
                                                                {s.label}
                                                            </SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                        </TooltipTrigger>
                                        <TooltipContent>Filter by section</TooltipContent>
                                    </Tooltip>

                                    {hasActiveFilters && (
                                        <Tooltip>
                                            <TooltipTrigger asChild>
                                                <Button variant="outline" size="sm" onClick={clearFilters}>
                                                    Clear
                                                </Button>
                                            </TooltipTrigger>
                                            <TooltipContent>Clear all filters</TooltipContent>
                                        </Tooltip>
                                    )}
                                </>
                            }
                        />
                    </div>

                    {/* ═══════════════════════════════════════════════
                        ALL KPIs — grouped in one place
                    ═══════════════════════════════════════════════ */}
                    <div className="space-y-6">

                        {/* User Management KPIs */}
                        {isSectionVisible("userMgmt", userMgmtCards) && filterCards(userMgmtCards).length > 0 && (
                        <div>
                            <p className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-3">User Management</p>
                            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                                {filterCards(userMgmtCards).map((stat) => (
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
                        </div>
                        )}

                        {/* Tutoring Overview KPIs */}
                        {isSectionVisible("tutoringOverview", tutoringCards) && filterCards(tutoringCards).length > 0 && (
                        <div>
                            <p className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-3">Tutoring Overview</p>
                            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                                {filterCards(tutoringCards).map((stat) => (
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
                        </div>
                        )}

                        {/* Tutoring Setup KPIs */}
                        {isSectionVisible("tutoringSetup", setupCards) && filterCards(setupCards).length > 0 && (
                        <div>
                            <p className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-3">Tutoring Setup</p>
                            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                                {filterCards(setupCards).map((stat) => (
                                    <Card key={stat.title} className="reveal-on-scroll hover:shadow-lg transition-all cursor-pointer group" onClick={() => navigate(stat.path)}>
                                        <CardContent className="p-5">
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-3">
                                                    <div className={`p-2.5 rounded-xl ${stat.bgColor} group-hover:scale-110 transition-transform`}>
                                                        <stat.icon className={`h-5 w-5 ${stat.color}`} />
                                                    </div>
                                                    <p className="text-sm font-medium text-gray-500">{stat.title}</p>
                                                </div>
                                                {filtering ? <Skeleton className="h-8 w-14" /> : <div className="text-3xl font-bold text-gray-900">{stat.value.toLocaleString()}</div>}
                                            </div>
                                        </CardContent>
                                    </Card>
                                ))}
                            </div>
                        </div>
                        )}

                        {/* Marketing KPIs */}
                        {isSectionVisible("marketingKpi", marketingStatCards) && filterCards(marketingStatCards).length > 0 && marketingStatCards.length > 0 && (
                            <div>
                                <p className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-3">Marketing Overview</p>
                                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                                    {marketingStatCards.map((stat) => (
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
                            </div>
                        )}
                    </div>

                    {/* ═══════════════════════════════════════════════
                        12-COL GRID: CONTENT LEFT + SIDEBAR RIGHT
                    ═══════════════════════════════════════════════ */}
                    {isSectionVisible("recentUsers") && (
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

                        {/* Left column (8): Recently Added Users + Registration + Role Distribution */}
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

                            {/* Registration Trend + Role Distribution */}
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
                                        <ReactECharts option={chartOption} style={{ height: "240px" }} opts={{ renderer: "svg" }} />
                                    </CardContent>
                                </Card>

                                <Card className="border-2 shadow-sm reveal-on-scroll overflow-hidden">
                                    <CardHeader className="flex flex-row items-center justify-between border-b bg-gray-50/50 py-5 px-6">
                                        <div className="flex items-center gap-3">
                                            <div className="bg-purple-100 p-2 rounded-xl">
                                                <Shield className="h-5 w-5 text-purple-600" />
                                            </div>
                                            <div>
                                                <CardTitle className="text-lg font-bold text-gray-900">Role Distribution</CardTitle>
                                                <CardDescription className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Users organised by role</CardDescription>
                                            </div>
                                        </div>
                                        <Button variant="ghost" size="sm" onClick={() => navigate("/roles")} className="text-xs font-bold text-gray-400 hover:text-gray-900">
                                            View All <ArrowUpRight className="ml-1 h-4 w-4" />
                                        </Button>
                                    </CardHeader>
                                    <CardContent className="p-6">
                                        <div className="space-y-4">
                                            {roleDistribution.map((item) => (
                                                <div key={item.role} className="space-y-1.5">
                                                    <div className="flex items-center justify-between text-sm">
                                                        <div className="flex items-center gap-2">
                                                            <div className={`w-2.5 h-2.5 rounded-full ${item.color}`} />
                                                            <span className="font-medium text-gray-900">{item.role}</span>
                                                        </div>
                                                        <div className="flex items-center gap-2 text-xs">
                                                            <span className="text-gray-600 font-semibold">{item.count}</span>
                                                            <span className="text-gray-400">({item.percentage}%)</span>
                                                        </div>
                                                    </div>
                                                    <div className="w-full bg-gray-100 rounded-full h-1.5">
                                                        <div className={`h-1.5 rounded-full ${item.color}`} style={{ width: `${item.percentage}%` }} />
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </CardContent>
                                </Card>
                            </div>
                        </div>

                        {/* Right sidebar (4): Quick Actions + Permission Overview + Profile */}
                        <div className="lg:col-span-4 space-y-8">

                            {/* Quick Actions */}
                            <Card className="border-2 shadow-sm overflow-hidden bg-white reveal-on-scroll">
                                <CardHeader className="bg-gray-50/50 border-b py-5 px-6">
                                    <CardTitle className="text-xs font-bold uppercase tracking-wider text-gray-500">Quick Actions</CardTitle>
                                </CardHeader>
                                <CardContent className="p-4 space-y-3">
                                    <Button variant="outline" className="w-full justify-start h-12 font-semibold text-sm" onClick={() => navigate("/users")}>
                                        <Users className="mr-3 h-4 w-4 text-blue-600" />
                                        Manage Users
                                    </Button>
                                    <Button variant="outline" className="w-full justify-start h-12 font-semibold text-sm" onClick={() => navigate("/roles")}>
                                        <Shield className="mr-3 h-4 w-4 text-purple-600" />
                                        Roles
                                    </Button>
                                    <Button variant="outline" className="w-full justify-start h-12 font-semibold text-sm" onClick={() => navigate("/permissions")}>
                                        <Key className="mr-3 h-4 w-4 text-orange-600" />
                                        Permissions
                                    </Button>
                                    <Button variant="outline" className="w-full justify-start h-12 font-semibold text-sm" onClick={() => navigate("/admin-scheduling")}>
                                        <CalendarDays className="mr-3 h-4 w-4 text-emerald-600" />
                                        Admin Scheduling
                                    </Button>
                                    <Button variant="outline" className="w-full justify-start h-12 font-semibold text-sm" onClick={() => navigate("/settings")}>
                                        <Settings className="mr-3 h-4 w-4 text-gray-600" />
                                        Settings
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
                                        <p className="text-xs text-gray-500 font-medium leading-relaxed px-4">Manage your super admin profile and account settings.</p>
                                    </div>
                                    <Button variant="outline" onClick={() => navigate("/settings")} className="w-full h-12 rounded-xl font-bold text-xs uppercase tracking-wider group-hover:bg-gray-900 group-hover:text-white group-hover:border-gray-900 transition-all shadow-sm">
                                        Update Profile
                                    </Button>
                                </CardContent>
                            </Card>
                        </div>
                    </div>
                    )}

                    {/* ═══════════════════════════════════════════════
                        TUTORING OVERVIEW CHARTS
                    ═══════════════════════════════════════════════ */}
                    {isSectionVisible("tutoringCharts") && (
                    <div className="space-y-6">
                        <div className="flex items-center gap-3">
                            <div className="h-px flex-1 bg-gray-100" />
                            <p className="text-xs font-bold uppercase tracking-widest text-gray-400">Tutoring Charts</p>
                            <div className="h-px flex-1 bg-gray-100" />
                        </div>

                        <div className="grid gap-6 lg:grid-cols-2">
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
                                    <ReactECharts option={statusDonutOption} style={{ height: "260px" }} opts={{ renderer: "svg" }} />
                                </CardContent>
                            </Card>

                            <Card className="border-2 shadow-sm reveal-on-scroll overflow-hidden">
                                <CardHeader className="flex flex-row items-center gap-3 border-b bg-gray-50/50 py-5 px-6">
                                    <div className="bg-orange-100 p-2 rounded-xl">
                                        <TrendingUp className="h-5 w-5 text-orange-600" />
                                    </div>
                                    <div>
                                        <CardTitle className="text-lg font-bold text-gray-900">Priority Breakdown</CardTitle>
                                        <CardDescription className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Requests by priority level</CardDescription>
                                    </div>
                                </CardHeader>
                                <CardContent className="p-6">
                                    <ReactECharts option={priorityBarOption} style={{ height: "260px" }} opts={{ renderer: "svg" }} />
                                </CardContent>
                            </Card>
                        </div>

                        <Card className="border-2 shadow-sm reveal-on-scroll overflow-hidden">
                            <CardHeader className="flex flex-row items-center gap-3 border-b bg-gray-50/50 py-5 px-6">
                                <div className="bg-emerald-100 p-2 rounded-xl">
                                    <CalendarDays className="h-5 w-5 text-emerald-600" />
                                </div>
                                <div>
                                    <CardTitle className="text-lg font-bold text-gray-900">Request Creation Trend</CardTitle>
                                    <CardDescription className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Admin-created vs student-submitted — past 30 days</CardDescription>
                                </div>
                            </CardHeader>
                            <CardContent className="p-6">
                                <ReactECharts option={requestTrendOption} style={{ height: "280px" }} opts={{ renderer: "svg" }} />
                            </CardContent>
                        </Card>
                    </div>
                    )}

                    {/* ═══════════════════════════════════════════════
                        TUTORING SETUP CHARTS
                    ═══════════════════════════════════════════════ */}
                    {isSectionVisible("setupCharts") && (
                    <div className="space-y-6">
                        <div className="flex items-center gap-3">
                            <div className="h-px flex-1 bg-gray-100" />
                            <p className="text-xs font-bold uppercase tracking-widest text-gray-400">Setup Charts</p>
                            <div className="h-px flex-1 bg-gray-100" />
                        </div>

                        <Card className="border-2 shadow-sm reveal-on-scroll overflow-hidden">
                            <CardHeader className="flex flex-row items-center gap-3 border-b bg-gray-50/50 py-5 px-6">
                                <div className="bg-indigo-100 p-2 rounded-xl">
                                    <BarChart2 className="h-5 w-5 text-indigo-600" />
                                </div>
                                <div>
                                    <CardTitle className="text-lg font-bold text-gray-900">Setup at a Glance</CardTitle>
                                    <CardDescription className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Count of each configured entity</CardDescription>
                                </div>
                            </CardHeader>
                            <CardContent className="p-6">
                                <ReactECharts option={setupOverviewOption} style={{ height: "240px" }} opts={{ renderer: "svg" }} />
                            </CardContent>
                        </Card>

                        <div className="grid gap-6 lg:grid-cols-3">
                            <Card className="border-2 shadow-sm reveal-on-scroll overflow-hidden">
                                <CardHeader className="flex flex-row items-center gap-3 border-b bg-gray-50/50 py-5 px-6">
                                    <div className="bg-violet-100 p-2 rounded-xl">
                                        <BookMarked className="h-5 w-5 text-violet-600" />
                                    </div>
                                    <div>
                                        <CardTitle className="text-base font-bold text-gray-900">Subjects per Dept</CardTitle>
                                        <CardDescription className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Spread across departments</CardDescription>
                                    </div>
                                </CardHeader>
                                <CardContent className="p-6">
                                    {(summaryData?.subjectsPerDepartment || []).length === 0 ? (
                                        <p className="text-sm text-gray-400 text-center py-10">No data yet</p>
                                    ) : (
                                        <ReactECharts option={subjectsPerDeptOption} style={{ height: "220px" }} opts={{ renderer: "svg" }} />
                                    )}
                                </CardContent>
                            </Card>

                            <Card className="border-2 shadow-sm reveal-on-scroll overflow-hidden">
                                <CardHeader className="flex flex-row items-center gap-3 border-b bg-gray-50/50 py-5 px-6">
                                    <div className="bg-teal-100 p-2 rounded-xl">
                                        <DoorOpen className="h-5 w-5 text-teal-600" />
                                    </div>
                                    <div>
                                        <CardTitle className="text-base font-bold text-gray-900">Rooms per Building</CardTitle>
                                        <CardDescription className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Campus room distribution</CardDescription>
                                    </div>
                                </CardHeader>
                                <CardContent className="p-6">
                                    {(summaryData?.roomsPerBuilding || []).length === 0 ? (
                                        <p className="text-sm text-gray-400 text-center py-10">No data yet</p>
                                    ) : (
                                        <ReactECharts option={roomsPerBuildingOption} style={{ height: "220px" }} opts={{ renderer: "svg" }} />
                                    )}
                                </CardContent>
                            </Card>

                            <Card className="border-2 shadow-sm reveal-on-scroll overflow-hidden">
                                <CardHeader className="flex flex-row items-center gap-3 border-b bg-gray-50/50 py-5 px-6">
                                    <div className="bg-rose-100 p-2 rounded-xl">
                                        <GraduationCap className="h-5 w-5 text-rose-600" />
                                    </div>
                                    <div>
                                        <CardTitle className="text-base font-bold text-gray-900">Assignments per Dept</CardTitle>
                                        <CardDescription className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Teacher assignments by dept</CardDescription>
                                    </div>
                                </CardHeader>
                                <CardContent className="p-6">
                                    {(summaryData?.assignmentsPerDepartment || []).length === 0 ? (
                                        <p className="text-sm text-gray-400 text-center py-10">No data yet</p>
                                    ) : (
                                        <ReactECharts option={assignmentsPerDeptOption} style={{ height: "220px" }} opts={{ renderer: "svg" }} />
                                    )}
                                </CardContent>
                            </Card>
                        </div>
                    </div>
                    )}

                    {/* ═══════════════════════════════════════════════
                        MARKETING SECTION
                    ═══════════════════════════════════════════════ */}
                    {isSectionVisible("marketing") && (
                    <div className="space-y-6">
                        <div className="flex items-center gap-3">
                            <div className="h-px flex-1 bg-gray-100" />
                            <p className="text-xs font-bold uppercase tracking-widest text-gray-400">Marketing</p>
                            <div className="h-px flex-1 bg-gray-100" />
                        </div>

                        {/* 12-col: Email Performance + Campaigns (left) | Pipeline + Email Health (right) */}
                        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

                            {/* Left (8) */}
                            <div className="lg:col-span-8 space-y-6">

                                {/* Email Performance Chart */}
                                <Card className="border-2 shadow-sm reveal-on-scroll overflow-hidden">
                                    <CardHeader className="flex flex-row items-center gap-3 border-b bg-gray-50/50 py-5 px-6">
                                        <div className="bg-indigo-100 p-2 rounded-xl">
                                            <Send className="h-5 w-5 text-indigo-600" />
                                        </div>
                                        <div>
                                            <CardTitle className="text-lg font-bold text-gray-900">Email Performance</CardTitle>
                                            <CardDescription className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Sent vs Failed — past 14 days</CardDescription>
                                        </div>
                                    </CardHeader>
                                    <CardContent className="p-6">
                                        {emailPerf.length === 0 ? (
                                            <div className="h-[220px] flex items-center justify-center">
                                                <p className="text-sm text-gray-400">No email data yet</p>
                                            </div>
                                        ) : (
                                            <ResponsiveContainer width="100%" height={220}>
                                                <BarChart data={emailPerf} margin={{ top: 4, right: 16, left: -8, bottom: 0 }}>
                                                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                                                    <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                                                    <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                                                    <RechartsTooltip content={<EmailTooltip />} />
                                                    <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 12 }} />
                                                    <Bar dataKey="sent" name="Sent" fill="#6366f1" radius={[4, 4, 0, 0]} />
                                                    <Bar dataKey="failed" name="Failed" fill="#f87171" radius={[4, 4, 0, 0]} />
                                                </BarChart>
                                            </ResponsiveContainer>
                                        )}
                                    </CardContent>
                                </Card>

                                {/* Recent Campaigns Table */}
                                <Card className="border-2 shadow-sm reveal-on-scroll overflow-hidden">
                                    <CardHeader className="flex flex-row items-center justify-between border-b bg-gray-50/50 py-5 px-6">
                                        <div className="flex items-center gap-3">
                                            <div className="bg-purple-100 p-2 rounded-xl">
                                                <Megaphone className="h-5 w-5 text-purple-600" />
                                            </div>
                                            <div>
                                                <CardTitle className="text-lg font-bold text-gray-900">Recent Campaigns</CardTitle>
                                                <CardDescription className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Latest 6 campaigns</CardDescription>
                                            </div>
                                        </div>
                                        <Button variant="ghost" size="sm" onClick={() => navigate("/campaigns")} className="text-xs font-bold text-gray-400 hover:text-gray-900">
                                            View All <ArrowUpRight className="ml-1 h-4 w-4" />
                                        </Button>
                                    </CardHeader>
                                    <CardContent className="p-0">
                                        {campaigns.length === 0 ? (
                                            <div className="p-10 text-center">
                                                <Megaphone className="h-10 w-10 text-gray-300 mx-auto mb-3" />
                                                <p className="text-sm font-medium text-gray-500">No campaigns yet</p>
                                            </div>
                                        ) : (
                                            <Table>
                                                <TableHeader>
                                                    <TableRow className="hover:bg-transparent bg-gray-50/30">
                                                        <TableHead className="font-bold text-[10px] uppercase tracking-wider text-gray-400 pl-6 h-10">Campaign</TableHead>
                                                        <TableHead className="font-bold text-[10px] uppercase tracking-wider text-gray-400 h-10">Status</TableHead>
                                                        <TableHead className="font-bold text-[10px] uppercase tracking-wider text-gray-400 h-10 text-right">Targets</TableHead>
                                                        <TableHead className="font-bold text-[10px] uppercase tracking-wider text-gray-400 h-10 text-right">Sent</TableHead>
                                                        <TableHead className="font-bold text-[10px] uppercase tracking-wider text-gray-400 pr-6 h-10 text-right">Failed</TableHead>
                                                    </TableRow>
                                                </TableHeader>
                                                <TableBody>
                                                    {campaigns.map((c) => (
                                                        <TableRow key={c.id} className="hover:bg-gray-50/50 border-b border-gray-100 cursor-pointer" onClick={() => navigate(`/campaigns/${c.id}`)}>
                                                            <TableCell className="pl-6 py-3 font-semibold text-gray-900 text-sm max-w-[180px] truncate">{c.name}</TableCell>
                                                            <TableCell>
                                                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold ${CAMPAIGN_STATUS_BADGE[c.status] || "bg-gray-100 text-gray-600"}`}>
                                                                    {c.status}
                                                                </span>
                                                            </TableCell>
                                                            <TableCell className="text-right text-sm text-gray-600">{c.totalTargets ?? 0}</TableCell>
                                                            <TableCell className="text-right text-sm text-emerald-600 font-semibold">{c.sentCount ?? 0}</TableCell>
                                                            <TableCell className="pr-6 text-right text-sm text-red-500 font-semibold">{c.failedCount ?? 0}</TableCell>
                                                        </TableRow>
                                                    ))}
                                                </TableBody>
                                            </Table>
                                        )}
                                    </CardContent>
                                </Card>
                            </div>

                            {/* Right (4) */}
                            <div className="lg:col-span-4 space-y-6">

                                {/* Lead Pipeline */}
                                <Card className="border-2 shadow-sm reveal-on-scroll overflow-hidden">
                                    <CardHeader className="flex flex-row items-center gap-3 border-b bg-gray-50/50 py-5 px-6">
                                        <div className="bg-blue-100 p-2 rounded-xl">
                                            <Layers className="h-5 w-5 text-blue-600" />
                                        </div>
                                        <div>
                                            <CardTitle className="text-base font-bold text-gray-900">Lead Pipeline</CardTitle>
                                            <CardDescription className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Leads by status</CardDescription>
                                        </div>
                                    </CardHeader>
                                    <CardContent className="p-6 space-y-3">
                                        {pipeline.length === 0 ? (
                                            <p className="text-sm text-gray-400 text-center py-6">No leads yet</p>
                                        ) : (
                                            pipeline.map((stage, i) => (
                                                <div key={stage.name} className="space-y-1">
                                                    <div className="flex justify-between text-xs">
                                                        <span className="font-medium text-gray-700">{stage.name}</span>
                                                        <span className="font-bold text-gray-900">{stage.count}</span>
                                                    </div>
                                                    <div className="w-full bg-gray-100 rounded-full h-1.5">
                                                        <div
                                                            className={`h-1.5 rounded-full ${PIPELINE_COLORS[i % PIPELINE_COLORS.length]}`}
                                                            style={{ width: pipelineTotal ? `${Math.round((stage.count / pipelineTotal) * 100)}%` : "0%" }}
                                                        />
                                                    </div>
                                                </div>
                                            ))
                                        )}
                                    </CardContent>
                                </Card>

                                {/* Email Health */}
                                <Card className="border-2 shadow-sm reveal-on-scroll overflow-hidden">
                                    <CardHeader className="flex flex-row items-center gap-3 border-b bg-gray-50/50 py-5 px-6">
                                        <div className="bg-emerald-100 p-2 rounded-xl">
                                            <MailCheck className="h-5 w-5 text-emerald-600" />
                                        </div>
                                        <div>
                                            <CardTitle className="text-base font-bold text-gray-900">Email Health</CardTitle>
                                            <CardDescription className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Send success metrics</CardDescription>
                                        </div>
                                    </CardHeader>
                                    <CardContent className="p-6 space-y-4">
                                        <div className="text-center">
                                            <div className={`text-4xl font-bold ${successPct >= 90 ? "text-emerald-600" : successPct >= 70 ? "text-amber-600" : "text-red-600"}`}>
                                                {successPct}%
                                            </div>
                                            <p className="text-xs text-gray-400 mt-1">Success Rate</p>
                                        </div>
                                        <div className="w-full bg-gray-100 rounded-full h-2">
                                            <div
                                                className={`h-2 rounded-full ${successPct >= 90 ? "bg-emerald-500" : successPct >= 70 ? "bg-amber-500" : "bg-red-500"}`}
                                                style={{ width: `${successPct}%` }}
                                            />
                                        </div>
                                        <div className="grid grid-cols-2 gap-3">
                                            <div className="bg-emerald-50 rounded-xl p-3 text-center">
                                                <MailCheck className="h-4 w-4 text-emerald-600 mx-auto mb-1" />
                                                <div className="text-lg font-bold text-emerald-700">{(marketingOverview?.totalEmailsSent ?? 0).toLocaleString()}</div>
                                                <div className="text-[10px] text-emerald-600 font-semibold uppercase">Sent</div>
                                            </div>
                                            <div className="bg-red-50 rounded-xl p-3 text-center">
                                                <MailX className="h-4 w-4 text-red-500 mx-auto mb-1" />
                                                <div className="text-lg font-bold text-red-600">{(marketingOverview?.totalEmailsFailed ?? 0).toLocaleString()}</div>
                                                <div className="text-[10px] text-red-500 font-semibold uppercase">Failed</div>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            </div>
                        </div>
                    </div>
                    )}

                </div>
            )}
        </AppLayout>
    );
}
