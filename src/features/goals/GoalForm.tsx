import { Plus, X } from 'lucide-react';
import { useId, useState, type FormEvent } from 'react';
import { addDays } from '../../domain/dates';
import {
  ENTRY_MODE_LABELS,
  GOAL_KIND_LABELS,
  validateGoalDraft,
  type EntryMode,
  type GoalDraft,
  type GoalKind,
} from '../../domain/goals';
import type { DateKey } from '../../domain/types';
import { Button } from '../../design/ui/Button';
import { describedBy } from '../../design/ui/describedBy';
import { Field, FieldError, NumberInput, TextInput } from '../../design/ui/inputs';
import { Segmented } from '../../design/ui/Segmented';
import { hasErrors } from '../../lib/hasErrors';
import { DeadlinePicker } from './DeadlinePicker';

interface GoalFormProps {
  initial: GoalDraft;
  submitLabel: string;
  /** Правка существующей цели: вид, режим записей и шаги здесь не меняются. */
  editing?: boolean;
  today: DateKey;
  /** Конец текущей арки — готовый вариант срока. */
  arcEnd: DateKey | null;
  onSubmit: (draft: GoalDraft) => void;
  onCancel: () => void;
}

const KIND_OPTIONS = (Object.keys(GOAL_KIND_LABELS) as GoalKind[]).map((kind) => ({
  value: kind,
  label: GOAL_KIND_LABELS[kind],
}));

const MODE_OPTIONS = (Object.keys(ENTRY_MODE_LABELS) as EntryMode[]).map((mode) => ({
  value: mode,
  label: ENTRY_MODE_LABELS[mode],
}));

const MODE_HINTS: Record<EntryMode, string> = {
  add: 'Каждая запись прибавляется: деньги, километры, прочитанные книги.',
  set: 'Каждая запись — новое значение: вес, время на 5 км.',
};

/** Пустое поле числа храним как NaN — проверка формы его поймает. */
const toNumber = (value: number | null) => value ?? NaN;
const fromNumber = (value: number) => (Number.isNaN(value) ? null : value);

