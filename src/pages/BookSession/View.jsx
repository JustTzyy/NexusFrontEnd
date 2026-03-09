import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import AppLayout from "../../layouts/AppLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import {
    ArrowLeft,
    Calendar,
    Clock,
    User,
    BookOpen,
    MapPin,
    ShieldCheck,
    Info,
    CheckCircle2,
    MessageSquare,
    ChevronRight,
    ArrowRight,
    Star,
    Zap,
    Trophy,
    X
} from "lucide-react";
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

export default function BookSessionView() {
    const { sessionId } = useParams();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [showConfirm, setShowConfirm] = useState(false);
    const [showSuccess, setShowSuccess] = useState(false);

    // Mock Session Data - strictly aligned with 1-on-1 tutoring requirement
    const sessionDetail = {
        id: sessionId,
        subject: "Advanced Calculus",
        category: "Mathematics",
        teacher: {
            name: "Prof. Sarah Johnson",
            initials: "SJ",
            title: "Senior Mathematics Tutor",
            rating: 4.9,
            experience: "8+ Years",
            description: "Specializes in complex analysis and engineering mathematics. Known for simplifying abstract concepts for students."
        },
        building: "Main Academic Building",
        room: "Room 302",
        date: "Monday, Feb 10, 2026",
        time: "09:00 AM - 11:00 AM",
        duration: "120 Minutes",
        status: "Available",
        type: "1-on-1 Private Session"
    };

    useEffect(() => {
        const timer = setTimeout(() => setLoading(false), 800);
        return () => clearTimeout(timer);
    }, []);

    const handleBack = () => navigate(-1);

    return (
        <AppLayout
            title="Session Details"
            brand={{ name: "NexUs", subtitle: "Tutoring Portal", mark: "NX" }}
            onLogout={() => navigate("/login")}
            user={{ name: "Justin Digal", initials: "JD", email: "digaljustin099@gmail.com" }}
        >
            <div className="max-w-7xl mx-auto pb-20 px-4 sm:px-6 space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-500">
                {/* Navigation */}
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleBack}
                    className="text-slate-400 hover:text-[#0f172a] -ml-2 font-black uppercase text-[10px] tracking-[0.2em] gap-2 transition-all"
                >
                    <ArrowLeft className="h-3 w-3" />
                    Back to Schedule
                </Button>

                {loading ? (
                    <div className="space-y-8">
                        {/* Hero Skeleton */}
                        <Skeleton className="h-[450px] w-full rounded-[3rem]" />

                        {/* Content Grid Skeleton */}
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                            <Skeleton className="h-96 lg:col-span-2 rounded-[2.5rem]" />
                            <div className="space-y-8">
                                <Skeleton className="h-96 rounded-[2.5rem]" />
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="space-y-10">
                        {/* Premium Hero Section */}
                        <Card className="border-none shadow-[0_30px_60px_-15px_rgba(15,23,42,0.1)] rounded-[3rem] overflow-hidden bg-white ring-1 ring-slate-100">
                            <CardContent className="p-0">
                                <div className="flex flex-col lg:flex-row min-h-[450px]">
                                    {/* Left Content */}
                                    <div className="flex-1 p-10 lg:p-16 space-y-12">
                                        <div className="space-y-6">
                                            <div className="flex flex-wrap items-center gap-3">
                                                <div className="flex items-center gap-2 bg-indigo-50 px-4 py-1.5 rounded-full border border-indigo-100">
                                                    <Zap className="h-3.5 w-3.5 text-indigo-600 fill-indigo-100" />
                                                    <span className="text-[10px] font-black text-indigo-600 uppercase tracking-widest">{sessionDetail.type}</span>
                                                </div>
                                                <Badge className="bg-green-50 text-green-600 border-green-100 font-black px-4 py-1.5 rounded-full uppercase text-[10px] tracking-widest">
                                                    {sessionDetail.status}
                                                </Badge>
                                            </div>

                                            <div className="space-y-3">
                                                <h1 className="text-5xl lg:text-7xl font-black text-[#0f172a] tracking-tighter leading-[0.9] uppercase">
                                                    {sessionDetail.subject}
                                                </h1>
                                                <div className="flex items-center gap-3 text-slate-400 font-bold uppercase text-xs tracking-[0.1em]">
                                                    <BookOpen className="h-5 w-5 text-indigo-300" />
                                                    {sessionDetail.category} Specialist Program
                                                </div>
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 pt-6">
                                            <div className="space-y-4">
                                                <p className="text-[10px] font-black text-slate-300 uppercase tracking-[0.2em] italic">Schedule Window</p>
                                                <div className="flex items-start gap-4">
                                                    <div className="h-14 w-14 rounded-2xl bg-slate-50 flex items-center justify-center border border-slate-100 group hover:bg-white hover:shadow-xl transition-all duration-500">
                                                        <Calendar className="h-7 w-7 text-indigo-400" />
                                                    </div>
                                                    <div>
                                                        <p className="text-xl font-black text-[#0f172a] tracking-tight">{sessionDetail.date}</p>
                                                        <p className="text-sm font-bold text-slate-400">{sessionDetail.time}</p>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="space-y-4">
                                                <p className="text-[10px] font-black text-slate-300 uppercase tracking-[0.2em] italic">Session Scope</p>
                                                <div className="flex items-start gap-4">
                                                    <div className="h-14 w-14 rounded-2xl bg-slate-50 flex items-center justify-center border border-slate-100">
                                                        <Clock className="h-7 w-7 text-indigo-400" />
                                                    </div>
                                                    <div>
                                                        <p className="text-xl font-black text-[#0f172a] tracking-tight">{sessionDetail.duration}</p>
                                                        <p className="text-sm font-bold text-slate-400 italic">One-on-One Interaction</p>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Action Sidebar */}
                                    <div className="lg:w-[380px] bg-[#0f172a] text-white p-10 lg:p-16 flex flex-col justify-between relative overflow-hidden">
                                        {/* Decorative Background Icon */}
                                        <div className="absolute top-0 right-0 p-8 opacity-5">
                                            <Trophy className="h-64 w-64 text-white rotate-12" />
                                        </div>

                                        <div className="relative z-10 space-y-10">
                                            <div className="space-y-6">
                                                <div className="space-y-2">
                                                    <p className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.3em]">Venue Location</p>
                                                    <h3 className="text-3xl font-black uppercase tracking-tight leading-tight">{sessionDetail.building}</h3>
                                                </div>
                                                <div className="flex items-center gap-3 bg-white/5 py-3 px-5 rounded-2xl border border-white/10 backdrop-blur-md">
                                                    <MapPin className="h-5 w-5 text-indigo-400" />
                                                    <span className="text-lg font-black tracking-tight uppercase">{sessionDetail.room}</span>
                                                </div>
                                            </div>

                                            <div className="space-y-8 pt-4">
                                                <div className="flex items-center gap-4">
                                                    <div className="h-1 w-12 bg-indigo-500 rounded-full" />
                                                    <p className="text-[11px] font-bold text-indigo-300 uppercase tracking-widest italic">Booking Guarantee</p>
                                                </div>
                                                <p className="text-sm font-medium text-slate-400 leading-relaxed italic border-l-2 border-indigo-500/30 pl-6">
                                                    "This session is a direct collaboration. You'll have the tutor's undivided attention for the entire duration."
                                                </p>
                                                <Button
                                                    onClick={() => setShowConfirm(true)}
                                                    className="w-full bg-white text-[#0f172a] hover:bg-indigo-50 font-black h-16 rounded-2xl shadow-2xl transition-all border-none group text-xs uppercase tracking-widest"
                                                >
                                                    Secure This Spot
                                                    <ChevronRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
                                                </Button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
                            {/* Tutor Profile Card */}
                            <Card className="lg:col-span-2 border-none shadow-[0_4px_20px_rgb(0,0,0,0.03)] rounded-[2.5rem] overflow-hidden bg-white ring-1 ring-slate-100">
                                <CardHeader className="px-10 py-10 pb-0">
                                    <div className="flex items-center gap-3">
                                        <div className="h-2 w-2 rounded-full bg-indigo-600" />
                                        <CardTitle className="text-xs font-black text-slate-400 uppercase tracking-[0.2em]">Academic Leadership</CardTitle>
                                    </div>
                                </CardHeader>
                                <CardContent className="px-10 py-10 space-y-12">
                                    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-8">
                                        <div className="relative group">
                                            <div className="h-24 w-24 rounded-[2rem] bg-indigo-600 text-white flex items-center justify-center text-4xl font-black shadow-2xl transition-transform duration-500 group-hover:scale-105 group-hover:rotate-3">
                                                {sessionDetail.teacher.initials}
                                            </div>
                                            <div className="absolute -bottom-2 -right-2 bg-indigo-600 h-8 w-8 rounded-xl flex items-center justify-center border-4 border-white shadow-lg">
                                                <ShieldCheck className="h-4 w-4 text-white" />
                                            </div>
                                        </div>
                                        <div className="space-y-3">
                                            <div className="flex flex-wrap items-center gap-4">
                                                <h3 className="text-3xl font-black text-[#0f172a] uppercase tracking-tighter">{sessionDetail.teacher.name}</h3>
                                                <div className="flex items-center gap-1.5 bg-orange-50 px-4 py-1.5 rounded-full border border-orange-100">
                                                    <Star className="h-4 w-4 text-orange-500 fill-orange-500" />
                                                    <span className="text-sm font-black text-orange-700">{sessionDetail.teacher.rating}</span>
                                                </div>
                                            </div>
                                            <p className="text-indigo-600 font-black uppercase text-xs tracking-widest">{sessionDetail.teacher.title}</p>
                                            <div className="flex flex-wrap gap-6 pt-2">
                                                <div className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-[0.1em]">
                                                    <Trophy className="h-3.5 w-3.5 text-indigo-300" />
                                                    {sessionDetail.teacher.experience} Exp
                                                </div>
                                                <div className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-[0.1em]">
                                                    <CheckCircle2 className="h-3.5 w-3.5 text-green-400" />
                                                    Verified Expert
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="space-y-6 pt-4 border-t border-slate-50 italic">
                                        <div className="flex items-center gap-2">
                                            <MessageSquare className="h-4 w-4 text-indigo-400" />
                                            <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] italic">Professional Philosophy</h4>
                                        </div>
                                        <p className="text-lg font-medium text-slate-600 leading-relaxed pl-6 border-l-4 border-indigo-50/50">
                                            {sessionDetail.teacher.description}
                                        </p>
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Support Overlay */}
                            <div className="space-y-10">
                                <div className="bg-slate-50/50 rounded-[2.5rem] p-10 space-y-6 border-2 border-dashed border-slate-100 flex flex-col items-center h-full justify-center min-h-[300px]">
                                    <div className="h-12 w-12 rounded-full bg-white flex items-center justify-center shadow-sm">
                                        <Info className="h-6 w-6 text-slate-300" />
                                    </div>
                                    <div className="space-y-2 text-center">
                                        <h4 className="text-[10px] font-black text-slate-900 uppercase tracking-widest">Need Support?</h4>
                                        <p className="text-[11px] text-slate-400 font-bold leading-relaxed italic">
                                            Having trouble with this slot? Reach out to our concierge for elite booking assistance.
                                        </p>
                                    </div>
                                    <Button variant="outline" className="w-full h-12 border-2 border-slate-200 text-[#0f172a] hover:bg-[#0f172a] hover:text-white transition-all duration-300 font-black text-[10px] uppercase tracking-widest rounded-2xl">
                                        Contact Admin
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Secure Spot Confirmation Dialog */}
                <AlertDialog open={showConfirm} onOpenChange={setShowConfirm}>
                    <AlertDialogContent className="rounded-[3rem] border-none shadow-[0_30px_60px_-15px_rgba(15,23,42,0.3)] p-0 max-w-lg overflow-hidden bg-white/95 backdrop-blur-xl ring-1 ring-white/20">
                        <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-indigo-500 via-emerald-500 to-indigo-500" />

                        {/* Close Button */}
                        <button
                            onClick={() => setShowConfirm(false)}
                            className="absolute top-6 right-6 h-10 w-10 rounded-full bg-slate-50/50 flex items-center justify-center text-slate-400 hover:bg-slate-100 hover:text-slate-900 transition-all z-50 ring-1 ring-slate-100"
                        >
                            <X className="h-5 w-5" />
                        </button>

                        <div className="p-10 lg:p-12 space-y-10">
                            <AlertDialogHeader className="space-y-6">
                                <div className="relative mx-auto">
                                    <div className="h-20 w-20 bg-indigo-600 rounded-[2rem] flex items-center justify-center shadow-2xl shadow-indigo-200 rotate-3">
                                        <CheckCircle2 className="h-10 w-10 text-white" />
                                    </div>
                                    <div className="absolute -bottom-2 -right-2 bg-emerald-500 h-8 w-8 rounded-xl border-4 border-white shadow-lg flex items-center justify-center">
                                        <Zap className="h-3.5 w-3.5 text-white fill-white" />
                                    </div>
                                </div>

                                <div className="space-y-4 text-center">
                                    <AlertDialogTitle className="text-3xl font-black text-[#0f172a] uppercase tracking-tighter leading-none">
                                        Secure this spot?
                                    </AlertDialogTitle>
                                    <AlertDialogDescription className="text-slate-500 font-medium text-base leading-relaxed px-2">
                                        You are about to finalize your 1-on-1 reservation for
                                        <span className="block mt-3 text-2xl font-black text-[#0f172a] uppercase tracking-tight italic">
                                            {sessionDetail.subject}
                                        </span>
                                        <span className="text-[10px] font-black text-indigo-500 uppercase tracking-[0.2em] mt-2 block">
                                            with {sessionDetail.teacher.name}
                                        </span>
                                    </AlertDialogDescription>
                                </div>
                            </AlertDialogHeader>

                            <div className="bg-slate-50/50 p-6 rounded-[2rem] border border-slate-100 space-y-3">
                                <div className="flex items-center justify-between text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                    <span>Date & Time</span>
                                    <span className="text-indigo-600">Confimed Slot</span>
                                </div>
                                <div className="flex items-center gap-3 text-[#0f172a]">
                                    <Calendar className="h-4 w-4 text-indigo-400" />
                                    <p className="text-sm font-black uppercase">{sessionDetail.date} • {sessionDetail.time}</p>
                                </div>
                            </div>

                            <AlertDialogFooter className="flex flex-row items-center gap-6 pt-4 border-t border-slate-50 mt-4">
                                <AlertDialogAction
                                    onClick={(e) => {
                                        e.preventDefault();
                                        setShowConfirm(false);
                                        setShowSuccess(true);
                                        setTimeout(() => {
                                            navigate('/book-reserved');
                                        }, 2000);
                                    }}
                                    className="flex-1 h-20 rounded-2xl bg-[#0f172a] hover:bg-black text-white font-black uppercase text-xs tracking-widest transition-all border-none flex items-center justify-center gap-3 group px-8"
                                >
                                    Confirm Reservation
                                    <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
                                </AlertDialogAction>

                                <div className="w-32 text-left">
                                    <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest leading-relaxed italic">
                                        Terms & Cancellation policy apply to all private sessions
                                    </p>
                                </div>
                            </AlertDialogFooter>
                        </div>
                    </AlertDialogContent>
                </AlertDialog>

                {/* Success Message Modal */}
                <AlertDialog open={showSuccess} onOpenChange={setShowSuccess}>
                    <AlertDialogContent className="rounded-[3rem] border-none shadow-[0_30px_60px_-15px_rgba(15,23,42,0.3)] p-12 max-w-md overflow-hidden bg-white text-center space-y-8">
                        <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-emerald-500 to-teal-500" />

                        <div className="relative mx-auto w-24 h-24">
                            <div className="absolute inset-0 bg-emerald-100 rounded-[2.5rem] animate-ping opacity-20" />
                            <div className="relative h-24 w-24 bg-emerald-500 rounded-[2.5rem] flex items-center justify-center shadow-2xl shadow-emerald-200">
                                <CheckCircle2 className="h-12 w-12 text-white animate-in zoom-in duration-500" />
                            </div>
                        </div>

                        <div className="space-y-3">
                            <h2 className="text-3xl font-black text-[#0f172a] uppercase tracking-tighter">Spot Secured!</h2>
                            <p className="text-slate-500 font-medium leading-relaxed italic px-4">
                                Excellent choice, <span className="text-emerald-600 font-bold">Justin</span>. Your 1-on-1 session has been added to your elite schedule.
                            </p>
                        </div>

                        <div className="pt-4 space-y-4">
                            <div className="h-1.5 w-full bg-slate-50 rounded-full overflow-hidden">
                                <div className="h-full bg-emerald-500 animate-[progress_2s_ease-in-out]" style={{ width: '100%' }} />
                            </div>
                            <p className="text-[10px] font-black text-slate-300 uppercase tracking-[0.3em] animate-pulse">
                                Redirecting to Reservations...
                            </p>
                        </div>
                    </AlertDialogContent>
                </AlertDialog>

                <style dangerouslySetInnerHTML={{
                    __html: `
                    @keyframes progress {
                        0% { width: 0%; }
                        100% { width: 100%; }
                    }
                `}} />
            </div>
        </AppLayout>
    );
}
