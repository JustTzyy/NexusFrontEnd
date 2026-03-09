import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import AppLayout from "../../layouts/AppLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
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
    Calendar,
    Clock,
    MapPin,
    User,
    BookOpen,
    ArrowLeft,
    CheckCircle2,
    Zap,
    MessageSquare,
    AlertCircle,
    Download,
    Share2,
    CalendarCheck,
    XCircle,
    X,
    Trash2,
    Smartphone,
    ShieldCheck,
    Camera,
    Sparkles,
    History,
    Trophy
} from "lucide-react";
import { useGoogleLogin } from "@react-oauth/google";
import { createGoogleCalendarEvent } from "../../services/googleCalendarService";
import { toast } from "sonner";

export default function BookReservedView() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [isSyncing, setIsSyncing] = useState(false);
    const [showCancelDialog, setShowCancelDialog] = useState(false);
    const [showCancelSuccess, setShowCancelSuccess] = useState(false);
    const [showDigitalPass, setShowDigitalPass] = useState(false);
    const [cancelReason, setCancelReason] = useState("");
    const [session, setSession] = useState(null);

    useEffect(() => {
        const timer = setTimeout(() => {
            setSession({
                id: id || 501,
                subject: "Advanced Calculus",
                category: "Mathematics",
                date: "Monday, Feb 10, 2026",
                time: "09:00 AM - 11:00 AM",
                teacher: "Prof. Sarah Johnson",
                building: "Main Academic Building",
                room: "Room 302",
                status: "Confirmed",
                description: "A deep dive into multi-variable calculus and integration techniques. Please bring your specialized graphing calculator.",
                tutorBio: "Senior Mathematics Lecturer with 12 years of experience in elite engineering prep.",
                requirements: ["Advanced Calculator", "Graph Paper", "Completed Homework #4"]
            });
            setLoading(false);
        }, 800);
        return () => clearTimeout(timer);
    }, [id]);

    const handleSyncToCalendar = useGoogleLogin({
        onSuccess: async (tokenResponse) => {
            setIsSyncing(true);
            try {
                const token = tokenResponse.access_token;
                await createGoogleCalendarEvent(token, session);
                toast.success("Successfully added to your Google Calendar!");
            } catch (error) {
                console.error("Sync Error:", error);
                toast.error(`Sync failed: ${error.message}`);
            } finally {
                setIsSyncing(false);
            }
        },
        scope: "https://www.googleapis.com/auth/calendar.events",
    });

    const handleCancelSession = () => {
        if (!cancelReason.trim()) {
            toast.error("Please provide a reason for cancellation.");
            return;
        }
        setShowCancelDialog(false);
        setShowCancelSuccess(true);
        setTimeout(() => {
            navigate('/book-reserved');
            toast.success("Reservation cancelled successfully.");
        }, 2500);
    };

    if (loading) {
        return (
            <AppLayout title="Reservation Detail">
                <div className="max-w-6xl mx-auto p-6 space-y-8">
                    <Skeleton className="h-[450px] w-full rounded-[3rem]" />
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        <Skeleton className="h-96 lg:col-span-2 rounded-[2.5rem]" />
                        <div className="space-y-8">
                            <Skeleton className="h-64 rounded-[2.5rem]" />
                            <Skeleton className="h-48 rounded-[2.5rem]" />
                        </div>
                    </div>
                </div>
            </AppLayout>
        );
    }

    return (
        <AppLayout
            title="Reservation Details"
            brand={{ name: "NexUs", subtitle: "Tutoring Portal", mark: "NX" }}
            onLogout={() => navigate("/login")}
            user={{ name: "Justin Digal", initials: "JD", email: "digaljustin099@gmail.com" }}
        >
            <div className="max-w-6xl mx-auto pb-20 px-4 sm:px-6 space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-500">
                {/* Elite Header Navigation */}
                <div className="flex items-center justify-between gap-6 pb-2">
                    <Button
                        variant="ghost"
                        onClick={() => navigate('/book-reserved')}
                        className="h-10 px-4 rounded-xl font-black text-[10px] uppercase tracking-widest text-slate-400 hover:text-indigo-600 transition-all bg-white shadow-sm ring-1 ring-slate-100 flex items-center gap-2 group"
                    >
                        <ArrowLeft className="h-3.5 w-3.5 transition-transform group-hover:-translate-x-1" />
                        Back to Portal
                    </Button>
                    <div className="flex items-center gap-3">
                        <History className="h-4 w-4 text-indigo-500" />
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Reservation ID: {session.id}</span>
                    </div>
                </div>

                {/* Hero Card - Strictly Aligned with Elite System Design */}
                <Card className="border-none shadow-[0_30px_60px_-15px_rgba(15,23,42,0.1)] rounded-[3rem] overflow-hidden bg-white ring-1 ring-slate-100">
                    <CardContent className="p-0">
                        <div className="flex flex-col lg:flex-row min-h-[480px]">
                            {/* Left: Session Content */}
                            <div className="flex-1 p-10 lg:p-14 space-y-10">
                                <div className="space-y-6">
                                    <div className="flex items-center gap-3">
                                        <div className="px-4 py-1.5 rounded-full bg-emerald-50 border border-emerald-100 flex items-center gap-2">
                                            <div className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                                            <span className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">{session.status} Status</span>
                                        </div>
                                        <Badge className="bg-indigo-50 text-indigo-600 px-4 py-1.5 rounded-full font-black text-[10px] uppercase tracking-widest border-none">
                                            {session.category}
                                        </Badge>
                                    </div>

                                    <div className="space-y-2">
                                        <div className="flex items-center gap-2">
                                            <Sparkles className="h-4 w-4 text-indigo-500 fill-indigo-500" />
                                            <p className="text-[10px] font-black text-indigo-600 uppercase tracking-[0.2em]">Private 1-on-1 Session</p>
                                        </div>
                                        <h1 className="text-4xl lg:text-5xl font-black text-[#0f172a] uppercase tracking-tighter leading-none pr-10">
                                            {session.subject}
                                        </h1>
                                    </div>

                                    <div className="flex flex-wrap items-center gap-10 pt-4">
                                        <div className="space-y-1">
                                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest italic">Scheduled Date</p>
                                            <div className="flex items-center gap-2 text-[#0f172a] font-black italic">
                                                <Calendar className="h-4 w-4 text-indigo-500" />
                                                <span className="text-base tracking-tight">{session.date}</span>
                                            </div>
                                        </div>
                                        <div className="space-y-1">
                                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest italic">Time Allocation</p>
                                            <div className="flex items-center gap-2 text-[#0f172a] font-black italic">
                                                <Clock className="h-4 w-4 text-indigo-500" />
                                                <span className="text-base tracking-tight">{session.time}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="pt-4 flex flex-wrap gap-4">
                                    <Button
                                        onClick={handleSyncToCalendar}
                                        disabled={isSyncing}
                                        className="h-14 px-10 rounded-2xl bg-[#0f172a] hover:bg-black text-white font-black uppercase text-[10px] tracking-[0.25em] transition-all border-none flex items-center justify-center gap-3 group shadow-xl shadow-indigo-100"
                                    >
                                        {isSyncing ? <Zap className="h-4 w-4 animate-bounce" /> : <CalendarCheck className="h-4 w-4" />}
                                        {isSyncing ? "Syncing..." : "Sync Portal"}
                                    </Button>
                                    <Button
                                        onClick={() => setShowDigitalPass(true)}
                                        variant="outline"
                                        className="h-14 w-14 rounded-2xl border-slate-100 bg-white hover:bg-indigo-50 hover:border-indigo-100 text-slate-400 hover:text-indigo-600 transition-all flex items-center justify-center shadow-sm"
                                    >
                                        <Download className="h-5 w-5" />
                                    </Button>
                                    <Button variant="outline" className="h-14 w-14 rounded-2xl border-slate-100 bg-white hover:bg-slate-50 text-slate-400 transition-all flex items-center justify-center shadow-sm">
                                        <Share2 className="h-5 w-5" />
                                    </Button>
                                </div>
                            </div>

                            {/* Right: Elite Logistics Sidebar */}
                            <div className="lg:w-[380px] bg-[#0f172a] text-white p-10 lg:p-14 flex flex-col justify-between relative overflow-hidden">
                                <div className="absolute top-0 right-0 p-12 rotate-12 opacity-5 pointer-events-none">
                                    <MapPin className="h-64 w-64" />
                                </div>
                                <div className="space-y-12 relative z-10">
                                    <div className="space-y-6">
                                        <div className="flex items-center gap-2">
                                            <div className="h-1 w-8 bg-indigo-500 rounded-full" />
                                            <p className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.3em]">Building Access</p>
                                        </div>
                                        <div className="space-y-2">
                                            <h2 className="text-3xl font-black uppercase tracking-tighter leading-tight italic">
                                                {session.building}
                                            </h2>
                                            <div className="flex items-center gap-2 text-indigo-400">
                                                <MapPin className="h-4 w-4" />
                                                <span className="text-sm font-black uppercase tracking-widest">{session.room}</span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="bg-white/5 p-6 rounded-[2rem] border border-white/10 backdrop-blur-xl group hover:bg-white/10 transition-all">
                                        <div className="flex items-center gap-3 text-emerald-400 mb-2">
                                            <ShieldCheck className="h-5 w-5" />
                                            <p className="text-[10px] font-black uppercase tracking-[0.2em]">Verified Scholar</p>
                                        </div>
                                        <p className="text-[11px] text-slate-400 font-bold leading-relaxed italic">
                                            Entry ID: <span className="text-white">NX-{session.id}-GUEST</span>
                                        </p>
                                    </div>
                                </div>

                                <div className="pt-10 border-t border-white/10 flex items-center gap-4 group">
                                    <div className="h-12 w-12 rounded-2xl bg-indigo-500/10 flex items-center justify-center text-indigo-400 border border-indigo-500/20 group-hover:scale-105 transition-transform">
                                        <AlertCircle className="h-6 w-6" />
                                    </div>
                                    <div className="space-y-0.5">
                                        <p className="text-[9px] font-black uppercase tracking-widest text-slate-500">Logistics Help</p>
                                        <p className="text-[10px] font-black uppercase text-white hover:text-indigo-400 cursor-pointer transition-colors">Contact Support</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Content Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Left Column: Details */}
                    <div className="lg:col-span-2 space-y-8">
                        <section className="space-y-4">
                            <h3 className="text-xl font-black text-[#0f172a] uppercase tracking-tighter flex items-center gap-3">
                                <Zap className="h-5 w-5 text-indigo-500 fill-indigo-500" />
                                Session Overview
                            </h3>
                            <Card className="border-none bg-slate-50/50 rounded-[2.5rem] p-10 ring-1 ring-slate-100/50 hover:bg-slate-50 transition-colors">
                                <p className="text-slate-600 font-medium leading-[1.8] italic text-lg lg:pr-10">
                                    "{session.description}"
                                </p>
                                <Separator className="my-8 bg-slate-100" />
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-10">
                                    <div className="space-y-4">
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Required Items</p>
                                        <div className="space-y-3">
                                            {session.requirements.map((req, i) => (
                                                <div key={i} className="flex items-center gap-4 bg-white/50 p-4 rounded-2xl border border-slate-100 shadow-sm group hover:scale-[1.02] transition-transform">
                                                    <div className="h-2 w-2 rounded-full bg-indigo-500" />
                                                    <span className="text-[11px] font-black text-[#0f172a] uppercase tracking-tight">{req}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                    <div className="space-y-4">
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Education Type</p>
                                        <div className="bg-indigo-600 p-6 rounded-[2rem] text-white shadow-xl shadow-indigo-100 flex flex-col items-center justify-center text-center space-y-2">
                                            <Trophy className="h-8 w-8 text-indigo-200" />
                                            <div className="space-y-0.5">
                                                <p className="text-[10px] font-black uppercase tracking-widest">Premium Tier</p>
                                                <p className="text-xs font-black uppercase tracking-tighter italic">1-on-1 Personalized</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </Card>
                        </section>
                    </div>

                    {/* Right Column: Sidebar Actions */}
                    <div className="space-y-8">
                        <section className="space-y-4">
                            <h3 className="text-xl font-black text-[#0f172a] uppercase tracking-tighter">Academic Lead</h3>
                            <Card className="border-none shadow-xl shadow-slate-200/50 rounded-[2.5rem] overflow-hidden bg-white ring-1 ring-slate-100">
                                <div className="p-8 space-y-6">
                                    <div className="flex items-center gap-5">
                                        <div className="h-16 w-16 rounded-2xl bg-indigo-600 flex items-center justify-center text-white text-2xl font-black shadow-lg shadow-indigo-100 italic">
                                            {session.teacher.split(' ').pop().charAt(0)}
                                        </div>
                                        <div className="space-y-0.5">
                                            <h4 className="text-lg font-black text-[#0f172a] uppercase tracking-tight leading-none">{session.teacher}</h4>
                                            <p className="text-[9px] font-black text-indigo-600 uppercase tracking-[0.25em]">Senior Lecturer</p>
                                        </div>
                                    </div>
                                    <p className="text-xs text-slate-500 leading-relaxed font-medium italic border-l-2 border-slate-50 pl-4 py-1">
                                        {session.tutorBio}
                                    </p>
                                    <Button variant="outline" className="w-full h-12 rounded-xl border-slate-100 text-slate-400 font-black uppercase text-[10px] tracking-widest hover:border-indigo-600 hover:text-indigo-600 transition-all gap-2 shadow-sm">
                                        <MessageSquare className="h-4 w-4" />
                                        Private Message
                                    </Button>
                                </div>
                            </Card>
                        </section>

                        <section className="space-y-4">
                            <h3 className="text-xl font-black text-[#0f172a] uppercase tracking-tighter">Support</h3>
                            <Card className="border-none bg-white rounded-[2.5rem] p-8 space-y-6 ring-1 ring-slate-100 shadow-sm">
                                <div className="flex items-center gap-4">
                                    <div className="h-10 w-10 bg-red-50 rounded-xl flex items-center justify-center">
                                        <XCircle className="h-5 w-5 text-red-500" />
                                    </div>
                                    <div className="space-y-0.5">
                                        <p className="text-[10px] font-black text-[#0f172a] uppercase tracking-widest">Cancellation</p>
                                        <p className="text-[10px] font-bold text-slate-400 italic">Policy: 24h Notice</p>
                                    </div>
                                </div>
                                <Button
                                    onClick={() => setShowCancelDialog(true)}
                                    className="w-full h-12 rounded-xl bg-slate-50 text-slate-400 hover:bg-red-50 hover:text-red-600 font-black uppercase text-[10px] tracking-widest transition-all border-none"
                                >
                                    Cancel Service
                                </Button>
                            </Card>
                        </section>
                    </div>
                </div>

                {/* Cancellation Dialog - Elite Standard */}
                <AlertDialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
                    <AlertDialogContent className="rounded-[3rem] border-none shadow-3xl p-0 max-w-lg overflow-hidden bg-white ring-1 ring-slate-100">
                        <div className="absolute top-0 left-0 w-full h-2 bg-red-500" />
                        <div className="p-10 lg:p-12 space-y-8">
                            <div className="flex justify-between items-start">
                                <div className="h-16 w-16 rounded-2xl bg-red-50 flex items-center justify-center">
                                    <Trash2 className="h-8 w-8 text-red-500" />
                                </div>
                                <button onClick={() => setShowCancelDialog(false)} className="p-2 hover:bg-slate-50 rounded-full transition-colors">
                                    <X className="h-5 w-5 text-slate-400" />
                                </button>
                            </div>
                            <div className="space-y-4">
                                <AlertDialogTitle className="text-3xl font-black text-[#0f172a] uppercase tracking-tighter leading-none">
                                    Release Spot?
                                </AlertDialogTitle>
                                <AlertDialogDescription className="text-slate-500 font-medium leading-relaxed italic pr-4 text-sm">
                                    You are about to cancel your session for <span className="text-[#0f172a] font-bold italic">"{session?.subject}"</span>. This action is irreversible.
                                </AlertDialogDescription>
                            </div>
                            <div className="space-y-3">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 italic">
                                    Justification <span className="text-red-500">*</span>
                                </label>
                                <Textarea
                                    placeholder="Enter reason for schedule change..."
                                    value={cancelReason}
                                    onChange={(e) => setCancelReason(e.target.value)}
                                    className="min-h-[140px] rounded-[1.5rem] border-slate-100 bg-slate-50/50 focus:bg-white focus:ring-red-500/10 focus:border-red-500/20 transition-all resize-none p-6 text-sm italic font-medium"
                                />
                            </div>
                            <AlertDialogFooter className="flex flex-row items-center gap-4 pt-4 border-t border-slate-50">
                                <AlertDialogAction
                                    onClick={(e) => { e.preventDefault(); handleCancelSession(); }}
                                    className="flex-1 h-16 rounded-2xl bg-red-600 hover:bg-black text-white font-black uppercase text-xs tracking-widest transition-all border-none flex items-center justify-center gap-2 group"
                                >
                                    Confirm
                                    <XCircle className="h-4 w-4" />
                                </AlertDialogAction>
                                <AlertDialogCancel className="flex-1 h-16 rounded-2xl border-slate-200 font-black uppercase text-xs tracking-widest hover:bg-slate-50 transition-all">
                                    Back
                                </AlertDialogCancel>
                            </AlertDialogFooter>
                        </div>
                    </AlertDialogContent>
                </AlertDialog>

                {/* Success Overlays */}
                <AlertDialog open={showCancelSuccess}>
                    <AlertDialogContent className="rounded-[3rem] border-none shadow-3xl p-12 max-w-md overflow-hidden bg-white text-center space-y-8">
                        <div className="mx-auto h-24 w-24 bg-red-50 rounded-[2.5rem] flex items-center justify-center relative shadow-sm">
                            <Trash2 className="h-10 w-10 text-red-500 animate-pulse" />
                            <div className="absolute inset-x-0 bottom-6 flex justify-center">
                                <XCircle className="h-5 w-5 text-red-300" />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <h2 className="text-3xl font-black text-[#0f172a] uppercase tracking-tighter">Spot Released</h2>
                            <p className="text-slate-500 font-medium italic">Your reservation has been successfully scrubbed.</p>
                        </div>
                        <div className="pt-4 space-y-4">
                            <div className="h-1.5 w-full bg-slate-50 rounded-full overflow-hidden">
                                <div className="h-full bg-red-500 animate-[cancel-progress_2.5s_linear]" />
                            </div>
                            <p className="text-[10px] font-black text-slate-300 uppercase tracking-[0.3em] animate-pulse">Redirecting to Vault...</p>
                        </div>
                    </AlertDialogContent>
                </AlertDialog>

                {/* Digital Pass Modal */}
                <AlertDialog open={showDigitalPass} onOpenChange={setShowDigitalPass}>
                    <AlertDialogContent className="rounded-[3rem] border-none shadow-[0_40px_100px_rgba(15,23,42,0.4)] p-0 max-w-sm overflow-hidden bg-[#0f172a] text-white">
                        <div className="bg-indigo-600 p-8 text-center space-y-2 relative">
                            <ShieldCheck className="absolute top-4 right-6 h-6 w-6 text-indigo-300 opacity-40" />
                            <h2 className="text-xl font-black uppercase tracking-widest italic">Digital Access Pass</h2>
                            <p className="text-[9px] font-black text-indigo-100 uppercase tracking-[0.4em]">Elite Scholar Registry</p>
                        </div>
                        <div className="p-10 space-y-8 relative">
                            <div className="bg-white/5 rounded-[2.5rem] p-8 border border-white/10 space-y-8 text-center">
                                <div className="space-y-1">
                                    <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">Student</p>
                                    <h3 className="text-2xl font-black uppercase tracking-tight italic">Justin Digal</h3>
                                </div>
                                <div className="space-y-4 pt-4 border-t border-white/5">
                                    <div className="flex justify-between">
                                        <div className="text-left">
                                            <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest">Module</p>
                                            <p className="text-[11px] font-black uppercase text-indigo-400">{session.subject}</p>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest">Gate ID</p>
                                            <p className="text-[11px] font-black uppercase">NX-{session.id}</p>
                                        </div>
                                    </div>
                                    <div className="flex justify-between pt-2">
                                        <div className="text-left">
                                            <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest">Wing</p>
                                            <p className="text-[10px] font-medium text-slate-300">{session.room}</p>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest">Date</p>
                                            <p className="text-[10px] font-medium text-slate-300">{session.date}</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div className="flex flex-col items-center space-y-6">
                                <div className="h-24 w-24 rounded-full bg-indigo-500/10 flex items-center justify-center border border-indigo-500/20">
                                    <Camera className="h-10 w-10 text-indigo-400 animate-pulse" />
                                </div>
                                <div className="text-center space-y-2">
                                    <p className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.3em]">Manual Validation</p>
                                    <p className="text-[9px] text-slate-400 font-medium italic px-4">Screenshot this credential for physical building access.</p>
                                </div>
                            </div>
                            <div className="space-y-3 pt-4 border-t border-white/10">
                                <div className="w-full h-16 rounded-2xl bg-indigo-600 border border-indigo-400 flex items-center justify-center gap-3 px-6 text-center">
                                    <p className="text-[10px] font-black text-white uppercase tracking-widest">📸 Screenshot Required</p>
                                </div>
                                <Button
                                    onClick={() => setShowDigitalPass(false)}
                                    variant="ghost"
                                    className="w-full h-10 text-slate-500 font-bold uppercase text-[9px] tracking-widest hover:text-white"
                                >
                                    Credential Captured
                                </Button>
                            </div>
                        </div>
                        <div className="h-2 bg-indigo-600 w-full" />
                    </AlertDialogContent>
                </AlertDialog>

                <style dangerouslySetInnerHTML={{ __html: `@keyframes cancel-progress { 0% { width: 0%; } 100% { width: 100%; } }` }} />
            </div>
        </AppLayout>
    );
}
