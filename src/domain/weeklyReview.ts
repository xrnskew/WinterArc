import { arcWeeks } from './analytics';
import { addDays, daysBetween, eachDay, toDateKey, weekStart, weekdayOf } from './dates';
import { arcHabitsAll, dayScore, toIndex, weekScore } from './discipline';
import { averageRating, ratingSeries } from './days';
import { arcHabits } from './habits';
import { isDayDone, weekProgress } from './progress';
import { dayRequirement, isHabitActiveOn, isWeeklyHabit } from './schedule';
import type { AppData, Arc, DateKey, Habit, RatingScale, Timestamp, WeeklyReview } from './types';

/**
 * Обзор недели: автоматические итоги и три ответа — что получилось,
 * что нет, на чём фокус дальше. Ответы хранятся по понедельнику недели.
 */

// ── Какие недели можно открыть ───────────────────────────

/** Первая и последняя неделя, которые можно обозревать: от старта арки до сегодня. */
export function reviewWeekRange(arc: Arc, today: DateKey): { first: DateKey; last: DateKey } {
  const lastDay = daysBetween(today, arc.endDate) < 0 ? arc.endDate : today;
  return { first: weekStart(arc.startDate), last: weekStart(lastDay) };
}

/**
 * Неделя по умолчанию. В понедельник итоги подводят за прошлую неделю,
 * в остальные дни — за текущую.
 */
export function defaultReviewWeek(arc: Arc, today: DateKey): DateKey {
  const { first, last } = reviewWeekRange(arc, today);
  const monday = weekdayOf(today) === 1 && last === weekStart(today) ? addDays(last, -7) : last;
  return daysBetween(first, monday) < 0 ? first : monday;
}

// ── Итоги недели ─────────────────────────────────────────

export interface HabitWeekResult {
  habit: Habit;
  /** Сделано и нужно: дни по плану, разы («N раз в неделю») или минуты (недельное время). */
  done: number;
  target: number;
  unit: 'days' | 'times' | 'minutes';
}

export interface ScaleWeekResult {
  scale: RatingScale;
  average: number | null;
  previousAverage: number | null;
}

export interface WeekReviewSummary {
  monday: DateKey;
  /** Последний день недели внутри арки. */
  sunday: DateKey;
  status: 'current' | 'past';
  index: number | null;
  previousIndex: number | null;
  habits: HabitWeekResult[];
  /** Лучший и худший день недели по индексу (только закончившиеся дни). */
  bestDay: { date: DateKey; index: number } | null;
  worstDay: { date: DateKey; index: number } | null;
  ratings: ScaleWeekResult[];
  tasksDone: number;
  stepsDone: number;
  goalsReached: number;
}

/** Попадает ли момент времени в неделю (по местной дате). */
function inWeek(moment: Timestamp | null, monday: DateKey, sunday: DateKey): boolean {
  if (moment === null) return false;
  const day = toDateKey(new Date(moment));
  return daysBetween(monday, day) >= 0 && daysBetween(day, sunday) >= 0;
}

/** Результат привычки за неделю: дни по плану, разы или минуты. */
function habitWeek(
  habit: Habit,
  data: AppData,
  days: DateKey[],
  monday: DateKey,
  until: DateKey,
): HabitWeekResult {
  if (isWeeklyHabit(habit)) {
    const { done, target } = weekProgress(habit, data.habitLogs, monday, until);
    // Недельная цель по времени — в минутах, «N раз в неделю» — в разах.
    const minutes = habit.kind === 'time' && habit.targetPeriod === 'week';
    return { habit, done, target, unit: minutes ? 'minutes' : 'times' };
  }
  const planned = days.filter(
    (day) => isHabitActiveOn(habit, day) && dayRequirement(habit, day) === 'required',
  );
  const done = planned.filter(
    (day) => daysBetween(day, until) >= 0 && isDayDone(habit, data.habitLogs, day),
  ).length;
  return { habit, done, target: planned.length, unit: 'days' };
}

