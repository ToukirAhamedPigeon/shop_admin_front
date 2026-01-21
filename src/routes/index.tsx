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

export default function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/dashboard" replace />} />

      {/* Public routes */}
      <Route path="/login" element={<PublicRoute><LoginPage /></PublicRoute>} />
      <Route path="/forgot-password" element={<PublicRoute><ForgotPasswordPage /></PublicRoute>} />
      <Route path="/reset-password/:token" element={<PublicRoute><ResetPasswordPage /></PublicRoute>} />

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
