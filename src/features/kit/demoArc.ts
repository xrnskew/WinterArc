import type { TallyDay } from '../../design/ui/tally/Tally';
import { between, createRandom } from '../../lib/random';

function toDateKey(date: Date): string {
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${date.getFullYear()}-${month}-${day}`;
}

/**
 * Пример арки для витрины: 1 октября – 31 декабря 2026, сегодня — 40-й день.
 * Настоящие данные появятся на этапе «б».
 */
export function makeDemoArc(todayIndex = 39): TallyDay[] {
  const random = createRandom(7);
  const start = new Date(2026, 9, 1);
  const length = 92;

  return Array.from({ length }, (_, i) => {
    const date = new Date(start.getFullYear(), start.getMonth(), start.getDate() + i);
    const status = i < todayIndex ? 'past' : i === todayIndex ? 'today' : 'future';
    return {
      key: toDateKey(date),
      weekday: ((date.getDay() + 6) % 7) + 1, // getDay: 0 = вс → наш 7
      status,
      score: status === 'past' ? Math.min(1, between(random, 0.3, 1.2)) : null,
    };
  });
}