export function weekReviewSummary(
  data: AppData,
  arc: Arc,
  monday: DateKey,
  today: DateKey,
): WeekReviewSummary {
  const weekEnd = addDays(monday, 6);
  const sunday = daysBetween(weekEnd, arc.endDate) < 0 ? arc.endDate : weekEnd;
  const firstDay = daysBetween(monday, arc.startDate) > 0 ? arc.startDate : monday;
  const days = eachDay(firstDay, sunday);
  const status = daysBetween(today, sunday) >= 0 ? 'current' : 'past';
  // До какого дня считаем сделанное: в текущей неделе — до сегодня.
  const until = status === 'current' ? today : sunday;

  const week = arcWeeks(data, arc, today).find((item) => item.monday === monday);
  const previousMonday = addDays(monday, -7);
  const previous = daysBetween(arc.startDate, addDays(monday, -1)) >= 0;
  const all = arcHabitsAll(data, arc);

  // Лучший и худший — только среди закончившихся дней, где что-то было запланировано.
  const scored = days
    .filter((day) => daysBetween(day, today) > 0)
    .map((day) => ({ date: day, index: toIndex(dayScore(all, data, day)) }))
    .filter((day): day is { date: DateKey; index: number } => day.index !== null);
  // При равенстве — более ранний день.
  const best = scored.reduce<(typeof scored)[number] | null>(
    (top, day) => (top === null || day.index > top.index ? day : top),
    null,
  );
  const worst = scored.reduce<(typeof scored)[number] | null>(
    (bottom, day) => (bottom === null || day.index < bottom.index ? day : bottom),
    null,
  );
  const differs = best !== null && worst !== null && best.index !== worst.index;

  const previousDays = eachDay(previousMonday, addDays(previousMonday, 6)).filter(
    (day) => daysBetween(arc.startDate, day) >= 0,
  );

  return {
    monday,
    sunday,
    status,
    index: week?.index ?? null,
    previousIndex: previous
      ? toIndex(weekScore(all, data, previousMonday, addDays(monday, -1), today))
      : null,
    habits: arcHabits(data, arc).map((habit) => habitWeek(habit, data, days, monday, until)),
    bestDay: differs ? best : null,
    worstDay: differs ? worst : null,
    ratings: data.ratingScales
      .filter((scale) => scale.archivedAt === null)
      .map((scale) => ({
        scale,
        average: averageRating(ratingSeries(data, scale.id, days)),
        previousAverage: previous
          ? averageRating(ratingSeries(data, scale.id, previousDays))
          : null,
      })),
    tasksDone: data.tasks.filter((task) => inWeek(task.doneAt, monday, sunday)).length,
    stepsDone: data.goals.reduce(
      (count, goal) =>
        count +
        (goal.kind === 'steps'
          ? goal.steps.filter((step) => inWeek(step.doneAt, monday, sunday)).length
          : 0),
      0,
    ),
    goalsReached: data.goals.filter((goal) => inWeek(goal.completedAt, monday, sunday)).length,
  };
}

// ── Ответы ───────────────────────────────────────────────

export type ReviewAnswers = Pick<WeeklyReview, 'wins' | 'misses' | 'nextFocus'>;

export const EMPTY_ANSWERS: ReviewAnswers = { wins: '', misses: '', nextFocus: '' };

export function getReview(data: AppData, monday: DateKey): WeeklyReview | undefined {
  return data.weeklyReviews[monday];
}

/** Сохранить ответы недели. Все поля пустые — обзор удаляется. */
export function saveReview(
  data: AppData,
  monday: DateKey,
  answers: ReviewAnswers,
  now: Timestamp,
): AppData {
  const clean = {
    wins: answers.wins.trim(),
    misses: answers.misses.trim(),
    nextFocus: answers.nextFocus.trim(),
  };
  const { [monday]: _removed, ...rest } = data.weeklyReviews;
  if (!clean.wins && !clean.misses && !clean.nextFocus) return { ...data, weeklyReviews: rest };
  return { ...data, weeklyReviews: { ...rest, [monday]: { ...clean, updatedAt: now } } };
}

/** Фокус, который ты поставил себе в обзоре прошлой недели. */
export function previousFocus(data: AppData, monday: DateKey): string | null {
  return getReview(data, addDays(monday, -7))?.nextFocus || null;
}

/**
 * Неделя, по которой пора подвести итоги: в воскресенье — текущая,
 * в понедельник — прошлая. null — в другие дни или если обзор уже есть.
 */
export function reviewDue(data: AppData, arc: Arc, today: DateKey): DateKey | null {
  const weekday = weekdayOf(today);
  if (weekday !== 7 && weekday !== 1) return null;
  const monday = weekday === 7 ? weekStart(today) : addDays(weekStart(today), -7);
  // Неделя должна пересекаться с аркой.
  if (daysBetween(addDays(monday, 6), arc.startDate) > 0) return null;
  if (daysBetween(arc.endDate, monday) > 0) return null;
  return getReview(data, monday) ? null : monday;
}
