import { EyeOff, Pencil, Plus } from 'lucide-react';
import { useId, useState, type FormEvent } from 'react';
import { MAX_SCALES, SCALE_NAME_MAX, validateScaleName } from '../../domain/days';
import type { IconName, RatingScale } from '../../domain/types';
import { Button } from '../../design/ui/Button';
import { describedBy } from '../../design/ui/describedBy';
import { GlassCard } from '../../design/ui/GlassCard';
import { HabitIcon } from '../../design/ui/HabitIcon';
import { Field, TextInput } from '../../design/ui/inputs';
import { IconPicker } from '../../design/ui/pickers';
import { Sheet } from '../../design/ui/Sheet';
import { useAppStore } from '../../store/useAppStore';

const ICON_BUTTON =
  'flex size-10 shrink-0 items-center justify-center rounded-md text-muted transition-colors duration-(--wa-motion-fast) hover:bg-gray-800 hover:text-number';

/** Что открыто в шторке: новая шкала или правка существующей. */
type Editing = { kind: 'new' } | { kind: 'edit'; scale: RatingScale } | null;

/** Шкалы оценок дня: добавить, переименовать, убрать из чек-ина и вернуть. */
export function ScalesSettings() {
  const scales = useAppStore((state) => state.data.ratingScales);
  const addScale = useAppStore((state) => state.addScale);
  const updateScale = useAppStore((state) => state.updateScale);
  const archiveScale = useAppStore((state) => state.archiveScale);
  const restoreScale = useAppStore((state) => state.restoreScale);
  const [editing, setEditing] = useState<Editing>(null);

  const active = scales.filter((scale) => scale.archivedAt === null);
  const archived = scales.filter((scale) => scale.archivedAt !== null);

  return (
    <GlassCard as="section" aria-labelledby="settings-scales" className="p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 id="settings-scales" className="text-base text-text">
            Оценки дня
          </h2>
          <p className="mt-1 text-sm text-muted">Шкалы 1–10 в чек-ине. До {MAX_SCALES} штук.</p>
        </div>
        {active.length < MAX_SCALES && (
          <Button
            variant="ghost"
            className="-mr-3 shrink-0"
            onClick={() => setEditing({ kind: 'new' })}
          >
            <Plus size={18} strokeWidth={1.5} aria-hidden="true" />
            Добавить
          </Button>
        )}
      </div>

      <ul className="mt-3 divide-y divide-gray-800">
        {active.map((scale) => (
          <li key={scale.id} className="flex items-center gap-3 py-1.5">
            <HabitIcon name={scale.icon} className="shrink-0 text-text" />
            <span className="min-w-0 flex-1 truncate text-base text-text">{scale.name}</span>
            <button
              type="button"
              className={ICON_BUTTON}
              onClick={() => setEditing({ kind: 'edit', scale })}
              aria-label={`Изменить шкалу «${scale.name}»`}
            >
              <Pencil size={18} strokeWidth={1.5} aria-hidden="true" />
            </button>
            {active.length > 1 && (
              <button
                type="button"
                className={ICON_BUTTON}
                onClick={() => archiveScale(scale.id)}
                aria-label={`Убрать шкалу «${scale.name}» из чек-ина`}
              >
                <EyeOff size={18} strokeWidth={1.5} aria-hidden="true" />
              </button>
            )}
          </li>
        ))}
      </ul>

      {archived.length > 0 && (
        <div className="mt-4 border-t border-gray-800 pt-4">
          <h3 className="text-sm text-muted">Убраны из чек-ина — оценки сохранены</h3>
          <ul className="mt-1">
            {archived.map((scale) => (
              <li key={scale.id} className="flex items-center gap-3 py-1.5">
                <HabitIcon name={scale.icon} className="shrink-0 text-muted" />
                <span className="min-w-0 flex-1 truncate text-base text-muted">{scale.name}</span>
                {active.length < MAX_SCALES && (
                  <Button variant="ghost" className="-mr-3" onClick={() => restoreScale(scale.id)}>
                    Вернуть
                  </Button>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}

      <Sheet
        open={editing !== null}
        onClose={() => setEditing(null)}
        title={editing?.kind === 'edit' ? 'Изменить шкалу' : 'Новая шкала'}
      >
        <ScaleForm
          initial={editing?.kind === 'edit' ? editing.scale : { name: '', icon: 'sun' }}
          submitLabel={editing?.kind === 'edit' ? 'Сохранить' : 'Добавить шкалу'}
          onCancel={() => setEditing(null)}
          onSubmit={(name, icon) => {
            if (editing?.kind === 'edit') updateScale(editing.scale.id, name, icon);
            else addScale(name, icon);
            setEditing(null);
          }}
        />
      </Sheet>
    </GlassCard>
  );
}

interface ScaleFormProps {
  initial: { name: string; icon: IconName };
  submitLabel: string;
  onSubmit: (name: string, icon: IconName) => void;
  onCancel: () => void;
}

function ScaleForm({ initial, submitLabel, onSubmit, onCancel }: ScaleFormProps) {
  const id = useId();
  const [name, setName] = useState(initial.name);
  const [icon, setIcon] = useState<IconName>(initial.icon);
  const [submitted, setSubmitted] = useState(false);
  const error = submitted ? validateScaleName(name) : null;

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    setSubmitted(true);
    if (validateScaleName(name) === null) onSubmit(name, icon);
  };

  return (
    <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-6">
      <Field id={`${id}-name`} label="Название" error={error ?? undefined}>
        <TextInput
          id={`${id}-name`}
          value={name}
          maxLength={SCALE_NAME_MAX}
          onChange={(event) => setName(event.target.value)}
          placeholder="Например: сон"
          autoComplete="off"
          aria-invalid={Boolean(error)}
          aria-describedby={describedBy(`${id}-name`)}
        />
      </Field>
      <IconPicker value={icon} onChange={setIcon} />
      <div className="flex flex-col gap-2">
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
