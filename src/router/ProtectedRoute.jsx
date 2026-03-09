import { Navigate } from "react-router-dom";
import { useAuth, getDashboardPath } from "@/contexts/AuthContext";
import { Skeleton } from "@/components/ui/skeleton";

function LoadingScreen() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="space-y-4 w-full max-w-sm">
        <Skeleton className="h-8 w-48 mx-auto" />
        <Skeleton className="h-4 w-64 mx-auto" />
        <Skeleton className="h-2 w-32 mx-auto" />
      </div>
    </div>
  );
}

export default function ProtectedRoute({ children, allowedRoles }) {
  const { user, isAuthenticated, loading, mustChangePassword } = useAuth();

  if (loading) {
    return <LoadingScreen />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // Force onboarding before any other protected page
  if (mustChangePassword) {
    return <Navigate to="/onboarding" replace />;
  }

  // If allowedRoles specified, check if user has at least one
  if (allowedRoles && allowedRoles.length > 0) {
    const hasAccess = allowedRoles.some((role) => user.roles.includes(role));
    if (!hasAccess) {
      // Redirect to their own dashboard
      return <Navigate to={getDashboardPath(user.roles)} replace />;
    }
  }

  return children;
}
