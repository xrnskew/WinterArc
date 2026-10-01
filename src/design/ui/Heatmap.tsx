import { formatDayMonth } from '../../domain/dates';
import type { HeatmapWeek } from '../../domain/heatmap';
import { cx } from '../../lib/cx';
import { heatColor } from './heatColor';

interface HeatmapProps {
  weeks: HeatmapWeek[];
  /** Сегодня — клетка с белой рамкой. */
  today: string;
  /** Для скринридера: что это за карта и итог одной фразой. */
  label: string;
}

const ROW_LABELS = ['пн', '', 'ср', '', 'пт', '', ''];

/**
 * Тепловая карта в стиле GitHub: столбец — неделя, строка — день недели.
 * Пустая клетка (не по плану, в будущем) — только контур.
 */
export function Heatmap({ weeks, today, label }: HeatmapProps) {
  return (
    // На широком экране клетки не раздуваются: карта не шире 672px.
    <div className="max-w-2xl">
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
                  cell.value === null
                    ? undefined
                    : `${formatDayMonth(cell.date)}: ${Math.round(cell.value * 100)}%`
                }
                className={cx(
                  'aspect-square rounded-sm',
                  cell.value === null && 'border border-gray-800',
                  cell.date === today && 'outline-1 outline-offset-1 outline-number',
                )}
                style={cell.value === null ? undefined : { background: heatColor(cell.value) }}
              />
            )),
          )}
        </div>
      </div>

      <HeatScale from="0%" to="100%" />
    </div>
  );
}

/** Шкала яркости: что значат оттенки клеток и черт. */
export function HeatScale({ from, to }: { from: string; to: string }) {
  return (
    <div
      className="mt-2 flex items-center justify-end gap-1.5 text-xs text-muted"
      aria-hidden="true"
    >
      {from}
      {[0, 0.33, 0.66, 1].map((value) => (
        <span
          key={value}
          className="size-2.5 rounded-sm"
          style={{ background: heatColor(value) }}
        />
      ))}
      {to}
    </div>
  );
}
