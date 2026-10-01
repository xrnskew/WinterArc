import { plural } from '../lib/plural';
import { arcWeeks } from './analytics';
import { arcDayNumber, arcLength, getActiveArc } from './arc';
import { daysBetween, eachDay } from './dates';
import { arcHabitsAll, dayScore } from './discipline';
import { habitStreak } from './progress';
import type { AppData, DateKey, Habit, Timestamp, UnlockedAchievement } from './types';

/**
 * Достижения — «ледяные жетоны». Каждый считается из фактов (серии, суммы,
 * идеальные дни, цели, обзоры). Заработанный жетон записывается в данные
 * с моментом получения и остаётся навсегда, даже если потом что-то удалить.
 */

export type AchievementGroup = 'streak' | 'total' | 'discipline' | 'goals' | 'reviews' | 'arc';

export const GROUP_TITLES: Record<AchievementGroup, string> = {
  streak: 'Серии',
  total: 'Рубежи',
  discipline: 'Дисциплина',
  goals: 'Цели и задачи',
  reviews: 'Обзоры недели',
  arc: 'Арка',
};

export interface Achievement {
  /** "streak-30:<habitId>" — так он хранится в данных. */
  id: string;
  group: AchievementGroup;
  /** Крупно на жетоне: "30", "10 ч", "1". */
  badge: string;
  title: string;
  /** К чему относится: название привычки или арки. */
  subject: string | null;
  /** Сколько уже есть и сколько нужно. */
  current: number;
  target: number;
  /** Уровень 1–4: чем выше, тем «толще лёд» жетона. */
  tier: 1 | 2 | 3 | 4;
}

export const isEarned = (achievement: Achievement) => achievement.current >= achievement.target;

// ── Определения ──────────────────────────────────────────

const DAY_STREAKS = [7, 30, 60, 90];
const WEEK_STREAKS = [2, 4, 8, 12];
const TIME_HOURS = [10, 50, 100];
const COUNT_TOTALS = [100, 1000];

const tierOf = (index: number) => (index + 1) as Achievement['tier'];

function habitAchievements(habit: Habit, data: AppData, today: DateKey): Achievement[] {
  const result: Achievement[] = [];
  const streak = habitStreak(habit, data.habitLogs, today);
  const weekly = streak.unit === 'week';

  (weekly ? WEEK_STREAKS : DAY_STREAKS).forEach((target, i) =>
    result.push({
      id: `streak-${weekly ? 'w' : ''}${target}:${habit.id}`,
      group: 'streak',
      badge: String(target),
      title: weekly
        ? `${target} ${plural(target, 'неделя', 'недели', 'недель')} подряд`
        : `${target} ${plural(target, 'день', 'дня', 'дней')} подряд`,
      subject: habit.name,
      current: streak.best,
      target,
      tier: tierOf(i),
    }),
  );

  const total = Object.values(data.habitLogs[habit.id] ?? {}).reduce((sum, v) => sum + v, 0);
  if (habit.kind === 'time') {
    TIME_HOURS.forEach((hours, i) =>
      result.push({
        id: `hours-${hours}:${habit.id}`,
        group: 'total',
        badge: `${hours} ч`,
        title: i === 0 ? `Первые ${hours} часов` : `${hours} часов`,
        subject: habit.name,
        current: Math.floor(total / 60),
        target: hours,
        tier: tierOf(i + 1),
      }),
    );
  }
  if (habit.kind === 'count') {
    COUNT_TOTALS.forEach((target, i) =>
      result.push({
        id: `count-${target}:${habit.id}`,
        group: 'total',
        badge: String(target),
        title: `${target} ${habit.unit}`,
        subject: habit.name,
        current: total,
        target,
        tier: tierOf(i + 1),
      }),
    );
  }
  return result;
}

/** Идеальные дни (индекс 100) и идеальные завершённые недели во всех арках. */
function perfectCounts(data: AppData, today: DateKey): { days: number; weeks: number } {
  let days = 0;
  let weeks = 0;
  for (const arc of data.arcs) {
    if (daysBetween(arc.startDate, today) < 0) continue;
    const habits = arcHabitsAll(data, arc);
    const last = daysBetween(today, arc.endDate) < 0 ? arc.endDate : today;
    days += eachDay(arc.startDate, last).filter((day) => dayScore(habits, data, day) === 1).length;
    weeks += arcWeeks(data, arc, today).filter(
      (week) => week.status === 'past' && week.index === 100,
    ).length;
  }
  return { days, weeks };
}

