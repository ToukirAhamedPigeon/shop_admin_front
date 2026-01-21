// src/components/PermissionRoute.tsx
import { Navigate, useLocation } from "react-router-dom";
import { useSelector } from "react-redux";
import type { RootState } from "@/redux/store";

interface PermissionRouteProps {
  allOf?: string[];
  anyOf?: string[];
  children: React.ReactNode;
}

export default function PermissionRoute({
  allOf = [],
  anyOf = [],
  children,
}: PermissionRouteProps) {
  const location = useLocation();

  const permissions =
    useSelector((state: RootState) => state.auth.user?.permissions) || [];

  const hasAll = allOf.every((p) => permissions.includes(p));
  const hasAny = anyOf.length
    ? anyOf.some((p) => permissions.includes(p))
    : true;

  if ((allOf.length && !hasAll) || (anyOf.length && !hasAny)) {
    return (
      <Navigate
        to="/unauthorized"
        replace
        state={{ from: location }}
      />
    );
  }

  return <>{children}</>;
}
