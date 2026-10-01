import { plural } from '../lib/plural';
import type {
  AccentKey,
  AppData,
  Arc,
  Habit,
  HabitKind,
  IconName,
  Id,
  Schedule,
  Timestamp,
  Weekday,
} from './types';

/**
 * Привычки: черновик (форма) → привычка, проверка формы, изменения в данных, подписи.
 * Выполнение и серии — в progress.ts.
 */

// ── Черновик привычки (форма) ────────────────────────────

/**
 * Всё, что можно ввести в форме привычки. Поля всех трёх типов лежат
 * рядом: при переключении типа введённое не теряется. Лишние поля
 * отбрасывает habitFromDraft.
 */
export interface HabitDraft {
  name: string;
  kind: HabitKind;
  icon: IconName;
  accent: AccentKey;
  schedule: Schedule;
  /** count */
  unit: string;
  dailyTarget: number;
  /** time */
  targetMinutes: number;
  targetPeriod: 'day' | 'week';
}

export const EMPTY_HABIT_DRAFT: HabitDraft = {
  name: '',
  kind: 'check',
  icon: 'target',
  accent: 'snow',
  schedule: { type: 'daily' },
  unit: 'раз',
  dailyTarget: 10,
  targetMinutes: 30,
  targetPeriod: 'day',
};

export const HABIT_NAME_MAX = 40;

export interface HabitDraftErrors {
  name?: string;
  target?: string;
  schedule?: string;
  cost?: string;
}

const isPositive = (value: number) => Number.isFinite(value) && value > 0;

/** Проверяет форму привычки. Пустой объект — ошибок нет. */
export function validateHabitDraft(draft: HabitDraft): HabitDraftErrors {
  const errors: HabitDraftErrors = {};
  const name = draft.name.trim();
  if (!name) errors.name = 'Назови привычку.';
  else if (name.length > HABIT_NAME_MAX) errors.name = `Не длиннее ${HABIT_NAME_MAX} символов.`;

  if (draft.kind === 'count') {
    if (!isPositive(draft.dailyTarget)) errors.target = 'Цель на день — больше нуля.';
    else if (!draft.unit.trim()) errors.target = 'Укажи, что считаем: страницы, стаканы…';
  }
  if (draft.kind === 'time' && !isPositive(draft.targetMinutes)) {
    errors.target = 'Цель по времени — больше нуля минут.';
  }

  const { schedule } = draft;
  if (schedule.type === 'weekdays' && schedule.days.length === 0) {
    errors.schedule = 'Выбери хотя бы один день.';
  }
  if (schedule.type === 'timesPerWeek' && !(schedule.times >= 1 && schedule.times <= 7)) {
    errors.schedule = 'От 1 до 7 раз в неделю.';
  }
  return errors;
}

/** Превращает черновик в привычку нужного типа. */
export function habitFromDraft(draft: HabitDraft, id: Id, now: Timestamp): Habit {
  const base = {
    id,
    name: draft.name.trim(),
    icon: draft.icon,
    accent: draft.accent,
    schedule: normalizeSchedule(draft.schedule),
    createdAt: now,
    archivedAt: null,
  };

  switch (draft.kind) {
    case 'check':
      return { ...base, kind: 'check' };
    case 'count':
      return { ...base, kind: 'count', unit: draft.unit.trim(), dailyTarget: draft.dailyTarget };
    case 'time':
      return {
        ...base,
        kind: 'time',
        targetMinutes: draft.targetMinutes,
        targetPeriod: draft.targetPeriod,
      };
  }
}

/** Обратно: привычка → черновик (для формы редактирования). */
export function draftFromHabit(habit: Habit): HabitDraft {
  return {
    ...EMPTY_HABIT_DRAFT,
    name: habit.name,
    kind: habit.kind,
    icon: habit.icon,
    accent: habit.accent,
    schedule: habit.schedule,
    ...(habit.kind === 'count' && { unit: habit.unit, dailyTarget: habit.dailyTarget }),
    ...(habit.kind === 'time' && {
      targetMinutes: habit.targetMinutes,
      targetPeriod: habit.targetPeriod,
    }),
  };
}

/** Дни недели по порядку, без повторов. */
function normalizeSchedule(schedule: Schedule): Schedule {
  if (schedule.type !== 'weekdays') return schedule;
  const days = [...new Set(schedule.days)].sort((a, b) => a - b) as Weekday[];
  return { type: 'weekdays', days };
}

