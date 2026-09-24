import { Link, NavLink, Outlet } from 'react-router-dom';
import { Wallet } from 'lucide-react';
import { PUBLIC_ROUTES } from '@/constants/routes';
import { APP_NAME } from '@/constants/config';

const navLinks = [
  { to: PUBLIC_ROUTES.about, label: 'About' },
  { to: PUBLIC_ROUTES.features, label: 'Features' },
  { to: PUBLIC_ROUTES.contact, label: 'Contact' },
];

export function PublicLayout() {
  return (
    <div className="flex min-h-screen flex-col">
      <header className="border-b border-gray-200 bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
          <Link to={PUBLIC_ROUTES.home} className="flex items-center gap-2 font-semibold text-gray-900">
            <Wallet className="h-6 w-6 text-brand-600" />
            {APP_NAME}
          </Link>
          <nav className="flex items-center gap-6 text-sm font-medium text-gray-600">
            {navLinks.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                className={({ isActive }) => (isActive ? 'text-brand-600' : 'hover:text-gray-900')}
              >
                {link.label}
              </NavLink>
            ))}
          </nav>
          <div className="flex items-center gap-3">
            <Link to={PUBLIC_ROUTES.login} className="text-sm font-medium text-gray-600 hover:text-gray-900">
              Log in
            </Link>
            <Link
              to={PUBLIC_ROUTES.register}
              className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700"
            >
              Get started
            </Link>
          </div>
        </div>
      </header>

      <main className="flex-1">
        <Outlet />
      </main>

      <footer className="border-t border-gray-200 bg-white py-6 text-center text-sm text-gray-500">
        &copy; {new Date().getFullYear()} {APP_NAME} — NextGen BudgetBee
      </footer>
    </div>
  );
}
