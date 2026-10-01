import { ArrowDown, ArrowUp } from 'lucide-react';
import { Link } from 'react-router';
import { habitPath } from '../../app/routes';
import { getActiveArc } from '../../domain/arc';
import { archivedHabits, arcHabits } from '../../domain/habits';
import { Button } from '../../design/ui/Button';
import { GlassCard } from '../../design/ui/GlassCard';
import { HabitIcon } from '../../design/ui/HabitIcon';
import { useAppStore } from '../../store/useAppStore';

const ARROW =
  'flex size-10 items-center justify-center rounded-md text-muted transition-colors duration-(--wa-motion-fast) hover:bg-gray-800 hover:text-number disabled:pointer-events-none disabled:opacity-30';

/** Порядок привычек в чек-ине и списке, возврат из архива. */
export function HabitsSettings() {
  const data = useAppStore((state) => state.data);
  const moveHabit = useAppStore((state) => state.moveHabit);
  const restoreHabit = useAppStore((state) => state.restoreHabit);
  const arc = getActiveArc(data);
  if (!arc) return null;

  const habits = arcHabits(data, arc);
  const archived = archivedHabits(data);

  return (
    <GlassCard as="section" aria-labelledby="settings-habits" className="p-5">
      <h2 id="settings-habits" className="text-base text-text">
        Привычки
      </h2>
      <p className="mt-1 text-sm text-muted">
        Порядок — как в чек-ине. Изменить привычку можно на её странице.
      </p>

      {habits.length === 0 ? (
        <p className="mt-3 text-sm text-muted">В арке пока нет привычек.</p>
      ) : (
        <ul className="mt-3 divide-y divide-gray-800">
          {habits.map((habit, i) => (
            <li key={habit.id} className="flex items-center gap-2 py-1.5">
              <Link
                to={habitPath(habit.id)}
                className="flex min-w-0 flex-1 items-center gap-3 py-2"
              >
                <HabitIcon name={habit.icon} className="shrink-0 text-text" />
                <span className="truncate text-base text-text">{habit.name}</span>
              </Link>
              <button
                type="button"
                className={ARROW}
                onClick={() => moveHabit(habit.id, -1)}
                disabled={i === 0}
                aria-label={`«${habit.name}» выше`}
              >
                <ArrowUp size={18} strokeWidth={1.5} aria-hidden="true" />
              </button>
              <button
                type="button"
                className={ARROW}
                onClick={() => moveHabit(habit.id, 1)}
                disabled={i === habits.length - 1}
                aria-label={`«${habit.name}» ниже`}
              >
                <ArrowDown size={18} strokeWidth={1.5} aria-hidden="true" />
              </button>
            </li>
          ))}
        </ul>
      )}

      {archived.length > 0 && (
        <div className="mt-4 border-t border-gray-800 pt-4">
          <h3 className="text-sm text-muted">В архиве</h3>
          <ul className="mt-1">
            {archived.map((habit) => (
              <li key={habit.id} className="flex items-center gap-3 py-1.5">
                <HabitIcon name={habit.icon} className="shrink-0 text-muted" />
                <span className="min-w-0 flex-1 truncate text-base text-muted">{habit.name}</span>
                <Button variant="ghost" className="-mr-3" onClick={() => restoreHabit(habit.id)}>
                  Вернуть
                </Button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </GlassCard>
  );
}
