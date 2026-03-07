import { Routes, Route, Navigate } from "react-router-dom";

import LoginPage from "@/modules/auth/pages/LoginPage";
import ForgotPasswordPage from "@/modules/auth/pages/ForgotPasswordPage";
import ResetPasswordPage from "@/modules/auth/pages/ResetPasswordPage";
import DashboardPage from "@/modules/dashboard/pages/DashboardPage";
import UserLogsPage from "@/modules/settings/user-logs/pages/UserLogsPage";
import PermissionRoute from "@/components/PermissionRoute";
import PublicRoute from "@/components/PublicRoute";
import ProtectedRoute from "@/components/ProtectedRoute";
import AdminLayout from "@/layouts/AdminLayout";
import Unauthorized from "@/pages/Unauthorized";
import NotFound from "@/pages/NotFound";
import UsersPage from "@/modules/settings/users/pages/UsersPage";
import VerifyEmailPage from "@/modules/auth/pages/VerifyEmailPage";
import ChangePasswordPage from "@/modules/settings/users/pages/ChangePasswordPage";

import ProfileEditPage from "@/modules/settings/users/pages/ProfileEditPage";
import VerifyPasswordChangePage from "@/modules/settings/users/pages/VerifyPasswordChangePage";


export default function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/dashboard" replace />} />

      {/* Public routes */}
      <Route path="/login" element={<PublicRoute><LoginPage /></PublicRoute>} />
      <Route path="/forgot-password" element={<PublicRoute><ForgotPasswordPage /></PublicRoute>} />
      <Route path="/reset-password/:token" element={<PublicRoute><ResetPasswordPage /></PublicRoute>} />
      <Route
        path="/verify-email"
        element={
          <PublicRoute>
            <VerifyEmailPage />
          </PublicRoute>
        }
      />


      {/* Protected layout */}
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <AdminLayout />
          </ProtectedRoute>
        }
      >
        {/* Dashboard */}
        <Route
          path="dashboard"
          element={
            <PermissionRoute anyOf={["read-admin-dashboard"]}>
              <DashboardPage />
            </PermissionRoute>
          }
        />

        <Route
          path="settings/users"
          element={
            <PermissionRoute anyOf={["read-admin-dashboard"]}>
              <UsersPage />
            </PermissionRoute>
          }
        />
        <Route
          path="settings/profile"
          element={
            <PermissionRoute anyOf={["read-admin-dashboard"]}>
              <ProfileEditPage />
            </PermissionRoute>
          }
        />
        <Route
          path="settings/change-password"
          element={
            <PermissionRoute anyOf={["read-admin-dashboard"]}>
              <ChangePasswordPage />
            </PermissionRoute>
          }
        />

        <Route
          path="verify-password-change/:token"
          element={
            <PermissionRoute anyOf={["read-admin-dashboard"]}>
              <VerifyPasswordChangePage />
            </PermissionRoute>
          }
        />

        {/* User Logs */}
        <Route
          path="settings/user-logs"
          element={
            <PermissionRoute anyOf={["read-admin-dashboard"]}>
              <UserLogsPage />
            </PermissionRoute>
          }
        />
        <Route path="/unauthorized" element={<Unauthorized />} />
        <Route path="*" element={<NotFound />} />
      </Route>
      <Route path="/unauthorized" element={<Unauthorized />} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}
