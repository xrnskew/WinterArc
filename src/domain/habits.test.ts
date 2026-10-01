import { describe, expect, it } from 'vitest';
import {
  describeSchedule,
  describeTarget,
  draftFromHabit,
  EMPTY_HABIT_DRAFT,
  formatMinutes,
  habitFromDraft,
  validateHabitDraft,
  type HabitDraft,
} from './habits';
import { HABIT_TEMPLATES } from './templates';
import { ICON_NAMES } from './icons';

const NOW = '2026-10-01T08:00:00.000Z';
const draft = (patch: Partial<HabitDraft>): HabitDraft => ({
  ...EMPTY_HABIT_DRAFT,
  name: 'Привычка',
  ...patch,
});

describe('черновик → привычка', () => {
  it('да/нет не тащит лишних полей', () => {
    const habit = habitFromDraft(draft({ kind: 'check' }), 'h1', NOW);
    expect(habit).toEqual({
      id: 'h1',
      name: 'Привычка',
      kind: 'check',
      icon: 'target',
      accent: 'snow',
      schedule: { type: 'daily' },
      createdAt: NOW,
      archivedAt: null,
    });
  });

  it('количество — с единицей и целью', () => {
    const habit = habitFromDraft(
      draft({ kind: 'count', unit: ' страниц ', dailyTarget: 20 }),
      'h1',
      NOW,
    );
    expect(habit).toMatchObject({ kind: 'count', unit: 'страниц', dailyTarget: 20 });
  });

  it('дни недели сортируются и не повторяются', () => {
    const habit = habitFromDraft(
      draft({ schedule: { type: 'weekdays', days: [5, 1, 3, 1] } }),
      'h1',
      NOW,
    );
    expect(habit.schedule).toEqual({ type: 'weekdays', days: [1, 3, 5] });
  });

  it('привычка → черновик → та же привычка', () => {
    const habit = habitFromDraft(
      draft({ kind: 'time', targetMinutes: 90, targetPeriod: 'week' }),
      'h1',
      NOW,
    );
    expect(habitFromDraft(draftFromHabit(habit), 'h1', NOW)).toEqual(habit);
  });
});

describe('проверка формы привычки', () => {
  it('нужно название', () => {
    expect(validateHabitDraft(draft({ name: ' ' })).name).toBeDefined();
  });

  it('цель количества и времени — больше нуля', () => {
    expect(validateHabitDraft(draft({ kind: 'count', dailyTarget: 0 })).target).toBeDefined();
    expect(validateHabitDraft(draft({ kind: 'time', targetMinutes: NaN })).target).toBeDefined();
  });

  it('расписание по дням — хотя бы один день', () => {
    expect(
      validateHabitDraft(draft({ schedule: { type: 'weekdays', days: [] } })).schedule,
    ).toBeDefined();
    expect(
      validateHabitDraft(draft({ schedule: { type: 'timesPerWeek', times: 8 } })).schedule,
    ).toBeDefined();
  });

  it('все шаблоны проходят проверку и используют существующие иконки', () => {
    for (const template of HABIT_TEMPLATES) {
      expect(validateHabitDraft(template.draft), template.key).toEqual({});
      expect(ICON_NAMES).toContain(template.draft.icon);
    }
  });
});

describe('подписи', () => {
  it('минуты по-человечески', () => {
    expect(formatMinutes(45)).toBe('45 мин');
    expect(formatMinutes(60)).toBe('1 ч');
    expect(formatMinutes(90)).toBe('1 ч 30 мин');
  });

  it('расписание', () => {
    expect(describeSchedule({ type: 'daily' })).toBe('каждый день');
    expect(describeSchedule({ type: 'weekdays', days: [1, 2, 3, 4, 5] })).toBe('по будням');
    expect(describeSchedule({ type: 'weekdays', days: [6, 7] })).toBe('по выходным');
    expect(describeSchedule({ type: 'weekdays', days: [1, 3, 5] })).toBe('пн, ср, пт');
    expect(describeSchedule({ type: 'timesPerWeek', times: 4 })).toBe('4 раза в неделю');
    expect(describeSchedule({ type: 'timesPerWeek', times: 5 })).toBe('5 раз в неделю');
  });

  it('цель', () => {
    expect(describeTarget(draft({ kind: 'count', unit: 'страниц', dailyTarget: 20 }))).toBe(
      '20 страниц',
    );
    expect(describeTarget(draft({ kind: 'time', targetMinutes: 180, targetPeriod: 'week' }))).toBe(
      '3 ч в неделю',
    );
  });
});
