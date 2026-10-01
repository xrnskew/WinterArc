import type { AppData, RatingScale, Settings } from '../domain/types';
import { newId as defaultNewId } from '../lib/id';

/**
 * Текущая версия формы данных. Поднимай её на 1, когда меняешь типы
 * в domain/types.ts, и добавляй шаг в migrations.ts.
 */
export const CURRENT_VERSION = 2;

export const DEFAULT_SETTINGS: Settings = {
  themeId: 'winter',
  snow: 'snow',
  performance: 'auto',
};

/** Шкалы оценок дня по умолчанию — пользователь может их поменять. */
function defaultRatingScales(newId: () => string): RatingScale[] {
  return [
    { id: newId(), name: 'Энергия', icon: 'battery', archivedAt: null },
    { id: newId(), name: 'Настроение', icon: 'smile', archivedAt: null },
    { id: newId(), name: 'Фокус', icon: 'focus', archivedAt: null },
  ];
}

/** Данные нового пользователя: настройки по умолчанию, остальное пусто. */
export function createEmptyData(newId: () => string = defaultNewId): AppData {
  return {
    version: CURRENT_VERSION,
    settings: { ...DEFAULT_SETTINGS },
    activeArcId: null,
    arcs: [],
    habits: [],
    habitLogs: {},
    ratingScales: defaultRatingScales(newId),
    days: {},
    goals: [],
    tasks: [],
    weeklyReviews: {},
    achievements: [],
    dashboard: [],
  };
}
