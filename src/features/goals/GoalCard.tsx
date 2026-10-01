import { Link } from 'react-router';
import { goalPath } from '../../app/routes';
import { goalProgress } from '../../domain/goals';
import type { DateKey, Goal } from '../../domain/types';
import { ProgressBar } from '../../design/ui/ProgressBar';
import { DeadlineText } from './DeadlineText';
import { goalPercent, progressLabel } from './goalText';

interface GoalCardProps {
  goal: Goal;
  today: DateKey;
}

/** Цель в списке: название, процент, полоса, сколько пройдено и срок. Нажатие — страница цели. */
export function GoalCard({ goal, today }: GoalCardProps) {
  const reached = goal.completedAt !== null;
  return (
    <Link
      to={goalPath(goal.id)}
      className="glass block rounded-lg p-4 transition-colors duration-(--wa-motion-fast) hover:border-gray-500"
    >
      <div className="flex items-baseline justify-between gap-3">
        <h3 className="min-w-0 text-base text-text">{goal.title}</h3>
        <span className="shrink-0">
          <span className="numeric text-2xl text-number">{goalPercent(goal)}</span>
          <span className="numeric text-sm text-muted">%</span>
        </span>
      </div>
      <ProgressBar
        value={goalProgress(goal).ratio}
        label={`Прогресс: ${goal.title}`}
        className="mt-3"
      />
      <div className="mt-2 flex flex-wrap justify-between gap-x-3 gap-y-1 text-sm text-muted">
        <span>{progressLabel(goal)}</span>
        {goal.deadline && !reached && <DeadlineText deadline={goal.deadline} today={today} />}
      </div>
    </Link>
  );
}
