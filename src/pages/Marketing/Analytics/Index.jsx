import { useEffect, useState } from 'react';
import { marketingAnalyticsService } from '../../../services/marketingAnalyticsService';
import AppLayout from '../../../layouts/AppLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    LineChart,
    Line,
    Legend,
} from 'recharts';
import { TrendingUp, Mail, Users, Target, AlertCircle } from 'lucide-react';

const CAMPAIGN_STATUS_CLASSES = {
    Sent: 'bg-green-100 text-green-700',
    Sending: 'bg-purple-100 text-purple-700',
    Scheduled: 'bg-blue-100 text-blue-700',
    Draft: 'bg-gray-100 text-gray-600',
    Paused: 'bg-amber-100 text-amber-700',
    Cancelled: 'bg-red-100 text-red-700',
};

export default function MarketingAnalyticsIndex() {
    const [overview, setOverview] = useState(null);
    const [pipeline, setPipeline] = useState([]);
    const [emailPerformance, setEmailPerformance] = useState([]);
    const [campaignStats, setCampaignStats] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        const load = async () => {
            setLoading(true);
            setError('');
            try {
                const [ovRes, pipRes, campRes, perfRes] = await Promise.all([
                    marketingAnalyticsService.getOverview(),
                    marketingAnalyticsService.getLeadPipeline(),
                    marketingAnalyticsService.getCampaignStats(),
                    marketingAnalyticsService.getEmailPerformance({ groupBy: 'day' }),
                ]);
                setOverview(ovRes.data);

                const plData = pipRes.data || {};
                if (Array.isArray(plData)) {
                    setPipeline(plData.map((p) => ({ name: p.status, count: p.count })));
                } else {
                    setPipeline(Object.entries(plData).map(([name, count]) => ({ name, count })));
                }

                setCampaignStats(campRes.data || []);
                setEmailPerformance(perfRes.data || []);
            } catch (err) {
                setError(err.message || 'Failed to load analytics');
            } finally {
                setLoading(false);
            }
        };
        load();
    }, []);

    const kpiCards = [
        {
            icon: Users,
            label: 'Total Leads',
            value: overview?.totalLeads ?? 0,
            color: 'text-blue-700',
            bg: 'bg-blue-50',
        },
        {
            icon: Target,
            label: 'Customers',
            value: overview?.totalCustomers ?? 0,
            color: 'text-green-700',
            bg: 'bg-green-50',
        },
        {
            icon: TrendingUp,
            label: 'Conversion Rate',
            value:
                overview?.totalLeads > 0
                    ? `${((overview.totalCustomers / overview.totalLeads) * 100).toFixed(1)}%`
                    : '0%',
            color: 'text-purple-700',
            bg: 'bg-purple-50',
        },
        {
            icon: Mail,
            label: 'Emails Sent',
            value: overview?.totalEmailsSent ?? 0,
            color: 'text-amber-700',
            bg: 'bg-amber-50',
        },
    ];

    return (
        <AppLayout title="Marketing Analytics">
            <div className="space-y-6">
                {/* Header */}
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Marketing Analytics</h1>
                    <p className="mt-1 text-sm text-gray-600">
                        Overview of leads, conversions, and email performance
                    </p>
                </div>

                {error && (
                    <Alert variant="destructive">
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription>{error}</AlertDescription>
                    </Alert>
                )}

                {/* KPI Cards */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {kpiCards.map((kpi) => (
                        <Card key={kpi.label}>
                            <CardContent className="pt-5">
                                <div className="flex items-center gap-3">
                                    <div className={`p-2 rounded-lg ${kpi.bg}`}>
                                        <kpi.icon className={`h-5 w-5 ${kpi.color}`} />
                                    </div>
                                    <div>
                                        {loading ? (
                                            <Skeleton className="h-7 w-16 mb-1" />
                                        ) : (
                                            <p className="text-2xl font-bold text-gray-900">{kpi.value}</p>
                                        )}
                                        <p className="text-xs text-gray-500">{kpi.label}</p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>

                {/* Charts Row */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Lead Pipeline Bar Chart */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Lead Pipeline</CardTitle>
                        </CardHeader>
                        <CardContent>
                            {loading ? (
                                <Skeleton className="h-52 w-full" />
                            ) : pipeline.length === 0 ? (
                                <p className="text-center text-gray-400 py-10">No lead data</p>
                            ) : (
                                <ResponsiveContainer width="100%" height={220}>
                                    <BarChart
                                        data={pipeline}
                                        margin={{ top: 4, right: 8, left: -20, bottom: 0 }}
                                    >
                                        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                                        <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                                        <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                                        <Tooltip />
                                        <Bar
                                            dataKey="count"
                                            name="Leads"
                                            fill="#3b82f6"
                                            radius={[4, 4, 0, 0]}
                                        />
                                    </BarChart>
                                </ResponsiveContainer>
                            )}
                        </CardContent>
                    </Card>

                    {/* Email Performance Line Chart */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Email Performance</CardTitle>
                        </CardHeader>
                        <CardContent>
                            {loading ? (
                                <Skeleton className="h-52 w-full" />
                            ) : emailPerformance.length === 0 ? (
                                <p className="text-center text-gray-400 py-10">No email data</p>
                            ) : (
                                <ResponsiveContainer width="100%" height={220}>
                                    <LineChart
                                        data={emailPerformance}
                                        margin={{ top: 4, right: 8, left: -20, bottom: 0 }}
                                    >
                                        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                                        <XAxis dataKey="period" tick={{ fontSize: 11 }} />
                                        <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                                        <Tooltip />
                                        <Legend wrapperStyle={{ fontSize: 11 }} />
                                        <Line
                                            type="monotone"
                                            dataKey="sent"
                                            name="Sent"
                                            stroke="#16a34a"
                                            strokeWidth={2}
                                            dot={false}
                                        />
                                        <Line
                                            type="monotone"
                                            dataKey="failed"
                                            name="Failed"
                                            stroke="#dc2626"
                                            strokeWidth={2}
                                            dot={false}
                                        />
                                    </LineChart>
                                </ResponsiveContainer>
                            )}
                        </CardContent>
                    </Card>
                </div>

                {/* Campaign Performance Table */}
                <Card>
                    <CardHeader>
                        <CardTitle>Campaign Performance</CardTitle>
                    </CardHeader>
                    <CardContent>
                        {loading ? (
                            <div className="space-y-2">
                                {Array.from({ length: 5 }).map((_, i) => (
                                    <Skeleton key={i} className="h-10 w-full" />
                                ))}
                            </div>
                        ) : campaignStats.length === 0 ? (
                            <p className="text-center text-gray-400 py-8">No campaign data</p>
                        ) : (
                            <div className="border rounded-lg overflow-hidden">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Campaign</TableHead>
                                            <TableHead className="text-center">Status</TableHead>
                                            <TableHead className="text-center">Targets</TableHead>
                                            <TableHead className="text-center">Sent</TableHead>
                                            <TableHead className="text-center">Failed</TableHead>
                                            <TableHead className="text-center">Suppressed</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {campaignStats.map((c, i) => (
                                            <TableRow key={c.campaignId || c.id || i}>
                                                <TableCell className="font-medium">
                                                    {c.campaignName || c.name || '—'}
                                                </TableCell>
                                                <TableCell className="text-center">
                                                    <span
                                                        className={`text-xs px-1.5 py-0.5 rounded font-medium ${
                                                            CAMPAIGN_STATUS_CLASSES[c.status] ||
                                                            'bg-gray-100 text-gray-600'
                                                        }`}
                                                    >
                                                        {c.status}
                                                    </span>
                                                </TableCell>
                                                <TableCell className="text-center text-gray-600">
                                                    {c.totalTargets ?? c.targets ?? '—'}
                                                </TableCell>
                                                <TableCell className="text-center text-gray-600">
                                                    {c.sentCount ?? c.sent ?? '—'}
                                                </TableCell>
                                                <TableCell className="text-center text-gray-600">
                                                    {c.failedCount ?? c.failed ?? '—'}
                                                </TableCell>
                                                <TableCell className="text-center text-gray-600">
                                                    {c.suppressedCount ?? c.suppressed ?? '—'}
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </AppLayout>
    );
}
