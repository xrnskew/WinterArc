import { Plus } from 'lucide-react';
import { useState } from 'react';
import { Link } from 'react-router';
import { habitPath } from '../../app/routes';
import { getActiveArc } from '../../domain/arc';
import { arcHabits, describeHabit, draftFromHabit, EMPTY_HABIT_DRAFT } from '../../domain/habits';
import { Button } from '../../design/ui/Button';
import { EmptyState } from '../../design/ui/EmptyState';
import { GlassCard } from '../../design/ui/GlassCard';
import { HabitIcon } from '../../design/ui/HabitIcon';
import { ScreenHeader } from '../../design/ui/ScreenHeader';
import { Sheet } from '../../design/ui/Sheet';
import { useToday } from '../../hooks/useToday';
import { plural } from '../../lib/plural';
import { useAppStore } from '../../store/useAppStore';
import { HabitForm } from './HabitForm';
import { currentStreak } from './habitStreakLabel';

/** Привычки текущей арки. Нажатие — страница привычки. */
export function HabitsScreen() {
  const today = useToday();
  const data = useAppStore((state) => state.data);
  const addHabit = useAppStore((state) => state.addHabit);
  const [adding, setAdding] = useState(false);

  const arc = getActiveArc(data);
  if (!arc) return null;
  const habits = arcHabits(data, arc);

  return (
    <>
      <ScreenHeader
        title="Привычки"
        description={
          habits.length > 0
            ? `${habits.length} ${plural(habits.length, 'привычка', 'привычки', 'привычек')} в арке`
            : undefined
        }
        action={
          <Button onClick={() => setAdding(true)} aria-label="Добавить привычку">
            <Plus size={18} strokeWidth={1.5} aria-hidden="true" />
            Добавить
          </Button>
        }
      />

      {habits.length === 0 ? (
        <EmptyState
          title="Привычек пока нет"
          text="Добавь первую: то, что хочешь делать каждый день, или то, от чего хочешь отказаться."
          action={
            <Button variant="primary" onClick={() => setAdding(true)}>
              Добавить привычку
            </Button>
          }
        />
      ) : (
        <GlassCard as="section" aria-label="Список привычек" className="p-0">
          <ul className="divide-y divide-gray-800">
            {habits.map((habit) => {
              const streak = currentStreak(habit, data, today);
              return (
                <li key={habit.id}>
                  <Link
                    to={habitPath(habit.id)}
                    className="flex items-center gap-3 px-4 py-3.5 transition-colors duration-(--wa-motion-fast) hover:bg-gray-800/60"
                  >
                    <HabitIcon name={habit.icon} className="shrink-0 text-text" />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-base text-text">{habit.name}</span>
                      <span className="block text-sm text-muted">
                        {describeHabit(draftFromHabit(habit), data.settings.currency)}
                      </span>
                    </span>
                    <span className="shrink-0 text-right">
                      <span className="numeric block text-xl text-number">{streak.value}</span>
                      <span className="block text-xs text-muted">{streak.unit}</span>
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </GlassCard>
      )}

      <Sheet open={adding} onClose={() => setAdding(false)} title="Новая привычка">
        <HabitForm
          initial={EMPTY_HABIT_DRAFT}
          currency={data.settings.currency}
          submitLabel="Добавить привычку"
          onCancel={() => setAdding(false)}
          onSubmit={(draft) => {
            addHabit(draft);
            setAdding(false);
          }}
        />
      </Sheet>
    </>
  );
}
