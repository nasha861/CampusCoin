import { NavLink, Outlet } from 'react-router-dom';
import { BarChart3, LayoutDashboard, ListTree, Megaphone, ShieldCheck, Users } from 'lucide-react';
import { ADMIN_ROUTES } from '@/constants/routes';
import { useAuth } from '@/hooks/useAuth';
import { cn } from '@/utils/cn';

const navItems = [
  { to: ADMIN_ROUTES.dashboard, label: 'Overview', icon: LayoutDashboard },
  { to: ADMIN_ROUTES.users, label: 'Users', icon: Users },
  { to: ADMIN_ROUTES.categories, label: 'Categories', icon: ListTree },
  { to: ADMIN_ROUTES.announcements, label: 'Announcements & Tips', icon: Megaphone },
  { to: ADMIN_ROUTES.statistics, label: 'Statistics', icon: BarChart3 },
];

export function AdminLayout() {
  const { user, logout } = useAuth();

  return (
    <div className="flex min-h-screen bg-gray-50">
      <aside className="flex w-64 flex-col border-r border-gray-200 bg-gray-900 text-gray-200">
        <div className="flex items-center gap-2 border-b border-gray-800 p-5 font-semibold text-white">
          <ShieldCheck className="h-5 w-5 text-brand-400" />
          Admin Console
        </div>
        <nav className="flex-1 space-y-1 p-4">
          {navItems.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-gray-300 hover:bg-gray-800',
                  isActive && 'bg-gray-800 text-white',
                )
              }
            >
              <Icon className="h-4 w-4" />
              {label}
            </NavLink>
          ))}
        </nav>
        <div className="border-t border-gray-800 p-4">
          <button
            onClick={() => void logout()}
            className="w-full rounded-lg px-3 py-2 text-left text-sm font-medium text-gray-300 hover:bg-gray-800"
          >
            Log out
          </button>
        </div>
      </aside>

      <div className="flex flex-1 flex-col">
        <header className="flex items-center justify-between border-b border-gray-200 bg-white px-6 py-4">
          <div className="text-sm text-gray-500">Signed in as {user?.fullName ?? 'Administrator'}</div>
        </header>
        <main className="flex-1 p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