/** Привычки, которые не в архиве. */
export function activeHabits(habits: Habit[]): Habit[] {
  return habits.filter((habit) => habit.archivedAt === null);
}

export function getHabit(data: AppData, habitId: Id): Habit | null {
  return data.habits.find((habit) => habit.id === habitId) ?? null;
}

/** Привычки арки в порядке показа, без архивных. */
export function arcHabits(data: AppData, arc: Arc): Habit[] {
  return arc.habitIds.flatMap((id) => {
    const habit = getHabit(data, id);
    return habit && habit.archivedAt === null ? [habit] : [];
  });
}

// ── Изменения данных ─────────────────────────────────────

/** Добавляет привычку и ставит её в конец списка текущей арки. */
export function addHabit(data: AppData, habit: Habit): AppData {
  return {
    ...data,
    habits: [...data.habits, habit],
    arcs: data.arcs.map((arc) =>
      arc.id === data.activeArcId ? { ...arc, habitIds: [...arc.habitIds, habit.id] } : arc,
    ),
  };
}

/**
 * Меняет привычку по черновику. Тип не меняется: история записана
 * в формате этого типа (штуки, минуты…). id и дата создания тоже остаются прежними.
 */
export function updateHabit(data: AppData, habitId: Id, draft: HabitDraft): AppData {
  return {
    ...data,
    habits: data.habits.map((habit) => {
      if (habit.id !== habitId) return habit;
      const updated = habitFromDraft({ ...draft, kind: habit.kind }, habit.id, habit.createdAt);
      return { ...updated, archivedAt: habit.archivedAt };
    }),
  };
}

/** Убирает привычку в архив: из списков пропадает, история и статистика остаются. */
export function archiveHabit(data: AppData, habitId: Id, now: Timestamp): AppData {
  return {
    ...data,
    habits: data.habits.map((habit) =>
      habit.id === habitId ? { ...habit, archivedAt: now } : habit,
    ),
  };
}

// ── Подписи ──────────────────────────────────────────────

export const HABIT_KIND_LABELS: Record<HabitKind, string> = {
  check: 'Да / нет',
  count: 'Количество',
  time: 'Время',
};

export const WEEKDAY_SHORT: Record<Weekday, string> = {
  1: 'пн',
  2: 'вт',
  3: 'ср',
  4: 'чт',
  5: 'пт',
  6: 'сб',
  7: 'вс',
};

/** "45 мин", "1 ч", "1 ч 30 мин" */
export function formatMinutes(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  if (hours === 0) return `${rest} мин`;
  if (rest === 0) return `${hours} ч`;
  return `${hours} ч ${rest} мин`;
}

/** "каждый день", "пн, ср, пт", "4 раза в неделю" */
export function describeSchedule(schedule: Schedule): string {
  switch (schedule.type) {
    case 'daily':
      return 'каждый день';
    case 'weekdays':
      if (schedule.days.length === 5 && schedule.days.every((d) => d <= 5)) return 'по будням';
      if (schedule.days.length === 2 && schedule.days.every((d) => d >= 6)) return 'по выходным';
      return schedule.days.map((day) => WEEKDAY_SHORT[day]).join(', ');
    case 'timesPerWeek':
      return `${schedule.times} ${plural(schedule.times, 'раз', 'раза', 'раз')} в неделю`;
  }
}

/**
 * Привычка одной строкой для списков:
 * "20 страниц, каждый день", "45 мин в день, 4 раза в неделю".
 */
export function describeHabit(draft: HabitDraft): string {
  return `${describeTarget(draft)}, ${describeSchedule(draft.schedule)}`;
}

/** Цель привычки одной строкой: "20 страниц", "45 мин в день", "сделал или нет". */
export function describeTarget(
  habit: Pick<HabitDraft, 'kind' | 'unit' | 'dailyTarget' | 'targetMinutes' | 'targetPeriod'>,
): string {
  switch (habit.kind) {
    case 'check':
      return 'сделал или нет';
    case 'count':
      return `${habit.dailyTarget} ${habit.unit}`;
    case 'time':
      return `${formatMinutes(habit.targetMinutes)} в ${habit.targetPeriod === 'day' ? 'день' : 'неделю'}`;
  }
}
