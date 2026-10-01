import type { ButtonHTMLAttributes } from 'react';
import { cx } from '../../lib/cx';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger';
type Size = 'md' | 'lg';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
}

const VARIANTS: Record<Variant, string> = {
  // Главное действие экрана: белая кнопка на чёрном.
  primary: 'bg-number text-night hover:shadow-glow',
  secondary: 'glass text-text hover:border-gray-500',
  ghost: 'text-muted hover:text-text',
  danger: 'border border-danger text-danger-text hover:bg-danger-soft',
};

const SIZES: Record<Size, string> = {
  md: 'h-11 px-4 text-sm',
  lg: 'h-12 px-5 text-base',
};

export function Button({
  variant = 'secondary',
  size = 'md',
  type = 'button',
  className,
  ...rest
}: ButtonProps) {
  return (
    <button
      type={type}
      className={cx(
        'inline-flex items-center justify-center gap-2 rounded-md font-medium',
        'transition-[box-shadow,background-color,border-color,color,transform] duration-(--wa-motion-fast) ease-out',
        'active:scale-[0.98] disabled:pointer-events-none disabled:opacity-40',
        VARIANTS[variant],
        SIZES[size],
        className,
      )}
      {...rest}
    />
  );
}
