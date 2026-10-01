import { daysBetween, isDateKey } from './dates';
import type { AppData, DateKey, Id, Task, Timestamp } from './types';

/**
 * Задачи: черновик (форма) → задача, отметка «сделано», сортировка, просрочка.
 * Просроченная задача — единственное (вместе с дедлайнами целей), что красное.
 */

export type TaskPriority = Task['priority'];

export const PRIORITY_LABELS: Record<TaskPriority, string> = {
  low: 'Низкий',
  medium: 'Обычный',
  high: 'Высокий',
};

/** Для сортировки: высокий — первым. */
const PRIORITY_RANK: Record<TaskPriority, number> = { high: 0, medium: 1, low: 2 };

export interface TaskDraft {
  title: string;
  goalId: Id | null;
  priority: TaskPriority;
  deadline: DateKey | null;
}

export const EMPTY_TASK_DRAFT: TaskDraft = {
  title: '',
  goalId: null,
  priority: 'medium',
  deadline: null,
};

export const TASK_TITLE_MAX = 100;

export interface TaskDraftErrors {
  title?: string;
  deadline?: string;
}

export function validateTaskDraft(draft: TaskDraft): TaskDraftErrors {
  const errors: TaskDraftErrors = {};
  const title = draft.title.trim();
  if (!title) errors.title = 'Напиши, что сделать.';
  else if (title.length > TASK_TITLE_MAX) errors.title = `Не длиннее ${TASK_TITLE_MAX} символов.`;
  if (draft.deadline !== null && !isDateKey(draft.deadline)) {
    errors.deadline = 'Выбери дату или «Без срока».';
  }
  return errors;
}

export function taskFromDraft(draft: TaskDraft, id: Id, now: Timestamp): Task {
  return {
    id,
    title: draft.title.trim(),
    goalId: draft.goalId,
    priority: draft.priority,
    deadline: draft.deadline,
    doneAt: null,
    createdAt: now,
  };
}

export function draftFromTask(task: Task): TaskDraft {
  return {
    title: task.title,
    goalId: task.goalId,
    priority: task.priority,
    deadline: task.deadline,
  };
}

// ── Изменения в данных ───────────────────────────────────

export function getTask(data: AppData, taskId: Id): Task | undefined {
  return data.tasks.find((task) => task.id === taskId);
}

export function addTask(data: AppData, task: Task): AppData {
  return { ...data, tasks: [...data.tasks, task] };
}

export function updateTask(data: AppData, taskId: Id, draft: TaskDraft): AppData {
  return {
    ...data,
    tasks: data.tasks.map((task) =>
      task.id === taskId ? { ...task, ...draft, title: draft.title.trim() } : task,
    ),
  };
}

/** Сделано ↔ не сделано. */
export function toggleTask(data: AppData, taskId: Id, now: Timestamp): AppData {
  return {
    ...data,
    tasks: data.tasks.map((task) =>
      task.id === taskId ? { ...task, doneAt: task.doneAt === null ? now : null } : task,
    ),
  };
}

export function deleteTask(data: AppData, taskId: Id): AppData {
  return { ...data, tasks: data.tasks.filter((task) => task.id !== taskId) };
}

// ── Списки ───────────────────────────────────────────────

/** Не сделана, а дедлайн уже прошёл. */
export function isTaskOverdue(task: Task, today: DateKey): boolean {
  return task.doneAt === null && task.deadline !== null && daysBetween(today, task.deadline) < 0;
}

/**
 * Порядок открытых задач: по дедлайну (просроченные сами окажутся сверху,
 * без дедлайна — в конце), при равном дедлайне — по приоритету,
 * дальше — кто раньше создан.
 */
export function compareOpenTasks(a: Task, b: Task): number {
  if (a.deadline !== b.deadline) {
    if (a.deadline === null) return 1;
    if (b.deadline === null) return -1;
    return daysBetween(b.deadline, a.deadline);
  }
  const byPriority = PRIORITY_RANK[a.priority] - PRIORITY_RANK[b.priority];
  if (byPriority !== 0) return byPriority;
  return a.createdAt.localeCompare(b.createdAt);
}

/** Открытые задачи по порядку. goalId — только задачи этой цели. */
export function openTasks(data: AppData, goalId?: Id): Task[] {
  return data.tasks
    .filter((task) => task.doneAt === null && (goalId === undefined || task.goalId === goalId))
    .sort(compareOpenTasks);
}

/** Сделанные задачи, последние — сверху. */
export function doneTasks(data: AppData, goalId?: Id): Task[] {
  return data.tasks
    .filter((task) => task.doneAt !== null && (goalId === undefined || task.goalId === goalId))
    .sort((a, b) => b.doneAt!.localeCompare(a.doneAt!));
}
