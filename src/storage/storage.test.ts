import { describe, expect, it } from 'vitest';
import { parseBackup, serializeBackup } from './backup';
import { backupKey, CORRUPT_KEY_PREFIX, loadData, saveData, STORAGE_KEY } from './localStore';
import { migrate, MIGRATIONS, type Migration } from './migrations';
import { createEmptyData, CURRENT_VERSION } from './schema';

/** Поддельный localStorage на Map. */
function fakeStorage(initial: Record<string, string> = {}) {
  const map = new Map(Object.entries(initial));
  return {
    map,
    getItem: (key: string) => map.get(key) ?? null,
    setItem: (key: string, value: string) => void map.set(key, value),
  };
}

const NOW = new Date('2026-10-01T08:00:00.000Z');

describe('createEmptyData', () => {
  it('текущая версия, нет арки, три шкалы по умолчанию', () => {
    const data = createEmptyData();
    expect(data.version).toBe(CURRENT_VERSION);
    expect(data.activeArcId).toBeNull();
    expect(data.ratingScales.map((s) => s.name)).toEqual(['Энергия', 'Настроение', 'Фокус']);
  });
});

describe('migrate', () => {
  // Учебные миграции: v1 → v2 добавляет поле, v2 → v3 переименовывает.
  const steps: Record<number, Migration> = {
    2: (data) => ({ ...data, extra: 'added in v2' }),
    3: ({ extra, ...rest }) => ({ ...rest, renamed: extra }),
  };

  it('проходит шаги по порядку и ставит новую версию', () => {
    const v1 = { ...createEmptyData(), version: 1 };
    const result = migrate(v1, steps, 3);
    expect(result.status).toBe('migrated');
    if (result.status !== 'migrated') return;
    expect(result.from).toBe(1);
    expect(result.data.version).toBe(3);
    expect(result.data).toMatchObject({ renamed: 'added in v2' });
    expect(result.data).not.toHaveProperty('extra');
  });

  it('текущая версия — без изменений', () => {
    expect(migrate(createEmptyData()).status).toBe('current');
  });

  it('данные новее приложения не трогаем', () => {
    const result = migrate({ ...createEmptyData(), version: CURRENT_VERSION + 1 });
    expect(result).toEqual({ status: 'newer', version: CURRENT_VERSION + 1 });
  });

  it('без версии или без разделов — ошибка', () => {
    expect(migrate({ hello: 'world' }).status).toBe('invalid');
    expect(migrate([1, 2, 3]).status).toBe('invalid');
    expect(migrate({ version: CURRENT_VERSION }).status).toBe('invalid');
  });

  it('пропущенный шаг миграции — ошибка, а не тихая порча данных', () => {
    const result = migrate({ ...createEmptyData(), version: 1 }, { 3: (d) => d }, 3);
    expect(result.status).toBe('invalid');
  });
});

describe('localStore', () => {
  it('первый запуск — пустые данные', () => {
    expect(loadData(fakeStorage(), NOW).status).toBe('empty');
  });

  it('сохранили → загрузили то же самое', () => {
    const storage = fakeStorage();
    const data = createEmptyData();
    expect(saveData(storage, data)).toBe(true);
    const loaded = loadData(storage, NOW);
    expect(loaded.status).toBe('ok');
    expect(loaded.data).toEqual(data);
  });

  it('битый JSON откладываем в сторону и начинаем заново', () => {
    const storage = fakeStorage({ [STORAGE_KEY]: '{oops' });
    const loaded = loadData(storage, NOW);
    expect(loaded.status).toBe('corrupt');
    if (loaded.status !== 'corrupt') return;
    expect(loaded.savedAs.startsWith(CORRUPT_KEY_PREFIX)).toBe(true);
    expect(storage.map.get(loaded.savedAs)).toBe('{oops');
  });

  it('после битых данных следующая загрузка уже нормальная, копия одна', () => {
    const storage = fakeStorage({ [STORAGE_KEY]: '{oops' });
    loadData(storage, NOW);
    const second = loadData(storage, new Date('2026-10-01T09:00:00.000Z'));
    expect(second.status).toBe('ok');
    const copies = [...storage.map.keys()].filter((key) => key.startsWith(CORRUPT_KEY_PREFIX));
    expect(copies).toHaveLength(1);
  });

  it('данные новее приложения — статус newer, хранилище не трогаем', () => {
    const newer = JSON.stringify({ ...createEmptyData(), version: CURRENT_VERSION + 5 });
    const storage = fakeStorage({ [STORAGE_KEY]: newer });
    const loaded = loadData(storage, NOW);
    expect(loaded.status).toBe('newer');
    expect(storage.map.get(STORAGE_KEY)).toBe(newer);
    expect(storage.map.size).toBe(1);
  });

  it('место закончилось — saveData возвращает false, а не падает', () => {
    const storage = {
      getItem: () => null,
      setItem: () => {
        throw new Error('QuotaExceededError');
      },
    };
    expect(saveData(storage, createEmptyData())).toBe(false);
  });

  it('ключ копии перед миграцией', () => {
    expect(backupKey(1)).toBe('winterarc:backup:v1');
  });
});

