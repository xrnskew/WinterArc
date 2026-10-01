import { daysBetween, eachDay } from './dates';
import type { AbstainEvent, AbstainHabit, AppData, DateKey, Id } from './types';

/**
 * Привычки-отказы. Каждый день чистый, пока не отмечен срыв.
 * Срыв обнуляет серию, но не общий счёт чистых дней: он записывается
 * событием с причиной. Пережитая тяга — тоже событие.
 */

/** События отказа, новые сверху. */
export function habitEvents(data: AppData, habitId: Id): AbstainEvent[] {
  return data.abstainEvents
    .filter((event) => event.habitId === habitId)
    .sort((a, b) => b.date.localeCompare(a.date) || b.createdAt.localeCompare(a.createdAt));
}

/** Дни со срывом. */
export function relapseDates(data: AppData, habitId: Id): Set<DateKey> {
  return new Set(
    data.abstainEvents
      .filter((event) => event.habitId === habitId && event.type === 'relapse')
      .map((event) => event.date),
  );
}

export function hasRelapseOn(data: AppData, habitId: Id, date: DateKey): boolean {
  return data.abstainEvents.some(
    (event) => event.habitId === habitId && event.type === 'relapse' && event.date === date,
  );
}

/** Чистый ли день: отсчёт уже начался и срыва не было. Сегодня — чистый, пока нет срыва. */
export function isCleanDay(habit: AbstainHabit, data: AppData, date: DateKey): boolean {
  return daysBetween(habit.startDate, date) >= 0 && !hasRelapseOn(data, habit.id, date);
}

export interface CleanStreak {
  /** Чистых дней подряд, включая сегодняшний. */
  current: number;
  best: number;
}

export function cleanStreak(habit: AbstainHabit, data: AppData, today: DateKey): CleanStreak {
  if (daysBetween(habit.startDate, today) < 0) return { current: 0, best: 0 };
  const relapses = relapseDates(data, habit.id);
  let run = 0;
  let best = 0;
  for (const day of eachDay(habit.startDate, today)) {
    run = relapses.has(day) ? 0 : run + 1;
    best = Math.max(best, run);
  }
  return { current: run, best };
}

/** Чистых дней за период [from, to]; дни до начала отсчёта не считаются. */
export function cleanDaysBetween(
  habit: AbstainHabit,
  data: AppData,
  from: DateKey,
  to: DateKey,
): number {
  const start = daysBetween(habit.startDate, from) >= 0 ? from : habit.startDate;
  if (daysBetween(start, to) < 0) return 0;
  const relapses = relapseDates(data, habit.id);
  const total = daysBetween(start, to) + 1;
  const relapseCount = [...relapses].filter(
    (day) => daysBetween(start, day) >= 0 && daysBetween(day, to) >= 0,
  ).length;
  return total - relapseCount;
}

/** Сэкономлено за чистые дни. null — стоимость не указана. */
export function moneySaved(habit: AbstainHabit, cleanDays: number): number | null {
  if (habit.costPerDay === null || habit.costPerDay <= 0) return null;
  return Math.round(habit.costPerDay * cleanDays);
}

/** Сколько раз устоял перед тягой за период. */
export function cravingsResisted(data: AppData, habitId: Id, from: DateKey, to: DateKey): number {
  return data.abstainEvents.filter(
    (event) =>
      event.habitId === habitId &&
      event.type === 'craving' &&
      daysBetween(from, event.date) >= 0 &&
      daysBetween(event.date, to) >= 0,
  ).length;
}

// ── Изменения данных ─────────────────────────────────────

export function addAbstainEvent(data: AppData, event: AbstainEvent): AppData {
  return { ...data, abstainEvents: [...data.abstainEvents, event] };
}

export function removeAbstainEvent(data: AppData, eventId: Id): AppData {
  return { ...data, abstainEvents: data.abstainEvents.filter((event) => event.id !== eventId) };
}
