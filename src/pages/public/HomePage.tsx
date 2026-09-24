import { Link } from 'react-router-dom';
import { PUBLIC_ROUTES } from '@/constants/routes';
import { APP_NAME, APP_TAGLINE } from '@/constants/config';

export function HomePage() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-24 text-center">
      <p className="text-sm font-semibold uppercase tracking-wide text-brand-600">{APP_TAGLINE}</p>
      <h1 className="mt-3 text-4xl font-bold text-gray-900 sm:text-5xl">{APP_NAME}</h1>
      <p className="mx-auto mt-4 max-w-2xl text-lg text-gray-600">
        Budgeting built for student life: track spending, set monthly budgets, and get
        personalized saving tips — all in one place.
      </p>
      <div className="mt-8 flex justify-center gap-4">
        <Link
          to={PUBLIC_ROUTES.register}
          className="rounded-lg bg-brand-600 px-6 py-3 text-sm font-semibold text-white hover:bg-brand-700"
        >
          Create a free account
        </Link>
        <Link
          to={PUBLIC_ROUTES.features}
          className="rounded-lg border border-gray-300 px-6 py-3 text-sm font-semibold text-gray-700 hover:bg-gray-50"
        >
          See features
        </Link>
      </div>
    </div>
  );
}
