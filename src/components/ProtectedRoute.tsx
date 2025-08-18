import type { ReactNode } from "react";
import { useSelector, useDispatch } from "react-redux";
import type { RootState, AppDispatch } from "../redux/store";
import { Navigate } from "react-router-dom";
import { refreshAccessToken, logout } from "../redux/slices/authSlice";
import { useEffect, useState } from "react";

interface Props {
  children: ReactNode;
}

export default function ProtectedRoute({ children }: Props) {
  const dispatch = useDispatch<AppDispatch>();
  const accessToken = useSelector((state: RootState) => state.auth.accessToken);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const tryRefresh = async () => {
      if (!accessToken) {
        try {
          // Attempt to get new access token from refresh token in HttpOnly cookie
          await dispatch(refreshAccessToken()).unwrap();
        } catch (err) {
          // Refresh failed, auto logout
          dispatch(logout());
        }
      }
      setLoading(false);
    };

    tryRefresh();
  }, [accessToken, dispatch]);

  // Show loading spinner while checking/refreshing token
  if (loading) return <p>Loading...</p>;

  // If accessToken still not available, redirect to login
  if (!accessToken) {
    return <Navigate to="/login" replace />;
  }

  // Render protected children
  return <>{children}</>;
}
