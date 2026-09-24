import { Construction } from 'lucide-react';

interface PageStubProps {
  title: string;
  description?: string;
}

/**
 * Placeholder rendered by routes that exist in the route table but don't
 * have real feature work behind them yet. Swap out per-page as each
 * feature is built; not meant to ship.
 */
export function PageStub({ title, description }: PageStubProps) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-gray-300 p-16 text-center">
      <Construction className="h-8 w-8 text-gray-400" />
      <h1 className="text-xl font-semibold text-gray-900">{title}</h1>
      <p className="max-w-md text-sm text-gray-500">
        {description ?? 'This screen is scaffolded and ready for feature implementation.'}
      </p>
    </div>
  );
}
