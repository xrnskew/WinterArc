import { cx } from '../../lib/cx';

interface ProgressBarProps {
  /** 0…1 */
  value: number;
  /** Что измеряем — для скринридера. */
  label: string;
  className?: string;
}

/** Тонкая полоса: заполняется белым с лёгким свечением. */
export function ProgressBar({ value, label, className }: ProgressBarProps) {
  const percent = Math.round(Math.min(Math.max(value, 0), 1) * 100);

  return (
    <div
      role="progressbar"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={percent}
      className={cx('h-1 w-full overflow-hidden rounded-sm bg-gray-800', className)}
    >
      <div
        className="h-full rounded-sm bg-number shadow-glow transition-[width] duration-(--wa-motion-slow) ease-out-expo"
        style={{ width: `${percent}%` }}
      />
    </div>
  );
}
