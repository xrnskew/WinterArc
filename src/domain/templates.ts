import { EMPTY_HABIT_DRAFT, type HabitDraft } from './habits';

/**
 * Шаблоны привычек для онбординга. Пользователь может взять шаблон как есть
 * или поправить цель, расписание, иконку.
 */
export interface HabitTemplate {
  /** Постоянный ключ шаблона. */
  key: string;
  draft: HabitDraft;
  /** Отмечен сразу при первой арке — базовый набор. Остальные включают сами. */
  preselected: boolean;
}

const template = (
  key: string,
  preselected: boolean,
  draft: Partial<HabitDraft>,
): HabitTemplate => ({
  key,
  preselected,
  draft: { ...EMPTY_HABIT_DRAFT, ...draft },
});

export const HABIT_TEMPLATES: HabitTemplate[] = [
  // Базовый набор — отмечен по умолчанию.
  template('workout', true, {
    name: 'Тренировка',
    kind: 'check',
    icon: 'dumbbell',
    accent: 'snow',
    schedule: { type: 'timesPerWeek', times: 3 },
  }),
  template('bedtime', true, {
    name: 'Отбой до 23:00',
    kind: 'check',
    icon: 'moon',
    accent: 'frost',
  }),
  template('sleep', true, {
    name: 'Сон',
    kind: 'count',
    icon: 'bed',
    accent: 'silver',
    unit: 'ч',
    dailyTarget: 7,
  }),
  template('steps', true, {
    name: 'Шаги',
    kind: 'count',
    icon: 'footprints',
    accent: 'steel',
    unit: 'шагов',
    dailyTarget: 10000,
  }),
  // Остальные пользователь включает сам.
  template('protein', false, {
    name: 'Белок в каждом приёме пищи',
    kind: 'check',
    icon: 'utensils',
    accent: 'ash',
  }),
  template('no-sweets', false, {
    name: 'День без сладкого',
    kind: 'check',
    icon: 'candy',
    accent: 'smoke',
  }),
  template('no-fastfood', false, {
    name: 'День без фастфуда',
    kind: 'check',
    icon: 'ban',
    accent: 'snow',
  }),
  template('no-alcohol', false, {
    name: 'День без алкоголя',
    kind: 'check',
    icon: 'wine',
    accent: 'frost',
  }),
  template('phone', false, {
    name: 'Телефон не больше 3 часов',
    kind: 'check',
    icon: 'smartphone',
    accent: 'silver',
  }),
];

/** Сколько привычек советуем взять в первую арку. */
export const RECOMMENDED_HABITS = { min: 3, max: 5 };
