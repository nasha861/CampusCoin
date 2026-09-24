import { NavLink, Outlet } from 'react-router-dom';
import {
  Bell,
  BookMarked,
  Home,
  LayoutDashboard,
  Lightbulb,
  ListTree,
  PiggyBank,
  Receipt,
  Settings,
  Upload,
  UserCircle,
} from 'lucide-react';
import { STUDENT_ROUTES } from '@/constants/routes';
import { APP_NAME } from '@/constants/config';
import { useAuth } from '@/hooks/useAuth';
import { cn } from '@/utils/cn';

const navSections = [
  {
    items: [
      { to: STUDENT_ROUTES.dashboard, label: 'Dashboard', icon: LayoutDashboard },
      { to: STUDENT_ROUTES.transactions, label: 'Transactions', icon: Receipt },
      { to: STUDENT_ROUTES.categories, label: 'Categories', icon: ListTree },
      { to: STUDENT_ROUTES.budgets, label: 'Budgets', icon: PiggyBank },
    ],
  },
  {
    items: [
      { to: STUDENT_ROUTES.reports, label: 'Reports', icon: Home },
      { to: STUDENT_ROUTES.insights, label: 'Insights', icon: Lightbulb },
      { to: STUDENT_ROUTES.savingTips, label: 'Saving Tips', icon: PiggyBank },
      { to: STUDENT_ROUTES.bookmarks, label: 'Bookmarks', icon: BookMarked },
      { to: STUDENT_ROUTES.import, label: 'Import CSV', icon: Upload },
    ],
  },
];

export function StudentLayout() {
  const { user, logout } = useAuth();

  return (
    <div className="flex min-h-screen bg-gray-50">
      <aside className="flex w-64 flex-col border-r border-gray-200 bg-white">
        <div className="border-b border-gray-200 p-5 font-semibold text-gray-900">{APP_NAME}</div>
        <nav className="flex-1 space-y-6 overflow-y-auto p-4">
          {navSections.map((section, index) => (
            <div key={index} className="space-y-1">
              {section.items.map(({ to, label, icon: Icon }) => (
                <NavLink
                  key={to}
                  to={to}
                  className={({ isActive }) =>
                    cn(
                      'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100',
                      isActive && 'bg-brand-50 text-brand-700',
                    )
                  }
                >
                  <Icon className="h-4 w-4" />
                  {label}
                </NavLink>
              ))}
            </div>
          ))}
        </nav>
        <div className="border-t border-gray-200 p-4">
          <NavLink
            to={STUDENT_ROUTES.settings}
            className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100"
          >
            <Settings className="h-4 w-4" />
            Settings
          </NavLink>
          <button
            onClick={() => void logout()}
            className="mt-1 flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-sm font-medium text-gray-600 hover:bg-gray-100"
          >
            <UserCircle className="h-4 w-4" />
            Log out
          </button>
        </div>
      </aside>

      <div className="flex flex-1 flex-col">
        <header className="flex items-center justify-between border-b border-gray-200 bg-white px-6 py-4">
          <div className="text-sm text-gray-500">Welcome back{user ? `, ${user.fullName}` : ''}</div>
          <div className="flex items-center gap-4">
            <NavLink to={STUDENT_ROUTES.notifications} className="text-gray-500 hover:text-gray-900">
              <Bell className="h-5 w-5" />
            </NavLink>
            <NavLink to={STUDENT_ROUTES.profile} className="text-gray-500 hover:text-gray-900">
              <UserCircle className="h-5 w-5" />
            </NavLink>
          </div>
        </header>
        <main className="flex-1 p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
