import { addDays, daysBetween, toDateKey, weekdayOf } from './dates';
import type { DateKey, Habit } from './types';

/**
 * Расписание: нужна ли привычка в конкретный день.
 *
 * required — день по плану: его выполнение влияет на серию и индекс дня;
 * flexible — «N раз в неделю» или недельная цель по времени: можно в любой
 *            день, считается целиком за неделю;
 * off      — день не по плану (например, суббота у привычки «по будням»).
 */
export type DayRequirement = 'required' | 'flexible' | 'off';

/** Привычка считается по неделям, а не по дням. */
export function isWeeklyHabit(habit: Habit): boolean {
  if (habit.kind === 'time' && habit.targetPeriod === 'week') return true;
  return habit.schedule.type === 'timesPerWeek';
}

export function dayRequirement(habit: Habit, date: DateKey): DayRequirement {
  if (isWeeklyHabit(habit)) return 'flexible';
  if (habit.schedule.type === 'weekdays') {
    return habit.schedule.days.includes(weekdayOf(date)) ? 'required' : 'off';
  }
  return 'required';
}

/** С какого дня привычка существует: дата создания. */
export function habitStartDate(habit: Habit): DateKey {
  return toDateKey(new Date(habit.createdAt));
}

/** Привычка уже была создана и ещё не убрана в архив в этот день. */
export function isHabitActiveOn(habit: Habit, date: DateKey): boolean {
  if (daysBetween(habitStartDate(habit), date) < 0) return false;
  if (habit.archivedAt === null) return true;
  return daysBetween(date, toDateKey(new Date(habit.archivedAt))) >= 0;
}

/** Семь дней недели, начиная с понедельника weekStart. */
export function daysOfWeek(weekStart: DateKey): DateKey[] {
  return Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
}
