import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import AppLayout from "../../layouts/AppLayout";
import { applyFilters, paginate } from "../../utils/filterUtils";
import DateRangeFilter from "../../components/DateRangeFilter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import {
    Search,
    MapPin,
    User,
    Calendar,
    ArrowRight,
    Zap,
    Building2,
    Star,
    ChevronRight
} from "lucide-react";

export default function BookSessionIndex() {
    const navigate = useNavigate();

    /* ------------------------------ state ------------------------------ */
    const [loading, setLoading] = useState(true);
    const [buildings, setBuildings] = useState([]);
    const [q, setQ] = useState("");
    const [fromDate, setFromDate] = useState(undefined);
    const [toDate, setToDate] = useState(undefined);
    const [page, setPage] = useState(1);
    const pageSize = 3;

    /* ------------------------------ api ------------------------------ */
    useEffect(() => {
        // TODO: replace with real API call, e.g. buildingService.getAll()
        setBuildings([]);
        setLoading(false);
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
        return applyFilters(buildings, {
            search: q,
            searchFields: ['name', 'address', 'managedBy'],
            fromDate,
            toDate,
            dateField: 'createdAt',
        });
    }, [buildings, q, fromDate, toDate]);

    const paginationResult = useMemo(() => {
        return paginate(filtered, page, pageSize);
    }, [filtered, page, pageSize]);

    const { data: paged, total, totalPages, page: safePage } = paginationResult;

    const recommendedBuilding = buildings.find(b => b.isRecommended);

    return (
        <AppLayout
            title="Book Session"
            brand={{ name: "NexUs", subtitle: "Tutoring Portal", mark: "NX" }}
            onLogout={() => navigate("/login")}
            user={{ name: "Justin Digal", initials: "JD", email: "digaljustin099@gmail.com" }}
        >
            {loading ? (
                <div className="space-y-8 max-w-7xl mx-auto px-4">
                    {/* Header Skeleton */}
                    <div className="space-y-2">
                        <Skeleton className="h-9 w-48" />
                        <Skeleton className="h-4 w-80" />
                    </div>

                    {/* Filter Bar Skeleton */}
                    <div className="flex items-center justify-between gap-4">
                        <Skeleton className="h-10 w-[240px] rounded-lg" />
                    </div>

                    {/* Large Card Skeleton */}
                    <div className="space-y-4">
                        <Skeleton className="h-4 w-32" />
                        <Skeleton className="h-[320px] w-full rounded-[2.5rem]" />
                    </div>

                    {/* Card Grid Skeleton */}
                    <div className="space-y-6">
                        <Skeleton className="h-4 w-40" />
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                            {[1, 2, 3].map(i => (
                                <Skeleton key={i} className="h-80 w-full rounded-[2.5rem]" />
                            ))}
                        </div>
                    </div>
                </div>
            ) : (
                <div className="space-y-8 max-w-7xl mx-auto px-4 animate-in fade-in slide-in-from-bottom-2 duration-500">
                    {/* Header - System Pattern */}
                    <div className="flex items-start justify-between gap-4">
                        <div>
                            <h1 className="text-3xl font-bold text-gray-900">Book Session</h1>
                            <p className="mt-1 text-sm text-gray-600">
                                Select a building to view available 1-on-1 tutoring sessions
                            </p>
                        </div>
                    </div>

                    {/* Filter Bar - System Pattern */}
                    <div className="space-y-3">
                        <DateRangeFilter
                            fromDate={fromDate}
                            toDate={toDate}
                            onFromDateChange={(date) => {
                                setFromDate(date);
                                resetPage();
                            }}
                            onToDateChange={(date) => {
                                setToDate(date);
                                resetPage();
                            }}
                            onRangeChange={() => resetPage()}
                            leftElement={
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <div className="relative">
                                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                                            <Input
                                                placeholder="Search buildings..."
                                                value={q}
                                                onChange={(e) => {
                                                    setQ(e.target.value);
                                                    resetPage();
                                                }}
                                                className="pl-10 w-[240px]"
                                            />
                                        </div>
                                    </TooltipTrigger>
                                    <TooltipContent>Search by name, address, or manager</TooltipContent>
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
                                        <TooltipContent>Reset all filters</TooltipContent>
                                    </Tooltip>
                                )
                            }
                        />
                    </div>

                    {/* Recommended Building - Matching USER Reference Image Exactly */}
                    {!q && recommendedBuilding && (
                        <div className="space-y-4">
                            <div className="flex items-center gap-2 px-1">
                                <div className="h-2 w-2 rounded-full bg-indigo-600" />
                                <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-indigo-600">Top Recommended</span>
                            </div>
                            <Card className="group border-none shadow-[0_8px_30px_rgb(0,0,0,0.06)] overflow-hidden rounded-[2.5rem] bg-white ring-1 ring-gray-100 cursor-pointer" onClick={() => navigate(`/book-session/${recommendedBuilding.id}`)}>
                                <CardContent className="p-0">
                                    <div className="flex flex-col lg:flex-row min-h-[320px]">
                                        <div className="lg:w-[30%] bg-gradient-to-br from-white to-gray-50/50 flex items-center justify-center p-12 border-b lg:border-b-0 lg:border-r border-gray-50 group-hover:bg-indigo-50/30 transition-all duration-500">
                                            <div className="relative">
                                                <Building2 className="h-24 w-24 text-indigo-200/60 transition-all duration-700 transform group-hover:scale-110 group-hover:text-indigo-400" />
                                                <div className="absolute -top-2 -right-2 bg-indigo-600 rounded-full p-2.5 shadow-xl scale-0 group-hover:scale-100 transition-all duration-500 rotate-12 group-hover:rotate-0">
                                                    <Zap className="h-5 w-5 text-white" />
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex-1 p-10 lg:p-14 flex flex-col justify-center">
                                            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-6 mb-10">
                                                <div className="space-y-2">
                                                    <h3 className="text-4xl font-black text-[#0f172a] tracking-tight uppercase">{recommendedBuilding.name}</h3>
                                                    <div className="flex items-center gap-2 text-slate-400 font-medium">
                                                        <MapPin className="h-4 w-4 text-indigo-300" />
                                                        <span className="text-sm font-semibold tracking-tight">{recommendedBuilding.address}</span>
                                                    </div>
                                                </div>
                                                <div className="flex flex-col items-end gap-2 shrink-0">
                                                    <div className="flex items-center gap-2 text-indigo-600 font-black text-2xl tracking-tight">
                                                        <Zap className="h-5 w-5 fill-indigo-100 animate-pulse" />
                                                        {recommendedBuilding.availableSessions} Sessions
                                                    </div>
                                                    <Badge variant="outline" className="border-green-100 text-green-600 bg-green-50/50 font-black text-[9px] uppercase tracking-wider px-3 shadow-sm">ACTIVE CAMPUS</Badge>
                                                </div>
                                            </div>

                                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-10">
                                                <div className="space-y-2">
                                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest text-left">Managed By</p>
                                                    <div className="flex items-center gap-3">
                                                        <User className="h-4 w-4 text-slate-300" />
                                                        <p className="text-base font-bold text-[#0f172a]">{recommendedBuilding.managedBy}</p>
                                                    </div>
                                                </div>
                                                <div className="space-y-2">
                                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest text-left">Campus Rating</p>
                                                    <div className="flex items-center gap-3">
                                                        <Star className="h-4 w-4 text-orange-400 fill-orange-400" />
                                                        <p className="text-base font-bold text-[#0f172a]">4.9 Highly Rated</p>
                                                    </div>
                                                </div>
                                                <div className="space-y-2">
                                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest text-left">Registration</p>
                                                    <div className="flex items-center gap-3">
                                                        <Calendar className="h-4 w-4 text-slate-300" />
                                                        <p className="text-base font-bold text-[#0f172a]">{recommendedBuilding.createdAt}</p>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="mt-10 pt-6 flex justify-end">
                                                <Button
                                                    onClick={() => navigate(`/book-session/${recommendedBuilding.id}`)}
                                                    className="h-14 px-10 font-black shadow-[0_10px_40px_rgba(15,23,42,0.15)] transition-all group rounded-2xl bg-[#0f172a] hover:bg-black text-white border-none flex items-center gap-3 text-sm tracking-tight"
                                                >
                                                    Book 1-on-1 Session
                                                    <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
                                                </Button>
                                            </div>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    )}

                    {/* Standard Grid - Refined with same pattern */}
                    <div className="space-y-6 pt-4">
                        <div className="flex items-center gap-3 px-1">
                            <h2 className="text-xs font-bold text-slate-400 uppercase tracking-[0.2em]">Available Locations</h2>
                        </div>

                        {paged.length === 0 ? (
                            <div className="py-20 text-center space-y-4 bg-gray-50/50 rounded-[2.5rem] border-2 border-dashed border-gray-100">
                                <Search className="h-10 w-10 text-gray-200 mx-auto" />
                                <p className="text-gray-900 font-bold uppercase text-xs tracking-widest">No buildings found</p>
                                <Button variant="link" onClick={clearFilters} className="text-indigo-600 font-bold uppercase text-[10px] tracking-[0.2em]">
                                    Clear all filters
                                </Button>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                                {paged.map((building) => (
                                    <Card
                                        key={building.id}
                                        className="group border-none shadow-[0_4px_20px_rgb(0,0,0,0.04)] hover:shadow-[0_20px_40px_rgb(15,23,42,0.08)] hover:ring-2 hover:ring-indigo-500/20 transition-all duration-500 cursor-pointer overflow-hidden rounded-[2.5rem] bg-white flex flex-col"
                                        onClick={() => navigate(`/book-session/${building.id}`)}
                                    >
                                        <div className="p-8 pb-0 flex items-start justify-between">
                                            <div className="h-12 w-12 rounded-2xl bg-gray-50 flex items-center justify-center border border-gray-100 transition-all duration-500 group-hover:bg-indigo-50 group-hover:border-indigo-100 group-hover:scale-110">
                                                <Building2 className="h-6 w-6 text-slate-400 group-hover:text-indigo-400 transition-all duration-500" />
                                            </div>
                                            <Badge variant="outline" className="text-[8px] font-black uppercase border-gray-100 text-slate-400 bg-white h-5">ACTIVE</Badge>
                                        </div>
                                        <CardHeader className="p-8 pt-6">
                                            <CardTitle className="text-xl font-black text-[#0f172a] group-hover:text-indigo-600 transition-colors uppercase leading-[1.2]">
                                                {building.name}
                                            </CardTitle>
                                            <div className="flex items-start gap-2 text-[11px] font-semibold text-slate-400 leading-relaxed mt-2 min-h-8">
                                                {building.address}
                                            </div>
                                        </CardHeader>
                                        <CardContent className="p-8 pt-0 flex-1 flex flex-col justify-between">
                                            <div className="flex items-center justify-between p-4 bg-indigo-50/30 rounded-2xl group-hover:bg-indigo-50 transition-colors mb-6">
                                                <p className="text-sm font-black text-indigo-600 italic">{building.availableSessions} Available Sessions</p>
                                                <Zap className="h-4 w-4 text-indigo-400 animate-pulse" />
                                            </div>
                                            <div className="flex items-center justify-between pt-4 border-t border-gray-50">
                                                <div className="flex items-center gap-2">
                                                    <div className="h-7 w-7 rounded-full bg-slate-100 flex items-center justify-center">
                                                        <User className="h-3.5 w-3.5 text-slate-400" />
                                                    </div>
                                                    <span className="text-[11px] font-bold text-slate-500">{building.managedBy}</span>
                                                </div>
                                                <div className="h-8 w-8 rounded-full bg-slate-50 flex items-center justify-center group-hover:bg-[#0f172a] transition-all">
                                                    <ChevronRight className="h-4 w-4 text-slate-400 group-hover:text-white" />
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Pagination - Premium Social Style */}
                    {paged.length > 0 && (
                        <div className="flex flex-col sm:flex-row items-center justify-between gap-6 pt-10 border-t border-gray-100 px-2 mt-8">
                            <div className="flex items-center gap-4">
                                <div className="flex -space-x-2">
                                    {[1, 2, 3].map(i => (
                                        <div key={i} className="h-8 w-8 rounded-full border-2 border-white bg-gray-100 flex items-center justify-center">
                                            <User className="h-4 w-4 text-slate-300" />
                                        </div>
                                    ))}
                                </div>
                                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest italic">
                                    Join <span className="text-slate-900 border-b-2 border-indigo-500">thousands</span> of students in {total} locations
                                </p>
                            </div>

                            <div className="flex items-center gap-2 bg-gray-50 p-1.5 rounded-2xl border border-gray-100">
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => setPage(p => Math.max(1, p - 1))}
                                    disabled={safePage === 1}
                                    className="h-10 px-6 font-black uppercase text-[10px] tracking-widest rounded-xl hover:bg-white hover:text-gray-900 transition-all"
                                >
                                    Prev
                                </Button>
                                <div className="h-10 px-6 flex items-center justify-center bg-white rounded-xl shadow-sm border border-gray-100">
                                    <span className="text-xs font-black text-slate-900">{safePage} <span className="mx-1 text-slate-200">/</span> {totalPages}</span>
                                </div>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                                    disabled={safePage === totalPages}
                                    className="h-10 px-6 font-black uppercase text-[10px] tracking-widest rounded-xl hover:bg-white hover:text-gray-900 transition-all"
                                >
                                    Next
                                </Button>
                            </div>
                        </div>
                    )}
                </div>
            )}
        </AppLayout>
    );
}
