import { useEffect } from 'react';
import { newlyEarned } from '../domain/achievements';
import type { DateKey } from '../domain/types';
import { useAppStore } from '../store/useAppStore';

/** Пауза перед проверкой: пока печатаешь заметку, жетоны не пересчитываются на каждую букву. */
const DELAY_MS = 400;

/**
 * Следит за данными и записывает жетоны, как только они заработаны.
 * Сообщение о новых жетонах показывает AchievementToast.
 */
export function useAchievementUnlocks(today: DateKey) {
  const data = useAppStore((state) => state.data);
  const canSave = useAppStore((state) => state.canSave);
  const unlock = useAppStore((state) => state.unlockAchievements);

  useEffect(() => {
    // Данные новее приложения или ещё нет арки — ничего не трогаем.
    if (!canSave || data.activeArcId === null) return;
    const timer = window.setTimeout(() => {
      const earned = newlyEarned(data, today);
      if (earned.length > 0) unlock(earned.map((achievement) => achievement.id));
    }, DELAY_MS);
    return () => window.clearTimeout(timer);
  }, [data, today, canSave, unlock]);
}
