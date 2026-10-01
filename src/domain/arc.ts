import { addDays, daysBetween, eachDay, isDateKey, weekdayOf } from './dates';
import type { AppData, Arc, DateKey, Habit, Id, Timestamp, Weekday } from './types';

/**
 * Арка — период работы над собой с началом и концом.
 * Здесь: расчёты по датам арки и изменения данных (начать, изменить, завершить).
 * Все функции чистые: получают данные и «сегодня», возвращают результат.
 */

// ── Расчёты ──────────────────────────────────────────────

export type ArcPhase = 'upcoming' | 'active' | 'finished';

/** Длина арки в днях, включая первый и последний. */
export function arcLength(arc: Pick<Arc, 'startDate' | 'endDate'>): number {
  return daysBetween(arc.startDate, arc.endDate) + 1;
}

/** Арка ещё не началась, идёт или закончилась. */
export function arcPhase(arc: Pick<Arc, 'startDate' | 'endDate'>, today: DateKey): ArcPhase {
  if (daysBetween(arc.startDate, today) < 0) return 'upcoming';
  if (daysBetween(today, arc.endDate) < 0) return 'finished';
  return 'active';
}

/** Какой сегодня день арки: 1…длина. До начала — 0, после конца — длина. */
export function arcDayNumber(arc: Pick<Arc, 'startDate' | 'endDate'>, today: DateKey): number {
  const day = daysBetween(arc.startDate, today) + 1;
  return Math.min(Math.max(day, 0), arcLength(arc));
}

/** Сколько дней осталось после сегодняшнего. В последний день — 0. */
export function daysUntilEnd(arc: Pick<Arc, 'endDate'>, today: DateKey): number {
  return Math.max(daysBetween(today, arc.endDate), 0);
}

/** Сколько дней до начала арки. Если уже началась — 0. */
export function daysUntilStart(arc: Pick<Arc, 'startDate'>, today: DateKey): number {
  return Math.max(daysBetween(today, arc.startDate), 0);
}

/** Доля прожитых дней (без сегодняшнего): 0 в первый день, 1 после конца. */
export function arcProgress(arc: Pick<Arc, 'startDate' | 'endDate'>, today: DateKey): number {
  const phase = arcPhase(arc, today);
  if (phase === 'upcoming') return 0;
  if (phase === 'finished') return 1;
  return (arcDayNumber(arc, today) - 1) / arcLength(arc);
}

export interface ArcDay {
  date: DateKey;
  weekday: Weekday;
  status: 'past' | 'today' | 'future';
}

/** Все дни арки с отметкой: прошёл, сегодня или впереди. */
export function arcDays(arc: Pick<Arc, 'startDate' | 'endDate'>, today: DateKey): ArcDay[] {
  return eachDay(arc.startDate, arc.endDate).map((date) => {
    const diff = daysBetween(today, date);
    return {
      date,
      weekday: weekdayOf(date),
      status: diff < 0 ? 'past' : diff === 0 ? 'today' : 'future',
    };
  });
}

/** Текущая арка или null. */
export function getActiveArc(data: AppData): Arc | null {
  return data.arcs.find((arc) => arc.id === data.activeArcId) ?? null;
}

/** Прошлые (завершённые) арки, новые сверху. */
export function getArchivedArcs(data: AppData): Arc[] {
  return data.arcs
    .filter((arc) => arc.archivedAt !== null)
    .sort((a, b) => b.startDate.localeCompare(a.startDate));
}

// ── Черновик арки (форма) ────────────────────────────────

export interface ArcDraft {
  name: string;
  startDate: DateKey;
  endDate: DateKey;
  why: string;
}

export const ARC_MIN_DAYS = 7;
export const ARC_MAX_DAYS = 366;
export const ARC_NAME_MAX = 60;

/**
 * Арка по умолчанию — до 31 декабря.
 * С 1 октября по 31 декабря начинаем сегодня; в остальное время года
 * предлагаем ближайший сезон 1 октября – 31 декабря (даты можно поменять).
 */
export function defaultArcDraft(today: DateKey): ArcDraft {
  const year = Number(today.slice(0, 4));
  const seasonStart = `${year}-10-01`;
  const seasonEnd = `${year}-12-31`;
  const inSeason = daysBetween(seasonStart, today) >= 0;
  const startDate = inSeason ? today : seasonStart;

  return {
    name: `Winter Arc ${year}`,
    startDate,
    // Если сегодня последние дни декабря — даём хотя бы минимальную длину.
    endDate:
      daysBetween(startDate, seasonEnd) + 1 >= ARC_MIN_DAYS
        ? seasonEnd
        : addDays(startDate, ARC_MIN_DAYS - 1),
    why: '',
  };
}

export interface ArcDraftErrors {
  name?: string;
  dates?: string;
}

/** Проверяет форму арки. Пустой объект — ошибок нет. */
export function validateArcDraft(draft: ArcDraft): ArcDraftErrors {
  const errors: ArcDraftErrors = {};
  const name = draft.name.trim();
  if (!name) errors.name = 'Назови арку — например, Winter Arc 2026.';
  else if (name.length > ARC_NAME_MAX) errors.name = `Не длиннее ${ARC_NAME_MAX} символов.`;

  if (!isDateKey(draft.startDate) || !isDateKey(draft.endDate)) {
    errors.dates = 'Укажи даты начала и конца.';
  } else {
    const length = arcLength(draft);
    if (length < ARC_MIN_DAYS) errors.dates = `Арка — минимум ${ARC_MIN_DAYS} дней.`;
    else if (length > ARC_MAX_DAYS) errors.dates = 'Арка — не дольше года.';
  }
  return errors;
}

// ── Изменения данных ─────────────────────────────────────

export interface StartArcInput {
  draft: ArcDraft;
  /** Новые привычки (из шаблонов или свои). */
  newHabits: Habit[];
  /** Привычки прошлой арки, которые берём с собой. */
  keptHabitIds: Id[];
}

/** Создаёт арку, добавляет новые привычки и делает арку текущей. */
export function startArc(
  data: AppData,
  { draft, newHabits, keptHabitIds }: StartArcInput,
  arcId: Id,
  now: Timestamp,
): AppData {
  const arc: Arc = {
    id: arcId,
    name: draft.name.trim(),
    why: draft.why.trim(),
    startDate: draft.startDate,
    endDate: draft.endDate,
    habitIds: [...keptHabitIds, ...newHabits.map((habit) => habit.id)],
    createdAt: now,
    archivedAt: null,
  };
  return {
    ...data,
    arcs: [...data.arcs, arc],
    habits: [...data.habits, ...newHabits],
    activeArcId: arc.id,
  };
}

/** Меняет название, даты и «зачем» у арки. */
export function updateArc(data: AppData, arcId: Id, draft: ArcDraft): AppData {
  return {
    ...data,
    arcs: data.arcs.map((arc) =>
      arc.id === arcId
        ? {
            ...arc,
            name: draft.name.trim(),
            why: draft.why.trim(),
            startDate: draft.startDate,
            endDate: draft.endDate,
          }
        : arc,
    ),
  };
}

/**
 * Завершает текущую арку: она уходит в историю, вся статистика остаётся.
 * Привычки не удаляются — их можно взять в следующую арку.
 */
export function archiveActiveArc(data: AppData, now: Timestamp): AppData {
  if (!data.activeArcId) return data;
  return {
    ...data,
    activeArcId: null,
    arcs: data.arcs.map((arc) => (arc.id === data.activeArcId ? { ...arc, archivedAt: now } : arc)),
  };
}
