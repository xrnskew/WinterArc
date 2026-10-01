import { plural } from '../lib/plural';
import { daysBetween, formatDayMonth } from './dates';
import type { DateKey } from './types';

/**
 * Дедлайны задач и целей. Красным в приложении выделяется только
 * просроченное (status = 'overdue').
 */

export type DeadlineStatus = 'overdue' | 'today' | 'tomorrow' | 'soon' | 'later';

/** «Скоро» — в ближайшую неделю. */
const SOON_DAYS = 6;

export function deadlineStatus(deadline: DateKey, today: DateKey): DeadlineStatus {
  const left = daysBetween(today, deadline);
  if (left < 0) return 'overdue';
  if (left === 0) return 'today';
  if (left === 1) return 'tomorrow';
  if (left <= SOON_DAYS) return 'soon';
  return 'later';
}

/** "просрочено на 3 дня", "сегодня", "завтра", "через 4 дня", "до 31 декабря" */
export function describeDeadline(deadline: DateKey, today: DateKey): string {
  const left = daysBetween(today, deadline);
  switch (deadlineStatus(deadline, today)) {
    case 'overdue':
      return `просрочено на ${-left} ${plural(-left, 'день', 'дня', 'дней')}`;
    case 'today':
      return 'сегодня';
    case 'tomorrow':
      return 'завтра';
    case 'soon':
      return `через ${left} ${plural(left, 'день', 'дня', 'дней')}`;
    case 'later':
      return `до ${formatDayMonth(deadline)}`;
  }
}
