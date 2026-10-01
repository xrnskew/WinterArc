import {
  addDays as addDaysToDate,
  differenceInCalendarDays,
  format,
  isValid,
  parseISO,
  startOfISOWeek,
} from 'date-fns';
import { ru } from 'date-fns/locale';
import type { DateKey, Timestamp, Weekday } from './types';

/**
 * Работа с датами. Внутри приложения дата дня — строка DateKey "2026-10-01"
 * в местном времени. Так проще хранить, сравнивать и использовать как ключ.
 * Арифметику делаем через date-fns: она правильно считает календарные дни,
 * в том числе при переходе на летнее/зимнее время.
 */

const KEY_FORMAT = 'yyyy-MM-dd';

/** Date → "2026-10-01" (по местному времени). */
export function toDateKey(date: Date): DateKey {
  return format(date, KEY_FORMAT);
}

/** "2026-10-01" → Date на полночь по местному времени. */
export function fromDateKey(key: DateKey): Date {
  return parseISO(key);
}

/** Строка — правильная дата вида "2026-10-01"? */
export function isDateKey(value: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(value) && isValid(parseISO(value));
}

/** Сегодня. */
export function todayKey(now: Date = new Date()): DateKey {
  return toDateKey(now);
}

/** Текущий момент для полей createdAt и т. п. */
export function nowTimestamp(now: Date = new Date()): Timestamp {
  return now.toISOString();
}

export function addDays(key: DateKey, days: number): DateKey {
  return toDateKey(addDaysToDate(fromDateKey(key), days));
}

/** Сколько календарных дней от a до b: daysBetween("10-01", "10-03") = 2. */
export function daysBetween(a: DateKey, b: DateKey): number {
  return differenceInCalendarDays(fromDateKey(b), fromDateKey(a));
}

/** День недели: 1 = понедельник … 7 = воскресенье. */
export function weekdayOf(key: DateKey): Weekday {
  const day = fromDateKey(key).getDay(); // 0 = воскресенье
  return (day === 0 ? 7 : day) as Weekday;
}

/** Понедельник недели, в которую входит день. */
export function weekStart(key: DateKey): DateKey {
  return toDateKey(startOfISOWeek(fromDateKey(key)));
}

/** Все дни от start до end включительно. */
export function eachDay(start: DateKey, end: DateKey): DateKey[] {
  const count = daysBetween(start, end) + 1;
  return Array.from({ length: Math.max(count, 0) }, (_, i) => addDays(start, i));
}

/** "1 октября" */
export function formatDayMonth(key: DateKey): string {
  return format(fromDateKey(key), 'd MMMM', { locale: ru });
}

/** "1 октября 2026" */
export function formatFullDate(key: DateKey): string {
  return format(fromDateKey(key), 'd MMMM yyyy', { locale: ru });
}

/** "1 окт – 31 дек 2026"; если годы разные — год у обеих дат. */
export function formatRange(start: DateKey, end: DateKey): string {
  const a = fromDateKey(start);
  const b = fromDateKey(end);
  const short = 'd MMM';
  if (a.getFullYear() === b.getFullYear()) {
    return `${format(a, short, { locale: ru })} – ${format(b, `${short} yyyy`, { locale: ru })}`;
  }
  return `${format(a, `${short} yyyy`, { locale: ru })} – ${format(b, `${short} yyyy`, { locale: ru })}`;
}

/** "Сегодня, 1 октября", "Вчера, 30 сентября", "Понедельник, 28 сентября". */
export function formatDayLabel(key: DateKey, today: DateKey): string {
  const diff = daysBetween(key, today);
  const dayMonth = formatDayMonth(key);
  if (diff === 0) return `Сегодня, ${dayMonth}`;
  if (diff === 1) return `Вчера, ${dayMonth}`;
  const weekday = format(fromDateKey(key), 'EEEE', { locale: ru });
  return `${weekday[0].toUpperCase()}${weekday.slice(1)}, ${dayMonth}`;
}
