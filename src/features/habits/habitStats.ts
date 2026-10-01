import { daysBetween, weekStart } from '../../domain/dates';
import { habitStreak, habitTotals, weekProgress } from '../../domain/progress';
import { isWeeklyHabit } from '../../domain/schedule';
import type { AppData, Arc, DateKey, Habit } from '../../domain/types';
import { plural } from '../../lib/plural';

/** Одна плитка статистики: крупное число и подпись под ним. */
export interface StatTile {
  value: number;
  decimals?: number;
  /** Знак после числа: «%». */
  suffix?: string;
  label: string;
}

const dayWord = (n: number) => plural(n, 'день', 'дня', 'дней');

const weekWord = (n: number) => plural(n, 'неделя', 'недели', 'недель');

/** Четыре плитки статистики привычки за текущую арку (серии — за всё время). */
export function habitStatTiles(habit: Habit, data: AppData, arc: Arc, today: DateKey): StatTile[] {
  // Период арки до сегодня (или до конца арки, если она уже прошла).
  const to = daysBetween(today, arc.endDate) < 0 ? arc.endDate : today;

  const streak = habitStreak(habit, data.habitLogs, today);
  const totals = habitTotals(habit, data.habitLogs, arc.startDate, to);
  const isTime = habit.kind === 'time';
  const hours = { value: Math.round((totals.sum / 60) * 10) / 10, decimals: 1, label: 'ч всего' };

  if (isWeeklyHabit(habit)) {
    const week = weekProgress(habit, data.habitLogs, weekStart(today), today);
    // Недельная цель по времени считается в минутах, «N раз в неделю» — в разах.
    const weeklyMinutes = habit.kind === 'time' && habit.targetPeriod === 'week';
    return [
      { value: streak.current, label: `${weekWord(streak.current)} подряд` },
      { value: streak.best, label: 'лучшая серия' },
      {
        value: week.done,
        label: weeklyMinutes
          ? `из ${week.target} мин на этой неделе`
          : `из ${week.target} на этой неделе`,
      },
      isTime
        ? hours
        : {
            value: totals.doneDays,
            label: `${plural(totals.doneDays, 'раз', 'раза', 'раз')} за арку`,
          },
    ];
  }

  const percent =
    totals.plannedDays > 0 ? Math.round((totals.doneDays / totals.plannedDays) * 100) : 0;
  const third: StatTile =
    habit.kind === 'count'
      ? { value: totals.sum, label: `${habit.unit} всего` }
      : isTime
        ? hours
        : { value: totals.doneDays, label: `из ${totals.plannedDays} по плану` };

  return [
    { value: streak.current, label: `${dayWord(streak.current)} подряд` },
    { value: streak.best, label: 'лучшая серия' },
    third,
    { value: percent, suffix: '%', label: 'дней выполнено' },
  ];
}
