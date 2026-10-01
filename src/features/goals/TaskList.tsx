import { ChevronsUp, Target } from 'lucide-react';
import { useState } from 'react';
import { getGoal } from '../../domain/goals';
import type { AppData, DateKey, Task } from '../../domain/types';
import { CheckSquare } from '../../design/ui/CheckSquare';
import { cx } from '../../lib/cx';
import { useAppStore } from '../../store/useAppStore';
import { DeadlineText } from './DeadlineText';
import { TaskSheet } from './TaskSheet';

interface TaskListProps {
  tasks: Task[];
  data: AppData;
  today: DateKey;
  /** Показывать цель задачи. На странице цели не нужно. */
  showGoal?: boolean;
}

/**
 * Список задач: квадрат «сделано» и строка, по нажатию на которую
 * открывается правка задачи.
 */
export function TaskList({ tasks, data, today, showGoal = true }: TaskListProps) {
  const toggleTask = useAppStore((state) => state.toggleTask);
  const [editing, setEditing] = useState<Task | null>(null);

  return (
    <>
      <ul className="divide-y divide-gray-800">
        {tasks.map((task) => {
          const done = task.doneAt !== null;
          const goal = showGoal && task.goalId ? getGoal(data, task.goalId) : undefined;
          return (
            <li key={task.id} className="flex items-start gap-3 py-3">
              <CheckSquare
                checked={done}
                onToggle={() => toggleTask(task.id)}
                label={`Сделано: ${task.title}`}
              />
              <button
                type="button"
                onClick={() => setEditing(task)}
                className="min-w-0 flex-1 pt-2.5 text-left"
                aria-label={`Изменить задачу «${task.title}»`}
              >
                <span
                  className={cx(
                    'block text-base break-words',
                    done ? 'text-muted line-through' : 'text-text',
                  )}
                >
                  {task.title}
                </span>
                {(goal || (!done && (task.deadline || task.priority === 'high'))) && (
                  <span className="mt-1 flex flex-wrap gap-x-3 gap-y-1 text-sm text-muted">
                    {!done && task.deadline && (
                      <DeadlineText deadline={task.deadline} today={today} />
                    )}
                    {!done && task.priority === 'high' && (
                      <span className="inline-flex items-center gap-1 text-text">
                        <ChevronsUp size={14} strokeWidth={1.5} aria-hidden="true" />
                        важно
                      </span>
                    )}
                    {goal && (
                      <span className="inline-flex min-w-0 items-center gap-1">
                        <Target
                          size={14}
                          strokeWidth={1.5}
                          className="shrink-0"
                          aria-hidden="true"
                        />
                        <span className="truncate">{goal.title}</span>
                      </span>
                    )}
                  </span>
                )}
              </button>
            </li>
          );
        })}
      </ul>

      <TaskSheet
        open={editing !== null}
        task={editing}
        today={today}
        onClose={() => setEditing(null)}
      />
    </>
  );
}
