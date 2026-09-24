import type { HTMLAttributes } from 'react';
import { cn } from '@/utils/cn';

type BadgeTone = 'neutral' | 'success' | 'warning' | 'danger';

const toneStyles: Record<BadgeTone, string> = {
  neutral: 'bg-gray-100 text-gray-700',
  success: 'bg-brand-100 text-brand-700',
  warning: 'bg-amber-100 text-amber-700',
  danger: 'bg-red-100 text-red-700',
};

export function Badge({
  tone = 'neutral',
  className,
  ...props
}: HTMLAttributes<HTMLSpanElement> & { tone?: BadgeTone }) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium',
        toneStyles[tone],
        className,
      )}
      {...props}
    />
  );
}
