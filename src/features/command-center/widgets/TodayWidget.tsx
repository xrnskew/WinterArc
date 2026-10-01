import { Check } from 'lucide-react';
import { Link } from 'react-router';
import { PATHS } from '../../../app/routes';
import { daysBetween } from '../../../domain/dates';
import { habitDayScore } from '../../../domain/discipline';
import { arcHabits } from '../../../domain/habits';
import { dayCompletion } from '../../../domain/progress';
import { dayRequirement, isHabitActiveOn } from '../../../domain/schedule';
import { cx } from '../../../lib/cx';
import type { WidgetProps } from './WidgetFrame';

/** Привычки на сегодня: что отмечено. Нажатие — в чек-ин. */
export function TodayWidget({ widget, data, arc, today }: WidgetProps) {
  if (daysBetween(today, arc.startDate) > 0 || daysBetween(arc.endDate, today) > 0) {
    return <p className="text-sm text-muted">Сегодня не день арки.</p>;
  }

  const habits = arcHabits(data, arc).filter(
    (habit) => isHabitActiveOn(habit, today) && dayRequirement(habit, today) !== 'off',
  );
  const required = habits.filter((habit) => dayRequirement(habit, today) === 'required');
  const done = required.filter((habit) => habitDayScore(habit, data, today) === 1).length;

  const summary = (
    <p className="text-sm text-muted">
      <span className="numeric text-2xl text-number">{done}</span>
      <span className="numeric"> / {required.length}</span> по плану
    </p>
  );

  if (widget.size === 'half') {
    return (
      <Link to={PATHS.checkin} className="block">
        {summary}
        <span className="mt-2 block text-sm text-text underline underline-offset-4">Чек-ин</span>
      </Link>
    );
  }

  return (
    <>
      {summary}
      <ul className="mt-3 flex flex-col gap-2">
        {habits.map((habit) => {
          // Гибкие («N раз в неделю») — отмечено, если сегодня что-то сделано.
          const complete = dayCompletion(habit, data.habitLogs, today) >= 1;
          return (
            <li key={habit.id} className="flex items-center gap-3 text-sm">
              <span
                aria-hidden="true"
                className={cx(
                  'flex size-5 shrink-0 items-center justify-center rounded-sm border',
                  complete ? 'border-number bg-number text-night' : 'border-gray-500',
                )}
              >
                {complete && <Check size={14} strokeWidth={3} />}
              </span>
              <span className={complete ? 'text-text' : 'text-muted'}>
                {habit.name}
                <span className="sr-only">{complete ? ' — сделано' : ' — ещё нет'}</span>
              </span>
            </li>
          );
        })}
      </ul>
      <Link
        to={PATHS.checkin}
        className="mt-4 inline-block text-sm text-text underline underline-offset-4"
      >
        Открыть чек-ин
      </Link>
    </>
  );
}