/** Форма цели обоих видов. Ничего не сохраняет сама — отдаёт черновик наверх. */
export function GoalForm({
  initial,
  submitLabel,
  editing = false,
  today,
  arcEnd,
  onSubmit,
  onCancel,
}: GoalFormProps) {
  const id = useId();
  const [draft, setDraft] = useState(initial);
  const [submitted, setSubmitted] = useState(false);
  const update = (patch: Partial<GoalDraft>) => setDraft((current) => ({ ...current, ...patch }));
  const errors = submitted ? validateGoalDraft(draft) : {};

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    setSubmitted(true);
    if (!hasErrors(validateGoalDraft(draft))) onSubmit(draft);
  };

  const setStep = (index: number, title: string) =>
    update({ steps: draft.steps.map((step, i) => (i === index ? title : step)) });

  return (
    <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-6">
      <Field id={`${id}-title`} label="Название" error={errors.title}>
        <TextInput
          id={`${id}-title`}
          value={draft.title}
          onChange={(event) => update({ title: event.target.value })}
          placeholder={draft.kind === 'steps' ? 'Например: сдать на права' : 'Например: подушка'}
          autoComplete="off"
          aria-invalid={Boolean(errors.title)}
          aria-describedby={describedBy(`${id}-title`)}
        />
      </Field>

      {editing ? (
        <p className="text-sm text-muted">
          {draft.kind === 'steps'
            ? 'Шаги отмечаются, добавляются и удаляются на странице цели.'
            : `Записи: ${ENTRY_MODE_LABELS[draft.entryMode].toLowerCase()}. Режим не меняется — записи уже сделаны в нём.`}
        </p>
      ) : (
        <div className="flex flex-col gap-1.5">
          <span className="text-sm text-text">Как измерять</span>
          <Segmented
            label="Как измерять"
            value={draft.kind}
            onChange={(kind) => update({ kind })}
            options={KIND_OPTIONS}
          />
        </div>
      )}

      {draft.kind === 'steps' && !editing && (
        <fieldset>
          <legend className="mb-1.5 text-sm text-text">Шаги</legend>
          <ol className="flex flex-col gap-2">
            {draft.steps.map((step, i) => (
              <li key={i} className="flex items-center gap-2">
                <span className="numeric w-5 shrink-0 text-right text-sm text-muted">{i + 1}</span>
                <TextInput
                  value={step}
                  onChange={(event) => setStep(i, event.target.value)}
                  aria-label={`Шаг ${i + 1}`}
                  placeholder={i === 0 ? 'Например: теория' : undefined}
                  autoComplete="off"
                />
                {draft.steps.length > 1 && (
                  <button
                    type="button"
                    onClick={() => update({ steps: draft.steps.filter((_, j) => j !== i) })}
                    aria-label={`Убрать шаг ${i + 1}`}
                    className="flex size-10 shrink-0 items-center justify-center rounded-md text-muted hover:text-text"
                  >
                    <X size={18} strokeWidth={1.5} aria-hidden="true" />
                  </button>
                )}
              </li>
            ))}
          </ol>
          <Button
            variant="ghost"
            className="mt-1 -ml-4"
            onClick={() => update({ steps: [...draft.steps, ''] })}
          >
            <Plus size={18} strokeWidth={1.5} aria-hidden="true" />
            Ещё шаг
          </Button>
          {errors.steps && <FieldError>{errors.steps}</FieldError>}
        </fieldset>
      )}

      {draft.kind === 'numeric' && (
        <>
          {!editing && (
            <div className="flex flex-col gap-1.5">
              <span className="text-sm text-text">Записи</span>
              <Segmented
                label="Записи"
                value={draft.entryMode}
                onChange={(entryMode) => update({ entryMode })}
                options={MODE_OPTIONS}
              />
              <p className="text-sm text-muted">{MODE_HINTS[draft.entryMode]}</p>
            </div>
          )}

          <fieldset>
            <legend className="sr-only">Старт и цель</legend>
            <div className="grid grid-cols-3 gap-2">
              <Field id={`${id}-start`} label="Старт">
                <NumberInput
                  id={`${id}-start`}
                  value={fromNumber(draft.startValue)}
                  onChange={(value) => update({ startValue: toNumber(value) })}
                  aria-invalid={Boolean(errors.values)}
                  aria-describedby={describedBy(`${id}-values`)}
                />
              </Field>
              <Field id={`${id}-target`} label="Цель">
                <NumberInput
                  id={`${id}-target`}
                  value={fromNumber(draft.targetValue)}
                  onChange={(value) => update({ targetValue: toNumber(value) })}
                  aria-invalid={Boolean(errors.values)}
                  aria-describedby={describedBy(`${id}-values`)}
                />
              </Field>
              <Field id={`${id}-unit`} label="Единица">
                <TextInput
                  id={`${id}-unit`}
                  value={draft.unit}
                  maxLength={12}
                  onChange={(event) => update({ unit: event.target.value })}
                  placeholder={draft.entryMode === 'add' ? '₽' : 'кг'}
                  autoComplete="off"
                />
              </Field>
            </div>
            {errors.values && (
              <FieldError id={describedBy(`${id}-values`)}>{errors.values}</FieldError>
            )}
          </fieldset>
        </>
      )}

      <DeadlinePicker
        id={`${id}-deadline`}
        value={draft.deadline}
        onChange={(deadline) => update({ deadline })}
        presets={arcEnd ? [{ label: 'Конец арки', date: arcEnd }] : []}
        fallback={arcEnd ?? addDays(today, 30)}
        error={errors.deadline}
      />

      <div className="flex flex-col gap-2 pt-2">
        <Button type="submit" variant="primary" size="lg">
          {submitLabel}
        </Button>
        <Button variant="ghost" onClick={onCancel}>
          Отмена
        </Button>
      </div>
    </form>
  );
}
