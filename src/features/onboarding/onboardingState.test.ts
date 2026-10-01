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
  it('первый запуск: арка по умолчанию, шаблоны не выбраны', () => {
    const state = initOnboarding(TODAY, []);
    expect(state.step).toBe(0);
    expect(state.arc.endDate).toBe('2026-12-31');
    expect(state.choices).toHaveLength(HABIT_TEMPLATES.length);
    expect(selectedCount(state)).toBe(0);
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
      { type: 'toggle', key: 'template:reading' },
      { type: 'toggle', key: 'template:water' },
      { type: 'toggle', key: 'template:water' },
      { type: 'saveHabit', key: null, newKey: 'custom:1', draft: custom },
    );
    const { newHabits, keptHabitIds } = selectedHabits(state);
    expect(newHabits.map((d) => d.name)).toEqual(['Чтение', 'Растяжка']);
    expect(keptHabitIds).toEqual([]);
  });

  it('изменённый шаблон сохраняет правки и становится выбранным', () => {
    const reading = HABIT_TEMPLATES.find((t) => t.key === 'reading')!.draft;
    const state = run(initOnboarding(TODAY, []), {
      type: 'saveHabit',
      key: 'template:reading',
      newKey: 'unused',
      draft: { ...reading, dailyTarget: 30 },
    });
    expect(selectedHabits(state).newHabits[0].dailyTarget).toBe(30);
  });

  it('новая арка: привычки прошлой выбраны и передаются по id', () => {
    const old = habitFromDraft(
      { ...EMPTY_HABIT_DRAFT, name: 'Зарядка' },
      'habit-1',
      '2026-10-01T08:00:00.000Z',
      TODAY,
    );
    const state = initOnboarding('2027-01-02', [old]);
    expect(selectedHabits(state)).toEqual({ newHabits: [], keptHabitIds: ['habit-1'] });
  });

  it('шаблоны с тем же названием, что у привычек прошлой арки, не повторяются', () => {
    const reading = habitFromDraft(
      { ...EMPTY_HABIT_DRAFT, name: 'чтение ' },
      'habit-2',
      '2026-10-01T08:00:00.000Z',
      TODAY,
    );
    const state = initOnboarding('2027-01-02', [reading]);
    const names = state.choices.map((c) => `${c.source}:${c.draft.name.trim()}`);
    expect(names).toContain('kept:чтение');
    expect(names).not.toContain('template:Чтение');
  });
});
