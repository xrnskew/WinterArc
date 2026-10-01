import { useState } from 'react';
import type { DateKey } from '../../domain/types';
import { describedBy } from '../../design/ui/describedBy';
import { DateInput, FieldError } from '../../design/ui/inputs';
import { Segmented } from '../../design/ui/Segmented';

/** Готовый вариант срока: «Сегодня», «Конец арки». */
export interface DeadlinePreset {
  label: string;
  date: DateKey;
}

interface DeadlinePickerProps {
  id: string;
  value: DateKey | null;
  onChange: (deadline: DateKey | null) => void;
  presets: DeadlinePreset[];
  /** Дата по умолчанию, когда выбирают «Дата». */
  fallback: DateKey;
  /** Раньше этого дня выбрать нельзя. */
  min?: DateKey;
  /** Подпись варианта «без срока»; короче — когда вариантов много и места мало. */
  noneLabel?: string;
  error?: string;
}

type Mode = 'none' | 'custom' | `preset-${number}`;

/** Какой вариант соответствует дате: совпала с готовым — он, иначе «Дата». */
function modeOf(value: DateKey | null, presets: DeadlinePreset[]): Mode {
  if (value === null) return 'none';
  const index = presets.findIndex((preset) => preset.date === value);
  return index >= 0 ? `preset-${index}` : 'custom';
}

/** Срок: «Без срока», готовые варианты или своя дата. */
export function DeadlinePicker({
  id,
  value,
  onChange,
  presets,
  fallback,
  min,
  noneLabel = 'Без срока',
  error,
}: DeadlinePickerProps) {
  // Режим помним отдельно: выбрав «Дата», можно ввести и дату, совпадающую с готовой.
  const [mode, setMode] = useState<Mode>(() => modeOf(value, presets));

  const choose = (next: Mode) => {
    setMode(next);
    if (next === 'none') onChange(null);
    else if (next === 'custom') onChange(value ?? fallback);
    else onChange(presets[Number(next.slice('preset-'.length))].date);
  };

  return (
    <fieldset>
      <legend className="mb-1.5 text-sm text-text">Срок</legend>
      <Segmented
        label="Срок"
        value={mode}
        onChange={choose}
        options={[
          { value: 'none', label: noneLabel },
          ...presets.map((preset, i) => ({ value: `preset-${i}` as Mode, label: preset.label })),
          { value: 'custom', label: 'Дата' },
        ]}
      />
      {mode === 'custom' && (
        <DateInput
          id={id}
          aria-label="Дата"
          className="mt-2"
          value={value ?? ''}
          min={min}
          // Стёртая дата — пустая строка: проверка формы попросит выбрать дату.
          onChange={(event) => onChange(event.target.value)}
          aria-invalid={Boolean(error)}
          aria-describedby={describedBy(id)}
        />
      )}
      {error && <FieldError id={describedBy(id)}>{error}</FieldError>}
    </fieldset>
  );
}
