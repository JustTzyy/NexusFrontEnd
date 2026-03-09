import { useEffect, useState, useMemo, useCallback, useRef } from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipTrigger, } from "@/components/ui/tooltip";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import NexUsLogo from "../assets/NexUs.png";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger, } from "@/components/ui/dropdown-menu";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Sidebar, SidebarContent, SidebarFooter, SidebarGroup, SidebarGroupContent, SidebarGroupLabel, SidebarHeader, SidebarInset, SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarMenuSkeleton, SidebarProvider, SidebarTrigger, } from "@/components/ui/sidebar";
import { LayoutDashboard, Key, Shield, Menu, Settings, LogOut, ChevronDown, Printer, Users, ClipboardList, BookOpen, Building2, DoorOpen, Calendar, CalendarDays, Sparkles, Bell, User, History, Timer, Activity, LogIn, GraduationCap, Hand, CalendarClock, Clock, Layers, ListChecks, Settings2, FileText, CheckCircle2, Megaphone, UserCheck, Mail, ShieldOff, Zap, Check, CheckCheck, Inbox, MessageSquare } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { notificationService } from "@/services/notificationService";

// Map routes to their required module names for permission checking
// Routes not in this map are always visible (e.g., dashboards, profile)
const ROUTE_MODULE_MAP = {
  // Core Security
  "/users": "Users",
  "/roles": "Roles",
  "/permissions": "Permissions",
  // Tutoring Setup
  "/buildings": "Buildings",
  "/departments": "Departments",
  "/subjects": "Subjects",
  "/rooms": "Rooms",
  "/available-days": "AvailableDays",
  "/available-time-slots": "AvailableTimeSlots",
  "/teacher-assignments": "TeacherAssignments",
  // Scheduling
  "/schedule-configuration": "TutoringRequests",
  "/admin-scheduling": "Scheduling",
  // Scheduling Tracking
  "/schedule-configuration/tracking": "TutoringRequests",
  "/admin-scheduling/tracking": "SchedulingTracking",
  // Lead Management
  "/marketing/leads": "Leads",
  "/marketing/customers": "Customers",
  // Campaigns
  "/marketing/campaigns": "Campaigns",
  "/marketing/email-templates": "EmailTemplates",
  "/marketing/segments": "Segments",
  "/marketing/automation-rules": "AutomationRules",
  // Reports
  "/audit-logs": "AuditLog",
  "/operation-logs": "OperationLog",
  "/session-logs": "SessionLogs",
  "/schedule-configuration/log": "StudentRequestLog",
  "/admin-scheduling/log": "AdminRequestLog",
  "/client-log": "ClientLog",
  "/marketing/email-messages": "EmailLogs",
  "/marketing/suppressions": "Suppressions",
};

// Role constants for nav filtering
const SUPER_ADMIN = "Super Admin";
const ADMIN = "Admin";
const MARKETING_MANAGER = "Marketing Manager";
const MARKETING_STAFF = "Marketing Staff";
const BUILDING_MANAGER = "Building Manager";
const TEACHER = "Teacher";
const CUSTOMER = "Customer";
const LEAD = "Lead";
const ADMIN_ROLES = [SUPER_ADMIN, ADMIN];
const MARKETING_ROLES = [MARKETING_MANAGER, MARKETING_STAFF];







