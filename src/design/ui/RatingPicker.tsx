import { useId } from 'react';
import { cx } from '../../lib/cx';

interface RatingPickerProps {
  label: string;
  value: number | null;
  /** null — снять оценку (повторное нажатие на выбранную). */
  onChange: (value: number | null) => void;
}

const SCORES = Array.from({ length: 10 }, (_, i) => i + 1);

/** Оценка 1–10: ряд из десяти квадратов. Выбранная и всё, что левее, — светлее. */
export function RatingPicker({ label, value, onChange }: RatingPickerProps) {
  const name = useId();

  return (
    <fieldset>
      <legend className="mb-2 flex w-full justify-between text-sm text-text">
        {label}
        <span className="numeric text-muted">{value ?? '–'}</span>
      </legend>
      <div className="grid grid-cols-10 gap-1">
        {SCORES.map((score) => {
          const selected = score === value;
          const filled = value !== null && score <= value;
          return (
            <label key={score}>
              <input
                type="radio"
                name={name}
                checked={selected}
                onChange={() => onChange(score)}
                // Повторное нажатие на выбранную оценку снимает её.
                onClick={() => selected && onChange(null)}
                aria-label={`${label}: ${score}`}
                className="peer sr-only"
              />
              <span
                className={cx(
                  'numeric flex h-9 cursor-pointer items-center justify-center rounded-sm text-xs',
                  'transition-colors duration-(--wa-motion-fast)',
                  'peer-focus-visible:outline-2 peer-focus-visible:outline-offset-1 peer-focus-visible:outline-number',
                  selected
                    ? 'bg-number text-night'
                    : filled
                      ? 'bg-gray-500 text-number'
                      : 'bg-gray-800 text-muted hover:bg-gray-700',
                )}
              >
                {score}
              </span>
            </label>
          );
        })}
      </div>
    </fieldset>
  );
}
