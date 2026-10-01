import type { AppData, DateKey, DayEntry, Id, RatingScale } from './types';

/** Оценки дня (шкалы 1–10) и заметка. */

export const RATING_MIN = 1;
export const RATING_MAX = 10;

const EMPTY_DAY: DayEntry = { ratings: {}, note: '' };

export function getDayEntry(data: AppData, date: DateKey): DayEntry {
  return data.days[date] ?? EMPTY_DAY;
}

/** Шкалы, которые сейчас используются. */
export function activeScales(data: AppData): RatingScale[] {
  return data.ratingScales.filter((scale) => scale.archivedAt === null);
}

/** Записывает день; пустой день (без оценок и заметки) удаляется из данных. */
function putDay(data: AppData, date: DateKey, entry: DayEntry): AppData {
  const days = { ...data.days };
  if (Object.keys(entry.ratings).length === 0 && entry.note.trim() === '') delete days[date];
  else days[date] = entry;
  return { ...data, days };
}

/** Поставить оценку 1–10 или убрать её (null). */
export function setRating(
  data: AppData,
  date: DateKey,
  scaleId: Id,
  value: number | null,
): AppData {
  const entry = getDayEntry(data, date);
  const ratings = { ...entry.ratings };
  if (value === null) delete ratings[scaleId];
  else ratings[scaleId] = Math.min(Math.max(Math.round(value), RATING_MIN), RATING_MAX);
  return putDay(data, date, { ...entry, ratings });
}

export function setDayNote(data: AppData, date: DateKey, note: string): AppData {
  return putDay(data, date, { ...getDayEntry(data, date), note });
}

// ── Ряды оценок ──────────────────────────────────────────

export interface RatingPoint {
  date: DateKey;
  /** Оценка 1–10; null — в этот день не ставил. */
  value: number | null;
}

/** Оценки по шкале за каждый день периода. */
export function ratingSeries(data: AppData, scaleId: Id, days: DateKey[]): RatingPoint[] {
  return days.map((date) => ({ date, value: data.days[date]?.ratings[scaleId] ?? null }));
}

/** Средняя оценка по дням, где она есть; null — оценок нет. */
export function averageRating(points: RatingPoint[]): number | null {
  const values = points.flatMap((point) => (point.value === null ? [] : [point.value]));
  if (values.length === 0) return null;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}
