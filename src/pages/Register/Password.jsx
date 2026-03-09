import { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { authService } from "../../services/authService";
import { useAuth } from "../../contexts/AuthContext";
import LandingLayout from "../../layouts/LandingLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Lock, Eye, EyeOff, Star, ShieldCheck, ArrowRight, Loader2 } from "lucide-react";
import LandingImg from "../../assets/LandingPage_Home.png";

export default function CreatePassword() {
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState("");
    const navigate = useNavigate();
    const location = useLocation();
    const { initUserFromData } = useAuth();

    const email = location.state?.email || "";

    const handleRegister = async (e) => {
        e.preventDefault();
        setError("");

        if (password !== confirmPassword) {
            setError("Passwords do not match!");
            return;
        }

        if (!email) {
            setError("Email is missing. Please start from the registration page.");
            return;
        }

        setIsSubmitting(true);
        try {
            const res = await authService.register(email, password, confirmPassword);
            const data = res.data?.data || res.data;

            // Store token and hydrate auth state so ProtectedRoute sees the user as authenticated
            sessionStorage.setItem("accessToken", data.token);
            initUserFromData(data);

            navigate("/register/welcome", { replace: true });
        } catch (err) {
            const msg = err.response?.data?.message || err.response?.data?.errors?.join(", ") || err.message;
            setError(msg);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <LandingLayout>
            <div className="min-h-[calc(100vh-3.5rem)] flex items-center justify-center p-4">
                <div className="w-full max-w-6xl grid lg:grid-cols-2 gap-8 items-center">
                    {/* Left Side - Branding */}
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
                                    <ShieldCheck className="h-3 w-3 mr-1" />
                                    Final Step
                                </Badge>
                                <h2 className="text-4xl font-bold text-gray-900 leading-tight">
                                    Secure your account and get started
                                </h2>
                                <p className="text-gray-600 font-medium">
                                    Set a strong password to protect your information and access your personalized tutoring dashboard.
                                </p>
                            </div>
                        </div>

                        <Card className="border-2 shadow-lg overflow-hidden">
                            <CardContent className="p-0">
                                <img
                                    src={LandingImg}
                                    alt="Security illustration"
                                    className="w-full h-auto object-cover"
                                />
                            </CardContent>
                        </Card>
                    </div>

                    {/* Right Side - Password Form */}
                    <Card className="w-full max-w-md lg:max-w-lg mx-auto shadow-xl border-2 min-h-[550px] flex flex-col justify-center relative overflow-hidden">
                        {/* Step Progress */}
                        <div className="absolute top-0 left-0 w-full h-1 bg-gray-100">
                            <div className="h-full bg-gray-900 w-full" />
                        </div>

                        <>
                                <CardHeader className="space-y-2 px-8 pt-8">
                                    <div className="flex items-center justify-between">
                                        <CardTitle className="text-2xl font-bold">Create Password</CardTitle>
                                        <Avatar className="h-10 w-10 rounded-xl lg:hidden">
                                            <AvatarFallback className="bg-gradient-to-br from-gray-900 to-gray-700 text-white rounded-xl">
                                                <Star className="h-5 w-5" />
                                            </AvatarFallback>
                                        </Avatar>
                                    </div>
                                    <CardDescription className="text-base">
                                        Almost there! Set your password to complete your registration.
                                    </CardDescription>
                                    {email && (
                                        <p className="text-sm text-gray-500">
                                            Registering as <span className="font-semibold text-gray-900">{email}</span>
                                        </p>
                                    )}
                                </CardHeader>

                                <CardContent className="px-8 pb-6">
                                    <form onSubmit={handleRegister} className="space-y-5">
                                        {error && (
                                            <div className="bg-red-50 border border-red-200 text-red-700 text-sm p-3 rounded-lg">
                                                {error}
                                            </div>
                                        )}

                                        <div className="space-y-2">
                                            <Label htmlFor="password">Password</Label>
                                            <div className="relative">
                                                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                                                <Input
                                                    id="password"
                                                    type={showPassword ? "text" : "password"}
                                                    placeholder="••••••••"
                                                    value={password}
                                                    onChange={(e) => setPassword(e.target.value)}
                                                    className="pl-10 pr-10 h-11"
                                                    required
                                                    minLength={8}
                                                />
                                                <button
                                                    type="button"
                                                    onClick={() => setShowPassword(!showPassword)}
                                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                                                >
                                                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                                </button>
                                            </div>
                                        </div>

                                        <div className="space-y-2">
                                            <Label htmlFor="confirmPassword">Confirm Password</Label>
                                            <div className="relative">
                                                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                                                <Input
                                                    id="confirmPassword"
                                                    type={showPassword ? "text" : "password"}
                                                    placeholder="••••••••"
                                                    value={confirmPassword}
                                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                                    className="pl-10 h-11"
                                                    required
                                                />
                                            </div>
                                        </div>

                                        <div className="bg-gray-50 p-4 rounded-xl border border-gray-100 mb-2">
                                            <p className="text-xs text-gray-500 font-medium leading-relaxed">
                                                By creating an account, you agree to our <Link to="/terms" className="text-gray-900 underline">Terms of Service</Link> and <Link to="/privacy" className="text-gray-900 underline">Privacy Policy</Link>.
                                            </p>
                                        </div>

                                        <Button
                                            type="submit"
                                            className="w-full h-12 text-base font-semibold shadow-lg hover:shadow-xl transition-all group"
                                            disabled={isSubmitting}
                                        >
                                            {isSubmitting ? (
                                                <>
                                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                                    Creating Account...
                                                </>
                                            ) : (
                                                <>
                                                    Complete Registration
                                                    <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                                                </>
                                            )}
                                        </Button>
                                    </form>
                                </CardContent>
                            </>

                        <CardFooter className="flex flex-col space-y-4 px-8 pb-8">
                            <Separator />
                            <div className="flex items-center justify-between w-full">
                                <Link to="/register/confirmation" className="text-sm font-semibold text-gray-600 hover:text-gray-900 transition-all">
                                    ← Previous step
                                </Link>
                                <p className="text-xs text-gray-400 font-medium">Step 3 of 3</p>
                            </div>
                        </CardFooter>
                    </Card>
                </div>
            </div>
        </LandingLayout>
    );
}
