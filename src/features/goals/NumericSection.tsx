import { X } from 'lucide-react';
import { useId, useState } from 'react';
import { formatDayMonth } from '../../domain/dates';
import { goalProgress, numericCurrent, sortedEntries } from '../../domain/goals';
import type { DateKey, NumericGoal } from '../../domain/types';
import { BigNumber } from '../../design/ui/BigNumber';
import { Button } from '../../design/ui/Button';
import { GlassCard } from '../../design/ui/GlassCard';
import { ProgressBar } from '../../design/ui/ProgressBar';
import { Sheet } from '../../design/ui/Sheet';
import { Sparkline } from '../../design/ui/Sparkline';
import { formatNumber, formatSigned } from '../../lib/formatNumber';
import { useAppStore } from '../../store/useAppStore';
import { EntryForm } from './EntryForm';
import { decimalsOf, forecastText, formatValue, goalPercent, progressSeries } from './goalText';

interface NumericSectionProps {
  goal: NumericGoal;
  today: DateKey;
}

/** Числовая цель: где ты сейчас, прогноз по темпу, записи. */
export function NumericSection({ goal, today }: NumericSectionProps) {
  const id = useId();
  const addGoalEntry = useAppStore((state) => state.addGoalEntry);
  const removeGoalEntry = useAppStore((state) => state.removeGoalEntry);
  const [adding, setAdding] = useState(false);
  const [editing, setEditing] = useState(false);

  const add = goal.entryMode === 'add';
  const current = numericCurrent(goal);
  const forecast = forecastText(goal, today);
  const series = progressSeries(goal, today);
  // Верх графика — цель, низ — старт; для цели «вниз» наоборот.
  const [low, high] = [goal.startValue, goal.targetValue].sort((a, b) => a - b);
  // Новые записи — сверху.
  const entries = sortedEntries(goal).reverse();

  return (
    <>
      <GlassCard as="section" aria-label="Прогресс" className="p-5">
        <p>
          <BigNumber value={current} size="lg" decimals={decimalsOf(current)} />
          {goal.unit && <span className="ml-1.5 text-lg text-muted">{goal.unit}</span>}
        </p>
        {/* Процент — не рядом с числом: «150 000 ₽» и «50%» в одну строку на 360px не влезают. */}
        <div className="mt-1 flex items-baseline justify-between gap-3">
          <p className="text-sm text-muted">
            {add ? 'из' : 'цель'} {formatValue(goal.targetValue, goal.unit)}, старт{' '}
            {formatValue(goal.startValue, goal.unit)}
          </p>
          <p className="shrink-0">
            <span className="numeric text-2xl text-number">{goalPercent(goal)}</span>
            <span className="numeric text-sm text-muted">%</span>
          </p>
        </div>
        <ProgressBar value={goalProgress(goal).ratio} label="Пройдено" className="mt-3" />
        {series.filter((value) => value !== null).length > 1 && (
          <div className="mt-4">
            <Sparkline values={series} min={low} max={high} height={48} />
          </div>
        )}
      </GlassCard>

      <GlassCard as="section" aria-label="Прогноз" className="p-5">
        <p className="text-base text-text">{forecast.headline}</p>
        {forecast.details.map((line) => (
          <p key={line} className="mt-1 text-sm text-muted">
            {line}
          </p>
        ))}
        {goal.completedAt === null && (
          <Button variant="primary" className="mt-4 w-full" onClick={() => setAdding(true)}>
            {add ? 'Пополнить' : 'Новый замер'}
          </Button>
        )}
      </GlassCard>

      <GlassCard as="section" aria-labelledby={`${id}-history`} className="p-4">
        <div className="flex items-center justify-between gap-3">
          <h2 id={`${id}-history`} className="text-base text-text">
            {add ? 'Пополнения' : 'Замеры'}
          </h2>
          {entries.length > 0 && (
            <Button variant="ghost" className="-mr-3 h-9" onClick={() => setEditing(!editing)}>
              {editing ? 'Готово' : 'Править'}
            </Button>
          )}
        </div>
        {entries.length === 0 ? (
          <p className="mt-2 text-sm text-muted">
            {add ? 'Пополнений пока нет.' : 'Замеров пока нет.'}
          </p>
        ) : (
          <ul className="mt-2 divide-y divide-gray-800">
            {entries.map((entry) => (
              <li key={entry.id} className="flex min-h-12 items-center gap-3 py-2">
                <span className="w-24 shrink-0 text-sm text-muted">
                  {formatDayMonth(entry.date)}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="numeric block text-base text-number">
                    {add ? formatSigned(entry.value, formatNumber) : formatNumber(entry.value)}
                  </span>
                  {entry.note && (
                    <span className="block truncate text-sm text-muted">{entry.note}</span>
                  )}
                </span>
                {editing && (
                  <button
                    type="button"
                    onClick={() => removeGoalEntry(goal.id, entry.id)}
                    aria-label={`Удалить запись за ${formatDayMonth(entry.date)}`}
                    className="flex size-11 shrink-0 items-center justify-center rounded-md text-muted hover:bg-gray-800 hover:text-number"
                  >
                    <X size={18} strokeWidth={1.5} aria-hidden="true" />
                  </button>
                )}
              </li>
            ))}
          </ul>
        )}
      </GlassCard>

      <Sheet
        open={adding}
        onClose={() => setAdding(false)}
        title={add ? 'Пополнение' : 'Новый замер'}
      >
        <EntryForm
          goal={goal}
          today={today}
          onCancel={() => setAdding(false)}
          onSubmit={(entry) => {
            addGoalEntry(goal.id, entry);
            setAdding(false);
          }}
        />
      </Sheet>
    </>
  );
}
