import { isCleanDay } from './abstain';
import { addDays, daysBetween, eachDay, weekStart } from './dates';
import { dailyTarget, getLog, isDayDone, weekProgress } from './progress';
import { dayRequirement, daysOfWeek, habitStartDate, isWeeklyHabit } from './schedule';
import type { AbstainHabit, AppData, DateKey, Habit, HabitLogs } from './types';

/**
 * Данные для графиков на странице привычки. Только числа — как рисовать,
 * решает интерфейс (features/habits/HabitChart.tsx).
 */

export type HabitChartKind = 'daily' | 'weekly' | 'weeklyRate' | 'cleanStreak';

export interface ChartPoint {
  /** День или понедельник недели. */
  date: DateKey;
  value: number;
  /** Цель выполнена (для подсветки столбца). */
  done: boolean;
}

export interface HabitChartData {
  kind: HabitChartKind;
  points: ChartPoint[];
  /** Линия цели; null — без линии. */
  target: number | null;
  /** Что по оси Y: «страниц», «мин», «%», «дней». */
  unit: string;
}

/** Сколько дней показываем на дневном графике. */
export const DAILY_WINDOW = 28;

/**
 * Какой график подходит привычке:
 * количество и время с дневной целью — столбцы по дням с линией цели;
 * недельные — столбцы по неделям с линией цели;
 * «да/нет» каждый день — процент выполнения по неделям;
 * отказ — как росла серия чистых дней.
 */
export function chartFor(
  habit: Habit,
  data: AppData,
  from: DateKey,
  today: DateKey,
): HabitChartData {
  const start = daysBetween(habitStartDate(habit), from) >= 0 ? from : habitStartDate(habit);
  if (habit.kind === 'abstain') return cleanStreakChart(habit, data, start, today);
  if (isWeeklyHabit(habit)) return weeklyChart(habit, data.habitLogs, start, today);
  if (habit.kind === 'check') return weeklyRateChart(habit, data.habitLogs, start, today);
  return dailyChart(habit, data.habitLogs, start, today);
}

function dailyChart(habit: Habit, logs: HabitLogs, start: DateKey, today: DateKey): HabitChartData {
  const windowStart = addDays(today, -(DAILY_WINDOW - 1));
  const from = daysBetween(start, windowStart) >= 0 ? windowStart : start;
  return {
    kind: 'daily',
    points: eachDay(from, today).map((date) => ({
      date,
      value: getLog(logs, habit.id, date),
      done: isDayDone(habit, logs, date),
    })),
    target: dailyTarget(habit),
    unit: habit.kind === 'count' ? habit.unit : 'мин',
  };
}

function weeklyChart(
  habit: Habit,
  logs: HabitLogs,
  start: DateKey,
  today: DateKey,
): HabitChartData {
  const points = mondays(start, today).map((monday) => {
    const progress = weekProgress(habit, logs, monday, today);
    return { date: monday, value: progress.done, done: progress.done >= progress.target };
  });
  const minutes = habit.kind === 'time' && habit.targetPeriod === 'week';
  const target = weekProgress(habit, logs, weekStart(today), today).target;
  return { kind: 'weekly', points, target, unit: minutes ? 'мин' : 'раз' };
}

/** «Да/нет»: доля выполненных дней по плану за каждую неделю. */
function weeklyRateChart(
  habit: Habit,
  logs: HabitLogs,
  start: DateKey,
  today: DateKey,
): HabitChartData {
  const points = mondays(start, today).flatMap((monday) => {
    const planned = daysOfWeek(monday).filter(
      (day) =>
        daysBetween(start, day) >= 0 &&
        daysBetween(day, today) >= 0 &&
        dayRequirement(habit, day) === 'required',
    );
    if (planned.length === 0) return [];
    const done = planned.filter((day) => isDayDone(habit, logs, day)).length;
    const value = Math.round((done / planned.length) * 100);
    return [{ date: monday, value, done: value === 100 }];
  });
  return { kind: 'weeklyRate', points, target: null, unit: '%' };
}

/** Отказ: длина серии в каждый день. Срыв — падение до нуля. */
function cleanStreakChart(
  habit: AbstainHabit,
  data: AppData,
  start: DateKey,
  today: DateKey,
): HabitChartData {
  let run = 0;
  const points = eachDay(start, today).map((date) => {
    const clean = isCleanDay(habit, data, date);
    run = clean ? run + 1 : 0;
    return { date, value: run, done: clean };
  });
  return { kind: 'cleanStreak', points, target: null, unit: 'дней' };
}

/** Понедельники всех недель от start до today. */
function mondays(start: DateKey, today: DateKey): DateKey[] {
  const result: DateKey[] = [];
  for (
    let monday = weekStart(start);
    daysBetween(monday, today) >= 0;
    monday = addDays(monday, 7)
  ) {
    result.push(monday);
  }
  return result;
}
