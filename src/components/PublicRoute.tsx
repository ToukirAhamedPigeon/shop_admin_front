import { useEffect, useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import type { RootState, AppDispatch } from "../redux/store";
import { Navigate } from "react-router-dom";
import { refreshAccessToken, logout, fetchCsrfToken } from "../redux/slices/authSlice";

export default function PublicRoute({ children }: { children: React.ReactNode }) {
  const dispatch = useDispatch<AppDispatch>();
  const accessToken = useSelector((state: RootState) => state.auth.accessToken);
  const isLoggedOut = useSelector((state: RootState) => state.auth.isLoggedOut);

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initAuth = async () => {
      try {
        // 1. Always fetch CSRF first
        await dispatch(fetchCsrfToken());

        // 2. If no token in redux, try refreshing
        if (!accessToken && !isLoggedOut) {
          await dispatch(refreshAccessToken()).unwrap();
        }
      } catch (err) {
        dispatch(logout());
      } finally {
        setLoading(false);
      }
    };

    initAuth();
  }, [accessToken, isLoggedOut, dispatch]);

  if (loading) return <p>Loading...</p>;

  if (accessToken) {
    // already logged in → redirect away from login
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
}
