import { create } from 'zustand';
import {
  archiveActiveArc,
  startArc as startArcInData,
  updateArc as updateArcInData,
  type ArcDraft,
} from '../domain/arc';
import { nowTimestamp } from '../domain/dates';
import { habitFromDraft, type HabitDraft } from '../domain/habits';
import type { AppData, Id, Settings } from '../domain/types';
import { newId } from '../lib/id';
import { loadData, openBrowserStorage, saveData, type LoadResult } from '../storage/localStore';

/**
 * Глобальное состояние приложения (Zustand).
 *
 * Компонент читает нужный кусок: useAppStore((s) => s.data.settings.snow)
 * и перерисовывается, только когда меняется именно он.
 *
 * Действия здесь тонкие: вся логика — в domain/*.ts, а стор только
 * передаёт туда «сейчас», новые id и сохраняет результат.
 */

/** Что случилось при загрузке — для предупреждений на экране. */
export type StorageNotice =
  | { kind: 'none' }
  | { kind: 'migrated'; from: number }
  | { kind: 'newer'; version: number }
  | { kind: 'corrupt'; savedAs: string }
  | { kind: 'saveFailed' }
  /** Браузер запрещает хранить данные — всё живёт до закрытия вкладки. */
  | { kind: 'noStorage' };

export interface StartArcRequest {
  draft: ArcDraft;
  /** Новые привычки — черновики из шаблонов или формы. */
  newHabits: HabitDraft[];
  /** Привычки прошлой арки, которые берём с собой. */
  keptHabitIds: Id[];
}

interface AppState {
  data: AppData;
  notice: StorageNotice;
  /** false — данные сохранены более новой версией, перезаписывать нельзя. */
  canSave: boolean;

  updateSettings: (patch: Partial<Settings>) => void;
  startArc: (request: StartArcRequest) => void;
  updateArc: (arcId: Id, draft: ArcDraft) => void;
  archiveArc: () => void;
  dismissNotice: () => void;
}

function noticeFrom(result: LoadResult): StorageNotice {
  switch (result.status) {
    case 'migrated':
      return { kind: 'migrated', from: result.from };
    case 'newer':
      return { kind: 'newer', version: result.version };
    case 'corrupt':
      return { kind: 'corrupt', savedAs: result.savedAs };
    default:
      return { kind: 'none' };
  }
}

const { storage, persistent } = openBrowserStorage();
const loaded = loadData(storage);

export const useAppStore = create<AppState>((set) => {
  /** Применяет изменение к данным: data → новые data. */
  const change = (update: (data: AppData) => AppData) =>
    set((state) => ({ data: update(state.data) }));

  return {
    data: loaded.data,
    notice: persistent ? noticeFrom(loaded) : { kind: 'noStorage' },
    canSave: loaded.status !== 'newer',

    updateSettings: (patch) =>
      change((data) => ({ ...data, settings: { ...data.settings, ...patch } })),

    startArc: ({ draft, newHabits, keptHabitIds }) => {
      const now = nowTimestamp();
      // Чистые дни отказа считаем с начала арки.
      const habits = newHabits.map((habitDraft) =>
        habitFromDraft(habitDraft, newId(), now, draft.startDate),
      );
      change((data) =>
        startArcInData(data, { draft, newHabits: habits, keptHabitIds }, newId(), now),
      );
    },

    updateArc: (arcId, draft) => change((data) => updateArcInData(data, arcId, draft)),

    archiveArc: () => change((data) => archiveActiveArc(data, nowTimestamp())),

    dismissNotice: () => set({ notice: { kind: 'none' } }),
  };
});

// Сохраняем после каждого изменения данных.
useAppStore.subscribe((state, previous) => {
  if (state.data === previous.data || !state.canSave) return;
  const saved = saveData(storage, state.data);
  if (!saved) useAppStore.setState({ notice: { kind: 'saveFailed' } });
});
