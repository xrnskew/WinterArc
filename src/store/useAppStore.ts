import { create } from 'zustand';
import {
  archiveActiveArc,
  startArc as startArcInData,
  updateArc as updateArcInData,
  type ArcDraft,
} from '../domain/arc';
import {
  addWidget as addWidgetToData,
  moveWidget as moveWidgetInData,
  removeWidget as removeWidgetFromData,
  resizeWidget as resizeWidgetInData,
  widgetInfo,
} from '../domain/dashboard';
import { unlockAchievements as unlockInData } from '../domain/achievements';
import { nowTimestamp } from '../domain/dates';
import { setDayNote as setDayNoteInData, setRating as setRatingInData } from '../domain/days';
import {
  addEntry,
  addGoal as addGoalToData,
  addStep,
  archiveGoal as archiveGoalInData,
  goalFromDraft,
  removeEntry,
  removeStep,
  toggleStep,
  updateGoal as updateGoalInData,
  type EntryDraft,
  type GoalDraft,
} from '../domain/goals';
import {
  addHabit as addHabitToData,
  archiveHabit as archiveHabitInData,
  habitFromDraft,
  updateHabit as updateHabitInData,
  type HabitDraft,
} from '../domain/habits';
import { setLog } from '../domain/progress';
import {
  addTask as addTaskToData,
  deleteTask as deleteTaskFromData,
  taskFromDraft,
  toggleTask as toggleTaskInData,
  updateTask as updateTaskInData,
  type TaskDraft,
} from '../domain/tasks';
import type {
  AppData,
  DateKey,
  Id,
  Settings,
  WidgetInstance,
  WidgetSize,
  WidgetType,
} from '../domain/types';
import { saveReview, type ReviewAnswers } from '../domain/weeklyReview';
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
  /** Жетоны, полученные только что, — для всплывающего сообщения. Не сохраняются. */
  freshAchievements: string[];

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

  /** Новая цель привязывается к текущей арке. */
  addGoal: (draft: GoalDraft) => void;
  updateGoal: (goalId: Id, draft: GoalDraft) => void;
  archiveGoal: (goalId: Id) => void;
  addGoalStep: (goalId: Id, title: string) => void;
  toggleGoalStep: (goalId: Id, stepId: Id) => void;
  removeGoalStep: (goalId: Id, stepId: Id) => void;
  addGoalEntry: (goalId: Id, entry: EntryDraft) => void;
  removeGoalEntry: (goalId: Id, entryId: Id) => void;

  addTask: (draft: TaskDraft) => void;
  updateTask: (taskId: Id, draft: TaskDraft) => void;
  toggleTask: (taskId: Id) => void;
  deleteTask: (taskId: Id) => void;

  /** Добавить виджет; target — привычка, шкала или цель, если виджет к ним привязан. */
  addWidget: (
    type: WidgetType,
    target?: Pick<WidgetInstance, 'habitId' | 'scaleId' | 'goalId'>,
  ) => void;
  removeWidget: (widgetId: Id) => void;
  moveWidget: (widgetId: Id, step: -1 | 1) => void;
  resizeWidget: (widgetId: Id, size: WidgetSize) => void;

  /** Ответы обзора недели; ключ — понедельник. */
  saveWeeklyReview: (monday: DateKey, answers: ReviewAnswers) => void;
  /** Записать полученные жетоны и показать сообщение о них. */
  unlockAchievements: (ids: string[]) => void;
  dismissFreshAchievements: () => void;

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
    freshAchievements: [],

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

    addGoal: (draft) =>
      change((data) =>
        addGoalToData(data, goalFromDraft(draft, newId, data.activeArcId, nowTimestamp())),
      ),

    updateGoal: (goalId, draft) =>
      change((data) => updateGoalInData(data, goalId, draft, nowTimestamp())),

    archiveGoal: (goalId) => change((data) => archiveGoalInData(data, goalId, nowTimestamp())),

    addGoalStep: (goalId, title) =>
      change((data) => addStep(data, goalId, newId(), title, nowTimestamp())),

    toggleGoalStep: (goalId, stepId) =>
      change((data) => toggleStep(data, goalId, stepId, nowTimestamp())),

    removeGoalStep: (goalId, stepId) =>
      change((data) => removeStep(data, goalId, stepId, nowTimestamp())),

    addGoalEntry: (goalId, entry) =>
      change((data) => addEntry(data, goalId, newId(), entry, nowTimestamp())),

    removeGoalEntry: (goalId, entryId) =>
      change((data) => removeEntry(data, goalId, entryId, nowTimestamp())),

    addTask: (draft) =>
      change((data) => addTaskToData(data, taskFromDraft(draft, newId(), nowTimestamp()))),

    updateTask: (taskId, draft) => change((data) => updateTaskInData(data, taskId, draft)),

    toggleTask: (taskId) => change((data) => toggleTaskInData(data, taskId, nowTimestamp())),

    deleteTask: (taskId) => change((data) => deleteTaskFromData(data, taskId)),

    addWidget: (type, target = {}) =>
      change((data) =>
        addWidgetToData(data, {
          id: newId(),
          type,
          size: widgetInfo(type).defaultSize,
          ...target,
        }),
      ),

    removeWidget: (widgetId) => change((data) => removeWidgetFromData(data, widgetId)),

    moveWidget: (widgetId, step) => change((data) => moveWidgetInData(data, widgetId, step)),

    resizeWidget: (widgetId, size) => change((data) => resizeWidgetInData(data, widgetId, size)),

    saveWeeklyReview: (monday, answers) =>
      change((data) => saveReview(data, monday, answers, nowTimestamp())),

    unlockAchievements: (ids) =>
      set((state) => ({
        data: unlockInData(state.data, ids, nowTimestamp()),
        freshAchievements: [...state.freshAchievements, ...ids],
      })),

    dismissFreshAchievements: () => set({ freshAchievements: [] }),

    dismissNotice: () => set({ notice: { kind: 'none' } }),
  };
});

// Сохраняем после каждого изменения данных.
useAppStore.subscribe((state, previous) => {
  if (state.data === previous.data || !state.canSave) return;
  const saved = saveData(storage, state.data);
  if (!saved) useAppStore.setState({ notice: { kind: 'saveFailed' } });
});