/** Все жетоны — заработанные и нет — с прогрессом. */
export function allAchievements(data: AppData, today: DateKey): Achievement[] {
  const result: Achievement[] = [];
  const habits = data.habits.filter((habit) => habit.archivedAt === null);
  for (const habit of habits) result.push(...habitAchievements(habit, data, today));

  const marked = data.habits.some((habit) =>
    Object.values(data.habitLogs[habit.id] ?? {}).some((value) => value > 0),
  );
  const perfect = perfectCounts(data, today);
  result.push(
    {
      id: 'first-mark',
      group: 'discipline',
      badge: '1',
      title: 'Первая отметка',
      subject: null,
      current: marked ? 1 : 0,
      target: 1,
      tier: 1,
    },
    {
      id: 'perfect-day',
      group: 'discipline',
      badge: '100',
      title: 'Идеальный день',
      subject: null,
      current: perfect.days,
      target: 1,
      tier: 1,
    },
    {
      id: 'perfect-days-10',
      group: 'discipline',
      badge: '10',
      title: '10 идеальных дней',
      subject: null,
      current: perfect.days,
      target: 10,
      tier: 3,
    },
    {
      id: 'perfect-week',
      group: 'discipline',
      badge: '7/7',
      title: 'Идеальная неделя',
      subject: null,
      current: perfect.weeks,
      target: 1,
      tier: 4,
    },
  );

  const reached = data.goals.filter((goal) => goal.completedAt !== null).length;
  const tasks = data.tasks.filter((task) => task.doneAt !== null).length;
  result.push(
    {
      id: 'goal-1',
      group: 'goals',
      badge: '1',
      title: 'Первая цель',
      subject: null,
      current: reached,
      target: 1,
      tier: 2,
    },
    {
      id: 'goal-5',
      group: 'goals',
      badge: '5',
      title: '5 целей',
      subject: null,
      current: reached,
      target: 5,
      tier: 4,
    },
    {
      id: 'tasks-10',
      group: 'goals',
      badge: '10',
      title: '10 задач',
      subject: null,
      current: tasks,
      target: 10,
      tier: 1,
    },
    {
      id: 'tasks-50',
      group: 'goals',
      badge: '50',
      title: '50 задач',
      subject: null,
      current: tasks,
      target: 50,
      tier: 3,
    },
  );

  const reviews = Object.keys(data.weeklyReviews).length;
  result.push(
    {
      id: 'review-1',
      group: 'reviews',
      badge: '1',
      title: 'Первый обзор',
      subject: null,
      current: reviews,
      target: 1,
      tier: 1,
    },
    {
      id: 'review-4',
      group: 'reviews',
      badge: '4',
      title: 'Месяц обзоров',
      subject: null,
      current: reviews,
      target: 4,
      tier: 2,
    },
    {
      id: 'review-12',
      group: 'reviews',
      badge: '12',
      title: '12 обзоров',
      subject: null,
      current: reviews,
      target: 12,
      tier: 4,
    },
  );

  const arc = getActiveArc(data);
  if (arc) {
    const length = arcLength(arc);
    const lived = daysBetween(arc.startDate, today) < 0 ? 0 : arcDayNumber(arc, today);
    result.push(
      {
        id: `arc-half:${arc.id}`,
        group: 'arc',
        badge: '½',
        title: 'Экватор',
        subject: arc.name,
        current: lived,
        target: Math.ceil(length / 2),
        tier: 2,
      },
      {
        id: `arc-end:${arc.id}`,
        group: 'arc',
        badge: String(length),
        title: 'Арка до конца',
        subject: arc.name,
        current: lived,
        target: length,
        tier: 4,
      },
    );
  }
  return result;
}

// ── Получение ────────────────────────────────────────────

/** Жетоны, которые уже заработаны, но ещё не записаны в данные. */
export function newlyEarned(data: AppData, today: DateKey): Achievement[] {
  const unlocked = new Set(data.achievements.map((item) => item.id));
  return allAchievements(data, today).filter(
    (achievement) => isEarned(achievement) && !unlocked.has(achievement.id),
  );
}

/** Записать полученные жетоны с моментом получения. */
export function unlockAchievements(data: AppData, ids: string[], now: Timestamp): AppData {
  const unlocked = new Set(data.achievements.map((item) => item.id));
  const added: UnlockedAchievement[] = ids
    .filter((id) => !unlocked.has(id))
    .map((id) => ({ id, unlockedAt: now }));
  return added.length === 0 ? data : { ...data, achievements: [...data.achievements, ...added] };
}

/** Когда получен жетон; null — ещё не получен. */
export function unlockedAt(data: AppData, id: string): Timestamp | null {
  return data.achievements.find((item) => item.id === id)?.unlockedAt ?? null;
}
