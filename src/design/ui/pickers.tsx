import { useId } from 'react';
import { ICON_NAMES } from '../../domain/icons';
import type { AccentKey, IconName, Weekday } from '../../domain/types';
import { cx } from '../../lib/cx';
import { ACCENT_LABELS } from './accentLabels';
import { HabitIcon } from './HabitIcon';
import { ICON_LABELS } from './habitIcons';

/**
 * Выбор иконки, оттенка и дней недели.
 * Внутри обычные radio/checkbox — клавиатура и скринридер работают сами.
 */

const OPTION_FOCUS =
  'peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-number';

interface IconPickerProps {
  value: IconName;
  onChange: (icon: IconName) => void;
}

export function IconPicker({ value, onChange }: IconPickerProps) {
  const name = useId();
  return (
    <fieldset>
      <legend className="mb-1.5 text-sm text-text">Иконка</legend>
      <div className="grid grid-cols-8 gap-1">
        {ICON_NAMES.map((icon) => (
          <label key={icon} className="block">
            <input
              type="radio"
              name={name}
              value={icon}
              checked={icon === value}
              onChange={() => onChange(icon)}
              aria-label={ICON_LABELS[icon]}
              className="peer sr-only"
            />
            <span
              className={cx(
                'flex aspect-square cursor-pointer items-center justify-center rounded-md border',
                'transition-colors duration-(--wa-motion-fast)',
                OPTION_FOCUS,
                icon === value
                  ? 'border-number bg-gray-800 text-number'
                  : 'border-transparent text-muted hover:text-text',
              )}
            >
              <HabitIcon name={icon} size={20} />
            </span>
          </label>
        ))}
      </div>
    </fieldset>
  );
}

const ACCENTS = Object.keys(ACCENT_LABELS) as AccentKey[];

interface AccentPickerProps {
  value: AccentKey;
  onChange: (accent: AccentKey) => void;
}

/** Оттенок привычки: на графиках привычки различаются им. */
export function AccentPicker({ value, onChange }: AccentPickerProps) {
  const name = useId();
  return (
    <fieldset>
      <legend className="mb-1.5 text-sm text-text">
        Оттенок <span className="text-muted">— {ACCENT_LABELS[value].toLowerCase()}</span>
      </legend>
      <div className="flex gap-3">
        {ACCENTS.map((accent) => (
          <label key={accent}>
            <input
              type="radio"
              name={name}
              value={accent}
              checked={accent === value}
              onChange={() => onChange(accent)}
              aria-label={ACCENT_LABELS[accent]}
              className="peer sr-only"
            />
            <span
              className={cx(
                'block size-9 cursor-pointer rounded-full border-2 transition-shadow duration-(--wa-motion-fast)',
                OPTION_FOCUS,
                accent === value ? 'border-number shadow-glow' : 'border-night',
              )}
              style={{ background: `var(--wa-accent-${accent})` }}
            />
          </label>
        ))}
      </div>
    </fieldset>
  );
}

const WEEKDAYS: { day: Weekday; label: string }[] = [
  { day: 1, label: 'Пн' },
  { day: 2, label: 'Вт' },
  { day: 3, label: 'Ср' },
  { day: 4, label: 'Чт' },
  { day: 5, label: 'Пт' },
  { day: 6, label: 'Сб' },
  { day: 7, label: 'Вс' },
];

interface WeekdayPickerProps {
  value: Weekday[];
  onChange: (days: Weekday[]) => void;
  invalid?: boolean;
}

export function WeekdayPicker({ value, onChange, invalid }: WeekdayPickerProps) {
  const toggle = (day: Weekday) =>
    onChange(value.includes(day) ? value.filter((d) => d !== day) : [...value, day]);

  return (
    <fieldset className="grid grid-cols-7 gap-1">
      <legend className="sr-only">Дни недели</legend>
      {WEEKDAYS.map(({ day, label }) => {
        const checked = value.includes(day);
        return (
          <label key={day}>
            <input
              type="checkbox"
              checked={checked}
              onChange={() => toggle(day)}
              className="peer sr-only"
            />
            <span
              className={cx(
                'flex h-10 cursor-pointer items-center justify-center rounded-md border text-sm',
                'transition-colors duration-(--wa-motion-fast)',
                OPTION_FOCUS,
                checked
                  ? 'border-number bg-number text-night'
                  : invalid
                    ? 'border-danger text-muted'
                    : 'border-gray-700 text-muted hover:text-text',
              )}
            >
              {label}
            </span>
          </label>
        );
      })}
    </fieldset>
  );
}
