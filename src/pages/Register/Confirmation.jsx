import { useState, useEffect, useRef } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { authService } from "../../services/authService";
import LandingLayout from "../../layouts/LandingLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Mail, ArrowRight, CheckCircle2, Loader2, RefreshCcw, Star, Inbox } from "lucide-react";
import LandingImg from "../../assets/LandingPage_Home.png";
import {
    InputOTP,
    InputOTPGroup,
    InputOTPSlot,
} from "@/components/ui/input-otp";

export default function Confirmation() {
    const [isVerifying, setIsVerifying] = useState(false);
    const [isVerified, setIsVerified] = useState(false);
    const [otp, setOtp] = useState("");
    const [error, setError] = useState("");
    const [resendCooldown, setResendCooldown] = useState(0);
    const [isSending, setIsSending] = useState(false);
    const otpSentRef = useRef(false);
    const navigate = useNavigate();
    const location = useLocation();
    const email = location.state?.email || "";

    // Guard: redirect back if no email in state (direct URL access)
    useEffect(() => {
        if (!email) {
            navigate("/register", { replace: true });
        }
    }, [email, navigate]);

    // Send OTP on mount — ref guard prevents the double-fire caused by
    // React 18 Strict Mode's intentional mount → unmount → remount cycle.
    useEffect(() => {
        if (email && !otpSentRef.current) {
            otpSentRef.current = true;
            sendOtp();
        }
    }, []);

    // Cooldown timer
    useEffect(() => {
        if (resendCooldown <= 0) return;
        const timer = setTimeout(() => setResendCooldown(resendCooldown - 1), 1000);
        return () => clearTimeout(timer);
    }, [resendCooldown]);

    const sendOtp = async () => {
        setIsSending(true);
        setError("");
        try {
            await authService.sendOtp(email);
            setResendCooldown(60);
        } catch (err) {
            setError("Failed to send verification code. Please try again.");
        } finally {
            setIsSending(false);
        }
    };

    const handleVerify = async () => {
        setIsVerifying(true);
        setError("");
        try {
            await authService.verifyOtp(email, otp);
            setIsVerified(true);
        } catch (err) {
            const msg = err.response?.data?.message || "Invalid or expired verification code";
            setError(msg);
        } finally {
            setIsVerifying(false);
        }
    };

    const handleResend = () => {
        if (resendCooldown > 0 || isSending) return;
        setOtp("");
        sendOtp();
    };

    return (
        <LandingLayout>
            <div className="min-h-[calc(100vh-3.5rem)] flex items-center justify-center p-4">
                <div className="w-full max-w-6xl grid lg:grid-cols-2 gap-8 items-center">
                    {/* Left Side - Branding (Hidden on mobile) */}
                    <div className="hidden lg:block space-y-8">
                        <div className="space-y-4">
                            <div className="flex items-center gap-3">
                                <Avatar className="h-12 w-12 rounded-xl">
                                    <AvatarFallback className="bg-gradient-to-br from-gray-900 to-gray-700 text-white rounded-xl">
                                        <Star className="h-6 w-6" />
                                    </AvatarFallback>
                                </Avatar>
                                <div>
                                    <p className="text-2xl font-bold text-gray-900 leading-tight">Teach. Learn. Grow.</p>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Badge variant="secondary" className="w-fit">
                                    <Mail className="h-3 w-3 mr-1" />
                                    Email Verification
                                </Badge>
                                <h2 className="text-4xl font-bold text-gray-900 leading-tight">
                                    One last step to get you started
                                </h2>
                                <p className="text-gray-600 font-medium">
                                    We've sent a secure 6-digit code to your inbox. Verification helps us keep your account safe and secure.
                                </p>
                            </div>
                        </div>

                        <Card className="border-2 shadow-lg overflow-hidden">
                            <CardContent className="p-0">
                                <img
                                    src={LandingImg}
                                    alt="Verification process illustration"
                                    className="w-full h-auto object-cover"
                                />
                            </CardContent>
                        </Card>
                    </div>

                    {/* Right Side - Confirmation Content */}
                    <Card className="w-full max-w-md lg:max-w-lg mx-auto shadow-xl border-2 min-h-[500px] flex flex-col justify-center relative overflow-hidden">
                        {/* Progress Bar Animation */}
                        <div className="absolute top-0 left-0 w-full h-1 bg-gray-100">
                            <div
                                className={`h-full bg-gray-900 transition-all duration-1000 ${isVerified ? 'w-full' : 'w-1/2'}`}
                            />
                        </div>

                        {!isVerified ? (
                            <>
                                <CardHeader className="space-y-4 px-8 pt-8 text-center">
                                    <div className="mx-auto bg-gray-50 h-20 w-20 rounded-full flex items-center justify-center border-2 border-gray-100 mb-2">
                                        <Inbox className="h-10 w-10 text-gray-900 animate-bounce" />
                                    </div>
                                    <div className="space-y-2">
                                        <CardTitle className="text-2xl font-bold">Check your email</CardTitle>
                                        <CardDescription className="text-base">
                                            We sent a verification code to <span className="font-semibold text-gray-900">{email}</span>
                                        </CardDescription>
                                    </div>
                                </CardHeader>

                                <CardContent className="px-8 pb-6 space-y-6">
                                    <div className="space-y-4">
                                        {error && (
                                            <div className="bg-red-50 border border-red-200 text-red-700 text-sm p-3 rounded-lg">
                                                {error}
                                            </div>
                                        )}

                                        <div className="bg-blue-50 border border-blue-100 p-4 rounded-xl flex gap-3 items-start">
                                            <div className="bg-blue-500 rounded-full p-1 mt-0.5">
                                                <ArrowRight className="h-3 w-3 text-white" />
                                            </div>
                                            <p className="text-sm text-blue-900 leading-relaxed">
                                                Enter the 6-digit verification code sent to your email to continue.
                                            </p>
                                        </div>

                                        <div className="flex flex-col items-center gap-4 py-2">
                                            <InputOTP
                                                maxLength={6}
                                                value={otp}
                                                onChange={(value) => setOtp(value)}
                                            >
                                                <InputOTPGroup className="gap-2">
                                                    <InputOTPSlot index={0} className="h-12 w-12 text-lg border-2 rounded-lg" />
                                                    <InputOTPSlot index={1} className="h-12 w-12 text-lg border-2 rounded-lg" />
                                                    <InputOTPSlot index={2} className="h-12 w-12 text-lg border-2 rounded-lg" />
                                                    <InputOTPSlot index={3} className="h-12 w-12 text-lg border-2 rounded-lg" />
                                                    <InputOTPSlot index={4} className="h-12 w-12 text-lg border-2 rounded-lg" />
                                                    <InputOTPSlot index={5} className="h-12 w-12 text-lg border-2 rounded-lg" />
                                                </InputOTPGroup>
                                            </InputOTP>
                                            <p className="text-xs text-gray-500">
                                                Didn't receive the code? Check your spam folder.
                                            </p>
                                        </div>
                                    </div>

                                    <Button
                                        onClick={handleVerify}
                                        disabled={isVerifying || otp.length !== 6}
                                        className="w-full h-12 text-base font-semibold shadow-lg hover:shadow-xl transition-all"
                                    >
                                        {isVerifying ? (
                                            <>
                                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                                Verifying Code...
                                            </>
                                        ) : (
                                            "Verify Account"
                                        )}
                                    </Button>

                                    <div className="text-center">
                                        <button
                                            onClick={handleResend}
                                            disabled={resendCooldown > 0 || isSending}
                                            className="text-sm font-semibold text-gray-600 hover:text-gray-900 flex items-center justify-center mx-auto gap-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            <RefreshCcw className={`h-4 w-4 ${isSending ? 'animate-spin' : ''}`} />
                                            {resendCooldown > 0 ? `Resend code (${resendCooldown}s)` : "Resend code"}
                                        </button>
                                    </div>
                                </CardContent>
                            </>
                        ) : (
                            <>
                                <CardHeader className="space-y-4 px-8 pt-8 text-center animate-in fade-in zoom-in duration-500">
                                    <div className="mx-auto bg-green-50 h-20 w-20 rounded-full flex items-center justify-center border-2 border-green-100 mb-2">
                                        <CheckCircle2 className="h-10 w-10 text-green-600" />
                                    </div>
                                    <div className="space-y-2">
                                        <CardTitle className="text-2xl font-bold text-gray-900">Email Verified!</CardTitle>
                                        <CardDescription className="text-base text-gray-600">
                                            Your email has been successfully verified. You can now complete your profile.
                                        </CardDescription>
                                    </div>
                                </CardHeader>

                                <CardContent className="px-8 pb-6">
                                    <Button asChild className="w-full h-12 text-base font-semibold bg-green-600 hover:bg-green-700 shadow-lg transition-all group">
                                        <Link to="/register/password" state={{ email }}>
                                            Complete Profile
                                            <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                                        </Link>
                                    </Button>
                                </CardContent>
                            </>
                        )}

                        <CardFooter className="flex flex-col space-y-4 px-8 pb-8">
                            <Separator />
                            <div className="flex items-center justify-between w-full">
                                <Link to="/register" className="text-sm font-semibold text-gray-600 hover:text-gray-900 transition-all">
                                    ← Back to register
                                </Link>
                                <p className="text-xs text-gray-400 font-medium">Step 2 of 3</p>
                            </div>
                        </CardFooter>
                    </Card>
                </div>
            </div>
        </LandingLayout>
    );
}
