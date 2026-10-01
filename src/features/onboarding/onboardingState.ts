import { validateArcDraft, defaultArcDraft, type ArcDraft } from '../../domain/arc';
import { draftFromHabit, type HabitDraft } from '../../domain/habits';
import { HABIT_TEMPLATES } from '../../domain/templates';
import type { DateKey, Habit, Id } from '../../domain/types';
import { hasErrors } from '../../lib/hasErrors';

/**
 * Состояние онбординга — чистый редьюсер без React.
 * Экран хранит его через useReducer и отправляет действия (dispatch).
 */

export type OnboardingStep = 0 | 1 | 2;
export const STEP_COUNT = 3;

/** Одна строка в списке привычек на шаге 3. */
export interface HabitChoice {
  key: string;
  /** kept — из прошлой арки, template — шаблон, custom — своя. */
  source: 'kept' | 'template' | 'custom';
  /** Для kept — id уже существующей привычки. */
  habitId: Id | null;
  draft: HabitDraft;
  selected: boolean;
}

export interface OnboardingState {
  step: OnboardingStep;
  arc: ArcDraft;
  choices: HabitChoice[];
  /** Показывать ошибки формы арки (после попытки идти дальше). */
  showArcErrors: boolean;
}

export type OnboardingAction =
  | { type: 'editArc'; patch: Partial<ArcDraft> }
  | { type: 'next' }
  | { type: 'back' }
  | { type: 'toggle'; key: string }
  /** key = null — новая своя привычка с ключом newKey. */
  | { type: 'saveHabit'; key: string | null; newKey: string; draft: HabitDraft };

/**
 * Начальное состояние. Привычки прошлой арки (если есть) уже выбраны:
 * чаще всего их хотят продолжить.
 */
export function initOnboarding(today: DateKey, existingHabits: Habit[]): OnboardingState {
  const kept: HabitChoice[] = existingHabits.map((habit) => ({
    key: `kept:${habit.id}`,
    source: 'kept',
    habitId: habit.id,
    draft: draftFromHabit(habit),
    selected: true,
  }));
  // Шаблон, который уже есть среди привычек прошлой арки, второй раз не предлагаем.
  const sameName = (a: string, b: string) => a.trim().toLowerCase() === b.trim().toLowerCase();
  const fresh = HABIT_TEMPLATES.filter(
    (template) => !existingHabits.some((habit) => sameName(habit.name, template.draft.name)),
  );
  const templates: HabitChoice[] = fresh.map((template) => ({
    key: `template:${template.key}`,
    source: 'template',
    habitId: null,
    draft: template.draft,
    selected: false,
  }));
  return {
    step: 0,
    arc: defaultArcDraft(today),
    choices: [...kept, ...templates],
    showArcErrors: false,
  };
}

export function onboardingReducer(
  state: OnboardingState,
  action: OnboardingAction,
): OnboardingState {
  switch (action.type) {
    case 'editArc':
      return { ...state, arc: { ...state.arc, ...action.patch } };

    case 'next': {
      // С шага арки не пускаем дальше, пока в форме ошибки.
      if (state.step === 0 && hasErrors(validateArcDraft(state.arc))) {
        return { ...state, showArcErrors: true };
      }
      const step = Math.min(state.step + 1, STEP_COUNT - 1) as OnboardingStep;
      return { ...state, step };
    }

    case 'back':
      return { ...state, step: Math.max(state.step - 1, 0) as OnboardingStep };

    case 'toggle':
      return {
        ...state,
        choices: state.choices.map((choice) =>
          choice.key === action.key ? { ...choice, selected: !choice.selected } : choice,
        ),
      };

    case 'saveHabit': {
      if (action.key === null) {
        const custom: HabitChoice = {
          key: action.newKey,
          source: 'custom',
          habitId: null,
          draft: action.draft,
          selected: true,
        };
        return { ...state, choices: [...state.choices, custom] };
      }
      // Изменённый шаблон или своя привычка сразу становятся выбранными.
      return {
        ...state,
        choices: state.choices.map((choice) =>
          choice.key === action.key ? { ...choice, draft: action.draft, selected: true } : choice,
        ),
      };
    }
  }
}

/** Что отдать в startArc: новые черновики и id привычек, которые берём с собой. */
export function selectedHabits(state: OnboardingState): {
  newHabits: HabitDraft[];
  keptHabitIds: Id[];
} {
  const selected = state.choices.filter((choice) => choice.selected);
  return {
    newHabits: selected.filter((c) => c.source !== 'kept').map((c) => c.draft),
    keptHabitIds: selected.flatMap((c) => (c.habitId ? [c.habitId] : [])),
  };
}

export function selectedCount(state: OnboardingState): number {
  return state.choices.filter((choice) => choice.selected).length;
}
