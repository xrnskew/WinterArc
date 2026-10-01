import type { AppData } from '../domain/types';
import { CURRENT_VERSION } from './schema';

/**
 * Миграции — как обновить данные старой версии до новой.
 *
 * Ключ — версия, В КОТОРУЮ переводит шаг. Шаг получает данные предыдущей
 * версии и возвращает данные следующей. Простой пример:
 *
 *   3: (data) => ({ ...data, settings: { ...data.settings, weekStartsOn: 1 } }),
 *
 * migrate() проходит шаги по порядку: v1 → v2 → v3 … до CURRENT_VERSION.
 * Старые шаги никогда не удаляем и не меняем — по ним обновляются бэкапы.
 */

/** Данные неизвестной формы: в старых версиях типы были другими. */
export type RawData = Record<string, unknown>;
export type Migration = (data: RawData) => RawData;

function isObject(value: unknown): value is RawData {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/** Массив объектов из сырых данных (не массив → пустой). */
function objects(value: unknown): RawData[] {
  return Array.isArray(value) ? value.filter(isObject) : [];
}

export const MIGRATIONS: Record<number, Migration> = {
  /**
   * v1 → v2: убран тип привычки «Отказ» вместе со срывами, тягами
   * и подсчётом сэкономленных денег (а с ним — валюта в настройках).
   */
  2: (data) => {
    const removed = new Set(
      objects(data.habits)
        .filter((habit) => habit.kind === 'abstain')
        .map((habit) => habit.id),
    );
    const habitLogs = isObject(data.habitLogs) ? { ...data.habitLogs } : {};
    for (const id of removed) delete habitLogs[id as string];

    const { abstainEvents: _events, ...rest } = data;
    const { currency: _currency, ...settings } = isObject(data.settings) ? data.settings : {};

    return {
      ...rest,
      settings,
      habits: objects(data.habits).filter((habit) => !removed.has(habit.id)),
      habitLogs,
      arcs: objects(data.arcs).map((arc) => ({
        ...arc,
        habitIds: Array.isArray(arc.habitIds) ? arc.habitIds.filter((id) => !removed.has(id)) : [],
      })),
      dashboard: objects(data.dashboard).filter(
        (widget) => widget.type !== 'moneySaved' && !removed.has(widget.habitId),
      ),
    };
  },

  /**
   * v2 → v3: отсчёт и прогресс арки больше не виджеты — они всегда сверху
   * командного центра. До v3 виджеты нельзя было настроить, поэтому пустой
   * список заполняем набором по умолчанию.
   */
  3: (data) => {
    const kept = objects(data.dashboard).filter(
      (widget) => widget.type !== 'countdown' && widget.type !== 'arcProgress',
    );
    // Набор записан здесь целиком, а не взят из dashboard.ts: шаг миграции
    // не должен меняться, даже если набор по умолчанию потом станет другим.
    const defaults = [
      { id: 'widget-v3-1', type: 'discipline', size: 'half' },
      { id: 'widget-v3-2', type: 'week', size: 'half' },
      { id: 'widget-v3-3', type: 'today', size: 'full' },
      { id: 'widget-v3-4', type: 'why', size: 'full' },
    ];
    return { ...data, dashboard: kept.length > 0 ? kept : defaults };
  },
};

export type MigrationResult =
  | { status: 'current'; data: AppData }
  | { status: 'migrated'; data: AppData; from: number }
  | { status: 'newer'; version: number }
  | { status: 'invalid'; reason: string };

/** Грубая проверка формы: все ли разделы на месте и нужного типа. */
function looksLikeAppData(data: RawData): data is RawData & AppData {
  const arrays = ['arcs', 'habits', 'ratingScales', 'goals', 'tasks', 'achievements', 'dashboard'];
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
