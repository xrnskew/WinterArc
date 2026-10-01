import { arcDays } from './arc';
import { addDays, daysBetween, weekStart } from './dates';
import { dayCompletion, getLog, weekProgress } from './progress';
import { dayRequirement, daysOfWeek, isHabitActiveOn, isWeeklyHabit } from './schedule';
import type { AppData, Arc, DateKey, Habit, Weekday } from './types';

/**
 * Индекс дисциплины 0–100.
 *
 * Каждая привычка даёт за день оценку 0…1:
 *   да/нет → 0 или 1; количество и время → min(факт / цель, 1).
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
 * Оценка привычки за неделю 0…1 по дням от понедельника до until.
 * Дневные — среднее по дням. Гибкие — min(сделано / цель, 1), а цель
 * уменьшена пропорционально прошедшим дням, чтобы в понедельник
 * «0 из 4» не обрушивал индекс.
 * Сегодняшний день ещё идёт: пока по привычке сегодня ничего не сделано,
 * он не считается — как и в сериях.
 */
export function habitWeekScore(
  habit: Habit,
  data: AppData,
  monday: DateKey,
  until: DateKey,
  today: DateKey = until,
): number | null {
  const days = daysOfWeek(monday).filter(
    (day) =>
      daysBetween(day, until) >= 0 &&
      isHabitActiveOn(habit, day) &&
      (day !== today || getLog(data.habitLogs, habit.id, day) > 0),
  );
  if (days.length === 0) return null;

  if (isWeeklyHabit(habit)) {
    const { done, target } = weekProgress(habit, data.habitLogs, monday, until);
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
  until: DateKey,
  today: DateKey = until,
): number | null {
  return average(habits.map((habit) => habitWeekScore(habit, data, monday, until, today)));
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
}

/** Все дни арки с индексом дисциплины — для зарубок. */
export function arcDayMarks(data: AppData, arc: Arc, today: DateKey): ArcDayMark[] {
  const habits = arcHabitsAll(data, arc);
  return arcDays(arc, today).map((day) => ({
    ...day,
    score: day.status === 'future' ? null : dayScore(habits, data, day.date),
  }));
}

// ── Неделя ───────────────────────────────────────────────

export interface WeekDayMark {
  date: DateKey;
  status: 'past' | 'today' | 'future';
  /** Индекс дня 0…1; null — ничего не запланировано или день впереди. */
  score: number | null;
}

export interface WeekSummary {
  monday: DateKey;
  /** Индекс недели 0–100; null — на неделе нечего было делать. */
  index: number | null;
  /** Индекс прошлой недели целиком — для сравнения. */
  previousIndex: number | null;
  days: WeekDayMark[];
}

/** Неделя, в которую входит today: индекс, прошлая неделя и семь дней. */
export function weekSummary(data: AppData, arc: Arc, today: DateKey): WeekSummary {
  const habits = arcHabitsAll(data, arc);
  const monday = weekStart(today);
  const previousMonday = addDays(monday, -7);
  const previousSunday = addDays(monday, -1);
  // Дни вне арки в индекс не идут: до старта и после конца арки привычек «нет».
  const inArc = (date: DateKey) =>
    daysBetween(arc.startDate, date) >= 0 && daysBetween(date, arc.endDate) >= 0;

  return {
    monday,
    index: toIndex(weekScore(habits, data, monday, today)),
    previousIndex: inArc(previousSunday)
      ? toIndex(weekScore(habits, data, previousMonday, previousSunday, today))
      : null,
    days: daysOfWeek(monday).map((date) => {
      const diff = daysBetween(today, date);
      const status = diff < 0 ? 'past' : diff === 0 ? 'today' : 'future';
      return {
        date,
        status,
        score: status === 'future' || !inArc(date) ? null : dayScore(habits, data, date),
      };
    }),
  };
}
