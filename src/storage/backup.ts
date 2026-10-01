import type { AppData, DateKey } from '../domain/types';
import { migrate } from './migrations';

/**
 * Экспорт и импорт данных в JSON-файл.
 * Импорт проходит через те же миграции, что и загрузка, поэтому старый
 * бэкап откроется в любой новой версии приложения.
 * Кнопки в настройках появятся на этапе «з».
 */

export function serializeBackup(data: AppData): string {
  return JSON.stringify(data, null, 2);
}

/** winter-arc-2026-10-01.json */
export function backupFileName(today: DateKey): string {
  return `winter-arc-${today}.json`;
}

export type ImportResult =
  { ok: true; data: AppData; migratedFrom: number | null } | { ok: false; error: string };

export function parseBackup(text: string): ImportResult {
  let raw: unknown;
  try {
    raw = JSON.parse(text);
  } catch {
    return { ok: false, error: 'Файл не похож на JSON. Выбери файл, который сохранил Winter Arc.' };
  }

  const result = migrate(raw);
  switch (result.status) {
    case 'current':
      return { ok: true, data: result.data, migratedFrom: null };
    case 'migrated':
      return { ok: true, data: result.data, migratedFrom: result.from };
    case 'newer':
      return {
        ok: false,
        error: `Бэкап сделан более новой версией приложения (данные v${result.version}). Обнови приложение и попробуй снова.`,
      };
    case 'invalid':
      return { ok: false, error: `Не получилось прочитать бэкап. ${result.reason}` };
  }
}
