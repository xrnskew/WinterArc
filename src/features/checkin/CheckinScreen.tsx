import { useState } from 'react';
import { Link } from 'react-router';
import { PATHS } from '../../app/routes';
import { getActiveArc } from '../../domain/arc';
import { daysBetween, formatDayMonth } from '../../domain/dates';
import { activeScales, getDayEntry } from '../../domain/days';
import { arcHabitsAll, dayScore, habitDayScore, toIndex } from '../../domain/discipline';
import { arcHabits } from '../../domain/habits';
import { dayRequirement, isHabitActiveOn } from '../../domain/schedule';
import type { AbstainHabit, DateKey } from '../../domain/types';
import { BigNumber } from '../../design/ui/BigNumber';
import { EmptyState } from '../../design/ui/EmptyState';
import { GlassCard } from '../../design/ui/GlassCard';
import { TextArea } from '../../design/ui/inputs';
import { RatingPicker } from '../../design/ui/RatingPicker';
import { ScreenHeader } from '../../design/ui/ScreenHeader';
import { useToday } from '../../hooks/useToday';
import { useAppStore } from '../../store/useAppStore';
import { AbstainDialogs, type AbstainDialog } from '../habits/abstain/AbstainDialogs';
import { DaySwitcher } from './DaySwitcher';
import { HabitCheckinRow } from './HabitCheckinRow';

/** Чек-ин: все привычки и оценки дня на одном экране. Всё сохраняется сразу. */
export function CheckinScreen() {
  const today = useToday();
  const data = useAppStore((state) => state.data);
  const setRating = useAppStore((state) => state.setRating);
  const setDayNote = useAppStore((state) => state.setDayNote);
  const arc = getActiveArc(data);
  // Выбранный день; null — «последний доступный» (обычно сегодня).
  const [pickedDate, setPickedDate] = useState<DateKey | null>(null);
  const [dialog, setDialog] = useState<AbstainDialog>(null);

  if (!arc) return null;

  if (daysBetween(today, arc.startDate) > 0) {
    return (
      <>
        <ScreenHeader title="Чек-ин" />
        <EmptyState
          title={`Арка начнётся ${formatDayMonth(arc.startDate)}`}
          text="Чек-ин откроется в первый день арки. Пока можно поправить привычки."
          action={
            <Link to={PATHS.habits} className="text-base text-text underline underline-offset-4">
              К привычкам
            </Link>
          }
        />
      </>
    );
  }

  // Открываются дни от начала арки до сегодня (или до конца арки, если она уже прошла).
  const lastDay = daysBetween(today, arc.endDate) < 0 ? arc.endDate : today;
  const date = pickedDate ?? lastDay;

  const habits = arcHabits(data, arc).filter((habit) => isHabitActiveOn(habit, date));
  const planned = habits.filter((habit) => dayRequirement(habit, date) !== 'off');
  const offPlan = habits.filter((habit) => dayRequirement(habit, date) === 'off');

  const required = planned.filter((habit) => dayRequirement(habit, date) === 'required');
  const doneCount = required.filter((habit) => habitDayScore(habit, data, date) === 1).length;
  const index = toIndex(dayScore(arcHabitsAll(data, arc), data, date));

  const entry = getDayEntry(data, date);
  const scales = activeScales(data);

  // Отказы открывают «Тягу сейчас» или «Срыв» для своей привычки.
  const openDialog = (kind: 'craving' | 'relapse') => (habit: AbstainHabit) =>
    setDialog({ kind, habit });
  const rowProps = {
    data,
    date,
    isToday: date === today,
    onCraving: openDialog('craving'),
    onRelapse: openDialog('relapse'),
  };

  return (
    <>
      <ScreenHeader title="Чек-ин" description="Отметки сохраняются сразу." />
      <DaySwitcher
        date={date}
        today={today}
        min={arc.startDate}
        max={lastDay}
        onChange={setPickedDate}
      />

      <div className="on-snow mt-4 mb-6 flex items-end justify-between gap-4">
        <div>
          <BigNumber value={index ?? 0} size="md" />
          <p className="text-sm text-muted">индекс дня</p>
        </div>
        {required.length > 0 && (
          <p className="text-right text-sm text-muted">
            <span className="numeric text-text">{doneCount}</span> из{' '}
            <span className="numeric text-text">{required.length}</span> по плану
          </p>
        )}
      </div>

      <div className="flex flex-col gap-6">
        {planned.length > 0 ? (
          <GlassCard as="section" aria-label="Привычки" className="p-0">
            <ul className="divide-y divide-gray-800">
              {planned.map((habit) => (
                <HabitCheckinRow key={habit.id} habit={habit} {...rowProps} />
              ))}
            </ul>
          </GlassCard>
        ) : (
          <EmptyState
            title="На этот день ничего не запланировано"
            text="Можно отдохнуть или добавить привычку."
            action={
              <Link to={PATHS.habits} className="text-base text-text underline underline-offset-4">
                К привычкам
              </Link>
            }
          />
        )}

        {offPlan.length > 0 && (
          <details className="group">
            <summary className="on-snow cursor-pointer text-sm text-muted hover:text-text">
              Не по плану в этот день: {offPlan.length}
            </summary>
            <GlassCard className="mt-2 p-0">
              <ul className="divide-y divide-gray-800">
                {offPlan.map((habit) => (
                  <HabitCheckinRow key={habit.id} habit={habit} {...rowProps} />
                ))}
              </ul>
            </GlassCard>
          </details>
        )}

        {scales.length > 0 && (
          <GlassCard as="section" className="flex flex-col gap-5 p-5">
            <h2 className="text-base text-text">Как прошёл день</h2>
            {scales.map((scale) => (
              <RatingPicker
                key={scale.id}
                label={scale.name}
                value={entry.ratings[scale.id] ?? null}
                onChange={(value) => setRating(date, scale.id, value)}
              />
            ))}
            <TextArea
              value={entry.note}
              onChange={(event) => setDayNote(date, event.target.value)}
              rows={3}
              aria-label="Заметка дня"
              placeholder="Заметка: что было важного?"
            />
          </GlassCard>
        )}
      </div>

      <AbstainDialogs dialog={dialog} date={date} today={today} onClose={() => setDialog(null)} />
    </>
  );
}
