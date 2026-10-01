/**
 * Модель данных приложения.
 *
 * Принцип: храним только факты (что сделал, когда, сколько).
 * Серии, индекс дисциплины, прогнозы и итоги вычисляются в domain/*.ts,
 * поэтому рассинхрона не бывает.
 *
 * ВАЖНО: эти типы описывают то, что лежит в localStorage. Если меняешь
 * форму данных — подними CURRENT_VERSION в storage/schema.ts и добавь
 * шаг в storage/migrations.ts, иначе старые данные пользователя сломаются.
 */

import type { IconName } from './icons';

export type { IconName };

// ── Базовые типы ─────────────────────────────────────────

/** Уникальный идентификатор (crypto.randomUUID). */
export type Id = string;
/** Локальная дата без времени: "2026-10-01". */
export type DateKey = string;
/** Момент времени в ISO: "2026-10-01T21:15:00.000Z". */
export type Timestamp = string;
/** День недели: 1 = понедельник … 7 = воскресенье. */
export type Weekday = 1 | 2 | 3 | 4 | 5 | 6 | 7;

// ── Корень: ровно это лежит в localStorage ───────────────

export interface AppData {
  /** Версия схемы данных — по ней работают миграции. */
  version: number;
  settings: Settings;
  /** Текущая арка. null — арки нет, показываем онбординг. */
  activeArcId: Id | null;
  arcs: Arc[];
  habits: Habit[];
  habitLogs: HabitLogs;
  ratingScales: RatingScale[];
  /** Оценки и заметка за день. */
  days: Record<DateKey, DayEntry>;
  goals: Goal[];
  tasks: Task[];
  /** Обзоры недель. Ключ — понедельник недели. */
  weeklyReviews: Record<DateKey, WeeklyReview>;
  achievements: UnlockedAchievement[];
  /** Виджеты командного центра. Порядок массива = порядок на экране. */
  dashboard: WidgetInstance[];
}

// ── Арка ─────────────────────────────────────────────────

export interface Arc {
  id: Id;
  /** "Winter Arc 2026" */
  name: string;
  /** Зачем я это делаю — показывается в трудные дни. */
  why: string;
  startDate: DateKey;
  /** Последний день арки (включительно). */
  endDate: DateKey;
  /** Привычки этой арки, в порядке показа. */
  habitIds: Id[];
  createdAt: Timestamp;
  archivedAt: Timestamp | null;
}

// ── Привычки ─────────────────────────────────────────────

export type Schedule =
  | { type: 'daily' }
  | { type: 'weekdays'; days: Weekday[] }
  | { type: 'timesPerWeek'; times: number };

/** Оттенок привычки. Хранится ключ, а не цвет: как он выглядит, решает тема. */
export type AccentKey = 'snow' | 'frost' | 'silver' | 'steel' | 'ash' | 'smoke';

export type HabitKind = 'check' | 'count' | 'time';

interface HabitBase {
  id: Id;
  name: string;
  icon: IconName;
  accent: AccentKey;
  schedule: Schedule;
  createdAt: Timestamp;
  archivedAt: Timestamp | null;
}

/** Да/нет: сделал или нет. */
export interface CheckHabit extends HabitBase {
  kind: 'check';
}

/** Количество с дневной целью: 20 страниц, 8 стаканов. */
export interface CountHabit extends HabitBase {
  kind: 'count';
  /** "страниц", "стаканов" */
  unit: string;
  dailyTarget: number;
}

/** Время в минутах с дневной или недельной целью. */
export interface TimeHabit extends HabitBase {
  kind: 'time';
  targetMinutes: number;
  targetPeriod: 'day' | 'week';
}

export type Habit = CheckHabit | CountHabit | TimeHabit;

/**
 * habitLogs[habitId][date] = значение за день. Нет записи — значит 0.
 * check → 1, count → штуки, time → минуты.
 */
export type HabitLogs = Record<Id, Record<DateKey, number>>;

// ── Оценки дня ───────────────────────────────────────────

export interface RatingScale {
  id: Id;
  name: string;
  icon: IconName;
  archivedAt: Timestamp | null;
}

export interface DayEntry {
  /** ratings[scaleId] = 1…10 */
  ratings: Record<Id, number>;
  note: string;
}

// ── Цели и задачи ────────────────────────────────────────

interface GoalBase {
  id: Id;
  title: string;
  deadline: DateKey | null;
  /** Цель может жить и вне арки. */
  arcId: Id | null;
  createdAt: Timestamp;
  completedAt: Timestamp | null;
  archivedAt: Timestamp | null;
}

export interface StepsGoal extends GoalBase {
  kind: 'steps';
  steps: { id: Id; title: string; doneAt: Timestamp | null }[];
}

export interface NumericGoal extends GoalBase {
  kind: 'numeric';
  /** "₽", "кг", "км" */
  unit: string;
  startValue: number;
  /** Может быть меньше старта (вес вниз). */
  targetValue: number;
  /** add — пополнения (₽, км), set — замеры (вес). */
  entryMode: 'add' | 'set';
  entries: { id: Id; date: DateKey; value: number; note: string }[];
}

export type Goal = StepsGoal | NumericGoal;

export interface Task {
  id: Id;
  title: string;
  goalId: Id | null;
  priority: 'low' | 'medium' | 'high';
  deadline: DateKey | null;
  doneAt: Timestamp | null;
  createdAt: Timestamp;
}

// ── Обзор недели, достижения, виджеты ────────────────────

export interface WeeklyReview {
  wins: string;
  misses: string;
  nextFocus: string;
  updatedAt: Timestamp;
}

export interface UnlockedAchievement {
  /** "streak-30:<habitId>" */
  id: string;
  unlockedAt: Timestamp;
}

/**
 * Виджеты командного центра. Отсчёт и прогресс арки — не виджеты:
 * они всегда стоят сверху экрана.
 */
export type WidgetType =
  'discipline' | 'today' | 'week' | 'streak' | 'ratingTrend' | 'heatmap' | 'goal' | 'tasks' | 'why';

export type WidgetSize = 'half' | 'full';

export interface WidgetInstance {
  id: Id;
  type: WidgetType;
  /** half — половина ширины, full — вся ширина. */
  size: WidgetSize;
  /** Настройка конкретного виджета. */
  habitId?: Id;
  goalId?: Id;
  scaleId?: Id;
}

// ── Настройки ────────────────────────────────────────────

/** Интенсивность метели: выкл / лёгкий снег / метель / буран. */
export type SnowIntensity = 'off' | 'light' | 'snow' | 'blizzard';

/** auto — определить по устройству; full — шейдер; lite — CSS-снежинки. */
export type PerformanceMode = 'auto' | 'full' | 'lite';

export interface Settings {
  themeId: 'winter';
  snow: SnowIntensity;
  performance: PerformanceMode;
}
