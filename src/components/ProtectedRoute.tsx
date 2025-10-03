import { useEffect, useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import type { RootState, AppDispatch } from "../redux/store";
import { Navigate, useLocation } from "react-router-dom";
import { refreshAccessToken, logout, fetchCsrfToken } from "../redux/slices/authSlice";

export default function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const dispatch = useDispatch<AppDispatch>();
  const accessToken = useSelector((state: RootState) => state.auth.accessToken);
  const user = useSelector((state: RootState) => state.auth.user);
  const isLoggedOut = useSelector((state: RootState) => state.auth.isLoggedOut);

  const [loading, setLoading] = useState(true);
  const [hasCheckedAuth, setHasCheckedAuth] = useState(false);

  const location = useLocation();

  useEffect(() => {
    if (hasCheckedAuth) return; // ✅ prevent re-running

    const initAuth = async () => {
      try {
          if (!accessToken && !isLoggedOut) {
            await dispatch(refreshAccessToken()).unwrap();
          }
      } catch {
        dispatch(logout());
      } finally {
        setLoading(false);
        setHasCheckedAuth(true); // ✅ mark as checked
      }
    };

    initAuth();
  }, [hasCheckedAuth, accessToken, isLoggedOut, dispatch, user]);

  if (loading) return <p>Loading...</p>;

  if (!accessToken) return <Navigate to="/login" replace />;

  if (location.pathname === "/login" && (accessToken || user)) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
}
