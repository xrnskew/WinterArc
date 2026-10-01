import { Plus } from 'lucide-react';
import { useState } from 'react';
import { useSearchParams } from 'react-router';
import { getActiveArc } from '../../domain/arc';
import { activeGoals, newGoalDraft, reachedGoals } from '../../domain/goals';
import { doneTasks, isTaskOverdue, openTasks } from '../../domain/tasks';
import { Button } from '../../design/ui/Button';
import { EmptyState } from '../../design/ui/EmptyState';
import { GlassCard } from '../../design/ui/GlassCard';
import { ScreenHeader } from '../../design/ui/ScreenHeader';
import { Segmented } from '../../design/ui/Segmented';
import { Sheet } from '../../design/ui/Sheet';
import { useToday } from '../../hooks/useToday';
import { plural } from '../../lib/plural';
import { useAppStore } from '../../store/useAppStore';
import { GoalCard } from './GoalCard';
import { GoalForm } from './GoalForm';
import { TaskList } from './TaskList';
import { TaskSheet } from './TaskSheet';

type Tab = 'goals' | 'tasks';

const TABS: { value: Tab; label: string }[] = [
  { value: 'goals', label: 'Цели' },
  { value: 'tasks', label: 'Задачи' },
];

/** Цели и задачи на двух вкладках. Вкладка — в адресе (?tab=tasks), чтобы на неё вела ссылка. */
export function GoalsScreen() {
  const today = useToday();
  const data = useAppStore((state) => state.data);
  const addGoal = useAppStore((state) => state.addGoal);
  const [params, setParams] = useSearchParams();
  const [adding, setAdding] = useState<Tab | null>(null);

  const tab: Tab = params.get('tab') === 'tasks' ? 'tasks' : 'goals';
  const arc = getActiveArc(data);
  const goals = activeGoals(data);
  const reached = reachedGoals(data);
  const open = openTasks(data);
  const done = doneTasks(data);
  const overdue = open.filter((task) => isTaskOverdue(task, today)).length;

  const description =
    tab === 'goals' ? (
      `${goals.length} ${plural(goals.length, 'цель', 'цели', 'целей')} в работе`
    ) : (
      <>
        {open.length} {plural(open.length, 'открытая', 'открытые', 'открытых')}
        {overdue > 0 && (
          <>
            ,{' '}
            <span className="text-danger-text">
              {overdue} {plural(overdue, 'просрочена', 'просрочены', 'просрочено')}
            </span>
          </>
        )}
      </>
    );

  return (
    <>
      <ScreenHeader
        title="Цели"
        description={description}
        action={
          <Button
            onClick={() => setAdding(tab)}
            aria-label={tab === 'goals' ? 'Добавить цель' : 'Добавить задачу'}
          >
            <Plus size={18} strokeWidth={1.5} aria-hidden="true" />
            Добавить
          </Button>
        }
      />

      <div className="mb-5">
        <Segmented
          label="Что показать"
          value={tab}
          onChange={(next) =>
            setParams(next === 'tasks' ? { tab: 'tasks' } : {}, { replace: true })
          }
          options={TABS}
        />
      </div>

      {tab === 'goals' ? (
        <div className="flex flex-col gap-3">
          {goals.length === 0 ? (
            <EmptyState
              title="Целей пока нет"
              text="Цель — то, к чему идёшь за арку: по шагам (сдать на права) или числом (накопить 50 000 ₽)."
              action={
                <Button variant="primary" onClick={() => setAdding('goals')}>
                  Добавить цель
                </Button>
              }
            />
          ) : (
            goals.map((goal) => <GoalCard key={goal.id} goal={goal} today={today} />)
          )}

          {reached.length > 0 && (
            <details className="group mt-3">
              <summary className="on-snow cursor-pointer py-2 text-sm text-muted hover:text-text">
                Достигнутые: <span className="numeric">{reached.length}</span>
              </summary>
              <div className="mt-2 flex flex-col gap-3">
                {reached.map((goal) => (
                  <GoalCard key={goal.id} goal={goal} today={today} />
                ))}
              </div>
            </details>
          )}
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {open.length === 0 ? (
            <EmptyState
              title={done.length > 0 ? 'Всё сделано' : 'Задач пока нет'}
              text="Задача — одно конкретное дело. Её можно привязать к цели и дать ей срок."
              action={
                <Button variant="primary" onClick={() => setAdding('tasks')}>
                  Добавить задачу
                </Button>
              }
            />
          ) : (
            <GlassCard as="section" aria-label="Открытые задачи" className="px-4 py-1">
              <TaskList tasks={open} data={data} today={today} />
            </GlassCard>
          )}

          {done.length > 0 && (
            <details className="mt-3">
              <summary className="on-snow cursor-pointer py-2 text-sm text-muted hover:text-text">
                Сделано: <span className="numeric">{done.length}</span>
              </summary>
              <GlassCard className="mt-2 px-4 py-1">
                <TaskList tasks={done} data={data} today={today} />
              </GlassCard>
            </details>
          )}
        </div>
      )}

      <Sheet open={adding === 'goals'} onClose={() => setAdding(null)} title="Новая цель">
        <GoalForm
          initial={newGoalDraft(arc?.endDate ?? null)}
          submitLabel="Добавить цель"
          today={today}
          arcEnd={arc?.endDate ?? null}
          onCancel={() => setAdding(null)}
          onSubmit={(draft) => {
            addGoal(draft);
            setAdding(null);
          }}
        />
      </Sheet>

      <TaskSheet
        open={adding === 'tasks'}
        task={null}
        today={today}
        onClose={() => setAdding(null)}
      />
    </>
  );
}
