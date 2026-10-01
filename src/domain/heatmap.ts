import { addDays, daysBetween, weekStart } from './dates';
import { dayCompletion } from './progress';
import { dayRequirement, daysOfWeek, isHabitActiveOn } from './schedule';
import type { DateKey, Habit, HabitLogs } from './types';

/**
 * Тепловая карта привычки в стиле GitHub: столбец — неделя,
 * строка — день недели (пн сверху), яркость клетки — выполнение дня.
 */

export interface HeatmapCell {
  date: DateKey;
  /**
   * 0…1 — выполнение дня; null — клетка пустая: день вне периода,
   * в будущем, не по плану или привычки ещё не было.
   */
  value: number | null;
}

export interface HeatmapWeek {
  monday: DateKey;
  days: HeatmapCell[];
}

export function habitHeatmap(
  habit: Habit,
  logs: HabitLogs,
  from: DateKey,
  to: DateKey,
  today: DateKey,
): HeatmapWeek[] {
  const weeks: HeatmapWeek[] = [];
  for (let monday = weekStart(from); daysBetween(monday, to) >= 0; monday = addDays(monday, 7)) {
    weeks.push({
      monday,
      days: daysOfWeek(monday).map((date) => {
        const outside = daysBetween(from, date) < 0 || daysBetween(date, to) < 0;
        const future = daysBetween(today, date) > 0;
        const empty =
          outside ||
          future ||
          !isHabitActiveOn(habit, date) ||
          dayRequirement(habit, date) === 'off';
        // У гибких привычек клетка светится в дни, когда что-то сделано.
        return { date, value: empty ? null : dayCompletion(habit, logs, date) };
      }),
    });
  }
  return weeks;
}