const defaultNavGroups = [
  // Admin sections — always first so Super Admin sees them at the top
  {
    title: "Core Security & Access Control",
    allowedRoles: ADMIN_ROLES,
    items: [
      { to: "/dashboardSuperAdmin", label: "Dashboard", Icon: LayoutDashboard, allowedRoles: [SUPER_ADMIN] },
      { to: "/dashboardAdmin", label: "Dashboard", Icon: LayoutDashboard, allowedRoles: [ADMIN] },
      { to: "/users", label: "Users", Icon: Users },
      { to: "/roles", label: "Roles", Icon: Shield },
      { to: "/permissions", label: "Permissions", Icon: Key },
    ]
  },
  {
    title: "Tutoring Setup",
    allowedRoles: ADMIN_ROLES,
    items: [
      { to: "/departments", label: "Departments", Icon: Layers },
      { to: "/subjects", label: "Subjects", Icon: BookOpen },
      { to: "/buildings", label: "Buildings", Icon: Building2 },
      { to: "/rooms", label: "Rooms", Icon: DoorOpen },
      { to: "/available-days", label: "Available Days", Icon: Calendar },
      { to: "/available-time-slots", label: "Time Slots", Icon: Clock },
      { to: "/teacher-assignments", label: "Teacher Assignments", Icon: GraduationCap },
    ]
  },
  {
    title: "Scheduling",
    allowedRoles: ADMIN_ROLES,
    items: [
      { to: "/schedule-configuration", label: "Schedule Configuration", Icon: Settings2 },
      { to: "/admin-scheduling", label: "Admin Scheduling", Icon: CalendarClock },
    ]
  },
  {
    title: "Scheduling Tracking",
    allowedRoles: ADMIN_ROLES,
    items: [
      { to: "/schedule-configuration/tracking", label: "Student Request Tracking", Icon: ListChecks },
      { to: "/admin-scheduling/tracking", label: "Admin Request Tracking", Icon: History },
    ]
  },
  // Student/Lead Portal
  {
    title: "Learning Portal",
    allowedRoles: [LEAD, CUSTOMER],
    items: [
      { to: "/dashboardLead", label: "Dashboard", Icon: Sparkles },
      { to: "/my-student-schedule", label: "My Schedule", Icon: CalendarDays },
    ]
  },
  {
    title: "Sessions",
    allowedRoles: [LEAD, CUSTOMER],
    items: [
      { to: "/book-request", label: "My Requests", Icon: Timer },
      { to: "/available-sessions", label: "Available Sessions", Icon: ListChecks },
    ]
  },
  {
    title: "Enrolled Sessions",
    allowedRoles: [LEAD, CUSTOMER],
    items: [
      { to: "/my-enrolled-sessions", label: "My Enrolled Sessions", Icon: CheckCircle2 },
      { to: "/feedback", label: "Feedback & Reviews", Icon: MessageSquare },
    ]
  },
  // Teacher Portal
  {
    title: "Teacher Portal",
    allowedRoles: [TEACHER],
    items: [
      { to: "/dashboardTeacher", label: "Dashboard", Icon: LayoutDashboard },
      { to: "/my-schedule", label: "My Schedule", Icon: CalendarDays },
    ]
  },
  {
    title: "Student Requests",
    allowedRoles: [TEACHER],
    items: [
      { to: "/student-requests", label: "Student Requests", Icon: Hand },
      { to: "/my-interests", label: "Schedule Tracking", Icon: Clock },
    ]
  },
  {
    title: "Admin Requests",
    allowedRoles: [TEACHER],
    items: [
      { to: "/admin-requests", label: "Admin Requests", Icon: FileText },
      { to: "/my-admin-schedules", label: "Schedule Tracking", Icon: CalendarClock },
    ]
  },
  // Building Manager Portal
  {
    title: "Building Portal",
    allowedRoles: [BUILDING_MANAGER],
    items: [
      { to: "/dashboardBuildingManager", label: "Dashboard", Icon: LayoutDashboard },
      { to: "/my-building", label: "My Building", Icon: Building2 },
    ]
  },
  {
    title: "Rooms",
    allowedRoles: [BUILDING_MANAGER],
    items: [
      { to: "/my-rooms", label: "My Rooms", Icon: DoorOpen },
      { to: "/my-building/schedule", label: "Building Schedule", Icon: CalendarDays },
    ]
  },
  {
    title: "Sessions",
    allowedRoles: [BUILDING_MANAGER],
    items: [
      { to: "/my-building/today", label: "Today's Sessions", Icon: Timer },
    ]
  },
  {
    title: "Reports",
    allowedRoles: [BUILDING_MANAGER],
    items: [
      { to: "/session-logs", label: "Session Logs", Icon: ClipboardList },
    ]
  },
  // Marketing Portal
  {
    title: "Marketing Portal",
    allowedRoles: MARKETING_ROLES,
    items: [
      { to: "/dashboardMarketingManager", label: "Dashboard", Icon: LayoutDashboard, allowedRoles: [MARKETING_MANAGER] },
      { to: "/dashboardMarketingStaff", label: "Dashboard", Icon: LayoutDashboard, allowedRoles: [MARKETING_STAFF] },
    ]
  },
  {
    title: "Lead Management",
    allowedRoles: [...MARKETING_ROLES, SUPER_ADMIN],
    items: [
      { to: "/marketing/leads", label: "Leads", Icon: Users },
      { to: "/marketing/customers", label: "Customers", Icon: UserCheck },
    ]
  },
  {
    title: "Campaigns",
    allowedRoles: [...MARKETING_ROLES, SUPER_ADMIN],
    items: [
      { to: "/marketing/email-templates", label: "Email Templates", Icon: FileText },
      { to: "/marketing/segments", label: "Segments", Icon: Layers },
      { to: "/marketing/campaigns", label: "Campaigns", Icon: Megaphone },
      { to: "/marketing/automation-rules", label: "Automation Rules", Icon: Zap },
    ]
  },
  {
    title: "Reports",
    allowedRoles: [...ADMIN_ROLES, ...MARKETING_ROLES],
    items: [
      { to: "/session-logs", label: "Session Logs", Icon: ClipboardList, allowedRoles: ADMIN_ROLES },
      { to: "/audit-logs", label: "Audit Log", Icon: ClipboardList, allowedRoles: ADMIN_ROLES },
      { to: "/operation-logs", label: "Operation Log", Icon: Activity, allowedRoles: ADMIN_ROLES },
      { to: "/schedule-configuration/log", label: "Student Request Log", Icon: ClipboardList, allowedRoles: ADMIN_ROLES },
      { to: "/admin-scheduling/log", label: "Admin Request Log", Icon: ClipboardList, allowedRoles: ADMIN_ROLES },
      { to: "/client-log", label: "Client Log", Icon: Users, allowedRoles: ADMIN_ROLES },
      { to: "/feedback", label: "Feedback & Reviews", Icon: MessageSquare, allowedRoles: ADMIN_ROLES },
      { to: "/marketing/email-messages", label: "Email Logs", Icon: Mail, allowedRoles: [...MARKETING_ROLES, SUPER_ADMIN] },
      { to: "/marketing/suppressions", label: "Suppressions", Icon: ShieldOff, allowedRoles: [...MARKETING_ROLES, SUPER_ADMIN] },
    ]
  },
];


