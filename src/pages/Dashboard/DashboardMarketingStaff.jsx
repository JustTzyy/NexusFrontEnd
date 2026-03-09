import { useEffect, useState, useMemo, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { marketingAnalyticsService } from "@/services/marketingAnalyticsService";
import AppLayout from "@/layouts/AppLayout";
import { generatePDF } from "../../utils/pdfExport";
import DateRangeFilter from "../../components/DateRangeFilter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, Legend,
} from "recharts";
import {
    Users, UserCheck, TrendingUp, Mail, Megaphone, Send, ChevronRight,
    ArrowUpRight, AlertCircle, MailCheck, MailX, PieChart, Layers,
    Search, X,
} from "lucide-react";

// ─── helpers ────────────────────────────────────────────────────────────────

const CAMPAIGN_STATUS_BADGE = {
    Sent:      "bg-green-100 text-green-700 ring-1 ring-green-200",
    Sending:   "bg-purple-100 text-purple-700 ring-1 ring-purple-200",
    Scheduled: "bg-blue-100 text-blue-700 ring-1 ring-blue-200",
    Draft:     "bg-gray-100 text-gray-600 ring-1 ring-gray-200",
    Paused:    "bg-amber-100 text-amber-700 ring-1 ring-amber-200",
    Cancelled: "bg-red-100 text-red-700 ring-1 ring-red-200",
};

const PIPELINE_COLORS = [
    "bg-blue-500", "bg-purple-500", "bg-amber-500",
    "bg-green-500", "bg-rose-500", "bg-indigo-500",
];

// ─── skeleton ────────────────────────────────────────────────────────────────

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
                            <div className="space-y-2">
                                <Skeleton className="h-4 w-24" />
                                <Skeleton className="h-3 w-16" />
                            </div>
                            <Skeleton className="h-8 w-8 rounded-xl" />
                        </div>
                        <Skeleton className="h-8 w-16 mt-3" />
                    </CardContent>
                </Card>
            ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-8 space-y-6">
                <Card><CardContent className="p-6"><Skeleton className="h-52 w-full" /></CardContent></Card>
                <Card><CardContent className="p-6"><Skeleton className="h-48 w-full" /></CardContent></Card>
            </div>
            <div className="lg:col-span-4 space-y-6">
                <Card><CardContent className="p-6"><Skeleton className="h-40 w-full" /></CardContent></Card>
                <Card><CardContent className="p-6"><Skeleton className="h-36 w-full" /></CardContent></Card>
            </div>
        </div>
    </div>
);

// ─── custom recharts tooltip ─────────────────────────────────────────────────

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

// ─── main component ───────────────────────────────────────────────────────────

