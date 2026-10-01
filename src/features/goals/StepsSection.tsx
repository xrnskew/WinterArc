import { Plus, X } from 'lucide-react';
import { useId, useState, type FormEvent } from 'react';
import { STEP_TITLE_MAX } from '../../domain/goals';
import type { StepsGoal } from '../../domain/types';
import { Button } from '../../design/ui/Button';
import { CheckSquare } from '../../design/ui/CheckSquare';
import { GlassCard } from '../../design/ui/GlassCard';
import { TextInput } from '../../design/ui/inputs';
import { cx } from '../../lib/cx';
import { useAppStore } from '../../store/useAppStore';

/** Шаги цели: отметить, добавить новый, в режиме «Править» — удалить. */
export function StepsSection({ goal }: { goal: StepsGoal }) {
  const id = useId();
  const toggleGoalStep = useAppStore((state) => state.toggleGoalStep);
  const addGoalStep = useAppStore((state) => state.addGoalStep);
  const removeGoalStep = useAppStore((state) => state.removeGoalStep);
  const [title, setTitle] = useState('');
  const [editing, setEditing] = useState(false);

  const handleAdd = (event: FormEvent) => {
    event.preventDefault();
    if (!title.trim()) return;
    addGoalStep(goal.id, title);
    setTitle('');
  };

  return (
    <GlassCard as="section" aria-labelledby={`${id}-title`} className="p-4">
      <div className="flex items-center justify-between gap-3">
        <h2 id={`${id}-title`} className="text-base text-text">
          Шаги
        </h2>
        {goal.steps.length > 0 && (
          <Button variant="ghost" className="-mr-3 h-9" onClick={() => setEditing(!editing)}>
            {editing ? 'Готово' : 'Править'}
          </Button>
        )}
      </div>

      <ol className="mt-2 divide-y divide-gray-800">
        {goal.steps.map((step) => {
          const done = step.doneAt !== null;
          return (
            <li key={step.id} className="flex items-start gap-3 py-2.5">
              <CheckSquare
                checked={done}
                onToggle={() => toggleGoalStep(goal.id, step.id)}
                label={`Шаг сделан: ${step.title}`}
              />
              <span
                className={cx(
                  'min-w-0 flex-1 pt-2.5 text-base break-words',
                  done ? 'text-muted line-through' : 'text-text',
                )}
              >
                {step.title}
              </span>
              {editing && (
                <button
                  type="button"
                  onClick={() => removeGoalStep(goal.id, step.id)}
                  aria-label={`Удалить шаг «${step.title}»`}
                  className="flex size-11 shrink-0 items-center justify-center rounded-md text-muted hover:bg-gray-800 hover:text-number"
                >
                  <X size={18} strokeWidth={1.5} aria-hidden="true" />
                </button>
              )}
            </li>
          );
        })}
      </ol>

      <form onSubmit={handleAdd} className="mt-3 flex gap-2">
        <TextInput
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          maxLength={STEP_TITLE_MAX}
          placeholder="Новый шаг"
          aria-label="Новый шаг"
          autoComplete="off"
        />
        <Button
          type="submit"
          className="h-12 shrink-0"
          aria-label="Добавить шаг"
          disabled={!title.trim()}
        >
          <Plus size={18} strokeWidth={1.5} aria-hidden="true" />
        </Button>
      </form>
    </GlassCard>
  );
}
