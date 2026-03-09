import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import LandingLayout from "../../layouts/LandingLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Mail, ArrowLeft, Loader2, CheckCircle, Star } from "lucide-react";
import { authService } from "@/services/authService";

export default function EmailVerification() {
    const navigate = useNavigate();
    const [email, setEmail] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");
        setLoading(true);

        try {
            await authService.forgotPassword(email);
            setSuccess(true);
        } catch (err) {
            setError(err.response?.data?.message || "An error occurred. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    if (success) {
        return (
            <LandingLayout>
                <div className="min-h-[calc(100vh-3.5rem)] flex items-center justify-center p-4">
                    <Card className="w-full max-w-md shadow-xl border-2">
                        <CardHeader className="space-y-4 text-center px-8 pt-8">
                            <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                                <CheckCircle className="h-8 w-8 text-green-600" />
                            </div>
                            <CardTitle className="text-2xl font-bold">Check Your Email</CardTitle>
                            <CardDescription className="text-base">
                                We've sent a password reset link to <strong>{email}</strong>
                            </CardDescription>
                        </CardHeader>

                        <CardContent className="px-8 pb-6 space-y-4">
                            <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                                <p className="text-sm text-gray-600">
                                    <strong>Next steps:</strong>
                                </p>
                                <ol className="text-sm text-gray-600 list-decimal list-inside space-y-1">
                                    <li>Check your email inbox (and spam folder)</li>
                                    <li>Click the "Reset Password" button in the email</li>
                                    <li>Create a new password</li>
                                </ol>
                            </div>
                            <p className="text-xs text-gray-500 text-center">
                                The link will expire in 1 hour for security purposes.
                            </p>
                        </CardContent>

                        <CardFooter className="flex flex-col space-y-4 px-8 pb-8">
                            <Button variant="outline" className="w-full" onClick={() => navigate("/login")}>
                                <ArrowLeft className="mr-2 h-4 w-4" />
                                Back to Login
                            </Button>
                            <Button variant="ghost" className="w-full text-sm" onClick={() => setSuccess(false)}>
                                Didn't receive the email? Try again
                            </Button>
                        </CardFooter>
                    </Card>
                </div>
            </LandingLayout>
        );
    }

    return (
        <LandingLayout>
            <div className="min-h-[calc(100vh-3.5rem)] flex items-center justify-center p-4">
                <Card className="w-full max-w-md shadow-xl border-2">
                    <CardHeader className="space-y-2 px-8 pt-8">
                        <div className="flex items-center justify-between">
                            <CardTitle className="text-2xl font-bold">Forgot Password?</CardTitle>
                            <Avatar className="h-10 w-10 rounded-xl">
                                <AvatarFallback className="bg-gradient-to-br from-gray-900 to-gray-700 text-white rounded-xl">
                                    <Star className="h-5 w-5" />
                                </AvatarFallback>
                            </Avatar>
                        </div>
                        <CardDescription>
                            Enter your email address and we'll send you a link to reset your password.
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
                                <Label htmlFor="email">Email Address</Label>
                                <div className="relative">
                                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                                    <Input
                                        id="email"
                                        type="email"
                                        placeholder="user@email.com"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        className="pl-10"
                                        required
                                        disabled={loading}
                                    />
                                </div>
                            </div>

                            <Button type="submit" className="w-full h-11 text-base" disabled={loading}>
                                {loading ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Sending...
                                    </>
                                ) : (
                                    "Send Reset Link"
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