describe('бэкап', () => {
  it('экспорт → импорт возвращает те же данные', () => {
    const data = createEmptyData();
    const result = parseBackup(serializeBackup(data));
    expect(result).toEqual({ ok: true, data, migratedFrom: null });
  });

  it('понятные ошибки на чужой файл', () => {
    const notJson = parseBackup('hello');
    const notOurs = parseBackup('{"name": "something else"}');
    expect(notJson.ok).toBe(false);
    expect(notOurs.ok).toBe(false);
  });
});

describe('миграция v1 → v2: тип «Отказ» убран', () => {
  const v1 = {
    ...createEmptyData(),
    version: 1,
    settings: { themeId: 'winter', snow: 'snow', performance: 'auto', currency: '₽' },
    activeArcId: 'arc',
    arcs: [
      {
        id: 'arc',
        name: 'Winter Arc 2026',
        why: '',
        startDate: '2026-10-01',
        endDate: '2026-12-31',
        habitIds: ['read', 'smoke'],
        createdAt: '2026-10-01T08:00:00.000Z',
        archivedAt: null,
      },
    ],
    habits: [
      { id: 'read', kind: 'check', name: 'Чтение' },
      { id: 'smoke', kind: 'abstain', name: 'Не курить', startDate: '2026-10-01', costPerDay: 300 },
    ],
    habitLogs: { read: { '2026-10-01': 1 }, smoke: {} },
    abstainEvents: [{ id: 'e1', habitId: 'smoke', date: '2026-10-02', type: 'relapse' }],
    dashboard: [
      { id: 'w1', type: 'moneySaved', size: 'half', habitId: 'smoke' },
      { id: 'w2', type: 'countdown', size: 'full' },
    ],
  };

  it('отказы, их события и записи удаляются, остальное остаётся', () => {
    // Только шаг до v2 — следующие шаги проверяются отдельно.
    const result = migrate(v1, MIGRATIONS, 2);
    expect(result.status).toBe('migrated');
    if (result.status !== 'migrated') return;
    const data = result.data as unknown as Record<string, unknown>;
    expect(data.version).toBe(2);
    expect(result.data.habits.map((h) => h.id)).toEqual(['read']);
    expect(result.data.arcs[0].habitIds).toEqual(['read']);
    expect(result.data.habitLogs).toEqual({ read: { '2026-10-01': 1 } });
    expect(data).not.toHaveProperty('abstainEvents');
    expect(result.data.settings).not.toHaveProperty('currency');
    expect(result.data.dashboard.map((w) => w.id)).toEqual(['w2']);
  });

  it('при загрузке старые данные сохраняются копией в winterarc:backup:v1', () => {
    const storage = fakeStorage({ [STORAGE_KEY]: JSON.stringify(v1) });
    const loaded = loadData(storage, NOW);
    expect(loaded.status).toBe('migrated');
    expect(storage.map.get(backupKey(1))).toBe(JSON.stringify(v1));
  });
});

describe('миграция v2 → v3: отсчёт и прогресс — не виджеты', () => {
  const v2 = (dashboard: object[]) => ({ ...createEmptyData(), version: 2, dashboard });

  it('пустой список виджетов заполняется набором по умолчанию', () => {
    const result = migrate(v2([]));
    expect(result.status).toBe('migrated');
    if (result.status !== 'migrated') return;
    expect(result.data.dashboard.map((w) => w.type)).toEqual([
      'discipline',
      'week',
      'today',
      'why',
    ]);
  });

  it('countdown и arcProgress убираются, остальные остаются по порядку', () => {
    const result = migrate(
      v2([
        { id: 'a', type: 'countdown', size: 'full' },
        { id: 'b', type: 'streak', size: 'half', habitId: 'h' },
        { id: 'c', type: 'arcProgress', size: 'half' },
      ]),
    );
    if (result.status !== 'migrated') throw new Error(result.status);
    expect(result.data.dashboard.map((w) => w.id)).toEqual(['b']);
  });
});
