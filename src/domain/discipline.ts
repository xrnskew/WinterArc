import { hasRelapseOn, isCleanDay } from './abstain';
import { arcDays } from './arc';
import { daysBetween } from './dates';
import { dayCompletion, weekProgress } from './progress';
import { dayRequirement, daysOfWeek, isHabitActiveOn, isWeeklyHabit } from './schedule';
import type { AppData, Arc, DateKey, Habit, Weekday } from './types';

/**
 * Индекс дисциплины 0–100.
 *
 * Каждая привычка даёт за день оценку 0…1:
 *   да/нет → 0 или 1; количество и время → min(факт / цель, 1);
 *   отказ → 1, если день чистый.
 * Индекс дня — среднее по привычкам, запланированным на этот день.
 * Гибкие привычки («N раз в неделю», недельная цель по времени) в индекс дня
 * не входят — только в индекс недели, как min(сделано / цель, 1).
 */

/** Привычки арки (включая убранные в архив — по датам они ещё влияют на прошлое). */
export function arcHabitsAll(data: AppData, arc: Arc): Habit[] {
  return arc.habitIds.flatMap((id) => data.habits.find((habit) => habit.id === id) ?? []);
}

/** Оценка привычки за день 0…1. null — день не по плану или привычки ещё не было. */
export function habitDayScore(habit: Habit, data: AppData, date: DateKey): number | null {
  if (!isHabitActiveOn(habit, date)) return null;
  if (habit.kind === 'abstain') return isCleanDay(habit, data, date) ? 1 : 0;
  if (dayRequirement(habit, date) !== 'required') return null;
  return dayCompletion(habit, data.habitLogs, date);
}

function average(values: (number | null)[]): number | null {
  const known = values.filter((value): value is number => value !== null);
  if (known.length === 0) return null;
  return known.reduce((sum, value) => sum + value, 0) / known.length;
}

/** Индекс дня 0…1 или null, если в этот день ничего не запланировано. */
export function dayScore(habits: Habit[], data: AppData, date: DateKey): number | null {
  return average(habits.map((habit) => habitDayScore(habit, data, date)));
}

/**
 * Оценка привычки за неделю 0…1.
 * Дневные — среднее по дням недели до today. Гибкие — min(сделано / цель, 1),
 * а для текущей недели цель уменьшена пропорционально прошедшим дням,
 * чтобы в понедельник «0 из 4» не обрушивал индекс.
 */
export function habitWeekScore(
  habit: Habit,
  data: AppData,
  monday: DateKey,
  today: DateKey,
): number | null {
  const days = daysOfWeek(monday).filter(
    (day) => daysBetween(day, today) >= 0 && isHabitActiveOn(habit, day),
  );
  if (days.length === 0) return null;

  if (isWeeklyHabit(habit)) {
    const { done, target } = weekProgress(habit, data.habitLogs, monday, today);
    const expected = (target * days.length) / 7;
    return expected > 0 ? Math.min(done / expected, 1) : null;
  }
  return average(days.map((day) => habitDayScore(habit, data, day)));
}

/** Индекс недели 0…1: среднее по привычкам, у каждой привычки равный вес. */
export function weekScore(
  habits: Habit[],
  data: AppData,
  monday: DateKey,
  today: DateKey,
): number | null {
  return average(habits.map((habit) => habitWeekScore(habit, data, monday, today)));
}

/** 0…1 → 0…100. */
export function toIndex(score: number | null): number | null {
  return score === null ? null : Math.round(score * 100);
}

// ── Зарубки арки ─────────────────────────────────────────

export interface ArcDayMark {
  date: DateKey;
  weekday: Weekday;
  status: 'past' | 'today' | 'future';
  /** Индекс дня 0…1; null — ничего не было запланировано (или день в будущем). */
  score: number | null;
  /** Срыв по любой привычке-отказу. */
  relapse: boolean;
}

/** Все дни арки с индексом и срывами — для зарубок. */
export function arcDayMarks(data: AppData, arc: Arc, today: DateKey): ArcDayMark[] {
  const habits = arcHabitsAll(data, arc);
  const abstainIds = habits.filter((habit) => habit.kind === 'abstain').map((habit) => habit.id);

  return arcDays(arc, today).map((day) => ({
    ...day,
    score: day.status === 'future' ? null : dayScore(habits, data, day.date),
    relapse: day.status !== 'future' && abstainIds.some((id) => hasRelapseOn(data, id, day.date)),
  }));
}
