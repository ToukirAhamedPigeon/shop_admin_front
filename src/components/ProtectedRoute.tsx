import type { ReactNode } from "react";
import { useSelector, useDispatch } from "react-redux";
import type { RootState, AppDispatch } from "../redux/store";
import { Navigate } from "react-router-dom";
import { refreshAccessToken } from "../redux/slices/authSlice";
import { useEffect, useState } from "react";

interface Props {
  children: ReactNode;
}

export default function ProtectedRoute({ children }: Props) {
  const dispatch = useDispatch<AppDispatch>();
  const accessToken = useSelector((state: RootState) => state.auth.accessToken);
  const refreshToken = useSelector((state: RootState) => state.auth.refreshToken);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const tryRefresh = async () => {
      if (!accessToken && refreshToken) {
        try {
          await dispatch(refreshAccessToken()).unwrap();
        } catch (err) {
          // refresh failed
        }
      }
      setLoading(false);
    };

    tryRefresh();
  }, [accessToken, refreshToken, dispatch]);

  if (loading) return <p>Loading...</p>; // or a spinner

  if (!accessToken) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}
