import { useState, useEffect } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import LandingLayout from "../../layouts/LandingLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Lock, ArrowLeft, Loader2, CheckCircle, Eye, EyeOff, Star, XCircle, Home, LogIn } from "lucide-react";
import { authService } from "@/services/authService";

export default function ForgotPassword() {
    const navigate = useNavigate();
    const { token } = useParams();
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [validating, setValidating] = useState(true);
    const [error, setError] = useState("");
    const [tokenValid, setTokenValid] = useState(false);
    const [userEmail, setUserEmail] = useState("");
    const [success, setSuccess] = useState(false);

    // Validate token on mount
    useEffect(() => {
        const validateToken = async () => {
            try {
                const response = await authService.validateResetToken(token);
                if (response.data?.isValid) {
                    setTokenValid(true);
                    setUserEmail(response.data.email || "");
                } else {
                    setTokenValid(false);
                }
            } catch (err) {
                setTokenValid(false);
            } finally {
                setValidating(false);
            }
        };

        if (token) {
            validateToken();
        } else {
            setValidating(false);
            setTokenValid(false);
        }
    }, [token]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");

        // Validation
        if (newPassword.length < 6) {
            setError("Password must be at least 6 characters long");
            return;
        }

        if (newPassword !== confirmPassword) {
            setError("Passwords do not match");
            return;
        }

        setLoading(true);

        try {
            await authService.resetPassword(token, newPassword);
            setSuccess(true);
        } catch (err) {
            setError(err.response?.data?.message || "Failed to reset password. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    // Loading state
    if (validating) {
        return (
            <LandingLayout>
                <div className="min-h-[calc(100vh-3.5rem)] flex items-center justify-center p-4">
                    <Card className="w-full max-w-md shadow-xl border-2">
                        <CardContent className="py-16 text-center">
                            <Loader2 className="h-8 w-8 animate-spin mx-auto text-gray-400" />
                            <p className="mt-4 text-gray-600">Validating reset link...</p>
                        </CardContent>
                    </Card>
                </div>
            </LandingLayout>
        );
    }

    // Invalid token state
    if (!tokenValid) {
        return (
            <LandingLayout>
                <div className="min-h-[calc(100vh-3.5rem)] flex items-center justify-center p-4">
                    <Card className="w-full max-w-md shadow-xl border-2">
                        <CardHeader className="space-y-4 text-center px-8 pt-8">
                            <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
                                <XCircle className="h-8 w-8 text-red-600" />
                            </div>
                            <CardTitle className="text-2xl font-bold">Invalid or Expired Link</CardTitle>
                            <CardDescription className="text-base">
                                This password reset link is invalid or has expired. Please request a new one.
                            </CardDescription>
                        </CardHeader>

                        <CardFooter className="flex flex-col space-y-4 px-8 pb-8">
                            <Button className="w-full" onClick={() => navigate("/email-verification")}>
                                Request New Link
                            </Button>
                            <Link
                                to="/login"
                                className="flex items-center text-sm text-gray-600 hover:text-gray-900 w-full justify-center"
                            >
                                <ArrowLeft className="mr-2 h-4 w-4" />
                                Back to Login
                            </Link>
                        </CardFooter>
                    </Card>
                </div>
            </LandingLayout>
        );
    }

    // Success state
    if (success) {
        return (
            <LandingLayout>
                <div className="min-h-[calc(100vh-3.5rem)] flex items-center justify-center p-4">
                    <Card className="w-full max-w-md shadow-xl border-2">
                        <CardHeader className="space-y-4 text-center px-8 pt-8">
                            <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                                <CheckCircle className="h-8 w-8 text-green-600" />
                            </div>
                            <CardTitle className="text-2xl font-bold">Password Reset Complete!</CardTitle>
                            <CardDescription className="text-base">
                                Your password has been successfully updated. You can now log in with your new password.
                            </CardDescription>
                        </CardHeader>

                        <CardContent className="px-8 pb-6 space-y-3">
                            <Button className="w-full h-11" onClick={() => navigate("/login")}>
                                <LogIn className="mr-2 h-4 w-4" />
                                Login Now
                            </Button>
                            <Button variant="outline" className="w-full h-11" onClick={() => navigate("/")}>
                                <Home className="mr-2 h-4 w-4" />
                                Go to Dashboard
                            </Button>
                        </CardContent>
                    </Card>
                </div>
            </LandingLayout>
        );
    }

    // Reset password form
    return (
        <LandingLayout>
            <div className="min-h-[calc(100vh-3.5rem)] flex items-center justify-center p-4">
                <Card className="w-full max-w-md shadow-xl border-2">
                    <CardHeader className="space-y-2 px-8 pt-8">
                        <div className="flex items-center justify-between">
                            <CardTitle className="text-2xl font-bold">Reset Password</CardTitle>
                            <Avatar className="h-10 w-10 rounded-xl">
                                <AvatarFallback className="bg-gradient-to-br from-gray-900 to-gray-700 text-white rounded-xl">
                                    <Star className="h-5 w-5" />
                                </AvatarFallback>
                            </Avatar>
                        </div>
                        <CardDescription>
                            Enter your new password for <strong>{userEmail}</strong>
                        </CardDescription>
                    </CardHeader>

                    <CardContent className="px-8 pb-6">
                        {error && (
                            <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200">
                                <p className="text-sm text-red-600">{error}</p>
                            </div>
                        )}

                        <form onSubmit={handleSubmit} className="space-y-5">
                            <div className="space-y-2">
                                <Label htmlFor="newPassword">New Password</Label>
                                <div className="relative">
                                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                                    <Input
                                        id="newPassword"
                                        type={showPassword ? "text" : "password"}
                                        placeholder="••••••••"
                                        value={newPassword}
                                        onChange={(e) => setNewPassword(e.target.value)}
                                        className="pl-10 pr-10"
                                        required
                                        disabled={loading}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
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
                                        type={showConfirmPassword ? "text" : "password"}
                                        placeholder="••••••••"
                                        value={confirmPassword}
                                        onChange={(e) => setConfirmPassword(e.target.value)}
                                        className="pl-10 pr-10"
                                        required
                                        disabled={loading}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                    >
                                        {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                    </button>
                                </div>
                            </div>

                            <Button type="submit" className="w-full h-11 text-base" disabled={loading}>
                                {loading ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Resetting...
                                    </>
                                ) : (
                                    "Reset Password"
                                )}
                            </Button>
                        </form>
                    </CardContent>

                    <CardFooter className="px-8 pb-8">
                        <Link
                            to="/login"
                            className="flex items-center text-sm text-gray-600 hover:text-gray-900 w-full justify-center"
                        >
                            <ArrowLeft className="mr-2 h-4 w-4" />
                            Back to Login
                        </Link>
                    </CardFooter>
                </Card>
            </div>
        </LandingLayout>
    );
}
