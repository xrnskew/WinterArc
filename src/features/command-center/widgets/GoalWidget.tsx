import { Link } from 'react-router';
import { goalPath } from '../../../app/routes';
import { getGoal, goalProgress, numericForecast } from '../../../domain/goals';
import { formatDayMonth } from '../../../domain/dates';
import { BigNumber } from '../../../design/ui/BigNumber';
import { ProgressBar } from '../../../design/ui/ProgressBar';
import { DeadlineText } from '../../goals/DeadlineText';
import { goalPercent, progressLabel } from '../../goals/goalText';
import type { WidgetProps } from './WidgetFrame';

/** Прогресс одной цели: процент, полоса, сколько пройдено; широкий — ещё срок и прогноз. */
export function GoalWidget({ widget, data, today, firstOpen }: WidgetProps) {
  const goal = widget.goalId ? getGoal(data, widget.goalId) : undefined;
  if (!goal || goal.archivedAt !== null) {
    return <p className="text-sm text-muted">Цель убрана в архив. Убери и этот виджет.</p>;
  }

  const forecast = goal.kind === 'numeric' ? numericForecast(goal, today) : null;
  const reached = goal.completedAt !== null;

  return (
    <Link to={goalPath(goal.id)} className="block">
      <p>
        <BigNumber value={goalPercent(goal)} size="lg" fromZero={firstOpen} />
        <span className="numeric ml-1 text-lg text-muted">%</span>
      </p>
      <ProgressBar
        value={goalProgress(goal).ratio}
        label={`Прогресс: ${goal.title}`}
        className="mt-3"
      />
      <p className="mt-2 text-sm text-muted">{reached ? 'Цель достигнута' : progressLabel(goal)}</p>
      {widget.size === 'full' && !reached && (
        <p className="mt-1 flex flex-wrap gap-x-3 gap-y-1 text-sm text-muted">
          {goal.deadline && <DeadlineText deadline={goal.deadline} today={today} />}
          {forecast?.status === 'eta' && (
            <span>при таком темпе — к {formatDayMonth(forecast.date)}</span>
          )}
        </p>
      )}
    </Link>
  );
}
