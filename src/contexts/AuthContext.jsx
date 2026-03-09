import { createContext, useContext, useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { authService } from "@/services/authService";

const AuthContext = createContext(null);

// Role-to-dashboard mapping
const ROLE_DASHBOARD_MAP = {
  "Super Admin": "/dashboardSuperAdmin",
  "Admin": "/dashboardAdmin",
  "Marketing Manager": "/dashboardMarketingManager",
  "Marketing Staff": "/dashboardMarketingStaff",
  "Building Manager": "/dashboardBuildingManager",
  "Teacher": "/dashboardTeacher",
  "Customer": "/dashboardLead",
  "Lead": "/dashboardLead",
};

export function getDashboardPath(roles) {
  if (!roles || roles.length === 0) return "/dashboardLead";
  for (const role of Object.keys(ROLE_DASHBOARD_MAP)) {
    if (roles.includes(role)) return ROLE_DASHBOARD_MAP[role];
  }
  return "/dashboardLead";
}

// Helpers to persist the mustChangePassword flag alongside the token
const MCP_KEY = "mustChangePassword";
const storeMustChangePassword = (value, rememberMe) => {
  if (rememberMe) {
    localStorage.setItem(MCP_KEY, value ? "1" : "0");
  } else {
    sessionStorage.setItem(MCP_KEY, value ? "1" : "0");
  }
};
const getStoredMustChangePassword = () => {
  const v = sessionStorage.getItem(MCP_KEY) ?? localStorage.getItem(MCP_KEY);
  return v === "1";
};
const clearStoredMustChangePassword = () => {
  sessionStorage.removeItem(MCP_KEY);
  localStorage.removeItem(MCP_KEY);
};

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [mustChangePassword, setMustChangePassword] = useState(false);

  // Helper to get the token from whichever storage it's in
  const getStoredToken = () => {
    return sessionStorage.getItem("accessToken") || localStorage.getItem("accessToken");
  };

  // Restore session on mount
  useEffect(() => {
    const restoreSession = async () => {
      const token = getStoredToken();
      if (!token) {
        setLoading(false);
        return;
      }

      try {
        const response = await authService.getMe();
        setUser({
          id: response.data.userId,
          fullName: response.data.fullName,
          email: response.data.email,
          roles: response.data.roles,
          permissions: response.data.permissions || [],
        });
        // Restore the flag from whichever storage holds the token
        setMustChangePassword(getStoredMustChangePassword());
      } catch {
        // Token expired or invalid
        localStorage.removeItem("accessToken");
        sessionStorage.removeItem("accessToken");
        clearStoredMustChangePassword();
      } finally {
        setLoading(false);
      }
    };

    restoreSession();
  }, []);

  const login = useCallback(async (email, password, rememberMe = false) => {
    const response = await authService.login(email, password, rememberMe);
    const data = response.data;

    // Store token based on Remember Me preference
    if (rememberMe) {
      localStorage.setItem("accessToken", data.token);
    } else {
      sessionStorage.setItem("accessToken", data.token);
    }

    const needsPasswordChange = !!data.isPasswordChangeRequired;
    storeMustChangePassword(needsPasswordChange, rememberMe);
    setMustChangePassword(needsPasswordChange);

    const userData = {
      id: data.userId,
      fullName: data.fullName,
      email: data.email,
      roles: data.roles,
      permissions: data.permissions || [],
    };

    setUser(userData);
    return { ...userData, mustChangePassword: needsPasswordChange };
  }, []);

  const googleLogin = useCallback(async (credential) => {
    const response = await authService.googleLogin(credential);
    const data = response.data;

    localStorage.setItem("accessToken", data.token);
    clearStoredMustChangePassword();
    setMustChangePassword(false);

    const userData = {
      id: data.userId,
      fullName: data.fullName,
      email: data.email,
      roles: data.roles,
      permissions: data.permissions || [],
    };

    setUser(userData);
    return userData;
  }, []);

  const googleLoginWithToken = useCallback(async (accessToken) => {
    const response = await authService.googleLoginWithToken(accessToken);
    const data = response.data;

    localStorage.setItem("accessToken", data.token);
    clearStoredMustChangePassword();
    setMustChangePassword(false);

    const userData = {
      id: data.userId,
      fullName: data.fullName,
      email: data.email,
      roles: data.roles,
      permissions: data.permissions || [],
      isNewUser: data.isNewUser ?? false,
    };

    setUser(userData);
    return userData;
  }, []);

  // Set user directly from a login/register response payload (avoids extra getMe call)
  const initUserFromData = useCallback((data) => {
    setUser({
      id: data.userId,
      fullName: data.fullName,
      email: data.email,
      roles: data.roles,
      permissions: data.permissions || [],
    });
  }, []);

  // Called after a successful forced password change during onboarding
  const markPasswordChanged = useCallback(() => {
    clearStoredMustChangePassword();
    setMustChangePassword(false);
  }, []);

  // Merge updated profile fields into the in-memory user state.
  // Use this after a successful profile save so the sidebar reflects changes
  // without requiring a logout. Do NOT call getMe() here — that endpoint reads
  // from the JWT claims which still contain the old name until re-login.
  const updateUserProfile = useCallback((fields) => {
    setUser(prev => prev ? { ...prev, ...fields } : prev);
  }, []);

  const logout = useCallback(async () => {
    try { await authService.logout(); } catch {}
    localStorage.removeItem("accessToken");
    sessionStorage.removeItem("accessToken");
    clearStoredMustChangePassword();
    setUser(null);
    setMustChangePassword(false);
  }, []);

  const hasRole = useCallback(
    (roleName) => {
      return user?.roles?.includes(roleName) ?? false;
    },
    [user]
  );

  const hasPermission = useCallback(
    (permissionName) => {
      return user?.permissions?.includes(permissionName) ?? false;
    },
    [user]
  );

  // Check if user has at least one permission for a given module
  const hasModuleAccess = useCallback(
    (moduleName) => {
      if (!user?.permissions) return false;
      return user.permissions.some((perm) =>
        perm.toLowerCase().includes(moduleName.toLowerCase())
      );
    },
    [user]
  );

  const value = {
    user,
    loading,
    isAuthenticated: !!user,
    mustChangePassword,
    login,
    googleLogin,
    googleLoginWithToken,
    initUserFromData,
    markPasswordChanged,
    updateUserProfile,
    logout,
    hasRole,
    hasPermission,
    hasModuleAccess,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
