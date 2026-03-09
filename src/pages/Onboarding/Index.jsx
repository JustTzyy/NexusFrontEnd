import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth, getDashboardPath } from "@/contexts/AuthContext";
import { authService } from "@/services/authService";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    ShieldCheck,
    ArrowRight,
    Eye,
    EyeOff,
    KeyRound,
    CheckCircle2,
    AlertCircle,
    Loader2,
} from "lucide-react";

const STEPS = { WELCOME: "welcome", PASSWORD: "password", DONE: "done" };

export default function Onboarding() {
    const navigate = useNavigate();
    const { user, markPasswordChanged } = useAuth();

    const [step, setStep] = useState(STEPS.WELCOME);
    const [currentPassword, setCurrentPassword] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [showCurrent, setShowCurrent] = useState(false);
    const [showNew, setShowNew] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const firstName = user?.fullName?.split(" ")[0] || "there";
    const role = user?.roles?.[0] || "User";

    // Password strength
    const strength = (() => {
        if (!newPassword) return 0;
        let score = 0;
        if (newPassword.length >= 8) score++;
        if (/[A-Z]/.test(newPassword)) score++;
        if (/[0-9]/.test(newPassword)) score++;
        if (/[^A-Za-z0-9]/.test(newPassword)) score++;
        return score;
    })();

    const strengthLabel = ["", "Weak", "Fair", "Good", "Strong"][strength];
    const strengthColor = ["", "bg-red-400", "bg-amber-400", "bg-blue-400", "bg-emerald-500"][strength];

    const handleChangePassword = async (e) => {
        e.preventDefault();
        setError("");

        if (newPassword.length < 8) {
            setError("New password must be at least 8 characters.");
            return;
        }
        if (newPassword !== confirmPassword) {
            setError("Passwords do not match.");
            return;
        }
        if (currentPassword === newPassword) {
            setError("New password must be different from your current password.");
            return;
        }

        setLoading(true);
        try {
            await authService.changePassword(currentPassword, newPassword, confirmPassword);
            markPasswordChanged();
            setStep(STEPS.DONE);
        } catch (err) {
            const msg = err?.response?.data?.message || err?.response?.data?.errors?.[0] || "Failed to change password. Please check your current password.";
            setError(msg);
        } finally {
            setLoading(false);
        }
    };

    const handleFinish = () => {
        navigate(getDashboardPath(user?.roles), { replace: true });
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100 flex items-center justify-center p-4">
            <div className="w-full max-w-md">

                {/* Logo / brand */}
                <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-gray-900 text-white font-black text-lg mb-3 shadow-lg">
                        NX
                    </div>
                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest">NexUs Platform</p>
                </div>

                {/* Progress dots */}
                <div className="flex items-center justify-center gap-2 mb-8">
                    {[STEPS.WELCOME, STEPS.PASSWORD, STEPS.DONE].map((s, i) => (
                        <div key={s} className={`transition-all duration-300 rounded-full ${
                            step === s ? "w-6 h-2 bg-gray-900" :
                            [STEPS.WELCOME, STEPS.PASSWORD, STEPS.DONE].indexOf(step) > i ? "w-2 h-2 bg-gray-400" :
                            "w-2 h-2 bg-gray-200"
                        }`} />
                    ))}
                </div>

                {/* ── Step 1: Welcome ── */}
                {step === STEPS.WELCOME && (
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <div className="bg-gradient-to-br from-gray-900 to-gray-700 px-8 py-10 text-center">
                            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-white/10 mb-4 backdrop-blur-sm">
                                <ShieldCheck className="h-8 w-8 text-white" />
                            </div>
                            <h1 className="text-2xl font-bold text-white mb-1">Welcome, {firstName}!</h1>
                            <p className="text-gray-300 text-sm">Your account has been set up and is ready.</p>
                        </div>

                        <div className="px-8 py-8 space-y-6">
                            <div className="flex items-center gap-3 p-4 rounded-xl bg-gray-50 border border-gray-100">
                                <div className="w-8 h-8 rounded-lg bg-gray-900 flex items-center justify-center flex-shrink-0">
                                    <span className="text-white text-xs font-bold">{firstName[0]}</span>
                                </div>
                                <div>
                                    <p className="text-sm font-semibold text-gray-900">{user?.fullName}</p>
                                    <p className="text-xs text-gray-500">{role} · {user?.email}</p>
                                </div>
                            </div>

                            <div className="space-y-3">
                                <p className="text-sm font-semibold text-gray-700">Before you get started:</p>
                                {[
                                    "Your account was created with a temporary password",
                                    "You must set a new personal password to continue",
                                    "This keeps your account secure",
                                ].map((item, i) => (
                                    <div key={i} className="flex items-start gap-2.5">
                                        <CheckCircle2 className="h-4 w-4 text-emerald-500 mt-0.5 flex-shrink-0" />
                                        <p className="text-sm text-gray-600">{item}</p>
                                    </div>
                                ))}
                            </div>

                            <Button
                                className="w-full h-12 font-bold text-sm bg-gray-900 hover:bg-gray-800"
                                onClick={() => setStep(STEPS.PASSWORD)}
                            >
                                Continue Setup
                                <ArrowRight className="ml-2 h-4 w-4" />
                            </Button>
                        </div>
                    </div>
                )}

                {/* ── Step 2: Change Password ── */}
                {step === STEPS.PASSWORD && (
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <div className="px-8 pt-8 pb-6 border-b border-gray-100">
                            <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-gray-100 mb-4">
                                <KeyRound className="h-5 w-5 text-gray-700" />
                            </div>
                            <h2 className="text-xl font-bold text-gray-900">Set Your Password</h2>
                            <p className="text-sm text-gray-500 mt-1">
                                Enter your temporary password and choose a new secure one.
                            </p>
                        </div>

                        <form onSubmit={handleChangePassword} className="px-8 py-6 space-y-5">
                            {/* Current (temporary) password */}
                            <div className="space-y-1.5">
                                <Label className="text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                    Temporary Password
                                </Label>
                                <div className="relative">
                                    <Input
                                        type={showCurrent ? "text" : "password"}
                                        value={currentPassword}
                                        onChange={(e) => setCurrentPassword(e.target.value)}
                                        placeholder="Enter temporary password from email"
                                        className="h-11 pr-10"
                                        required
                                    />
                                    <button
                                        type="button"
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700 transition-colors"
                                        onClick={() => setShowCurrent(v => !v)}
                                    >
                                        {showCurrent ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                    </button>
                                </div>
                            </div>

                            {/* New password */}
                            <div className="space-y-1.5">
                                <Label className="text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                    New Password
                                </Label>
                                <div className="relative">
                                    <Input
                                        type={showNew ? "text" : "password"}
                                        value={newPassword}
                                        onChange={(e) => setNewPassword(e.target.value)}
                                        placeholder="At least 8 characters"
                                        className="h-11 pr-10"
                                        required
                                    />
                                    <button
                                        type="button"
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700 transition-colors"
                                        onClick={() => setShowNew(v => !v)}
                                    >
                                        {showNew ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                    </button>
                                </div>
                                {/* Strength bar */}
                                {newPassword && (
                                    <div className="space-y-1 pt-1">
                                        <div className="flex gap-1">
                                            {[1, 2, 3, 4].map(i => (
                                                <div key={i} className={`h-1 flex-1 rounded-full transition-all duration-300 ${i <= strength ? strengthColor : "bg-gray-100"}`} />
                                            ))}
                                        </div>
                                        <p className="text-xs text-gray-500">
                                            Strength: <span className="font-semibold">{strengthLabel}</span>
                                        </p>
                                    </div>
                                )}
                            </div>

                            {/* Confirm password */}
                            <div className="space-y-1.5">
                                <Label className="text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                    Confirm New Password
                                </Label>
                                <div className="relative">
                                    <Input
                                        type={showConfirm ? "text" : "password"}
                                        value={confirmPassword}
                                        onChange={(e) => setConfirmPassword(e.target.value)}
                                        placeholder="Re-enter new password"
                                        className="h-11 pr-10"
                                        required
                                    />
                                    <button
                                        type="button"
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700 transition-colors"
                                        onClick={() => setShowConfirm(v => !v)}
                                    >
                                        {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                    </button>
                                </div>
                                {confirmPassword && newPassword && (
                                    <p className={`text-xs font-medium ${confirmPassword === newPassword ? "text-emerald-600" : "text-red-500"}`}>
                                        {confirmPassword === newPassword ? "Passwords match" : "Passwords do not match"}
                                    </p>
                                )}
                            </div>

                            {error && (
                                <div className="flex items-start gap-2 p-3 rounded-lg bg-red-50 border border-red-100">
                                    <AlertCircle className="h-4 w-4 text-red-500 flex-shrink-0 mt-0.5" />
                                    <p className="text-sm text-red-600">{error}</p>
                                </div>
                            )}

                            <div className="flex gap-3 pt-1">
                                <Button
                                    type="button"
                                    variant="outline"
                                    className="flex-1 h-11"
                                    onClick={() => { setStep(STEPS.WELCOME); setError(""); }}
                                >
                                    Back
                                </Button>
                                <Button
                                    type="submit"
                                    className="flex-1 h-11 font-bold bg-gray-900 hover:bg-gray-800"
                                    disabled={loading}
                                >
                                    {loading ? (
                                        <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving…</>
                                    ) : (
                                        <>Set Password <ArrowRight className="ml-2 h-4 w-4" /></>
                                    )}
                                </Button>
                            </div>
                        </form>
                    </div>
                )}

                {/* ── Step 3: Done ── */}
                {step === STEPS.DONE && (
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <div className="px-8 py-12 text-center space-y-5">
                            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-emerald-50 mx-auto">
                                <CheckCircle2 className="h-10 w-10 text-emerald-500" />
                            </div>
                            <div>
                                <h2 className="text-2xl font-bold text-gray-900">You're all set!</h2>
                                <p className="text-sm text-gray-500 mt-2 leading-relaxed">
                                    Your password has been updated. You now have full access to the platform.
                                </p>
                            </div>
                            <Button
                                className="w-full h-12 font-bold text-sm bg-gray-900 hover:bg-gray-800 mt-2"
                                onClick={handleFinish}
                            >
                                Go to Dashboard
                                <ArrowRight className="ml-2 h-4 w-4" />
                            </Button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
