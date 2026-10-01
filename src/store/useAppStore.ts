import { create } from 'zustand';
import {
  archiveActiveArc,
  startArc as startArcInData,
  updateArc as updateArcInData,
  type ArcDraft,
} from '../domain/arc';
import { nowTimestamp } from '../domain/dates';
import { setDayNote as setDayNoteInData, setRating as setRatingInData } from '../domain/days';
import {
  addHabit as addHabitToData,
  archiveHabit as archiveHabitInData,
  habitFromDraft,
  updateHabit as updateHabitInData,
  type HabitDraft,
} from '../domain/habits';
import { setLog } from '../domain/progress';
import type { AppData, DateKey, Id, Settings } from '../domain/types';
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

  addHabit: (draft: HabitDraft) => void;
  updateHabit: (habitId: Id, draft: HabitDraft) => void;
  archiveHabit: (habitId: Id) => void;
  /** Значение привычки за день: 1/0, штуки, минуты. */
  setHabitLog: (habitId: Id, date: DateKey, value: number) => void;
  setRating: (date: DateKey, scaleId: Id, value: number | null) => void;
  setDayNote: (date: DateKey, note: string) => void;

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
      const habits = newHabits.map((habitDraft) => habitFromDraft(habitDraft, newId(), now));
      change((data) =>
        startArcInData(data, { draft, newHabits: habits, keptHabitIds }, newId(), now),
      );
    },

    updateArc: (arcId, draft) => change((data) => updateArcInData(data, arcId, draft)),

    archiveArc: () => change((data) => archiveActiveArc(data, nowTimestamp())),

    addHabit: (draft) =>
      change((data) => addHabitToData(data, habitFromDraft(draft, newId(), nowTimestamp()))),

    updateHabit: (habitId, draft) => change((data) => updateHabitInData(data, habitId, draft)),

    archiveHabit: (habitId) => change((data) => archiveHabitInData(data, habitId, nowTimestamp())),

    setHabitLog: (habitId, date, value) => change((data) => setLog(data, habitId, date, value)),

    setRating: (date, scaleId, value) =>
      change((data) => setRatingInData(data, date, scaleId, value)),

    setDayNote: (date, note) => change((data) => setDayNoteInData(data, date, note)),

    dismissNotice: () => set({ notice: { kind: 'none' } }),
  };
});

// Сохраняем после каждого изменения данных.
useAppStore.subscribe((state, previous) => {
  if (state.data === previous.data || !state.canSave) return;
  const saved = saveData(storage, state.data);
  if (!saved) useAppStore.setState({ notice: { kind: 'saveFailed' } });
});
