import { Link } from 'react-router';
import { habitPath } from '../../app/routes';
import { Check, X } from 'lucide-react';
import { cleanStreak, hasRelapseOn } from '../../domain/abstain';
import { weekStart } from '../../domain/dates';
import { describeSchedule, formatMinutes } from '../../domain/habits';
import { dailyTarget, getLog, habitStreak, weekProgress } from '../../domain/progress';
import { isWeeklyHabit } from '../../domain/schedule';
import type { AbstainHabit, AppData, DateKey, Habit } from '../../domain/types';

/** Привычки, у которых есть записи по дням (все, кроме отказа). */
type LoggedHabit = Exclude<Habit, AbstainHabit>;
import { Button } from '../../design/ui/Button';
import { CheckSquare } from '../../design/ui/CheckSquare';
import { HabitIcon } from '../../design/ui/HabitIcon';
import { Stepper } from '../../design/ui/Stepper';
import { cx } from '../../lib/cx';
import { plural } from '../../lib/plural';
import { useAppStore } from '../../store/useAppStore';

interface RowProps {
  habit: Habit;
  data: AppData;
  date: DateKey;
}

interface HabitCheckinRowProps extends RowProps {
  /** Открыт сегодняшний день — тогда есть кнопка «Тяга сейчас». */
  isToday: boolean;
  onCraving: (habit: AbstainHabit) => void;
  onRelapse: (habit: AbstainHabit) => void;
}

/** Строка привычки в чек-ине. Вид зависит от типа привычки. */
export function HabitCheckinRow({
  habit,
  data,
  date,
  isToday,
  onCraving,
  onRelapse,
}: HabitCheckinRowProps) {
  if (habit.kind === 'abstain') {
    return (
      <AbstainRow
        habit={habit}
        data={data}
        date={date}
        onCraving={isToday ? onCraving : null}
        onRelapse={onRelapse}
      />
    );
  }
  return <AmountRow habit={habit} data={data} date={date} />;
}

/** Иконка и название — ссылка на страницу привычки. */
function HabitTitle({ habit, detail }: { habit: Habit; detail: string }) {
  return (
    <Link to={habitPath(habit.id)} className="flex min-w-0 flex-1 items-center gap-3">
      <HabitIcon name={habit.icon} className="shrink-0 text-text" />
      <span className="min-w-0">
        <span className="block truncate text-base text-text">{habit.name}</span>
        <span className="block text-sm text-muted">{detail}</span>
      </span>
    </Link>
  );
}

const days = (n: number) => `${n} ${plural(n, 'день', 'дня', 'дней')}`;

/** Да/нет, количество, время: квадрат «сделано» и/или − число +. */
function AmountRow({ habit, data, date }: RowProps & { habit: LoggedHabit }) {
  const setHabitLog = useAppStore((state) => state.setHabitLog);
  const value = getLog(data.habitLogs, habit.id, date);
  const target = dailyTarget(habit);
  const done = target !== null && value >= target;
  const setValue = (next: number) => setHabitLog(habit.id, date, next);

  // Подпись: прогресс дня, недели или серия.
  let detail: string;
  if (isWeeklyHabit(habit)) {
    const week = weekProgress(habit, data.habitLogs, weekStart(date), date);
    detail =
      habit.kind === 'time' && habit.targetPeriod === 'week'
        ? `${formatMinutes(week.done)} из ${formatMinutes(week.target)} за неделю`
        : `${week.done} из ${week.target} на этой неделе`;
  } else if (habit.kind === 'count') {
    detail = `${value} из ${habit.dailyTarget} ${habit.unit}`;
  } else if (habit.kind === 'time') {
    detail = `${formatMinutes(value)} из ${formatMinutes(habit.targetMinutes)}`;
  } else {
    const streak = habitStreak(habit, data.habitLogs, date).current;
    detail = streak > 0 ? `Серия: ${days(streak)}` : describeSchedule(habit.schedule);
  }

  return (
    <li className="px-4 py-3">
      <div className="flex items-center gap-3">
        {target !== null ? (
          <CheckSquare
            checked={done}
            onToggle={() => setValue(done ? 0 : target)}
            label={`Выполнено: ${habit.name}`}
          />
        ) : (
          // У недельной цели по времени нет «сделано за день» — место оставляем для ровного списка.
          <span className="size-11 shrink-0" aria-hidden="true" />
        )}
        <HabitTitle habit={habit} detail={detail} />
      </div>
      {habit.kind !== 'check' && (
        <div className="mt-2 pl-14">
          <Stepper
            value={value}
            onChange={setValue}
            step={habit.kind === 'time' ? 5 : 1}
            label={`${habit.name}, ${habit.kind === 'time' ? 'минут' : habit.unit}`}
          />
        </div>
      )}
    </li>
  );
}

interface AbstainRowProps {
  habit: AbstainHabit;
  data: AppData;
  date: DateKey;
  /** null — открыт прошлый день, «тяга сейчас» не к месту. */
  onCraving: ((habit: AbstainHabit) => void) | null;
  onRelapse: (habit: AbstainHabit) => void;
}

/** Отказ: день чистый сам по себе. Кнопки — «Тяга» и «Срыв». */
function AbstainRow({ habit, data, date, onCraving, onRelapse }: AbstainRowProps) {
  const removeAbstainEvent = useAppStore((state) => state.removeAbstainEvent);
  const relapse = hasRelapseOn(data, habit.id, date);
  const streak = cleanStreak(habit, data, date).current;

  const undoRelapse = () => {
    data.abstainEvents
      .filter(
        (event) => event.habitId === habit.id && event.type === 'relapse' && event.date === date,
      )
      .forEach((event) => removeAbstainEvent(event.id));
  };

  return (
    <li className="px-4 py-3">
      <div className="flex items-center gap-3">
        <span
          role="img"
          aria-label={relapse ? 'Срыв' : 'Чистый день'}
          className={cx(
            'flex size-11 shrink-0 items-center justify-center rounded-md border',
            relapse ? 'border-danger text-danger-text' : 'border-gray-500 bg-gray-800 text-number',
          )}
        >
          {relapse ? (
            <X size={22} strokeWidth={2} aria-hidden="true" />
          ) : (
            <Check size={22} strokeWidth={2.5} aria-hidden="true" />
          )}
        </span>
        <HabitTitle
          habit={habit}
          detail={
            relapse
              ? 'Срыв записан'
              : streak > 0
                ? `${days(streak)} без срыва`
                : 'Отсчёт ещё не начался'
          }
        />
      </div>
      <div className="mt-2 flex gap-2 pl-14">
        {relapse ? (
          <Button variant="ghost" className="-ml-4" onClick={undoRelapse}>
            Отменить срыв
          </Button>
        ) : (
          <>
            {onCraving && <Button onClick={() => onCraving(habit)}>Тяга сейчас</Button>}
            <Button variant="danger" onClick={() => onRelapse(habit)}>
              Срыв
            </Button>
          </>
        )}
      </div>
    </li>
  );
}
