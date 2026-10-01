import { useEffect, useState } from 'react';
import { todayKey } from '../domain/dates';
import type { DateKey } from '../domain/types';

/** Миллисекунд до ближайшей полуночи по местному времени. */
function msUntilMidnight(now: Date): number {
  const midnight = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
  return midnight.getTime() - now.getTime();
}

/**
 * Сегодняшняя дата. Сама меняется в полночь и при возвращении
 * во вкладку (телефон мог «спать» всю ночь — таймеры там не идут).
 */
export function useToday(): DateKey {
  const [today, setToday] = useState(() => todayKey());

  useEffect(() => {
    const refresh = () => setToday(todayKey());
    // +1 с запаса, чтобы точно оказаться уже в новых сутках.
    const timer = window.setTimeout(refresh, msUntilMidnight(new Date()) + 1000);
    document.addEventListener('visibilitychange', refresh);
    return () => {
      window.clearTimeout(timer);
      document.removeEventListener('visibilitychange', refresh);
    };
  }, [today]);

  return today;
}
