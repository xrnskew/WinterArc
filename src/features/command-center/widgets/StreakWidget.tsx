import { Link } from 'react-router';
import { habitPath } from '../../../app/routes';
import { getHabit } from '../../../domain/habits';
import { habitStreak } from '../../../domain/progress';
import { BigNumber } from '../../../design/ui/BigNumber';
import { currentStreak } from '../../habits/habitStreakLabel';
import type { WidgetProps } from './WidgetFrame';

/** Серия одной привычки: текущая крупно, лучшая — подписью. */
export function StreakWidget({ widget, data, today }: WidgetProps) {
  const habit = widget.habitId ? getHabit(data, widget.habitId) : null;
  if (!habit || habit.archivedAt !== null) {
    return <p className="text-sm text-muted">Привычка убрана в архив. Убери и этот виджет.</p>;
  }

  const streak = currentStreak(habit, data, today);
  const best = habitStreak(habit, data.habitLogs, today).best;

  return (
    <Link to={habitPath(habit.id)} className="block">
      <BigNumber value={streak.value} size="lg" />
      <p className="mt-1 text-sm text-muted">{streak.label}</p>
      <p className="text-sm text-muted">
        лучшая — <span className="numeric text-text">{best}</span>
      </p>
    </Link>
  );
}
