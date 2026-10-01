import { Link } from 'react-router';
import { habitPath } from '../../app/routes';
import { weekStart } from '../../domain/dates';
import { describeSchedule, formatMinutes, stepperStep } from '../../domain/habits';
import { dailyTarget, getLog, habitStreak, weekProgress } from '../../domain/progress';
import { isWeeklyHabit } from '../../domain/schedule';
import type { AppData, DateKey, Habit } from '../../domain/types';
import { CheckSquare } from '../../design/ui/CheckSquare';
import { HabitIcon } from '../../design/ui/HabitIcon';
import { Stepper } from '../../design/ui/Stepper';
import { formatNumber } from '../../lib/formatNumber';
import { plural } from '../../lib/plural';
import { useAppStore } from '../../store/useAppStore';

interface HabitCheckinRowProps {
  habit: Habit;
  data: AppData;
  date: DateKey;
}

const days = (n: number) => `${n} ${plural(n, 'день', 'дня', 'дней')}`;

/**
 * Строка привычки в чек-ине: квадрат «сделано» и, у количества и времени,
 * − число + под названием.
 */
export function HabitCheckinRow({ habit, data, date }: HabitCheckinRowProps) {
  const setHabitLog = useAppStore((state) => state.setHabitLog);
  const value = getLog(data.habitLogs, habit.id, date);
  const target = dailyTarget(habit);
  const done = target !== null && value >= target;
  const setValue = (next: number) => setHabitLog(habit.id, date, next);

  // Подпись: прогресс дня, недели или серия.
  let detail: string;
  if (isWeeklyHabit(habit)) {
    const week = weekProgress(habit, data.habitLogs, weekStart(date), date);
    detail =
      habit.kind === 'time' && habit.targetPeriod === 'week'
        ? `${formatMinutes(week.done)} из ${formatMinutes(week.target)} за неделю`
        : `${week.done} из ${week.target} на этой неделе`;
  } else if (habit.kind === 'count') {
    detail = `${formatNumber(value)} из ${formatNumber(habit.dailyTarget)} ${habit.unit}`;
  } else if (habit.kind === 'time') {
    detail = `${formatMinutes(value)} из ${formatMinutes(habit.targetMinutes)}`;
  } else {
    const streak = habitStreak(habit, data.habitLogs, date).current;
    detail = streak > 0 ? `Серия: ${days(streak)}` : describeSchedule(habit.schedule);
  }

  return (
    // Телефон: степпер под названием (иначе название не помещается). Десктоп: в одну строку.
    <li className="px-4 py-3 lg:flex lg:items-center lg:gap-4">
      <div className="flex min-w-0 items-center gap-3 lg:flex-1">
        {target !== null ? (
          <CheckSquare
            checked={done}
            onToggle={() => setValue(done ? 0 : target)}
            label={`Выполнено: ${habit.name}`}
          />
        ) : (
          // У недельной цели по времени нет «сделано за день» — место оставляем для ровного списка.
          <span className="size-11 shrink-0" aria-hidden="true" />
        )}
        {/* Иконка и название — ссылка на страницу привычки. */}
        <Link to={habitPath(habit.id)} className="flex min-w-0 flex-1 items-center gap-3">
          <HabitIcon name={habit.icon} className="shrink-0 text-text" />
          <span className="min-w-0">
            <span className="block truncate text-base text-text">{habit.name}</span>
            <span className="block text-sm text-muted">{detail}</span>
          </span>
        </Link>
      </div>
      {habit.kind !== 'check' && (
        <div className="mt-2 pl-14 lg:mt-0 lg:shrink-0 lg:pl-0">
          <Stepper
            value={value}
            onChange={setValue}
            step={stepperStep(habit)}
            label={`${habit.name}, ${habit.kind === 'time' ? 'минут' : habit.unit}`}
          />
        </div>
      )}
    </li>
  );
}
