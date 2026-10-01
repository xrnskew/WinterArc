import { CalendarRange, ChevronRight, Plus, SlidersHorizontal } from 'lucide-react';
import { Link } from 'react-router';
import { PATHS } from '../../app/routes';
import { useState } from 'react';
import { getActiveArc } from '../../domain/arc';
import { getGoal } from '../../domain/goals';
import { getHabit } from '../../domain/habits';
import { reviewDue } from '../../domain/weeklyReview';
import type { AppData, WidgetInstance } from '../../domain/types';
import { Button } from '../../design/ui/Button';
import { EmptyState } from '../../design/ui/EmptyState';
import { useFirstOpenToday } from '../../hooks/useFirstOpenToday';
import { useToday } from '../../hooks/useToday';
import { useAppStore } from '../../store/useAppStore';
import { AddWidgetSheet } from './AddWidgetSheet';
import { ArcHero } from './ArcHero';
import { WidgetFrame } from './widgets/WidgetFrame';
import { WIDGET_COMPONENTS } from './widgets/registry';

/** Заголовок виджета, привязанного к привычке, шкале или цели, — её название. */
function widgetTitle(widget: WidgetInstance, data: AppData): string | undefined {
  if (widget.habitId) return getHabit(data, widget.habitId)?.name;
  if (widget.scaleId) return data.ratingScales.find((scale) => scale.id === widget.scaleId)?.name;
  if (widget.goalId) return getGoal(data, widget.goalId)?.title;
  return undefined;
}

/**
 * Командный центр: сверху — арка (отсчёт, зарубки, прогресс),
 * ниже — виджеты, которые ты выбираешь и переставляешь сам.
 */
export function CommandCenterScreen() {
  const today = useToday();
  const firstOpen = useFirstOpenToday(today);
  const data = useAppStore((state) => state.data);
  const addWidget = useAppStore((state) => state.addWidget);
  const [editing, setEditing] = useState(false);
  const [adding, setAdding] = useState(false);
  const arc = getActiveArc(data);

  // AppShell показывает экраны только при текущей арке, но TypeScript об этом не знает.
  if (!arc) return null;

  const widgets = data.dashboard;
  const dueWeek = reviewDue(data, arc, today);

  return (
    <div className="flex flex-col gap-8">
      <ArcHero arc={arc} data={data} today={today} firstOpen={firstOpen} />

      {dueWeek && (
        <Link
          to={`${PATHS.review}?week=${dueWeek}`}
          className="glass -mb-4 flex items-center gap-3 rounded-lg p-4 transition-colors duration-(--wa-motion-fast) hover:border-gray-500"
        >
          <CalendarRange
            size={22}
            strokeWidth={1.5}
            className="shrink-0 text-text"
            aria-hidden="true"
          />
          <span className="min-w-0 flex-1">
            <span className="block text-base text-text">Подведи итоги недели</span>
            <span className="block text-sm text-muted">Три вопроса и автоматическая сводка</span>
          </span>
          <ChevronRight size={18} className="shrink-0 text-gray-400" aria-hidden="true" />
        </Link>
      )}

      <section aria-label="Виджеты">
        <div className="mb-3 flex items-center justify-end gap-2">
          {editing ? (
            <>
              <Button onClick={() => setAdding(true)}>
                <Plus size={18} strokeWidth={1.5} aria-hidden="true" />
                Добавить
              </Button>
              <Button variant="primary" onClick={() => setEditing(false)}>
                Готово
              </Button>
            </>
          ) : (
            <Button variant="ghost" onClick={() => setEditing(true)}>
              <SlidersHorizontal size={18} strokeWidth={1.5} aria-hidden="true" />
              Настроить
            </Button>
          )}
        </div>

        {widgets.length === 0 ? (
          <EmptyState
            title="Виджетов нет"
            text="Собери свой экран: индекс недели, серии привычек, оценки, цели и задачи."
            action={
              <Button variant="primary" onClick={() => setAdding(true)}>
                Добавить виджет
              </Button>
            }
          />
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {widgets.map((widget, i) => {
              const Widget = WIDGET_COMPONENTS[widget.type];
              return (
                <WidgetFrame
                  key={widget.id}
                  widget={widget}
                  title={widgetTitle(widget, data)}
                  editing={editing}
                  isFirst={i === 0}
                  isLast={i === widgets.length - 1}
                >
                  <Widget
                    widget={widget}
                    data={data}
                    arc={arc}
                    today={today}
                    firstOpen={firstOpen}
                  />
                </WidgetFrame>
              );
            })}
          </div>
        )}
      </section>

      <AddWidgetSheet
        open={adding}
        data={data}
        arc={arc}
        onClose={() => setAdding(false)}
        onAdd={addWidget}
      />
    </div>
  );
}
