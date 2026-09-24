import { Link, Outlet } from 'react-router-dom';
import { Wallet } from 'lucide-react';
import { PUBLIC_ROUTES } from '@/constants/routes';
import { APP_NAME, APP_TAGLINE } from '@/constants/config';

export function AuthLayout() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-12">
      <div className="w-full max-w-md">
        <Link to={PUBLIC_ROUTES.home} className="mb-8 flex items-center justify-center gap-2 font-semibold text-gray-900">
          <Wallet className="h-6 w-6 text-brand-600" />
          <span>
            {APP_NAME} <span className="text-gray-400">· {APP_TAGLINE}</span>
          </span>
        </Link>
        <div className="rounded-xl border border-gray-200 bg-white p-8 shadow-sm">
          <Outlet />
        </div>
      </div>
    </div>
  );
}
