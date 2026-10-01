import { addDays, daysBetween, eachDay, weekStart } from './dates';
import { dayRequirement, daysOfWeek, habitStartDate, isWeeklyHabit } from './schedule';
import type { AppData, DateKey, Habit, HabitLogs, Id } from './types';

/**
 * Выполнение привычек «да/нет», «количество» и «время»:
 * записи по дням, выполнение дня и недели, серии, итоги.
 * Отказы считаются отдельно — в abstain.ts.
 */

// ── Записи ───────────────────────────────────────────────

/** Значение за день: 1 у «да/нет», штуки у количества, минуты у времени. Нет записи — 0. */
export function getLog(logs: HabitLogs, habitId: Id, date: DateKey): number {
  return logs[habitId]?.[date] ?? 0;
}

/** Записать значение за день. 0 или меньше — запись удаляется. */
export function setLog(data: AppData, habitId: Id, date: DateKey, value: number): AppData {
  const habitLogs = { ...data.habitLogs[habitId] };
  if (Number.isFinite(value) && value > 0) habitLogs[date] = value;
  else delete habitLogs[date];
  return { ...data, habitLogs: { ...data.habitLogs, [habitId]: habitLogs } };
}

// ── День ─────────────────────────────────────────────────

/**
 * Сколько нужно за один день: у «да/нет» — 1, у количества — цель на день,
 * у времени с дневной целью — минуты. У недельной цели по времени дневной нет (null).
 */
export function dailyTarget(habit: Habit): number | null {
  switch (habit.kind) {
    case 'check':
      return 1;
    case 'count':
      return habit.dailyTarget;
    case 'time':
      return habit.targetPeriod === 'day' ? habit.targetMinutes : null;
    case 'abstain':
      return null;
  }
}

/**
 * Выполнение за день 0…1. Без дневной цели (недельное время) —
 * 1, если в этот день хоть что-то сделано.
 */
export function dayCompletion(habit: Habit, logs: HabitLogs, date: DateKey): number {
  const value = getLog(logs, habit.id, date);
  const target = dailyTarget(habit);
  if (target === null) return value > 0 ? 1 : 0;
  return Math.min(value / target, 1);
}

export function isDayDone(habit: Habit, logs: HabitLogs, date: DateKey): boolean {
  return dayCompletion(habit, logs, date) >= 1;
}

// ── Неделя ───────────────────────────────────────────────

export interface WeekProgress {
  done: number;
  target: number;
}

/**
 * Прогресс недели у недельных привычек.
 * «N раз в неделю»: сколько дней выполнено из N.
 * Время с недельной целью: сколько минут из цели.
 * Учитываются дни до until включительно (обычно — сегодня).
 */
export function weekProgress(
  habit: Habit,
  logs: HabitLogs,
  monday: DateKey,
  until: DateKey,
): WeekProgress {
  const days = daysOfWeek(monday).filter((day) => daysBetween(day, until) >= 0);
  if (habit.kind === 'time' && habit.targetPeriod === 'week') {
    const minutes = days.reduce((sum, day) => sum + getLog(logs, habit.id, day), 0);
    return { done: minutes, target: habit.targetMinutes };
  }
  const times = habit.schedule.type === 'timesPerWeek' ? habit.schedule.times : 7;
  const doneDays = days.filter((day) => isDayDone(habit, logs, day)).length;
  return { done: doneDays, target: times };
}

export function isWeekDone(progress: WeekProgress): boolean {
  return progress.done >= progress.target;
}

// ── Серии ────────────────────────────────────────────────

export interface Streak {
  current: number;
  best: number;
  /** Дневные привычки — серия в днях, недельные — в неделях. */
  unit: 'day' | 'week';
}

/**
 * Серия выполнений до сегодня.
 * Сегодняшний невыполненный день (или текущая неделя) серию не рвёт —
 * день ещё не закончился.
 */
export function habitStreak(habit: Habit, logs: HabitLogs, today: DateKey): Streak {
  const start = habitStartDate(habit);
  if (daysBetween(start, today) < 0) return { current: 0, best: 0, unit: 'day' };
  return isWeeklyHabit(habit)
    ? weeklyStreak(habit, logs, start, today)
    : dailyStreak(habit, logs, start, today);
}

function dailyStreak(habit: Habit, logs: HabitLogs, start: DateKey, today: DateKey): Streak {
  let run = 0;
  let best = 0;
  for (const day of eachDay(start, today)) {
    if (dayRequirement(habit, day) !== 'required') continue;
    if (isDayDone(habit, logs, day)) run += 1;
    else if (day !== today) run = 0;
    best = Math.max(best, run);
  }
  return { current: run, best, unit: 'day' };
}

function weeklyStreak(habit: Habit, logs: HabitLogs, start: DateKey, today: DateKey): Streak {
  const firstMonday = weekStart(start);
  const thisMonday = weekStart(today);
  let run = 0;
  let best = 0;
  for (
    let monday = firstMonday;
    daysBetween(monday, thisMonday) >= 0;
    monday = addDays(monday, 7)
  ) {
    const done = isWeekDone(weekProgress(habit, logs, monday, today));
    // Текущая неделя ещё идёт, первая могла начаться не с понедельника — их провал не считаем.
    const forgiven = monday === thisMonday || monday === firstMonday;
    if (done) run += 1;
    else if (!forgiven) run = 0;
    best = Math.max(best, run);
  }
  return { current: run, best, unit: 'week' };
}

// ── Итоги ────────────────────────────────────────────────

export interface HabitTotals {
  /** Сумма значений: штук или минут. */
  sum: number;
  /** Дней, когда цель дня выполнена. */
  doneDays: number;
  /** Дней по плану (обязательных), уже прошедших или сегодня. */
  plannedDays: number;
}

/** Итоги за период [from, to] (to обычно — сегодня). */
export function habitTotals(
  habit: Habit,
  logs: HabitLogs,
  from: DateKey,
  to: DateKey,
): HabitTotals {
  const start = daysBetween(habitStartDate(habit), from) >= 0 ? from : habitStartDate(habit);
  let sum = 0;
  let doneDays = 0;
  let plannedDays = 0;
  for (const day of eachDay(start, to)) {
    sum += getLog(logs, habit.id, day);
    if (isDayDone(habit, logs, day)) doneDays += 1;
    if (dayRequirement(habit, day) === 'required') plannedDays += 1;
  }
  return { sum, doneDays, plannedDays };
}
