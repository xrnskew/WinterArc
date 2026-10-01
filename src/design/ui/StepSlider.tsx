import { useId } from 'react';
import { cx } from '../../lib/cx';

interface StepSliderProps<T extends string> {
  label: string;
  /** Ступени слева направо. */
  steps: { value: T; label: string }[];
  value: T;
  onChange: (value: T) => void;
}

/** Ползунок с несколькими ступенями и подписями под ним. */
export function StepSlider<T extends string>({ label, steps, value, onChange }: StepSliderProps<T>) {
  const id = useId();
  const index = Math.max(
    0,
    steps.findIndex((step) => step.value === value),
  );

  return (
    <div>
      <div className="mb-3 flex items-baseline justify-between gap-4">
        <label htmlFor={id} className="text-base text-text">
          {label}
        </label>
        <output htmlFor={id} className="text-sm text-muted">
          {steps[index].label}
        </output>
      </div>

      <input
        id={id}
        type="range"
        min={0}
        max={steps.length - 1}
        step={1}
        value={index}
        aria-valuetext={steps[index].label}
        onChange={(event) => onChange(steps[Number(event.target.value)].value)}
        className="wa-range w-full"
      />

      <div className="mt-2 flex justify-between">
        {steps.map((step, i) => (
          <button
            key={step.value}
            type="button"
            tabIndex={-1}
            onClick={() => onChange(step.value)}
            className={cx('text-xs', i === index ? 'text-text' : 'text-muted')}
          >
            {step.label}
          </button>
        ))}
      </div>
    </div>
  );
}
