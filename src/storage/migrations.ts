import type { AppData } from '../domain/types';
import { CURRENT_VERSION } from './schema';

/**
 * Миграции — как обновить данные старой версии до новой.
 *
 * Ключ — версия, В КОТОРУЮ переводит шаг. Шаг получает данные предыдущей
 * версии и возвращает данные следующей. Пример на будущее:
 *
 *   2: (data) => ({ ...data, settings: { ...data.settings, weekStartsOn: 1 } }),
 *
 * migrate() проходит шаги по порядку: v1 → v2 → v3 … до CURRENT_VERSION.
 * Старые шаги никогда не удаляем и не меняем — по ним обновляются бэкапы.
 */

/** Данные неизвестной формы: в старых версиях типы были другими. */
export type RawData = Record<string, unknown>;
export type Migration = (data: RawData) => RawData;

export const MIGRATIONS: Record<number, Migration> = {};

export type MigrationResult =
  | { status: 'current'; data: AppData }
  | { status: 'migrated'; data: AppData; from: number }
  | { status: 'newer'; version: number }
  | { status: 'invalid'; reason: string };

function isObject(value: unknown): value is RawData {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/** Грубая проверка формы: все ли разделы на месте и нужного типа. */
function looksLikeAppData(data: RawData): data is RawData & AppData {
  const arrays = [
    'arcs',
    'habits',
    'abstainEvents',
    'ratingScales',
    'goals',
    'tasks',
    'achievements',
    'dashboard',
  ];
  const objects = ['settings', 'habitLogs', 'days', 'weeklyReviews'];
  return (
    arrays.every((key) => Array.isArray(data[key])) &&
    objects.every((key) => isObject(data[key])) &&
    (data.activeArcId === null || typeof data.activeArcId === 'string')
  );
}

/**
 * Приводит данные любой поддерживаемой версии к текущей.
 * Данные новее приложения не трогаем — их сохранила более свежая версия.
 */
export function migrate(
  raw: unknown,
  steps: Record<number, Migration> = MIGRATIONS,
  target: number = CURRENT_VERSION,
): MigrationResult {
  if (!isObject(raw)) return { status: 'invalid', reason: 'Это не данные Winter Arc.' };

  const from = raw.version;
  if (typeof from !== 'number' || !Number.isInteger(from) || from < 1) {
    return { status: 'invalid', reason: 'Нет номера версии данных.' };
  }
  if (from > target) return { status: 'newer', version: from };

  let data = raw;
  for (let version = from + 1; version <= target; version++) {
    const step = steps[version];
    if (!step) return { status: 'invalid', reason: `Нет миграции до версии ${version}.` };
    data = { ...step(data), version };
  }

  if (!looksLikeAppData(data)) {
    return { status: 'invalid', reason: 'Данные повреждены: не хватает разделов.' };
  }
  return from === target ? { status: 'current', data } : { status: 'migrated', data, from };
}
