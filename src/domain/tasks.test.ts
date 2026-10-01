import { describe, expect, it } from 'vitest';
import { deadlineStatus, describeDeadline } from './deadlines';
import {
  addTask,
  deleteTask,
  doneTasks,
  EMPTY_TASK_DRAFT,
  isTaskOverdue,
  openTasks,
  taskFromDraft,
  toggleTask,
  updateTask,
  validateTaskDraft,
  type TaskDraft,
} from './tasks';
import { CREATED, makeData } from './testData';
import type { AppData } from './types';

const TODAY = '2026-10-10';

function withTasks(drafts: (Partial<TaskDraft> & { title: string })[]): AppData {
  return drafts.reduce(
    (data, draft, i) =>
      addTask(data, taskFromDraft({ ...EMPTY_TASK_DRAFT, ...draft }, `t${i}`, CREATED)),
    makeData([]),
  );
}

describe('задачи', () => {
  it('без названия не сохраняется', () => {
    expect(validateTaskDraft(EMPTY_TASK_DRAFT).title).toBeDefined();
    expect(validateTaskDraft({ ...EMPTY_TASK_DRAFT, title: 'Купить шины' })).toEqual({});
  });

  it('отметка и снятие, удаление', () => {
    let data = withTasks([{ title: 'Купить шины' }]);
    data = toggleTask(data, 't0', '2026-10-10T09:00:00.000Z');
    expect(data.tasks[0].doneAt).toBe('2026-10-10T09:00:00.000Z');
    data = toggleTask(data, 't0', '2026-10-10T09:05:00.000Z');
    expect(data.tasks[0].doneAt).toBeNull();
    expect(deleteTask(data, 't0').tasks).toEqual([]);
  });

  it('правка меняет поля формы и не трогает остальное', () => {
    let data = withTasks([{ title: 'Купить шины' }]);
    data = updateTask(data, 't0', { ...EMPTY_TASK_DRAFT, title: ' Шины ', priority: 'high' });
    expect(data.tasks[0]).toMatchObject({ title: 'Шины', priority: 'high', createdAt: CREATED });
  });

  it('просрочена — только открытая и с прошедшим дедлайном', () => {
    const data = withTasks([
      { title: 'вчера', deadline: '2026-10-09' },
      { title: 'сегодня', deadline: TODAY },
      { title: 'без срока' },
    ]);
    expect(data.tasks.map((task) => isTaskOverdue(task, TODAY))).toEqual([true, false, false]);
    const done = toggleTask(data, 't0', CREATED);
    expect(isTaskOverdue(done.tasks[0], TODAY)).toBe(false);
  });

  it('порядок: по дедлайну, при равном — по приоритету, без срока — в конце', () => {
    const data = withTasks([
      { title: 'без срока, высокий', priority: 'high' },
      { title: 'через неделю', deadline: '2026-10-17' },
      { title: 'сегодня, низкий', deadline: TODAY, priority: 'low' },
      { title: 'просрочена', deadline: '2026-10-01' },
      { title: 'сегодня, высокий', deadline: TODAY, priority: 'high' },
    ]);
    expect(openTasks(data).map((task) => task.title)).toEqual([
      'просрочена',
      'сегодня, высокий',
      'сегодня, низкий',
      'через неделю',
      'без срока, высокий',
    ]);
  });

  it('задачи цели и сделанные — последние сверху', () => {
    let data = withTasks([
      { title: 'a', goalId: 'g' },
      { title: 'b', goalId: 'g' },
      { title: 'c' },
    ]);
    expect(openTasks(data, 'g').map((task) => task.title)).toEqual(['a', 'b']);
    data = toggleTask(data, 't0', '2026-10-02T10:00:00.000Z');
    data = toggleTask(data, 't2', '2026-10-03T10:00:00.000Z');
    expect(doneTasks(data).map((task) => task.title)).toEqual(['c', 'a']);
    expect(doneTasks(data, 'g').map((task) => task.title)).toEqual(['a']);
  });
});

describe('дедлайны', () => {
  it('статус и подпись', () => {
    expect(deadlineStatus('2026-10-07', TODAY)).toBe('overdue');
    expect(describeDeadline('2026-10-07', TODAY)).toBe('просрочено на 3 дня');
    expect(describeDeadline('2026-10-09', TODAY)).toBe('просрочено на 1 день');
    expect(describeDeadline(TODAY, TODAY)).toBe('сегодня');
    expect(describeDeadline('2026-10-11', TODAY)).toBe('завтра');
    expect(describeDeadline('2026-10-15', TODAY)).toBe('через 5 дней');
    expect(describeDeadline('2026-12-31', TODAY)).toBe('до 31 декабря');
  });
});
