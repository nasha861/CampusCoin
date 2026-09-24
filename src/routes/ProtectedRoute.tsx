import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { PUBLIC_ROUTES } from '@/constants/routes';
import { Spinner } from '@/components/common';

export function ProtectedRoute() {
  const { isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Spinner />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to={PUBLIC_ROUTES.login} state={{ from: location }} replace />;
  }

  return <Outlet />;
}
