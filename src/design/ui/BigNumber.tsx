import { useCountUp } from '../../hooks/useCountUp';
import { cx } from '../../lib/cx';

type Size = 'sm' | 'md' | 'lg' | 'xl';

interface BigNumberProps {
  value: number;
  size?: Size;
  /** Знаков после запятой. */
  decimals?: number;
  /** Пересчитать от нуля при первом показе. */
  fromZero?: boolean;
  className?: string;
}

const SIZES: Record<Size, string> = {
  sm: 'text-3xl',
  md: 'text-4xl',
  lg: 'text-5xl',
  xl: 'text-6xl',
};

/** Цифры-табло: белые, моноширинные, с анимацией пересчёта при изменении. */
export function BigNumber({
  value,
  size = 'lg',
  decimals = 0,
  fromZero,
  className,
}: BigNumberProps) {
  const shown = useCountUp(value, { fromZero });
  const text = shown.toLocaleString('ru-RU', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });

  return (
    <span className={cx('numeric font-medium text-number', SIZES[size], className)}>{text}</span>
  );
}
