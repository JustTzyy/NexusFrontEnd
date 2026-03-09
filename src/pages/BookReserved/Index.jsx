import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import AppLayout from "../../layouts/AppLayout";
import { applyFilters, paginate } from "../../utils/filterUtils";
import DateRangeFilter from "../../components/DateRangeFilter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import {
    Search,
    Calendar,
    Clock,
    MapPin,
    User,
    BookOpen,
    CheckCircle2,
    ChevronRight,
    ArrowRight,
    Trophy,
    Zap,
    History,
    Sparkles,
    MoreVertical
} from "lucide-react";
import { useGoogleLogin } from "@react-oauth/google";
import { createGoogleCalendarEvent } from "../../services/googleCalendarService";
import { toast } from "sonner";

export default function BookReservedIndex() {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [isSyncing, setIsSyncing] = useState(false);
    const [q, setQ] = useState("");
    const [fromDate, setFromDate] = useState(undefined);
    const [toDate, setToDate] = useState(undefined);
    const [page, setPage] = useState(1);
    const pageSize = 4; // Balanced page size

    // Mock Reserved Sessions Data
    const [reservedSessions, setReservedSessions] = useState([]);

    useEffect(() => {
        const timer = setTimeout(() => {
            setReservedSessions([
                {
                    id: 501,
                    subject: "Advanced Calculus",
                    date: "Monday, Feb 10, 2026",
                    time: "09:00 AM - 11:00 AM",
                    teacher: "Prof. Sarah Johnson",
                    building: "Main Academic Building",
                    room: "Room 302",
                    status: "Confirmed",
                    type: "1-on-1 Private",
                    category: "Mathematics"
                },
                {
                    id: 502,
                    subject: "Quantum Mechanics",
                    date: "Wednesday, Feb 12, 2026",
                    time: "02:00 PM - 04:00 PM",
                    teacher: "Dr. Robert Chen",
                    building: "Science Hall",
                    room: "Lab B",
                    status: "Upcoming",
                    type: "1-on-1 Private",
                    category: "Physics"
                }
            ]);
            setLoading(false);
        }, 800);
        return () => clearTimeout(timer);
    }, []);

    /* ------------------------- filtering ------------------------- */
    const filtered = useMemo(() => {
        return applyFilters(reservedSessions, {
            search: q,
            searchFields: ['subject', 'teacher', 'building', 'room'],
            fromDate,
            toDate,
            dateField: 'date',
        });
    }, [reservedSessions, q, fromDate, toDate]);

    const paginationResult = useMemo(() => {
        return paginate(filtered, page, pageSize);
    }, [filtered, page, pageSize]);

    const { data: paged, total, totalPages, page: safePage } = paginationResult;

    const clearFilters = () => {
        setQ("");
        setFromDate(undefined);
        setToDate(undefined);
        setPage(1);
    };

    const handleSyncToCalendar = useGoogleLogin({
        onSuccess: async (tokenResponse) => {
            setIsSyncing(true);
            try {
                const token = tokenResponse.access_token;

                // Sync all reserved sessions to Google Calendar
                for (const session of reservedSessions) {
                    await createGoogleCalendarEvent(token, session);
                }

                toast.success("Brilliant! Your sessions are now synced to your Google Calendar.");
            } catch (error) {
                console.error("Google Sync Error:", error);
                toast.error(`Sync failed: ${error.message}`);
            } finally {
                setIsSyncing(false);
            }
        },
        onError: (error) => {
            console.error("Login Failed:", error);
            toast.error("Google Login failed. Please try again.");
        },
        scope: "https://www.googleapis.com/auth/calendar.events",
    });

    return (
        <AppLayout
            title="My Reservations"
            brand={{ name: "NexUs", subtitle: "Tutoring Portal", mark: "NX" }}
            onLogout={() => navigate("/login")}
            user={{ name: "Justin Digal", initials: "JD", email: "digaljustin099@gmail.com" }}
        >
            <div className="max-w-7xl mx-auto pb-16 px-4 sm:px-6 space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-500">
                {/* Header Section - Refined Proportions */}
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-6">
                    <div className="space-y-3">
                        <div className="flex items-center gap-3">
                            <div className="h-9 w-9 rounded-xl bg-indigo-600 flex items-center justify-center shadow-lg shadow-indigo-100 italic">
                                <History className="h-4 w-4 text-white" />
                            </div>
                            <div className="space-y-0.5">
                                <div className="flex items-center gap-2">
                                    <Sparkles className="h-3 w-3 text-indigo-500 fill-indigo-500" />
                                    <p className="text-[10px] font-black text-indigo-600 uppercase tracking-[0.2em]">Learning Portal</p>
                                </div>
                                <h1 className="text-3xl font-black text-[#0f172a] uppercase tracking-tight leading-none">Reservations</h1>
                            </div>
                        </div>
                        <p className="text-slate-500 font-medium text-sm pl-0.5">Manage your upcoming 1-on-1 tutoring sessions.</p>
                    </div>
                    <Button
                        onClick={() => navigate('/book-session')}
                        className="bg-[#0f172a] hover:bg-indigo-600 h-12 px-8 rounded-2xl font-black text-xs uppercase tracking-widest text-white shadow-xl transition-all border-none group flex items-center gap-2"
                    >
                        New Session
                        <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                    </Button>
                </div>

                {/* Filter Bar */}
                <div className="space-y-3 pt-2">
                    <DateRangeFilter
                        fromDate={fromDate}
                        toDate={toDate}
                        onFromDateChange={(date) => { setFromDate(date); setPage(1); }}
                        onToDateChange={(date) => { setToDate(date); setPage(1); }}
                        onRangeChange={() => setPage(1)}
                        leftElement={
                            <div className="relative">
                                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                                <Input
                                    placeholder="Filter subjects..."
                                    value={q}
                                    onChange={(e) => { setQ(e.target.value); setPage(1); }}
                                    className="pl-10 h-10 w-[240px] rounded-xl border-slate-100 bg-white"
                                />
                            </div>
                        }
                        rightElement={
                            (q || fromDate || toDate) && (
                                <Button variant="outline" size="sm" onClick={clearFilters} className="font-bold border-slate-200 rounded-xl h-10 px-4 uppercase text-[9px] tracking-widest">
                                    Reset
                                </Button>
                            )
                        }
                    />
                </div>

                {/* Content Area */}
                <div className="space-y-6">
                    {loading ? (
                        Array.from({ length: 3 }).map((_, i) => (
                            <div key={i} className="flex h-40 border-none bg-white rounded-[2rem] overflow-hidden shadow-sm ring-1 ring-gray-50">
                                <Skeleton className="w-64 bg-slate-50/50" />
                                <div className="flex-1 p-6 space-y-4">
                                    <Skeleton className="h-8 w-48 rounded-lg" />
                                    <Skeleton className="h-4 w-32 rounded-lg" />
                                </div>
                            </div>
                        ))
                    ) : paged.length > 0 ? (
                        <div className="space-y-5">
                            {paged.map((session) => (
                                <Card
                                    key={session.id}
                                    className="border-none shadow-[0_4px_20px_rgb(0,0,0,0.02)] hover:shadow-[0_20px_40px_rgb(15,23,42,0.04)] transition-all duration-500 rounded-[2rem] overflow-hidden bg-white ring-1 ring-slate-100 group cursor-pointer"
                                    onClick={() => navigate(`/book-reserved/view/${session.id}`)}
                                >
                                    <CardContent className="p-0">
                                        <div className="flex flex-col lg:flex-row">
                                            {/* Date Sidebar */}
                                            <div className="lg:w-64 bg-slate-50/30 p-8 flex flex-col justify-center border-b lg:border-b-0 lg:border-r border-slate-50">
                                                <div className="space-y-4">
                                                    <Badge className={`px-3 py-0.5 rounded-full font-black text-[8px] uppercase tracking-widest border-none ${session.status === 'Confirmed' ? 'bg-emerald-50 text-emerald-600' : 'bg-indigo-50 text-indigo-600'
                                                        }`}>
                                                        {session.status}
                                                    </Badge>
                                                    <div className="space-y-1">
                                                        <div className="flex items-center gap-2 text-[#0f172a] font-black">
                                                            <Calendar className="h-3.5 w-3.5 text-indigo-500" />
                                                            <span className="text-sm tracking-tight">{session.date}</span>
                                                        </div>
                                                        <div className="flex items-center gap-2 text-indigo-600/70 font-bold">
                                                            <Clock className="h-3.5 w-3.5" />
                                                            <span className="text-[11px] italic">{session.time}</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Session Details */}
                                            <div className="flex-1 p-8 flex flex-col md:flex-row items-center justify-between gap-6">
                                                <div className="space-y-6 w-full">
                                                    <div className="flex items-center gap-4">
                                                        <div className="h-12 w-12 rounded-2xl bg-indigo-50/50 flex items-center justify-center border border-indigo-100 group-hover:scale-105 transition-transform duration-500">
                                                            <BookOpen className="h-6 w-6 text-indigo-600" />
                                                        </div>
                                                        <div className="space-y-0.5">
                                                            <h3 className="text-xl font-black text-[#0f172a] uppercase tracking-tight group-hover:text-indigo-600 transition-colors">
                                                                {session.subject}
                                                            </h3>
                                                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest italic">{session.category} Support</p>
                                                        </div>
                                                    </div>

                                                    <div className="flex flex-wrap items-center gap-6">
                                                        <div className="flex items-center gap-3 bg-slate-50/50 px-4 py-2 rounded-xl group-hover:bg-white transition-all">
                                                            <User className="h-3.5 w-3.5 text-slate-300" />
                                                            <span className="text-[10px] font-black text-slate-700 uppercase tracking-tight">{session.teacher}</span>
                                                        </div>
                                                        <div className="flex items-center gap-3">
                                                            <MapPin className="h-3.5 w-3.5 text-orange-400" />
                                                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none italic">{session.building} • {session.room}</span>
                                                        </div>
                                                    </div>
                                                </div>

                                                <Button
                                                    className="w-full md:w-auto h-12 px-8 rounded-xl bg-[#0f172a] hover:bg-indigo-600 text-white font-black text-[10px] uppercase tracking-widest shadow-lg shadow-indigo-50/50 transition-all group border-none"
                                                    onClick={(e) => { e.stopPropagation(); navigate(`/book-reserved/view/${session.id}`); }}
                                                >
                                                    Manage
                                                    <ChevronRight className="ml-2 h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
                                                </Button>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    ) : (
                        <div className="py-20 text-center space-y-6 bg-slate-50/30 rounded-[2rem] border-2 border-dashed border-slate-100">
                            <History className="h-10 w-10 text-slate-200 mx-auto" />
                            <div className="space-y-1">
                                <h3 className="text-lg font-black text-[#0f172a] uppercase tracking-tight">No Reservations</h3>
                                <p className="text-slate-400 font-medium text-xs italic">Schedule your next tutoring slot to see it here.</p>
                            </div>
                            <Button
                                onClick={() => navigate('/book-session')}
                                className="bg-indigo-600 h-12 px-8 rounded-xl font-black text-[10px] uppercase tracking-widest text-white shadow-lg border-none"
                            >
                                Get Started
                            </Button>
                        </div>
                    )}
                </div>

                {/* Refined Pagination */}
                {paged.length > 0 && (
                    <div className="flex items-center justify-between border-t border-gray-100 pt-8 mt-6 px-2">
                        <p className="text-[10px] font-black text-slate-300 uppercase tracking-[0.2em]">Showing {paged.length} of {total} items</p>
                        <div className="flex items-center gap-2">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setPage(p => Math.max(1, p - 1))}
                                disabled={safePage === 1}
                                className="h-9 px-4 font-black text-[9px] uppercase tracking-widest border-slate-100 rounded-lg"
                            >
                                Prev
                            </Button>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                                disabled={safePage === totalPages}
                                className="h-9 px-4 font-black text-[9px] uppercase tracking-widest border-slate-100 rounded-lg"
                            >
                                Next
                            </Button>
                        </div>
                    </div>
                )}

                {/* Minimal Footer Info */}
                <Card className="border-none bg-[#0f172a] rounded-[2rem] overflow-hidden shadow-xl mt-10">
                    <CardContent className="p-8 flex flex-col sm:flex-row items-center justify-between gap-6">
                        <div className="flex items-center gap-6">
                            <div className="h-12 w-12 bg-white/5 rounded-2xl flex items-center justify-center border border-white/10">
                                <CheckCircle2 className="h-6 w-6 text-emerald-400" />
                            </div>
                            <div className="space-y-1">
                                <h3 className="text-lg font-black text-white uppercase tracking-tight">Active Schedule</h3>
                                <p className="text-slate-400 text-xs font-medium italic">Keep track of your academic commitments in one place.</p>
                            </div>
                        </div>
                        <Button
                            onClick={handleSyncToCalendar}
                            disabled={isSyncing}
                            className="bg-white text-[#0f172a] hover:bg-emerald-50 font-black h-12 px-8 rounded-xl transition-all border-none uppercase text-[10px] tracking-widest flex items-center gap-2"
                        >
                            {isSyncing ? "Syncing..." : "Sync to Calendar"}
                            <Zap className={`h-3.5 w-3.5 text-indigo-500 fill-indigo-500 ${isSyncing ? 'animate-bounce' : ''}`} />
                        </Button>
                    </CardContent>
                </Card>
            </div>
        </AppLayout>
    );
}
