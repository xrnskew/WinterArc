import { Check, Pencil, Plus } from 'lucide-react';
import { useState } from 'react';
import { describeHabit, EMPTY_HABIT_DRAFT, type HabitDraft } from '../../domain/habits';
import { RECOMMENDED_HABITS } from '../../domain/templates';
import { Button } from '../../design/ui/Button';
import { GlassCard } from '../../design/ui/GlassCard';
import { HabitIcon } from '../../design/ui/HabitIcon';
import { Sheet } from '../../design/ui/Sheet';
import { cx } from '../../lib/cx';
import { HabitForm } from '../habits/HabitForm';
import type { HabitChoice } from './onboardingState';
import { StepHeading } from './StepHeading';

interface StepHabitsProps {
  choices: HabitChoice[];
  onToggle: (key: string) => void;
  /** key = null — новая своя привычка. */
  onSave: (key: string | null, draft: HabitDraft) => void;
}

/** Что сейчас открыто в шторке: правка существующей строки или новая привычка. */
type Editing = { key: string | null; draft: HabitDraft } | null;

/** Шаг 3: привычки из прошлой арки, шаблоны и свои. */
export function StepHabits({ choices, onToggle, onSave }: StepHabitsProps) {
  const [editing, setEditing] = useState<Editing>(null);

  const groups = [
    { title: 'Из прошлой арки', items: choices.filter((c) => c.source === 'kept') },
    { title: 'Шаблоны', items: choices.filter((c) => c.source === 'template') },
    { title: 'Свои', items: choices.filter((c) => c.source === 'custom') },
  ].filter((group) => group.items.length > 0);

  return (
    <>
      <StepHeading title="Привычки">
        Выбери {RECOMMENDED_HABITS.min}–{RECOMMENDED_HABITS.max}: столько реально держать каждый
        день. Новые можно добавить в любой момент.
      </StepHeading>

      <div className="mt-8 flex flex-col gap-6">
        {groups.map((group) => (
          <section key={group.title}>
            <h2 className="on-snow mb-2 text-sm text-muted">{group.title}</h2>
            <GlassCard className="p-0">
              <ul className="divide-y divide-gray-800">
                {group.items.map((choice) => (
                  <HabitChoiceRow
                    key={choice.key}
                    choice={choice}
                    onToggle={() => onToggle(choice.key)}
                    onEdit={() => setEditing({ key: choice.key, draft: choice.draft })}
                  />
                ))}
              </ul>
            </GlassCard>
          </section>
        ))}

        <Button onClick={() => setEditing({ key: null, draft: EMPTY_HABIT_DRAFT })}>
          <Plus size={18} strokeWidth={1.5} aria-hidden="true" />
          Своя привычка
        </Button>
      </div>

      <Sheet
        open={editing !== null}
        onClose={() => setEditing(null)}
        title={editing?.key ? 'Изменить привычку' : 'Своя привычка'}
      >
        {editing && (
          <HabitForm
            initial={editing.draft}
            submitLabel={editing.key ? 'Сохранить' : 'Добавить привычку'}
            onCancel={() => setEditing(null)}
            onSubmit={(draft) => {
              onSave(editing.key, draft);
              setEditing(null);
            }}
          />
        )}
      </Sheet>
    </>
  );
}

interface HabitChoiceRowProps {
  choice: HabitChoice;
  onToggle: () => void;
  onEdit: () => void;
}

/** Строка привычки: вся строка — галочка, справа — карандаш (кроме привычек прошлой арки). */
function HabitChoiceRow({ choice, onToggle, onEdit }: HabitChoiceRowProps) {
  const { draft, selected } = choice;
  const editable = choice.source !== 'kept';

  return (
    <li className="flex items-center">
      <label className="flex min-w-0 flex-1 cursor-pointer items-center gap-3 py-3 pl-4">
        <input type="checkbox" checked={selected} onChange={onToggle} className="peer sr-only" />
        <span
          aria-hidden="true"
          className={cx(
            'flex size-6 shrink-0 items-center justify-center rounded-sm border',
            'transition-colors duration-(--wa-motion-fast)',
            'peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-number',
            selected ? 'border-number bg-number text-night' : 'border-gray-500 text-transparent',
          )}
        >
          <Check size={16} strokeWidth={2.5} />
        </span>
        <HabitIcon
          name={draft.icon}
          className={cx('shrink-0', selected ? 'text-number' : 'text-muted')}
        />
        <span className="min-w-0">
          <span
            className={cx('block text-base break-words', selected ? 'text-number' : 'text-text')}
          >
            {draft.name}
          </span>
          <span className="block text-sm text-muted">{describeHabit(draft)}</span>
        </span>
      </label>
      {editable && (
        <button
          type="button"
          onClick={onEdit}
          aria-label={`Изменить: ${draft.name}`}
          className="mr-2 flex size-11 shrink-0 items-center justify-center rounded-md text-muted hover:text-text"
        >
          <Pencil size={18} strokeWidth={1.5} aria-hidden="true" />
        </button>
      )}
    </li>
  );
}
