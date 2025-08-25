import { useEffect, useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import type { RootState, AppDispatch } from "../redux/store";
import { Navigate, useLocation } from "react-router-dom";
import { refreshAccessToken, logout, fetchCsrfToken } from "../redux/slices/authSlice";

export default function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const dispatch = useDispatch<AppDispatch>();
  const accessToken = useSelector((state: RootState) => state.auth.accessToken);
  const isLoggedOut = useSelector((state: RootState) => state.auth.isLoggedOut);

  const [loading, setLoading] = useState(true);
  const [csrfFetched, setCsrfFetched] = useState(false);

  const location = useLocation();

  // 1. Try refreshing token first
  useEffect(() => {
    const tryRefresh = async () => {
      if (!accessToken && !isLoggedOut) {
        try {
          await dispatch(refreshAccessToken()).unwrap();
        } catch (err) {
          dispatch(logout());
        }
      }
      setLoading(false);
    };

    tryRefresh();
  }, [accessToken, isLoggedOut, dispatch]);

  // 2. Fetch CSRF token before redirecting (only once)
  useEffect(() => {
    const fetchCsrf = async () => {
      if (!accessToken && !csrfFetched && !loading) {
        await dispatch(fetchCsrfToken());
        setCsrfFetched(true);
      }
    };
    fetchCsrf();
  }, [accessToken, csrfFetched, loading, dispatch]);

  // 3. Handle UI states
  if (loading) return <p>Loading...</p>;

  if (!accessToken) {
    // ✅ Only redirect once CSRF is fetched
    if (csrfFetched) {
      return <Navigate to="/login" replace />;
    }
    return <p>Preparing login...</p>;
  }
  else{
    if(location.pathname === "/login"){
      return <Navigate to="/dashboard" replace />;
    }
  }

  return <>{children}</>;
}
