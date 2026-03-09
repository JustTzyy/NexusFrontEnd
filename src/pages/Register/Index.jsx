import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useGoogleLogin } from "@react-oauth/google";
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
import { Mail, ArrowRight, BookOpen, Star, Loader2, AlertCircle } from "lucide-react";
import LandingImg from "../../assets/LandingPage_Home.png";

export default function RegisterIndex() {
    const [email, setEmail] = useState("");
    const [googleLoading, setGoogleLoading] = useState(false);
    const [emailLoading, setEmailLoading] = useState(false);
    const [error, setError] = useState("");
    const navigate = useNavigate();
    const { initUserFromData } = useAuth();

    const onSubmit = async (e) => {
        e.preventDefault();
        setError("");
        setEmailLoading(true);
        try {
            const res = await authService.checkEmail(email);
            const exists = res.data?.exists;
            if (exists) {
                setError("This email is already registered. Please sign in instead.");
                return;
            }
            navigate("/register/confirmation", { state: { email } });
        } catch {
            setError("Unable to verify email. Please try again.");
        } finally {
            setEmailLoading(false);
        }
    };

    const googlePopupRegister = useGoogleLogin({
        onSuccess: async (tokenResponse) => {
            setError("");
            setGoogleLoading(true);
            try {
                const res = await authService.googleLoginWithToken(tokenResponse.access_token);
                const data = res.data?.data || res.data;

                if (!data.isNewUser) {
                    setError("This Gmail is already registered. Please sign in instead.");
                    return;
                }

                sessionStorage.setItem("accessToken", data.token);
                initUserFromData(data);
                navigate("/register/profile");
            } catch (err) {
                const msg = err.response?.data?.message || err.message;
                setError(msg);
            } finally {
                setGoogleLoading(false);
            }
        },
        onError: () => {
            setGoogleLoading(false);
            setError("Google sign-up failed. Please try again.");
        },
    });

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
                                    <BookOpen className="h-3 w-3 mr-1" />
                                    Join Our Community
                                </Badge>
                                <h2 className="text-4xl font-bold text-gray-900 leading-tight">
                                    Start your journey to better learning today
                                </h2>
                                <p className="text-gray-600 font-medium">
                                    Create an account to access our platform, book sessions, and connect with expert tutors.
                                </p>
                            </div>
                        </div>

                        <Card className="border-2 shadow-lg overflow-hidden">
                            <CardContent className="p-0">
                                <img
                                    src={LandingImg}
                                    alt="Tutor and student illustration"
                                    className="w-full h-auto object-cover"
                                />
                            </CardContent>
                        </Card>
                    </div>

                    {/* Right Side - Register Form */}
                    <Card className="w-full max-w-md lg:max-w-lg mx-auto shadow-xl border-2 min-h-[500px] flex flex-col justify-center">
                        <CardHeader className="space-y-2 px-8 pt-8 text-center lg:text-left">
                            <div className="flex items-center justify-between">
                                <CardTitle className="text-2xl font-bold">Register</CardTitle>
                                <Avatar className="h-10 w-10 rounded-xl lg:hidden">
                                    <AvatarFallback className="bg-gradient-to-br from-gray-900 to-gray-700 text-white rounded-xl">
                                        <Star className="h-5 w-5" />
                                    </AvatarFallback>
                                </Avatar>
                            </div>
                            <CardDescription className="text-base">
                                Enter your email address to continue with your registration
                            </CardDescription>
                        </CardHeader>

                        <CardContent className="px-8 pb-6">
                            <form onSubmit={onSubmit} className="space-y-6">
                                <div className="space-y-2">
                                    <Label htmlFor="email" className={`text-sm font-semibold ${error ? "text-red-600" : ""}`}>Email</Label>
                                    <div className="relative">
                                        <Mail className={`absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 ${error ? "text-red-400" : "text-gray-400"}`} />
                                        <Input
                                            id="email"
                                            type="email"
                                            placeholder="name@example.com"
                                            value={email}
                                            onChange={(e) => { setEmail(e.target.value); setError(""); }}
                                            className={`pl-10 h-12 text-base transition-all ${error ? "border-red-400 focus:ring-2 focus:ring-red-200 bg-red-50" : "focus:ring-2 focus:ring-gray-900/10"}`}
                                            required
                                        />
                                    </div>
                                </div>

                                {error && (
                                    <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 text-sm p-3 rounded-lg">
                                        <AlertCircle className="h-4 w-4 flex-shrink-0" />
                                        {error}
                                    </div>
                                )}

                                <Button type="submit" disabled={emailLoading} className="w-full group h-12 text-base font-semibold shadow-lg hover:shadow-xl transition-all">
                                    {emailLoading ? (
                                        <>
                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                            Checking...
                                        </>
                                    ) : (
                                        <>
                                            Continue
                                            <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                                        </>
                                    )}
                                </Button>
                            </form>

                            <div className="relative my-8">
                                <div className="absolute inset-0 flex items-center">
                                    <Separator />
                                </div>
                                <div className="relative flex justify-center text-xs uppercase">
                                    <span className="bg-white px-3 text-gray-500 font-bold tracking-wider">
                                        Or continue with
                                    </span>
                                </div>
                            </div>

                            <Button
                                type="button"
                                variant="outline"
                                className="w-full h-12 font-medium border-2 hover:bg-gray-50 bg-white transition-colors"
                                onClick={() => googlePopupRegister()}
                                disabled={googleLoading}
                            >
                                {googleLoading ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Signing up...
                                    </>
                                ) : (
                                    <>
                                        <svg className="mr-2 h-5 w-5" viewBox="0 0 24 24">
                                            <path
                                                fill="#4285F4"
                                                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                                            />
                                            <path
                                                fill="#34A853"
                                                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                                            />
                                            <path
                                                fill="#FBBC05"
                                                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                                            />
                                            <path
                                                fill="#EA4335"
                                                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                                            />
                                        </svg>
                                        Google
                                    </>
                                )}
                            </Button>
                        </CardContent>

                        <CardFooter className="flex flex-col space-y-4 px-8 pb-8">
                            <Separator />
                            <p className="text-center text-sm text-gray-600">
                                Already have an account?{" "}
                                <Link to="/login" className="font-bold text-gray-900 hover:underline transition-all">
                                    Sign In
                                </Link>
                            </p>
                        </CardFooter>
                    </Card>
                </div>
            </div>
        </LandingLayout>
    );
}
