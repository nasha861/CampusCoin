import type { ButtonHTMLAttributes } from 'react';
import { cn } from '@/utils/cn';

type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  isLoading?: boolean;
}

const variantStyles: Record<ButtonVariant, string> = {
  primary: 'bg-brand-600 text-white hover:bg-brand-700',
  secondary: 'bg-gray-100 text-gray-900 hover:bg-gray-200',
  outline: 'border border-gray-300 text-gray-900 hover:bg-gray-50',
  ghost: 'text-gray-700 hover:bg-gray-100',
  danger: 'bg-red-600 text-white hover:bg-red-700',
};

const sizeStyles: Record<ButtonSize, string> = {
  sm: 'px-3 py-1.5 text-sm',
  md: 'px-4 py-2 text-sm',
  lg: 'px-5 py-2.5 text-base',
};

export function Button({
  variant = 'primary',
  size = 'md',
  isLoading = false,
  disabled,
  className,
  children,
  ...props
}: ButtonProps) {
  return (
    <button
      className={cn(
        'inline-flex items-center justify-center gap-2 rounded-lg font-medium transition-colors',
        'disabled:cursor-not-allowed disabled:opacity-60',
        variantStyles[variant],
        sizeStyles[size],
        className,
      )}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading ? 'Loading…' : children}
    </button>
  );
}
