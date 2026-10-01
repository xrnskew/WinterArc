import { ChevronLeft, ChevronRight } from 'lucide-react';
import { addDays, daysBetween, formatDayLabel } from '../../domain/dates';
import type { DateKey } from '../../domain/types';

interface DaySwitcherProps {
  date: DateKey;
  today: DateKey;
  /** Первый и последний день, которые можно открыть. */
  min: DateKey;
  max: DateKey;
  onChange: (date: DateKey) => void;
}

const ARROW =
  'flex size-11 items-center justify-center rounded-md text-muted transition-colors duration-(--wa-motion-fast) hover:text-number disabled:pointer-events-none disabled:opacity-30';

/** ‹ Сегодня, 1 октября › — чтобы дозаполнить вчерашний день. */
export function DaySwitcher({ date, today, min, max, onChange }: DaySwitcherProps) {
  return (
    <div className="on-snow -mx-2 flex items-center justify-between">
      <button
        type="button"
        className={ARROW}
        onClick={() => onChange(addDays(date, -1))}
        disabled={daysBetween(min, date) <= 0}
        aria-label="Предыдущий день"
      >
        <ChevronLeft size={22} strokeWidth={1.5} aria-hidden="true" />
      </button>
      <p className="text-base text-text" aria-live="polite">
        {formatDayLabel(date, today)}
      </p>
      <button
        type="button"
        className={ARROW}
        onClick={() => onChange(addDays(date, 1))}
        disabled={daysBetween(date, max) <= 0}
        aria-label="Следующий день"
      >
        <ChevronRight size={22} strokeWidth={1.5} aria-hidden="true" />
      </button>
    </div>
  );
}
