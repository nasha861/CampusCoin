import type { HTMLAttributes } from 'react';
import { cn } from '@/utils/cn';

export function Card({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn('rounded-xl border border-gray-200 bg-white p-5 shadow-sm', className)}
      {...props}
    />
  );
}
