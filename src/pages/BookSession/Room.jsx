import { useState, useEffect, useMemo } from "react";
import { useNavigate, useParams } from "react-router-dom";
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
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
    Search,
    MapPin,
    User,
    Calendar,
    ArrowLeft,
    ArrowRight,
    Zap,
    BookOpen,
    Clock,
    ChevronRight,
    CheckCircle2,
    X
} from "lucide-react";

export default function BookRoomSelection() {
    const { id } = useParams();
    const navigate = useNavigate();

    /* ------------------------------ state ------------------------------ */
    const [loading, setLoading] = useState(true);
    const [sessions, setSessions] = useState([]);
    const [q, setQ] = useState("");
    const [fromDate, setFromDate] = useState(undefined);
    const [toDate, setToDate] = useState(undefined);
    const [page, setPage] = useState(1);
    const [showConfirm, setShowConfirm] = useState(false);
    const [selectedSession, setSelectedSession] = useState(null);
    const pageSize = 4;

    /* ------------------------------ mock data ------------------------------ */
    const building = {
        name: id === "1" ? "Main Academic Building" : "Selected Building",
        address: "School Campus, Sector 7, Block B, Main Road",
    };

    useEffect(() => {
        const timer = setTimeout(() => {
            setSessions([
                {
                    id: 101,
                    room: "Room 302",
                    subject: "Advanced Calculus",
                    date: "2026-02-10",
                    time: "09:00 AM - 11:00 AM",
                    teacher: "Prof. Sarah Johnson",
                    status: "Available",
                    type: "1-on-1 Private"
                },
                {
                    id: 102,
                    room: "Physics Lab A",
                    subject: "Quantum Mechanics",
                    date: "2026-02-10",
                    time: "01:00 PM - 03:00 PM",
                    teacher: "Dr. Robert Chen",
                    status: "Available",
                    type: "1-on-1 Private"
                },
                {
                    id: 103,
                    room: "Room 105",
                    subject: "World History",
                    date: "2026-02-11",
                    time: "10:30 AM - 12:00 PM",
                    teacher: "Ms. Elena Rodriguez",
                    status: "Limited",
                    type: "1-on-1 Private"
                },
                {
                    id: 104,
                    room: "Room 410",
                    subject: "Computer Science 101",
                    date: "2026-02-12",
                    time: "02:00 PM - 04:00 PM",
                    teacher: "Mr. David Smith",
                    status: "Available",
                    type: "1-on-1 Private"
                }
            ]);
            setLoading(false);
        }, 800);
        return () => clearTimeout(timer);
    }, []);

    const resetPage = () => setPage(1);
    const clearFilters = () => {
        setQ("");
        setFromDate(undefined);
        setToDate(undefined);
        setPage(1);
    };

    /* ------------------------- filtering ------------------------- */
    const filtered = useMemo(() => {
        return applyFilters(sessions, {
            search: q,
            searchFields: ['subject', 'teacher', 'room'],
            fromDate,
            toDate,
            dateField: 'date',
        });
    }, [sessions, q, fromDate, toDate]);

    const paginationResult = useMemo(() => {
        return paginate(filtered, page, pageSize);
    }, [filtered, page, pageSize]);

    const { data: paged, total, totalPages, page: safePage } = paginationResult;

    return (
        <AppLayout
            title="Available Schedule"
            brand={{ name: "NexUs", subtitle: "Tutoring Portal", mark: "NX" }}
            onLogout={() => navigate("/login")}
            user={{ name: "Justin Digal", initials: "JD", email: "digaljustin099@gmail.com" }}
        >
            <div className="max-w-7xl mx-auto pb-20 px-4 sm:px-6 space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-500">
                {loading ? (
                    <div className="space-y-8">
                        {/* Header Skeleton */}
                        <div className="space-y-6">
                            <Skeleton className="h-6 w-32 rounded-lg" />
                            <div className="space-y-2">
                                <Skeleton className="h-10 w-80" />
                                <Skeleton className="h-4 w-96" />
                            </div>
                        </div>

                        {/* Filter Skeleton */}
                        <Skeleton className="h-10 w-[240px] rounded-lg" />

                        {/* Session Cards Skeleton */}
                        <div className="space-y-6">
                            {[1, 2, 3].map(i => (
                                <div key={i} className="flex flex-col md:flex-row h-auto md:h-40 border-none bg-white rounded-[2rem] overflow-hidden shadow-sm ring-1 ring-gray-100">
                                    <Skeleton className="md:w-64 h-32 md:h-full border-r border-gray-50 bg-slate-50/50" />
                                    <div className="flex-1 p-8 flex items-center justify-between">
                                        <div className="space-y-4 w-full">
                                            <div className="flex items-center gap-3">
                                                <Skeleton className="h-10 w-10 rounded-xl" />
                                                <Skeleton className="h-8 w-64" />
                                                <Skeleton className="h-5 w-16 rounded-full" />
                                            </div>
                                            <div className="flex items-center gap-4">
                                                <Skeleton className="h-6 w-32 rounded-full" />
                                                <Skeleton className="h-6 w-24 rounded-full" />
                                            </div>
                                        </div>
                                        <div className="hidden md:flex gap-3">
                                            {/* Action buttons removed to match card-only interaction */}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Footer Skeleton */}
                        <Skeleton className="h-32 w-full rounded-[2.5rem]" />
                    </div>
                ) : (
                    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-500">
                        {/* Navigation & Header */}
                        <div className="space-y-6">
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => navigate("/book-session")}
                                className="text-slate-400 hover:text-[#0f172a] -ml-2 font-bold uppercase text-[10px] tracking-widest gap-2"
                            >
                                <ArrowLeft className="h-3 w-3" />
                                Back to Buildings
                            </Button>

                            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                                <div className="space-y-2">
                                    <div className="flex items-center gap-2">
                                        <div className="h-1.5 w-1.5 rounded-full bg-indigo-600" />
                                        <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-indigo-600">{building.name}</span>
                                    </div>
                                    <h1 className="text-4xl font-black text-[#0f172a] tracking-tight uppercase leading-none">Available Schedule</h1>
                                    <p className="text-sm text-slate-500 font-medium">Browse private 1-on-1 tutoring sessions and reserve your spot.</p>
                                </div>
                            </div>
                        </div>

                        {/* Filter Bar - Matching System Pattern */}
                        <div className="space-y-3">
                            <DateRangeFilter
                                fromDate={fromDate}
                                toDate={toDate}
                                onFromDateChange={(date) => { setFromDate(date); resetPage(); }}
                                onToDateChange={(date) => { setToDate(date); resetPage(); }}
                                onRangeChange={() => resetPage()}
                                leftElement={
                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <div className="relative">
                                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                                                <Input
                                                    placeholder="Search subject, room, or teacher..."
                                                    value={q}
                                                    onChange={(e) => { setQ(e.target.value); resetPage(); }}
                                                    className="pl-10 w-[240px]"
                                                />
                                            </div>
                                        </TooltipTrigger>
                                        <TooltipContent>Search sessions</TooltipContent>
                                    </Tooltip>
                                }
                                rightElement={
                                    (q || fromDate || toDate) && (
                                        <Tooltip>
                                            <TooltipTrigger asChild>
                                                <Button variant="outline" size="sm" onClick={clearFilters}>
                                                    Clear
                                                </Button>
                                            </TooltipTrigger>
                                            <TooltipContent>Reset filters</TooltipContent>
                                        </Tooltip>
                                    )
                                }
                            />
                        </div>

                        <div className="space-y-6">
                            {paged.length > 0 ? (
                                paged.map((session) => (
                                    <Card
                                        key={session.id}
                                        className="group border-none shadow-[0_4px_20px_rgb(0,0,0,0.03)] hover:shadow-[0_20px_40px_rgb(15,23,42,0.06)] transition-all duration-500 rounded-[2rem] overflow-hidden cursor-pointer bg-white"
                                        onClick={() => {
                                            setSelectedSession(session);
                                            setShowConfirm(true);
                                        }}
                                    >
                                        <CardContent className="p-0">
                                            <div className="flex flex-col md:flex-row">
                                                {/* Date Column */}
                                                <div className="md:w-64 bg-slate-50/50 p-8 flex flex-col justify-center items-center md:items-start space-y-4 border-b md:border-b-0 md:border-r border-slate-50 transition-colors group-hover:bg-slate-50">
                                                    <div className="space-y-0.5">
                                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Date & Time</p>
                                                        <div className="flex items-center gap-2 text-[#0f172a] font-black">
                                                            <Calendar className="h-4 w-4 text-indigo-400" />
                                                            <span className="text-sm tracking-tight">{session.date}</span>
                                                        </div>
                                                    </div>
                                                    <div className="space-y-0.5">
                                                        <div className="flex items-center gap-2 text-indigo-600 font-bold">
                                                            <Clock className="h-4 w-4" />
                                                            <span className="text-sm italic">{session.time}</span>
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Details Column */}
                                                <div className="flex-1 p-8 flex flex-col md:flex-row md:items-center justify-between gap-8">
                                                    <div className="space-y-6">
                                                        <div className="space-y-2">
                                                            <div className="flex items-center gap-3">
                                                                <div className="h-10 w-10 rounded-xl bg-indigo-50 flex items-center justify-center border border-indigo-100/50 group-hover:scale-110 transition-transform duration-500">
                                                                    <BookOpen className="h-5 w-5 text-indigo-500" />
                                                                </div>
                                                                <h3 className="text-2xl font-black text-[#0f172a] uppercase tracking-tight group-hover:text-indigo-600 transition-colors">{session.subject}</h3>
                                                                <Badge variant="outline" className="border-indigo-100 text-indigo-600 bg-indigo-50/50 text-[9px] font-black uppercase tracking-wider px-2">1-on-1</Badge>
                                                            </div>
                                                            <div className="flex items-center gap-3 pl-1 bg-slate-50/30 rounded-full w-fit pr-4 py-1">
                                                                <div className="h-6 w-6 rounded-full bg-white border border-slate-100 flex items-center justify-center overflow-hidden">
                                                                    <User className="h-3.5 w-3.5 text-slate-300" />
                                                                </div>
                                                                <span className="text-xs font-bold text-slate-500">{session.teacher}</span>
                                                            </div>
                                                        </div>

                                                        <div className="flex items-center gap-4">
                                                            <div className="flex items-center gap-2 bg-slate-50 px-3 py-1.5 rounded-xl">
                                                                <MapPin className="h-3.5 w-3.5 text-orange-400" />
                                                                <span className="text-[11px] font-black text-slate-700 uppercase tracking-tight">{session.room}</span>
                                                            </div>
                                                            <Badge
                                                                className={`text-[9px] font-black px-3 py-1 rounded-full uppercase border-none shadow-sm ${session.status === "Available"
                                                                    ? "bg-green-100 text-green-700"
                                                                    : "bg-orange-100 text-orange-700"
                                                                    }`}
                                                            >
                                                                {session.status}
                                                            </Badge>
                                                        </div>
                                                    </div>

                                                    {/* Action buttons removed - Entire card is the interactive trigger */}
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>
                                ))
                            ) : (
                                <div className="py-20 text-center space-y-4 bg-gray-50/50 rounded-[3rem] border-2 border-dashed border-gray-100">
                                    <Search className="h-10 w-10 text-gray-200 mx-auto" />
                                    <p className="text-gray-900 font-bold uppercase text-xs tracking-widest">No schedules found</p>
                                    <Button variant="link" onClick={clearFilters} className="text-indigo-600 font-bold uppercase text-[10px] tracking-widest">
                                        Clear all filters
                                    </Button>
                                </div>
                            )}
                        </div>

                        {/* Pagination - Matching Index Style */}
                        {paged.length > 0 && (
                            <div className="flex items-center justify-between border-t border-gray-100 px-6 py-6 mt-10">
                                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                                    Showing {paged.length} of {total} slots
                                </p>
                                <div className="flex items-center gap-3">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => setPage(p => Math.max(1, p - 1))}
                                        disabled={safePage === 1}
                                        className="h-10 px-6 font-bold border-gray-200 text-slate-600 rounded-xl transition-all"
                                    >
                                        Previous
                                    </Button>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                                        disabled={safePage === totalPages}
                                        className="h-10 px-6 font-bold border-gray-200 text-slate-600 rounded-xl transition-all"
                                    >
                                        Next
                                    </Button>
                                </div>
                            </div>
                        )}

                        {/* Info Footer - Refined Style */}
                        <Card className="border-none bg-[#0f172a] rounded-[2.5rem] overflow-hidden shadow-2xl relative">
                            <div className="absolute top-0 right-0 p-8 opacity-10">
                                <Zap className="h-32 w-32 text-white" />
                            </div>
                            <CardContent className="p-10 flex flex-col md:flex-row items-center justify-between gap-8 relative z-10">
                                <div className="flex items-center gap-6 text-center md:text-left">
                                    <div className="h-14 w-14 bg-indigo-500/20 rounded-2xl flex items-center justify-center backdrop-blur-xl border border-white/10">
                                        <CheckCircle2 className="h-7 w-7 text-indigo-400" />
                                    </div>
                                    <div className="space-y-1">
                                        <h3 className="text-xl font-black text-white uppercase tracking-tight">One-Click Reservation</h3>
                                        <p className="text-slate-400 text-sm font-medium">Your learning journey begins here. Secure your 1-on-1 spot instantly.</p>
                                    </div>
                                </div>
                                <Button className="bg-white text-[#0f172a] hover:bg-indigo-50 font-black h-14 px-10 rounded-2xl shadow-2xl transition-all border-none uppercase text-xs tracking-widest">
                                    Manage My Portal
                                </Button>
                            </CardContent>
                        </Card>
                    </div>
                )}

                {/* Confirmation Dialog */}
                <AlertDialog open={showConfirm} onOpenChange={setShowConfirm}>
                    <AlertDialogContent className="rounded-[3rem] border-none shadow-[0_30px_60px_-15px_rgba(15,23,42,0.3)] p-0 max-w-lg overflow-hidden bg-white/95 backdrop-blur-xl ring-1 ring-white/20">
                        <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-indigo-500 via-purple-500 to-indigo-500" />

                        {/* Close Button */}
                        <button
                            onClick={() => setShowConfirm(false)}
                            className="absolute top-6 right-6 h-10 w-10 rounded-full bg-slate-50/50 flex items-center justify-center text-slate-400 hover:bg-slate-100 hover:text-slate-900 transition-all z-50 ring-1 ring-slate-100"
                        >
                            <X className="h-5 w-5" />
                        </button>

                        <div className="p-10 space-y-8">
                            <AlertDialogHeader className="space-y-6">
                                <div className="relative mx-auto">
                                    <div className="h-20 w-20 bg-indigo-600 rounded-[2rem] flex items-center justify-center shadow-2xl shadow-indigo-200 rotate-3 group-hover:rotate-0 transition-transform duration-500">
                                        <Zap className="h-10 w-10 text-white fill-white/20" />
                                    </div>
                                    <div className="absolute -bottom-2 -right-2 bg-green-500 h-6 w-6 rounded-full border-4 border-white shadow-lg" />
                                </div>

                                <div className="space-y-3 text-center">
                                    <AlertDialogTitle className="text-3xl font-black text-[#0f172a] uppercase tracking-tighter leading-none">
                                        Ready to Explore?
                                    </AlertDialogTitle>
                                    <AlertDialogDescription className="text-slate-500 font-medium text-base leading-relaxed px-4">
                                        You're one step away from viewing the specialized schedule for
                                        <span className="block mt-2 text-[#0f172a] font-black uppercase tracking-tight text-lg italic decoration-indigo-500/30 decoration-4 underline underline-offset-4">
                                            {selectedSession?.subject}
                                        </span>
                                        <span className="text-sm text-slate-400 mt-1 block">Managed by {selectedSession?.teacher}</span>
                                    </AlertDialogDescription>
                                </div>
                            </AlertDialogHeader>

                            <AlertDialogFooter className="flex flex-col items-center">
                                <AlertDialogAction
                                    onClick={() => navigate(`/book-session/view/${selectedSession?.id}`)}
                                    className="w-full h-14 rounded-2xl bg-[#0f172a] hover:bg-black text-white font-black uppercase text-xs tracking-widest shadow-2xl shadow-indigo-100 transition-all border-none flex items-center justify-center gap-2 group"
                                >
                                    Proceed to Session
                                    <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                                </AlertDialogAction>
                            </AlertDialogFooter>
                        </div>
                    </AlertDialogContent>
                </AlertDialog>
            </div>
        </AppLayout>
    );
}