export default function AppLayout({
  title = "Dashboard",
  brand = { name: "NexUs", subtitle: "Tutoring Portal", mark: "LS" },
  navGroups = defaultNavGroups,
  onLogout,
  onPrint,
  isLoading = false,
  children,
}) {
  const navigate = useNavigate();
  const { user: authUser, hasModuleAccess, logout } = useAuth();

  // Notification state
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifLoading, setNotifLoading] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const notifPollingRef = useRef(null);

  const fetchUnreadCount = useCallback(async () => {
    try {
      const res = await notificationService.getUnreadCount();
      if (res?.success) setUnreadCount(res.data?.unreadCount ?? 0);
    } catch { /* silent */ }
  }, []);

  const fetchNotifications = useCallback(async () => {
    setNotifLoading(true);
    try {
      const res = await notificationService.getAll({ pageNumber: 1, pageSize: 50, sortBy: "CreatedAt", sortDescending: true });
      if (res?.success) setNotifications(res.data?.items ?? []);
    } catch { /* silent */ }
    setNotifLoading(false);
  }, []);

  // Poll unread count every 30s
  useEffect(() => {
    if (!authUser) return;
    fetchUnreadCount();
    notifPollingRef.current = setInterval(fetchUnreadCount, 30000);
    return () => clearInterval(notifPollingRef.current);
  }, [authUser, fetchUnreadCount]);

  // Fetch notifications when popover opens
  useEffect(() => {
    if (notifOpen) {
      fetchNotifications();
    }
  }, [notifOpen, fetchNotifications]);

  const handleMarkAsRead = async (id) => {
    try {
      await notificationService.markAsRead(id);
      setNotifications((prev) => prev.map((n) => n.id === id ? { ...n, status: "Read", readAt: new Date().toISOString() } : n));
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch { /* silent */ }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await notificationService.markAllAsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, status: "Read", readAt: new Date().toISOString() })));
      setUnreadCount(0);
    } catch { /* silent */ }
  };

  const formatTimeAgo = (dateStr) => {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return "Just now";
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    const days = Math.floor(hrs / 24);
    return `${days}d ago`;
  };

  const getTypeColor = (type) => {
    switch (type) {
      case "Tutoring": return "bg-blue-100 text-blue-700";
      case "Scheduling": return "bg-purple-100 text-purple-700";
      case "Marketing": return "bg-green-100 text-green-700";
      default: return "bg-gray-100 text-gray-700";
    }
  };

  const getPriorityIndicator = (priority) => {
    switch (priority) {
      case "Urgent": return "border-l-red-500";
      case "High": return "border-l-orange-500";
      default: return "border-l-transparent";
    }
  };

  // Get user display info from auth context
  const userDisplayInfo = useMemo(() => {
    if (!authUser) {
      return { name: "Loading...", initials: "?", email: "" };
    }
    const fullName = authUser.fullName || "User";
    const nameParts = fullName.split(" ").filter(Boolean);
    const initials = nameParts.length >= 2
      ? `${nameParts[0][0]}${nameParts[nameParts.length - 1][0]}`.toUpperCase()
      : fullName.substring(0, 2).toUpperCase();
    return {
      name: fullName,
      initials,
      email: authUser.email || "",
    };
  }, [authUser]);

  // Filter nav groups based on user roles and permissions
  const filteredNavGroups = useMemo(() => {
    const userRoles = authUser?.roles || [];
    return navGroups
      .filter((group) => {
        // If group has allowedRoles, check if user has at least one matching role
        if (group.allowedRoles) {
          return group.allowedRoles.some((role) => userRoles.includes(role));
        }
        return true;
      })
      .map((group) => ({
        ...group,
        items: group.items.filter((item) => {
          // Check item-level role restriction
          if (item.allowedRoles) {
            const hasRole = item.allowedRoles.some((role) => userRoles.includes(role));
            if (!hasRole) return false;
          }
          // Check module-level permission
          const moduleName = ROUTE_MODULE_MAP[item.to];
          if (!moduleName) return true;
          return hasModuleAccess(moduleName);
        }),
      }))
      .filter((group) => group.items.length > 0);
  }, [navGroups, hasModuleAccess, authUser]);

  useEffect(() => {
    document.documentElement.style.scrollBehavior = "smooth";

    const revealItems = document.querySelectorAll(".reveal-on-scroll");
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.15, rootMargin: "0px 0px -25% 0px" }
    );

    revealItems.forEach((item) => observer.observe(item));

    return () => {
      observer.disconnect();
      document.documentElement.style.scrollBehavior = "";
    };
  }, []);

  const [logoutDialogOpen, setLogoutDialogOpen] = useState(false);

  const handleLogout = async () => {
    if (typeof onLogout === "function") {
      await onLogout();
    } else {
      logout();
      navigate("/login");
    }
  };

  return (
    <SidebarProvider>
      <div className="flex h-screen w-full" style={{ "--sidebar-width": "14rem" }}>
        <Sidebar collapsible="icon" className="border-r-0">
          <SidebarHeader>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton size="lg" className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground">
                  <Avatar className="h-16 w-16 rounded-xl transition-all duration-200 group-data-[collapsible=icon]:h-8 group-data-[collapsible=icon]:w-8">
                    <AvatarImage src={NexUsLogo} alt="NexUs logo" />
                    <AvatarFallback className="bg-gray-900 text-white font-semibold text-sm rounded-xl">
                      NX
                    </AvatarFallback>
                  </Avatar>
                  <div className="grid flex-1 text-left text-sm leading-tight">
                    <span className="truncate font-semibold">{brand.name}</span>
                    <span className="truncate text-xs">{brand.subtitle}</span>
                  </div>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarHeader>

          <SidebarContent>
            {filteredNavGroups.map((group, idx) => (
              <SidebarGroup key={idx}>
                <SidebarGroupLabel className="px-2 uppercase text-[10px] font-bold text-gray-400">
                  {group.title}
                </SidebarGroupLabel>
                <SidebarGroupContent>
                  <SidebarMenu>
                    {isLoading ? (
                      <>
                        <SidebarMenuSkeleton showIcon />
                        <SidebarMenuSkeleton showIcon />
                      </>
                    ) : (
                      group.items.map(({ to, label, Icon }) => (
                        <SidebarMenuItem key={to}>
                          <NavLink to={to} end>
                            {({ isActive }) => (
                              <SidebarMenuButton
                                tooltip={label}
                                isActive={isActive}
                                className={isActive ? "bg-accent text-accent-foreground font-semibold" : ""}
                              >
                                <Icon className="w-4 h-4" />
                                <span>{label}</span>
                              </SidebarMenuButton>
                            )}
                          </NavLink>
                        </SidebarMenuItem>
                      ))
                    )}
                  </SidebarMenu>
                </SidebarGroupContent>
              </SidebarGroup>
            ))}
          </SidebarContent>

          <SidebarFooter>
            <SidebarMenu>
              <SidebarMenuItem>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <SidebarMenuButton size="lg">
                      <Avatar className="h-8 w-8 rounded-full">
                        <AvatarFallback className="bg-gray-200 text-gray-700 text-xs font-medium">
                          {userDisplayInfo.initials}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 text-left min-w-0">
                        <div className="truncate text-sm font-medium text-gray-900">
                          {userDisplayInfo.name}
                        </div>
                      </div>
                      <ChevronDown className="ml-auto" />
                    </SidebarMenuButton>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent side="top" align="end" className="w-56">
                    <DropdownMenuLabel>
                      <div className="flex flex-col space-y-1">
                        <p className="text-sm font-medium">{userDisplayInfo.name}</p>
                        <p className="text-xs text-gray-500">{userDisplayInfo.email}</p>
                      </div>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => navigate("/settings")}>
                      <Settings className="mr-2 h-4 w-4" />
                      Settings
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => navigate("/activity-logs")}>
                      <History className="mr-2 h-4 w-4" />
                      Activity Log
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => navigate("/auth-logs")}>
                      <LogIn className="mr-2 h-4 w-4" />
                      Login History
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => setLogoutDialogOpen(true)}>
                      <LogOut className="mr-2 h-4 w-4" />
                      Log out
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarFooter>
        </Sidebar>

        <AlertDialog open={logoutDialogOpen} onOpenChange={setLogoutDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Log out</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to log out? You will need to sign in again to access your account.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleLogout}>Log out</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        <SidebarInset className="rounded-tl-2xl rounded-bl-2xl overflow-hidden">
          <header className="flex h-12 shrink-0 items-center justify-between gap-2 px-4 bg-white">
            <div className="flex items-center gap-2">
              <SidebarTrigger className="-ml-1" />
              {isLoading ? (
                <Skeleton className="h-6 w-32" />
              ) : (
                <h1 className="text-base font-semibold text-gray-900">{title}</h1>
              )}
            </div>
            <div className="flex items-center gap-1">
              {onPrint && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="ghost" size="sm" onClick={onPrint}>
                      <Printer className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Print to PDF</TooltipContent>
                </Tooltip>
              )}

              {/* Notification Bell */}
              <Popover open={notifOpen} onOpenChange={setNotifOpen}>
                <PopoverTrigger asChild>
                  <Button variant="ghost" size="sm" className="relative">
                    <Bell className="h-4 w-4" />
                    {unreadCount > 0 && (
                      <Badge variant="destructive" className="absolute -top-1 -right-1 h-4 min-w-4 p-0 text-[10px] flex items-center justify-center rounded-full">
                        {unreadCount > 99 ? "99+" : unreadCount}
                      </Badge>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent align="end" className="w-96 p-0">
                  <div className="flex items-center justify-between px-4 py-3 border-b">
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-semibold">Notifications</h3>
                      {unreadCount > 0 && (
                        <Badge variant="secondary" className="text-[10px] h-5">
                          {unreadCount} new
                        </Badge>
                      )}
                    </div>
                    {unreadCount > 0 && (
                      <Button variant="ghost" size="sm" className="text-xs h-7 px-2" onClick={handleMarkAllAsRead}>
                        <CheckCheck className="h-3 w-3 mr-1" />
                        Mark all read
                      </Button>
                    )}
                  </div>
                  <ScrollArea className="h-[400px]">
                    {notifLoading ? (
                      <div className="p-4 space-y-3">
                        {[1, 2, 3].map((i) => (
                          <div key={i} className="flex gap-3">
                            <Skeleton className="h-8 w-8 rounded-full shrink-0" />
                            <div className="flex-1 space-y-1.5">
                              <Skeleton className="h-3 w-3/4" />
                              <Skeleton className="h-3 w-1/2" />
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : notifications.length === 0 ? (
                      <div className="flex flex-col items-center justify-center py-12 text-gray-400">
                        <Inbox className="h-10 w-10 mb-2" />
                        <p className="text-sm font-medium">No notifications</p>
                        <p className="text-xs">You're all caught up!</p>
                      </div>
                    ) : (
                      <div className="divide-y">
                        {notifications.map((notif) => (
                          <div
                            key={notif.id}
                            className={`flex gap-3 px-4 py-3 hover:bg-gray-50 transition-colors cursor-pointer border-l-2 ${
                              getPriorityIndicator(notif.priority)
                            } ${notif.status === "Unread" ? "bg-blue-50/50" : ""}`}
                            onClick={() => notif.status === "Unread" && handleMarkAsRead(notif.id)}
                          >
                            <div className={`h-8 w-8 rounded-full flex items-center justify-center shrink-0 ${getTypeColor(notif.type)}`}>
                              <Bell className="h-3.5 w-3.5" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-start justify-between gap-2">
                                <p className={`text-sm leading-tight ${notif.status === "Unread" ? "font-semibold text-gray-900" : "text-gray-700"}`}>
                                  {notif.title}
                                </p>
                                {notif.status === "Unread" && (
                                  <span className="h-2 w-2 rounded-full bg-blue-500 shrink-0 mt-1.5" />
                                )}
                              </div>
                              <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{notif.message}</p>
                              <div className="flex items-center gap-2 mt-1">
                                <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${getTypeColor(notif.type)}`}>
                                  {notif.type}
                                </span>
                                <span className="text-[10px] text-gray-400">{formatTimeAgo(notif.createdAt)}</span>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </ScrollArea>
                </PopoverContent>
              </Popover>
            </div>
          </header>

          <main className="flex-1 overflow-auto bg-white">
            <div className="p-6">{children ?? <Outlet />}</div>
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}
