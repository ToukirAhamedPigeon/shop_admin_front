import { useEffect, useState } from "react"; 
import { useSelector, useDispatch } from "react-redux"; 
import type { RootState, AppDispatch } from "../redux/store"; 
import { Navigate } from "react-router-dom"; 
import { refreshAccessToken, logout, fetchCsrfToken } from "../redux/slices/authSlice"; 
import { showLoader, hideLoader } from "@/redux/slices/loaderSlice"; 

export default function PublicRoute({ children }: { children: React.ReactNode }) { 
  const dispatch = useDispatch<AppDispatch>(); 

  const accessToken = useSelector((state: RootState) => state.auth.accessToken); 
  const user = useSelector((state: RootState) => state.auth.user); 
  const isLoggedOut = useSelector((state: RootState) => state.auth.isLoggedOut); 

  const [hasCheckedAuth, setHasCheckedAuth] = useState(false);

  useEffect(() => { 
    if (hasCheckedAuth) return; // ✅ prevent multiple calls

    const initAuth = async () => { 
      // Show global loader 
      dispatch(showLoader({  message: "Application is being ready...", })); 

      try { 
        // 1. Always fetch CSRF token first for Sanctum
        await dispatch(fetchCsrfToken()).unwrap(); 
        // 2. If no token in Redux and not logged out, try refreshing for JWT
        if (!accessToken && !isLoggedOut) {
          await dispatch(refreshAccessToken()).unwrap(); 
        }
      } catch {
        dispatch(logout()); 
      } finally {
        // Hide loader with slight delay to avoid flash 
        setTimeout(() => { dispatch(hideLoader()); }, 400); 
        setHasCheckedAuth(true); // ✅ mark auth as checked
      } 
    }; 

    initAuth(); 
  }, [
    hasCheckedAuth, 
    accessToken, 
    dispatch,
    isLoggedOut, 
    user
  ]); 

  // Redirect already authenticated users away from public pages
  if (accessToken) {
    return <Navigate to="/dashboard" replace />; 
  }

  return <>{children}</>; 
} 
