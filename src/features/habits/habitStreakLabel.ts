import { habitStreak } from '../../domain/progress';
import type { AppData, DateKey, Habit } from '../../domain/types';
import { plural } from '../../lib/plural';

export interface StreakLabel {
  value: number;
  /** «дней», «недели» — для подписи под числом. */
  unit: string;
  /** «дней подряд», «недели подряд». */
  label: string;
}

/** Текущая серия привычки и подписи к числу. */
export function currentStreak(habit: Habit, data: AppData, today: DateKey): StreakLabel {
  const streak = habitStreak(habit, data.habitLogs, today);
  const unit =
    streak.unit === 'week'
      ? plural(streak.current, 'неделя', 'недели', 'недель')
      : plural(streak.current, 'день', 'дня', 'дней');
  return { value: streak.current, unit, label: `${unit} подряд` };
}
