import { useId, useState, type FormEvent } from 'react';
import { validateEntry, type EntryDraft } from '../../domain/goals';
import type { DateKey, NumericGoal } from '../../domain/types';
import { Button } from '../../design/ui/Button';
import { describedBy } from '../../design/ui/describedBy';
import { DateInput, Field, NumberInput, TextInput } from '../../design/ui/inputs';

interface EntryFormProps {
  goal: NumericGoal;
  today: DateKey;
  onSubmit: (entry: EntryDraft) => void;
  onCancel: () => void;
}

/** Новая запись числовой цели: пополнение или замер. */
export function EntryForm({ goal, today, onSubmit, onCancel }: EntryFormProps) {
  const id = useId();
  const [entry, setEntry] = useState<EntryDraft>({ date: today, value: NaN, note: '' });
  const [submitted, setSubmitted] = useState(false);
  const update = (patch: Partial<EntryDraft>) => setEntry((current) => ({ ...current, ...patch }));
  const error = submitted ? validateEntry(goal, entry, today) : null;
  const add = goal.entryMode === 'add';
  const unit = goal.unit ? `, ${goal.unit}` : '';

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    setSubmitted(true);
    if (validateEntry(goal, entry, today) === null) onSubmit(entry);
  };

  return (
    <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-6">
      <Field
        id={`${id}-value`}
        label={`${add ? 'Сколько' : 'Значение'}${unit}`}
        error={error ?? undefined}
      >
        <NumberInput
          id={`${id}-value`}
          value={Number.isNaN(entry.value) ? null : entry.value}
          onChange={(value) => update({ value: value ?? NaN })}
          min={add ? 0 : undefined}
          autoFocus
          aria-invalid={Boolean(error)}
          aria-describedby={describedBy(`${id}-value`)}
        />
      </Field>

      <Field id={`${id}-date`} label="Дата">
        <DateInput
          id={`${id}-date`}
          value={entry.date}
          max={today}
          onChange={(event) => update({ date: event.target.value })}
        />
      </Field>

      <Field id={`${id}-note`} label="Заметка" hint="Необязательно.">
        <TextInput
          id={`${id}-note`}
          value={entry.note}
          maxLength={120}
          onChange={(event) => update({ note: event.target.value })}
          placeholder={add ? 'Например: премия' : 'Например: после тренировки'}
          autoComplete="off"
          aria-describedby={describedBy(`${id}-note`)}
        />
      </Field>

      <div className="flex flex-col gap-2 pt-2">
        <Button type="submit" variant="primary" size="lg">
          {add ? 'Добавить пополнение' : 'Добавить замер'}
        </Button>
        <Button variant="ghost" onClick={onCancel}>
          Отмена
        </Button>
      </div>
    </form>
  );
}
