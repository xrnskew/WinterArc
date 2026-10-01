import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useState } from 'react';
import { WIDGET_CATALOG, type WidgetInfo, type WidgetTarget } from '../../domain/dashboard';
import { activeScales } from '../../domain/days';
import { activeGoals } from '../../domain/goals';
import { arcHabits } from '../../domain/habits';
import type { AppData, Arc, WidgetInstance, WidgetType } from '../../domain/types';
import { HabitIcon } from '../../design/ui/HabitIcon';
import { Sheet } from '../../design/ui/Sheet';

interface AddWidgetSheetProps {
  open: boolean;
  data: AppData;
  arc: Arc;
  onClose: () => void;
  onAdd: (type: WidgetType, target: Pick<WidgetInstance, 'habitId' | 'scaleId' | 'goalId'>) => void;
}

/** Вариант выбора на втором шаге: привычка, шкала или цель. */
interface TargetOption {
  id: string;
  name: string;
  icon: Parameters<typeof HabitIcon>[0]['name'];
}

/** Подписи второго шага и поле виджета, куда записать выбор. */
const TARGET_TEXT: Record<
  NonNullable<WidgetTarget>,
  { question: string; empty: string; key: 'habitId' | 'scaleId' | 'goalId' }
> = {
  habit: { question: 'Для какой привычки?', empty: 'Привычек в арке пока нет.', key: 'habitId' },
  scale: { question: 'Для какой оценки?', empty: 'Шкал оценок нет.', key: 'scaleId' },
  goal: {
    question: 'Для какой цели?',
    empty: 'Целей пока нет — добавь их на экране «Цели».',
    key: 'goalId',
  },
};

/** Из чего выбирать на втором шаге. */
function targetOptions(target: WidgetTarget, data: AppData, arc: Arc): TargetOption[] {
  switch (target) {
    case 'habit':
      return arcHabits(data, arc).map((habit) => ({
        id: habit.id,
        name: habit.name,
        icon: habit.icon,
      }));
    case 'scale':
      return activeScales(data).map((scale) => ({
        id: scale.id,
        name: scale.name,
        icon: scale.icon,
      }));
    case 'goal':
      return activeGoals(data).map((goal) => ({ id: goal.id, name: goal.title, icon: 'target' }));
    default:
      return [];
  }
}

const ROW =
  'flex w-full items-center gap-3 rounded-md px-3 py-3 text-left transition-colors duration-(--wa-motion-fast) hover:bg-gray-800';

/**
 * Добавить виджет: сначала выбрать вид, потом — если виджет про одну
 * привычку или шкалу — выбрать, про какую.
 */
export function AddWidgetSheet({ open, data, arc, onClose, onAdd }: AddWidgetSheetProps) {
  const [picked, setPicked] = useState<WidgetInfo | null>(null);

  const close = () => {
    setPicked(null);
    onClose();
  };

  const targets = targetOptions(picked?.target ?? null, data, arc);

  const choose = (info: WidgetInfo) => {
    if (info.target === null) {
      onAdd(info.type, {});
      close();
    } else {
      setPicked(info);
    }
  };

  const chooseTarget = (id: string) => {
    if (!picked) return;
    const key = TARGET_TEXT[picked.target!].key;
    onAdd(picked.type, { [key]: id });
    close();
  };

  return (
    <Sheet open={open} onClose={close} title={picked ? picked.title : 'Добавить виджет'}>
      {picked ? (
        <>
          <button
            type="button"
            onClick={() => setPicked(null)}
            className="-ml-1 mb-3 inline-flex items-center gap-1 text-sm text-muted hover:text-text"
          >
            <ChevronLeft size={18} strokeWidth={1.5} aria-hidden="true" />
            Все виджеты
          </button>
          <p className="mb-2 text-sm text-muted">{TARGET_TEXT[picked.target!].question}</p>
          {targets.length === 0 ? (
            <p className="text-base text-text">{TARGET_TEXT[picked.target!].empty}</p>
          ) : (
            <ul>
              {targets.map((target) => (
                <li key={target.id}>
                  <button type="button" className={ROW} onClick={() => chooseTarget(target.id)}>
                    <HabitIcon name={target.icon} className="shrink-0 text-text" />
                    <span className="flex-1 text-base text-text">{target.name}</span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </>
      ) : (
        <ul>
          {WIDGET_CATALOG.map((info) => (
            <li key={info.type}>
              <button type="button" className={ROW} onClick={() => choose(info)}>
                <span className="min-w-0 flex-1">
                  <span className="block text-base text-text">{info.title}</span>
                  <span className="block text-sm text-muted">{info.description}</span>
                </span>
                {info.target !== null && (
                  <ChevronRight size={18} className="shrink-0 text-gray-400" aria-hidden="true" />
                )}
              </button>
            </li>
          ))}
        </ul>
      )}
    </Sheet>
  );
}
