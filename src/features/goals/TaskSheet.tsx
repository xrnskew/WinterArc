import { useState } from 'react';
import { activeGoals, getGoal } from '../../domain/goals';
import { draftFromTask, EMPTY_TASK_DRAFT } from '../../domain/tasks';
import type { DateKey, Id, Task } from '../../domain/types';
import { Button } from '../../design/ui/Button';
import { Sheet } from '../../design/ui/Sheet';
import { useAppStore } from '../../store/useAppStore';
import { TaskForm } from './TaskForm';

interface TaskSheetProps {
  open: boolean;
  /** null — новая задача. */
  task: Task | null;
  /** Цель, к которой сразу привязать новую задачу. */
  goalId?: Id;
  today: DateKey;
  onClose: () => void;
}

/** Шторка задачи: новая, правка или подтверждение удаления. */
export function TaskSheet({ open, task, goalId, today, onClose }: TaskSheetProps) {
  const data = useAppStore((state) => state.data);
  const addTask = useAppStore((state) => state.addTask);
  const updateTask = useAppStore((state) => state.updateTask);
  const deleteTask = useAppStore((state) => state.deleteTask);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const close = () => {
    setConfirmDelete(false);
    onClose();
  };

  // Цели для выбора — в работе; цель задачи оставляем, даже если она уже достигнута.
  const goals = activeGoals(data);
  const current = task?.goalId ? getGoal(data, task.goalId) : undefined;
  if (current && !goals.includes(current)) goals.push(current);

  const title = confirmDelete ? 'Удалить задачу?' : task ? 'Задача' : 'Новая задача';

  return (
    <Sheet open={open} onClose={close} title={title}>
      {task && confirmDelete ? (
        <>
          <p className="text-base text-text">«{task.title}» удалится насовсем.</p>
          <div className="mt-6 flex flex-col gap-2">
            <Button
              variant="primary"
              size="lg"
              onClick={() => {
                deleteTask(task.id);
                close();
              }}
            >
              Удалить
            </Button>
            <Button variant="ghost" onClick={() => setConfirmDelete(false)}>
              Отмена
            </Button>
          </div>
        </>
      ) : (
        <TaskForm
          initial={task ? draftFromTask(task) : { ...EMPTY_TASK_DRAFT, goalId: goalId ?? null }}
          submitLabel={task ? 'Сохранить' : 'Добавить задачу'}
          today={today}
          goals={goals}
          onCancel={close}
          onDelete={task ? () => setConfirmDelete(true) : undefined}
          onSubmit={(draft) => {
            if (task) updateTask(task.id, draft);
            else addTask(draft);
            close();
          }}
        />
      )}
    </Sheet>
  );
}
