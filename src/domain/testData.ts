import { createEmptyData } from '../storage/schema';
import { startArc } from './arc';
import { EMPTY_HABIT_DRAFT, habitFromDraft, type HabitDraft } from './habits';
import type { AppData, Habit } from './types';

/**
 * Помощники для тестов: быстро собрать данные с аркой и привычками.
 * В приложении не используются.
 */

export const ARC_START = '2026-10-01'; // четверг
export const CREATED = '2026-10-01T08:00:00.000Z';

let counter = 0;
const testId = () => `test-${++counter}`;

export function makeHabit(id: string, patch: Partial<HabitDraft>): Habit {
  return habitFromDraft({ ...EMPTY_HABIT_DRAFT, name: id, ...patch }, id, CREATED, ARC_START);
}

/** Данные с аркой 1 октября – 31 декабря 2026 и переданными привычками. */
export function makeData(habits: Habit[]): AppData {
  return startArc(
    createEmptyData(testId),
    {
      draft: { name: 'Winter Arc 2026', why: '', startDate: ARC_START, endDate: '2026-12-31' },
      newHabits: habits,
      keptHabitIds: [],
    },
    'arc',
    CREATED,
  );
}
