import { ChevronLeft, Plus } from 'lucide-react';
import { useId, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router';
import { PATHS } from '../../app/routes';
import { getActiveArc } from '../../domain/arc';
import { formatDayMonth, toDateKey } from '../../domain/dates';
import { draftFromGoal, getGoal, goalProgress } from '../../domain/goals';
import { doneTasks, openTasks } from '../../domain/tasks';
import { Button } from '../../design/ui/Button';
import { EmptyState } from '../../design/ui/EmptyState';
import { GlassCard } from '../../design/ui/GlassCard';
import { ProgressBar } from '../../design/ui/ProgressBar';
import { ScreenHeader } from '../../design/ui/ScreenHeader';
import { Sheet } from '../../design/ui/Sheet';
import { useToday } from '../../hooks/useToday';
import { useAppStore } from '../../store/useAppStore';
import { DeadlineText } from './DeadlineText';
import { GoalForm } from './GoalForm';
import { goalKindLabel, goalPercent, progressLabel } from './goalText';
import { NumericSection } from './NumericSection';
import { StepsSection } from './StepsSection';
import { TaskList } from './TaskList';
import { TaskSheet } from './TaskSheet';

/** Страница цели: прогресс, шаги или записи с прогнозом, задачи цели, правка и архив. */
export function GoalDetailScreen() {
  const { goalId = '' } = useParams();
  const id = useId();
  const today = useToday();
  const navigate = useNavigate();
  const data = useAppStore((state) => state.data);
  const updateGoal = useAppStore((state) => state.updateGoal);
  const archiveGoal = useAppStore((state) => state.archiveGoal);
  const [sheet, setSheet] = useState<'edit' | 'archive' | 'task' | null>(null);

  const goal = getGoal(data, goalId);
  const arc = getActiveArc(data);

  const backLink = (
    <Link
      to={PATHS.goals}
      className="on-snow -ml-1 mb-4 inline-flex items-center gap-1 text-sm text-muted hover:text-text"
    >
      <ChevronLeft size={18} strokeWidth={1.5} aria-hidden="true" />
      Цели
    </Link>
  );

  if (!goal || goal.archivedAt !== null) {
    return (
      <>
        {backLink}
        <EmptyState
          title="Цель не найдена"
          text="Возможно, она убрана в архив. Вернись к списку целей."
        />
      </>
    );
  }

  const tasks = [...openTasks(data, goal.id), ...doneTasks(data, goal.id)];

  const description = (
    <span className="flex flex-wrap gap-x-3 gap-y-1">
      <span>{goalKindLabel(goal)}</span>
      {goal.completedAt !== null ? (
        <span className="text-text">
          достигнута {formatDayMonth(toDateKey(new Date(goal.completedAt)))}
        </span>
      ) : (
        goal.deadline && <DeadlineText deadline={goal.deadline} today={today} />
      )}
    </span>
  );

  return (
    <>
      {backLink}
      <ScreenHeader title={goal.title} description={description} />

      <div className="flex flex-col gap-4">
        {goal.kind === 'steps' ? (
          <>
            <GlassCard as="section" aria-label="Прогресс" className="p-5">
              <div className="flex items-baseline justify-between gap-3">
                <p className="text-base text-text">{progressLabel(goal)}</p>
                <p className="shrink-0">
                  <span className="numeric text-2xl text-number">{goalPercent(goal)}</span>
                  <span className="numeric text-sm text-muted">%</span>
                </p>
              </div>
              <ProgressBar value={goalProgress(goal).ratio} label="Пройдено" className="mt-3" />
            </GlassCard>
            <StepsSection goal={goal} />
          </>
        ) : (
          <NumericSection goal={goal} today={today} />
        )}

        <GlassCard as="section" aria-labelledby={`${id}-tasks`} className="p-4">
          <div className="flex items-center justify-between gap-3">
            <h2 id={`${id}-tasks`} className="text-base text-text">
              Задачи
            </h2>
            <Button variant="ghost" className="-mr-3 h-9" onClick={() => setSheet('task')}>
              <Plus size={18} strokeWidth={1.5} aria-hidden="true" />
              Добавить
            </Button>
          </div>
          {tasks.length === 0 ? (
            <p className="mt-2 text-sm text-muted">
              Разбей цель на конкретные дела — они появятся и на вкладке «Задачи».
            </p>
          ) : (
            <TaskList tasks={tasks} data={data} today={today} showGoal={false} />
          )}
        </GlassCard>

        <div className="flex flex-wrap gap-3 pt-2">
          <Button onClick={() => setSheet('edit')}>Изменить</Button>
          <Button variant="ghost" onClick={() => setSheet('archive')}>
            Убрать в архив
          </Button>
        </div>
      </div>

      <Sheet open={sheet === 'edit'} onClose={() => setSheet(null)} title="Изменить цель">
        <GoalForm
          initial={draftFromGoal(goal)}
          submitLabel="Сохранить"
          editing
          today={today}
          arcEnd={arc?.endDate ?? null}
          onCancel={() => setSheet(null)}
          onSubmit={(draft) => {
            updateGoal(goal.id, draft);
            setSheet(null);
          }}
        />
      </Sheet>

      <Sheet open={sheet === 'archive'} onClose={() => setSheet(null)} title="Убрать в архив?">
        <p className="text-base text-text">
          «{goal.title}» пропадёт из списка целей. Задачи цели останутся.
        </p>
        <div className="mt-6 flex flex-col gap-2">
          <Button
            variant="primary"
            size="lg"
            onClick={() => {
              archiveGoal(goal.id);
              navigate(PATHS.goals);
            }}
          >
            Убрать в архив
          </Button>
          <Button variant="ghost" onClick={() => setSheet(null)}>
            Отмена
          </Button>
        </div>
      </Sheet>

      <TaskSheet
        open={sheet === 'task'}
        task={null}
        goalId={goal.id}
        today={today}
        onClose={() => setSheet(null)}
      />
    </>
  );
}
