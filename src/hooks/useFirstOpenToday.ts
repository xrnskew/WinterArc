import { useEffect, useState } from 'react';
import type { DateKey } from '../domain/types';

const KEY = 'winterarc:last-open';

function readLastOpen(): string | null {
  try {
    return window.localStorage.getItem(KEY);
  } catch {
    return null;
  }
}

/**
 * Первое ли это открытие приложения за сегодня.
 * Нужно, чтобы цифры-табло «пересчитывались» один раз в день,
 * а не при каждом заходе на экран. Хранится только на этом устройстве.
 */
export function useFirstOpenToday(today: DateKey): boolean {
  // Читаем при первом рендере, запоминаем после — так проверка не сбивается сама собой.
  const [first] = useState(() => readLastOpen() !== today);

  useEffect(() => {
    try {
      window.localStorage.setItem(KEY, today);
    } catch {
      // Без хранилища просто не пересчитываем каждый раз заново — ничего страшного.
    }
  }, [today]);

  return first;
}
