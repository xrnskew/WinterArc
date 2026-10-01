import { formatDayMonth } from '../../../domain/dates';
import { toIndex, weekSummary } from '../../../domain/discipline';
import { cx } from '../../../lib/cx';
import type { WidgetProps } from './WidgetFrame';

const DAY_LABELS = ['пн', 'вт', 'ср', 'чт', 'пт', 'сб', 'вс'];

/** Цвет дня — та же шкала, что у зарубок: от серого к белому по индексу. */
function dayColor(score: number): string {
  return `color-mix(in srgb, var(--wa-color-number) ${Math.round(score * 100)}%, var(--wa-color-gray-600))`;
}

/** Семь дней недели: высота и яркость столбика — индекс дня. */
export function WeekWidget({ data, arc, today }: WidgetProps) {
  const week = weekSummary(data, arc, today);
  const label = week.days
    .map((day) => {
      const index = toIndex(day.score);
      return `${formatDayMonth(day.date)}: ${index === null ? 'нет данных' : index}`;
    })
    .join(', ');

  return (
    <div role="img" aria-label={`Индекс по дням: ${label}`}>
      <div className="flex h-14 items-end gap-1">
        {week.days.map((day) => (
          <span
            key={day.date}
            className={cx(
              'flex-1 rounded-t-sm',
              day.score === null && 'h-1 bg-gray-800',
              day.status === 'today' && 'shadow-glow',
            )}
            style={
              day.score === null
                ? undefined
                : { height: `${Math.max(day.score * 100, 8)}%`, background: dayColor(day.score) }
            }
          />
        ))}
      </div>
      <div className="mt-1.5 flex gap-1 text-center text-xs" aria-hidden="true">
        {week.days.map((day, i) => (
          <span
            key={day.date}
            className={cx('flex-1', day.status === 'today' ? 'text-number' : 'text-muted')}
          >
            {DAY_LABELS[i]}
          </span>
        ))}
      </div>
    </div>
  );
}
