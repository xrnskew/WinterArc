import { EMPTY_HABIT_DRAFT, type HabitDraft } from './habits';

/**
 * Шаблоны привычек для онбординга. Пользователь может взять шаблон как есть
 * или поправить цель, расписание, иконку.
 */
export interface HabitTemplate {
  /** Постоянный ключ шаблона. */
  key: string;
  draft: HabitDraft;
}

const template = (key: string, draft: Partial<HabitDraft>): HabitTemplate => ({
  key,
  draft: { ...EMPTY_HABIT_DRAFT, ...draft },
});

export const HABIT_TEMPLATES: HabitTemplate[] = [
  template('workout', {
    name: 'Тренировка',
    kind: 'time',
    icon: 'dumbbell',
    accent: 'snow',
    schedule: { type: 'timesPerWeek', times: 4 },
    targetMinutes: 45,
    targetPeriod: 'day',
  }),
  template('sleep', {
    name: 'Отбой до 23:30',
    kind: 'check',
    icon: 'moon',
    accent: 'frost',
  }),
  template('study', {
    name: 'Учёба',
    kind: 'time',
    icon: 'graduation-cap',
    accent: 'silver',
    schedule: { type: 'weekdays', days: [1, 2, 3, 4, 5] },
    targetMinutes: 60,
    targetPeriod: 'day',
  }),
  template('reading', {
    name: 'Чтение',
    kind: 'count',
    icon: 'book-open',
    accent: 'steel',
    unit: 'страниц',
    dailyTarget: 20,
  }),
  template('water', {
    name: 'Вода',
    kind: 'count',
    icon: 'glass-water',
    accent: 'ash',
    unit: 'стаканов',
    dailyTarget: 8,
  }),
  template('cold-shower', {
    name: 'Холодный душ',
    kind: 'check',
    icon: 'shower-head',
    accent: 'smoke',
  }),
];

/** Сколько привычек советуем взять в первую арку. */
export const RECOMMENDED_HABITS = { min: 3, max: 5 };
