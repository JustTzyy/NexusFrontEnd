import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import ProtectedRoute from "./ProtectedRoute";

import HomeIndex from "../pages/Home/Index";
import OnboardingIndex from "../pages/Onboarding/Index";
import LoginIndex from "../pages/Login/Index";
import RegisterIndex from "../pages/Register/Index";
import Confirmation from "../pages/Register/Confirmation";
import CreatePassword from "../pages/Register/Password";
import ProfileCompletion from "../pages/Register/Profile";
import WelcomeSetup from "../pages/Register/Welcome";
import EmailVerification from "../pages/Login/EmailVerification";
import ForgotPassword from "../pages/Login/ForgotPassword";

import PermissionIndex from "../pages/Permission/Index";
import PermissionView from "../pages/Permission/View";
import PermissionForm from "../pages/Permission/Form";
import PermissionArchive from "../pages/Permission/Archive";
import RoleIndex from "../pages/Role/Index";
import RoleView from "../pages/Role/View";
import RoleForm from "../pages/Role/Form";
import RoleArchive from "../pages/Role/Archive";
import UserIndex from "../pages/User/Index";
import UserView from "../pages/User/View";
import UserForm from "../pages/User/Form";
import UserArchive from "../pages/User/Archive";
import DashboardSuperAdmin from "../pages/Dashboard/DashboardSuperAdmin";
import DashboardAdmin from "../pages/Dashboard/DashboardAdmin";
import DashboardTeacher from "../pages/Dashboard/DashboardTeacher";
import DashboardLead from "../pages/Dashboard/DashboardLead";
import DashboardBuildingManager from "../pages/Dashboard/DashboardBuildingManager";

import AuditLogIndex from "../pages/AuditLog/Index";
import AuditLogView from "../pages/AuditLog/View";
import SessionLogsIndex from "../pages/SessionLogs/Index";
import SessionLogView from "../pages/SessionLogs/View";
import OperationLogIndex from "../pages/OperationLog/Index";
import OperationLogView from "../pages/OperationLog/View";
import ActivityLogIndex from "../pages/ActivityLog/Index";
import AuthLogIndex from "../pages/AuthLog/Index";
import SettingsIndex from "../pages/Setting/Index";
import SubjectsIndex from "../pages/Subject/Index";
import SubjectsArchive from "../pages/Subject/Archive";
import SubjectView from "../pages/Subject/View";
import SubjectForm from "../pages/Subject/Form";
import BuildingsIndex from "../pages/Building/Index";
import BuildingsArchive from "../pages/Building/Archive";
import BuildingView from "../pages/Building/View";
import BuildingForm from "../pages/Building/Form";
import RoomsIndex from "../pages/Room/Index";
import RoomsArchive from "../pages/Room/Archive";
import RoomView from "../pages/Room/View";
import RoomForm from "../pages/Room/Form";
import TutoringSessionsIndex from "../pages/TutoringSession/Index";
import TutoringSessionsArchive from "../pages/TutoringSession/Archive";
import TutoringSessionView from "../pages/TutoringSession/View";
import TutoringSessionForm from "../pages/TutoringSession/Form";
import BookSessionIndex from "../pages/BookSession/Index";
import BookRoomSelection from "../pages/BookSession/Room";
import BookSessionView from "../pages/BookSession/View";
import BookReservedIndex from "../pages/BookReserved/Index";
import BookReservedView from "../pages/BookReserved/View";
import BookRequestIndex from "../pages/BookRequest/Index";
import BookRequestForm from "../pages/BookRequest/Form";
import BookRequestView from "../pages/BookRequest/View";
import AvailableSessionsIndex from "../pages/AvailableSessions/Index";
import AvailableSessionsView from "../pages/AvailableSessions/View";
import MyEnrolledSessionsIndex from "../pages/AvailableSessions/MyEnrolled";

