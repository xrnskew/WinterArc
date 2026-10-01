import { ArrowDown, ArrowUp, Columns2, Square, X } from 'lucide-react';
import type { ReactNode } from 'react';
import { widgetInfo } from '../../../domain/dashboard';
import type { AppData, Arc, DateKey, WidgetInstance } from '../../../domain/types';
import { GlassCard } from '../../../design/ui/GlassCard';
import { cx } from '../../../lib/cx';
import { useAppStore } from '../../../store/useAppStore';

/** Что получает каждый виджет. */
export interface WidgetProps {
  widget: WidgetInstance;
  data: AppData;
  arc: Arc;
  today: DateKey;
  /** Первое открытие за день — цифры пересчитываются от нуля. */
  firstOpen: boolean;
}

interface WidgetFrameProps {
  widget: WidgetInstance;
  /** Заголовок; по умолчанию — название виджета из каталога. */
  title?: ReactNode;
  editing: boolean;
  isFirst: boolean;
  isLast: boolean;
  children: ReactNode;
}

const CONTROL =
  'flex size-9 items-center justify-center rounded-md text-muted transition-colors duration-(--wa-motion-fast) hover:bg-gray-800 hover:text-number disabled:pointer-events-none disabled:opacity-30';

/**
 * Рамка виджета: стекло, заголовок, а в режиме настройки — кнопки
 * «выше», «ниже», «узкий/широкий», «убрать».
 */
export function WidgetFrame({
  widget,
  title,
  editing,
  isFirst,
  isLast,
  children,
}: WidgetFrameProps) {
  const moveWidget = useAppStore((state) => state.moveWidget);
  const resizeWidget = useAppStore((state) => state.resizeWidget);
  const removeWidget = useAppStore((state) => state.removeWidget);
  const info = widgetInfo(widget.type);
  const half = widget.size === 'half';

  return (
    <GlassCard
      as="section"
      aria-label={info.title}
      className={cx(
        'flex min-w-0 flex-col p-4',
        // Телефон: сетка из двух колонок. Десктоп: ряды, где узкий виджет — доля 260px,
        // широкий — 520px; свободное место ряда делят соседи, поэтому ряд всегда заполнен.
        half ? 'lg:grow lg:basis-65' : 'col-span-2 lg:grow-2 lg:basis-130',
        editing && 'border-gray-500',
      )}
    >
      <h2 className="mb-3 truncate text-sm text-muted">{title ?? info.title}</h2>
      <div className="flex-1">{children}</div>

      {editing && (
        <div className="-mx-1 mt-3 flex items-center justify-between border-t border-gray-800 pt-2">
          <button
            type="button"
            className={CONTROL}
            onClick={() => moveWidget(widget.id, -1)}
            disabled={isFirst}
            aria-label="Выше"
          >
            <ArrowUp size={18} strokeWidth={1.5} aria-hidden="true" />
          </button>
          <button
            type="button"
            className={CONTROL}
            onClick={() => moveWidget(widget.id, 1)}
            disabled={isLast}
            aria-label="Ниже"
          >
            <ArrowDown size={18} strokeWidth={1.5} aria-hidden="true" />
          </button>
          {info.canBeHalf && (
            <button
              type="button"
              className={CONTROL}
              onClick={() => resizeWidget(widget.id, half ? 'full' : 'half')}
              aria-label={half ? 'Во всю ширину' : 'На пол-ширины'}
            >
              {half ? (
                <Square size={18} strokeWidth={1.5} aria-hidden="true" />
              ) : (
                <Columns2 size={18} strokeWidth={1.5} aria-hidden="true" />
              )}
            </button>
          )}
          <button
            type="button"
            className={CONTROL}
            onClick={() => removeWidget(widget.id)}
            aria-label={`Убрать виджет «${info.title}»`}
          >
            <X size={18} strokeWidth={1.5} aria-hidden="true" />
          </button>
        </div>
      )}
    </GlassCard>
  );
}
