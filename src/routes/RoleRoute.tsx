import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { STUDENT_ROUTES } from '@/constants/routes';
import { Spinner } from '@/components/common';
import type { UserRole } from '@/types/user';

/**
 * Gates a route subtree to specific roles. Must be nested under
 * ProtectedRoute so `user` is guaranteed once loading finishes.
 */
export function RoleRoute({ allow }: { allow: UserRole[] }) {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Spinner />
      </div>
    );
  }

  if (!user || !allow.includes(user.role)) {
    return <Navigate to={STUDENT_ROUTES.dashboard} replace />;
  }

  return <Outlet />;
}
