import { useState, useEffect, useRef } from "react";
import { Link, useNavigate, Navigate } from "react-router-dom";
import { useGoogleLogin } from "@react-oauth/google";
import { useAuth, getDashboardPath } from "@/contexts/AuthContext";
import LandingLayout from "../../layouts/LandingLayout";
import { Button } from "@/components/ui/button";
import { FloatingInput } from "@/components/floating-input";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Eye, EyeOff, Mail, Lock, ArrowRight, Star, Loader2 } from "lucide-react";
import LandingImg from "../../assets/LandingPage_Home.png";

export default function LoginIndex() {
  const navigate = useNavigate();
  const { login, googleLoginWithToken, isAuthenticated, user } = useAuth();
  const savedCredentials = JSON.parse(localStorage.getItem("rememberedCredentials") || "null");
  const [email, setEmail] = useState(savedCredentials?.email || "");
  const [password, setPassword] = useState(savedCredentials?.password || "");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(!!savedCredentials);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState("");

  // Auto-dismiss error after 5 seconds
  useEffect(() => {
    if (!error) return;
    const timer = setTimeout(() => setError(""), 5000);
    return () => clearTimeout(timer);
  }, [error]);

  // If already logged in, redirect to dashboard
  if (isAuthenticated && user) {
    return <Navigate to={getDashboardPath(user.roles)} replace />;
  }

  const onSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const userData = await login(email, password, rememberMe);

      // Save or clear remembered credentials
      if (rememberMe) {
        localStorage.setItem("rememberedCredentials", JSON.stringify({ email, password }));
      } else {
        localStorage.removeItem("rememberedCredentials");
      }

      navigate(getDashboardPath(userData.roles), { replace: true });
    } catch (err) {
      setError(err.message || "Invalid email or password");
    } finally {
      setLoading(false);
    }
  };

  // Popup OAuth flow — works on both localhost and production
  const googlePopupLogin = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      setError("");
      setGoogleLoading(true);
      try {
        const userData = await googleLoginWithToken(tokenResponse.access_token);
        if (userData.isNewUser) {
          navigate("/register/welcome", { replace: true });
        } else {
          navigate(getDashboardPath(userData.roles), { replace: true });
        }
      } catch (err) {
        setError(err.message || "No account found for this Google email. Please contact your administrator.");
      } finally {
        setGoogleLoading(false);
      }
    },
    onError: () => {
      setGoogleLoading(false);
      setError("Google sign-in failed. Please try again.");
    },
  });

  return (
    <LandingLayout>
      <div className="min-h-[calc(100vh-3.5rem)] flex items-center justify-center p-4">
        <div className="w-full max-w-6xl grid lg:grid-cols-2 gap-8 items-center">
          {/* Left Side - Branding */}
          <div className="hidden lg:block space-y-6">
            <div className="space-y-3">
              <div className="flex items-center gap-2.5">
                <Avatar className="h-10 w-10 rounded-xl">
                  <AvatarFallback className="bg-gradient-to-br from-gray-900 to-gray-700 text-white rounded-xl">
                    <Star className="h-5 w-5" />
                  </AvatarFallback>
                </Avatar>
                <p className="text-xl font-bold text-gray-900">Teach. Learn. Grow.</p>
              </div>

              <div className="space-y-2">
                <h2 className="text-3xl font-bold text-gray-900 leading-tight">
                  Book tutoring sessions and manage your schedule
                </h2>
                <p className="text-gray-500 text-base">
                  Access your dashboard, schedule sessions, and stay organized.
                </p>
              </div>
            </div>

            <Card className="border shadow-lg overflow-hidden">
              <CardContent className="p-0">
                <img
                  src={LandingImg}
                  alt="Tutor and student illustration"
                  className="w-full h-auto object-cover"
                />
              </CardContent>
            </Card>
          </div>

          {/* Right Side - Login Form */}
          <Card className="w-full max-w-md lg:max-w-lg mx-auto shadow-lg border border-gray-100 flex flex-col justify-center">
            <CardHeader className="space-y-2 px-8 pt-8">
              <CardTitle className="text-2xl font-bold text-gray-900">Sign In</CardTitle>
              <CardDescription className="text-gray-500">
                Enter your credentials to access your account
              </CardDescription>
            </CardHeader>

            <CardContent className="px-8 pb-6">
              {/* Error message - always takes space to prevent layout shift */}
              <div className={`mb-4 p-3 rounded-lg bg-red-50 border border-red-200 transition-opacity duration-300 ${error ? "opacity-100" : "opacity-0 pointer-events-none"}`}>
                <p className="text-sm text-red-600">{error || "\u00A0"}</p>
              </div>

              <form onSubmit={onSubmit} className="space-y-5">
                <FloatingInput
                  id="email"
                  type="email"
                  label="Email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  icon={<Mail className="h-4 w-4" />}
                  required
                  disabled={loading}
                />

                <div className="space-y-1">
                  <div className="relative">
                    <FloatingInput
                      id="password"
                      type={showPassword ? "text" : "password"}
                      label="Password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      icon={<Lock className="h-4 w-4" />}
                      required
                      disabled={loading}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 transition-colors z-10"
                      tabIndex={-1}
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                  <Link to="/email-verification" className="text-xs text-gray-500 hover:text-gray-700 transition-colors inline-block">
                    Forgot password?
                  </Link>
                </div>

                <div className="flex items-center space-x-2 pt-1">
                  <Checkbox
                    id="remember"
                    checked={rememberMe}
                    onCheckedChange={setRememberMe}
                  />
                  <label
                    htmlFor="remember"
                    className="text-sm text-gray-700 cursor-pointer select-none"
                  >
                    Remember me
                  </label>
                </div>

                <Button type="submit" className="w-full group h-12 text-base font-semibold shadow-md hover:shadow-lg transition-all" disabled={loading}>
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Signing in...
                    </>
                  ) : (
                    <>
                      Sign In
                      <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                    </>
                  )}
                </Button>
              </form>

              <div className="relative my-6">
                <div className="absolute inset-0 flex items-center">
                  <Separator className="bg-gray-200" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-white px-4 text-gray-400 font-medium tracking-wide">
                    Or continue with
                  </span>
                </div>
              </div>

              <div className="w-full">
                <Button
                  type="button"
                  variant="outline"
                  className="w-full h-12 text-base font-medium border-gray-300 hover:bg-gray-50 transition-all"
                  onClick={() => googlePopupLogin()}
                  disabled={googleLoading}
                >
                  {googleLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Signing in...
                    </>
                  ) : (
                    <>
                      <svg className="mr-2 h-5 w-5" viewBox="0 0 24 24">
                        <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
                        <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                        <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                        <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                      </svg>
                      Continue with Google
                    </>
                  )}
                </Button>
              </div>
            </CardContent>

            <CardFooter className="flex flex-col space-y-3 px-8 pb-8">
              <Separator className="bg-gray-200" />
              <p className="text-center text-sm text-gray-500">
                Don't have an account?{" "}
                <Link to="/register" className="font-semibold text-gray-900 hover:underline transition-colors">
                  Sign Up
                </Link>
              </p>
            </CardFooter>
          </Card>
        </div>
      </div>
    </LandingLayout>
  );
}
