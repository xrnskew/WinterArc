import { useId } from 'react';
import { cx } from '../../lib/cx';

interface SegmentedProps<T extends string> {
  /** Название группы — для скринридера. */
  label: string;
  options: { value: T; label: string }[];
  value: T;
  onChange: (value: T) => void;
}

/**
 * Переключатель из нескольких вариантов.
 * Внутри — обычные radio-кнопки: стрелки и Tab работают сами.
 */
export function Segmented<T extends string>({ label, options, value, onChange }: SegmentedProps<T>) {
  const name = useId();

  return (
    <fieldset className="flex rounded-md border border-gray-700 p-0.5">
      <legend className="sr-only">{label}</legend>
      {options.map((option) => {
        const checked = option.value === value;
        return (
          <label key={option.value} className="flex-1">
            <input
              type="radio"
              name={name}
              value={option.value}
              checked={checked}
              onChange={() => onChange(option.value)}
              className="peer sr-only"
            />
            <span
              className={cx(
                'flex min-h-10 cursor-pointer items-center justify-center rounded-sm px-2 py-1 text-center text-sm leading-tight',
                'transition-colors duration-(--wa-motion-fast)',
                'peer-focus-visible:outline-2 peer-focus-visible:outline-offset-1 peer-focus-visible:outline-number',
                checked ? 'bg-gray-700 text-number' : 'text-muted hover:text-text',
              )}
            >
              {option.label}
            </span>
          </label>
        );
      })}
    </fieldset>
  );
}
