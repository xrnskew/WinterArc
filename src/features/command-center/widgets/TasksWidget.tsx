import { Link } from 'react-router';
import { TASKS_PATH } from '../../../app/routes';
import { isTaskOverdue, openTasks } from '../../../domain/tasks';
import { plural } from '../../../lib/plural';
import { TaskList } from '../../goals/TaskList';
import type { WidgetProps } from './WidgetFrame';

/** Сколько задач показывать в виджете. */
const SHOWN = 4;

/** Ближайшие задачи: просроченные и с ближайшим сроком — первыми. Отмечать можно прямо здесь. */
export function TasksWidget({ data, today }: WidgetProps) {
  const open = openTasks(data);
  const overdue = open.filter((task) => isTaskOverdue(task, today)).length;

  if (open.length === 0) {
    return (
      <p className="text-sm text-muted">
        Открытых задач нет.{' '}
        <Link to={TASKS_PATH} className="text-text underline underline-offset-4">
          Добавить
        </Link>
      </p>
    );
  }

  return (
    <>
      <p className="text-sm text-muted">
        <span className="numeric text-2xl text-number">{open.length}</span>{' '}
        {plural(open.length, 'открытая', 'открытые', 'открытых')}
        {overdue > 0 && (
          <span className="text-danger-text">
            , {overdue} {plural(overdue, 'просрочена', 'просрочены', 'просрочено')}
          </span>
        )}
      </p>
      <div className="-mb-2">
        <TaskList tasks={open.slice(0, SHOWN)} data={data} today={today} />
      </div>
      <Link
        to={TASKS_PATH}
        className="mt-3 inline-block text-sm text-text underline underline-offset-4"
      >
        Все задачи
      </Link>
    </>
  );
}
