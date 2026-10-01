import { CalendarClock } from 'lucide-react';
import { deadlineStatus, describeDeadline } from '../../domain/deadlines';
import type { DateKey } from '../../domain/types';
import { cx } from '../../lib/cx';

interface DeadlineTextProps {
  deadline: DateKey;
  today: DateKey;
}

/**
 * Срок со значком: «до 31 декабря», «завтра», «сегодня».
 * Просрочено — красным: это одно из двух мест, где в приложении есть цвет.
 */
export function DeadlineText({ deadline, today }: DeadlineTextProps) {
  const status = deadlineStatus(deadline, today);
  return (
    <span
      className={cx(
        'inline-flex items-center gap-1',
        status === 'overdue' && 'text-danger-text',
        status === 'today' && 'text-text',
      )}
    >
      <CalendarClock
        size={14}
        strokeWidth={1.5}
        className={cx('shrink-0', status === 'overdue' && 'text-danger')}
        aria-hidden="true"
      />
      {describeDeadline(deadline, today)}
    </span>
  );
}