export default function DashboardMarketingStaff() {
    const navigate = useNavigate();
    const { user, logout } = useAuth();

    const [overview, setOverview]   = useState(null);
    const [campaigns, setCampaigns] = useState([]);
    const [pipeline, setPipeline]   = useState([]);
    const [emailPerf, setEmailPerf] = useState([]);
    const [loading, setLoading]     = useState(true);
    const [filtering, setFiltering] = useState(false);
    const [fromDate, setFromDate]   = useState(undefined);
    const [toDate, setToDate]       = useState(undefined);
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

    const fetchAll = useCallback(async (from, to, isFilter = false) => {
        if (isFilter) setFiltering(true);
        else setLoading(true);
        try {
            const overviewParams = {};
            if (from) overviewParams.fromDate = from.toISOString();
            if (to) overviewParams.toDate = to.toISOString();
            const perfParams = { groupBy: "day" };
            if (from) perfParams.fromDate = from.toISOString();
            if (to) perfParams.toDate = to.toISOString();
            const [ovRes, campRes, plRes, perfRes] = await Promise.all([
                marketingAnalyticsService.getOverview(overviewParams),
                marketingAnalyticsService.getCampaignStats(),
                marketingAnalyticsService.getLeadPipeline(),
                marketingAnalyticsService.getEmailPerformance(perfParams),
            ]);
            setOverview(ovRes.data);
            setCampaigns((campRes.data || []).slice(0, 6));
            const plRaw = plRes.data || [];
            setPipeline(
                Array.isArray(plRaw)
                    ? plRaw.map((p) => ({ name: p.status, count: p.count }))
                    : Object.entries(plRaw).map(([name, count]) => ({ name, count }))
            );
            setEmailPerf((perfRes.data || []).slice(-14));
        } catch {
            // non-blocking — empty states handle missing data
        } finally {
            setLoading(false);
            setFiltering(false);
        }
    }, []);

    useEffect(() => {
        const isFilter = !isInitialMount.current;
        if (isInitialMount.current) isInitialMount.current = false;
        fetchAll(fromDate, toDate, isFilter);
    }, [fromDate, toDate]);

    const firstName = user?.fullName?.split(" ")[0] || "Staff";
    const initials  = user?.fullName?.split(" ").map((n) => n[0]).join("") || "MS";

    const handleLogout = () => { logout(); navigate("/login"); };

    const statCards = useMemo(() => {
        if (!overview) return [];
        const total = (overview.totalEmailsSent ?? 0) + (overview.totalEmailsFailed ?? 0);
        const successRate = total > 0
            ? overview.sendSuccessRate != null
                ? `${overview.sendSuccessRate.toFixed(1)}%`
                : `${((overview.totalEmailsSent / total) * 100).toFixed(1)}%`
            : "—";
        const convRate = overview.conversionRate != null
            ? `${overview.conversionRate.toFixed(1)}%`
            : overview.totalLeads > 0
                ? `${((overview.totalCustomers / overview.totalLeads) * 100).toFixed(1)}%`
                : "0%";
        return [
            { title: "Total Leads",     value: overview.totalLeads ?? 0,     icon: Users,     color: "text-blue-600",   bgColor: "bg-blue-100",   desc: "In pipeline",       path: "/marketing/leads" },
            { title: "Customers",       value: overview.totalCustomers ?? 0, icon: UserCheck, color: "text-green-600",  bgColor: "bg-green-100",  desc: "Converted leads",   path: "/marketing/customers" },
            { title: "Conversion Rate", value: convRate,                     icon: TrendingUp,color: "text-purple-600", bgColor: "bg-purple-100", desc: "Lead → Customer",   path: "/marketing/customers" },
            { title: "Email Success",   value: successRate,                  icon: MailCheck, color: "text-indigo-600", bgColor: "bg-indigo-100", desc: `${overview.totalEmailsSent ?? 0} sent`, path: "/marketing/email-messages" },
        ];
    }, [overview]);

    const pipelineTotal = useMemo(() => pipeline.reduce((s, p) => s + p.count, 0), [pipeline]);

    const successPct = useMemo(() => {
        if (!overview) return 0;
        const total = (overview.totalEmailsSent ?? 0) + (overview.totalEmailsFailed ?? 0);
        if (total === 0) return 0;
        return overview.sendSuccessRate != null
            ? overview.sendSuccessRate
            : (overview.totalEmailsSent / total) * 100;
    }, [overview]);

    const handlePrint = useCallback(() => {
        generatePDF({
            title: "Marketing Staff Dashboard Report",
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
            title="Marketing Dashboard"
            brand={{ name: "NexUs", subtitle: "Marketing Portal", mark: "NX" }}
            onLogout={handleLogout}
            onPrint={handlePrint}
            user={{ name: user?.fullName || "Marketing Staff", initials, email: user?.email || "" }}
        >
            {loading ? (
                <DashboardSkeleton />
            ) : (
                <div ref={printRef} className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-700 max-w-7xl mx-auto">

                    {/* ── Welcome Bar ── */}
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
                                                Marketing Staff
                                            </Badge>
                                        </div>
                                    </div>
                                    <Button
                                        onClick={() => navigate("/marketing/campaigns")}
                                        className="h-10 px-6 font-semibold shadow-lg transition-all"
                                    >
                                        Campaigns
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

                    {/* ── KPI Stats Grid ── */}
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                        {filterCards(statCards).map((stat) => (
                            <Card
                                key={stat.title}
                                className="reveal-on-scroll hover:shadow-lg transition-all cursor-pointer group"
                                onClick={() => navigate(stat.path)}
                            >
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
                                        {filtering ? <Skeleton className="h-8 w-14" /> : <div className="text-3xl font-bold text-gray-900">{stat.value}</div>}
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>

                    {/* ── Main 2-column layout ── */}
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

                        {/* Left column */}
                        <div className="lg:col-span-8 space-y-8">

                            {/* Email Performance Chart */}
                            <Card className="border-2 shadow-sm reveal-on-scroll overflow-hidden">
                                <CardHeader className="flex flex-row items-center justify-between border-b bg-gray-50/50 py-5 px-6">
                                    <div className="flex items-center gap-3">
                                        <div className="bg-indigo-100 p-2 rounded-xl">
                                            <Mail className="h-5 w-5 text-indigo-600" />
                                        </div>
                                        <div>
                                            <CardTitle className="text-lg font-bold text-gray-900">Email Performance</CardTitle>
                                            <CardDescription className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                                                Sent vs failed — last 14 days
                                            </CardDescription>
                                        </div>
                                    </div>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => navigate("/marketing/email-messages")}
                                        className="text-xs font-bold text-gray-400 hover:text-gray-900"
                                    >
                                        View All <ArrowUpRight className="ml-1 h-4 w-4" />
                                    </Button>
                                </CardHeader>
                                <CardContent className="p-6">
                                    {emailPerf.length === 0 ? (
                                        <div className="py-12 text-center">
                                            <Mail className="h-10 w-10 text-gray-200 mx-auto mb-3" />
                                            <p className="text-sm font-medium text-gray-500">No email data yet</p>
                                            <p className="text-xs text-gray-400 mt-1">Performance will appear once emails are sent</p>
                                        </div>
                                    ) : (
                                        <>
                                            <div className="flex gap-4 mb-5">
                                                <div className="flex items-center gap-2 bg-indigo-50 rounded-lg px-3 py-2">
                                                    <MailCheck className="h-4 w-4 text-indigo-600" />
                                                    <div>
                                                        <p className="text-[10px] font-bold uppercase tracking-wider text-indigo-400">Period Sent</p>
                                                        <p className="text-lg font-bold text-indigo-700 leading-none">
                                                            {emailPerf.reduce((s, d) => s + (d.sent ?? 0), 0)}
                                                        </p>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-2 bg-red-50 rounded-lg px-3 py-2">
                                                    <MailX className="h-4 w-4 text-red-500" />
                                                    <div>
                                                        <p className="text-[10px] font-bold uppercase tracking-wider text-red-400">Period Failed</p>
                                                        <p className="text-lg font-bold text-red-600 leading-none">
                                                            {emailPerf.reduce((s, d) => s + (d.failed ?? 0), 0)}
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>
                                            <ResponsiveContainer width="100%" height={200}>
                                                <BarChart data={emailPerf} margin={{ top: 0, right: 4, left: -20, bottom: 0 }}>
                                                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                                                    <XAxis dataKey="period" tick={{ fontSize: 10 }} interval="preserveStartEnd" />
                                                    <YAxis tick={{ fontSize: 10 }} allowDecimals={false} />
                                                    <RechartsTooltip content={<EmailTooltip />} />
                                                    <Legend wrapperStyle={{ fontSize: 11 }} />
                                                    <Bar dataKey="sent"   name="Sent"   fill="#6366f1" radius={[4, 4, 0, 0]} />
                                                    <Bar dataKey="failed" name="Failed" fill="#f87171" radius={[4, 4, 0, 0]} />
                                                </BarChart>
                                            </ResponsiveContainer>
                                        </>
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
                                            <CardDescription className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                                                Latest campaign performance
                                            </CardDescription>
                                        </div>
                                    </div>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => navigate("/marketing/campaigns")}
                                        className="text-xs font-bold text-gray-400 hover:text-gray-900"
                                    >
                                        View All <ArrowUpRight className="ml-1 h-4 w-4" />
                                    </Button>
                                </CardHeader>
                                <CardContent className="p-0">
                                    {campaigns.length === 0 ? (
                                        <div className="p-12 text-center">
                                            <Megaphone className="h-10 w-10 text-gray-300 mx-auto mb-3" />
                                            <p className="text-sm font-medium text-gray-500">No campaigns yet</p>
                                            <p className="text-xs text-gray-400 mt-1">Campaigns will appear here once created</p>
                                        </div>
                                    ) : (
                                        <Table>
                                            <TableHeader>
                                                <TableRow className="hover:bg-transparent bg-gray-50/30">
                                                    <TableHead className="font-bold text-[10px] uppercase tracking-wider text-gray-400 pl-6 h-10">Campaign</TableHead>
                                                    <TableHead className="font-bold text-[10px] uppercase tracking-wider text-gray-400 h-10">Status</TableHead>
                                                    <TableHead className="font-bold text-[10px] uppercase tracking-wider text-gray-400 h-10 text-right">Targets</TableHead>
                                                    <TableHead className="font-bold text-[10px] uppercase tracking-wider text-gray-400 h-10 text-right">Sent</TableHead>
                                                    <TableHead className="font-bold text-[10px] uppercase tracking-wider text-gray-400 h-10 text-right">Failed</TableHead>
                                                    <TableHead className="font-bold text-[10px] uppercase tracking-wider text-gray-400 pr-6 h-10 text-right">Date</TableHead>
                                                </TableRow>
                                            </TableHeader>
                                            <TableBody>
                                                {campaigns.map((c) => {
                                                    const id   = c.id ?? c.campaignId;
                                                    const name = c.name ?? c.campaignName;
                                                    const deliveryPct = c.totalTargets > 0
                                                        ? Math.round((c.sentCount / c.totalTargets) * 100)
                                                        : null;
                                                    return (
                                                        <TableRow
                                                            key={id}
                                                            className="hover:bg-gray-50/50 transition-all cursor-pointer border-b border-gray-100"
                                                            onClick={() => navigate(`/marketing/campaigns/${id}`)}
                                                        >
                                                            <TableCell className="pl-6 py-4">
                                                                <div className="font-semibold text-gray-900 text-sm">{name}</div>
                                                                {deliveryPct != null && (
                                                                    <div className="flex items-center gap-2 mt-1">
                                                                        <div className="h-1 w-20 bg-gray-100 rounded-full overflow-hidden">
                                                                            <div
                                                                                className="h-full bg-indigo-400 rounded-full"
                                                                                style={{ width: `${deliveryPct}%` }}
                                                                            />
                                                                        </div>
                                                                        <span className="text-[10px] text-gray-400 font-medium">{deliveryPct}%</span>
                                                                    </div>
                                                                )}
                                                            </TableCell>
                                                            <TableCell>
                                                                <Badge className={`text-[10px] font-bold uppercase px-2 ${CAMPAIGN_STATUS_BADGE[c.status] || "bg-gray-100 text-gray-600"}`}>
                                                                    {c.status}
                                                                </Badge>
                                                            </TableCell>
                                                            <TableCell className="text-right text-sm text-gray-600 font-medium">{c.totalTargets ?? "—"}</TableCell>
                                                            <TableCell className="text-right text-sm text-green-600 font-semibold">{c.sentCount ?? "—"}</TableCell>
                                                            <TableCell className="text-right text-sm text-red-500 font-medium">{c.failedCount ?? "—"}</TableCell>
                                                            <TableCell className="pr-6 text-right text-xs text-gray-400">
                                                                {c.sentAt ? new Date(c.sentAt).toLocaleDateString() : "—"}
                                                            </TableCell>
                                                        </TableRow>
                                                    );
                                                })}
                                            </TableBody>
                                        </Table>
                                    )}
                                </CardContent>
                            </Card>
                        </div>

                        {/* Right sidebar */}
                        <div className="lg:col-span-4 space-y-8">

                            {/* Lead Pipeline */}
                            <Card className="border-2 shadow-sm overflow-hidden reveal-on-scroll">
                                <CardHeader className="flex flex-row items-center justify-between border-b bg-gray-50/50 py-5 px-6">
                                    <div className="flex items-center gap-3">
                                        <div className="bg-blue-100 p-2 rounded-xl">
                                            <Layers className="h-5 w-5 text-blue-600" />
                                        </div>
                                        <div>
                                            <CardTitle className="text-sm font-bold text-gray-900">Lead Pipeline</CardTitle>
                                            <CardDescription className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">By stage</CardDescription>
                                        </div>
                                    </div>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => navigate("/marketing/leads")}
                                        className="text-xs font-bold text-gray-400 hover:text-gray-900 p-1"
                                    >
                                        <ArrowUpRight className="h-4 w-4" />
                                    </Button>
                                </CardHeader>
                                <CardContent className="p-5">
                                    {pipeline.length === 0 ? (
                                        <div className="py-8 text-center">
                                            <PieChart className="h-8 w-8 text-gray-200 mx-auto mb-2" />
                                            <p className="text-xs text-gray-400">No pipeline data</p>
                                        </div>
                                    ) : (
                                        <div className="space-y-3">
                                            {pipeline.map((stage, i) => {
                                                const pct = pipelineTotal > 0 ? Math.round((stage.count / pipelineTotal) * 100) : 0;
                                                return (
                                                    <div key={stage.name}>
                                                        <div className="flex items-center justify-between mb-1">
                                                            <div className="flex items-center gap-2">
                                                                <div className={`w-2 h-2 rounded-full ${PIPELINE_COLORS[i % PIPELINE_COLORS.length]}`} />
                                                                <span className="text-xs font-medium text-gray-700 truncate max-w-[130px]">{stage.name}</span>
                                                            </div>
                                                            <div className="flex items-center gap-2">
                                                                <span className="text-xs font-bold text-gray-900">{stage.count}</span>
                                                                <span className="text-[10px] text-gray-400 w-8 text-right">{pct}%</span>
                                                            </div>
                                                        </div>
                                                        <div className="h-1.5 w-full bg-gray-100 rounded-full overflow-hidden">
                                                            <div
                                                                className={`h-full rounded-full ${PIPELINE_COLORS[i % PIPELINE_COLORS.length]}`}
                                                                style={{ width: `${pct}%` }}
                                                            />
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                            <div className="pt-2 border-t flex items-center justify-between">
                                                <span className="text-xs text-gray-500 font-medium">Total</span>
                                                <span className="text-sm font-bold text-gray-900">{pipelineTotal}</span>
                                            </div>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>

                            {/* Email Health */}
                            <Card className="border-2 shadow-sm overflow-hidden reveal-on-scroll">
                                <CardHeader className="border-b bg-gray-50/50 py-5 px-6">
                                    <div className="flex items-center gap-3">
                                        <div className="bg-green-100 p-2 rounded-xl">
                                            <Send className="h-5 w-5 text-green-600" />
                                        </div>
                                        <div>
                                            <CardTitle className="text-sm font-bold text-gray-900">Email Health</CardTitle>
                                            <CardDescription className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">All-time metrics</CardDescription>
                                        </div>
                                    </div>
                                </CardHeader>
                                <CardContent className="p-5 space-y-3">
                                    {[
                                        { label: "Sent",      value: overview?.totalEmailsSent,   color: "text-green-600",  dot: "bg-green-500" },
                                        { label: "Failed",    value: overview?.totalEmailsFailed, color: "text-red-500",    dot: "bg-red-400" },
                                        { label: "Campaigns", value: overview?.totalCampaigns,    color: "text-purple-600", dot: "bg-purple-500" },
                                    ].map((row) => (
                                        <div key={row.label} className="flex items-center justify-between py-1">
                                            <div className="flex items-center gap-2">
                                                <div className={`w-2 h-2 rounded-full ${row.dot}`} />
                                                <span className="text-sm text-gray-600">{row.label}</span>
                                            </div>
                                            <span className={`text-sm font-bold ${row.color}`}>{row.value ?? 0}</span>
                                        </div>
                                    ))}
                                    <div className="pt-2 border-t">
                                        <div className="flex items-center justify-between mb-1.5">
                                            <span className="text-xs text-gray-500">Success rate</span>
                                            <span className="text-xs font-bold text-gray-900">
                                                {successPct > 0 ? `${successPct.toFixed(1)}%` : "—"}
                                            </span>
                                        </div>
                                        <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
                                            <div
                                                className="h-full bg-green-500 rounded-full transition-all"
                                                style={{ width: `${successPct}%` }}
                                            />
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Quick Actions */}
                            <Card className="border-2 shadow-sm overflow-hidden bg-white reveal-on-scroll">
                                <CardHeader className="bg-gray-50/50 border-b py-5 px-6">
                                    <CardTitle className="text-xs font-bold uppercase tracking-wider text-gray-500">Quick Actions</CardTitle>
                                </CardHeader>
                                <CardContent className="p-4 space-y-3">
                                    <Button
                                        variant="outline"
                                        className="w-full justify-start h-12 font-semibold text-sm"
                                        onClick={() => navigate("/marketing/campaigns")}
                                    >
                                        <Megaphone className="mr-3 h-4 w-4 text-purple-600" />
                                        Manage Campaigns
                                    </Button>
                                    <Button
                                        variant="outline"
                                        className="w-full justify-start h-12 font-semibold text-sm"
                                        onClick={() => navigate("/marketing/leads")}
                                    >
                                        <Users className="mr-3 h-4 w-4 text-blue-600" />
                                        View Leads
                                    </Button>
                                    <Button
                                        variant="outline"
                                        className="w-full justify-start h-12 font-semibold text-sm"
                                        onClick={() => navigate("/marketing/email-messages")}
                                    >
                                        <Mail className="mr-3 h-4 w-4 text-indigo-600" />
                                        Email Logs
                                    </Button>
                                    <Button
                                        variant="outline"
                                        className="w-full justify-start h-12 font-semibold text-sm"
                                        onClick={() => navigate("/marketing/suppressions")}
                                    >
                                        <AlertCircle className="mr-3 h-4 w-4 text-red-500" />
                                        Suppression List
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
