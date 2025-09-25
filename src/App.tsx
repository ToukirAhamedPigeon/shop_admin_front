import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import LoginPage from "./pages/LoginPage";
import DashboardPage from "./pages/DashboardPage";
import PublicRoute from "./components/PublicRoute";
import ProtectedRoute from "./components/ProtectedRoute";
import RouteProgress from '@/components/module/admin/layout/RouteProgress';
import LoaderContainer from "@/components/custom/LoaderContainer"

export default function App() {
  return (
    <BrowserRouter>
      {/* Mount globally so it listens to ALL route changes */}
      <LoaderContainer />
      <RouteProgress color="#3b82f6" darkColor="#ffffff" />

      <Routes>
        <Route path="/" element={<Navigate to="/dashboard" replace />} />

        <Route
          path="/login"
          element={
            <PublicRoute>
              <LoginPage />
            </PublicRoute>
          }
        />

        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <DashboardPage />
            </ProtectedRoute>
          }
        />
      </Routes>
    </BrowserRouter>
  );
}