// Tutoring Scheduling System
import DepartmentIndex from "../pages/Department/Index";
import DepartmentForm from "../pages/Department/Form";
import DepartmentView from "../pages/Department/View";
import DepartmentArchive from "../pages/Department/Archive";
import AvailableDayIndex from "../pages/AvailableDay/Index";
import AvailableDayForm from "../pages/AvailableDay/Form";
import AvailableDayView from "../pages/AvailableDay/View";
import AvailableDayArchive from "../pages/AvailableDay/Archive";
import AvailableTimeSlotIndex from "../pages/AvailableTimeSlot/Index";
import AvailableTimeSlotForm from "../pages/AvailableTimeSlot/Form";
import AvailableTimeSlotView from "../pages/AvailableTimeSlot/View";
import AvailableTimeSlotArchive from "../pages/AvailableTimeSlot/Archive";
import TeacherAssignmentIndex from "../pages/TeacherAssignment/Index";
import TeacherAssignmentForm from "../pages/TeacherAssignment/Form";
import TeacherAssignmentView from "../pages/TeacherAssignment/View";
import TeacherAssignmentArchive from "../pages/TeacherAssignment/Archive";
import TeacherInterestIndex from "../pages/TeacherInterest/Index";
import TeacherInterestView from "../pages/TeacherInterest/View";
import MyInterests from "../pages/TeacherInterest/MyInterests";
import TeacherScheduleIndex from "../pages/TeacherSchedule/Index";
import StudentScheduleIndex from "../pages/StudentSchedule/Index";
import AdminSchedulingIndex from "../pages/AdminScheduling/Index";
import AdminSchedulingView from "../pages/AdminScheduling/View";
import AdminSchedulingForm from "../pages/AdminScheduling/Form";
import AdminSchedulingSchedule from "../pages/AdminScheduling/Schedule";
import AdminRequestTracking from "../pages/AdminScheduling/Tracking";
import AdminRequestHistory from "../pages/AdminRequestLog/Index";
import AdminRequestHistoryView from "../pages/AdminRequestLog/View";
import ScheduleConfigurationIndex from "../pages/ScheduleConfiguration/Index";
import ScheduleConfigurationConfigure from "../pages/ScheduleConfiguration/Configure";
import ScheduleConfigurationSchedule from "../pages/ScheduleConfiguration/Schedule";
import StudentRequestTracking from "../pages/ScheduleConfiguration/Tracking";
import StudentRequestHistory from "../pages/StudentRequestLog/Index";
import StudentRequestHistoryView from "../pages/StudentRequestLog/View";
import ClientLogIndex from "../pages/ClientLog/Index";
import ClientLogView from "../pages/ClientLog/View";

// Building Manager pages
import MyBuilding from "../pages/BuildingManager/MyBuilding";

// Marketing pages
import DashboardMarketing from "../pages/Dashboard/DashboardMarketingManager";
import DashboardMarketingStaff from "../pages/Dashboard/DashboardMarketingStaff";
import LeadsIndex from "../pages/Marketing/Leads/Index";
import LeadsForm from "../pages/Marketing/Leads/Form";
import LeadsView from "../pages/Marketing/Leads/View";
import LeadsArchive from "../pages/Marketing/Leads/Archive";
import CampaignsIndex from "../pages/Marketing/Campaigns/Index";
import CampaignsForm from "../pages/Marketing/Campaigns/Form";
import CampaignsView from "../pages/Marketing/Campaigns/View";
import CampaignsArchive from "../pages/Marketing/Campaigns/Archive";
import EmailTemplatesIndex from "../pages/Marketing/EmailTemplates/Index";
import EmailTemplatesForm from "../pages/Marketing/EmailTemplates/Form";
import EmailTemplatesView from "../pages/Marketing/EmailTemplates/View";
import EmailTemplatesArchive from "../pages/Marketing/EmailTemplates/Archive";
import SegmentsIndex from "../pages/Marketing/Segments/Index";
import SegmentForm from "../pages/Marketing/Segments/Form";
import SegmentView from "../pages/Marketing/Segments/View";
import SegmentsArchive from "../pages/Marketing/Segments/Archive";
import AutomationRulesIndex from "../pages/Marketing/AutomationRules/Index";
import AutomationRulesArchive from "../pages/Marketing/AutomationRules/Archive";
import AutomationRuleForm from "../pages/Marketing/AutomationRules/Form";
import AutomationRuleView from "../pages/Marketing/AutomationRules/View";
import EmailMessagesIndex from "../pages/Marketing/EmailMessages/Index";
import EmailMessageView from "../pages/Marketing/EmailMessages/View";
import SuppressionsIndex from "../pages/Marketing/Suppressions/Index";
import SuppressionView from "../pages/Marketing/Suppressions/View";
import CustomersIndex from "../pages/Marketing/Customers/Index";
import CustomerView from "../pages/Marketing/Customers/View";
import MarketingAnalytics from "../pages/Marketing/Analytics/Index";
import MyRooms from "../pages/BuildingManager/MyRooms";
import MyRoomView from "../pages/BuildingManager/MyRoomView";
import BuildingSchedule from "../pages/BuildingManager/BuildingSchedule";
import BuildingScheduleView from "../pages/BuildingManager/BuildingScheduleView";
import TodaysSessions from "../pages/BuildingManager/TodaysSessions";
import FeedbackIndex from "../pages/Feedback/Index";
import FeedbackView from "../pages/Feedback/View";
import FeedbackForm from "../pages/Feedback/Form";

// Role constants for readability
const SUPER_ADMIN = "Super Admin";
const ADMIN = "Admin";
const MARKETING_MANAGER = "Marketing Manager";
const MARKETING_STAFF = "Marketing Staff";
const BUILDING_MANAGER = "Building Manager";
const TEACHER = "Teacher";
const CUSTOMER = "Customer";
const LEAD = "Lead";

const ALL_ADMIN_ROLES = [SUPER_ADMIN, ADMIN];
const ALL_STAFF_ROLES = [SUPER_ADMIN, ADMIN, MARKETING_MANAGER, MARKETING_STAFF, BUILDING_MANAGER, TEACHER];
const ALL_ROLES = [SUPER_ADMIN, ADMIN, MARKETING_MANAGER, MARKETING_STAFF, BUILDING_MANAGER, TEACHER, CUSTOMER, LEAD];

