import type { AppData } from '../domain/types';
import { migrate } from './migrations';
import { createEmptyData } from './schema';

/**
 * Загрузка и сохранение данных в localStorage.
 * Хранилище передаём параметром — в тестах подставляем поддельное.
 */

export const STORAGE_KEY = 'winterarc:data';
/** Копия сырых данных перед миграцией: winterarc:backup:v1. */
export const backupKey = (version: number) => `winterarc:backup:v${version}`;
/** Нечитаемые данные откладываем сюда, чтобы не потерять: winterarc:corrupt:<время>. */
export const CORRUPT_KEY_PREFIX = 'winterarc:corrupt:';

/** Копия данных перед импортом или сбросом — на случай, если передумаешь. */
export const BEFORE_REPLACE_KEY = 'winterarc:before-replace';

export type KeyValueStorage = Pick<Storage, 'getItem' | 'setItem'>;

/**
 * localStorage браузера. Если браузер его запрещает (хранение данных
 * отключено), обращение бросает ошибку — тогда работаем в памяти,
 * а persistent = false, чтобы предупредить пользователя.
 */
export function openBrowserStorage(): { storage: KeyValueStorage; persistent: boolean } {
  try {
    const storage = window.localStorage;
    storage.getItem(STORAGE_KEY);
    return { storage, persistent: true };
  } catch {
    const memory = new Map<string, string>();
    return {
      storage: {
        getItem: (key) => memory.get(key) ?? null,
        setItem: (key, value) => void memory.set(key, value),
      },
      persistent: false,
    };
  }
}

export type LoadResult =
  /** Первый запуск. */
  | { status: 'empty'; data: AppData }
  | { status: 'ok'; data: AppData }
  /** Данные обновлены до текущей версии, старая копия — в backupKey(from). */
  | { status: 'migrated'; data: AppData; from: number }
  /** Данные сохранены более новой версией приложения. Их нельзя перезаписывать. */
  | { status: 'newer'; data: AppData; version: number }
  /** Данные не прочитались. Они отложены в savedAs, приложение начинает с чистого листа. */
  | { status: 'corrupt'; data: AppData; savedAs: string };

export function loadData(storage: KeyValueStorage, now: Date = new Date()): LoadResult {
  const text = storage.getItem(STORAGE_KEY);
  if (text === null) return { status: 'empty', data: createEmptyData() };

  // Нечитаемое откладываем в отдельный ключ, а на основное место кладём
  // чистые данные — иначе каждая перезагрузка находила бы ту же ошибку.
  const putAside = (): LoadResult => {
    const savedAs = CORRUPT_KEY_PREFIX + now.toISOString();
    const data = createEmptyData();
    storage.setItem(savedAs, text);
    saveData(storage, data);
    return { status: 'corrupt', data, savedAs };
  };

  let raw: unknown;
  try {
    raw = JSON.parse(text);
  } catch {
    return putAside();
  }

  const result = migrate(raw);
  switch (result.status) {
    case 'current':
      return { status: 'ok', data: result.data };
    case 'migrated':
      storage.setItem(backupKey(result.from), text);
      saveData(storage, result.data);
      return { status: 'migrated', data: result.data, from: result.from };
    case 'newer':
      return { status: 'newer', data: createEmptyData(), version: result.version };
    case 'invalid':
      return putAside();
  }
}

/** Сохраняет данные. false — не получилось (например, закончилось место). */
export function saveData(storage: KeyValueStorage, data: AppData): boolean {
  try {
    storage.setItem(STORAGE_KEY, JSON.stringify(data));
    return true;
  } catch {
    return false;
  }
}

/** Сохранить копию текущих данных перед импортом или сбросом. false — не получилось. */
export function saveCopyBeforeReplace(storage: KeyValueStorage, data: AppData): boolean {
  try {
    storage.setItem(BEFORE_REPLACE_KEY, JSON.stringify(data));
    return true;
  } catch {
    return false;
  }
}

/** Копия данных до последнего импорта или сброса; null — копии нет. */
export function readCopyBeforeReplace(storage: KeyValueStorage): string | null {
  return storage.getItem(BEFORE_REPLACE_KEY);
}
