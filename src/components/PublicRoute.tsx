import { useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import type { RootState, AppDispatch } from "../redux/store";
import { Navigate } from "react-router-dom";
import {
  refreshAccessToken,
  logout,
  fetchCsrfToken,
} from "../redux/slices/authSlice";
import { showLoader, hideLoader } from "@/redux/slices/loaderSlice";

export default function PublicRoute({ children }: { children: React.ReactNode }) {
  const dispatch = useDispatch<AppDispatch>();
  const accessToken = useSelector((state: RootState) => state.auth.accessToken);
  const isLoggedOut = useSelector((state: RootState) => state.auth.isLoggedOut);

  useEffect(() => {
    const initAuth = async () => {
      // Show global loader
      dispatch(
        showLoader({
          showLogo: true,
          showAppName: true,
          slogan: "Application is being ready...",
        })
      );

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
        // Hide loader with slight delay to avoid flash
        setTimeout(() => {
          dispatch(hideLoader());
        }, 400);
      }
    };

    initAuth();
  }, [accessToken, isLoggedOut, dispatch]);

  if (accessToken) {
    // already logged in → redirect away from login
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
}