export default function AppRouter() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<HomeIndex />} />
          <Route path="/login" element={<LoginIndex />} />
          <Route path="/register" element={<RegisterIndex />} />
          <Route path="/register/confirmation" element={<Confirmation />} />
          <Route path="/register/password" element={<CreatePassword />} />
          <Route path="/register/profile" element={<ProfileCompletion />} />
          <Route path="/register/welcome" element={<WelcomeSetup />} />
          <Route path="/email-verification" element={<EmailVerification />} />
          <Route path="/forgot-password/:token" element={<ForgotPassword />} />
          <Route path="/onboarding" element={<OnboardingIndex />} />

          {/* Dashboard Routes - Role Based */}
          <Route path="/dashboardSuperAdmin" element={
            <ProtectedRoute allowedRoles={[SUPER_ADMIN]}>
              <DashboardSuperAdmin />
            </ProtectedRoute>
          } />
          <Route path="/dashboardTeacher" element={
            <ProtectedRoute allowedRoles={[TEACHER]}>
              <DashboardTeacher />
            </ProtectedRoute>
          } />
          <Route path="/dashboardLead" element={
            <ProtectedRoute allowedRoles={[LEAD, CUSTOMER]}>
              <DashboardLead />
            </ProtectedRoute>
          } />
          <Route path="/dashboardBuildingManager" element={
            <ProtectedRoute allowedRoles={[BUILDING_MANAGER]}>
              <DashboardBuildingManager />
            </ProtectedRoute>
          } />
          <Route path="/my-building" element={<ProtectedRoute allowedRoles={[BUILDING_MANAGER]}><MyBuilding /></ProtectedRoute>} />
          <Route path="/my-building/schedule" element={<ProtectedRoute allowedRoles={[BUILDING_MANAGER]}><BuildingSchedule /></ProtectedRoute>} />
          <Route path="/my-building/schedule/:id" element={<ProtectedRoute allowedRoles={[BUILDING_MANAGER]}><BuildingScheduleView /></ProtectedRoute>} />
          <Route path="/my-building/today" element={<ProtectedRoute allowedRoles={[BUILDING_MANAGER]}><TodaysSessions /></ProtectedRoute>} />
          <Route path="/my-rooms" element={<ProtectedRoute allowedRoles={[BUILDING_MANAGER]}><MyRooms /></ProtectedRoute>} />
          <Route path="/my-rooms/:id" element={<ProtectedRoute allowedRoles={[BUILDING_MANAGER]}><MyRoomView /></ProtectedRoute>} />

          {/* Admin Management Routes - Super Admin & Admin */}
          <Route path="/dashboardAdmin" element={
            <ProtectedRoute allowedRoles={[ADMIN]}>
              <DashboardAdmin />
            </ProtectedRoute>
          } />
          <Route path="/permissions" element={<ProtectedRoute allowedRoles={ALL_ADMIN_ROLES}><PermissionIndex /></ProtectedRoute>} />
          <Route path="/permissions/create" element={<ProtectedRoute allowedRoles={ALL_ADMIN_ROLES}><PermissionForm /></ProtectedRoute>} />
          <Route path="/permissions/archive" element={<ProtectedRoute allowedRoles={ALL_ADMIN_ROLES}><PermissionArchive /></ProtectedRoute>} />
          <Route path="/permissions/:id" element={<ProtectedRoute allowedRoles={ALL_ADMIN_ROLES}><PermissionView /></ProtectedRoute>} />
          <Route path="/permissions/:id/edit" element={<ProtectedRoute allowedRoles={ALL_ADMIN_ROLES}><PermissionForm /></ProtectedRoute>} />

          <Route path="/roles" element={<ProtectedRoute allowedRoles={ALL_ADMIN_ROLES}><RoleIndex /></ProtectedRoute>} />
          <Route path="/roles/create" element={<ProtectedRoute allowedRoles={ALL_ADMIN_ROLES}><RoleForm /></ProtectedRoute>} />
          <Route path="/roles/archive" element={<ProtectedRoute allowedRoles={ALL_ADMIN_ROLES}><RoleArchive /></ProtectedRoute>} />
          <Route path="/roles/:id" element={<ProtectedRoute allowedRoles={ALL_ADMIN_ROLES}><RoleView /></ProtectedRoute>} />
          <Route path="/roles/:id/edit" element={<ProtectedRoute allowedRoles={ALL_ADMIN_ROLES}><RoleForm /></ProtectedRoute>} />

          <Route path="/users" element={<ProtectedRoute allowedRoles={ALL_ADMIN_ROLES}><UserIndex /></ProtectedRoute>} />
          <Route path="/users/create" element={<ProtectedRoute allowedRoles={ALL_ADMIN_ROLES}><UserForm /></ProtectedRoute>} />
          <Route path="/users/archive" element={<ProtectedRoute allowedRoles={ALL_ADMIN_ROLES}><UserArchive /></ProtectedRoute>} />
          <Route path="/users/:id" element={<ProtectedRoute allowedRoles={ALL_ADMIN_ROLES}><UserView /></ProtectedRoute>} />
          <Route path="/users/:id/edit" element={<ProtectedRoute allowedRoles={ALL_ADMIN_ROLES}><UserForm /></ProtectedRoute>} />

          <Route path="/session-logs" element={<ProtectedRoute allowedRoles={[...ALL_ADMIN_ROLES, BUILDING_MANAGER]}><SessionLogsIndex /></ProtectedRoute>} />
          <Route path="/session-logs/:id" element={<ProtectedRoute allowedRoles={[...ALL_ADMIN_ROLES, BUILDING_MANAGER]}><SessionLogView /></ProtectedRoute>} />
          <Route path="/audit-logs" element={<ProtectedRoute allowedRoles={ALL_ADMIN_ROLES}><AuditLogIndex /></ProtectedRoute>} />
          <Route path="/audit-logs/:id" element={<ProtectedRoute allowedRoles={ALL_ADMIN_ROLES}><AuditLogView /></ProtectedRoute>} />
          <Route path="/operation-logs" element={<ProtectedRoute allowedRoles={ALL_ADMIN_ROLES}><OperationLogIndex /></ProtectedRoute>} />
          <Route path="/operation-logs/:id" element={<ProtectedRoute allowedRoles={ALL_ADMIN_ROLES}><OperationLogView /></ProtectedRoute>} />

          {/* Academic Management Routes - Admin only */}
          <Route path="/subjects" element={<ProtectedRoute allowedRoles={ALL_ADMIN_ROLES}><SubjectsIndex /></ProtectedRoute>} />
          <Route path="/subjects/create" element={<ProtectedRoute allowedRoles={ALL_ADMIN_ROLES}><SubjectForm /></ProtectedRoute>} />
          <Route path="/subjects/archive" element={<ProtectedRoute allowedRoles={ALL_ADMIN_ROLES}><SubjectsArchive /></ProtectedRoute>} />
          <Route path="/subjects/:id" element={<ProtectedRoute allowedRoles={ALL_ADMIN_ROLES}><SubjectView /></ProtectedRoute>} />
          <Route path="/subjects/:id/edit" element={<ProtectedRoute allowedRoles={ALL_ADMIN_ROLES}><SubjectForm /></ProtectedRoute>} />

          <Route path="/buildings" element={<ProtectedRoute allowedRoles={ALL_ADMIN_ROLES}><BuildingsIndex /></ProtectedRoute>} />
          <Route path="/buildings/create" element={<ProtectedRoute allowedRoles={ALL_ADMIN_ROLES}><BuildingForm /></ProtectedRoute>} />
          <Route path="/buildings/archive" element={<ProtectedRoute allowedRoles={ALL_ADMIN_ROLES}><BuildingsArchive /></ProtectedRoute>} />
          <Route path="/buildings/:id" element={<ProtectedRoute allowedRoles={ALL_ADMIN_ROLES}><BuildingView /></ProtectedRoute>} />
          <Route path="/buildings/:id/edit" element={<ProtectedRoute allowedRoles={ALL_ADMIN_ROLES}><BuildingForm /></ProtectedRoute>} />

          <Route path="/rooms" element={<ProtectedRoute allowedRoles={ALL_ADMIN_ROLES}><RoomsIndex /></ProtectedRoute>} />
          <Route path="/rooms/archive" element={<ProtectedRoute allowedRoles={ALL_ADMIN_ROLES}><RoomsArchive /></ProtectedRoute>} />
          <Route path="/rooms/create" element={<ProtectedRoute allowedRoles={ALL_ADMIN_ROLES}><RoomForm /></ProtectedRoute>} />
          <Route path="/rooms/:id" element={<ProtectedRoute allowedRoles={ALL_ADMIN_ROLES}><RoomView /></ProtectedRoute>} />
          <Route path="/rooms/:id/edit" element={<ProtectedRoute allowedRoles={ALL_ADMIN_ROLES}><RoomForm /></ProtectedRoute>} />

          <Route path="/tutoring-sessions" element={<ProtectedRoute allowedRoles={ALL_ADMIN_ROLES}><TutoringSessionsIndex /></ProtectedRoute>} />
          <Route path="/tutoring-sessions/archive" element={<ProtectedRoute allowedRoles={ALL_ADMIN_ROLES}><TutoringSessionsArchive /></ProtectedRoute>} />
          <Route path="/tutoring-sessions/create" element={<ProtectedRoute allowedRoles={ALL_ADMIN_ROLES}><TutoringSessionForm /></ProtectedRoute>} />
          <Route path="/tutoring-sessions/:id" element={<ProtectedRoute allowedRoles={ALL_ADMIN_ROLES}><TutoringSessionView /></ProtectedRoute>} />
          <Route path="/tutoring-sessions/:id/edit" element={<ProtectedRoute allowedRoles={ALL_ADMIN_ROLES}><TutoringSessionForm /></ProtectedRoute>} />

          {/* Session Booking Routes - Any authenticated user */}
          <Route path="/settings" element={<ProtectedRoute allowedRoles={ALL_ROLES}><SettingsIndex /></ProtectedRoute>} />
          <Route path="/activity-logs" element={<ProtectedRoute allowedRoles={ALL_ROLES}><ActivityLogIndex /></ProtectedRoute>} />
          <Route path="/auth-logs" element={<ProtectedRoute allowedRoles={ALL_ROLES}><AuthLogIndex /></ProtectedRoute>} />
          <Route path="/book-session" element={<ProtectedRoute allowedRoles={ALL_ROLES}><BookSessionIndex /></ProtectedRoute>} />
          <Route path="/book-session/:id" element={<ProtectedRoute allowedRoles={ALL_ROLES}><BookRoomSelection /></ProtectedRoute>} />
          <Route path="/book-session/view/:sessionId" element={<ProtectedRoute allowedRoles={ALL_ROLES}><BookSessionView /></ProtectedRoute>} />
          <Route path="/book-reserved" element={<ProtectedRoute allowedRoles={ALL_ROLES}><BookReservedIndex /></ProtectedRoute>} />
          <Route path="/book-reserved/view/:id" element={<ProtectedRoute allowedRoles={ALL_ROLES}><BookReservedView /></ProtectedRoute>} />

          {/* Student Request Flow — Lead & Customer only */}
          <Route path="/book-request" element={<ProtectedRoute allowedRoles={[LEAD, CUSTOMER]}><BookRequestIndex /></ProtectedRoute>} />
          <Route path="/book-request/new" element={<ProtectedRoute allowedRoles={[LEAD, CUSTOMER]}><BookRequestForm /></ProtectedRoute>} />
          <Route path="/book-request/:requestId" element={<ProtectedRoute allowedRoles={[LEAD, CUSTOMER]}><BookRequestView /></ProtectedRoute>} />
          <Route path="/book-request/:requestId/edit" element={<ProtectedRoute allowedRoles={[LEAD, CUSTOMER]}><BookRequestForm /></ProtectedRoute>} />

          {/* Available Sessions - Student enrollment for admin-created requests */}
          <Route path="/available-sessions" element={<ProtectedRoute allowedRoles={ALL_ROLES}><AvailableSessionsIndex /></ProtectedRoute>} />
          <Route path="/available-sessions/:id" element={<ProtectedRoute allowedRoles={ALL_ROLES}><AvailableSessionsView /></ProtectedRoute>} />
          <Route path="/my-enrolled-sessions" element={<ProtectedRoute allowedRoles={[LEAD, CUSTOMER]}><MyEnrolledSessionsIndex /></ProtectedRoute>} />

          {/* Department CRUD - Admin only */}
          <Route path="/departments" element={<ProtectedRoute allowedRoles={ALL_ADMIN_ROLES}><DepartmentIndex /></ProtectedRoute>} />
          <Route path="/departments/create" element={<ProtectedRoute allowedRoles={ALL_ADMIN_ROLES}><DepartmentForm /></ProtectedRoute>} />
          <Route path="/departments/archive" element={<ProtectedRoute allowedRoles={ALL_ADMIN_ROLES}><DepartmentArchive /></ProtectedRoute>} />
          <Route path="/departments/:id" element={<ProtectedRoute allowedRoles={ALL_ADMIN_ROLES}><DepartmentView /></ProtectedRoute>} />
          <Route path="/departments/:id/edit" element={<ProtectedRoute allowedRoles={ALL_ADMIN_ROLES}><DepartmentForm /></ProtectedRoute>} />

          {/* Available Days CRUD - Admin only */}
          <Route path="/available-days" element={<ProtectedRoute allowedRoles={ALL_ADMIN_ROLES}><AvailableDayIndex /></ProtectedRoute>} />
          <Route path="/available-days/create" element={<ProtectedRoute allowedRoles={ALL_ADMIN_ROLES}><AvailableDayForm /></ProtectedRoute>} />
          <Route path="/available-days/archive" element={<ProtectedRoute allowedRoles={ALL_ADMIN_ROLES}><AvailableDayArchive /></ProtectedRoute>} />
          <Route path="/available-days/:id" element={<ProtectedRoute allowedRoles={ALL_ADMIN_ROLES}><AvailableDayView /></ProtectedRoute>} />
          <Route path="/available-days/:id/edit" element={<ProtectedRoute allowedRoles={ALL_ADMIN_ROLES}><AvailableDayForm /></ProtectedRoute>} />

          {/* Available Time Slots CRUD - Admin only */}
          <Route path="/available-time-slots" element={<ProtectedRoute allowedRoles={ALL_ADMIN_ROLES}><AvailableTimeSlotIndex /></ProtectedRoute>} />
          <Route path="/available-time-slots/create" element={<ProtectedRoute allowedRoles={ALL_ADMIN_ROLES}><AvailableTimeSlotForm /></ProtectedRoute>} />
          <Route path="/available-time-slots/archive" element={<ProtectedRoute allowedRoles={ALL_ADMIN_ROLES}><AvailableTimeSlotArchive /></ProtectedRoute>} />
          <Route path="/available-time-slots/:id" element={<ProtectedRoute allowedRoles={ALL_ADMIN_ROLES}><AvailableTimeSlotView /></ProtectedRoute>} />
          <Route path="/available-time-slots/:id/edit" element={<ProtectedRoute allowedRoles={ALL_ADMIN_ROLES}><AvailableTimeSlotForm /></ProtectedRoute>} />

          {/* Teacher Assignment - Admin only */}
          <Route path="/teacher-assignments" element={<ProtectedRoute allowedRoles={ALL_ADMIN_ROLES}><TeacherAssignmentIndex /></ProtectedRoute>} />
          <Route path="/teacher-assignments/create" element={<ProtectedRoute allowedRoles={ALL_ADMIN_ROLES}><TeacherAssignmentForm /></ProtectedRoute>} />
          <Route path="/teacher-assignments/archive" element={<ProtectedRoute allowedRoles={ALL_ADMIN_ROLES}><TeacherAssignmentArchive /></ProtectedRoute>} />
          <Route path="/teacher-assignments/:id" element={<ProtectedRoute allowedRoles={ALL_ADMIN_ROLES}><TeacherAssignmentView /></ProtectedRoute>} />
          <Route path="/teacher-assignments/:id/edit" element={<ProtectedRoute allowedRoles={ALL_ADMIN_ROLES}><TeacherAssignmentForm /></ProtectedRoute>} />

          {/* Teacher Interest - Teacher role */}
          <Route path="/student-requests" element={<ProtectedRoute allowedRoles={[TEACHER, ...ALL_ADMIN_ROLES]}><TeacherInterestIndex /></ProtectedRoute>} />
          <Route path="/admin-requests" element={<ProtectedRoute allowedRoles={[TEACHER, ...ALL_ADMIN_ROLES]}><TeacherInterestIndex isAdminCreated /></ProtectedRoute>} />
          <Route path="/teacher-interest" element={<ProtectedRoute allowedRoles={[TEACHER, ...ALL_ADMIN_ROLES]}><TeacherInterestIndex /></ProtectedRoute>} />
          <Route path="/teacher-interest/:requestId" element={<ProtectedRoute allowedRoles={[TEACHER, ...ALL_ADMIN_ROLES]}><TeacherInterestView /></ProtectedRoute>} />
          <Route path="/my-interests" element={<ProtectedRoute allowedRoles={[TEACHER]}><MyInterests /></ProtectedRoute>} />
          <Route path="/my-admin-schedules" element={<ProtectedRoute allowedRoles={[TEACHER]}><MyInterests isAdminCreated /></ProtectedRoute>} />
          <Route path="/my-schedule" element={<ProtectedRoute allowedRoles={[TEACHER]}><TeacherScheduleIndex /></ProtectedRoute>} />
          <Route path="/my-student-schedule" element={<ProtectedRoute allowedRoles={[LEAD, CUSTOMER]}><StudentScheduleIndex /></ProtectedRoute>} />

          {/* Admin Scheduling - Admin only */}
          <Route path="/admin-scheduling" element={<ProtectedRoute allowedRoles={ALL_ADMIN_ROLES}><AdminSchedulingIndex /></ProtectedRoute>} />
          <Route path="/admin-scheduling/create" element={<ProtectedRoute allowedRoles={ALL_ADMIN_ROLES}><AdminSchedulingForm /></ProtectedRoute>} />
          <Route path="/admin-scheduling/tracking" element={<ProtectedRoute allowedRoles={ALL_ADMIN_ROLES}><AdminRequestTracking /></ProtectedRoute>} />
          <Route path="/admin-scheduling/log" element={<ProtectedRoute allowedRoles={ALL_ADMIN_ROLES}><AdminRequestHistory /></ProtectedRoute>} />
          <Route path="/admin-scheduling/log/:id" element={<ProtectedRoute allowedRoles={ALL_ADMIN_ROLES}><AdminRequestHistoryView /></ProtectedRoute>} />
          <Route path="/admin-scheduling/:id" element={<ProtectedRoute allowedRoles={ALL_ADMIN_ROLES}><AdminSchedulingView /></ProtectedRoute>} />
          <Route path="/admin-scheduling/:id/schedule" element={<ProtectedRoute allowedRoles={ALL_ADMIN_ROLES}><AdminSchedulingSchedule /></ProtectedRoute>} />

          {/* Schedule Configuration - Admin only */}
          <Route path="/schedule-configuration" element={<ProtectedRoute allowedRoles={ALL_ADMIN_ROLES}><ScheduleConfigurationIndex /></ProtectedRoute>} />
          <Route path="/schedule-configuration/tracking" element={<ProtectedRoute allowedRoles={ALL_ADMIN_ROLES}><StudentRequestTracking /></ProtectedRoute>} />
          <Route path="/schedule-configuration/log" element={<ProtectedRoute allowedRoles={ALL_ADMIN_ROLES}><StudentRequestHistory /></ProtectedRoute>} />
          <Route path="/schedule-configuration/log/:id" element={<ProtectedRoute allowedRoles={ALL_ADMIN_ROLES}><StudentRequestHistoryView /></ProtectedRoute>} />
          <Route path="/schedule-configuration/:id" element={<ProtectedRoute allowedRoles={ALL_ADMIN_ROLES}><ScheduleConfigurationConfigure /></ProtectedRoute>} />
          <Route path="/schedule-configuration/:id/schedule" element={<ProtectedRoute allowedRoles={ALL_ADMIN_ROLES}><ScheduleConfigurationSchedule /></ProtectedRoute>} />

          {/* Client Log – Lead & Customer viewer – Admin only */}
          <Route path="/client-log" element={<ProtectedRoute allowedRoles={ALL_ADMIN_ROLES}><ClientLogIndex /></ProtectedRoute>} />
          <Route path="/client-log/:id" element={<ProtectedRoute allowedRoles={ALL_ADMIN_ROLES}><ClientLogView /></ProtectedRoute>} />

          {/* Marketing Dashboards */}
          <Route path="/dashboardMarketingManager" element={<ProtectedRoute allowedRoles={[MARKETING_MANAGER]}><DashboardMarketing /></ProtectedRoute>} />
          <Route path="/dashboardMarketingStaff" element={<ProtectedRoute allowedRoles={[MARKETING_STAFF]}><DashboardMarketingStaff /></ProtectedRoute>} />

          {/* Marketing – Leads */}
          <Route path="/marketing/leads" element={<ProtectedRoute allowedRoles={[MARKETING_MANAGER, MARKETING_STAFF, SUPER_ADMIN]}><LeadsIndex /></ProtectedRoute>} />
          <Route path="/marketing/leads/create" element={<ProtectedRoute allowedRoles={[MARKETING_MANAGER, MARKETING_STAFF, SUPER_ADMIN]}><LeadsForm /></ProtectedRoute>} />
          <Route path="/marketing/leads/archive" element={<ProtectedRoute allowedRoles={[MARKETING_MANAGER, MARKETING_STAFF, SUPER_ADMIN]}><LeadsArchive /></ProtectedRoute>} />
          <Route path="/marketing/leads/:id" element={<ProtectedRoute allowedRoles={[MARKETING_MANAGER, MARKETING_STAFF, SUPER_ADMIN]}><LeadsView /></ProtectedRoute>} />
          <Route path="/marketing/leads/:id/edit" element={<ProtectedRoute allowedRoles={[MARKETING_MANAGER, MARKETING_STAFF, SUPER_ADMIN]}><LeadsForm /></ProtectedRoute>} />

          {/* Marketing – Email Templates */}
          <Route path="/marketing/email-templates" element={<ProtectedRoute allowedRoles={[MARKETING_MANAGER, MARKETING_STAFF, SUPER_ADMIN]}><EmailTemplatesIndex /></ProtectedRoute>} />
          <Route path="/marketing/email-templates/create" element={<ProtectedRoute allowedRoles={[MARKETING_MANAGER,MARKETING_STAFF, SUPER_ADMIN]}><EmailTemplatesForm /></ProtectedRoute>} />
          <Route path="/marketing/email-templates/archive" element={<ProtectedRoute allowedRoles={[MARKETING_MANAGER, MARKETING_STAFF, SUPER_ADMIN]}><EmailTemplatesArchive /></ProtectedRoute>} />
          <Route path="/marketing/email-templates/:id/edit" element={<ProtectedRoute allowedRoles={[MARKETING_MANAGER, MARKETING_STAFF, SUPER_ADMIN]}><EmailTemplatesForm /></ProtectedRoute>} />
          <Route path="/marketing/email-templates/:id" element={<ProtectedRoute allowedRoles={[MARKETING_MANAGER, MARKETING_STAFF, SUPER_ADMIN]}><EmailTemplatesView /></ProtectedRoute>} />

          {/* Marketing – Segments */}
          <Route path="/marketing/segments" element={<ProtectedRoute allowedRoles={[MARKETING_MANAGER, MARKETING_STAFF, SUPER_ADMIN]}><SegmentsIndex /></ProtectedRoute>} />
          <Route path="/marketing/segments/create" element={<ProtectedRoute allowedRoles={[MARKETING_MANAGER,MARKETING_STAFF, SUPER_ADMIN]}><SegmentForm /></ProtectedRoute>} />
          <Route path="/marketing/segments/archive" element={<ProtectedRoute allowedRoles={[MARKETING_MANAGER, MARKETING_STAFF, SUPER_ADMIN]}><SegmentsArchive /></ProtectedRoute>} />
          <Route path="/marketing/segments/:id/edit" element={<ProtectedRoute allowedRoles={[MARKETING_MANAGER, MARKETING_STAFF, SUPER_ADMIN]}><SegmentForm /></ProtectedRoute>} />
          <Route path="/marketing/segments/:id" element={<ProtectedRoute allowedRoles={[MARKETING_MANAGER, MARKETING_STAFF, SUPER_ADMIN]}><SegmentView /></ProtectedRoute>} />

          {/* Marketing – Campaigns */}
          <Route path="/marketing/campaigns" element={<ProtectedRoute allowedRoles={[MARKETING_MANAGER, MARKETING_STAFF, SUPER_ADMIN]}><CampaignsIndex /></ProtectedRoute>} />
          <Route path="/marketing/campaigns/create" element={<ProtectedRoute allowedRoles={[MARKETING_MANAGER, MARKETING_STAFF, SUPER_ADMIN]}><CampaignsForm /></ProtectedRoute>} />
          <Route path="/marketing/campaigns/archive" element={<ProtectedRoute allowedRoles={[MARKETING_MANAGER, MARKETING_STAFF, SUPER_ADMIN]}><CampaignsArchive /></ProtectedRoute>} />
          <Route path="/marketing/campaigns/:id" element={<ProtectedRoute allowedRoles={[MARKETING_MANAGER, MARKETING_STAFF, SUPER_ADMIN]}><CampaignsView /></ProtectedRoute>} />
          <Route path="/marketing/campaigns/:id/edit" element={<ProtectedRoute allowedRoles={[MARKETING_MANAGER, MARKETING_STAFF, SUPER_ADMIN]}><CampaignsForm /></ProtectedRoute>} />

          {/* Marketing – Automation Rules */}
          <Route path="/marketing/automation-rules" element={<ProtectedRoute allowedRoles={[MARKETING_MANAGER,MARKETING_STAFF, SUPER_ADMIN]}><AutomationRulesIndex /></ProtectedRoute>} />
          <Route path="/marketing/automation-rules/create" element={<ProtectedRoute allowedRoles={[MARKETING_MANAGER, MARKETING_STAFF, SUPER_ADMIN]}><AutomationRuleForm /></ProtectedRoute>} />
          <Route path="/marketing/automation-rules/archive" element={<ProtectedRoute allowedRoles={[MARKETING_MANAGER,MARKETING_STAFF, SUPER_ADMIN]}><AutomationRulesArchive /></ProtectedRoute>} />
          <Route path="/marketing/automation-rules/:id/edit" element={<ProtectedRoute allowedRoles={[MARKETING_MANAGER, MARKETING_STAFF, SUPER_ADMIN]}><AutomationRuleForm /></ProtectedRoute>} />
          <Route path="/marketing/automation-rules/:id" element={<ProtectedRoute allowedRoles={[MARKETING_MANAGER, MARKETING_STAFF, SUPER_ADMIN]}><AutomationRuleView /></ProtectedRoute>} />

          {/* Marketing – Email Messages (read-only) */}
          <Route path="/marketing/email-messages" element={<ProtectedRoute allowedRoles={[MARKETING_MANAGER, MARKETING_STAFF, SUPER_ADMIN]}><EmailMessagesIndex /></ProtectedRoute>} />
          <Route path="/marketing/email-messages/:id" element={<ProtectedRoute allowedRoles={[MARKETING_MANAGER, MARKETING_STAFF, SUPER_ADMIN]}><EmailMessageView /></ProtectedRoute>} />

          {/* Marketing – Suppressions */}
          <Route path="/marketing/suppressions" element={<ProtectedRoute allowedRoles={[MARKETING_MANAGER, MARKETING_STAFF, SUPER_ADMIN]}><SuppressionsIndex /></ProtectedRoute>} />
          <Route path="/marketing/suppressions/:id" element={<ProtectedRoute allowedRoles={[MARKETING_MANAGER, MARKETING_STAFF, SUPER_ADMIN]}><SuppressionView /></ProtectedRoute>} />

          {/* Marketing – Customers */}
          <Route path="/marketing/customers" element={<ProtectedRoute allowedRoles={[MARKETING_MANAGER, MARKETING_STAFF, SUPER_ADMIN]}><CustomersIndex /></ProtectedRoute>} />
          <Route path="/marketing/customers/:id" element={<ProtectedRoute allowedRoles={[MARKETING_MANAGER, MARKETING_STAFF, SUPER_ADMIN]}><CustomerView /></ProtectedRoute>} />

          {/* Marketing – Analytics */}
          <Route path="/marketing/analytics" element={<ProtectedRoute allowedRoles={[MARKETING_MANAGER, MARKETING_STAFF, SUPER_ADMIN]}><MarketingAnalytics /></ProtectedRoute>} />

          {/* Feedback & Reviews */}
          <Route path="/feedback" element={<ProtectedRoute allowedRoles={[...ALL_ADMIN_ROLES, LEAD, CUSTOMER]}><FeedbackIndex /></ProtectedRoute>} />
          <Route path="/feedback/new" element={<ProtectedRoute allowedRoles={[LEAD, CUSTOMER]}><FeedbackForm /></ProtectedRoute>} />
          <Route path="/feedback/:id" element={<ProtectedRoute allowedRoles={[...ALL_ADMIN_ROLES, LEAD, CUSTOMER]}><FeedbackView /></ProtectedRoute>} />
          <Route path="/feedback/:id/edit" element={<ProtectedRoute allowedRoles={[LEAD, CUSTOMER]}><FeedbackForm /></ProtectedRoute>} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
