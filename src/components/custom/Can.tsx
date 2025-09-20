import type { ReactNode } from 'react';
import { useSelector } from 'react-redux';
import type { RootState } from '@/redux/store'; // replace with your actual RootState path

interface CanProps {
  allOf?: string[];      // Permissions all of which must be present
  anyOf?: string[];      // Permissions any of which must be present
  children: ReactNode;   // React children to conditionally render
}

export const Can = ({ allOf = [], anyOf = [], children }: CanProps) => {
  // Get user permissions from auth slice
  const permissions: string[] = useSelector(
    (state: RootState) => state.auth.user?.Permissions || []
  );

  // Check if all required permissions (allOf) are included
  const all = allOf.every(p => permissions.includes(p));

  // Check if any of the permissions (anyOf) are included
  const any = anyOf.length ? anyOf.some(p => permissions.includes(p)) : true;

  // If 'allOf' is specified but not all present OR 'anyOf' is specified but none present, don't render
  if ((allOf.length && !all) || (anyOf.length && !any)) return null;

  return <>{children}</>;
};
