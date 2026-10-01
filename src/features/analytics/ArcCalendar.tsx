import type { CalendarDay, CalendarMonth } from '../../domain/analytics';
import { formatDayMonth } from '../../domain/dates';
import { heatColor } from '../../design/ui/heatColor';
import { HeatScale } from '../../design/ui/Heatmap';
import { cx } from '../../lib/cx';

const WEEKDAYS = ['пн', 'вт', 'ср', 'чт', 'пт', 'сб', 'вс'];

/** Что сказать о дне скринридеру и во всплывающей подсказке. */
function dayLabel(day: CalendarDay): string {
  const date = formatDayMonth(day.date);
  if (!day.inArc) return `${date}: вне арки`;
  if (day.status === 'future') return `${date}: впереди`;
  if (day.score === null) return `${date}: ничего не было запланировано`;
  return `${date}: индекс ${Math.round(day.score * 100)}${day.status === 'today' ? ', сегодня' : ''}`;
}

/**
 * Календарь арки по месяцам. Под каждым числом — черта-зарубка:
 * чем светлее, тем выше индекс дня. Сегодня — со свечением.
 */
export function ArcCalendar({ months }: { months: CalendarMonth[] }) {
  return (
    <div className="flex flex-col gap-6">
      {months.map((month) => (
        <table key={month.title} className="w-full table-fixed border-collapse">
          <caption className="mb-2 text-left text-base text-text">{month.title}</caption>
          <thead>
            <tr>
              {WEEKDAYS.map((weekday) => (
                <th key={weekday} scope="col" className="pb-1 text-xs font-normal text-muted">
                  {weekday}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {month.weeks.map((week, i) => (
              <tr key={i}>
                {week.map((day, j) => (
                  <td key={day?.date ?? `empty-${j}`} className="p-0">
                    {day && <DayCell day={day} />}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      ))}
      <div className="-mt-3 flex items-center justify-between gap-3">
        <p className="text-xs text-muted">Черта под числом — индекс дня</p>
        <HeatScale from="0" to="100" />
      </div>
    </div>
  );
}

function DayCell({ day }: { day: CalendarDay }) {
  const today = day.status === 'today';
  const scored = day.score !== null;
  return (
    <div className="flex h-11 flex-col items-center justify-center gap-1" title={dayLabel(day)}>
      <span
        aria-hidden="true"
        className={cx(
          'numeric text-sm leading-none',
          today ? 'font-medium text-number' : day.inArc ? 'text-text' : 'text-muted',
        )}
      >
        {day.day}
      </span>
      <span className="sr-only">{dayLabel(day)}</span>
      {day.inArc && (
        <span
          aria-hidden="true"
          className={cx(
            'w-5 rounded-sm',
            scored ? 'h-1' : 'h-px bg-gray-700',
            today && 'shadow-glow',
          )}
          style={scored ? { background: heatColor(day.score!) } : undefined}
        />
      )}
    </div>
  );
}
