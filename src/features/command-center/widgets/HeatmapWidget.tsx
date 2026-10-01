import { getHabit } from '../../../domain/habits';
import { habitHeatmap } from '../../../domain/heatmap';
import { Heatmap } from '../../../design/ui/Heatmap';
import type { WidgetProps } from './WidgetFrame';

/** Вся арка одной привычки клетками. */
export function HeatmapWidget({ widget, data, arc, today }: WidgetProps) {
  const habit = widget.habitId ? getHabit(data, widget.habitId) : null;
  if (!habit || habit.archivedAt !== null) {
    return <p className="text-sm text-muted">Привычка убрана в архив. Убери и этот виджет.</p>;
  }

  const weeks = habitHeatmap(habit, data.habitLogs, arc.startDate, arc.endDate, today);
  const cells = weeks.flatMap((week) => week.days).filter((cell) => cell.value !== null);
  const done = cells.filter((cell) => (cell.value ?? 0) >= 1).length;

  return (
    <Heatmap
      weeks={weeks}
      today={today}
      label={`${habit.name}: цель выполнена в ${done} из ${cells.length} дней`}
    />
  );
}
