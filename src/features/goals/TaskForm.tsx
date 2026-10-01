import { useId, useState, type FormEvent } from 'react';
import { addDays } from '../../domain/dates';
import {
  PRIORITY_LABELS,
  validateTaskDraft,
  type TaskDraft,
  type TaskPriority,
} from '../../domain/tasks';
import type { DateKey, Goal } from '../../domain/types';
import { Button } from '../../design/ui/Button';
import { describedBy } from '../../design/ui/describedBy';
import { Field, SelectInput, TextInput } from '../../design/ui/inputs';
import { Segmented } from '../../design/ui/Segmented';
import { hasErrors } from '../../lib/hasErrors';
import { DeadlinePicker } from './DeadlinePicker';

interface TaskFormProps {
  initial: TaskDraft;
  submitLabel: string;
  today: DateKey;
  /** Цели, к которым можно привязать задачу. */
  goals: Goal[];
  onSubmit: (draft: TaskDraft) => void;
  onCancel: () => void;
  /** Удаление — только у существующей задачи. */
  onDelete?: () => void;
}

const PRIORITY_OPTIONS = (['low', 'medium', 'high'] as TaskPriority[]).map((priority) => ({
  value: priority,
  label: PRIORITY_LABELS[priority],
}));

/** Значение «без цели» в списке: select не умеет хранить null. */
const NO_GOAL = '';

/** Форма задачи: что сделать, к какой цели, насколько важно, до какого дня. */
export function TaskForm({
  initial,
  submitLabel,
  today,
  goals,
  onSubmit,
  onCancel,
  onDelete,
}: TaskFormProps) {
  const id = useId();
  const [draft, setDraft] = useState(initial);
  const [submitted, setSubmitted] = useState(false);
  const update = (patch: Partial<TaskDraft>) => setDraft((current) => ({ ...current, ...patch }));
  const errors = submitted ? validateTaskDraft(draft) : {};

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    setSubmitted(true);
    if (!hasErrors(validateTaskDraft(draft))) onSubmit(draft);
  };

  return (
    <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-6">
      <Field id={`${id}-title`} label="Что сделать" error={errors.title}>
        <TextInput
          id={`${id}-title`}
          value={draft.title}
          onChange={(event) => update({ title: event.target.value })}
          placeholder="Например: записаться в автошколу"
          autoComplete="off"
          aria-invalid={Boolean(errors.title)}
          aria-describedby={describedBy(`${id}-title`)}
        />
      </Field>

      <Field id={`${id}-goal`} label="Цель">
        <SelectInput
          id={`${id}-goal`}
          value={draft.goalId ?? NO_GOAL}
          onChange={(event) => update({ goalId: event.target.value || null })}
        >
          <option value={NO_GOAL}>Без цели</option>
          {goals.map((goal) => (
            <option key={goal.id} value={goal.id}>
              {goal.title}
            </option>
          ))}
        </SelectInput>
      </Field>

      <div className="flex flex-col gap-1.5">
        <span className="text-sm text-text">Приоритет</span>
        <Segmented
          label="Приоритет"
          value={draft.priority}
          onChange={(priority) => update({ priority })}
          options={PRIORITY_OPTIONS}
        />
      </div>

      <DeadlinePicker
        id={`${id}-deadline`}
        value={draft.deadline}
        onChange={(deadline) => update({ deadline })}
        presets={[
          { label: 'Сегодня', date: today },
          { label: 'Завтра', date: addDays(today, 1) },
        ]}
        fallback={addDays(today, 7)}
        noneLabel="Нет"
        error={errors.deadline}
      />

      <div className="flex flex-col gap-2 pt-2">
        <Button type="submit" variant="primary" size="lg">
          {submitLabel}
        </Button>
        <Button variant="ghost" onClick={onCancel}>
          Отмена
        </Button>
        {onDelete && (
          <Button variant="ghost" onClick={onDelete}>
            Удалить задачу
          </Button>
        )}
      </div>
    </form>
  );
}
