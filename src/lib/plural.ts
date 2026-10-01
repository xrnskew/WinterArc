/**
 * Русское склонение после числа:
 * plural(1, 'день', 'дня', 'дней') → 'день'
 * plural(3, …) → 'дня', plural(11, …) → 'дней', plural(22, …) → 'дня'
 */
export function plural(count: number, one: string, few: string, many: string): string {
  const n = Math.abs(Math.trunc(count));
  const lastTwo = n % 100;
  const last = n % 10;
  if (lastTwo >= 11 && lastTwo <= 14) return many;
  if (last === 1) return one;
  if (last >= 2 && last <= 4) return few;
  return many;
}
