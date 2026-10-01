import { Check } from 'lucide-react';
import { WEEKDAY_NAMES } from '../../domain/analytics';
import { formatDayMonth, weekdayOf } from '../../domain/dates';
import type { HabitWeekResult, WeekReviewSummary } from '../../domain/weeklyReview';
import { BigNumber } from '../../design/ui/BigNumber';
import { GlassCard } from '../../design/ui/GlassCard';
import { formatNumber } from '../../lib/formatNumber';
import { plural } from '../../lib/plural';

/** "из 7 дней", "из 3 раз", "из 150 мин". */
function targetText(result: HabitWeekResult): string {
  switch (result.unit) {
    case 'days':
      return `из ${result.target} ${plural(result.target, 'дня', 'дней', 'дней')}`;
    case 'times':
      return `из ${result.target} ${plural(result.target, 'раза', 'раз', 'раз')}`;
    case 'minutes':
      return `из ${result.target} мин`;
  }
}

/** "в среду, 7 октября" */
function dayText(date: string): string {
  const weekday = WEEKDAY_NAMES[weekdayOf(date) - 1];
  // «в среду», «в пятницу», «в субботу»; остальные не меняются.
  const accusative = weekday.endsWith('а') ? `${weekday.slice(0, -1)}у` : weekday;
  return `${weekday === 'вторник' ? 'во' : 'в'} ${accusative}, ${formatDayMonth(date)}`;
}

/** Автоматические итоги недели: индекс, привычки, лучший и худший день, оценки, дела. */
export function WeekSummaryCard({ summary }: { summary: WeekReviewSummary }) {
  const delta =
    summary.index !== null && summary.previousIndex !== null
      ? summary.index - summary.previousIndex
      : null;
  const extras = [
    summary.tasksDone > 0 &&
      `${summary.tasksDone} ${plural(summary.tasksDone, 'задача сделана', 'задачи сделаны', 'задач сделано')}`,
    summary.stepsDone > 0 &&
      `${summary.stepsDone} ${plural(summary.stepsDone, 'шаг к целям', 'шага к целям', 'шагов к целям')}`,
    summary.goalsReached > 0 &&
      `${summary.goalsReached} ${plural(summary.goalsReached, 'цель достигнута', 'цели достигнуты', 'целей достигнуто')}`,
  ].filter(Boolean);

  return (
    <GlassCard as="section" aria-label="Итоги недели" className="p-5">
      <div className="flex items-end justify-between gap-3">
        {summary.index === null ? (
          <p className="text-base text-text">Индекс появится после первых отметок.</p>
        ) : (
          <div className="shrink-0">
            <BigNumber value={summary.index} size="lg" />
            <p className="mt-1 text-sm text-muted">
              индекс недели{summary.status === 'current' && ', идёт'}
            </p>
          </div>
        )}
        {delta !== null && (
          <p className="pb-6 text-right text-sm text-muted">
            {delta === 0
              ? 'как неделей раньше'
              : `на ${Math.abs(delta)} ${delta > 0 ? 'выше' : 'ниже'}, чем неделей раньше`}
          </p>
        )}
      </div>

      {summary.habits.length > 0 && (
        <ul className="mt-4 divide-y divide-gray-800 border-t border-gray-800">
          {summary.habits.map((result) => {
            const met = result.target > 0 && result.done >= result.target;
            return (
              <li key={result.habit.id} className="flex items-center gap-3 py-2.5">
                <span
                  aria-hidden="true"
                  className={`flex size-5 shrink-0 items-center justify-center rounded-sm border ${met ? 'border-number bg-number text-night' : 'border-gray-600'}`}
                >
                  {met && <Check size={14} strokeWidth={3} />}
                </span>
                <span className="min-w-0 flex-1 truncate text-base text-text">
                  {result.habit.name}
                </span>
                <span className="shrink-0 text-sm text-muted">
                  <span className="numeric text-base text-number">{result.done}</span>{' '}
                  {targetText(result)}
                  <span className="sr-only">{met ? ', цель недели выполнена' : ''}</span>
                </span>
              </li>
            );
          })}
        </ul>
      )}

      {summary.bestDay && summary.worstDay && (
        <p className="mt-4 text-sm text-text">
          Лучше всего было {dayText(summary.bestDay.date)} (
          <span className="numeric">{summary.bestDay.index}</span>), тяжелее всего —{' '}
          {dayText(summary.worstDay.date)} (
          <span className="numeric">{summary.worstDay.index}</span>
          ).
        </p>
      )}

      {summary.ratings.some((rating) => rating.average !== null) && (
        <dl className="mt-4 grid grid-cols-3 gap-2 border-t border-gray-800 pt-4">
          {summary.ratings.map((rating) => (
            <div key={rating.scale.id} className="min-w-0">
              <dt className="truncate text-xs text-muted">{rating.scale.name}</dt>
              <dd>
                <span className="numeric text-2xl text-number">
                  {rating.average === null ? '—' : formatNumber(rating.average, 1)}
                </span>
                {rating.average !== null && rating.previousAverage !== null && (
                  <span className="block text-xs text-muted">
                    раньше{' '}
                    <span className="numeric">{formatNumber(rating.previousAverage, 1)}</span>
                  </span>
                )}
              </dd>
            </div>
          ))}
        </dl>
      )}

      {extras.length > 0 && (
        <p className="mt-4 text-sm text-muted">За неделю: {extras.join(', ')}.</p>
      )}
    </GlassCard>
  );
}
