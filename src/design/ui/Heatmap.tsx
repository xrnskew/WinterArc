import type { HeatmapWeek } from '../../domain/heatmap';
import { cx } from '../../lib/cx';

interface HeatmapProps {
  weeks: HeatmapWeek[];
  /** Сегодня — клетка с белой рамкой. */
  today: string;
  /** Для скринридера: что это за карта и итог одной фразой. */
  label: string;
}

const ROW_LABELS = ['пн', '', 'ср', '', 'пт', '', ''];

/** Цвет клетки: 0 — тёмно-серая, 1 — белая, между ними — плавно. */
function cellColor(value: number): string {
  const percent = Math.round(value * 100);
  return `color-mix(in srgb, var(--wa-color-number) ${percent}%, var(--wa-color-gray-700))`;
}

/**
 * Тепловая карта в стиле GitHub: столбец — неделя, строка — день недели.
 * Пустая клетка (не по плану, в будущем) — только контур.
 */
export function Heatmap({ weeks, today, label }: HeatmapProps) {
  return (
    <div>
      <div className="flex gap-1.5" role="img" aria-label={label}>
        {/* Подписи дней недели слева. */}
        <div className="grid shrink-0 grid-rows-7 gap-[3px] text-xs leading-none text-muted">
          {ROW_LABELS.map((day, i) => (
            <span key={i} className="flex items-center">
              {day}
            </span>
          ))}
        </div>
        <div
          className="grid flex-1 grid-flow-col grid-rows-7 gap-[3px]"
          style={{ gridTemplateColumns: `repeat(${weeks.length}, minmax(0, 1fr))` }}
        >
          {weeks.flatMap((week) =>
            week.days.map((cell) => (
              <span
                key={cell.date}
                title={
                  cell.value === null ? undefined : `${cell.date}: ${Math.round(cell.value * 100)}%`
                }
                className={cx(
                  'aspect-square rounded-sm',
                  cell.value === null && 'border border-gray-800',
                  cell.date === today && 'outline-1 outline-offset-1 outline-number',
                )}
                style={cell.value === null ? undefined : { background: cellColor(cell.value) }}
              />
            )),
          )}
        </div>
      </div>

      {/* Шкала: что значит яркость клетки. */}
      <div
        className="mt-2 flex items-center justify-end gap-1.5 text-xs text-muted"
        aria-hidden="true"
      >
        0%
        {[0, 0.33, 0.66, 1].map((value) => (
          <span
            key={value}
            className="size-2.5 rounded-sm"
            style={{ background: cellColor(value) }}
          />
        ))}
        100%
      </div>
    </div>
  );
}
