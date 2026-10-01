import { useEffect, useReducer } from 'react';
import { useNavigate } from 'react-router';
import { PATHS } from '../../app/routes';
import { activeHabits } from '../../domain/habits';
import { Button } from '../../design/ui/Button';
import { useToday } from '../../hooks/useToday';
import { newId } from '../../lib/id';
import { cx } from '../../lib/cx';
import { useAppStore } from '../../store/useAppStore';
import {
  initOnboarding,
  onboardingReducer,
  selectedCount,
  selectedHabits,
  STEP_COUNT,
} from './onboardingState';
import { StepArc } from './StepArc';
import { StepHabits } from './StepHabits';
import { StepWhy } from './StepWhy';

/**
 * Онбординг: показывается, когда нет текущей арки —
 * при первом запуске и после завершения прошлой арки.
 */
export function OnboardingScreen() {
  const today = useToday();
  const habits = useAppStore((state) => state.data.habits);
  const startArc = useAppStore((state) => state.startArc);
  const navigate = useNavigate();

  // Начальное состояние считаем один раз — при открытии онбординга.
  const [state, dispatch] = useReducer(onboardingReducer, null, () =>
    initOnboarding(today, activeHabits(habits)),
  );
  const count = selectedCount(state);
  const isLastStep = state.step === STEP_COUNT - 1;

  // Новый шаг — с начала страницы.
  useEffect(() => {
    window.scrollTo({ top: 0 });
  }, [state.step]);

  const finish = () => {
    startArc({ draft: state.arc, ...selectedHabits(state) });
    navigate(PATHS.center);
  };

  return (
    <div className="flex min-h-[calc(100dvh-1.5rem-env(safe-area-inset-top))] flex-col">
      <StepIndicator step={state.step} />

      <div className="flex-1 pt-6 pb-8">
        {state.step === 0 && (
          <StepArc
            draft={state.arc}
            today={today}
            showErrors={state.showArcErrors}
            onChange={(patch) => dispatch({ type: 'editArc', patch })}
          />
        )}
        {state.step === 1 && (
          <StepWhy
            why={state.arc.why}
            onChange={(why) => dispatch({ type: 'editArc', patch: { why } })}
          />
        )}
        {state.step === 2 && (
          <StepHabits
            choices={state.choices}
            onToggle={(key) => dispatch({ type: 'toggle', key })}
            onSave={(key, draft) =>
              dispatch({ type: 'saveHabit', key, newKey: `custom:${newId()}`, draft })
            }
          />
        )}
      </div>

      {/* Панель действий прилипает к низу экрана. */}
      <div className="glass sticky bottom-0 -mx-4 flex items-center gap-3 rounded-none border-x-0 border-b-0 px-4 pt-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] md:mx-0 md:rounded-lg md:border-x md:border-b">
        {state.step > 0 && (
          <Button variant="ghost" onClick={() => dispatch({ type: 'back' })}>
            Назад
          </Button>
        )}
        {isLastStep && (
          <span className="text-sm text-muted" aria-live="polite">
            {count === 0 ? 'Выбери хотя бы одну' : `Выбрано: ${count}`}
          </span>
        )}
        <Button
          variant="primary"
          size="lg"
          className="ml-auto min-w-36"
          disabled={isLastStep && count === 0}
          onClick={isLastStep ? finish : () => dispatch({ type: 'next' })}
        >
          {isLastStep ? 'Начать арку' : 'Дальше'}
        </Button>
      </div>
    </div>
  );
}

/** «Шаг 2 из 3» и три полоски. Шаги — настоящая последовательность, поэтому номера уместны. */
function StepIndicator({ step }: { step: number }) {
  return (
    <div className="on-snow">
      <p className="text-sm text-muted">
        Шаг {step + 1} из {STEP_COUNT}
      </p>
      <div className="mt-2 flex gap-1" aria-hidden="true">
        {Array.from({ length: STEP_COUNT }, (_, i) => (
          <span
            key={i}
            className={cx(
              'h-0.5 flex-1 transition-colors duration-(--wa-motion-base)',
              i <= step ? 'bg-number' : 'bg-gray-700',
            )}
          />
        ))}
      </div>
    </div>
  );
}
