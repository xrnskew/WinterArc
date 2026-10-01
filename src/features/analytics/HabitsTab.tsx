import { Link } from 'react-router';
import { habitPath } from '../../app/routes';
import { habitArcRate, type HabitRate } from '../../domain/analytics';
import { arcHabits } from '../../domain/habits';
import { habitHeatmap } from '../../domain/heatmap';
import type { AppData, Arc, DateKey } from '../../domain/types';
import { EmptyState } from '../../design/ui/EmptyState';
import { GlassCard } from '../../design/ui/GlassCard';
import { HabitIcon } from '../../design/ui/HabitIcon';
import { Heatmap } from '../../design/ui/Heatmap';
import { plural } from '../../lib/plural';

interface HabitsTabProps {
  data: AppData;
  arc: Arc;
  today: DateKey;
}

/** "в 34 из 40 дней по плану", "4 из 6 недель". */
function rateText(rate: HabitRate): string {
  return rate.unit === 'day'
    ? `в ${rate.done} из ${rate.total} ${plural(rate.total, 'дня', 'дней', 'дней')} по плану`
    : `${rate.done} из ${rate.total} ${plural(rate.total, 'недели', 'недель', 'недель')}`;
}

/** Каждая привычка: как часто выполнялась и тепловая карта всей арки. */
export function HabitsTab({ data, arc, today }: HabitsTabProps) {
  const habits = arcHabits(data, arc);
  if (habits.length === 0) {
    return <EmptyState title="Привычек нет" text="Добавь привычки — здесь появятся их карты." />;
  }

  return (
    // На широком экране — карты привычек в две колонки.
    <div className="grid gap-4 xl:grid-cols-2">
      {habits.map((habit) => {
        const rate = habitArcRate(habit, data, arc, today);
        const percent = rate.total > 0 ? Math.round((rate.done / rate.total) * 100) : null;
        return (
          <GlassCard key={habit.id} as="section" aria-label={habit.name} className="p-4">
            <div className="mb-3 flex items-start justify-between gap-3">
              <Link to={habitPath(habit.id)} className="flex min-w-0 items-center gap-2.5">
                <HabitIcon name={habit.icon} className="shrink-0 text-text" />
                <span className="min-w-0">
                  <span className="block truncate text-base text-text">{habit.name}</span>
                  <span className="block text-sm text-muted">Цель выполнена {rateText(rate)}</span>
                </span>
              </Link>
              {percent !== null && (
                <span className="shrink-0">
                  <span className="numeric text-2xl text-number">{percent}</span>
                  <span className="numeric text-sm text-muted">%</span>
                </span>
              )}
            </div>
            <Heatmap
              weeks={habitHeatmap(habit, data.habitLogs, arc.startDate, arc.endDate, today)}
              today={today}
              label={`${habit.name}: цель выполнена ${rateText(rate)}`}
            />
          </GlassCard>
        );
      })}
    </div>
  );
}
