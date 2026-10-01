import { describe, expect, it } from 'vitest';
import { EMPTY_HABIT_DRAFT, habitFromDraft } from '../../domain/habits';
import { HABIT_TEMPLATES } from '../../domain/templates';
import {
  initOnboarding,
  onboardingReducer,
  selectedCount,
  selectedHabits,
  type OnboardingAction,
  type OnboardingState,
} from './onboardingState';

const TODAY = '2026-10-01';
const run = (state: OnboardingState, ...actions: OnboardingAction[]) =>
  actions.reduce(onboardingReducer, state);

describe('онбординг', () => {
  it('первый запуск: арка по умолчанию, отмечены первые четыре шаблона', () => {
    const state = initOnboarding(TODAY, []);
    expect(state.step).toBe(0);
    expect(state.arc.endDate).toBe('2026-12-31');
    expect(state.choices).toHaveLength(HABIT_TEMPLATES.length);
    expect(selectedCount(state)).toBe(4);
    expect(selectedHabits(state).newHabits.map((d) => d.name)).toEqual([
      'Тренировка',
      'Отбой до 23:00',
      'Сон',
      'Шаги',
    ]);
  });

  it('с ошибкой в арке дальше не пускает и показывает ошибки', () => {
    const state = run(
      initOnboarding(TODAY, []),
      { type: 'editArc', patch: { name: '' } },
      { type: 'next' },
    );
    expect(state.step).toBe(0);
    expect(state.showArcErrors).toBe(true);
  });

  it('шаги вперёд и назад в границах', () => {
    const start = initOnboarding(TODAY, []);
    expect(run(start, { type: 'next' }, { type: 'next' }, { type: 'next' }).step).toBe(2);
    expect(run(start, { type: 'back' }).step).toBe(0);
  });

  it('выбор шаблонов и своя привычка попадают в результат', () => {
    const custom = { ...EMPTY_HABIT_DRAFT, name: 'Растяжка' };
    const state = run(
      initOnboarding(TODAY, []),
      // Снять «Сон» и «Шаги», включить «День без сладкого», дважды переключить «Белок».
      { type: 'toggle', key: 'template:sleep' },
      { type: 'toggle', key: 'template:steps' },
      { type: 'toggle', key: 'template:no-sweets' },
      { type: 'toggle', key: 'template:protein' },
      { type: 'toggle', key: 'template:protein' },
      { type: 'saveHabit', key: null, newKey: 'custom:1', draft: custom },
    );
    const { newHabits, keptHabitIds } = selectedHabits(state);
    expect(newHabits.map((d) => d.name)).toEqual([
      'Тренировка',
      'Отбой до 23:00',
      'День без сладкого',
      'Растяжка',
    ]);
    expect(keptHabitIds).toEqual([]);
  });

  it('изменённый шаблон сохраняет правки и становится выбранным', () => {
    const steps = HABIT_TEMPLATES.find((t) => t.key === 'steps')!.draft;
    const state = run(
      initOnboarding(TODAY, []),
      { type: 'toggle', key: 'template:steps' },
      {
        type: 'saveHabit',
        key: 'template:steps',
        newKey: 'unused',
        draft: { ...steps, dailyTarget: 8000 },
      },
    );
    const saved = selectedHabits(state).newHabits.find((d) => d.name === 'Шаги');
    expect(saved?.dailyTarget).toBe(8000);
  });

  it('новая арка: привычки прошлой выбраны и передаются по id', () => {
    const old = habitFromDraft(
      { ...EMPTY_HABIT_DRAFT, name: 'Зарядка' },
      'habit-1',
      '2026-10-01T08:00:00.000Z',
    );
    const state = initOnboarding('2027-01-02', [old]);
    // В следующей арке шаблоны не отмечены: выбраны только привычки прошлой.
    expect(selectedHabits(state)).toEqual({ newHabits: [], keptHabitIds: ['habit-1'] });
  });

  it('шаблоны с тем же названием, что у привычек прошлой арки, не повторяются', () => {
    const sleep = habitFromDraft(
      { ...EMPTY_HABIT_DRAFT, name: 'сон ' },
      'habit-2',
      '2026-10-01T08:00:00.000Z',
    );
    const state = initOnboarding('2027-01-02', [sleep]);
    const names = state.choices.map((c) => `${c.source}:${c.draft.name.trim()}`);
    expect(names).toContain('kept:сон');
    expect(names).not.toContain('template:Сон');
  });
});
