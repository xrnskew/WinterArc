import { useId } from 'react';
import type { ArcDraft, ArcDraftErrors } from '../../domain/arc';
import { describedBy } from '../../design/ui/describedBy';
import { DateInput, Field, FieldError, TextArea, TextInput } from '../../design/ui/inputs';

interface ArcFieldsProps {
  draft: ArcDraft;
  onChange: (patch: Partial<ArcDraft>) => void;
  errors: ArcDraftErrors;
  /** Показывать поле «зачем» (в онбординге оно на отдельном шаге). */
  withWhy?: boolean;
}

/** Поля арки: название, даты и (по желанию) «зачем». Общие для онбординга и настроек. */
export function ArcFields({ draft, onChange, errors, withWhy = false }: ArcFieldsProps) {
  const id = useId();

  return (
    <div className="flex flex-col gap-5">
      <Field id={`${id}-name`} label="Название" error={errors.name}>
        <TextInput
          id={`${id}-name`}
          value={draft.name}
          onChange={(event) => onChange({ name: event.target.value })}
          autoComplete="off"
          aria-invalid={Boolean(errors.name)}
          aria-describedby={describedBy(`${id}-name`)}
        />
      </Field>

      <div>
        <div className="grid grid-cols-2 gap-3">
          <Field id={`${id}-start`} label="Начало">
            <DateInput
              id={`${id}-start`}
              value={draft.startDate}
              onChange={(event) => onChange({ startDate: event.target.value })}
              aria-invalid={Boolean(errors.dates)}
              aria-describedby={`${id}-dates-error`}
            />
          </Field>
          <Field id={`${id}-end`} label="Конец">
            <DateInput
              id={`${id}-end`}
              value={draft.endDate}
              min={draft.startDate}
              onChange={(event) => onChange({ endDate: event.target.value })}
              aria-invalid={Boolean(errors.dates)}
              aria-describedby={`${id}-dates-error`}
            />
          </Field>
        </div>
        {errors.dates && <FieldError id={`${id}-dates-error`}>{errors.dates}</FieldError>}
      </div>

      {withWhy && (
        <Field id={`${id}-why`} label="Зачем" hint="Будет на главном экране в трудные дни.">
          <TextArea
            id={`${id}-why`}
            value={draft.why}
            onChange={(event) => onChange({ why: event.target.value })}
            rows={4}
            aria-describedby={describedBy(`${id}-why`)}
          />
        </Field>
      )}
    </div>
  );
}
